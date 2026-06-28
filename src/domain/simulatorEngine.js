import {
  ENTITY_STATUS,
  RATING_RULES,
  REAL_ESTATE_EXPOSURE_RULES,
  PRODUCT_TYPES,
  CONSTRUCTION_INSURER_RATING_RULES,
  CONSTRUCTION_RISK_WEIGHT_TABLE,
  CONSTRUCTION_SALES_SCENARIOS,
  CONSTRUCTION_CREDIT_PRODUCT_TYPES,
} from "./riskParameters.js";

export {
  ENTITY_STATUS,
  RATING_RULES,
  REAL_ESTATE_EXPOSURE_RULES,
  PRODUCT_TYPES,
  CONSTRUCTION_INSURER_RATING_RULES,
  CONSTRUCTION_RISK_WEIGHT_TABLE,
  CONSTRUCTION_SALES_SCENARIOS,
  CONSTRUCTION_CREDIT_PRODUCT_TYPES,
} from "./riskParameters.js";

export const SEGMENTS = {
  corporate: "תאגיד עסקי",
  sme: "SME / עסק קטן",
  realestate: "נדל״ן / LTV",
  project: "מימון פרויקט / Specialized lending",
  bank: "בנק / מוסד פיננסי",
  pse: "PSE / גוף ציבורי מוכר",
  municipality: "רשות מקומית",
};

export const INFRA_CURRENCIES = {
  ILS: { label: "ש״ח", symbol: "₪", fxToIls: 1, lastKnownRate: 1, lastKnownDate: "" },
  USD: { label: "דולר", symbol: "$", fxToIls: 2.859, lastKnownRate: 2.859, lastKnownDate: "26/05/2026" },
  EUR: { label: "יורו", symbol: "€", fxToIls: 3.3263, lastKnownRate: 3.3263, lastKnownDate: "26/05/2026" },
};

export function getInfraFxRate(currencyCode, productFxRate) {
  const currency = INFRA_CURRENCIES[currencyCode] || INFRA_CURRENCIES.ILS;
  if (currencyCode === "ILS") return 1;
  const manualRate = Number(productFxRate);
  return Number.isFinite(manualRate) && manualRate > 0 ? manualRate : currency.lastKnownRate;
}

export function convertIlsToInfraCurrency(amountIls, currencyCode) {
  const rate = getInfraFxRate(currencyCode, INFRA_CURRENCIES[currencyCode]?.lastKnownRate || 1);
  return rate > 0 ? amountIls / rate : amountIls;
}

export const INFRA_PRODUCT_TYPES = {
  infraLongTermLoan: {
    label: "הלוואת ט״א",
    incomeMode: "interest",
    isLoan: true,
    isPhasedLoan: false,
    defaultCcf: 100,
    defaultCcfUndrawn: 40,
    note: "הלוואה ארוכה לפרויקט, עם לוח סילוקין ותקופה.",
  },
  infraPhasedLoan: {
    label: "הלוואה בפעימות",
    incomeMode: "interest",
    isLoan: true,
    isPhasedLoan: true,
    defaultCcf: 100,
    defaultCcfUndrawn: 40,
    note: "הלוואה מיוחדת שמועמדת עד 8 פעימות, בתדירות רבעונית או שנתית.",
  },
  infraShortTermLoan: {
    label: "הלוואת ט״ק",
    incomeMode: "interest",
    isLoan: true,
    isPhasedLoan: false,
    defaultCcf: 100,
    defaultCcfUndrawn: 40,
    note: "הלוואה קצרה/גישור בתקופת הקמה או עד closing פיננסי.",
  },
  infraPerformanceGuarantee: {
    label: "ערבות ביצוע",
    incomeMode: "feeRate",
    isLoan: false,
    isPhasedLoan: false,
    defaultCcf: 50,
    note: "מוצר עמלה: ההכנסה מחושבת לפי סכום הערבות × שיעור עמלה.",
  },
  infraFinancialGuarantee: {
    label: "ערבות כספית",
    incomeMode: "feeRate",
    isLoan: false,
    isPhasedLoan: false,
    isGuaranteeFacility: false,
    defaultCcf: 100,
    note: "ערבות בעלת אופי פיננסי. ההכנסה מחושבת לפי שיעור עמלה ולא מרווח.",
  },
  infraGuaranteeFacility: {
    label: "מסגרת ערבויות פוחתת",
    incomeMode: "feeRate",
    isLoan: false,
    isPhasedLoan: false,
    isGuaranteeFacility: true,
    defaultCcf: 50,
    defaultCcfUndrawn: 20,
    note: "מסגרת ערבויות לפרויקט שבה המסגרת פוחתת לאורך תקופת ההקמה. ה-EAD מחושב על החלק המנוצל ועל החלק הלא מנוצל לפי CCF נפרדים.",
  },
  infraDerivatives: {
    label: "פעילות נגזרים",
    incomeMode: "feeRate",
    isLoan: false,
    isPhasedLoan: false,
    defaultCcf: 100,
    note: "פעילות נגזרים בפרויקט. במוקאפ ההכנסה מחושבת לפי שיעור עמלה/מרווח על סכום החשיפה; בפועל נדרש חישוב EAD ייעודי.",
  },
};

export const INFRA_PRODUCT_STAGES = {
  construction: { label: "מוצרי אשראי בהקמה", shortLabel: "הקמה", tone: "orange" },
  rampUp: { label: "מוצרי אשראי בהרצה", shortLabel: "הרצה", tone: "sky" },
  operation: { label: "מוצרי אשראי בהפעלה", shortLabel: "הפעלה", tone: "green" },
};

export const INFRA_FEE_TIMING_OPTIONS = {
  oneTimeFirstYear: { label: "חד פעמית בתחילת הפרויקט" },
  fullProjectAnnual: { label: "שנתית לאורך חיי הפרויקט" },
  constructionAnnual: { label: "שנתית בתקופת ההקמה" },
  rampUpAnnual: { label: "שנתית בתקופת ההרצה" },
};

export const INFRA_PULSE_FIELDS = Array.from({ length: 8 }, (_, index) => ({
  field: `pulse${index + 1}Pct`,
  label: `פעימה ${index + 1}, %`,
}));

export const DEFAULT_INFRA_PULSE_PCT = 12.5;

export const INFRA_GUARANTEE_FRAME_FIELDS = Array.from({ length: 8 }, (_, index) => ({
  field: `guaranteeFrameYear${index + 1}Pct`,
  label: `שנה ${index + 1}, % מהמסגרת`,
}));

export const DEFAULT_INFRA_GUARANTEE_FRAME_PCTS = [100, 90, 75, 60, 45, 30, 15, 0];

export const INFRA_FEE_TYPES = {
  arrangement: { label: "עמלת ארגון", timing: "year1", allowPct: true },
  upfront1: { label: "UP FRONT 1", timing: "spread", allowPct: false },
  upfront2: { label: "UP FRONT 2", timing: "spread", allowPct: false },
  constructionAnnual: { label: "עמלת פרויקט בתקופת הקמה", timing: "construction", allowPct: true },
  operationAnnual: { label: "עמלת פרויקט בתקופת הפעלה", timing: "operation", allowPct: true },
};

export const INFRA_GUARANTOR_RATING_RULES = {
  aaaToAa: { label: "AAA עד AA-", riskWeight: 20, eligible: true },
  a: { label: "A+ עד A-", riskWeight: 30, eligible: true },
  bbb: { label: "BBB+ עד BBB-", riskWeight: 50, eligible: true },
  bb: { label: "BB+ עד BB-", riskWeight: 100, eligible: true },
  bAndBelow: { label: "B+ ומטה", riskWeight: 150, eligible: false },
  unrated: { label: "לא מדורג", riskWeight: 100, eligible: false },
};

export const SECURITY_RATING_HAIRCUTS = {
  govBondLocal: {
    aaaToAa: { haircut: 1, eligible: true },
    a: { haircut: 2, eligible: true },
    bbb: { haircut: 4, eligible: true },
    bb: { haircut: 8, eligible: true },
    bAndBelow: { haircut: 100, eligible: false },
    unrated: { haircut: 100, eligible: false },
  },
  govBondForeign: {
    aaaToAa: { haircut: 2, eligible: true },
    a: { haircut: 4, eligible: true },
    bbb: { haircut: 8, eligible: true },
    bb: { haircut: 15, eligible: true },
    bAndBelow: { haircut: 100, eligible: false },
    unrated: { haircut: 100, eligible: false },
  },
  corpBondRated: {
    aaaToAa: { haircut: 8, eligible: true },
    a: { haircut: 10, eligible: true },
    bbb: { haircut: 15, eligible: true },
    bb: { haircut: 25, eligible: true },
    bAndBelow: { haircut: 100, eligible: false },
    unrated: { haircut: 100, eligible: false },
  },
  bankBondRated: {
    aaaToAa: { haircut: 6, eligible: true },
    a: { haircut: 8, eligible: true },
    bbb: { haircut: 12, eligible: true },
    bb: { haircut: 20, eligible: true },
    bAndBelow: { haircut: 100, eligible: false },
    unrated: { haircut: 100, eligible: false },
  },
};

export function requiresSecurityRating(securityType) {
  return Boolean(SECURITY_RATING_HAIRCUTS[securityType]);
}

export function getSecurityRatingRule(securityType, rating) {
  const matrix = SECURITY_RATING_HAIRCUTS[securityType];
  if (!matrix) return null;
  return matrix[rating || "unrated"] || matrix.unrated;
}

export const SECURITY_RULES = {
  cashDeposit: {
    label: "פיקדון שקלי משועבד",
    eligible: true,
    haircut: 0,
    note: "כשיר רק אם קיים שעבוד תקף ושליטה משפטית מלאה, ובדרך כלל כאשר אין פער מטבע מול החשיפה.",
  },
  fxCashDeposit: {
    label: "פיקדון מט״ח משועבד",
    eligible: true,
    haircut: 10,
    allowCurrencyMismatch: true,
    note: "Haircut דוגמה של 10% לפער מטבע. יש לאמת מול טבלת הפרמטרים המאושרת; בנב״ת 203 מופיע HFX supervisory של 8% לפני התאמות scaling.",
  },
  govBondLocal: {
    label: "אג״ח ממשלת ישראל / מדינה כשירה",
    eligible: true,
    haircut: 2,
    note: "Haircut לדוגמה בלבד. בפועל יש לקבוע לפי מח״מ, מטבע והוראות פנימיות.",
  },
  govBondForeign: {
    label: "אג״ח ממשלתית זרה כשירה",
    eligible: true,
    haircut: 4,
    note: "דורש בדיקת מדינה, מטבע, דירוג ומח״מ.",
  },
  bankBondRated: {
    label: "אג״ח בנקאי מדורג",
    eligible: true,
    haircut: 8,
    note: "דורש דירוג, סחירות, התאמת מטבע ומח״מ.",
  },
  corpBondRated: {
    label: "אג״ח קונצרני מדורג וסחיר",
    eligible: true,
    haircut: 12,
    note: "כשירות תלויה בדירוג, סחירות, ריכוזיות ומדיניות הבנק.",
  },
  equityIndex: {
    label: "מניה במדד מרכזי / סל סחיר",
    eligible: true,
    haircut: 15,
    note: "כשירות להדגמה בלבד; דורש בדיקה לפי רשימת ני״ע מוכרים.",
  },
  fund: {
    label: "קרן נאמנות / ETF",
    eligible: true,
    haircut: 20,
    note: "דורש look-through או כלל פנימי לגבי הרכב הקרן.",
  },
  unratedBond: {
    label: "אג״ח לא מדורג",
    eligible: false,
    haircut: 100,
    note: "לא מוכר בדוגמה עד לבדיקה פרטנית.",
  },
  privateSecurity: {
    label: "ני״ע לא סחיר / מניה פרטית",
    eligible: false,
    haircut: 100,
    note: "לא מוכר כבטוחה פיננסית כשירה בדוגמה.",
  },
};

