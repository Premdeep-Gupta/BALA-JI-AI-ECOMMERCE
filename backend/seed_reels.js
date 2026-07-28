import database from "./database/db.js";

const AI_AVATARS = [
  { id: 'chloe', name: 'Chloe (DTC UGC Style)', voice: 'luxury', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-to-camera-in-interview-43022-large.mp4' },
  { id: 'alex', name: 'Alex (Tech & Specs Reviewer)', voice: 'deep', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-explaining-something-with-gestures-in-office-42777-large.mp4' },
  { id: 'sophia', name: 'Sophia (Fashion & Lifestyle Blogger)', voice: 'srk', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-broadly-42284-large.mp4' },
  { id: 'liam', name: 'Liam (Corporate Executive Voice)', voice: 'modi', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-corporate-man-talking-to-colleagues-43187-large.mp4' }
];

const FORMATS = ["UGC Video", "Tutorial", "Unboxing", "ASMR Review", "TikTok Transition", "Behind The Scenes"];
const HOOKS = ["Product Hit", "Spicy Close-Up", "Stop Scroll Warning", "Glass Shatter", "Confetti Explosion", "Glitch Transition"];
const SCENES = ["Cozy Bedroom", "Nature Forest", "Rooftop Skyline", "Luxury Penthouse", "Sunny Beachside", "Coffee Shop"];
const MUSIC_TRACKS = ["Summer Pop Energy", "Lofi Premium Chill", "Cinematic Orchestral", "Hip Hop Bass Drop"];

async function seedReels() {
  try {
    console.log("Reading products from database...");
    const prodRes = await database.query("SELECT * FROM products;");
    if (prodRes.rows.length === 0) {
      console.log("❌ No products found in database! Please seed products first.");
      process.exit(1);
    }
    const products = prodRes.rows;
    console.log(`Found ${products.length} products.`);

    console.log("Clearing existing reels to fresh seed 200 new ads...");
    await database.query("DELETE FROM product_reels;");

    let reelsCount = 0;
    const targetReels = 200;

    while (reelsCount < targetReels) {
      for (const prod of products) {
        if (reelsCount >= targetReels) break;

        const avatar = AI_AVATARS[reelsCount % AI_AVATARS.length];
        const format = FORMATS[reelsCount % FORMATS.length];
        const hook = HOOKS[reelsCount % HOOKS.length];
        const scene = SCENES[reelsCount % SCENES.length];
        const music = MUSIC_TRACKS[reelsCount % MUSIC_TRACKS.length];
        
        const priceVal = typeof prod.price === 'number' ? prod.price : parseFloat(prod.price) || 999;
        const formattedPrice = `₹${priceVal.toLocaleString("en-IN")}`;
        
        // Generate realistic captions stating product name, price, and details
        const captions = [
          `🔥 Wow! You need to see this: introducing the new ${prod.name}!`,
          `💎 It's premium quality and you can get it for ${formattedPrice} only!`,
          `🛒 Perfect for your routine. Order yours today on BalajiMart — link in bio!`
        ];

        const title = `${prod.name} - UGC Ad by ${avatar.name}`;
        
        // Insert into database
        await database.query(
          `INSERT INTO product_reels (product_id, video_url, title, category_tag, music_track, format, hook, scene, captions, voiceover, views_count, likes_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            prod.id,
            avatar.videoUrl, // Use the actual avatar video loop as the backdrop video url
            title,
            "🔥 Trending",
            music,
            format,
            hook,
            scene,
            JSON.stringify(captions),
            avatar.voice,
            Math.floor(Math.random() * 85000) + 15000,
            Math.floor(Math.random() * 8000) + 2000
          ]
        );

        reelsCount++;
        if (reelsCount % 20 === 0) {
          console.log(`Seeded ${reelsCount} / 200 reels...`);
        }
      }
    }

    console.log(`\n✅ Seeded ${reelsCount} reels successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding reels failed:", error);
    process.exit(1);
  }
}

seedReels();
