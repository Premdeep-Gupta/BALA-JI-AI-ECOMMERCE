import fs from "fs";

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

const csv1 = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products .csv";
const csv2 = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products2.csv";

function inspectFile(filePath, name) {
  console.log(`\n🔍 Inspecting ${name} from path: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log("❌ File does not exist!");
    return;
  }
  const parsed = parseCSV(filePath);
  if (parsed.length <= 1) {
    console.log("❌ File is empty or malformed");
    return;
  }
  const headers = parsed[0].map(h => h.trim());
  console.log("Headers:", headers);

  let categoryColIdx = -1;
  const possibleHeaders = ["Category", "Bb Category", "root_category_name", "category_name", "categories"];
  for (const h of possibleHeaders) {
    const idx = headers.indexOf(h);
    if (idx !== -1) {
      categoryColIdx = idx;
      break;
    }
  }

  if (categoryColIdx === -1) {
    console.log("❌ Category column not found!");
    return;
  }

  const counts = {};
  for (let i = 1; i < parsed.length; i++) {
    const cat = (parsed[i][categoryColIdx] || "").trim();
    counts[cat] = (counts[cat] || 0) + 1;
  }

  console.log("Top 15 Category Counts in CSV:");
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.table(sorted);
}

inspectFile(csv1, "Create_products .csv (Walmart)");
inspectFile(csv2, "Create_products2.csv (BigBasket)");
