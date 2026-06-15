import fs from "fs";

function testInitialState() {
  const html = fs.readFileSync("flipkart_test.html", "utf8");
  
  // Look for initial state or script blocks
  const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  console.log("Total script tags:", scripts.length);
  
  // Search for initial state
  let stateScript = "";
  for (const s of scripts) {
    if (s.includes("window.__INITIAL_STATE__") || s.includes("__INITIAL_STATE__")) {
      stateScript = s;
      break;
    }
  }
  
  if (stateScript) {
    console.log("Found window.__INITIAL_STATE__! Length:", stateScript.length);
    // Find all links containing mp4 or video format
    const mp4Regex = /http[s]?:\/\/[^"\']+\.(?:mp4|m3u8|mpd|webm)/g;
    const mp4Matches = stateScript.match(mp4Regex) || [];
    console.log("Found MP4 matches:", mp4Matches);
    
    // Let's also look for key terms like "video", "multimedia", "media"
    fs.writeFileSync("state_script.js", stateScript);
    console.log("Saved state script to state_script.js");
  } else {
    console.log("window.__INITIAL_STATE__ not found in script tags.");
  }
  
  // Search the entire HTML file for any mp4, webm or streaming links
  const streamRegex = /"([^"]+?\.(?:mp4|m3u8|mpd|webm)[^"]*?)"/g;
  let match;
  const streamUrls = [];
  while ((match = streamRegex.exec(html)) !== null) {
    streamUrls.push(match[1]);
  }
  console.log("Total stream URLs found in entire HTML:", streamUrls.length);
  streamUrls.forEach(url => console.log("Stream URL:", url));
}

testInitialState();