export const TEST_CASES = [
  {
    name: "base case with collateral",
    input: {
      exposure: 50,
      margin: 2.2,
      riskWeight: 100,
      collateral: 25,
      guarantee: 0,
      ccf: 40,
      undrawn: 20,
      capitalRatio: 12.5,
    },
    expected: {
      ead: 58,
      rwaBase: 58,
      rwaAfter: 33,
      capitalSaving: 3.125,
    },
  },
  {
    name: "zero undrawn and full collateral floor",
    input: {
      exposure: 10,
      margin: 2,
      riskWeight: 100,
      collateral: 50,
      guarantee: 0,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      ead: 10,
      rwaBase: 10,
      rwaAfter: 0,
      capitalSaving: 1,
    },
  },
  {
    name: "guarantee replaces borrower risk weight with 20 percent proxy",
    input: {
      exposure: 100,
      margin: 3,
      riskWeight: 100,
      collateral: 0,
      guarantee: 40,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      ead: 100,
      eligibleGuarantee: 40,
      guaranteeRwaSaving: 32,
      rwaBase: 100,
      rwaAfter: 68,
      capitalSaving: 3.2,
    },
  },
  {
    name: "guarantee is capped by remaining exposure after collateral",
    input: {
      exposure: 100,
      margin: 3,
      riskWeight: 100,
      collateral: 70,
      guarantee: 60,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      eligibleCollateral: 70,
      eligibleGuarantee: 30,
      rwaAfter: 6,
      guaranteeRwaSaving: 24,
      capitalSaving: 9.4,
    },
  },
  {
    name: "PSE preferred risk weight is applied",
    input: {
      exposure: 100,
      margin: 2,
      riskWeight: 100,
      regulatoryRiskWeight: 50,
      collateral: 0,
      guarantee: 0,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      ead: 100,
      rwaBase: 100,
      rwaAfter: 50,
      capitalSaving: 5,
    },
  },
  {
    name: "existing plus new deal aggregation",
    input: {
      exposure: 30,
      margin: 2,
      riskWeight: 100,
      collateral: 0,
      guarantee: 0,
      ccf: 50,
      undrawn: 10,
      capitalRatio: 10,
      existingEad: 100,
      existingRwa: 80,
      existingAnnualIncome: 3,
    },
    expected: {
      totalEadAfterNewDeal: 135,
      totalRwaAfterNewDeal: 115,
      incrementalRwa: 35,
    },
  },
  {
    name: "eligible securities collateral is added after haircut",
    input: {
      exposure: 100,
      margin: 2,
      riskWeight: 100,
      collateral: 0,
      securitiesCollateralEligibleValue: 49,
      guarantee: 0,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      totalFinancialCollateral: 49,
      eligibleCollateral: 49,
      rwaAfter: 51,
      capitalSaving: 4.9,
    },
  },
  {
    name: "new product popup aggregates EAD by utilized and undrawn CCF",
    input: {
      exposure: 70,
      productEad: 94,
      margin: 2,
      riskWeight: 100,
      collateral: 0,
      guarantee: 0,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      ead: 94,
      rwaAfter: 94,
      capitalAfter: 9.4,
      annualIncome: 1.4,
    },
  },
  {
    name: "additional deposit and fee income increases annual income without increasing EAD",
    input: {
      exposure: 100,
      productEad: 100,
      productAnnualIncome: 2,
      additionalAnnualIncome: 0.8,
      margin: 2,
      riskWeight: 100,
      collateral: 0,
      guarantee: 0,
      ccf: 0,
      undrawn: 0,
      capitalRatio: 10,
    },
    expected: {
      ead: 100,
      annualIncome: 2.8,
      rwaAfter: 100,
      roracAfter: 28,
      returnOnRwaAfter: 2.8,
    },
  },
];

export function clampNumber(value, min, max) {
  const n = parseFormattedNumber(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function parseFormattedNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (normalized === "") return NaN;
  return Number(normalized);
}

export function formatInputNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = parseFormattedNumber(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function formatYearsFromMonths(months) {
  const years = (parseFormattedNumber(months) || 0) / 12;
  const formatted = Number.isInteger(years) ? years.toFixed(0) : years.toFixed(1);
  return `${formatted} שנים`;
}

export function formatK(value) {
  return `₪${Math.round(Number(value || 0)).toLocaleString("en-US")}k`;
}

export function formatM(value, decimals = 1) {
  return `₪${(Number(value || 0) / 1000).toFixed(decimals)}m`;
}

export function isInterestBearingProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.incomeMode === "interest";
}

export function isLongTermLoanProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.loanTermMode === "long";
}

export function isRiskSaleProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.incomeMode === "riskTransfer";
}

export function calculateLoanMonthlyBalances(principal, termMonths, amortizationType, annualRate) {
  const p = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.round(Number(termMonths) || 1));
  const monthsToMeasure = Math.min(12, n);
  if (p <= 0) return [];

  if (amortizationType === "grace") {
    return Array.from({ length: monthsToMeasure }, () => p);
  }

  const balances = [];
  let balance = p;

  if (amortizationType === "spitzer") {
    const monthlyRate = Math.max(0, Number(annualRate) || 0) / 100 / 12;
    const payment = monthlyRate > 0 ? (p * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n)) : p / n;
    for (let month = 0; month < monthsToMeasure; month += 1) {
      balances.push(balance);
      const interest = balance * monthlyRate;
      const principalPayment = Math.max(0, payment - interest);
      balance = Math.max(0, balance - principalPayment);
    }
  } else {
    const principalPayment = p / n;
    for (let month = 0; month < monthsToMeasure; month += 1) {
      balances.push(balance);
      balance = Math.max(0, balance - principalPayment);
    }
  }

  return balances;
}

export function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function calculateAverageLoanBalance(principal, termMonths, amortizationType, annualRate) {
  return average(calculateLoanMonthlyBalances(principal, termMonths, amortizationType, annualRate));
}

export function calculateSyndicationEffect(monthlyBalances, saleEnabled, saleMonth, salePct, buyerSpread) {
  const balances = monthlyBalances.length > 0 ? monthlyBalances : [0];
  const month = clampNumber(saleMonth || 12, 1, 12);
  const pct = clampNumber(salePct || 0, 0, 100) / 100;
  const spread = Math.max(0, Number(buyerSpread) || 0);

  if (!saleEnabled || pct <= 0) {
    return {
      retainedAverageExposure: average(balances),
      soldAverageExposure: 0,
      salePct: pct * 100,
      saleMonth: month,
      buyerSpread: spread,
      annualSyndicationCost: 0,
    };
  }

  const retainedBalances = balances.map((balance, index) => (index + 1 >= month ? balance * (1 - pct) : balance));
  const soldBalances = balances.map((balance, index) => (index + 1 >= month ? balance * pct : 0));
  const soldAverageExposure = average(soldBalances);

  return {
    retainedAverageExposure: average(retainedBalances),
    soldAverageExposure,
    salePct: pct * 100,
    saleMonth: month,
    buyerSpread: spread,
    annualSyndicationCost: soldAverageExposure * (spread / 100),
  };
}

export function getEffectiveRiskWeight(input) {
  const manualRiskWeight = Math.max(0, Number(input.riskWeight) || 0);
  const regulatoryRiskWeight = input.regulatoryRiskWeight;
  const ratingRiskWeight = input.ratingRiskWeight;
  const realEstateRiskWeight = input.realEstateRiskWeight;

  if (realEstateRiskWeight !== null && realEstateRiskWeight !== undefined && realEstateRiskWeight !== "") {
    return Math.max(0, Number(realEstateRiskWeight) || 0);
  }

  if (regulatoryRiskWeight !== null && regulatoryRiskWeight !== undefined && regulatoryRiskWeight !== "") {
    return Math.max(0, Number(regulatoryRiskWeight) || 0);
  }

  if (ratingRiskWeight !== null && ratingRiskWeight !== undefined && ratingRiskWeight !== "") {
    return Math.max(0, Number(ratingRiskWeight) || 0);
  }

  return manualRiskWeight;
}

export function calculateProductRows(products) {
  const rows = (products || []).map((product) => {
    const rule = PRODUCT_TYPES[product.productType] || PRODUCT_TYPES.cashCredit;
    const isRiskSale = isRiskSaleProduct(product.productType);
    const isLoan = Boolean(rule.isLoan);
    const isStandaloneLoan = isLoan && product.facilityMode === "standalone";
    const limit = isRiskSale ? 0 : Math.max(0, Number(product.limit) || 0);
    const expectedUtilizationPct = isStandaloneLoan ? 100 : clampNumber(product.expectedUtilizationPct, 0, 100);
    const utilizedAmount = isStandaloneLoan ? limit : limit * (expectedUtilizationPct / 100);
    const undrawnAmount = isStandaloneLoan ? 0 : Math.max(0, limit - utilizedAmount);
    const ccfUtilized = clampNumber(product.ccfUtilized, 0, 100);
    const ccfUndrawn = clampNumber(product.ccfUndrawn, 0, 100);
    const isInterestBearing = isInterestBearingProduct(product.productType);
    const isLongTermLoan = isLongTermLoanProduct(product.productType);
    const margin = isInterestBearing ? Math.max(0, Number(product.margin) || 0) : 0;
    const feeRate = !isInterestBearing && !isRiskSale ? Math.max(0, Number(product.feeRate ?? product.margin) || 0) : 0;
    const enteredTermMonths = isLongTermLoan ? product.termMonths ?? 60 : null;
    const termMonthsForCalc = isLongTermLoan ? Math.max(12, Math.round(Number(enteredTermMonths) || 60)) : null;
    const amortizationType = isLongTermLoan ? product.amortizationType || "equalPrincipal" : null;
    const monthlyBalances = isLongTermLoan
      ? calculateLoanMonthlyBalances(utilizedAmount, termMonthsForCalc, amortizationType, margin)
      : Array.from({ length: 12 }, () => utilizedAmount);
    const syndication = calculateSyndicationEffect(
      monthlyBalances,
      Boolean(product.syndicationEnabled),
      product.syndicationSaleMonth,
      product.syndicationSalePct,
      product.syndicationBuyerSpread
    );
    const rwaUtilizedExposure = syndication.retainedAverageExposure;
    const utilizedEad = rwaUtilizedExposure * (ccfUtilized / 100);
    const undrawnEad = undrawnAmount * (ccfUndrawn / 100);
    const riskSaleSaleAmount = isRiskSale ? Math.max(0, Number(product.riskSaleSaleAmount ?? product.riskSaleRwaAmount) || 0) : 0;
    const riskSaleBuyerPrice = isRiskSale ? Math.max(0, Number(product.riskSaleBuyerPrice ?? product.riskSaleSpread) || 0) : 0;
    const riskSaleAfterMonths = isRiskSale ? clampNumber(product.riskSaleAfterMonths ?? 0, 0, 12) : 0;
    const riskSaleActiveMonths = isRiskSale ? Math.max(0, 12 - riskSaleAfterMonths) : 0;
    const riskSaleYearFactor = riskSaleActiveMonths / 12;
    const riskSaleRwaReduction = riskSaleSaleAmount * riskSaleYearFactor;
    const riskSaleSpread = riskSaleBuyerPrice;
    const riskSaleCost = riskSaleSaleAmount * (riskSaleBuyerPrice / 100) * riskSaleYearFactor;
    const ead = isRiskSale ? 0 : utilizedEad + undrawnEad;
    const grossAnnualIncome = isInterestBearing ? utilizedAmount * (margin / 100) : feeRate > 0 ? limit * (feeRate / 100) : 0;
    const annualIncome = isRiskSale ? -riskSaleCost : Math.max(0, grossAnnualIncome - syndication.annualSyndicationCost);

    return {
      ...product,
      ruleLabel: rule.label,
      ruleNote: rule.note,
      limit,
      expectedUtilizationPct,
      utilizedAmount,
      undrawnAmount,
      ccfUtilized,
      ccfUndrawn,
      margin,
      feeRate,
      isInterestBearing,
      isLoan,
      isStandaloneLoan,
      isLongTermLoan,
      isRiskSale,
      termMonths: enteredTermMonths,
      termMonthsForCalc,
      amortizationType,
      monthlyBalances,
      rwaUtilizedExposure,
      syndicationEnabled: Boolean(product.syndicationEnabled),
      syndicationSaleMonth: syndication.saleMonth,
      syndicationSalePct: syndication.salePct,
      syndicationBuyerSpread: syndication.buyerSpread,
      syndicationSoldAverageExposure: syndication.soldAverageExposure,
      syndicationCost: syndication.annualSyndicationCost,
      riskSaleSaleAmount,
      riskSaleBuyerPrice,
      riskSaleAfterMonths,
      riskSaleActiveMonths,
      riskSaleYearFactor,
      riskSaleRwaReduction,
      riskSaleSpread,
      riskSaleCost,
      grossAnnualIncome,
      utilizedEad,
      undrawnEad,
      ead,
      annualIncome,
    };
  });

  const totalLimit = rows.reduce((sum, row) => sum + row.limit, 0);
  const totalUtilized = rows.reduce((sum, row) => sum + row.utilizedAmount, 0);
  const totalUndrawn = rows.reduce((sum, row) => sum + row.undrawnAmount, 0);
  const totalEad = rows.reduce((sum, row) => sum + row.ead, 0);
  const totalRiskSaleSaleAmount = rows.reduce((sum, row) => sum + row.riskSaleSaleAmount, 0);
  const totalRiskSaleRwaReduction = rows.reduce((sum, row) => sum + row.riskSaleRwaReduction, 0);
  const totalRiskSaleCost = rows.reduce((sum, row) => sum + row.riskSaleCost, 0);
  const totalAnnualIncome = rows.reduce((sum, row) => sum + row.annualIncome, 0);
  const totalSyndicationSoldExposure = rows.reduce((sum, row) => sum + row.syndicationSoldAverageExposure, 0);
  const totalSyndicationCost = rows.reduce((sum, row) => sum + row.syndicationCost, 0);
  const weightedCcfUtilized = totalUtilized > 0 ? rows.reduce((sum, row) => sum + row.utilizedAmount * row.ccfUtilized, 0) / totalUtilized : 0;
  const weightedCcfUndrawn = totalUndrawn > 0 ? rows.reduce((sum, row) => sum + row.undrawnAmount * row.ccfUndrawn, 0) / totalUndrawn : 0;
  const interestBearingUtilized = rows.filter((row) => row.isInterestBearing).reduce((sum, row) => sum + row.utilizedAmount, 0);
  const feeIncome = rows.filter((row) => !row.isInterestBearing && !row.isRiskSale).reduce((sum, row) => sum + row.annualIncome, 0);
  const weightedMargin = interestBearingUtilized > 0 ? rows.filter((row) => row.isInterestBearing).reduce((sum, row) => sum + row.utilizedAmount * row.margin, 0) / interestBearingUtilized : 0;

  return {
    rows,
    totalLimit,
    totalUtilized,
    totalUndrawn,
    totalEad,
    totalAnnualIncome,
    totalRiskSaleSaleAmount,
    totalRiskSaleRwaReduction,
    totalRiskSaleCost,
    totalSyndicationSoldExposure,
    totalSyndicationCost,
    feeIncome,
    weightedCcfUtilized,
    weightedCcfUndrawn,
    weightedMargin,
  };
}

