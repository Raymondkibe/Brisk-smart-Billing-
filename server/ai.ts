import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedProductAI } from '../src/types/index';

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/coke|coca|fanta|sprite|pepsi|water|juice|drink|soda|tea|coffee|milk/i.test(n)) return 'Beverages';
  if (/flour|rice|sugar|salt|oil|cooking|spice|cereal|maize|beans/i.test(n)) return 'Food & Groceries';
  if (/bread|cake|bun|mandazi|scone/i.test(n)) return 'Bakery';
  if (/soap|detergent|shampoo|toothpaste|tissue/i.test(n)) return 'Personal & Home Care';
  return 'General Merchandise';
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Intelligent rule-based fallback parser for Kenyan retail inventory natural language
 * Handles complex multi-attribute phrases like:
 * "Add Brookside fresh milk 500ml at 70 shillings, buying price 60, stock 50, KCC fresh milk 500ml at 65, buying price 55, stock 30."
 */
const KNOWN_BRANDS = [
  'Brookside', 'KCC', 'New KCC', 'Fresha', 'Daima', 'Molo', 'Mount Kenya', 'Ilara', 'Kinangop',
  'Broadways', 'Festive', 'Super Loaf', 'Supa Loaf', 'Mini Bakeries', 'Kenblest',
  'Mumias', 'Kabras', 'Ndhiwa', 'Mara', 'Sony',
  'Rina', 'Elianto', 'Salit', 'Fresh Fri', 'Golden Fry', 'Top Fry', 'Avena', 'Pwani',
  'Pembe', 'Jogoo', 'Dola', 'Raha', 'Soko', 'Hostess', 'Amaize', 'Taifa', 'Ajab',
  'Coca Cola', 'Coca-Cola', 'Fanta', 'Sprite', 'Stoney', 'Keringet', 'Dasani', 'Aquamist',
  'Royco', 'Omo', 'Ariel', 'Sunlight', 'Geisha', 'Dettol', 'Colgate'
];

function extractBrand(text: string): { brand?: string; cleanedText: string } {
  for (const b of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(text)) {
      return {
        brand: b,
        cleanedText: text.replace(regex, '').trim()
      };
    }
  }
  return { cleanedText: text };
}

function parseProductsRuleBased(text: string): ExtractedProductAI[] {
  const normalized = text
    .replace(/,\s*(?=(?:buying|selling|cost|price|stock|qty|threshold|bp|sp|each)\b)/gi, ' ')
    .replace(/\s+/g, ' ');

  const segments = normalized
    .split(/[\n;]|,\s*(?=[a-zA-Z])|(?:\band\s+(?=[a-zA-Z\s]+(?:\d+\s*(?:ml|l|kg|g|litres?)|at\s+\d+)))/i)
    .map(s => s.trim())
    .filter(Boolean);

  const results: ExtractedProductAI[] = [];

  for (let rawSegment of segments) {
    let segment = rawSegment.replace(/^add\s+/i, '').trim();
    if (!segment) continue;

    // 1. Extract Buying Price
    let buyingPrice = 0;
    const bpMatch = segment.match(/(?:buying\s*price|buying|cost\s*price|cost|bp)\s*(?:is|at|of)?\s*(?:kes|ksh|shillings)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i);
    if (bpMatch) {
      buyingPrice = parseFloat(bpMatch[1].replace(/,/g, ''));
      segment = segment.replace(bpMatch[0], ' ').trim();
    }

    // 2. Extract Stock Quantity
    let stockQuantity = 50;
    const stockMatch = segment.match(/(?:initial\s*stock|stock\s*quantity|stock|qty|quantity)\s*(?:is|at|of)?\s*(\d+(?:\.\d+)?)\s*(?:bottles?|packets?|packs?|pieces?|units?|bags?|cartons?|boxes?|crates?|tins?|cans?)?/i);
    if (stockMatch) {
      stockQuantity = parseFloat(stockMatch[1]);
      segment = segment.replace(stockMatch[0], ' ').trim();
    }

    // 3. Extract Selling Price
    let sellingPrice = 0;
    const spMatch = segment.match(/(?:selling\s*price|price|at|for)\s*(?:kes|ksh|shillings)?\s*(\d+(?:,\d+)?(?:\.\d+)?)(?:\s*(?:shillings|bob|\/=))?/i)
      || segment.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:shillings|bob|\/=)/i);
    if (spMatch) {
      sellingPrice = parseFloat(spMatch[1].replace(/,/g, ''));
      segment = segment.replace(spMatch[0], ' ').trim();
    }

    // 4. Extract Size and Unit
    let sizeStr: string | undefined;
    let unit = 'piece';
    let numericSize: string | undefined;

    const sizeMatch = segment.match(/(\d+(?:\.\d+)?)\s*(ml|cl|litres?|liters?|l|kg|g|mg|packets?|bottles?|pieces?|cans?|boxes?)/i);
    if (sizeMatch) {
      numericSize = sizeMatch[1];
      let rawUnit = sizeMatch[2].toLowerCase();
      if (rawUnit.startsWith('litre') || rawUnit.startsWith('liter')) rawUnit = 'L';
      else if (rawUnit.startsWith('packet')) rawUnit = 'packet';
      else if (rawUnit.startsWith('bottle')) rawUnit = 'bottle';
      else if (rawUnit.startsWith('piece')) rawUnit = 'piece';
      unit = rawUnit;
      sizeStr = `${numericSize} ${unit}`;
      segment = segment.replace(sizeMatch[0], ' ').trim();
    }

    // 5. Extract Brand
    const { brand, cleanedText } = extractBrand(segment);
    let remainingName = cleanedText
      .replace(/shillings|bob|\/=|kes|ksh/gi, '')
      .replace(/[,;]/g, '')
      .trim();

    // 6. Clean up product name & variant
    if (!remainingName && brand) {
      remainingName = `${brand} Product`;
    }

    let productName = capitalizeWords(remainingName || 'Product');
    let variant: string | undefined;

    if (/fresh\s*milk/i.test(remainingName)) {
      variant = 'Fresh Milk';
      productName = 'Fresh Milk';
    } else if (/whole\s*milk/i.test(remainingName)) {
      variant = 'Whole Milk';
      productName = 'Whole Milk';
    } else if (/mala|fermented/i.test(remainingName)) {
      variant = 'Mala';
      productName = 'Mala Milk';
    } else if (/white\s*bread/i.test(remainingName)) {
      variant = 'White Bread';
      productName = 'White Bread';
    } else if (/brown\s*bread/i.test(remainingName)) {
      variant = 'Brown Bread';
      productName = 'Brown Bread';
    }

    let category = guessCategory(productName + ' ' + (brand || ''));
    if (/milk/i.test(productName) || /milk/i.test(rawSegment)) {
      category = 'Milk';
    }

    if (sellingPrice > 0 || productName) {
      results.push({
        name: productName,
        brand: brand ? capitalizeWords(brand) : undefined,
        variant,
        size: numericSize,
        unit: unit || 'piece',
        unit_size: sizeStr,
        selling_price: sellingPrice || 0,
        buying_price: buyingPrice,
        stock_quantity: stockQuantity,
        category,
        fractional_quantity_allowed: ['kg', 'g', 'l', 'ml'].includes(unit.toLowerCase()),
      });
    }
  }

  return results;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * 1. AI Natural Language Product Parser
 * Uses Gemini API to extract structured Kenyan retail inventory items.
 */
