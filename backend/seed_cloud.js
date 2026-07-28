import pg from "pg";
import fs from "fs";

const { Pool } = pg;
const db = new Pool({
  connectionString: "postgresql://neondb_owner:npg_p7Ns1jQYoWuK@ep-snowy-fire-ao1ugtib.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

const ADMIN_ID = "50841e0e-21df-475a-b822-8d007ac57349"; // Kumar Gupta's Admin ID in Cloud DB
const CSV_FILE_PATH_1 = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products .csv";
const CSV_FILE_PATH_2 = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products2.csv";

// Robust state-machine CSV parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }

  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

async function seedWalmart() {
  console.log("🔌 Connecting to database for Walmart products...");
  console.log("📂 Reading and parsing CSV file from:", CSV_FILE_PATH_1);
  
  const parsed = parseCSV(CSV_FILE_PATH_1);
  if (parsed.length <= 1) {
    console.error("❌ CSV file 1 is empty or missing content.");
    return;
  }

  const headers = parsed[0];
  const rawProducts = parsed.slice(1);
  console.log(`📦 Loaded ${rawProducts.length} rows from CSV file 1.`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < rawProducts.length; idx++) {
    const row = rawProducts[idx];
    if (row.length !== headers.length) {
      skippedCount++;
      continue;
    }

    const rawProduct = {};
    headers.forEach((h, i) => {
      rawProduct[h] = row[i];
    });

    const productName = (rawProduct.product_name || rawProduct.name || "").trim();
    const rawPrice = rawProduct.final_price || rawProduct.price;
    const rawCategory = rawProduct.root_category_name || rawProduct.category;
    const rawMainImage = rawProduct.main_image || rawProduct.image;
    const sku = rawProduct.sku || `wal_${idx}`;

    if (!productName || !rawPrice || !rawCategory || !rawMainImage) {
      skippedCount++;
      continue;
    }

    let dbCategory = "";
    const csvCategory = rawCategory.trim();

    if (csvCategory === "Clothing" || csvCategory === "Jewelry") {
      dbCategory = "Fashion";
    } else if (csvCategory === "Home" || csvCategory === "Home Improvement") {
      dbCategory = "Home";
    } else if (csvCategory === "Beauty" || csvCategory === "Premium Beauty") {
      dbCategory = "Beauty";
    } else if (csvCategory === "Baby" || csvCategory === "Toys") {
      dbCategory = "Kids & Baby";
    } else if (csvCategory === "Sports & Outdoors") {
      dbCategory = "Sports";
    } else if (csvCategory === "Auto & Tires") {
      dbCategory = "Automotive";
    } else if (csvCategory === "Electronics") {
      dbCategory = "Electronics";
    } else {
      skippedCount++;
      continue;
    }

    const existCheck = await db.query(
      "SELECT id FROM products WHERE name = $1 LIMIT 1",
      [productName]
    );
    if (existCheck.rows.length > 0) {
      skippedCount++;
      continue;
    }

    const price = Math.round(Number(rawPrice) * 83);
    const originalPrice = rawProduct.initial_price
      ? Math.round(Number(rawProduct.initial_price) * 83)
      : Math.round(price * 1.3);

    const discountPercentage = Math.max(
      0,
      Math.min(99, Math.floor(((originalPrice - price) / originalPrice) * 100))
    );

    const mainImgUrl = rawMainImage.replace(/^"|"$/g, "").trim();
    let imagesArray = [{ url: mainImgUrl, public_id: `walmart/${sku}_main` }];

    try {
      if (rawProduct.image_urls) {
        const rawUrls = JSON.parse(rawProduct.image_urls);
        if (Array.isArray(rawUrls) && rawUrls.length > 0) {
          imagesArray = rawUrls.map((url, i) => ({
            url: url.replace(/^"|"$/g, "").trim(),
            public_id: `walmart/${sku}_${i}`
          }));
        }
      }
    } catch (e) {}

    const ratings = isNaN(Number(rawProduct.rating)) ? 4.5 : Number(rawProduct.rating);
    const description = (rawProduct.description || "Premium quality imported product.").trim();
    const stock = Math.floor(Math.random() * 80) + 40;
    
    const offerTypes = ["HOTDEAL", "BESTSELLER", "NEW"];
    const offerType = offerTypes[idx % offerTypes.length];

    await db.query(
      `INSERT INTO products (
        name, description, price, category, stock, ratings, images, 
        created_by, original_price, discount_percentage, offer_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
      [
        productName,
        description,
        price,
        dbCategory,
        stock,
        ratings,
        JSON.stringify(imagesArray),
        ADMIN_ID,
        originalPrice,
        discountPercentage,
        offerType
      ]
    );

    insertedCount++;
    if (insertedCount % 100 === 0) {
      console.log(`  [Walmart] Imported ${insertedCount} products...`);
    }
  }

  console.log(`\n📊 Walmart Seeding Complete: Imported ${insertedCount}, Skipped ${skippedCount}`);
}

async function seedBigBasket() {
  console.log("📂 Reading and parsing CSV file from:", CSV_FILE_PATH_2);
  
  const parsed = parseCSV(CSV_FILE_PATH_2);
  if (parsed.length <= 1) {
    console.error("❌ CSV file 2 is empty or missing content.");
    return;
  }

  const headers = parsed[0].map(h => h.trim());
  const rawProducts = parsed.slice(1);
  console.log(`📦 Loaded ${rawProducts.length} rows from CSV file 2.`);

  const titleColIdx = headers.indexOf("Product Title");
  const descColIdx = headers.indexOf("Product Description");
  const categoryColIdx = headers.indexOf("Bb Category");
  const mrpColIdx = headers.indexOf("Mrp");
  const priceColIdx = headers.indexOf("Price");
  const imageColIdx = headers.indexOf("Image Url");
  const uniqIdColIdx = headers.indexOf("Uniq Id");

  if (titleColIdx === -1 || priceColIdx === -1 || categoryColIdx === -1 || imageColIdx === -1) {
    console.error("❌ Missing required headers in BigBasket CSV.");
    return;
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < rawProducts.length; idx++) {
    const row = rawProducts[idx];
    if (row.length < Math.max(titleColIdx, categoryColIdx, priceColIdx, imageColIdx)) {
      skippedCount++;
      continue;
    }

    const productName = (row[titleColIdx] || "").trim();
    const rawPrice = (row[priceColIdx] || "").trim();
    const rawCategory = (row[categoryColIdx] || "").trim();
    const rawMainImage = (row[imageColIdx] || "").trim();
    const rawDesc = (row[descColIdx] || "Premium quality imported product.").trim();
    const rawMrp = (row[mrpColIdx] || "").trim();
    const sku = (row[uniqIdColIdx] || `bb_${idx}`).trim();

    if (!productName || !rawPrice || !rawCategory || !rawMainImage) {
      skippedCount++;
      continue;
    }

    let dbCategory = "";
    const csvCategory = rawCategory.trim();

    if (
      csvCategory.includes("Beauty") ||
      csvCategory.includes("Fragrances") ||
      csvCategory.includes("Personal Care") ||
      csvCategory.includes("Skin Care") ||
      csvCategory.includes("Hair Care") ||
      csvCategory.includes("Makeup") ||
      csvCategory.includes("Deos") ||
      csvCategory.includes("Shaving") ||
      csvCategory.includes("Soaps & Body Wash")
    ) {
      dbCategory = "Beauty";
    } else if (
      csvCategory.includes("Baby") ||
      csvCategory.includes("Kids") ||
      csvCategory.includes("Dairy") ||
      csvCategory.includes("Bakery") ||
      csvCategory.includes("Diapers")
    ) {
      dbCategory = "Kids & Baby";
    } else if (
      csvCategory.includes("Home") ||
      csvCategory.includes("Kitchen") ||
      csvCategory.includes("Cleaners") ||
      csvCategory.includes("Household") ||
      csvCategory.includes("Juices") ||
      csvCategory.includes("Chocolates") ||
      csvCategory.includes("Drinks") ||
      csvCategory.includes("Masalas") ||
      csvCategory.includes("Spices") ||
      csvCategory.includes("Atta") ||
      csvCategory.includes("Flours") ||
      csvCategory.includes("Baking") ||
      csvCategory.includes("Cook") ||
      csvCategory.includes("Food") ||
      csvCategory.includes("Sauces") ||
      csvCategory.includes("Vinegar") ||
      csvCategory.includes("Beverages") ||
      csvCategory.includes("Groceries") ||
      csvCategory.includes("Snacks") ||
      csvCategory.includes("Biscuits") ||
      csvCategory.includes("Ghee") ||
      csvCategory.includes("Oils") ||
      csvCategory.includes("Dals") ||
      csvCategory.includes("Pulses") ||
      csvCategory.includes("Rice") ||
      csvCategory.includes("Pantry") ||
      csvCategory.includes("Pharma") ||
      csvCategory.includes("Pooja") ||
      csvCategory.includes("Paper & Disposables")
    ) {
      dbCategory = "Balaji Grocery";
    } else if (csvCategory.includes("Electronics") || csvCategory.includes("Appliances")) {
      dbCategory = "Electronics";
    } else if (csvCategory.includes("Clothing") || csvCategory.includes("Apparel") || csvCategory.includes("Fashion")) {
      dbCategory = "Fashion";
    } else {
      dbCategory = "Balaji Grocery";
    }

    const existCheck = await db.query(
      "SELECT id FROM products WHERE name = $1 LIMIT 1",
      [productName]
    );
    if (existCheck.rows.length > 0) {
      skippedCount++;
      continue;
    }

    const cleanPrice = rawPrice.replace(/[^0-9.]/g, '');
    const cleanMrp = rawMrp.replace(/[^0-9.]/g, '');
    
    const price = Math.round(parseFloat(cleanPrice));
    const originalPrice = cleanMrp ? Math.round(parseFloat(cleanMrp)) : Math.round(price * 1.2);

    if (isNaN(price) || price <= 0 || isNaN(originalPrice) || originalPrice <= 0) {
      skippedCount++;
      continue;
    }

    const discountPercentage = Math.max(
      0,
      Math.min(99, Math.floor(((originalPrice - price) / originalPrice) * 100))
    );

    const imgUrls = rawMainImage.split("|").map(url => url.replace(/^"|"$/g, "").trim()).filter(Boolean);
    const imagesArray = imgUrls.map((url, i) => ({
      url: url,
      public_id: `bigbasket/${sku}_${i}`
    }));

    if (imagesArray.length === 0) {
      skippedCount++;
      continue;
    }

    const ratings = 4.3;
    const stock = Math.floor(Math.random() * 60) + 50;
    
    const offerTypes = ["HOTDEAL", "BESTSELLER", "NEW"];
    const offerType = offerTypes[idx % offerTypes.length];

    await db.query(
      `INSERT INTO products (
        name, description, price, category, stock, ratings, images, 
        created_by, original_price, discount_percentage, offer_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
      [
        productName,
        rawDesc,
        price,
        dbCategory,
        stock,
        ratings,
        JSON.stringify(imagesArray),
        ADMIN_ID,
        originalPrice,
        discountPercentage,
        offerType
      ]
    );

    insertedCount++;
    if (insertedCount % 100 === 0) {
      console.log(`  [BigBasket] Imported ${insertedCount} products...`);
    }
  }

  console.log(`\n📊 BigBasket Seeding Complete: Imported ${insertedCount}, Skipped ${skippedCount}`);
}

async function run() {
  try {
    await seedWalmart();
    await seedBigBasket();
    console.log("⭐ Cloud database seeding finished successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await db.end();
    console.log("🔌 Database connection closed.");
  }
}

run();
