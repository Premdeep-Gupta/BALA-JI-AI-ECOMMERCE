import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import database from "../database/db.js";
import { getAIRecommendation } from "../utils/getAIRecommendation.js";
import fs from "fs-extra";
import { parseSearchQuery, parseImage, parseImageFallback, parseSearchQueryLocally } from "../utils/aiHelper.js";

const PRODUCT_SELECT_FIELDS = "p.id, p.name, p.description, p.price, p.category, p.ratings, p.images, p.stock, p.created_by, p.created_at, p.discount_percentage, p.original_price, p.offer_type, p.sub_category, p.video, p.item_link";

// 🔥 SOLID FIXED ENGINE: Compatible with express-fileupload
export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, category, sub_category, stock } = req.body;
  const created_by = req.user?.id; 

  if (!name || !description || !price || !category || !stock) {
    return next(
      new ErrorHandler("Please provide complete product details.", 400)
    );
  }

  // 🛡️ FIX: express-fileupload uses req.files.images
  if (!req.files || !req.files.images) {
    return next(new ErrorHandler("Please upload at least one image.", 400));
  }

  const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  let uploadedImages = [];

  for (const file of images) {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Ecommerce_Product_Images",
      resource_type: "image"
    });

    uploadedImages.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    await fs.remove(file.tempFilePath); // Cleanup temp file
  }

  const numPrice = parseFloat(price);
  const numOriginalPrice = req.body.original_price ? parseFloat(req.body.original_price) : parseFloat((numPrice * 1.25).toFixed(2));
  const calculatedDiscount = numOriginalPrice > numPrice ? Math.floor(((numOriginalPrice - numPrice) / numOriginalPrice) * 100) : 0;
  const offerType = req.body.offer_type || "HOTDEAL";

  const product = await database.query(
    `INSERT INTO products (name, description, price, category, sub_category, stock, images, created_by, original_price, discount_percentage, offer_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      name,
      description,
      numPrice,
      category,
      sub_category || "",
      stock,
      JSON.stringify(uploadedImages),
      created_by,
      numOriginalPrice,
      calculatedDiscount,
      offerType
    ]
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: product.rows[0],
  });
});

export const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { availability, price, category, sub_category, ratings, search, offer_type, brand, gender, color, size, discount, occasion, unsold } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  let values = [];
  let index = 1;

  if (unsold === "true") {
    conditions.push(`p.id NOT IN (SELECT DISTINCT product_id FROM order_items WHERE created_at >= NOW() - INTERVAL '6 months')`);
  }


  let paginationPlaceholders = {};

  if (availability === "in-stock") {
    conditions.push(`p.stock > 5`);
  } else if (availability === "limited") {
    conditions.push(`p.stock > 0 AND p.stock <= 5`);
  } else if (availability === "out-of-stock") {
    conditions.push(`p.stock = 0`);
  } else if (availability === "alerts") {
    conditions.push(`p.stock <= 10`);
  }

  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`p.price BETWEEN $${index} AND $${index + 1}`);
      values.push(parseFloat(minPrice), parseFloat(maxPrice));
      index += 2;
    }
  }

  // Determine category and keywords if searched
  let searchCategory = null;
  let searchKeywords = [];

  if (search) {
    const parsed = await parseSearchQuery(search);
    if (parsed.category) {
      searchCategory = parsed.category;
    }
    searchKeywords = parsed.keywords;
  }

  // Explicit user-selected category filter (from dropdown/sidebar)
  if (category) {
    conditions.push(`p.category ILIKE $${index}`);
    values.push(`%${category}%`);
    index++;
  }

  // Mobile specific brand & subcategory mapping to avoid other brand bleed
  const isMobileCat = category && (category.toLowerCase() === "mobiles" || category.toLowerCase().includes("mobile"));

  if (isMobileCat) {
    if (sub_category) {
      const sLower = sub_category.toLowerCase();
      if (sLower === "iphone" || sLower === "apple") {
        conditions.push(`(p.sub_category ILIKE $${index} OR p.sub_category ILIKE $${index + 1} OR p.name ILIKE $${index + 2})`);
        values.push(`%iphone%`, `%apple%`, `%iphone%`);
        index += 3;
      } else {
        conditions.push(`p.sub_category ILIKE $${index}`);
        values.push(`%${sub_category}%`);
        index++;
      }
    }
    if (brand) {
      const bLower = brand.toLowerCase();
      if (bLower === "apple" || bLower === "iphone") {
        conditions.push(`(p.sub_category ILIKE $${index} OR p.name ILIKE $${index + 1})`);
        values.push(`%iphone%`, `%Apple%`);
        index += 2;
      } else {
        conditions.push(`(p.sub_category ILIKE $${index} OR p.name ILIKE $${index} OR p.description ILIKE $${index})`);
        values.push(`%${brand}%`);
        index++;
      }
    }
  } else {
    // Explicit sub-category filter (from subcategory chip clicks)
    if (sub_category) {
      const sLower = sub_category.toLowerCase();
      if (sLower === "iphone" || sLower === "apple") {
        conditions.push(`(p.sub_category ILIKE $${index} OR p.sub_category ILIKE $${index + 1} OR p.name ILIKE $${index + 2})`);
        values.push(`%iphone%`, `%apple%`, `%iphone%`);
        index += 3;
      } else {
        const getSubcategorySynonyms = (sub) => {
          const s = sub.toLowerCase().trim();
          const synonyms = [s];
          const cleaned = s.replace(/\s+/g, "");
          if (cleaned !== s) synonyms.push(cleaned);
          const singular = cleaned.endsWith("s") ? cleaned.slice(0, -1) : cleaned;
          if (singular !== cleaned && singular !== s) synonyms.push(singular);
          if (s.includes("shoes") || s.includes("shoe") || s === "sneaker" || s === "slippers" || s === "heels" || s === "clogs" || s === "casual shoes") {
            synonyms.push("shoe", "shoes", "boot", "sneaker", "sandal", "slipper", "clog", "heel", "flat", "footwear", "oxford", "loafers", "flip flop");
          }
          if (s === "trackpants" || s === "jogger" || s === "sweatpants") {
            synonyms.push("trackpant", "trackpants", "pant", "pants", "jogger", "joggers", "tracksuit", "tracksuits", "sweatpants", "sweatshirt", "sweatsuit", "trouser", "trousers");
          }
          if (s.includes("kurta") || s.includes("saree") || s.includes("kurti") || s === "dress" || s === "dresses") {
            synonyms.push("dress", "dresses", "tunic", "tunics", "gown", "gowns", "suit", "suits", "skirt", "kurtas", "sari", "sarees", "clothing", "apparel", "top", "robe");
          }
          if (s === "kids" || s.includes("child")) {
            synonyms.push("kid", "kids", "child", "children", "baby", "infant", "toddler", "girls", "boys", "youth");
          }
          if (s === "briefs" || s === "underwear" || s === "lingerie") {
            synonyms.push("briefs", "brief", "boxer", "boxers", "underwear", "lingerie", "bra", "panties", "panty", "undershirt");
          }
          if (s === "nightsuits" || s === "sleepwear" || s === "loungewear") {
            synonyms.push("nightsuits", "nightgown", "sleepwear", "loungewear", "pajama", "pyjama", "nightdress", "t-string", "chemise");
          }
          if (s === "shirt" || s === "shirts" || s === "tees" || s === "top" || s === "tops") {
            synonyms.push("shirt", "shirts", "tee", "tees", "tshirt", "tshirts", "top", "tops", "blouse", "camisole", "pullover", "sweatshirt");
          }
          if (s === "jeans" || s === "denim") {
            synonyms.push("jeans", "jean", "denim", "pants", "trousers");
          }
          return [...new Set(synonyms)];
        };

        const synonyms = getSubcategorySynonyms(sub_category);
        const subConditions = [];
        synonyms.forEach(syn => {
          subConditions.push(`p.sub_category ILIKE $${index} OR REPLACE(p.name, ' ', '') ILIKE $${index + 1}`);
          values.push(`%${syn}%`, `%${syn}%`);
          index += 2;
        });
        conditions.push(`(${subConditions.join(" OR ")})`);
      }
    }
    if (brand) {
      conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
      values.push(`%${brand}%`);
      index++;
    }
  }

  // Explicit offer_type filter
  if (offer_type) {
    conditions.push(`p.offer_type = $${index}`);
    values.push(offer_type);
    index++;
  }

  if (ratings) {
    conditions.push(`p.ratings >= $${index}`);
    values.push(parseFloat(ratings));
    index++;
  }

  if (occasion) {
    conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
    values.push(`%${occasion}%`);
    index++;
  }

  if (gender) {
    conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index} OR p.category ILIKE $${index})`);
    values.push(`%${gender}%`);
    index++;
  }

  if (color) {
    conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
    values.push(`%${color}%`);
    index++;
  }

  if (size) {
    conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
    values.push(`%${size}%`);
    index++;
  }

  if (discount) {
    conditions.push(`p.discount_percentage >= $${index}`);
    values.push(parseInt(discount));
    index++;
  }

  let relevanceSelect = "";
  let whereParamsCount = values.length;

  if (searchKeywords.length > 0) {
    const keywordConditions = [];
    searchKeywords.forEach(kw => {
      keywordConditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
      values.push(`%${kw}%`);
      index++;
    });
    conditions.push(`(${keywordConditions.join(" OR ")})`);
    whereParamsCount = values.length;

    const scores = [];
    
    // Add relevance boost if product belongs to the AI parsed category
    if (searchCategory) {
      scores.push(`(CASE WHEN p.category ILIKE $${index} THEN 15 ELSE 0 END)`);
      values.push(`%${searchCategory}%`);
      index++;
    }

    searchKeywords.forEach(kw => {
      scores.push(`(CASE WHEN p.name ILIKE $${index} THEN 10 ELSE 0 END)`);
      values.push(`%${kw}%`);
      index++;
      scores.push(`(CASE WHEN p.description ILIKE $${index} THEN 2 ELSE 0 END)`);
      values.push(`%${kw}%`);
      index++;
    });
    relevanceSelect = `, (${scores.join(" + ")}) as relevance_score`;
  } else {
    relevanceSelect = `, 0 as relevance_score`;
    whereParamsCount = values.length;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values.slice(0, whereParamsCount)
  );

  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  paginationPlaceholders.limit = `$${index}`;
  values.push(limit);
  index++;

  paginationPlaceholders.offset = `$${index}`;
  values.push(offset);
  index++;

  const query = `
    SELECT ${PRODUCT_SELECT_FIELDS}, 
    COUNT(r.id) AS review_count 
    ${relevanceSelect}
    FROM products p 
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY relevance_score DESC, p.created_at DESC
    LIMIT ${paginationPlaceholders.limit}
    OFFSET ${paginationPlaceholders.offset}
    `;

  const result = await database.query(query, values);

  const newProductsQuery = `
    SELECT ${PRODUCT_SELECT_FIELDS},
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8
  `;
  const newProductsResult = await database.query(newProductsQuery);

  const topRatedQuery = `
    SELECT ${PRODUCT_SELECT_FIELDS},
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.ratings DESC, p.created_at DESC
    LIMIT 8
  `;
  const topRatedResult = await database.query(topRatedQuery);

  res.status(200).json({
    success: true,
    products: result.rows,
    totalProducts,
    newProducts: newProductsResult.rows,
    topRatedProducts: topRatedResult.rows,
  });
});