export function calculateMonthlyCreditForecast(productRows, effectiveRiskWeight = 100) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const activeRows = (productRows || []).filter((row) => !row.isRiskSale);
    const limit = activeRows.reduce((sum, row) => sum + row.limit, 0);
    const utilized = activeRows.reduce((sum, row) => {
      if (row.isLongTermLoan) {
        const balance = row.monthlyBalances?.[index];
        return sum + (Number.isFinite(balance) ? balance : row.utilizedAmount);
      }
      return sum + row.utilizedAmount;
    }, 0);
    const ead = activeRows.reduce((sum, row) => {
      const utilizedBase = row.isLongTermLoan ? (row.monthlyBalances?.[index] ?? row.utilizedAmount) : row.utilizedAmount;
      const utilizedEad = utilizedBase * ((Number(row.ccfUtilized) || 0) / 100);
      const undrawnEad = row.undrawnAmount * ((Number(row.ccfUndrawn) || 0) / 100);
      return sum + utilizedEad + undrawnEad;
    }, 0);
    const scheduledRiskSaleReduction = (productRows || [])
      .filter((row) => row.isRiskSale)
      .reduce((sum, row) => {
        const saleApplies = index + 1 > Number(row.riskSaleAfterMonths || 0);
        return sum + (saleApplies ? row.riskSaleSaleAmount : 0);
      }, 0);
    const rwaBeforeSale = ead * (Math.max(0, Number(effectiveRiskWeight) || 0) / 100);
    const rwa = Math.max(0, rwaBeforeSale - scheduledRiskSaleReduction);

    return {
      month: `חודש ${month}`,
      limit: Number(limit.toFixed(0)),
      utilized: Number(utilized.toFixed(0)),
      gap: Number(Math.max(0, limit - utilized).toFixed(0)),
      rwa: Number(rwa.toFixed(0)),
    };
  });
}

export function getInfraProductStageStartYear(product, constructionYears, rampUpYears) {
  const stage = product.stage || "construction";
  if (stage === "rampUp") return Math.max(1, Math.round(Number(constructionYears) || 0) + 1);
  if (stage === "operation") return Math.max(1, Math.round(Number(constructionYears) || 0) + Math.round(Number(rampUpYears) || 0) + 1);
  return 1;
}

export function getInfraProductDrawdownPct(product, year, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  if (relativeYear < 1) return 0;

  const rule = INFRA_PRODUCT_TYPES[product.productType] || INFRA_PRODUCT_TYPES.infraLongTermLoan;

  if (rule.isPhasedLoan) {
    const pulses = INFRA_PULSE_FIELDS.map(({ field }) => Number(product[field] ?? 0) || 0);
    const frequency = product.pulseFrequency || "annual";
    if (frequency === "quarterly") {
      const firstPulseIndex = (relativeYear - 1) * 4;
      const yearPulses = pulses.slice(firstPulseIndex, firstPulseIndex + 4);
      return yearPulses.reduce((sum, pct) => sum + pct, 0) / 100;
    }
    if (relativeYear >= 1 && relativeYear <= pulses.length) return pulses[relativeYear - 1] / 100;
    return 0;
  }

  return relativeYear === 1 ? 1 : 0;
}

export function getInfraPhasedLoanFinalPulseYear(product) {
  const pulses = INFRA_PULSE_FIELDS.map(({ field }) => Number(product[field] ?? 0) || 0);
  const lastPulseIndex = pulses.reduce((lastIndex, pct, index) => (pct > 0 ? index : lastIndex), -1);
  if (lastPulseIndex < 0) return 0;
  return (product.pulseFrequency || "annual") === "quarterly" ? Math.ceil((lastPulseIndex + 1) / 4) : lastPulseIndex + 1;
}

export function isInfraPhasedLoanAfterFinalPulse(product, year, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  return relativeYear > getInfraPhasedLoanFinalPulseYear(product);
}

export function getInfraProductLoanEndYear(product, projectYears, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const termYears = Math.max(1, Math.round(Number(product.termYears) || projectYears));
  return Math.min(projectYears, stageStartYear + termYears - 1);
}

export function isInfraPhasedLoanFrameAmortizing(product, year, constructionYears = 0, rampUpYears = 0) {
  const finalPulseYear = getInfraPhasedLoanFinalPulseYear(product);
  if (finalPulseYear <= 0) return true;
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  return relativeYear >= finalPulseYear;
}

export function getInfraProductRepayment(openingOutstanding, product, year, projectYears, repaymentStartYear, constructionYears = 0, rampUpYears = 0) {
  const type = product.amortizationType || "equalPrincipal";
  if (!INFRA_PRODUCT_TYPES[product.productType]?.isLoan) return 0;
  if (openingOutstanding <= 0) return 0;

  const loanEndYear = getInfraProductLoanEndYear(product, projectYears, constructionYears, rampUpYears);
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const graceYears = Math.max(0, Math.round(Number(product.graceYears) || 0));
  const effectiveRepaymentStartYear = type === "grace" ? Math.min(projectYears, stageStartYear + graceYears) : repaymentStartYear;

  if (year < effectiveRepaymentStartYear) return 0;
  if (type === "balloon") return year >= loanEndYear ? openingOutstanding : 0;
  if (type === "custom") {
    const pct = Math.max(0, Number(product.customRepaymentPct) || 0) / 100;
    return Math.min(openingOutstanding, openingOutstanding * pct);
  }

  const remainingYears = Math.max(1, loanEndYear - year + 1);
  if (type === "spitzer" || type === "grace") {
    return Math.min(openingOutstanding, (openingOutstanding / remainingYears) * 0.85);
  }
  return Math.min(openingOutstanding, openingOutstanding / remainingYears);
}

export function calculateInfrastructureGuarantees(guarantees) {
  const rows = (guarantees || []).map((guarantee) => {
    const amount = Math.max(0, Number(guarantee.amount) || 0);
    const ratingRule = INFRA_GUARANTOR_RATING_RULES[guarantee.guarantorRating || "unrated"] || INFRA_GUARANTOR_RATING_RULES.unrated;
    const legalValid = Boolean(guarantee.legalValid);
    const unconditional = Boolean(guarantee.unconditional);
    const maturityMatch = Boolean(guarantee.maturityMatch);
    const eligible = amount > 0 && ratingRule.eligible && legalValid && unconditional && maturityMatch;
    const eligibleAmount = eligible ? amount : 0;
    const issues = [];
    if (!ratingRule.eligible) issues.push("דירוג ערב אינו כשיר בדוגמה");
    if (!legalValid) issues.push("חסר אישור משפטי/נוסח ערבות תקף");
    if (!unconditional) issues.push("הערבות אינה בלתי מותנית");
    if (!maturityMatch) issues.push("אי התאמה למח״מ/תקופת החשיפה");

    return {
      ...guarantee,
      amount,
      guarantorRating: guarantee.guarantorRating || "unrated",
      guarantorRiskWeight: ratingRule.riskWeight,
      guarantorRatingLabel: ratingRule.label,
      legalValid,
      unconditional,
      maturityMatch,
      eligible,
      eligibleAmount,
      issues,
    };
  });

  return {
    rows,
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    totalEligibleAmount: rows.reduce((sum, row) => sum + row.eligibleAmount, 0),
    weightedGuarantorRiskWeight:
      rows.reduce((sum, row) => sum + row.eligibleAmount, 0) > 0
        ? rows.reduce((sum, row) => sum + row.eligibleAmount * row.guarantorRiskWeight, 0) / rows.reduce((sum, row) => sum + row.eligibleAmount, 0)
        : 0,
    ineligibleCount: rows.filter((row) => !row.eligible).length,
  };
}

export function getInfraGuaranteeFacilityPct(product, year, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  if (relativeYear < 1 || relativeYear > Math.max(1, Math.round(Number(constructionYears) || 0))) return 0;
  const fieldConfig = INFRA_GUARANTEE_FRAME_FIELDS[relativeYear - 1];
  if (!fieldConfig) return 0;
  return clampNumber(product[fieldConfig.field] ?? DEFAULT_INFRA_GUARANTEE_FRAME_PCTS[relativeYear - 1] ?? 0, 0, 100) / 100;
}

export function calculateInfrastructureFees(fees, feeBaseAmount, constructionYears, rampUpYears, projectYears) {
  const normalizeFeeTiming = (fee, config) => {
    const timing = fee.timing || config.timing || "oneTimeFirstYear";
    if (timing === "year1") return "oneTimeFirstYear";
    if (timing === "construction") return "constructionAnnual";
    if (timing === "operation") return "fullProjectAnnual";
    if (timing === "spread") return "oneTimeFirstYear";
    return timing;
  };

  const rows = (fees || []).map((fee) => {
    const config = INFRA_FEE_TYPES[fee.feeType] || INFRA_FEE_TYPES.arrangement;
    const rawAmount = Math.max(0, Number(fee.amount) || 0);
    const rawPct = Math.max(0, Number(fee.pct) || 0);
    const amountMode = fee.amountMode || (rawAmount > 0 ? "amount" : "pct");
    const resolvedAmount = amountMode === "pct" ? feeBaseAmount * (rawPct / 100) : rawAmount;
    const resolvedPct = feeBaseAmount > 0 ? (resolvedAmount / feeBaseAmount) * 100 : rawPct;
    const spreadYears = Math.max(1, Math.round(Number(fee.spreadYears) || 1));
    const timing = normalizeFeeTiming(fee, config);

    return {
      ...fee,
      label: fee.label || fee.name || config.label,
      timing,
      amountMode,
      amount: resolvedAmount,
      pct: resolvedPct,
      spreadYears,
    };
  });

  const incomeByYear = Array.from({ length: projectYears }, (_, index) => {
    const year = index + 1;
    return rows.reduce((sum, fee) => {
      if (fee.timing === "oneTimeFirstYear") return sum + (year === 1 ? fee.amount : 0);
      if (fee.timing === "spread") return sum + (year <= fee.spreadYears ? fee.amount / fee.spreadYears : 0);
      if (fee.timing === "fullProjectAnnual") return sum + fee.amount;
      if (fee.timing === "constructionAnnual") return sum + (year <= constructionYears ? fee.amount : 0);
      if (fee.timing === "rampUpAnnual") return sum + (year > constructionYears && year <= constructionYears + rampUpYears ? fee.amount : 0);
      return sum;
    }, 0);
  });

  return {
    rows,
    incomeByYear,
    totalIncome: incomeByYear.reduce((sum, value) => sum + value, 0),
    firstYearIncome: incomeByYear[0] || 0,
  };
}

