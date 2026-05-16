const sanitizeProductName = (rawName) => {
  const name = String(rawName || "").trim();
  if (!name) return "";

  let cleaned = name
    .replace(/\u00a0/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\b\d+\s*mins?\b/gi, " ")
    .replace(/₹\s*[0-9]+(?:\.[0-9]+)?/gi, " ")
    .replace(/\b(add|buy\s*now|qty|view\s*more|off)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*[kK]?\s*Ratings?.*$/i, "")
    .replace(/\bRatings?.*$/i, "")
    .replace(/\bReviews?.*$/i, "")
    .replace(/[|]+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .replace(/\s+/g, " ")
    .trim();

  for (let i = 0; i < 3; i += 1) {
    cleaned = cleaned.replace(
      /\b([A-Za-z]{2,})\s([A-Za-z])\s([A-Za-z]{2,})\b/g,
      "$1$2$3",
    );
  }
  return cleaned.replace(/\s+/g, " ").trim();
};

const normalizeUnits = (str) => {
  return str
    .replace(/\b0\.5\s*l\b/gi, "500ml")
    .replace(/\b1\s*l\b/gi, "1000ml")
    .replace(/\b0\.25\s*l\b/gi, "250ml")
    .replace(/\blitres?\b/gi, "l")
    .replace(/\b1\s*kg\b/gi, "1000g")
    .replace(/\b0\.5\s*kg\b/gi, "500g")
    .replace(/\b0\.25\s*kg\b/gi, "250g")
    .replace(/\bgrams?\b/gi, "g")
    .replace(/\bgm\b/gi, "g");
};

const getProductMatchKey = (name) => {
  let clean = sanitizeProductName(name).toLowerCase();
  if (!clean) return "";

  clean = normalizeUnits(clean);

  clean = clean
    .replace(/\bbrittania\b/gi, "britannia")
    .replace(/\bcoca\s*cola\b/gi, "coke")
    .replace(/\bpepsico\b/gi, "pepsi")
    .replace(/\bthums\s*up\b/gi, "thumsup")
    .replace(/\btata\s*salt\b/gi, "tata salt")
    .replace(/\bamul\s+pure\s+ghee\b/gi, "amul ghee");

  const stopWords = new Set([
    "fresh", "new", "original", "pouch", "bottle", "net", "quantity",
    "medium", "large", "small", "the", "a", "an", "of", "best",
    "quality", "premium", "super", "tasty", "natural", "pure",
  ]);

  let baseWords = clean
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !stopWords.has(t));

  let normalized = baseWords.join(" ");

  normalized = normalized
    .replace(/(\d+)\s+(ml|g|kg|l|gm|ltr|pcs?|pack)\b/g, "$1$2")
    .replace(/(ml|g|kg|l|gm|ltr|pcs?|pack)\b/g, " $1")
    .replace(/\s+/g, " ")
    .trim();

  let qtyMatch = normalized.match(/\b\d+(?:\.\d+)?\s?(ml|g|kg|l|gm|ltr|pcs?|pack)\b/);
  let qty = qtyMatch ? qtyMatch[0].replace(/\s+/g, "") : "";

  if (qty) {
    normalized = normalized
      .replace(new RegExp(qtyMatch[0], "g"), "")
      .replace(/\s+/g, " ")
      .trim();
  }

  normalized = normalized
    .split(/\s+/)
    .filter((t) => !/^\d+(\.\d+)?$/.test(t))
    .join(" ");

  let finalWords = normalized.split(/\s+/).slice(0, 4);

  finalWords = finalWords.map((t) =>
    t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t,
  );

  const key = (finalWords.join(" ") + (qty ? " " + qty : "")).trim();
  return key;
};

const inputs = [
  "Farm Made Free Range Brown Eggs - Protein Rich, Veg Feed, Non-Fertile 1 pack (6 pcs)",
  "Farm Made Free Range Eggs 6 pc",
  "Farm Made Free Range Eggs, 12 pcs",
  "Farm Made Free Range Eggs 12 pcs"
];

for (const input of inputs) {
  console.log(`Input: ${input} => Key: ${getProductMatchKey(input)}`);
}