export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params; 
  const { name, description, price, category, sub_category, stock, images: textImages } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return next(new ErrorHandler("Please provide complete product details.", 400));
  }

  const productCheck = await database.query("SELECT * FROM products WHERE id = $1", [productId]);
  if (productCheck.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  let updatedImages = [];

  // 🛡️ FIX: express-fileupload update handling
  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    for (const file of images) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: "Ecommerce_Product_Images", resource_type: "image" });
      updatedImages.push({ url: result.secure_url, public_id: result.public_id });
      await fs.remove(file.tempFilePath);
    }
  } else if (textImages) {
    try {
      updatedImages = JSON.parse(textImages);
    } catch (e) {
      updatedImages = typeof textImages === "string" ? [{ url: textImages }] : [];
    }
  } else {
    updatedImages = typeof productCheck.rows[0].images === "string"
      ? JSON.parse(productCheck.rows[0].images || "[]")
      : productCheck.rows[0].images || [];
  }

  const numPrice = parseFloat(price);
  const numOriginalPrice = req.body.original_price ? parseFloat(req.body.original_price) : parseFloat((numPrice * 1.25).toFixed(2));
  const calculatedDiscount = numOriginalPrice > numPrice ? Math.floor(((numOriginalPrice - numPrice) / numOriginalPrice) * 100) : 0;
  const offerType = req.body.offer_type || "HOTDEAL";

  const result = await database.query(
    `UPDATE products SET name = $1, description = $2, price = $3, category = $4, sub_category = $5, stock = $6, images = $7, original_price = $8, discount_percentage = $9, offer_type = $10 WHERE id = $11 RETURNING *`,
    [name, description, numPrice, category, sub_category || "", stock, JSON.stringify(updatedImages), numOriginalPrice, calculatedDiscount, offerType, productId]
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    updatedProduct: result.rows[0],
  });
});

