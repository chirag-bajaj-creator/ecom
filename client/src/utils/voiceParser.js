/**
 * Smart voice transcript parser.
 * Understands English, Hindi, and Hinglish speech naturally.
 *
 * Examples:
 *   "iPhone 16 Electronics ke andar price 79999 stock 50"
 *   "naam iPhone 16 category Electronics mein daal do kimat 79999"
 *   "Samsung Galaxy jo Electronics mein aata hai uska rate 69999 aur 30 piece hai"
 *   "MacBook Pro Laptops wala 129999 ka hai 20 stock"
 *   "add iPhone 16 under Electronics priced at 79999 with 50 pieces"
 *   "pehla product iPhone 16 Electronics 79999 doosra product Samsung 69999 Electronics"
 */

// ── Known category list ──
const KNOWN_CATEGORIES = [
  'electronics', 'clothing', 'home & kitchen', 'home and kitchen', 'beauty',
  'beauty & personal care', 'sports', 'sports & outdoors', 'books', 'toys',
  'toys & games', 'health', 'health & wellness', 'automotive', 'grocery',
  'groceries', 'furniture', 'jewelry', 'jewellery', 'shoes', 'footwear',
  'bags', 'bags & luggage', 'watches', 'mobile', 'mobiles', 'phones',
  'laptops', 'computers', 'appliances', 'kitchen', 'garden', 'baby',
  'pet supplies', 'office', 'office supplies', 'stationery', 'food',
  'beverages', 'fashion', 'accessories', 'gaming', 'music', 'instruments',
];

// ── Boundary words: all field-related keywords (EN + Hinglish) for lookahead ──
const BOUNDARY_WORDS = [
  'name', 'naam', 'product', 'category', 'categories', 'cat', 'vibhag', 'shreni',
  'sub\\s*category', 'sub\\s*cat', 'upcategory',
  'description', 'desc', 'details', 'about', 'baare', 'bare',
  'price', 'priced', 'cost', 'costs', 'rate', 'daam', 'dam', 'kimat', 'keemat', 'qeemat', 'mrp', 'amount', 'rs', 'rupees', 'rupay', 'rupaye',
  'stock', 'quantity', 'qty', 'maal', 'inventory',
  'next', 'agla', 'agle', 'doosra', 'dusra', 'teesra', 'tisra', 'phir', 'fir', 'aur\\s+ek',
].join('|');

const BOUNDARY_LOOKAHEAD = `(?=\\s+(?:${BOUNDARY_WORDS})(?:\\s|$)|$)`;

// ── Price patterns (EN + Hinglish) ──
const PRICE_PATTERNS = [
  /(?:price|priced|priced\s+at|costs?|costing|worth|for|mrp|amount|rate|daam|dam|kimat|keemat|qeemat|rs\.?|rupees?|rupay|rupaye|₹)\s*[₹]?\s*([\d,]+)/i,
  /[₹]([\d,]+)/,
  /([\d,]+)\s*(?:rupees?|rs\.?|₹|rupay|rupaye|ka\s+hai|ka\s+he|wala|vala)/i,
  /(?:price|priced|costs?|mrp|amount|rate|daam|dam|kimat|keemat)\s*(?:is|are|hai|he|:|=|-)?\s*([\d,]+)/i,
  /(?:iska|uska|iski|uski)\s+(?:price|rate|daam|dam|kimat|keemat)\s*(?:is|hai|he|:|=)?\s*([\d,]+)/i,
];

// ── Stock patterns (EN + Hinglish) ──
const STOCK_PATTERNS = [
  /(?:stock|quantity|qty|inventory|maal)\s*(?:is|are|hai|he|:|=|-)?\s*(\d+)/i,
  /(\d+)\s*(?:pieces?|pcs?|units?|items?|nos?|numbers?|daane?|nag)\s*(?:in\s+stock|available|left|hai|he|hain|rakho|rakh|rakhna)?/i,
  /(\d+)\s+(?:in\s+stock|stock\s+(?:mein|me|mai)|available|hai\s+stock)/i,
  /(?:stock|quantity|qty|maal)\s+(?:of|mein|me|mai)?\s*(\d+)/i,
  /(?:with|have|has|got|paas|pass)\s+(\d+)\s*(?:pieces?|pcs?|units?|items?|in\s+stock|available|hai)?/i,
  /(\d+)\s+(?:rakho|rakh|rakhna|rakh\s+do|daal\s+do|daalo)/i,
];

