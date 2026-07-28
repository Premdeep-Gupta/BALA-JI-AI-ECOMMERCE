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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.error(`  ⚠️ Search fetch failed for ${productName}:`, err.message);
  }
  return null;
}

async function main() {
  try {
    console.log("🔌 Connecting to Database...");
    
    // Fetch all mobile products to check
    const query = `
      SELECT id, name, images, item_link 
      FROM products 
      WHERE category = 'Mobiles' 
      ORDER BY id ASC
    `;
    const res = await db.query(query);
    const allMobiles = res.rows;
    console.log(`📋 Found ${allMobiles.length} total mobile products in DB.`);

    const unscrapedMobiles = allMobiles.filter(product => {
      let imagesArray = [];
      try {
        imagesArray = Array.isArray(product.images) ? product.images : JSON.parse(product.images || "[]");
      } catch (e) {
        imagesArray = [];
      }
      const hasBeenScraped = imagesArray.length > 0 && imagesArray[0].url.startsWith("https://rukminim1.flixcart.com");
      return !hasBeenScraped;
    });

    console.log(`🔍 Found ${unscrapedMobiles.length} unscraped products that need multi-image fetch.`);

    let successCount = 0;
    let failedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < unscrapedMobiles.length; i++) {
      const product = unscrapedMobiles[i];
      console.log(`\n⚡️ [${i + 1}/${unscrapedMobiles.length}] Processing: "${product.name}" (ID: ${product.id})...`);

      try {
        // Resolve link if missing
        let itemLink = product.item_link;
        if (!itemLink || !itemLink.startsWith("http")) {
          console.log(`  🔍 Missing link. Searching Flipkart for: "${product.name}"...`);
          itemLink = await searchFlipkartProductLink(product.name);
          if (itemLink) {
            await db.query("UPDATE products SET item_link = $1 WHERE id = $2", [itemLink, product.id]);
            product.item_link = itemLink;
            console.log(`  ✅ Found and updated link: ${itemLink}`);
            await delay(2000);
          } else {
            console.warn(`  ⚠️ Could not find link on Flipkart for "${product.name}"`);
            failedCount++;
            continue;
          }
        }

        const response = await fetch(itemLink, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Cache-Control": "max-age=0"
          }
        });

        if (!response.ok) {
          console.warn(`  ⚠️ HTTP Status ${response.status} returned. Flipkart might be rate-limiting us.`);
          failedCount++;
          if (response.status === 403 || response.status === 429) {
            blockedCount++;
            if (blockedCount >= 3) {
              console.error("  🛑 Blocked by Flipkart. Sleeping for 15 seconds to cooldown...");
              await delay(15000);
              blockedCount = 0; // Reset
            }
          }
          await delay(2000);
          continue;
        }

        const html = await response.text();
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?:;|<\/script>)/);
        
        if (!jsonMatch) {
          console.warn("  ⚠️ Could not match __INITIAL_STATE__ JSON (Flipkart layout might have changed or captcha is active).");
          failedCount++;
          await delay(2000);
          continue;
        }

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

        if (!dlsData) {
          console.warn("  ⚠️ Could not find media slots (dlsData) in page state.");
          failedCount++;
          await delay(2000);
          continue;
        }

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
          await db.query(
            "UPDATE products SET images = $1::jsonb, video = $2::jsonb WHERE id = $3",
            [JSON.stringify(newImages), JSON.stringify(videoObj), product.id]
          );

          console.log(`  ✅ Successfully updated: ${newImages.length} images, video: ${!!videoUrl}`);

          // Propagate to all duplicate sibling products with the same name
          const propagateRes = await db.query(
            `UPDATE products 
             SET images = $1::jsonb, video = $2::jsonb, item_link = $3 
             WHERE category = 'Mobiles' 
               AND LOWER(name) = LOWER($4) 
               AND id != $5`,
            [JSON.stringify(newImages), JSON.stringify(videoObj), product.item_link, product.name, product.id]
          );
          if (propagateRes.rowCount > 0) {
            console.log(`  🔗 Propagated images/video to ${propagateRes.rowCount} duplicate sibling products.`);
          }

          successCount++;
          blockedCount = 0; // Reset count on success
        } else {
          console.warn("  ⚠️ Scrape completed but no images found.");
          failedCount++;
        }

      } catch (err) {
        console.error(`  ❌ Error processing product ${product.id}:`, err.message);
        failedCount++;
      }

      // Wait 1.5 seconds between requests to prevent rate-limiting
      await delay(1500);
    }

    console.log("\n📊 Migration Complete Summary:");
    console.log(`   - Total Processed: ${unscrapedMobiles.length}`);
    console.log(`   - Success (Scraped & Saved): ${successCount}`);
    console.log(`   - Failed (Skipped): ${failedCount}`);

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await db.end();
    console.log("🔌 Database connection closed.");
  }
}

main();
