import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedProductAI } from '../src/types';

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
 */
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
  // Pre-process: join attribute clauses that belong to the same product (e.g. ", buying price 60" or ", stock 50")
  const normalized = text
    .replace(/,\s*(?=(?:buying|selling|cost|price|stock|qty|threshold|bp|sp|each)\b)/gi, ' ')
    .replace(/\s+/g, ' ');

  // Split into product segments by comma, semicolon, newline, or "and" followed by product/brand
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
    let stockQuantity = 50; // default
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

    // Detect variant from common retail descriptors
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

    // Guess category
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

/**
 * Parses natural language input using Gemini API or rule-based fallback
 */
export async function parseProductsWithAI(naturalText: string): Promise<ExtractedProductAI[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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
        model: 'gemini-3.8-flash',
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
      console.warn('Gemini API parse failed, falling back to rule-based parser:', err.message);
    }
  }

  // Robust rule-based fallback
  return parseProductsRuleBased(naturalText);
}