export function calculateInfrastructureProjectForecast(input) {
  const years = Math.max(1, Math.round(Number(input.projectYears) || 25));
  const constructionYears = clampNumber(input.constructionYears, 0, years);
  const rampUpYears = clampNumber(input.rampUpYears, 0, Math.max(0, years - constructionYears));
  const projectCurrency = input.projectCurrency || "ILS";
  const currency = INFRA_CURRENCIES[projectCurrency] || INFRA_CURRENCIES.ILS;
  const projectFx = getInfraFxRate(projectCurrency, currency.lastKnownRate);
  const products = input.products || [];
  const projectTotalScope = Math.max(0, Number(input.projectTotalScope) || 0) * projectFx;
  const bankSharePct = clampNumber(input.bankSharePct ?? 100, 0, 100);
  const bankShareAmount = projectTotalScope * (bankSharePct / 100);
  const organizedByBank = input.organizedByBank !== false;
  const arrangerName = organizedByBank ? "הבנק" : input.arrangerName || "גוף מארגן אחר";
  const discountRate = Math.max(0, Number(input.discountRate) || 0);
  const depositBalance = Math.max(0, Number(input.depositBalance) || 0) * projectFx;
  const depositMargin = Math.max(0, Number(input.depositMargin) || 0);
  const otherIncome = Math.max(0, Number(input.otherIncome) || 0) * projectFx;
  const annualDepositIncome = depositBalance * (depositMargin / 100);
  const feeAnalysis = calculateInfrastructureFees(
    (input.fees || []).map((fee) => ({ ...fee, amount: Math.max(0, Number(fee.amount) || 0) * projectFx })),
    bankShareAmount,
    constructionYears,
    rampUpYears,
    years
  );
  const annualAdditionalIncome = annualDepositIncome + otherIncome + (feeAnalysis.incomeByYear[0] || 0);
  const firstYearAdditionalIncome = annualAdditionalIncome;
  const securitiesAnalysis = calculateEligibleSecurities(input.securities || []);
  const guaranteeAnalysis = calculateInfrastructureGuarantees(input.guarantees || []);
  const constructionRiskWeight = Math.max(0, Number(input.constructionRiskWeight) || 150);
  const operatingRiskWeight = Math.max(0, Number(input.operatingRiskWeight) || 100);
  const repaymentStartYear = Math.max(1, Math.round(Number(input.repaymentStartYear) || constructionYears + rampUpYears + 1));

  const balances = Object.fromEntries(products.map((product) => [product.id, 0]));

  const rows = Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const stage = year <= constructionYears ? "הקמה" : year <= constructionYears + rampUpYears ? "הרצה" : "תפעול";
    const riskWeight = stage === "הקמה" ? constructionRiskWeight : operatingRiskWeight;

    let yearDrawdown = 0;
    let yearOutstanding = 0;
    let yearAverageOutstanding = 0;
    let yearUndrawn = 0;
    let yearTotalExposure = 0;
    let projectOutstanding = 0;
    let projectAverageOutstanding = 0;
    let projectUndrawn = 0;
    let projectTotalExposure = 0;
    let interestIncome = 0;
    let feeIncome = 0;
    let undrawnInterestIncome = 0;
    let ead = 0;
    const productDetails = [];

    products.forEach((product) => {
      const rule = INFRA_PRODUCT_TYPES[product.productType] || INFRA_PRODUCT_TYPES.infraLongTermLoan;
      const isBankFunded = (product.lenderType || "bank") === "bank";
      const amount = Math.max(0, Number(product.amount) || 0);
      const productCurrency = product.currency || projectCurrency;
      const fx = getInfraFxRate(productCurrency, product.fxRate);
      const amountIls = amount * fx;
      const opening = balances[product.id] || 0;
      const productStageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
      const relativeProductYear = year - productStageStartYear + 1;
      const isConstructionYear = year <= constructionYears;
      const feeTiming = product.feeTiming || "fullProjectAnnual";
      const nonLoanExposureApplies =
        relativeProductYear >= 1 &&
        (feeTiming === "oneTimeFirstYear" ? relativeProductYear === 1 :
        feeTiming === "constructionAnnual" ? isConstructionYear :
        true);
      const guaranteeFacilityPct = rule.isGuaranteeFacility ? getInfraGuaranteeFacilityPct(product, year, constructionYears, rampUpYears) : 0;
      const guaranteeFacilityLimit = rule.isGuaranteeFacility ? amountIls * guaranteeFacilityPct : 0;
      const guaranteeFacilityUtilizationPct = clampNumber(product.utilizationPct ?? 100, 0, 100) / 100;
      const guaranteeFacilityUtilized = guaranteeFacilityLimit * guaranteeFacilityUtilizationPct;
      const guaranteeFacilityUndrawn = Math.max(0, guaranteeFacilityLimit - guaranteeFacilityUtilized);
      const loanFacilityMode = product.facilityMode || (rule.isLoan ? "standalone" : "facility");
      const loanUtilizationPct = loanFacilityMode === "facility" ? clampNumber(product.utilizationPct ?? 100, 0, 100) / 100 : 1;
      const loanCommitmentAmount = rule.isLoan && !rule.isPhasedLoan ? amountIls * loanUtilizationPct : amountIls;
      const drawdown = rule.isLoan ? loanCommitmentAmount * getInfraProductDrawdownPct(product, year, constructionYears, rampUpYears) : 0;
      const beforeRepayment = Math.min(loanCommitmentAmount, opening + drawdown);
      const repayment = getInfraProductRepayment(beforeRepayment, product, year, years, repaymentStartYear, constructionYears, rampUpYears);
      const closing = Math.max(0, beforeRepayment - repayment);
      balances[product.id] = closing;

      const averageOutstanding = rule.isLoan ? (opening + closing) / 2 : 0;
      const guaranteeExposure = rule.isGuaranteeFacility ? guaranteeFacilityUtilized : rule.isLoan ? 0 : nonLoanExposureApplies ? amountIls : 0;
      const ccf = Math.max(0, Number(product.ccf ?? rule.defaultCcf) || 0) / 100;
      const ccfUndrawn = Math.max(0, Number(product.ccfUndrawn ?? rule.defaultCcfUndrawn ?? 0) || 0) / 100;
      const loanEndYear = rule.isLoan ? getInfraProductLoanEndYear(product, years, constructionYears, rampUpYears) : 0;
      const loanFacilityActive = rule.isLoan && year < loanEndYear;
      const phasedLoanFrameAmortizing = rule.isPhasedLoan ? isInfraPhasedLoanFrameAmortizing(product, year, constructionYears, rampUpYears) : false;
      const loanFrameForRwa =
        rule.isPhasedLoan
          ? phasedLoanFrameAmortizing ? closing : amountIls
          : loanFacilityMode === "facility" && loanFacilityActive ? amountIls : closing;
      const averageUndrawn = rule.isLoan && loanFacilityActive ? Math.max(0, loanFrameForRwa - averageOutstanding) : 0;
      const productUndrawn = rule.isGuaranteeFacility
        ? guaranteeFacilityUndrawn
        : rule.isLoan && loanFacilityActive
          ? Math.max(0, loanFrameForRwa - closing)
          : 0;
      const productOutstanding = closing + (rule.isGuaranteeFacility ? guaranteeFacilityUtilized : guaranteeExposure);
      const productTotalExposure = productOutstanding + productUndrawn;
      const rawProductEad = rule.isGuaranteeFacility
        ? guaranteeFacilityUtilized * ccf + guaranteeFacilityUndrawn * ccfUndrawn
        : rule.isLoan
        ? averageOutstanding * ccf + averageUndrawn * ccfUndrawn
        : guaranteeExposure * ccf;
      const productEad = Math.min(rawProductEad, productTotalExposure);
      const rate = Math.max(0, Number(product.rate) || 0) / 100;
      const defaultUndrawnRate = Math.max(0, Number(product.rate) || 0) / 3;
      const defaultUndrawnCustomerRate = Math.max(0, Number(product.customerRate || product.rate) || 0) / 3;
      const undrawnRatePct = Math.max(0, Number(product.undrawnRate ?? defaultUndrawnRate) || 0);
      const undrawnCustomerRatePct = Math.max(0, Number(product.undrawnCustomerRate ?? defaultUndrawnCustomerRate) || 0);
      const undrawnIncome = rule.isLoan && productUndrawn > 0 ? productUndrawn * (undrawnRatePct / 100) : 0;
      let productIncome = 0;
      if (rule.incomeMode === "interest") {
        productIncome = averageOutstanding * rate + undrawnIncome;
      } else {
        productIncome = nonLoanExposureApplies ? (rule.isGuaranteeFacility ? guaranteeFacilityLimit : guaranteeExposure) * rate : 0;
      }

      const productAverageOutstanding = averageOutstanding + (rule.isGuaranteeFacility ? guaranteeFacilityUtilized : guaranteeExposure);
      productDetails.push({
        productId: product.id,
        productName: product.name || rule.label,
        productType: product.productType,
        productTypeLabel: rule.label,
        stage: product.stage || "construction",
        lenderType: product.lenderType || "bank",
        isBankFunded,
        outstanding: productOutstanding,
        averageOutstanding: productAverageOutstanding,
        undrawn: productUndrawn,
        totalExposure: productTotalExposure,
        ead: productEad,
        income: isBankFunded ? productIncome : 0,
        interestIncome: isBankFunded && rule.incomeMode === "interest" ? productIncome : 0,
        feeIncome: isBankFunded && rule.incomeMode === "feeRate" ? productIncome : 0,
        undrawnIncome: isBankFunded ? undrawnIncome : 0,
        undrawnRatePct,
        undrawnCustomerRatePct,
      });

      projectOutstanding += productOutstanding;
      projectAverageOutstanding += productAverageOutstanding;
      projectUndrawn += productUndrawn;
      projectTotalExposure += productTotalExposure;

      if (isBankFunded) {
        yearDrawdown += drawdown;
        yearOutstanding += productOutstanding;
        yearAverageOutstanding += productAverageOutstanding;
        yearUndrawn += productUndrawn;
        yearTotalExposure += productTotalExposure;
        interestIncome += rule.incomeMode === "interest" ? productIncome : 0;
        feeIncome += rule.incomeMode === "feeRate" ? productIncome : 0;
        undrawnInterestIncome += undrawnIncome;
        ead += productEad;
      }
    });

    const eligibleCollateral = Math.min(ead, securitiesAnalysis.totalEligibleValue);
    const remainingAfterCollateral = Math.max(0, ead - eligibleCollateral);
    const eligibleGuarantee = Math.min(remainingAfterCollateral, guaranteeAnalysis.totalEligibleAmount);
    const unsecuredEad = Math.max(0, ead - eligibleCollateral - eligibleGuarantee);
    const guaranteeRwa = eligibleGuarantee * (guaranteeAnalysis.weightedGuarantorRiskWeight / 100);
    const unsecuredRwa = unsecuredEad * (riskWeight / 100);
    const rwaBeforeCrm = ead * (riskWeight / 100);
    const rwa = unsecuredRwa + guaranteeRwa;
    const collateralRwaSaving = eligibleCollateral * (riskWeight / 100);
    const guaranteeRwaSaving = Math.max(0, eligibleGuarantee * Math.max(riskWeight / 100 - guaranteeAnalysis.weightedGuarantorRiskWeight / 100, 0));
    const crmSaving = Math.max(0, rwaBeforeCrm - rwa);
    const projectFeeIncome = feeAnalysis.incomeByYear[index] || 0;
    const totalFeeIncome = feeIncome + projectFeeIncome;
    const additionalIncome = annualDepositIncome + otherIncome;
    const nominalIncome = interestIncome + totalFeeIncome + additionalIncome;
    const discountedIncome = nominalIncome / Math.pow(1 + discountRate / 100, Math.max(0, year - 1));
    const totalIncome = nominalIncome;

    const bankShareLimitExceeded = bankShareAmount > 0 && yearTotalExposure > bankShareAmount;
    const bankShareExcess = bankShareLimitExceeded ? yearTotalExposure - bankShareAmount : 0;

    return {
      year,
      label: `שנה ${year}`,
      stage,
      drawdown: yearDrawdown,
      outstanding: yearOutstanding,
      projectOutstanding,
      totalExposure: yearTotalExposure,
      projectTotalExposure,
      bankShareLimit: bankShareAmount,
      bankShareLimitExceeded,
      bankShareExcess,
      averageOutstanding: yearAverageOutstanding,
      projectAverageOutstanding,
      undrawn: yearUndrawn,
      projectUndrawn,
      ead,
      eligibleCollateral,
      eligibleGuarantee,
      unsecuredEad,
      riskWeight,
      rwaBeforeCrm,
      guaranteeRwa,
      collateralRwaSaving,
      guaranteeRwaSaving,
      crmSaving,
      interestIncome,
      commitmentIncome: 0,
      feeIncome: totalFeeIncome,
      productFeeIncome: feeIncome,
      undrawnInterestIncome,
      projectFeeIncome,
      additionalIncome,
      totalIncome,
      discountedIncome,
      rwa,
      returnOnRwa: rwa > 0 ? (totalIncome / rwa) * 100 : 0,
      productDetails,
    };
  });

  const totalIncome = rows.reduce((sum, row) => sum + row.totalIncome, 0);
  const totalProductFeeIncome = rows.reduce((sum, row) => sum + row.productFeeIncome, 0);
  const totalAdditionalIncome = rows.reduce((sum, row) => sum + row.additionalIncome, 0);
  const discountedIncome = rows.reduce((sum, row) => sum + row.discountedIncome, 0);
  const averageAnnualIncome = totalIncome / years;
  const averageRwa = rows.reduce((sum, row) => sum + row.rwa, 0) / years;
  const averageReturnOnRwa = averageRwa > 0 ? (averageAnnualIncome / averageRwa) * 100 : 0;
  const peakExposure = rows.reduce((max, row) => Math.max(max, row.totalExposure), 0);
  const peakProjectExposure = rows.reduce((max, row) => Math.max(max, row.projectTotalExposure), 0);
  const peakRwa = rows.reduce((max, row) => Math.max(max, row.rwa), 0);
  const bankShareLimitBreaches = rows.filter((row) => row.bankShareLimitExceeded);
  const maxBankShareExcess = rows.reduce((max, row) => Math.max(max, row.bankShareExcess || 0), 0);
  const totalCrmSaving = rows.reduce((sum, row) => sum + row.crmSaving, 0);
  const totalCollateralRwaSaving = rows.reduce((sum, row) => sum + row.collateralRwaSaving, 0);
  const totalGuaranteeRwaSaving = rows.reduce((sum, row) => sum + row.guaranteeRwaSaving, 0);
  const totalProjectFacility = products.reduce((sum, product) => {
    const productCurrency = product.currency || projectCurrency;
    const fx = getInfraFxRate(productCurrency, product.fxRate);
    return sum + Math.max(0, Number(product.amount) || 0) * fx;
  }, 0);
  const totalFacility = products.filter((product) => (product.lenderType || "bank") === "bank").reduce((sum, product) => {
    const productCurrency = product.currency || projectCurrency;
    const fx = getInfraFxRate(productCurrency, product.fxRate);
    return sum + Math.max(0, Number(product.amount) || 0) * fx;
  }, 0);

  return {
    rows,
    years,
    projectCurrency,
    projectTotalScope,
    bankSharePct,
    bankShareAmount,
    organizedByBank,
    arrangerName,
    discountRate,
    depositBalance,
    depositMargin,
    annualDepositIncome,
    feeAnalysis,
    annualProjectManagementFee: feeAnalysis.rows.filter((row) => row.timing === "constructionAnnual" || row.timing === "rampUpAnnual" || row.timing === "fullProjectAnnual").reduce((sum, row) => sum + row.amount, 0),
    oneTimeFee: feeAnalysis.rows.filter((row) => row.timing === "oneTimeFirstYear").reduce((sum, row) => sum + row.amount, 0),
    annualFixedFeeEnabled: false,
    annualFixedFee: 0,
    recurringAdditionalIncome: annualDepositIncome + otherIncome + (feeAnalysis.incomeByYear[0] || 0),
    firstYearAdditionalIncome,
    additionalFees: feeAnalysis.totalIncome,
    otherIncome,
    annualAdditionalIncome,
    totalFacility,
    totalProjectFacility,
    totalProductFeeIncome,
    totalAdditionalIncome,
    totalIncome,
    discountedIncome,
    averageAnnualIncome,
    averageRwa,
    averageReturnOnRwa,
    peakExposure,
    peakProjectExposure,
    peakRwa,
    bankShareLimitBreaches,
    maxBankShareExcess,
    totalCrmSaving,
    totalCollateralRwaSaving,
    totalGuaranteeRwaSaving,
    securitiesAnalysis,
    guaranteeAnalysis,
  };
}