export async function parseProductsWithAI(naturalText: string): Promise<ExtractedProductAI[]> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Extract product inventory entries from this user message:
"${naturalText}"

Return a JSON array of objects with the following properties:
- name: string (clean product title, e.g. "Fresh Milk", "White Bread", "Sugar")
- brand: string (manufacturer/brand if mentioned, e.g. "Brookside", "KCC", "Fresha", "Daima", "Molo", "Broadways", "Mumias")
- variant: string (e.g. "Fresh Milk", "Whole Milk", "White Bread", "Brown Sugar")
- size: string (numeric size, e.g. "500", "1", "250", "400", "2")
- unit: string (one of: ml, cl, L, g, kg, mg, piece, bottle, packet, bag, pack, carton, box, dozen, crate)
- unit_size: string or null (e.g. "500 ml", "1 L", "400 g", "1 kg")
- selling_price: number (unit selling price in KES)
- buying_price: number (approximate buying price, or 0)
- stock_quantity: number (quantity or stock count, default 50 if unspecified)
- category: string (e.g. "Milk", "Bread", "Sugar", "Beverages", "Food & Groceries", "General Merchandise")
- fractional_quantity_allowed: boolean (true if sold by weight like kg/g or volume like L/ml)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                brand: { type: Type.STRING },
                variant: { type: Type.STRING },
                size: { type: Type.STRING },
                unit: { type: Type.STRING },
                unit_size: { type: Type.STRING },
                selling_price: { type: Type.NUMBER },
                buying_price: { type: Type.NUMBER },
                stock_quantity: { type: Type.NUMBER },
                category: { type: Type.STRING },
                fractional_quantity_allowed: { type: Type.BOOLEAN },
              },
              required: ['name', 'stock_quantity', 'unit', 'selling_price'],
            },
          },
        },
      });

      const rawText = response.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => ({
            ...item,
            name: capitalizeWords(item.name),
            brand: item.brand ? capitalizeWords(item.brand) : undefined,
            category: item.category || guessCategory(item.name),
          }));
        }
      }
    } catch (err: any) {
      console.warn('[AI PARSE] Gemini primary parse failed, falling back to rule-based parser:', err.message);
    }
  }

  // Robust rule-based fallback
  return parseProductsRuleBased(naturalText);
}

/**
 * 2. AI Business Insights Generator
 * Analyzes business performance metrics and generates strategic retail advice.
 */