// ── Category patterns (EN + Hinglish) ──
const CATEGORY_PATTERNS = [
  /(?:category|categories|cat|vibhag|shreni)\s*(?:is|are|hai|he|:|=|-)?\s*(.+?)(?=\s+(?:sub\s*category|description|price|priced|costs?|rate|daam|stock|quantity|qty|name|naam|product|next|agla|doosra|aur\b|phir|fir|,)|$)/i,
  /(?:under|in|in\s+the|from|mein|me|mai|andar|ke\s+andar|ke\s+under|wala|vala|ka|ki|ke)\s+(?:the\s+)?(.+?)\s+(?:category|section|department|vibhag|mein|me|mai)/i,
  /(?:under|in|mein|me|mai|andar|ke\s+andar)\s+(?:the\s+)?(?:category|section|vibhag)\s+(.+?)(?=\s+(?:sub|desc|price|rate|stock|name|naam|product|next|agla|,)|$)/i,
  /(.+?)\s+(?:ke\s+andar|mein|me|mai|wala|vala|ka\s+hai|ki\s+category)\b/i,
];

// ── Subcategory patterns (EN + Hinglish) ──
const SUBCATEGORY_PATTERNS = [
  /(?:sub\s*category|sub\s*categories|sub-category|subcategory|sub\s*cat|upcategory)\s*(?:is|are|hai|he|:|=|-)?\s*(.+?)(?=\s+(?:description|price|priced|costs?|rate|daam|stock|quantity|qty|name|naam|product|next|agla|doosra|,)|$)/i,
  /(?:sub\s*type|subtype|type|prakar)\s*(?:is|are|hai|he|:|=|-)?\s*(.+?)(?=\s+(?:description|price|priced|costs?|rate|stock|quantity|name|naam|product|next|,)|$)/i,
];

// ── Description patterns (EN + Hinglish) ──
const DESCRIPTION_PATTERNS = [
  /(?:description|desc|details?|about|info|baare\s+mein|bare\s+mein|ke\s+baare|ke\s+bare|jankari|jaankari)\s*(?:is|are|hai|he|:|=|-)?\s*(.+?)(?=\s+(?:price|priced|costs?|rate|daam|stock|quantity|qty|category|sub\s*category|name|naam|product|next|agla|,)|$)/i,
];

// ── Name patterns (EN + Hinglish) ──
const NAME_PATTERNS = [
  /(?:product\s*name|product\s*ka\s*naam|product|name|naam|title|item|called|named|cheez|chij|saamaan|samaan)\s*(?:is|are|hai|he|:|=|-)?\s*(.+?)(?=\s+(?:description|desc|details?|about|baare|category|vibhag|sub\s*category|price|priced|costs?|rate|daam|dam|kimat|stock|quantity|qty|maal|under|in\s+the|from|mein|me|mai|andar|ke\s+andar|wala|vala|,)|$)/i,
];

// ── Product split patterns (EN + Hinglish) ──
const PRODUCT_SPLIT_PATTERNS = [
  /\b(?:next\s+product|next\s+item|another\s+product|another\s+item|also\s+add|and\s+also|second\s+product|third\s+product|then)\b/i,
  /\b(?:agla\s+product|agle\s+product|agla\s+item|doosra\s+product|dusra\s+product|doosra|dusra|teesra\s+product|tisra\s+product|teesra|tisra|pehla\s+product|phir|fir|aur\s+ek|ek\s+aur|uske\s+baad)\b/i,
];

// ── Filler words to strip when inferring name (EN + Hinglish) ──
const FILLER_REGEX = /\b(add|product|item|please|i\s+want|create|new|the|a|an|is|are|and|with|also|it|its|this|that|my|has|have|got|put|set|make|let|be|to|of|for|on|at|by|so|but|or|if|mein|me|mai|andar|ke|ka|ki|hai|he|hain|wala|vala|ek|do|daal|daalo|rakh|rakho|mera|meri|mere|ye|yeh|wo|woh|jo|aur|bhi|toh|to|se|pe|par|nahi|nhi|karo|kro|kar|krdo|krna)\b/gi;