// (deleteProduct, fetchSingleProduct, postProductReview, deleteReview, fetchAIFilteredProducts same as your original code)
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const product = await database.query("SELECT * FROM products WHERE id = $1", [productId]);
    if (product.rows.length === 0) return next(new ErrorHandler("Product not found.", 404));
    const images = product.rows[0].images;
    await database.query("DELETE FROM products WHERE id = $1", [productId]);
    if (images && images.length > 0) {
        for (const image of images) await cloudinary.uploader.destroy(image.public_id);
    }
    res.status(200).json({ success: true, message: "Product deleted successfully." });
});

async function searchFlipkartProductLink(productName) {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Cache-Control": "max-age=0"
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    const hrefRegex = /href="\/([^"]+?\/p\/itm[^"]+?)"/g;
    let match = hrefRegex.exec(html);
    if (match) {
      return `https://www.flipkart.com/${match[1].replace(/&amp;/g, "&")}`;
    }

    // Fallback to base name
    const baseName = productName.split("(")[0].trim();
    if (baseName !== productName) {
      const fallbackUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(baseName)}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Cache-Control": "max-age=0"
        }
      });

      if (fallbackResponse.ok) {
        const fallbackHtml = await fallbackResponse.text();
        const fallbackMatch = hrefRegex.exec(fallbackHtml);
        if (fallbackMatch) {
          return `https://www.flipkart.com/${fallbackMatch[1].replace(/&amp;/g, "&")}`;
        }
      }
    }
  } catch (err) {
    console.error(`⚠️ searchFlipkartProductLink failed for ${productName}:`, err.message);
  }
  return null;
}