export async function generateBusinessInsightsWithAI(data: {
  businessName: string;
  totalSales: number;
  totalTransactions: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockItems: Array<{ name: string; currentStock: number; threshold: number }>;
  expensesTotal: number;
}): Promise<{
  summary: string;
  recommendations: string[];
  stockAlertMessage: string;
  profitabilityScore: number;
}> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a Kenyan retail business intelligence expert advising the owner of "${data.businessName}".
Analyze these figures:
- Total Sales: KES ${data.totalSales.toLocaleString()}
- Total Transactions: ${data.totalTransactions}
- Top Selling Items: ${JSON.stringify(data.topProducts)}
- Low Stock Alerts: ${JSON.stringify(data.lowStockItems)}
- Total Operating Expenses: KES ${data.expensesTotal.toLocaleString()}

Provide concise, practical advice for a Kenyan shop/supermarket/retailer.
Return a JSON object with:
- summary: string (2-3 sentences overview of today's health)
- recommendations: array of 3 strings (actionable business tips, e.g. restocking, margin adjustments, popular product bundling)
- stockAlertMessage: string (direct guidance on what to restock first)
- profitabilityScore: number (1 to 100)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              stockAlertMessage: { type: Type.STRING },
              profitabilityScore: { type: Type.NUMBER },
            },
            required: ['summary', 'recommendations', 'stockAlertMessage', 'profitabilityScore'],
          },
        },
      });

      const raw = response.text?.trim();
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err: any) {
      console.warn('[AI INSIGHTS] Gemini insights error, using heuristic fallback:', err.message);
    }
  }

  // Fallback heuristics
  const netRevenue = Math.max(0, data.totalSales - data.expensesTotal);
  const score = Math.min(95, Math.max(40, Math.round((netRevenue / (data.totalSales || 1)) * 100)));
  const topNames = data.topProducts.slice(0, 3).map(p => p.name).join(', ') || 'General items';

  return {
    summary: `Business operations are steady with KES ${data.totalSales.toLocaleString()} in gross volume across ${data.totalTransactions} transactions. Fast-moving categories include ${topNames}.`,
    recommendations: [
      data.lowStockItems.length > 0
        ? `Re-order ${data.lowStockItems.length} low-stock items before weekend rush to avoid missed sales.`
        : 'Maintain inventory turnover and consider bundling high-margin items.',
      'Encourage instant M-Pesa STK push checkouts at the register to speed up queue turnaround.',
      'Audit daily supplier invoices to keep purchasing costs within 65-70% of gross retail prices.',
    ],
    stockAlertMessage: data.lowStockItems.length > 0
      ? `Priority restocking needed for: ${data.lowStockItems.map(i => i.name).join(', ')}.`
      : 'All primary inventory levels are currently above reorder thresholds.',
    profitabilityScore: score,
  };
}

/**
 * 3. AI Smart Assistant
 * Interactive dialogue with an AI retail assistant.
 */
export async function chatWithAIAssistant(
  message: string,
  businessContext: {
    businessName: string;
    productCount: number;
    todaySales: number;
  }
): Promise<string> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: `You are BRISK AI, an expert Kenyan retail assistant for "${businessContext.businessName}".
Current store metrics:
- Active products: ${businessContext.productCount}
- Today's sales volume: KES ${businessContext.todaySales}
Provide direct, concise, and helpful answers about retail operations, M-Pesa payments, KRA eTIMS VAT compliance, stock optimization, and store profitability in Kenya. Keep responses under 150 words unless detailed calculations are requested.`,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn('[AI CHAT] Gemini chat failed:', err.message);
    }
  }

  return `Hello from ${businessContext.businessName} Assistant. Currently managing ${businessContext.productCount} products with KES ${businessContext.todaySales.toLocaleString()} in sales. How can I assist you with inventory, transactions, or payment setups today?`;
}

/**
 * 4. AI Smart SMS Generator
 * Composes tailored SMS text for receipts and promotional campaigns.
 */
export async function generateSmartSmsWithAI(params: {
  businessName: string;
  customerName?: string;
  totalAmount?: number;
  saleNumber?: string;
  purpose: 'receipt' | 'promo' | 'reminder';
  extraNotes?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const name = params.customerName || 'Customer';
  const amount = params.totalAmount ? `KES ${params.totalAmount.toLocaleString()}` : '';

  if (ai) {
    try {
      const prompt = `Compose a short, warm, professional 1-segment SMS (under 140 characters) for a Kenyan business.
Business: ${params.businessName}
Customer: ${name}
Sale: ${params.saleNumber || ''}
Amount: ${amount}
Type: ${params.purpose}
Notes: ${params.extraNotes || ''}

Return only the plain text message, no quotes, no commentary.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text.trim().replace(/^["']|["']$/g, '');
      }
    } catch (err: any) {
      console.warn('[AI SMS] Gemini SMS generation failed:', err.message);
    }
  }

  // Reliable fallback templates
  if (params.purpose === 'receipt') {
    return `Thank you ${name}! Your payment of ${amount} to ${params.businessName} (${params.saleNumber || ''}) was received. Karibu tena!`;
  }
  return `Special offer from ${params.businessName}: Enjoy exclusive discounts on your favorite essentials this week. Karibu!`;
}
