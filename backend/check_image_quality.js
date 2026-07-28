import fs from "fs";
import readline from "readline";

const FILE_PATH = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Electronics_ product.csv";

// Simple CSV parser for a single line
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

async function inspectImages() {
  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  let headers = null;
  let matches = 0;

  for await (const line of rl) {
    count++;
    if (count === 1) {
      headers = parseCSVLine(line).map(h => h.trim());
      continue;
    }
    
    const parsed = parseCSVLine(line);
    const name = parsed[headers.indexOf("name")] || "";
    const imageURLs = parsed[headers.indexOf("imageURLs")] || "";
    
    const urls = imageURLs.split(",").map(url => url.replace(/^"|"$/g, "").trim()).filter(Boolean);
    
    // Let's see if any URLs contain "not_available" or "sorry" or "placeholder"
    const hasBadImage = urls.some(url => {
      const u = url.toLowerCase();
      return u.includes("sorry") || u.includes("placeholder") || u.includes("not_available") || u.includes("notavailable") || u.includes("noimage") || u.includes("no-image");
    });

    if (hasBadImage) {
      matches++;
      console.log(`Bad Image Found at Row ${count}:`);
      console.log(`  Name: ${name}`);
      console.log(`  Image URLs:`, urls);
      if (matches >= 10) break;
    }
  }
}

inspectImages();