export function calculateAdditionalIncome(input) {
  const depositBalance = Math.max(0, Number(input.depositBalance) || 0);
  const depositMargin = Math.max(0, Number(input.depositMargin) || 0);
  const annualDepositIncome = depositBalance * (depositMargin / 100);
  const accountFees = Math.max(0, Number(input.accountFees) || 0);
  const guaranteeFees = Math.max(0, Number(input.guaranteeFees) || 0);
  const fxFees = Math.max(0, Number(input.fxFees) || 0);
  const tradeFinanceFees = Math.max(0, Number(input.tradeFinanceFees) || 0);
  const otherFees = Math.max(0, Number(input.otherFees) || 0);
  const totalFeeIncome = accountFees + guaranteeFees + fxFees + tradeFinanceFees + otherFees;
  const totalAdditionalIncome = annualDepositIncome + totalFeeIncome;

  return {
    depositBalance,
    depositMargin,
    annualDepositIncome,
    accountFees,
    guaranteeFees,
    fxFees,
    tradeFinanceFees,
    otherFees,
    totalFeeIncome,
    totalAdditionalIncome,
  };
}

export function calculateEligibleSecurities(securities) {
  const rows = (securities || []).map((security) => {
    const rule = SECURITY_RULES[security.securityType] || SECURITY_RULES.privateSecurity;
    const ratingKey = security.securityRating || "unrated";
    const securityRatingRule = getSecurityRatingRule(security.securityType, ratingKey);
    const marketValue = Math.max(0, Number(security.marketValue) || 0);
    const legalPledge = Boolean(security.legalPledge);
    const marketable = Boolean(security.marketable);
    const concentrationLimitOk = Boolean(security.concentrationLimitOk);
    const currencyMatch = Boolean(security.currencyMatch);
    const currencyOk = currencyMatch || rule.allowCurrencyMismatch === true;
    const ratingEligible = securityRatingRule ? securityRatingRule.eligible : true;
    const eligible = rule.eligible && ratingEligible && legalPledge && marketable && concentrationLimitOk && currencyOk;
    const haircut = eligible ? (securityRatingRule ? securityRatingRule.haircut : rule.haircut) : 100;
    const eligibleValue = eligible ? marketValue * (1 - haircut / 100) : 0;

    const issues = [];
    if (securityRatingRule && !ratingEligible) issues.push("דירוג ני״ע אינו עומד בתנאי כשירות בדוגמה");
    if (!rule.eligible) issues.push("סוג ני״ע לא מוכר בדוגמה");
    if (!legalPledge) issues.push("חסר שעבוד משפטי תקף");
    if (!marketable) issues.push("לא סחיר / אין שווי שוק עדכני");
    if (!concentrationLimitOk) issues.push("חריגה ממגבלת ריכוזיות");
    if (!currencyOk) issues.push("פער מטבע מול החשיפה");
    if (!currencyMatch && rule.allowCurrencyMismatch === true) issues.push("פער מטבע — חושב haircut מט״ח");

    return {
      ...security,
      ruleLabel: rule.label,
      ruleNote: rule.note,
      haircut,
      eligible,
      eligibleValue,
      issues,
    };
  });

  return {
    rows,
    totalMarketValue: rows.reduce((sum, row) => sum + (Number(row.marketValue) || 0), 0),
    totalEligibleValue: rows.reduce((sum, row) => sum + row.eligibleValue, 0),
    ineligibleCount: rows.filter((row) => !row.eligible).length,
  };
}

export function calculateRwaResult(input) {
  const exposure = Math.max(0, Number(input.exposure) || 0);
  const riskSaleRwaReduction = Math.max(0, Number(input.riskSaleRwaReduction) || 0);
  const margin = Math.max(0, Number(input.margin) || 0);
  const manualRiskWeight = Math.max(0, Number(input.riskWeight) || 0);
  const effectiveRiskWeight = getEffectiveRiskWeight(input);
  const manualCollateral = Math.max(0, Number(input.collateral) || 0);
  const securitiesCollateralEligibleValue = Math.max(0, Number(input.securitiesCollateralEligibleValue) || 0);
  const collateral = manualCollateral + securitiesCollateralEligibleValue;
  const guarantee = Math.max(0, Number(input.guarantee) || 0);
  const ccf = Math.max(0, Number(input.ccf) || 0);
  const undrawn = Math.max(0, Number(input.undrawn) || 0);
  const capitalRatio = Math.max(0, Number(input.capitalRatio) || 0);
  const existingEad = Math.max(0, Number(input.existingEad) || 0);
  const existingRwa = Math.max(0, Number(input.existingRwa) || 0);
  const existingAnnualIncome = Math.max(0, Number(input.existingAnnualIncome) || 0);
  const productEad = input.productEad === undefined || input.productEad === null ? null : Math.max(0, Number(input.productEad) || 0);

  const ead = productEad !== null ? productEad : exposure + undrawn * (ccf / 100);
  const eligibleCollateral = Math.min(ead, collateral);
  const remainingAfterCollateral = Math.max(0, ead - eligibleCollateral);
  const eligibleGuarantee = Math.min(remainingAfterCollateral, guarantee);
  const unsecured = Math.max(0, ead - eligibleCollateral - eligibleGuarantee);
  const baseRiskWeightFactor = manualRiskWeight / 100;
  const effectiveRiskWeightFactor = effectiveRiskWeight / 100;
  const guarantorRiskWeightFactor = 0.2;

  const rwaBase = ead * baseRiskWeightFactor;
  const rwaBeforeGuaranteeAfterCollateral = remainingAfterCollateral * effectiveRiskWeightFactor;
  const guaranteeRwa = eligibleGuarantee * guarantorRiskWeightFactor;
  const unsecuredRwa = unsecured * effectiveRiskWeightFactor;
  const rwaBeforeRiskSale = unsecuredRwa + guaranteeRwa;
  const eligibleRiskSaleRwaReduction = Math.min(rwaBeforeRiskSale, riskSaleRwaReduction);
  const rwaAfter = Math.max(0, rwaBeforeRiskSale - eligibleRiskSaleRwaReduction);
  const guaranteeRwaSaving = Math.max(0, eligibleGuarantee * Math.max(effectiveRiskWeightFactor - guarantorRiskWeightFactor, 0));
  const collateralRwaSaving = Math.max(0, eligibleCollateral * effectiveRiskWeightFactor);
  const productAnnualIncome = input.productAnnualIncome === undefined || input.productAnnualIncome === null ? exposure * (margin / 100) : Number(input.productAnnualIncome) || 0;
  const additionalAnnualIncome = Math.max(0, Number(input.additionalAnnualIncome) || 0);
  const annualIncome = productAnnualIncome + additionalAnnualIncome;
  const capitalBase = rwaBase * (capitalRatio / 100);
  const capitalAfter = rwaAfter * (capitalRatio / 100);
  const roracBase = capitalBase > 0 ? (annualIncome / capitalBase) * 100 : 0;
  const roracAfter = capitalAfter > 0 ? (annualIncome / capitalAfter) * 100 : 0;
  const returnOnRwaBase = rwaBase > 0 ? (annualIncome / rwaBase) * 100 : 0;
  const returnOnRwaAfter = rwaAfter > 0 ? (annualIncome / rwaAfter) * 100 : 0;

  const existingCapital = existingRwa * (capitalRatio / 100);
  const existingRorac = existingCapital > 0 ? (existingAnnualIncome / existingCapital) * 100 : 0;
  const existingReturnOnRwa = existingRwa > 0 ? (existingAnnualIncome / existingRwa) * 100 : 0;
  const totalEadAfterNewDeal = existingEad + ead;
  const totalRwaAfterNewDeal = existingRwa + rwaAfter;
  const totalCapitalAfterNewDeal = totalRwaAfterNewDeal * (capitalRatio / 100);
  const totalAnnualIncomeAfterNewDeal = existingAnnualIncome + annualIncome;
  const totalRoracAfterNewDeal =
    totalCapitalAfterNewDeal > 0 ? (totalAnnualIncomeAfterNewDeal / totalCapitalAfterNewDeal) * 100 : 0;
  const totalReturnOnRwaAfterNewDeal =
    totalRwaAfterNewDeal > 0 ? (totalAnnualIncomeAfterNewDeal / totalRwaAfterNewDeal) * 100 : 0;

  return {
    ead,
    eligibleCollateral,
    eligibleGuarantee,
    unsecured,
    manualRiskWeight,
    effectiveRiskWeight,
    manualCollateral,
    securitiesCollateralEligibleValue,
    totalFinancialCollateral: collateral,
    rwaBase,
    rwaBeforeGuaranteeAfterCollateral,
    guaranteeRwa,
    unsecuredRwa,
    guaranteeRwaSaving,
    collateralRwaSaving,
    rwaBeforeRiskSale,
    riskSaleRwaReduction,
    eligibleRiskSaleRwaReduction,
    rwaAfter,
    productAnnualIncome,
    additionalAnnualIncome,
    annualIncome,
    capitalBase,
    capitalAfter,
    roracBase,
    roracAfter,
    returnOnRwaBase,
    returnOnRwaAfter,
    rwaSaving: Math.max(0, rwaBase - rwaAfter),
    capitalSaving: Math.max(0, capitalBase - capitalAfter),
    existingEad,
    existingRwa,
    existingAnnualIncome,
    existingCapital,
    existingRorac,
    existingReturnOnRwa,
    totalEadAfterNewDeal,
    totalRwaAfterNewDeal,
    totalCapitalAfterNewDeal,
    totalAnnualIncomeAfterNewDeal,
    totalRoracAfterNewDeal,
    totalReturnOnRwaAfterNewDeal,
    incrementalEad: ead,
    incrementalRwa: rwaAfter,
    incrementalCapital: capitalAfter,
    incrementalAnnualIncome: annualIncome,
  };
}

