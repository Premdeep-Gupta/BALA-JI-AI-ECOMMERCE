export async function getAIRecommendation(userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;

  const URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const trimmedProducts = products.slice(0, 20);

    // ===============================
    // 🔥 SAFE PROMPT (ANTI-INJECTION)
    // ===============================
    const safePrompt = String(userPrompt)
      .replace(/```/g, "")
      .slice(0, 300);

    const geminiPrompt = `
You are an advanced e-commerce ranking system.

IMPORTANT RULES:
- Return ONLY JSON array
- No explanation
- No markdown
- Keep structure same

USER REQUEST:
${safePrompt}

PRODUCTS:
${JSON.stringify(trimmedProducts)}

OUTPUT FORMAT:
[
  {
    "id": number,
    "name": string,
    "price": number,
    "category": string,
    "ratings": number,
    "finalScore": number
  }
]
`;

    // ===============================
    // 🔥 GEMINI CALL
    // ===============================
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
      }),
    });

    const data = await response.json();

    let text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ===============================
    // 🔥 CLEAN AI RESPONSE (IMPORTANT FIX)
    // ===============================
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.log("AI JSON Parse Error:", err.message);

      // ===============================
      // 🔥 FALLBACK (NO BREAK SYSTEM)
      // ===============================
      return {
        success: false,
        products: products.map(p => ({
          ...p,
          finalScore: (p.ratings || 0) * 10
        })),
      };
    }

    // ===============================
    // 🔥 VALIDATION
    // ===============================
    if (!Array.isArray(parsed)) {
      return {
        success: false,
        products: products,
      };
    }

    // ===============================
    // 🔥 SAFETY NORMALIZATION
    // ===============================
    const safeProducts = parsed.map(p => ({
      id: p.id || null,
      name: p.name || "Unknown",
      price: Number(p.price) || 0,
      category: p.category || "general",
      ratings: Number(p.ratings) || 0,
      finalScore: Number(p.finalScore) || 0,
    }));

    return {
      success: true,
      products: safeProducts,
    };

  } catch (error) {
    console.log("AI ERROR:", error.message);

    return {
      success: false,
      products,
    };
  }
}