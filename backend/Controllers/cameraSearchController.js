import database from "../database/db.js";
import { parseImage } from "../utils/aiHelper.js";
import { processMultiObjectImage } from "../utils/visionPipeline.js";
import fs from "fs-extra";

export const handleCameraSearch = async (req, res, next) => {
  try {
    let imageFile = req.files?.image;
    
    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    console.log(`📸 Multi-Object Camera Search Triggered: ${imageFile.name}`);

    const fileBuffer = await fs.readFile(imageFile.tempFilePath);
    const base64Data = fileBuffer.toString("base64");

    console.log("⚙️ Processing Image via Vision Pipeline...");
    
    // Run Gemini and Multi-Object Pipeline in parallel
    const [aiMetadata, multiObjects] = await Promise.all([
      parseImage(base64Data, imageFile.mimetype).catch(() => ({ category: null, keywords: [], brands: [], ocrText: "" })),
      processMultiObjectImage(imageFile.tempFilePath).catch(() => [])
    ]);

    console.log("🧠 AI Global Metadata Extracted:", JSON.stringify(aiMetadata));
    
    // Prepare Global Keyword/Brand Search Conditions
    const searchTerms = [...(aiMetadata.keywords || []), ...(aiMetadata.brands || [])];
    if (aiMetadata.ocrText) {
      searchTerms.push(...aiMetadata.ocrText.split(/\s+/).filter(w => w.length > 2));
    }
    
    const globalKeywordConditions = [];
    const globalValues = [];
    let globalIndex = 1;

    // Self-Learning Personalization JOIN logic
    const personalizationJoin = `
      LEFT JOIN product_stats ps ON p.id = ps.product_id
    `;
    // We add 5 points for every visual click it has received in the past
    const learningScore = `COALESCE(ps.visual_search_clicks, 0) * 5`;

    if (searchTerms.length > 0) {
      searchTerms.forEach(term => {
        const cleanTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanTerm.length < 3) return;
        globalKeywordConditions.push(`(p.name ILIKE $${globalIndex} OR p.description ILIKE $${globalIndex})`);
        globalValues.push(`%${cleanTerm}%`);
        globalIndex++;
      });
    }

    const objectResults = [];

    // Run searches for each distinct object
    for (const obj of multiObjects) {
      const conditions = ['p.embedding IS NOT NULL'];
      const values = [...globalValues];
      let index = globalIndex;
      let keywordSelect = `, 0 as keyword_score`;
      let categorySelect = `, 0 as category_score`;
      let vectorSelect = `, 0 as vector_score`;

      if (aiMetadata.category) {
        categorySelect = `, (CASE WHEN p.category = $${index} THEN 15 ELSE 0 END) as category_score`;
        values.push(aiMetadata.category);
        index++;
      }

      if (globalKeywordConditions.length > 0) {
        // Only use the first 3 keyword conditions as a loose boost for performance
        const activeKeywords = globalKeywordConditions.slice(0, 3);
        if (activeKeywords.length > 0) {
           // Give a static 10 points if any keyword matches
           keywordSelect = `, (CASE WHEN (${activeKeywords.join(" OR ")}) THEN 10 ELSE 0 END) as keyword_score`;
        }
      }

      if (obj.embedding && obj.embedding.length > 0) {
        const embeddingStr = `ARRAY[${obj.embedding.join(",")}]::real[]`;
        vectorSelect = `, COALESCE(cosine_similarity(p.embedding, ${embeddingStr}), 0) * 100 as vector_score`;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const queryStr = `
        WITH ranked_products AS (
          SELECT 
            p.*,
            COALESCE(ps.visual_search_clicks, 0) as past_clicks
            ${keywordSelect}
            ${categorySelect}
            ${vectorSelect}
          FROM products p
          ${personalizationJoin}
          ${whereClause}
        )
        SELECT * FROM ranked_products
        ORDER BY (vector_score + keyword_score + category_score + past_clicks * 5) DESC
        LIMIT 10
      `;

      try {
        const resDb = await database.query(queryStr, values);
        const products = resDb.rows.map(p => {
          let rawScore = (p.vector_score || 0) + (p.keyword_score || 0) + (p.category_score || 0) + (p.past_clicks * 5);
          let matchPercentage = Math.min(99, Math.max(50, Math.round(rawScore))); 
          return { ...p, matchPercentage, embedding: undefined };
        });

        objectResults.push({
          label: obj.label,
          box: obj.box,
          products
        });
      } catch (err) {
        console.error(`DB Query failed for object ${obj.label}:`, err.message);
      }
    }

    res.status(200).json({
      success: true,
      aiAnalysis: aiMetadata,
      multiObjects: objectResults
    });

  } catch (error) {
    console.error("❌ Multi-Object Camera Search Error:", error);
    res.status(500).json({ success: false, message: "An error occurred", error: error.message });
  }
};

