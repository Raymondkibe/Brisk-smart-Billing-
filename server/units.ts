/**
 * BRISK BILLING - Measurement Units & Conversion Engine (Sections 15 & 16)
 */

export interface UnitConversionRule {
  family: 'weight' | 'volume' | 'length' | 'quantity';
  baseUnit: string; // The base canonical unit (e.g. 'kg', 'L', 'm', 'piece')
  toBaseMultiplier: Record<string, number>; // multiplier to get quantity in base unit
}

export const UNIT_FAMILIES: Record<string, UnitConversionRule> = {
  weight: {
    family: 'weight',
    baseUnit: 'kg',
    toBaseMultiplier: {
      tonne: 1000,
      kg: 1,
      g: 0.001,
      mg: 0.000001,
    },
  },
  volume: {
    family: 'volume',
    baseUnit: 'L',
    toBaseMultiplier: {
      L: 1,
      cl: 0.01,
      ml: 0.001,
    },
  },
  length: {
    family: 'length',
    baseUnit: 'm',
    toBaseMultiplier: {
      km: 1000,
      m: 1,
      cm: 0.01,
      mm: 0.001,
    },
  },
  quantity: {
    family: 'quantity',
    baseUnit: 'piece',
    toBaseMultiplier: {
      crate: 24,
      carton: 24,
      box: 12,
      dozen: 12,
      pair: 2,
      piece: 1,
      bottle: 1,
      bag: 1,
      pack: 1,
    },
  },
};

/**
 * Finds the unit family for a given unit string
 */
export function getUnitFamily(unit: string): UnitConversionRule | null {
  const clean = unit.trim().toLowerCase();
  for (const rule of Object.values(UNIT_FAMILIES)) {
    if (rule.toBaseMultiplier[clean] !== undefined) {
      return rule;
    }
  }
  return null;
}

/**
 * Converts a quantity from one unit to another within the same family.
 * Returns null if units belong to different families.
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const fromClean = fromUnit.trim().toLowerCase();
  const toClean = toUnit.trim().toLowerCase();

  if (fromClean === toClean) return quantity;

  const family = getUnitFamily(fromClean);
  if (!family || family.toBaseMultiplier[toClean] === undefined) {
    return null; // incompatible units
  }

  // Convert to base unit, then convert to target unit
  const inBase = quantity * family.toBaseMultiplier[fromClean];
  const targetMultiplier = family.toBaseMultiplier[toClean];
  return inBase / targetMultiplier;
}

/**
 * Server-side money calculation for an item with optional unit conversion:
 * Example:
 * Cooking Oil priced at KES 300 per 'L'.
 * Customer purchases 250 'ml'.
 * Returns total: KES 75 (Math.round(300 * 250 / 1000)).
 */
export function calculateItemPrice(
  sellingPricePerUnit: number,
  productBaseUnit: string,
  purchasedQuantity: number,
  purchasedUnit?: string
): { total: number; effectiveQuantityInBase: number } {
  if (!purchasedUnit || purchasedUnit.toLowerCase() === productBaseUnit.toLowerCase()) {
    // Direct multiplier
    const total = Math.round(sellingPricePerUnit * purchasedQuantity);
    return { total, effectiveQuantityInBase: purchasedQuantity };
  }

  const convertedQty = convertUnitQuantity(purchasedQuantity, purchasedUnit, productBaseUnit);
  if (convertedQty !== null) {
    const total = Math.round(sellingPricePerUnit * convertedQty);
    return { total, effectiveQuantityInBase: convertedQty };
  }

  // Default fallback if incompatible
  const total = Math.round(sellingPricePerUnit * purchasedQuantity);
  return { total, effectiveQuantityInBase: purchasedQuantity };
}
