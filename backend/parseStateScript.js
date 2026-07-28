import fs from "fs";

function printFullMultimediaData() {
  const content = fs.readFileSync("state_script.js", "utf8");
  const jsonMatch = content.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
  if (!jsonMatch) return;
  
  try {
    const state = JSON.parse(jsonMatch[1]);
    const dlsData = state.multiWidgetState?.widgetsData?.slots?.[1]?.slotData?.widget?.data?.dlsData;
    if (dlsData) {
      console.log("Found slot 1 dlsData!");
      const mediaKeys = Object.keys(dlsData).filter(k => k.startsWith("multiMediaViewData"));
      for (const key of mediaKeys) {
        console.log(`\n=== KEY: ${key} ===`);
        const val = dlsData[key];
        
        // Print the value list
        if (val && Array.isArray(val.value)) {
          console.log(`Value is an array of size ${val.value.length}`);
          val.value.forEach((item, idx) => {
            console.log(`\n--- Item ${idx} ---`);
            const valObj = item.value;
            if (valObj) {
              // Print keys
              console.log("Keys inside item.value:", Object.keys(valObj));
              
              // If it has image_0
              if (valObj.image_0) {
                console.log("image_0 value:", JSON.stringify(valObj.image_0.value, null, 2));
              }
              // If it has video_0
              if (valObj.video_0) {
                console.log("video_0:", JSON.stringify(valObj.video_0, null, 2));
              }
              // If it has fkYoutubeData_0
              if (valObj.fkYoutubeData_0) {
                console.log("fkYoutubeData_0:", JSON.stringify(valObj.fkYoutubeData_0, null, 2));
              }
            }
          });
        } else {
          console.log("Value is not an array:", typeof val);
        }
      }
    } else {
      console.log("Slot 1 dlsData not found");
    }
  } catch (err) {
    console.error(err.message);
  }
}

printFullMultimediaData();
