const fs = require('fs');

let file = fs.readFileSync('frontend/services/PlatformDOMScraperService.js', 'utf8');

if (file.includes('obj?.url ||')) {
  console.log("Found PRELOADED_STATE URL extraction");
}
