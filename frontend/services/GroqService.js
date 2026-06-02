// ─────────────────────────────────────────────────────────────────────────────
// GroqService.js — CompareZ AI Layer v2
// Models:
//   • llama-3.1-8b-instant    → Fast tasks (search, chat, copilot)
//   • llama-3.3-70b-versatile → Reasoning (meal plan, basket optimizer, deals)
//   • whisper-large-v3-turbo  → Voice transcription
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_KEY = "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";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

const MODELS = {
  fast: "llama-3.1-8b-instant",
  smart: "llama-3.3-70b-versatile",
  whisper: "whisper-large-v3-turbo",
};

// ─── Core fetch helper ────────────────────────────────────────────────────────
async function groqFetch(model, messages, maxTokens = 300, jsonMode = false) {
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── GroqService Public API ───────────────────────────────────────────────────
const GroqService = {
  // ── 1. Support Chat ────────────────────────────────────────────────────────
  async chat(history) {
    const messages = [
      {
        role: "system",
        content: `Your name is BEANS. You are CompareZ's friendly AI shopping assistant for Indian grocery shoppers.
CompareZ compares prices across Blinkit, Zepto, BigBasket, Amazon, and Flipkart in real-time.
Help users find the best deals, understand platform differences, and navigate the app.
Be concise (2-3 sentences max), helpful, and use occasional emojis.
Always answer in English. If asked about specific prices, remind them to search in the app.`,
      },
      ...history.slice(-20),
    ];
    return groqFetch(MODELS.fast, messages, 250);
  },

  // ── 2. Search Query Expansion ──────────────────────────────────────────────
  async expandSearchQuery(query) {
    try {
      const messages = [
        {
          role: "system",
          content: `You convert natural language grocery queries into the single best search keyword for Indian grocery apps.
Return ONLY a JSON object: {"keyword": "...", "isNaturalLanguage": true/false}
keyword must be 1-3 words max. Examples:
"healthy breakfast for kids" -> {"keyword": "oats", "isNaturalLanguage": true}
"amul butter" -> {"keyword": "amul butter", "isNaturalLanguage": false}`,
        },
        { role: "user", content: query },
      ];
      const raw = await groqFetch(MODELS.fast, messages, 60, true);
      const parsed = JSON.parse(raw);
      if (parsed.keyword) return parsed;
      return { keyword: query, isNaturalLanguage: false };
    } catch {
      return { keyword: query, isNaturalLanguage: false };
    }
  },

  // ── 3. Deal Analysis (Product Detail card) ────────────────────────────────
  async getDealAnalysis(product) {
    const priceList = product.prices
      .filter((p) => p.price > 0)
      .sort((a, b) => a.price - b.price)
      .map((p) => `${p.platform}: Rs.${p.price}`)
      .join(", ");
    const messages = [
      {
        role: "system",
        content: `You are a grocery price analyst. Given a product and its prices across platforms, write a 2-sentence deal verdict. Be direct. Use Rs. symbol.`,
      },
      {
        role: "user",
        content: `Product: "${product.name}"\nPrices: ${priceList}`,
      },
    ];
    return groqFetch(MODELS.smart, messages, 120);
  },

  // ── 4. Meal Planner ────────────────────────────────────────────────────────
  // Parse a meal description into a grocery ingredient list.
  // Returns: { dish, servings, ingredients: [{name, quantity}] }
  async parseMealIngredients(meal) {
    const messages = [
      {
        role: "system",
        content: `You are an Indian grocery shopping assistant. Given a meal description, return a JSON with grocery ingredients.
Format: { "dish": "...", "servings": number, "ingredients": [{"name": "grocery search keyword", "quantity": "e.g. 500g"}] }
Rules:
- "name" must be a short searchable grocery keyword (e.g. "chicken", "basmati rice", "amul butter")
- Include 6-10 ingredients max. Skip water and salt.
- Return ONLY valid JSON, no extra text.`,
      },
      { role: "user", content: meal },
    ];
    const raw = await groqFetch(MODELS.smart, messages, 500, true);
    return JSON.parse(raw);
  },

  // ── 5. Basket Optimizer (Wishlist) ────────────────────────────────────────
  // Calculate cheapest split of wishlist across platforms.
  // items: [{name, listings: [{platform, price}]}]
  // Returns: { splits, totalOptimized, totalSingleBest, savings, recommendation }
  async optimizeBasket(items) {
    const DELIVERY_FEE = 40;
    const payload = items.map((item) => ({
      name: item.name,
      prices: (item.listings || [])
        .filter((l) => Number(l.price) > 0)
        .map((l) => ({ platform: l.platform, price: Number(l.price) })),
    }));

    const messages = [
      {
        role: "system",
        content: `You are a grocery basket optimizer for India. Given a list of products with prices on different platforms, find the cheapest combination of platforms to buy all items. Each platform adds Rs.${DELIVERY_FEE} delivery fee once.
Return JSON only:
{
  "splits": [{"platform": "...", "items": ["item1"], "subtotal": 0, "deliveryFee": ${DELIVERY_FEE}}],
  "totalOptimized": 0,
  "totalSingleBest": 0,
  "savings": 0,
  "recommendation": "one sentence"
}`,
      },
      { role: "user", content: JSON.stringify(payload) },
    ];
    const raw = await groqFetch(MODELS.smart, messages, 600, true);
    return JSON.parse(raw);
  },

  // ── 6. Voice Transcription (Whisper) ──────────────────────────────────────
  // Transcribe audio file using Groq Whisper.
  // audioUri: local file URI from expo-audio (formerly expo-av)
  async transcribeAudio(audioUri) {
    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      name: "recording.m4a",
      type: "audio/m4a",
    });
    formData.append("model", MODELS.whisper);
    formData.append("language", "en");

    const response = await fetch(GROQ_AUDIO_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!response.ok) throw new Error(`Whisper error ${response.status}`);
    const data = await response.json();
    return data.text || "";
  },

  // ── 7. AI Copilot (Global, context-aware) ─────────────────────────────────
  // screenContext: { screen, productName, prices, wishlistCount, wishlistItems, query }
  async copilotChat(history, screenContext = {}) {
    let contextBlock = "";
    if (screenContext.screen === "ProductDetail") {
      const prices = (screenContext.prices || [])
        .map((p) => `${p.platform}: Rs.${p.price}`)
        .join(", ");
      contextBlock = `The user is currently viewing: "${screenContext.productName}". Prices: ${prices}.`;
    } else if (screenContext.screen === "Wishlist") {
      const items = (screenContext.wishlistItems || []).slice(0, 6).join(", ");
      contextBlock = `The user has ${screenContext.wishlistCount} saved items: ${items}.`;
    } else if (screenContext.screen === "Search") {
      contextBlock = `The user is browsing search results for "${screenContext.query || "groceries"}".`;
    } else if (screenContext.screen === "Home") {
      contextBlock = `The user is on the Home screen.`;
    }

    const messages = [
      {
        role: "system",
        content: `You are CompareZ's smart AI Shopping Copilot for Indian grocery shoppers. ${contextBlock}
CompareZ compares prices on Blinkit, Zepto, BigBasket, Amazon, Flipkart. Be very concise (max 3 sentences). Use Rs. Be proactive and insightful based on context.
CRITICAL RULES:
1. ONLY append the exact string [SHOW_CART] to your message if the user EXPLICITLY asks to see their cart or wishlist. Do NOT use this flag if you are just comparing their saved items to new items.
2. If you suggest NEW products for the user to buy, append the flag [SUGGEST_SEARCH: <product name>] for each product. (Example: [SUGGEST_SEARCH: Manjari Yogurt]). This creates a clickable search button in the UI.`,
      },
      ...history.slice(-10),
    ];
    return groqFetch(MODELS.fast, messages, 200);
  },
};

export default GroqService;