function extractPrice(text) {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].replace(/,/g, '');
  }
  return '';
}

function extractStock(text) {
  for (const pattern of STOCK_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractCategory(text) {
  // First try known categories anywhere in text
  const lower = text.toLowerCase();
  for (const cat of KNOWN_CATEGORIES) {
    const regex = new RegExp(`\\b${cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      const match = text.match(regex);
      return match ? match[0] : cat;
    }
  }
  // Then try patterns
  for (const pattern of CATEGORY_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function extractSubcategory(text) {
  for (const pattern of SUBCATEGORY_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function extractDescription(text) {
  for (const pattern of DESCRIPTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function extractName(text) {
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

/**
 * Infer the product name from leftover text after stripping all recognized fields.
 */
function inferName(text) {
  let remaining = text;

  // Remove all pattern matches
  const allPatterns = [
    ...PRICE_PATTERNS, ...STOCK_PATTERNS, ...CATEGORY_PATTERNS,
    ...SUBCATEGORY_PATTERNS, ...DESCRIPTION_PATTERNS, ...NAME_PATTERNS,
  ];
  for (const pattern of allPatterns) {
    remaining = remaining.replace(pattern, ' ');
  }

  // Remove known category names
  for (const cat of KNOWN_CATEGORIES) {
    const regex = new RegExp(`\\b${cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    remaining = remaining.replace(regex, ' ');
  }

  // Remove filler words
  remaining = remaining.replace(FILLER_REGEX, ' ');

  // Remove standalone numbers
  remaining = remaining.replace(/\b\d+\b/g, ' ');

  // Clean up punctuation and whitespace
  remaining = remaining.replace(/[,;.!?]+/g, ' ').replace(/\s+/g, ' ').trim();

  return remaining;
}

function parseSingleProduct(text) {
  const result = { name: '', description: '', category: '', subcategory: '', price: '', stock: '', image: '' };
  const normalized = text.replace(/\s+/g, ' ').trim();

  result.price = extractPrice(normalized);
  result.stock = extractStock(normalized);
  result.category = extractCategory(normalized);
  result.subcategory = extractSubcategory(normalized);
  result.description = extractDescription(normalized);
  result.name = extractName(normalized);

  if (!result.name) {
    result.name = inferName(normalized);
  }

  // Capitalize first letter
  if (result.name) result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1);
  if (result.category) result.category = result.category.charAt(0).toUpperCase() + result.category.slice(1);

  return result;
}

/**
 * Split transcript into product segments using EN + Hinglish separators.
 */
function splitIntoProducts(text) {
  let segments = [text];

  // Split on explicit separators
  for (const pattern of PRODUCT_SPLIT_PATTERNS) {
    const newSegments = [];
    for (const seg of segments) {
      const parts = seg.split(pattern).map(s => s.trim()).filter(Boolean);
      newSegments.push(...parts);
    }
    segments = newSegments;
  }

  // Further split on "name/naam" keyword reappearance
  const nameKeywords = ['product\\s+name', 'product\\s+ka\\s+naam', 'product', 'naam', 'name', 'title', 'item', 'called', 'named', 'cheez', 'saamaan'];
  const nameSplitRegex = new RegExp(
    `(?=\\b(?:${nameKeywords.join('|')})\\s*(?:is|are|hai|he|:|=|-)?\\s+\\S)`,
    'gi'
  );

  const finalSegments = [];
  for (const seg of segments) {
    const parts = seg.split(nameSplitRegex).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      finalSegments.push(...parts);
    } else {
      finalSegments.push(seg);
    }
  }

  return finalSegments.length > 0 ? finalSegments : [text];
}

/**
 * Main parser: handles English, Hindi, and Hinglish speech.
 * Returns array of product objects.
 */
export function parseVoiceTranscript(transcript) {
  const text = transcript.replace(/\s+/g, ' ').trim();
  if (!text) return [{ name: '', description: '', category: '', subcategory: '', price: '', stock: '', image: '' }];

  const segments = splitIntoProducts(text);
  return segments.map(seg => parseSingleProduct(seg));
}
