const https = require('https');

https.get('https://blinkit.com/s/?q=akshayakalpa+organic+free+range+eggs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find some image URLs
    const imgMatches = data.match(/https:\/\/cdn\.grofers\.com\/[^"']+/g) || [];
    const uniqueImgs = [...new Set(imgMatches)].slice(0, 5);
    console.log("Images found:", uniqueImgs);
    
    // Find state
    const stateMatch = data.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});/);
    if (stateMatch) {
      console.log("PRELOADED_STATE found, length:", stateMatch[1].length);
      try {
        const state = JSON.parse(stateMatch[1]);
        // find a product
        const searchProduct = (obj) => {
           if (!obj || typeof obj !== 'object') return;
           if (obj.name && obj.price) {
             console.log("Product keys:", Object.keys(obj));
             return;
           }
           for (let k in obj) {
             searchProduct(obj[k]);
           }
        }
        searchProduct(state);
      } catch(e) {}
    } else {
      console.log("No PRELOADED_STATE found");
    }
  });
}).on('error', err => console.log(err));