export const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;
    const result = await database.query(`SELECT ${PRODUCT_SELECT_FIELDS}, COALESCE(json_agg(json_build_object('review_id', r.id, 'rating', r.rating, 'comment', r.comment, 'reviewer', json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar))) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews FROM products p LEFT JOIN reviews r ON p.id = r.product_id LEFT JOIN users u ON r.user_id = u.id WHERE p.id  = $1 GROUP BY p.id`, [productId]);
    
    if (result.rows.length === 0) {
        return next(new ErrorHandler("Product not found.", 404));
    }

    const product = result.rows[0];

    // Check if we need to scrape Flipkart media on-the-fly (ONLY for Mobiles)
    const imagesArray = Array.isArray(product.images) ? product.images : JSON.parse(product.images || "[]");
    const isMobile = product.category === "Mobiles";
    const hasBeenScraped = !isMobile || (imagesArray.length > 0 && imagesArray[0].url.startsWith("https://rukminim1.flixcart.com"));

    if (!hasBeenScraped) {
        let itemLink = product.item_link;
        if (!itemLink || !itemLink.startsWith("http")) {
            try {
                console.log(`🔍 Searching Flipkart link for product "${product.name}" on-the-fly...`);
                itemLink = await searchFlipkartProductLink(product.name);
                if (itemLink) {
                    await database.query("UPDATE products SET item_link = $1 WHERE id = $2", [itemLink, product.id]);
                    product.item_link = itemLink;
                    console.log(`✅ Updated missing item_link to: ${itemLink}`);
                }
            } catch (searchErr) {
                console.error(`❌ Failed to search Flipkart link on-the-fly for ${product.id}:`, searchErr.message);
            }
        }

        if (itemLink && itemLink.startsWith("http")) {
            try {
                console.log(`🔍 Scraping Flipkart media for product ${product.id} on-the-fly...`);
                const response = await fetch(itemLink, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Cache-Control": "max-age=0"
                    }
                });

                if (response.ok) {
                    const html = await response.text();
                    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?:;|<\/script>)/);
                    if (jsonMatch) {
                        const state = JSON.parse(jsonMatch[1]);
                        const slots = state.multiWidgetState?.widgetsData?.slots || [];
                        let dlsData = null;
                        for (const slot of slots) {
                            const currentDlsData = slot?.slotData?.widget?.data?.dlsData;
                            if (currentDlsData) {
                                const hasMedia = Object.keys(currentDlsData).some(k => k.startsWith("multiMediaViewData"));
                                if (hasMedia) {
                                    dlsData = currentDlsData;
                                    break;
                                }
                            }
                        }

                        if (dlsData) {
                            const mediaKeys = Object.keys(dlsData).filter(k => k.startsWith("multiMediaViewData"));
                            const newImages = [];
                            let videoUrl = null;

                            for (const key of mediaKeys) {
                                const val = dlsData[key];
                                if (val && Array.isArray(val.value)) {
                                    val.value.forEach((item) => {
                                        const valObj = item.value;
                                        if (valObj) {
                                            if (valObj.image_0?.value?.selected?.value?.dynamicImageUrl) {
                                                const dynUrl = valObj.image_0.value.selected.value.dynamicImageUrl;
                                                const formattedUrl = dynUrl
                                                    .replace("{@width}", "800")
                                                    .replace("{@height}", "800")
                                                    .replace("{@quality}", "80");
                                                if (!newImages.some(img => img.url === formattedUrl)) {
                                                    newImages.push({
                                                        url: formattedUrl,
                                                        public_id: `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                                                    });
                                                }
                                            }

                                            let videoId = null;
                                            if (valObj.fkYoutubeData_0?.value?.selected?.action?.params?.videoId) {
                                                videoId = valObj.fkYoutubeData_0.value.selected.action.params.videoId;
                                            } else if (valObj.fkYoutubeData_0?.value?.selected?.value?.videoId) {
                                                videoId = valObj.fkYoutubeData_0.value.selected.value.videoId;
                                            }

                                            if (videoId) {
                                                videoUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
                                            }
                                        }
                                    });
                                }
                            }

                            if (newImages.length > 0) {
                                const videoObj = videoUrl ? { url: videoUrl, type: "youtube" } : null;
                                
                                // Save to database
                                await database.query(
                                    "UPDATE products SET images = $1::jsonb, video = $2::jsonb WHERE id = $3",
                                    [JSON.stringify(newImages), JSON.stringify(videoObj), product.id]
                                );

                                // Propagate to duplicate siblings
                                await database.query(
                                    `UPDATE products 
                                     SET images = $1::jsonb, video = $2::jsonb, item_link = $3 
                                     WHERE category = 'Mobiles' 
                                       AND LOWER(name) = LOWER($4) 
                                       AND id != $5`,
                                    [JSON.stringify(newImages), JSON.stringify(videoObj), itemLink, product.name, product.id]
                                );

                                console.log(`✅ Successfully updated media for product ${product.id} (${newImages.length} images, video: ${!!videoUrl}) and siblings.`);
                                
                                // Update response product object
                                product.images = newImages;
                                product.video = videoObj;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`❌ Failed to scrape Flipkart media on-the-fly for ${product.id}:`, err.message);
            }
        }
    }

    res.status(200).json({ success: true, message: "Product fetched successfully.", product });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  if (!rating || !comment) return next(new ErrorHandler("Please provide rating and comment.", 400));
  const { rows } = await database.query(`SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN payments p ON p.order_id = o.id WHERE o.buyer_id = $1 AND oi.product_id = $2 AND p.payment_status = 'Paid' LIMIT 1`, [req.user.id, productId]);
  if (rows.length === 0) return res.status(403).json({ success: false, message: "You can only review a product you've purchased." });
  const isAlreadyReviewed = await database.query(`SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`, [productId, req.user.id]);
  let review;
  if (isAlreadyReviewed.rows.length > 0) review = await database.query("UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *", [rating, comment, productId, req.user.id]);
  else review = await database.query("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *", [productId, req.user.id, rating, comment]);
  const allReviews = await database.query(`SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`, [productId]);
  const updatedProduct = await database.query(`UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`, [allReviews.rows[0].avg_rating, productId]);
  res.status(200).json({ success: true, message: "Review posted.", review: review.rows[0], product: updatedProduct.rows[0] });
});

export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const review = await database.query("DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *", [productId, req.user.id]);
  if (review.rows.length === 0) return next(new ErrorHandler("Review not found.", 404));
  const allReviews = await database.query(`SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`, [productId]);
  const updatedProduct = await database.query(`UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`, [allReviews.rows[0].avg_rating, productId]);
  res.status(200).json({ success: true, message: "Your review has been deleted.", review: review.rows[0], product: updatedProduct.rows[0] });
});

export const fetchAIFilteredProducts = catchAsyncErrors(async (req, res, next) => {
    const { userPrompt, voiceText, imageTags, productId } = req.body;
    const query = (userPrompt || voiceText || imageTags?.join(" ") || "").trim();
    if (!query && !productId) return next(new ErrorHandler("Please provide a valid search input.", 400));
    
    // Parse search query
    const parsed = await parseSearchQuery(query);
    const category = parsed.category;
    const keywords = parsed.keywords;

    const conditions = [];
    const values = [];
    let index = 1;

    if (category) {
      conditions.push(`p.category = $${index}`);
      values.push(category);
      index++;
    }

    let relevanceSelect = "";
    if (keywords.length > 0) {
      const keywordConditions = [];
      const scores = [];
      keywords.forEach(kw => {
        keywordConditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
        values.push(`%${kw}%`);
        index++;

        scores.push(`(CASE WHEN p.name ILIKE $${index} THEN 10 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
        scores.push(`(CASE WHEN p.description ILIKE $${index} THEN 2 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
      });
      conditions.push(`(${keywordConditions.join(" OR ")})`);
      relevanceSelect = `, (${scores.join(" + ")}) as relevance_score`;
    } else {
      relevanceSelect = `, 0 as relevance_score`;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      ${relevanceSelect}
      FROM products p
      ${whereClause}
      ORDER BY relevance_score DESC, p.created_at DESC
      LIMIT 100
    `;

    const result = await database.query(sql, values);
    res.status(200).json({ success: true, products: result.rows });
});

export const cameraSearch = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.image) {
    return next(new ErrorHandler("Please upload an image for visual search.", 400));
  }

  const imageFile = req.files.image;
  
  // Parse local keywords sent by the client-side classification model
  let localKeywordsArray = [];
  if (req.body.localKeywords) {
    try {
      const rawArray = JSON.parse(req.body.localKeywords);
      const cleaned = new Set();
      rawArray.forEach(kw => {
        const lower = kw.toLowerCase().trim();
        if (lower.length > 2) {
          cleaned.add(lower);
          // Split by space and add individual words if they are long enough
          const parts = lower.split(/[\s_-]+/);
          if (parts.length > 1) {
            parts.forEach(part => {
              if (part.length > 2 && part !== "and" && part !== "the" && part !== "with") {
                cleaned.add(part);
              }
            });
          }
        }
      });
      localKeywordsArray = Array.from(cleaned);
      console.log("Parsed & expanded localKeywords:", localKeywordsArray);
    } catch (e) {
      console.warn("Failed to parse localKeywords from request:", e.message);
    }
  }
  
  try {
    // 1. Read temp file as base64
    const fileBuffer = await fs.readFile(imageFile.tempFilePath);
    const base64Data = fileBuffer.toString("base64");
    const mimeType = imageFile.mimetype;

    let parsedImage;
    let isFallback = false;
    try {
      parsedImage = await parseImage(base64Data, mimeType);
    } catch (apiErr) {
      isFallback = true;
      console.warn("Gemini visual search failed, calling fallback parser:", apiErr.message);
      parsedImage = await parseImageFallback(imageFile.name, mimeType);
      
      // If we have local keywords from the client, use them to improve the local fallback
      if (localKeywordsArray.length > 0) {
        // Try to identify category based on local keywords
        let categoryFromKeywords = null;
        for (const kw of localKeywordsArray) {
          const check = parseSearchQueryLocally(kw);
          if (check.category) {
            categoryFromKeywords = check.category;
            break;
          }
        }
        parsedImage.category = parsedImage.category || categoryFromKeywords;
        
        // Merge keywords from file name and local classifier
        const mergedKeywords = new Set([...(parsedImage.keywords || []), ...localKeywordsArray]);
        parsedImage.keywords = Array.from(mergedKeywords);
      }
    }
    const { category, keywords = [], brands = [], ocrText = "", color = "" } = parsedImage;
    console.log("📸 Visual Search parsed:", { category, keywords, brands, ocrText, color, isFallback });

    if (!category && keywords.length === 0 && brands.length === 0 && !ocrText && !color) {
      await fs.remove(imageFile.tempFilePath);
      // Return top rated products as fallback suggestions
      const fallbackQuery = `
        SELECT ${PRODUCT_SELECT_FIELDS}, COUNT(r.id) AS review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        GROUP BY p.id
        ORDER BY p.ratings DESC, p.created_at DESC
        LIMIT 12
      `;
      const result = await database.query(fallbackQuery);
      const mappedProducts = result.rows.map((product, idx) => ({
        ...product,
        matchPct: 85 - idx * 3
      }));
      return res.status(200).json({ success: true, isFallback: true, products: mappedProducts });
    }

    // 3. Search DB for matching products
    const conditions = [];
    const values = [];
    let index = 1;

    // Build relevance score list
    let relevanceSelect = "";
    const scores = [];

    // Category relevance boost
    if (category) {
      scores.push(`(CASE WHEN p.category = $${index} THEN 15 ELSE 0 END)`);
      values.push(category);
      index++;
    }

    // Brand matching boost
    if (brands && brands.length > 0) {
      brands.forEach(brand => {
        scores.push(`(CASE WHEN (p.name ILIKE $${index} OR p.description ILIKE $${index} OR p.sub_category ILIKE $${index}) THEN 20 ELSE 0 END)`);
        values.push(`%${brand}%`);
        index++;
      });
    }

    // Color matching boost
    if (color) {
      scores.push(`(CASE WHEN (p.name ILIKE $${index} OR p.description ILIKE $${index}) THEN 15 ELSE 0 END)`);
      values.push(`%${color}%`);
      index++;
    }

    // OCR text matching boost
    if (ocrText && ocrText.trim().length > 2) {
      const ocrWords = ocrText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      ocrWords.forEach(word => {
        scores.push(`(CASE WHEN (p.name ILIKE $${index} OR p.description ILIKE $${index}) THEN 15 ELSE 0 END)`);
        values.push(`%${word}%`);
        index++;
      });
    }

    // Filter by matching keywords and build relevance score
    if (keywords && keywords.length > 0) {
      const keywordConditions = [];
      keywords.forEach(kw => {
        keywordConditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index} OR p.category ILIKE $${index})`);
        values.push(`%${kw}%`);
        index++;
        
        scores.push(`(CASE WHEN p.name ILIKE $${index} THEN 10 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
        scores.push(`(CASE WHEN p.description ILIKE $${index} THEN 2 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
      });
      conditions.push(`(${keywordConditions.join(" OR ")})`);
    }

    if (scores.length > 0) {
      relevanceSelect = `, (${scores.join(" + ")}) as relevance_score`;
    } else {
      relevanceSelect = `, 0 as relevance_score`;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      WITH scored_products AS (
        SELECT ${PRODUCT_SELECT_FIELDS}, 
        COUNT(r.id) AS review_count,
        MAX(COALESCE(ps.visual_search_clicks, 0)) as past_clicks
        ${relevanceSelect}
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        LEFT JOIN product_stats ps ON p.id = ps.product_id
        ${whereClause}
        GROUP BY p.id
      )
      SELECT * 
      FROM scored_products
      ORDER BY (relevance_score + past_clicks * 5) DESC, created_at DESC
      LIMIT 12
    `;

    const result = await database.query(query, values);
    
    // Cleanup temporary file
    await fs.remove(imageFile.tempFilePath);

    // Map match percentages
    const mappedProducts = result.rows.map((product, idx) => {
      const relevance = parseInt(product.relevance_score) || 0;
      const clicks = parseInt(product.past_clicks) || 0;
      const totalScore = relevance + clicks * 5;
      
      let matchPct = 95 - idx * 4;
      if (totalScore > 0) {
        if (idx === 0 && totalScore >= 15) {
          matchPct = 100;
        } else {
          matchPct = Math.min(99, 70 + Math.min(29, totalScore * 3));
        }
      }
      return {
        ...product,
        matchPct
      };
    });

    res.status(200).json({
      success: true,
      category,
      keywords,
      brands,
      ocrText,
      color,
      isFallback,
      products: mappedProducts
    });

  } catch (err) {
    console.error("Visual search error:", err.message);
    // Cleanup temp file just in case
    try {
      await fs.remove(imageFile.tempFilePath);
    } catch (_) {}
    return next(new ErrorHandler("Failed to process visual search.", 500));
  }
});

export const fetchSimilarProducts = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  
  // 1. Fetch current product's category and embedding
  const productRes = await database.query(
    "SELECT category, embedding FROM products WHERE id = $1",
    [productId]
  );
  
  if (productRes.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }
  
  const currentProduct = productRes.rows[0];
  const { category, embedding } = currentProduct;
  
  let queryStr = "";
  let values = [productId];
  
  if (embedding && embedding.length > 0) {
    const embeddingStr = `ARRAY[${embedding.map(Number).join(",")}]::real[]`;
    queryStr = `
      SELECT ${PRODUCT_SELECT_FIELDS},
      COALESCE(cosine_similarity(p.embedding, ${embeddingStr}), 0) * 100 as similarity_score
      FROM products p
      WHERE p.id != $1 AND p.embedding IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT 8
    `;
  } else {
    queryStr = `
      SELECT ${PRODUCT_SELECT_FIELDS}, 0 as similarity_score
      FROM products p
      WHERE p.id != $1 AND p.category = $2
      LIMIT 8
    `;
    values.push(category || "");
  }
  
  const result = await database.query(queryStr, values);
  
  const products = result.rows.map((p, idx) => {
    const score = parseFloat(p.similarity_score) || 0;
    let matchPct = 95 - idx * 3;
    if (score > 0) {
      matchPct = Math.min(99, Math.max(50, Math.round(score)));
    }
    return { ...p, matchPct };
  });
  
  res.status(200).json({
    success: true,
    products
  });
});

export const fetchVisualRecommendations = catchAsyncErrors(async (req, res, next) => {
  const { recentIds } = req.body;
  
  if (!recentIds || !Array.isArray(recentIds) || recentIds.length === 0) {
    const fallbackQuery = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ORDER BY p.ratings DESC, p.created_at DESC
      LIMIT 12
    `;
    const fallbackRes = await database.query(fallbackQuery);
    return res.status(200).json({ success: true, products: fallbackRes.rows });
  }
  
  // Get embeddings of recently viewed products
  const viewedRes = await database.query(
    "SELECT embedding FROM products WHERE id = ANY($1) AND embedding IS NOT NULL",
    [recentIds]
  );
  
  const embeddings = viewedRes.rows.map(r => r.embedding).filter(Boolean);
  
  if (embeddings.length === 0) {
    // Fallback to category match of recently viewed products if no embeddings are found
    const catRes = await database.query(
      "SELECT category FROM products WHERE id = ANY($1)",
      [recentIds]
    );
    const categories = catRes.rows.map(r => r.category).filter(Boolean);
    
    let queryStr = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      WHERE NOT (p.id = ANY($1))
    `;
    let values = [recentIds];
    
    if (categories.length > 0) {
      queryStr += " AND p.category = ANY($2)";
      values.push(categories);
    }
    
    queryStr += " ORDER BY p.ratings DESC, p.created_at DESC LIMIT 12";
    
    const result = await database.query(queryStr, values);
    return res.status(200).json({ success: true, products: result.rows });
  }
  
  // Average the embeddings of recently viewed products
  const dim = embeddings[0].length;
  const avgEmbedding = new Array(dim).fill(0);
  
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avgEmbedding[i] += emb[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avgEmbedding[i] /= embeddings.length;
  }
  
  const embeddingStr = `ARRAY[${avgEmbedding.map(Number).join(",")}]::real[]`;
  
  const queryStr = `
    SELECT ${PRODUCT_SELECT_FIELDS},
    COALESCE(cosine_similarity(p.embedding, ${embeddingStr}), 0) * 100 as similarity_score
    FROM products p
    WHERE NOT (p.id = ANY($1)) AND p.embedding IS NOT NULL
    ORDER BY similarity_score DESC
    LIMIT 12
  `;
  
  const result = await database.query(queryStr, [recentIds]);
  
  res.status(200).json({
    success: true,
    products: result.rows
  });
});