export function runCalculationTests() {
  const coreTests = TEST_CASES.map((test) => {
    const actual = calculateRwaResult(test.input);
    const failures = Object.entries(test.expected).filter(([key, expectedValue]) => {
      return Math.abs(actual[key] - expectedValue) > 0.0001;
    });

    return {
      name: test.name,
      passed: failures.length === 0,
      failures: failures.map(([key, expectedValue]) => ({
        key,
        expected: expectedValue,
        actual: actual[key],
      })),
    };
  });

  const productAggregation = calculateProductRows([
    { id: 1, productType: "cashCredit", limit: 100, expectedUtilizationPct: 70, ccfUtilized: 100, ccfUndrawn: 40, margin: 2 },
    { id: 2, productType: "performanceGuarantee", limit: 50, expectedUtilizationPct: 60, ccfUtilized: 50, ccfUndrawn: 20, margin: 1.5 },
  ]);
  const productAggregationPassed =
    Math.abs(productAggregation.totalLimit - 150) < 0.0001 &&
    Math.abs(productAggregation.totalUtilized - 100) < 0.0001 &&
    Math.abs(productAggregation.totalUndrawn - 50) < 0.0001 &&
    Math.abs(productAggregation.totalEad - 101) < 0.0001 &&
    Math.abs(productAggregation.totalAnnualIncome - 2.15) < 0.0001 &&
    Math.abs(productAggregation.weightedMargin - 2) < 0.0001;

  const longTermLoan = calculateProductRows([
    { id: 1, productType: "longTermLoan", limit: 120, expectedUtilizationPct: 100, ccfUtilized: 100, ccfUndrawn: 0, margin: 3, termMonths: 60, amortizationType: "equalPrincipal" },
  ]);
  const longTermGraceLoan = calculateProductRows([
    { id: 1, productType: "longTermLoan", limit: 120, expectedUtilizationPct: 100, ccfUtilized: 100, ccfUndrawn: 0, margin: 3, termMonths: 60, amortizationType: "grace" },
  ]);
  const longTermMinTermLoan = calculateProductRows([
    { id: 1, productType: "longTermLoan", limit: 120, expectedUtilizationPct: 100, ccfUtilized: 100, ccfUndrawn: 0, margin: 3, termMonths: 6, amortizationType: "equalPrincipal" },
  ]);
  const syndicatedLoan = calculateProductRows([
    { id: 1, productType: "cashCredit", limit: 120, expectedUtilizationPct: 100, ccfUtilized: 100, ccfUndrawn: 0, margin: 3, syndicationEnabled: true, syndicationSaleMonth: 7, syndicationSalePct: 50, syndicationBuyerSpread: 2 },
  ]);
  const riskSaleProduct = calculateProductRows([
    { id: 1, productType: "riskSale", riskSaleSaleAmount: 40, riskSaleBuyerPrice: 2.5 },
  ]);
  const longTermLoanPassed =
    longTermLoan.totalEad > 0 &&
    longTermLoan.totalEad < 120 &&
    Math.abs(longTermLoan.rows[0].termMonthsForCalc - 60) < 0.0001;
  const longTermGraceLoanPassed =
    Math.abs(longTermGraceLoan.totalEad - 120) < 0.0001 &&
    Math.abs(longTermGraceLoan.rows[0].rwaUtilizedExposure - 120) < 0.0001;
  const longTermMinTermPassed = longTermMinTermLoan.rows[0].termMonthsForCalc === 12;
  const syndicatedLoanPassed =
    syndicatedLoan.totalEad < 120 &&
    syndicatedLoan.totalSyndicationSoldExposure > 0 &&
    syndicatedLoan.totalSyndicationCost > 0 &&
    syndicatedLoan.totalAnnualIncome < 3.6;
  const riskSaleProductPassed =
    riskSaleProduct.totalEad === 0 &&
    riskSaleProduct.totalRiskSaleRwaReduction === 40 &&
    Math.abs(riskSaleProduct.totalRiskSaleCost - 1) < 0.0001 &&
    Math.abs(riskSaleProduct.totalAnnualIncome + 1) < 0.0001;
  return [
    ...coreTests,
    {
      name: "product popup product aggregation",
      passed: productAggregationPassed,
      failures: productAggregationPassed ? [] : [{ key: "totalEad", expected: 101, actual: productAggregation.totalEad }],
    },
    {
      name: "long term loan amortization reduces utilized EAD",
      passed: longTermLoanPassed,
      failures: longTermLoanPassed ? [] : [{ key: "totalEad", expected: "between 0 and 120", actual: longTermLoan.totalEad }],
    },
    {
      name: "grace loan keeps average utilized EAD flat",
      passed: longTermGraceLoanPassed,
      failures: longTermGraceLoanPassed ? [] : [{ key: "totalEad", expected: 120, actual: longTermGraceLoan.totalEad }],
    },
    {
      name: "long term loan minimum term is 12 months",
      passed: longTermMinTermPassed,
      failures: longTermMinTermPassed ? [] : [{ key: "termMonthsForCalc", expected: 12, actual: longTermMinTermLoan.rows[0].termMonthsForCalc }],
    },
    {
      name: "syndication reduces EAD and net income",
      passed: syndicatedLoanPassed,
      failures: syndicatedLoanPassed ? [] : [{ key: "syndication", expected: "lower EAD and income", actual: syndicatedLoan.totalEad }],
    },
    {
      name: "risk sale product reduces RWA and creates expense",
      passed: riskSaleProductPassed,
      failures: riskSaleProductPassed ? [] : [{ key: "riskSale", expected: "RWA reduction 40 and cost 1", actual: riskSaleProduct.totalRiskSaleCost }],
    },
  ];
}

export const CONSTRUCTION_REGULATORY_CHECKS = [
  {
    id: "closedAccount",
    label: "חשבון פרויקט סגור ושעבוד תקבולים",
    note: "ניהול כל התקבולים והתשלומים בחשבון ליווי ייעודי, עם בקרה על מקורות ושימושים ושעבוד זכויות הפרויקט לטובת הבנק.",
  },
  {
    id: "voucherBook",
    label: "שיטת שוברים לרוכשי דירות",
    note: "תשלומי רוכשים אמורים להיכנס ישירות לחשבון הפרויקט באמצעות שוברים/מנגנון תשלום מבוקר, כדי לחבר בין תקבול לבין בטוחה לרוכש.",
  },
  {
    id: "saleLawGuaranteeControl",
    label: "בקרת ערבויות חוק מכר",
    note: "הנפקת ערבות/בטוחה לפי חוק המכר כנגד תקבולי רוכשים, התאמת סכומים, הצמדה, ביטול ערבויות במסירת חזקה והעברת זכויות.",
  },
  {
    id: "zeroReport",
    label: "דו״ח אפס, תקציב ומפקח הנדסי",
    note: "אישור דו״ח אפס, לוח זמנים, תקציב, מקורות הון עצמי ומנגנון שחרור כספים לפי אישורי מפקח והתקדמות ביצוע.",
  },
  {
    id: "preSalesAndEquity",
    label: "הון עצמי ומכירות מוקדמות",
    note: "בדיקת עמידה בתנאי פתיחה, שיעור הון עצמי, קצב מכירות, מחירי מכירה בפועל ויחסי LTV/LTC/DSCR פנימיים.",
  },
  {
    id: "permitsAndZoning",
    label: "היתרים, תב״ע ורישום זכויות",
    note: "בדיקת תוקף היתרי בנייה, זכויות בקרקע, שעבודים, הסכמי קומבינציה/תמורות, מיסוי ומגבלות רישום.",
  },
];


export const CONSTRUCTION_COLLATERAL_TYPES = {
  landMortgage: { label: "שעבוד קרקע", defaultHaircut: 35, defaultEligible: true, note: "שווי קרקע משועבד לאחר haircut שמרני." },
  financialGuarantee: { label: "ערבות כספית", defaultHaircut: 0, defaultEligible: true, note: "ערבות כספית/פיקדון או התחייבות פיננסית כשירה." },
  personalGuarantee: { label: "ערבות אישית", defaultHaircut: 100, defaultEligible: false, note: "ברירת מחדל ללא הפחתת RWA, אלא אם אושרה כשירות פרטנית." },
  insurancePolicy: { label: "פוליסת ביטוח", defaultHaircut: 20, defaultEligible: true, note: "פוליסה קיימת כבטוחה/המחאת זכויות, בנפרד מביטוח שהבנק רוכש." },
};

export const CONSTRUCTION_INSURANCE_TYPES = {
  guaranteeInsurance: { label: "ביטוח ערבויות" },
  landInsurance: { label: "ביטוח קרקעות" },
};

function calculateConstructionCollateralAnalysis(collaterals = []) {
  const rows = (collaterals || []).map((collateral) => {
    const rule = CONSTRUCTION_COLLATERAL_TYPES[collateral.collateralType] || CONSTRUCTION_COLLATERAL_TYPES.landMortgage;
    const amount = Math.max(0, Number(collateral.amount) || 0);
    const haircut = clampNumber(collateral.haircutPct ?? rule.defaultHaircut, 0, 100);
    const eligible = collateral.eligible ?? rule.defaultEligible;
    const eligibleAmount = eligible ? amount * (1 - haircut / 100) : 0;
    return {
      ...collateral,
      amount,
      haircutPct: haircut,
      eligible,
      eligibleAmount,
      typeLabel: rule.label,
      typeNote: rule.note,
    };
  });

  return {
    rows,
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    totalEligibleAmount: rows.reduce((sum, row) => sum + row.eligibleAmount, 0),
  };
}

