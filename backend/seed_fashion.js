import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "config", "config.env") });

const { Pool } = pg;
const db = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

const ADMIN_ID = "bc6596bb-b7bf-404d-b2c3-9ef25f970777";

const FASHION_PRODUCTS = [
  {
    name: "Shein Full Length Fly With Button Closure Clean Wash Straight Jeans (Black)",
    description: "Classic full length denim pants featuring traditional fly and button closure. Premium clean wash black denim in a comfortable straight leg fit. Perfect for all seasons and casual styling.",
    price: 559,
    original_price: 799,
    category: "Fashion",
    ratings: 4.6,
    stock: 120,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop", public_id: "shein/black_jeans_1" },
      { url: "https://images.unsplash.com/photo-1475180098004-ca77a66827ae?q=80&w=600&auto=format&fit=crop", public_id: "shein/black_jeans_2" },
      { url: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=600&auto=format&fit=crop", public_id: "shein/black_jeans_3" },
      { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop", public_id: "shein/black_jeans_4" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Clean Wash Straight Jeans (Charcoal)",
    description: "Heavyweight relaxed straight leg jeans in a clean deep charcoal wash. Traditional fly front with secure button closure, five pocket design, and durable rivet accents.",
    price: 664,
    original_price: 949,
    category: "Fashion",
    ratings: 4.7,
    stock: 95,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=600&auto=format&fit=crop", public_id: "shein/charcoal_jeans_1" },
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop", public_id: "shein/charcoal_jeans_2" },
      { url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=600&auto=format&fit=crop", public_id: "shein/charcoal_jeans_3" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Light Wash Relaxed Jeans (Light Blue)",
    description: "Trendy light wash denim jeans featuring a comfortable high-rise fit, standard fly and button fastening, straight silhouette, and classic soft-brushed texture.",
    price: 629,
    original_price: 899,
    category: "Fashion",
    ratings: 4.8,
    stock: 110,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=600&auto=format&fit=crop", public_id: "shein/light_jeans_1" },
      { url: "https://images.unsplash.com/photo-1514315384763-ba401779410f?q=80&w=600&auto=format&fit=crop", public_id: "shein/light_jeans_2" },
      { url: "https://images.unsplash.com/photo-1522337360788-8b13edd793be?q=80&w=600&auto=format&fit=crop", public_id: "shein/light_jeans_3" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Mid Wash Straight Jeans (Classic Indigo)",
    description: "Timeless mid-wash denim trousers perfect for daily layering. Features rigid cotton construction, five pocket utility, straight legs, and classic double stitched seams.",
    price: 629,
    original_price: 899,
    category: "Fashion",
    ratings: 4.5,
    stock: 85,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop", public_id: "shein/mid_jeans_1" },
      { url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop", public_id: "shein/mid_jeans_2" },
      { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop", public_id: "shein/mid_jeans_3" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Mid Wash Straight Jeans (Dark Wash)",
    description: "Elevate your style with dark wash straight denim. Sturdy belt loops, functional zip fly with button closure, regular straight silhouette, and reinforced pocket stitches.",
    price: 629,
    original_price: 899,
    category: "Fashion",
    ratings: 4.6,
    stock: 60,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop", public_id: "shein/dark_jeans_1" },
      { url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop", public_id: "shein/dark_jeans_2" }
    ]
  },
  {
    name: "Shein Fly With Button Closure Folded Hem Mid Rise Wide Leg Jeans",
    description: "Vintage retro inspired wide leg jeans featuring an elegant folded cuff hem, flattering mid-rise waist, robust fly-button front, and relaxed premium dark indigo drape.",
    price: 664,
    original_price: 949,
    category: "Fashion",
    ratings: 4.8,
    stock: 140,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop", public_id: "shein/wide_jeans_1" },
      { url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop", public_id: "shein/wide_jeans_2" }
    ]
  },
  {
    name: "Shein Fly With Button Closure Folded Hem Mid Rise Wide Leg Jeans (Black)",
    description: "Chic black wide leg trousers with folded hem accent. Button closure with dynamic zip fly, robust medium weight canvas wash, and comfortable hips contour.",
    price: 664,
    original_price: 949,
    category: "Fashion",
    ratings: 4.7,
    stock: 50,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop", public_id: "shein/wide_black_1" },
      { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop", public_id: "shein/wide_black_2" }
    ]
  },
  {
    name: "Shein Sleeveless Lapel Collar Panelled Mini Shirt Style Dress",
    description: "Sleek panelled sleeveless shirt dress in rich indigo blue. Standard smart lapel collar, metallic button-up closure front, structured waistline, and comfortable mini length drape.",
    price: 559,
    original_price: 799,
    category: "Fashion",
    ratings: 4.9,
    stock: 80,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop", public_id: "shein/mini_dress_1" },
      { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600&auto=format&fit=crop", public_id: "shein/mini_dress_2" }
    ]
  },
  {
    name: "Shein Halter Neck Tie-Up Buttoned Textured Top & Shorts Set (Terracotta)",
    description: "A vibrant terracotta co-ord set featuring a chic buttoned halter top with neck tie-up detailing, matched with breathable elastic-waist shorts in a premium textured linen blend.",
    price: 699,
    original_price: 999,
    category: "Fashion",
    ratings: 4.6,
    stock: 130,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop", public_id: "shein/coord_set_1" },
      { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600&auto=format&fit=crop", public_id: "shein/coord_set_2" }
    ]
  },
  {
    name: "Shein Sleeveless Graphic Print Tshirt & Shorts Set",
    description: "Ultra-cozy sleepwear and loungewear set. Sleeveless soft tank top with cute graphic print, paired with lightweight tropical print relaxed shorts in dynamic shades of pink and green.",
    price: 454,
    original_price: 649,
    category: "Fashion",
    ratings: 4.5,
    stock: 110,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600&auto=format&fit=crop", public_id: "shein/loungewear_1" },
      { url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop", public_id: "shein/loungewear_2" }
    ]
  },
  {
    name: "Shein Low Rise Elasticated Drawstring Waist Cargo Joggers",
    description: "Urban techwear cargo pants featuring secure side utility pockets, an elasticated drawstring low waist, adjustable ankle cuffs, and relaxed athletic jogger silhouette.",
    price: 699,
    original_price: 999,
    category: "Fashion",
    ratings: 4.7,
    stock: 100,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop", public_id: "shein/cargo_pants_1" },
      { url: "https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600&auto=format&fit=crop", public_id: "shein/cargo_pants_2" }
    ]
  },
  {
    name: "Shein Full Length Elasticated Drawstring Waist Palazzo (Peach)",
    description: "Flowy, ultra-comfortable palazzo pants. Features a soft peach linen-blend weave, an adjustable drawstring waist, side slip pockets, and full length wide legs.",
    price: 419,
    original_price: 599,
    category: "Fashion",
    ratings: 4.8,
    stock: 90,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop", public_id: "shein/palazzo_1" },
      { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop", public_id: "shein/palazzo_2" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Mid Wash Distressed Jeans (Charcoal)",
    description: "Grey-wash distressed streetwear jeans featuring dynamic leg fading, front button and zip fly, raw frayed hem detailing, and straight standard fit.",
    price: 524,
    original_price: 749,
    category: "Fashion",
    ratings: 4.6,
    stock: 85,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop", public_id: "shein/distressed_1" },
      { url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=600&auto=format&fit=crop", public_id: "shein/distressed_2" }
    ]
  },
  {
    name: "Shein Full Length Fly With Button Closure Mid Wash Distressed Jeans (Ice Blue)",
    description: "Classic ice blue denim with frayed cuffs and light thigh abrasion. High rise waist, metal zip closure with top button, and standard 5-pocket utility layout.",
    price: 524,
    original_price: 749,
    category: "Fashion",
    ratings: 4.5,
    stock: 125,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=600&auto=format&fit=crop", public_id: "shein/distressed_blue_1" },
      { url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop", public_id: "shein/distressed_blue_2" }
    ]
  },
  {
    name: "Shein Fly With Button Closure Clean Wash Straight Leg Jeans (Faded Black)",
    description: "Sturdy structured faded black denim. Traditional button waist with robust fly, regular straight leg, detailed copper rivets, and warm heavy cotton weave.",
    price: 629,
    original_price: 899,
    category: "Fashion",
    ratings: 4.7,
    stock: 110,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop", public_id: "shein/faded_black_1" },
      { url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=600&auto=format&fit=crop", public_id: "shein/faded_black_2" }
    ]
  },
  {
    name: "Shein Elasticated Drawstring Waist Pintuck Track Pant",
    description: "Casual daily lounge joggers featuring dynamic pintuck front seams, a wide elastic waistband with adjustable drawstrings, and straight comfort drape.",
    price: 454,
    original_price: 649,
    category: "Fashion",
    ratings: 4.4,
    stock: 100,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=600&auto=format&fit=crop", public_id: "shein/track_pants_1" },
      { url: "https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600&auto=format&fit=crop", public_id: "shein/track_pants_2" }
    ]
  },
  {
    name: "Shein Cuban Collar Full Sleeve Checked Shirt (Monochrome Plaid)",
    description: "Classic grid-check full sleeve shirt in crisp monochrome plaid. Features a vintage cuban camp collar, full buttoned placket, and dual cuffs.",
    price: 419,
    original_price: 599,
    category: "Fashion",
    ratings: 4.6,
    stock: 95,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop", public_id: "shein/checked_shirt_1" },
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop", public_id: "shein/checked_shirt_2" }
    ]
  },
  {
    name: "Shein Short Sleeve Graphic Print Crew Tshirt & Shorts Set",
    description: "Charming pink nightwear set featuring a short sleeve graphic printed tshirt, matched with premium elastic lounge shorts.",
    price: 419,
    original_price: 599,
    category: "Fashion",
    ratings: 4.5,
    stock: 110,
    offer_type: "HOTDEAL",
    images: [
      { url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600&auto=format&fit=crop", public_id: "shein/shorts_set_1" },
      { url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop", public_id: "shein/shorts_set_2" }
    ]
  },
  {
    name: "Shein Strappy Sleeve Mock Button Detail Textured A-Line Dress (Wine Red)",
    description: "A-Line summer slip dress featuring dual strappy shoulder sleeves, elegant mock button front styling, and textured fabric finish in warm wine red.",
    price: 419,
    original_price: 599,
    category: "Fashion",
    ratings: 4.8,
    stock: 75,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop", public_id: "shein/wine_dress_1" },
      { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600&auto=format&fit=crop", public_id: "shein/wine_dress_2" }
    ]
  },
  {
    name: "Shein Drop Shoulder Floral Placement Print Crew Tshirt",
    description: "Relaxed fit pink crewneck tee featuring heavy drop-shoulder sleeves and a beautiful artistic floral placement graphic on the chest.",
    price: 244,
    original_price: 349,
    category: "Fashion",
    ratings: 4.5,
    stock: 140,
    offer_type: "BESTSELLER",
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop", public_id: "shein/floral_tee_1" },
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop", public_id: "shein/floral_tee_2" }
    ]
  }
];

async function seedFashion() {
  try {
    console.log("🔌 Connecting to the database...");
    
    // 1. Delete all existing products in database under 'Fashion' category
    console.log("🧹 Clearing old products in 'Fashion' category...");
    const deleteResult = await db.query(
      "DELETE FROM products WHERE category = 'Fashion' OR category = 'fashion'"
    );
    console.log(`✅ Deleted ${deleteResult.rowCount} old fashion products.`);

    console.log(`\n👔 Seeding ${FASHION_PRODUCTS.length} premium menswear fashion products...`);

    let addedCount = 0;
    for (const product of FASHION_PRODUCTS) {
      // Calculate discount percentage exactly as requested
      const price = parseFloat(product.price);
      const originalPrice = parseFloat(product.original_price);
      const discountPercentage = Math.floor(((originalPrice - price) / originalPrice) * 100);

      const result = await db.query(
        `INSERT INTO products (
          name, description, price, category, stock, ratings, images, 
          created_by, original_price, discount_percentage, offer_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
        RETURNING id, name, price, original_price, discount_percentage, offer_type`,
        [
          product.name,
          product.description,
          price,
          product.category,
          product.stock,
          product.ratings,
          JSON.stringify(product.images),
          ADMIN_ID,
          originalPrice,
          discountPercentage,
          product.offer_type
        ]
      );

      const row = result.rows[0];
      console.log(`  ✅ Added: "${row.name}" | Price: ₹${row.price} | Orig: ₹${row.original_price} (${row.discount_percentage}% OFF) | Offer: ${row.offer_type}`);
      addedCount++;
    }

    console.log(`\n📊 Seed completed. Successfully added ${addedCount} premium fashion products to the database.`);

    // 2. Print final fashion products count in database
    const countResult = await db.query("SELECT COUNT(*) FROM products WHERE category = 'Fashion'");
    console.log(`🗂️ Total Fashion products currently in DB: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await db.end();
    console.log("🔌 Connection closed.");
  }
}

seedFashion();
