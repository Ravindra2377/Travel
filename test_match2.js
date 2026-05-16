const extractQuantityRobust = (text) => {
  const compact = String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  
  // Find all matches
  const regex = /\b(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs?|pc|pack)\b/gi;
  let matches = [];
  let m;
  while ((m = regex.exec(compact)) !== null) {
    matches.push({ full: m[0], num: parseFloat(m[1]), unit: m[2].toLowerCase() });
  }

  if (matches.length === 0) return "";

  // Prioritize specific units over generic "pack"
  let best = matches[0];
  for (const match of matches) {
    if (match.unit.includes('pc') && best.unit.includes('pack')) {
      best = match;
    }
  }

  // Normalize unit
  let u = best.unit;
  if (u.startsWith('g')) u = 'g';
  else if (u.startsWith('k')) u = 'kg';
  else if (u.startsWith('m')) u = 'ml';
  else if (u.startsWith('l')) u = 'l';
  else if (u.startsWith('pc')) u = 'pc';
  else if (u === 'pack') u = 'pack';

  return best.num + u;
};

console.log(extractQuantityRobust("1 pack (6 pcs)"));
console.log(extractQuantityRobust("Farm Made Free Range Eggs 6 pc"));
console.log(extractQuantityRobust("12 pcs"));
console.log(extractQuantityRobust("something without qty"));