function calculateConstructionInsuranceAnalysis(insurances = []) {
  const rows = (insurances || []).map((insurance) => {
    const typeRule = CONSTRUCTION_INSURANCE_TYPES[insurance.insuranceType] || CONSTRUCTION_INSURANCE_TYPES.guaranteeInsurance;
    const ratingRule = CONSTRUCTION_INSURER_RATING_RULES[insurance.insurerRating || "unrated"] || CONSTRUCTION_INSURER_RATING_RULES.unrated;
    const insuredAmount = Math.max(0, Number(insurance.insuredAmount) || 0);
    const amountMode = insurance.paymentMode || (Number(insurance.paymentAmount) > 0 ? "amount" : "pct");
    const paymentPct = Math.max(0, Number(insurance.paymentPct) || 0);
    const rawPaymentAmount = Math.max(0, Number(insurance.paymentAmount) || 0);
    const annualCost = amountMode === "pct" ? insuredAmount * (paymentPct / 100) : rawPaymentAmount;
    const resolvedPct = insuredAmount > 0 ? (annualCost / insuredAmount) * 100 : paymentPct;
    return {
      ...insurance,
      typeLabel: typeRule.label,
      insurerRating: insurance.insurerRating || "unrated",
      insurerRatingLabel: ratingRule.label,
      insurerRiskWeight: ratingRule.riskWeight,
      insuredAmount,
      paymentMode: amountMode,
      paymentPct: resolvedPct,
      paymentAmount: annualCost,
      annualCost,
    };
  });
  const totalInsuredAmount = rows.reduce((sum, row) => sum + row.insuredAmount, 0);
  const totalAnnualCost = rows.reduce((sum, row) => sum + row.annualCost, 0);
  const weightedInsurerRiskWeight = totalInsuredAmount > 0
    ? rows.reduce((sum, row) => sum + row.insuredAmount * row.insurerRiskWeight, 0) / totalInsuredAmount
    : 0;

  return {
    rows,
    totalInsuredAmount,
    totalAnnualCost,
    monthlyCost: totalAnnualCost / 12,
    weightedInsurerRiskWeight,
  };
}

export const CONSTRUCTION_DRAWDOWN_FIELDS = Array.from({ length: 12 }, (_, index) => ({
  field: `drawQ${index + 1}Pct`,
  label: `רבעון ${index + 1}, %`,
}));

function getConstructionDrawPct(product, month, landMonths) {
  const rule = CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || CONSTRUCTION_CREDIT_PRODUCT_TYPES.seniorConstruction;
  if (rule.stage === "land") return month === 1 ? 1 : 0;

  const constructionMonth = month - landMonths;
  if (constructionMonth < 1) return 0;
  const quarterIndex = Math.ceil(constructionMonth / 3) - 1;
  const field = CONSTRUCTION_DRAWDOWN_FIELDS[quarterIndex]?.field;
  if (!field) return 0;
  return clampNumber(product[field] ?? 0, 0, 100) / 100 / 3;
}

function getSaleLawGuaranteeEffectiveCcf(baseCcf, finalCcf, reductionStartPct, salesPct) {
  const base = clampNumber(baseCcf, 0, 100) / 100;
  const floor = clampNumber(finalCcf, 0, 100) / 100;
  const start = clampNumber(reductionStartPct, 0, 100);
  if (salesPct <= start) return base;
  if (start >= 100) return base;
  const progress = clampNumber((salesPct - start) / (100 - start), 0, 1);
  return base - Math.max(0, base - floor) * progress;
}

export function createDefaultConstructionCreditProducts({ totalCost = 0, landCost = 0, equityPct = 25, bankSharePct = 100 } = {}) {
  const equityAmount = Math.max(0, Number(totalCost) || 0) * (clampNumber(equityPct, 0, 100) / 100);
  const defaultFacility = Math.max(0, (Number(totalCost) || 0) - equityAmount) * (clampNumber(bankSharePct, 0, 100) / 100);
  const landFacility = Math.min(defaultFacility, Math.max(0, (Number(landCost) || 0) - Math.min(equityAmount, Number(landCost) || 0)) * (clampNumber(bankSharePct, 0, 100) / 100));
  const constructionFacility = Math.max(0, defaultFacility - landFacility);

  return [
    {
      id: 1,
      name: "הלוואת קרקע",
      productType: "landLoan",
      amount: landFacility,
      limit: landFacility,
      margin: 3.2,
      customerInterest: 3.2,
      ccfUndrawn: 0,
      riskWeight: 100,
      repaymentPriority: 1,
    },
    {
      id: 2,
      name: "הלוואת בניה בכירה",
      productType: "seniorConstruction",
      amount: constructionFacility,
      limit: constructionFacility,
      margin: 3.2,
      customerInterest: 3.2,
      ccfUndrawn: 0,
      riskWeight: 100,
      repaymentPriority: 1,
      drawQ1Pct: 8.33,
      drawQ2Pct: 8.33,
      drawQ3Pct: 8.33,
      drawQ4Pct: 8.33,
      drawQ5Pct: 8.33,
      drawQ6Pct: 8.33,
      drawQ7Pct: 8.33,
      drawQ8Pct: 8.33,
      drawQ9Pct: 8.33,
      drawQ10Pct: 8.33,
      drawQ11Pct: 8.33,
      drawQ12Pct: 8.37,
    },
    {
      id: 3,
      name: "הלוואת מזנין",
      productType: "mezzanineLoan",
      amount: 0,
      limit: 0,
      margin: 7.5,
      customerInterest: 7.5,
      ccfUndrawn: 0,
      riskWeight: 100,
      balloonAtEnd: true,
      repaymentPriority: 2,
      drawQ1Pct: 0,
      drawQ2Pct: 0,
      drawQ3Pct: 0,
      drawQ4Pct: 0,
      drawQ5Pct: 0,
      drawQ6Pct: 0,
      drawQ7Pct: 0,
      drawQ8Pct: 0,
      drawQ9Pct: 0,
      drawQ10Pct: 0,
      drawQ11Pct: 0,
      drawQ12Pct: 0,
    },
  ];
}

export function calculateConstructionProjectForecast(input = {}) {
  const landMonths = clampNumber(input.landMonths ?? 24, 0, 84);
  const constructionMonths = clampNumber(input.constructionMonths ?? 36, 1, 96);
  const finalMonths = clampNumber(input.finalMonths ?? 6, 0, 36);
  const salesScenario = input.salesScenario || "linear";
  const constructionDelayMonths = clampNumber(input.constructionDelayMonths ?? 0, 0, 24);
  const activeConstructionMonths = constructionMonths + constructionDelayMonths;
  const totalMonths = Math.max(1, Math.round(landMonths + activeConstructionMonths + finalMonths));
  const totalCost = Math.max(0, Number(input.totalCost) || 0);
  const landCost = Math.max(0, Number(input.landCost) || 0);
  const expectedRevenue = Math.max(0, Number(input.expectedRevenue) || 0);
  const equityPct = clampNumber(input.equityPct ?? 25, 0, 100);
  const bankSharePct = clampNumber(input.bankSharePct ?? 100, 0, 100);
  const loanMargin = Math.max(0, Number(input.loanMargin) || 0);
  const guaranteeFeeRate = Math.max(0, Number(input.guaranteeFeeRate) || 0);
  const saleLawGuaranteeFeeRate = Math.max(0, Number(input.saleLawGuaranteeFeeRate) || 0);
  const accountManagementFee = Math.max(0, Number(input.accountManagementFee) || 0);
  const setupFeePct = Math.max(0, Number(input.setupFeePct) || 0);
  const legalAndControlFees = Math.max(0, Number(input.legalAndControlFees) || 0);
  const configuredRiskWeights = { ...CONSTRUCTION_RISK_WEIGHT_TABLE, ...(input.riskWeightTable || {}) };
  const landLoanLtvPct = landCost > 0 ? ((input.creditProducts || []).filter((p) => p.productType === "landLoan").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / landCost) * 100 : 0;
  const landRiskWeight = landLoanLtvPct > configuredRiskWeights.landLoanHighLtvThresholdPct ? configuredRiskWeights.landLoanHighLtv : configuredRiskWeights.cashCreditDefault;
  const constructionRiskWeight = configuredRiskWeights.cashCreditDefault;
  const saleLawGuaranteeCcf = clampNumber(input.saleLawGuaranteeCcf ?? configuredRiskWeights.saleLawGuaranteeUtilized, 0, 100);
  const saleLawGuaranteeFinalCcf = clampNumber(input.saleLawGuaranteeFinalCcf ?? configuredRiskWeights.saleLawGuaranteeOccupancy, 0, 100);
  const saleLawGuaranteeReductionStartPct = clampNumber(input.saleLawGuaranteeReductionStartPct ?? 80, 0, 100);
  const guaranteeCcf = Math.max(0, Number(input.guaranteeCcf) || configuredRiskWeights.otherGuaranteeUtilized) / 100;
  const undrawnLoanCcf = Math.max(0, Number(input.undrawnLoanCcf) || 0) / 100;
  const completionGuaranteeLimit = Math.max(0, Number(input.completionGuaranteeLimit) || 0);
  const equityAmount = totalCost * (equityPct / 100);
  const fallbackProducts = createDefaultConstructionCreditProducts({ totalCost, landCost, equityPct, bankSharePct });
  const creditProducts = (input.creditProducts && input.creditProducts.length > 0 ? input.creditProducts : fallbackProducts).map((product, index) => {
    const rule = CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || CONSTRUCTION_CREDIT_PRODUCT_TYPES.seniorConstruction;
    return {
      ...product,
      productType: product.productType || "seniorConstruction",
      name: product.name || rule.label,
      amount: Math.max(0, Number(product.amount) || 0),
      limit: Math.max(0, Number(product.limit ?? product.amount) || 0),
      margin: Math.max(0, Number(product.margin ?? loanMargin) || 0),
      customerInterest: Math.max(0, Number(product.customerInterest ?? product.margin ?? loanMargin) || 0),
      ccfUndrawn: clampNumber(product.ccfUndrawn ?? rule.defaultCcfUndrawn ?? 40, 0, 100),
      riskWeight: Math.max(0, Number(product.riskWeight ?? rule.defaultRiskWeight ?? constructionRiskWeight) || 0),
      balloonAtEnd: product.balloonAtEnd ?? rule.defaultBalloonAtEnd ?? false,
      repaymentPriority: Math.max(1, Math.round(Number(product.repaymentPriority ?? (rule.isMezzanine ? 2 : 1)) || 1)),
      id: product.id ?? index + 1,
    };
  });
  const totalLoanFacility = creditProducts.filter((product) => (CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || {}).isLoan !== false).reduce((sum, product) => sum + Math.max(product.limit || 0, product.amount || 0), 0);
  const totalProjectFrame = Math.max(totalCost, creditProducts.reduce((sum, product) => sum + product.amount, 0));
  const landLoanFacility = creditProducts.filter((product) => (CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || {}).stage === "land").reduce((sum, product) => sum + product.amount, 0);
  const mezzanineFacility = creditProducts.filter((product) => CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType]?.isMezzanine).reduce((sum, product) => sum + product.amount, 0);
  const constructionLoanFacility = Math.max(0, totalLoanFacility - landLoanFacility - mezzanineFacility);
  const seniorLoanFacility = Math.max(0, totalLoanFacility - mezzanineFacility);
  const saleLawGuaranteeFacility = creditProducts.filter((product) => CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType]?.isSaleLaw).reduce((sum, product) => sum + Math.max(product.limit || 0, product.amount || 0), 0) || expectedRevenue * (bankSharePct / 100);
  const setupFee = 0;
  const monthlyAccountFee = 0;
  const monthlyControlFee = legalAndControlFees / 12;
  const monthlyProjectManagementFee = Math.max(0, Number(input.projectManagementFee) || 0) / 12;
  const scenarioSalesPct = (elapsed, duration) => {
    const t = duration > 0 ? clampNumber(elapsed / duration, 0, 1) : 1;
    if (salesScenario === "backLoaded") return t * t;
    if (salesScenario === "frontLoaded") return 1 - ((1 - t) * (1 - t));
    if (salesScenario === "exitAfterLand") return 0;
    return t;
  };
  const collateralAnalysis = calculateConstructionCollateralAnalysis(input.collaterals || []);
  const insuranceAnalysis = calculateConstructionInsuranceAnalysis(input.insurances || []);

  const balances = Object.fromEntries(creditProducts.map((product) => [product.id, 0]));
  let cumulativeSales = 0;
  const rows = Array.from({ length: totalMonths }, (_, index) => {
    const month = index + 1;
    const isLand = month <= landMonths;
    const isExitAfterLand = salesScenario === "exitAfterLand";
    const isFinal = month > landMonths + activeConstructionMonths;
    const stage = isLand ? "קרקע" : isExitAfterLand ? "פירעון בסוף קרקע" : isFinal ? "אכלוס/סוף פרויקט" : "בניה";
    const elapsedSalesMonths = isLand ? 0 : Math.min(activeConstructionMonths, month - landMonths);
    const targetSales = expectedRevenue * scenarioSalesPct(elapsedSalesMonths, activeConstructionMonths);
    const salesInflow = Math.max(0, targetSales - cumulativeSales);
    cumulativeSales = Math.min(expectedRevenue, targetSales);
    const salesPct = expectedRevenue > 0 ? (cumulativeSales / expectedRevenue) * 100 : 0;
    let remainingSweep = isLand ? 0 : salesInflow * (bankSharePct / 100);
    if (isExitAfterLand && month === landMonths + 1) remainingSweep = Number.MAX_SAFE_INTEGER;
    let loanDraw = 0;
    let loanOutstanding = 0;
    let avgLoan = 0;
    let undrawnLoan = 0;
    let interestIncome = 0;
    let loanEad = 0;
    let loanRwa = 0;
    let weightedRiskNumerator = 0;
    const productOpenings = Object.fromEntries(creditProducts.map((product) => [product.id, balances[product.id] || 0]));
    const openingTotal = creditProducts.reduce((sum, product) => sum + (productOpenings[product.id] || 0), 0);

    creditProducts.forEach((product) => {
      const opening = productOpenings[product.id] || 0;
      const drawBase = isExitAfterLand && (CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || {}).stage !== "land" ? 0 : product.amount;
      const draw = Math.min(Math.max(0, drawBase - opening), drawBase * getConstructionDrawPct(product, month, landMonths));
      balances[product.id] = opening + draw;
      loanDraw += draw;
    });

    [...creditProducts].sort((a, b) => a.repaymentPriority - b.repaymentPriority).forEach((product) => {
      const openingAfterDraw = balances[product.id] || 0;
      const deferBalloon = product.balloonAtEnd && month < totalMonths;
      const repayment = deferBalloon ? 0 : Math.min(openingAfterDraw, remainingSweep);
      balances[product.id] = Math.max(0, openingAfterDraw - repayment);
      remainingSweep = Math.max(0, remainingSweep - repayment);
    });

    const rawSaleLawGuaranteeOutstanding = isExitAfterLand ? 0 : Math.min(saleLawGuaranteeFacility, cumulativeSales * (bankSharePct / 100));
    const otherGuaranteeOutstanding = isLand || isExitAfterLand ? 0 : creditProducts.filter((product) => {
      const rule = CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || {};
      return rule.isGuarantee && !rule.isSaleLaw;
    }).reduce((sum, product) => sum + Math.max(product.limit || 0, product.amount || 0), 0);
    const legacyCompletionGuaranteeOutstanding = isLand || isExitAfterLand ? 0 : completionGuaranteeLimit * (bankSharePct / 100);
    const completionGuaranteeOutstanding = otherGuaranteeOutstanding || legacyCompletionGuaranteeOutstanding;
    const saleLawGuaranteeOutstanding = rawSaleLawGuaranteeOutstanding;

    creditProducts.forEach((product) => {
      const opening = productOpenings[product.id] || 0;
      const closing = balances[product.id] || 0;
      const rule = CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || CONSTRUCTION_CREDIT_PRODUCT_TYPES.seniorConstruction;
      const averageOutstanding = (opening + closing) / 2;
      const nominalLimit = Math.max(product.limit || 0, product.amount || 0);
      const projectFrameCap = Math.max(0, totalProjectFrame - saleLawGuaranteeOutstanding - completionGuaranteeOutstanding);
      const cappedLimit = product.productType === "seniorConstruction" ? Math.min(nominalLimit, projectFrameCap) : nominalLimit;
      const productUndrawn = Math.max(0, cappedLimit - closing);
      const seniorUndrawnCcf = product.productType === "seniorConstruction" ? configuredRiskWeights.otherGuaranteeUndrawn / 100 : product.ccfUndrawn / 100;
      const productEad = rule.isGuarantee ? 0 : averageOutstanding + productUndrawn * seniorUndrawnCcf;
      loanEad += productEad;
      loanOutstanding += closing;
      avgLoan += averageOutstanding;
      undrawnLoan += productUndrawn;
      interestIncome += rule.isGuarantee ? 0 : averageOutstanding * (product.margin / 100) / 12;
      const resolvedProductRw = rule.stage === "land" ? landRiskWeight : rule.isGuarantee && !rule.isSaleLaw ? configuredRiskWeights.otherGuaranteeUtilized : product.riskWeight;
      loanRwa += productEad * (resolvedProductRw / 100);
      weightedRiskNumerator += productEad * product.riskWeight;
    });

    const effectiveSaleLawGuaranteeCcf = isFinal ? configuredRiskWeights.saleLawGuaranteeOccupancy / 100 : getSaleLawGuaranteeEffectiveCcf(saleLawGuaranteeCcf, saleLawGuaranteeFinalCcf, saleLawGuaranteeReductionStartPct, salesPct);
    const saleLawGuaranteeEad = saleLawGuaranteeOutstanding * effectiveSaleLawGuaranteeCcf;
    const completionGuaranteeEad = completionGuaranteeOutstanding * guaranteeCcf;
    const ead = loanEad + saleLawGuaranteeEad + completionGuaranteeEad;
    const riskWeight = isLand ? landRiskWeight : constructionRiskWeight;
    const guaranteeRwa = saleLawGuaranteeEad * ((isFinal ? configuredRiskWeights.saleLawGuaranteeOccupancy : configuredRiskWeights.saleLawGuaranteeUtilized) / 100) + completionGuaranteeEad * (configuredRiskWeights.otherGuaranteeUtilized / 100);
    const rwaBeforeCreditRiskMitigation = loanRwa + guaranteeRwa;
    const baseRwaRate = ead > 0 ? rwaBeforeCreditRiskMitigation / ead : 0;
    const eligibleCollateral = Math.min(ead, collateralAnalysis.totalEligibleAmount);
    const remainingAfterCollateral = Math.max(0, ead - eligibleCollateral);
    const insuredEad = Math.min(remainingAfterCollateral, insuranceAnalysis.totalInsuredAmount);
    const collateralRwaSaving = eligibleCollateral * baseRwaRate;
    const insuranceRwaSaving = insuredEad * Math.max(baseRwaRate - insuranceAnalysis.weightedInsurerRiskWeight / 100, 0);
    const rwa = Math.max(0, rwaBeforeCreditRiskMitigation - collateralRwaSaving - insuranceRwaSaving);
    const insuranceRwa = insuredEad * (insuranceAnalysis.weightedInsurerRiskWeight / 100);
    const insuranceExpense = insuranceAnalysis.monthlyCost;
    const guaranteeIncome = creditProducts.filter((product) => {
      const rule = CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType] || {};
      return rule.isGuarantee && !rule.isSaleLaw;
    }).reduce((sum, product) => sum + Math.max(product.limit || 0, product.amount || 0) * (product.margin / 100) / 12, 0);
    const saleLawGuaranteeIncome = creditProducts.filter((product) => CONSTRUCTION_CREDIT_PRODUCT_TYPES[product.productType]?.isSaleLaw).reduce((sum, product) => sum + saleLawGuaranteeOutstanding * (product.margin / 100) / 12, 0) || saleLawGuaranteeOutstanding * (saleLawGuaranteeFeeRate / 100) / 12;
    const unusedFrames = Math.max(0, totalProjectFrame - loanOutstanding - saleLawGuaranteeOutstanding - completionGuaranteeOutstanding);
    const unusedFeeIncome = unusedFrames * (setupFeePct / 100) / 12;
    const feeIncome = guaranteeIncome + saleLawGuaranteeIncome + monthlyAccountFee + monthlyControlFee + monthlyProjectManagementFee + unusedFeeIncome;
    const totalIncome = interestIncome + feeIncome - insuranceExpense;

    return {
      month,
      label: `חודש ${month}`,
      stage,
      loanDraw,
      salesInflow,
      cumulativeSales,
      loanRepayment: Math.max(0, openingTotal + loanDraw - loanOutstanding),
      loanOutstanding,
      avgLoan,
      undrawnLoan,
      saleLawGuaranteeOutstanding,
      effectiveSaleLawGuaranteeCcf: effectiveSaleLawGuaranteeCcf * 100,
      saleLawGuaranteeEad,
      completionGuaranteeOutstanding,
      ead,
      riskWeight,
      loanEad,
      loanRwa,
      guaranteeRwa,
      rwaBeforeCreditRiskMitigation,
      eligibleCollateral,
      insuredEad,
      insuranceRwa,
      collateralRwaSaving,
      insuranceRwaSaving,
      rwa,
      interestIncome,
      guaranteeIncome,
      saleLawGuaranteeIncome,
      feeIncome,
      unusedFeeIncome,
      projectManagementFeeIncome: monthlyProjectManagementFee,
      insuranceExpense,
      totalIncome,
      returnOnRwa: rwa > 0 ? (totalIncome * 12 / rwa) * 100 : 0,
      salesPct,
      weightedLoanRiskWeight: avgLoan > 0 ? weightedRiskNumerator / Math.max(avgLoan, 1) : 0,
    };
  });

  const totalIncome = rows.reduce((sum, row) => sum + row.totalIncome, 0);
  const averageRwa = rows.reduce((sum, row) => sum + row.rwa, 0) / rows.length;
  const averageAnnualIncome = totalIncome / (rows.length / 12);
  const peakLoanOutstanding = rows.reduce((max, row) => Math.max(max, row.loanOutstanding), 0);
  const peakSaleLawGuarantees = rows.reduce((max, row) => Math.max(max, row.saleLawGuaranteeOutstanding), 0);
  const peakEad = rows.reduce((max, row) => Math.max(max, row.ead), 0);
  const peakRwa = rows.reduce((max, row) => Math.max(max, row.rwa), 0);
  const totalCollateralRwaSaving = rows.reduce((sum, row) => sum + row.collateralRwaSaving, 0);
  const totalInsuranceRwaSaving = rows.reduce((sum, row) => sum + row.insuranceRwaSaving, 0);
  const totalInsuranceExpense = rows.reduce((sum, row) => sum + row.insuranceExpense, 0);
  const grossProfit = expectedRevenue - totalCost;
  const grossMarginPct = expectedRevenue > 0 ? (grossProfit / expectedRevenue) * 100 : 0;
  const ltvBeforeMezzanine = expectedRevenue > 0 ? (seniorLoanFacility / expectedRevenue) * 100 : 0;
  const ltvAfterMezzanine = expectedRevenue > 0 ? (totalLoanFacility / expectedRevenue) * 100 : 0;
  const projectValueToSalesPct = expectedRevenue > 0 ? (totalCost / expectedRevenue) * 100 : 0;
  const landPeriodLtv = landCost > 0 ? (landLoanFacility / landCost) * 100 : 0;

  return {
    rows,
    landMonths,
    constructionMonths,
    totalMonths,
    finalMonths,
    salesScenario,
    constructionDelayMonths,
    totalCost,
    landCost,
    expectedRevenue,
    grossProfit,
    grossMarginPct,
    equityPct,
    equityAmount,
    bankSharePct,
    collateralAnalysis,
    insuranceAnalysis,
    creditProducts,
    totalLoanFacility,
    totalProjectFrame,
    seniorLoanFacility,
    mezzanineFacility,
    landLoanFacility,
    constructionLoanFacility,
    saleLawGuaranteeFacility,
    saleLawGuaranteeCcf,
    saleLawGuaranteeFinalCcf,
    saleLawGuaranteeReductionStartPct,
    completionGuaranteeLimit: completionGuaranteeLimit * (bankSharePct / 100),
    totalIncome,
    averageAnnualIncome,
    averageRwa,
    averageReturnOnRwa: averageRwa > 0 ? (averageAnnualIncome / averageRwa) * 100 : 0,
    peakLoanOutstanding,
    peakSaleLawGuarantees,
    peakEad,
    peakRwa,
    totalCollateralRwaSaving,
    totalInsuranceRwaSaving,
    totalInsuranceExpense,
    ltvBeforeMezzanine,
    ltvAfterMezzanine,
    projectValueToSalesPct,
    landPeriodLtv,
    regulatoryChecks: CONSTRUCTION_REGULATORY_CHECKS,
  };
}
