import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Calculator,
  Landmark,
  PackagePlus,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Printer,
} from "lucide-react";

import {
  DEFAULT_INFRA_GUARANTEE_FRAME_PCTS,
  DEFAULT_INFRA_PULSE_PCT,
  ENTITY_STATUS,
  INFRA_CURRENCIES,
  INFRA_FEE_TIMING_OPTIONS,
  INFRA_FEE_TYPES,
  INFRA_GUARANTEE_FRAME_FIELDS,
  INFRA_PRODUCT_STAGES,
  INFRA_PRODUCT_TYPES,
  INFRA_PULSE_FIELDS,
  PRODUCT_TYPES,
  RATING_RULES,
  REAL_ESTATE_EXPOSURE_RULES,
  SECURITY_RULES,
  SEGMENTS,
  calculateAdditionalIncome,
  calculateEligibleSecurities,
  calculateInfrastructureFees,
  calculateInfrastructureProjectForecast,
  calculateMonthlyCreditForecast,
  calculateProductRows,
  calculateRwaResult,
  clampNumber,
  convertIlsToInfraCurrency,
  formatInputNumber,
  formatK,
  formatM,
  formatYearsFromMonths,
  getInfraFxRate,
  requiresSecurityRating,
  runCalculationTests,
} from "./domain/simulatorEngine.js";
const SEGMENTS = {
  corporate: "תאגיד עסקי",
  sme: "SME / עסק קטן",
  realestate: "נדל״ן / LTV",
  project: "מימון פרויקט / Specialized lending",
  bank: "בנק / מוסד פיננסי",
  pse: "PSE / גוף ציבורי מוכר",
  municipality: "רשות מקומית",
};

const ENTITY_STATUS = {
  regular: {
    label: "תאגיד רגיל",
    riskWeight: null,
    note: "ללא הנחת PSE / רשות מקומית. משקל הסיכון נקבע לפי סיווג החשיפה הרגיל.",
  },
  pseRecognized: {
    label: "PSE מוכר לפי הוראות ב״י",
    riskWeight: 50,
    note: "הדגמה: חשיפה לגוף ציבורי מוכר עשויה לקבל משקל סיכון מופחת, בכפוף לתנאי הכרה, מסמכים, וסיווג רגולטורי תקף.",
  },
  municipalityDiscount: {
    label: "רשות מקומית עם הנחת RWA",
    riskWeight: 20,
    note: "הדגמה: רשות מקומית מוכרת עשויה לקבל משקל סיכון מועדף לפי ההוראות והמדיניות הפנימית. יש לאמת מול הוראת נב״ת הרלוונטית ויישום הבנק.",
  },
};

const RATING_RULES = {
  aaaToAa: { label: "AAA עד AA-", riskWeight: 20 },
  a: { label: "A+ עד A-", riskWeight: 50 },
  bbb: { label: "BBB+ עד BBB-", riskWeight: 75 },
  bb: { label: "BB+ עד BB-", riskWeight: 100 },
  bAndBelow: { label: "B+ ומטה", riskWeight: 150 },
  unrated: { label: "לא מדורג", riskWeight: 100 },
};

const REAL_ESTATE_EXPOSURE_RULES = {
  none: { label: "לא נדל״ן מיוחד", riskWeightOverride: null, note: "אין התאמה ייעודית לסוג נדל״ן." },
  incomeProducing: { label: "נדל״ן מניב", riskWeightOverride: null, note: "בדוגמה נשאר לפי דירוג/סיווג כללי. בפועל ייתכן חישוב לפי LTV ותלות בתזרים הנכס." },
  constructionProject: { label: "פרויקט נדל״ן בהקמה", riskWeightOverride: 150, note: "דוגמה: פרויקט נדל״ן בהקמה עשוי לקבל הקצאת RWA גבוהה יותר עד השלמת תנאים רגולטוריים." },
  infrastructureConstruction: { label: "פרויקט תשתית בתקופת הקמה", riskWeightOverride: 150, note: "דוגמה: בתקופת ההקמה של פרויקט תשתית נכסי הסיכון עשויים להיות גבוהים יותר, עד מעבר לשלב תפעולי/יציב." },
  land: { label: "קרקע / רכישת קרקע", riskWeightOverride: 150, note: "דוגמה: קרקע וחשיפות יזמיות עשויות לקבל משקל סיכון מוגבר." },
};

const PRODUCT_TYPES = {
  cashCredit: {
    label: "הלוואה לזמן קצר",
    incomeMode: "interest",
    isLoan: true,
    loanTermMode: "short",
    defaultCcfUtilized: 100,
    defaultCcfUndrawn: 40,
    note: "הלוואה לזמן קצר: הניצול נכנס במלואו ל-EAD, והחלק הלא מנוצל לפי CCF.",
  },
  longTermLoan: {
    label: "הלוואה לזמן ארוך",
    incomeMode: "interest",
    isLoan: true,
    loanTermMode: "long",
    defaultCcfUtilized: 100,
    defaultCcfUndrawn: 40,
    note: "הלוואה לזמן ארוך: לצורך המוקאפ ה-EAD המנוצל מחושב לפי יתרה ממוצעת בשנה הקרובה בהתאם לתקופה וללוח הסילוקין.",
  },
  overdraft: {
    label: "מסגרת עו״ש / חח״ד",
    incomeMode: "interest",
    defaultCcfUtilized: 100,
    defaultCcfUndrawn: 40,
    note: "מסגרת מתחדשת; חשוב להבחין אם מחייבת או ניתנת לביטול.",
  },
  performanceGuarantee: {
    label: "ערבות ביצוע",
    incomeMode: "fee",
    defaultCcfUtilized: 50,
    defaultCcfUndrawn: 20,
    note: "מקדם המרה לדוגמה בלבד; בפועל לפי הוראות בנק ישראל וסיווג הערבות.",
  },
  saleLawGuarantee: {
    label: "ערבות חוק מכר",
    incomeMode: "fee",
    defaultCcfUtilized: 50,
    defaultCcfUndrawn: 20,
    note: "ערבות ייעודית לענף נדל״ן; יש לחבר לכללי מוצר ומגבלות ענפיות.",
  },
  financialGuarantee: {
    label: "ערבות כספית",
    incomeMode: "fee",
    defaultCcfUtilized: 100,
    defaultCcfUndrawn: 50,
    note: "ערבות בעלת אופי פיננסי עשויה להיות בעלת CCF גבוה יותר.",
  },
  letterOfCredit: {
    label: "אשראי דוקומנטרי / L/C",
    incomeMode: "fee",
    defaultCcfUtilized: 20,
    defaultCcfUndrawn: 20,
    note: "מוצר סחר חוץ; CCF תלוי בסוג ההתחייבות ובתנאים.",
  },
  derivatives: {
    label: "פעילות נגזרים",
    incomeMode: "fee",
    defaultCcfUtilized: 100,
    defaultCcfUndrawn: 0,
    note: "בפועל יש לחשב EAD לפי מתודולוגיית נגזרים ייעודית. כאן זה קירוב לאפיון UI בלבד.",
  },
  riskSale: {
    label: "מכירת סיכון / סינדיקציה",
    incomeMode: "riskTransfer",
    defaultCcfUtilized: 0,
    defaultCcfUndrawn: 0,
    note: "מוצר התאמה: מזינים סכום מכירה, מועד מכירה צפוי ומחיר/מרווח לקונה. המוצר מפחית RWA רק בתקופה שלאחר המכירה ומקטין הכנסה נטו לפי ההוצאה המחושבת, ואינו מוסיף חבות אשראי חדשה.",
  },
};

const INFRA_CURRENCIES = {
  ILS: { label: "ש״ח", symbol: "₪", fxToIls: 1, lastKnownRate: 1, lastKnownDate: "" },
  USD: { label: "דולר", symbol: "$", fxToIls: 2.859, lastKnownRate: 2.859, lastKnownDate: "26/05/2026" },
  EUR: { label: "יורו", symbol: "€", fxToIls: 3.3263, lastKnownRate: 3.3263, lastKnownDate: "26/05/2026" },
};

function getInfraFxRate(currencyCode, productFxRate) {
  const currency = INFRA_CURRENCIES[currencyCode] || INFRA_CURRENCIES.ILS;
  if (currencyCode === "ILS") return 1;
  const manualRate = Number(productFxRate);
  return Number.isFinite(manualRate) && manualRate > 0 ? manualRate : currency.lastKnownRate;
}

function convertIlsToInfraCurrency(amountIls, currencyCode) {
  const rate = getInfraFxRate(currencyCode, INFRA_CURRENCIES[currencyCode]?.lastKnownRate || 1);
  return rate > 0 ? amountIls / rate : amountIls;
}

const INFRA_PRODUCT_TYPES = {
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

const INFRA_PRODUCT_STAGES = {
  construction: { label: "מוצרי אשראי בהקמה", shortLabel: "הקמה", tone: "orange" },
  rampUp: { label: "מוצרי אשראי בהרצה", shortLabel: "הרצה", tone: "sky" },
  operation: { label: "מוצרי אשראי בהפעלה", shortLabel: "הפעלה", tone: "green" },
};

const INFRA_FEE_TIMING_OPTIONS = {
  oneTimeFirstYear: { label: "חד פעמית בשנה הראשונה" },
  fullProjectAnnual: { label: "שנתית לאורך חיי הפרויקט" },
  constructionAnnual: { label: "שנתית בתקופת ההקמה" },
};

const INFRA_PULSE_FIELDS = Array.from({ length: 8 }, (_, index) => ({
  field: `pulse${index + 1}Pct`,
  label: `פעימה ${index + 1}, %`,
}));

const DEFAULT_INFRA_PULSE_PCT = 12.5;

const INFRA_GUARANTEE_FRAME_FIELDS = Array.from({ length: 8 }, (_, index) => ({
  field: `guaranteeFrameYear${index + 1}Pct`,
  label: `שנה ${index + 1}, % מהמסגרת`,
}));

const DEFAULT_INFRA_GUARANTEE_FRAME_PCTS = [100, 90, 75, 60, 45, 30, 15, 0];

const INFRA_FEE_TYPES = {
  arrangement: { label: "עמלת ארגון", timing: "year1", allowPct: true },
  upfront1: { label: "UP FRONT 1", timing: "spread", allowPct: false },
  upfront2: { label: "UP FRONT 2", timing: "spread", allowPct: false },
  constructionAnnual: { label: "עמלת פרויקט בתקופת הקמה", timing: "construction", allowPct: true },
  operationAnnual: { label: "עמלת פרויקט בתקופת הפעלה", timing: "operation", allowPct: true },
};

const INFRA_GUARANTOR_RATING_RULES = {
  aaaToAa: { label: "AAA עד AA-", riskWeight: 20, eligible: true },
  a: { label: "A+ עד A-", riskWeight: 30, eligible: true },
  bbb: { label: "BBB+ עד BBB-", riskWeight: 50, eligible: true },
  bb: { label: "BB+ עד BB-", riskWeight: 100, eligible: true },
  bAndBelow: { label: "B+ ומטה", riskWeight: 150, eligible: false },
  unrated: { label: "לא מדורג", riskWeight: 100, eligible: false },
};

const SECURITY_RATING_HAIRCUTS = {
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

function requiresSecurityRating(securityType) {
  return Boolean(SECURITY_RATING_HAIRCUTS[securityType]);
}

function getSecurityRatingRule(securityType, rating) {
  const matrix = SECURITY_RATING_HAIRCUTS[securityType];
  if (!matrix) return null;
  return matrix[rating || "unrated"] || matrix.unrated;
}

const SECURITY_RULES = {
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

const TEST_CASES = [
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

function clampNumber(value, min, max) {
  const n = parseFormattedNumber(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function parseFormattedNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (normalized === "") return NaN;
  return Number(normalized);
}

function formatInputNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = parseFormattedNumber(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatYearsFromMonths(months) {
  const years = (parseFormattedNumber(months) || 0) / 12;
  const formatted = Number.isInteger(years) ? years.toFixed(0) : years.toFixed(1);
  return `${formatted} שנים`;
}

function formatK(value) {
  return `₪${Math.round(Number(value || 0)).toLocaleString("en-US")}k`;
}

function formatM(value, decimals = 1) {
  return `₪${(Number(value || 0) / 1000).toFixed(decimals)}m`;
}

function isInterestBearingProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.incomeMode === "interest";
}

function isLongTermLoanProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.loanTermMode === "long";
}

function isRiskSaleProduct(productType) {
  const rule = PRODUCT_TYPES[productType] || PRODUCT_TYPES.cashCredit;
  return rule.incomeMode === "riskTransfer";
}

function calculateLoanMonthlyBalances(principal, termMonths, amortizationType, annualRate) {
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

function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function calculateAverageLoanBalance(principal, termMonths, amortizationType, annualRate) {
  return average(calculateLoanMonthlyBalances(principal, termMonths, amortizationType, annualRate));
}

function calculateSyndicationEffect(monthlyBalances, saleEnabled, saleMonth, salePct, buyerSpread) {
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

function getEffectiveRiskWeight(input) {
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

function calculateProductRows(products) {
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

function calculateMonthlyCreditForecast(productRows, effectiveRiskWeight = 100) {
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

function getInfraProductStageStartYear(product, constructionYears, rampUpYears) {
  const stage = product.stage || "construction";
  if (stage === "rampUp") return Math.max(1, Math.round(Number(constructionYears) || 0) + 1);
  if (stage === "operation") return Math.max(1, Math.round(Number(constructionYears) || 0) + Math.round(Number(rampUpYears) || 0) + 1);
  return 1;
}

function getInfraProductDrawdownPct(product, year, constructionYears = 0, rampUpYears = 0) {
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

function getInfraPhasedLoanFinalPulseYear(product) {
  const pulses = INFRA_PULSE_FIELDS.map(({ field }) => Number(product[field] ?? 0) || 0);
  const lastPulseIndex = pulses.reduce((lastIndex, pct, index) => (pct > 0 ? index : lastIndex), -1);
  if (lastPulseIndex < 0) return 0;
  return (product.pulseFrequency || "annual") === "quarterly" ? Math.ceil((lastPulseIndex + 1) / 4) : lastPulseIndex + 1;
}

function isInfraPhasedLoanAfterFinalPulse(product, year, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  return relativeYear > getInfraPhasedLoanFinalPulseYear(product);
}

function getInfraProductRepayment(openingOutstanding, product, year, projectYears, repaymentStartYear) {
  const type = product.amortizationType || "equalPrincipal";
  if (!INFRA_PRODUCT_TYPES[product.productType]?.isLoan) return 0;
  if (openingOutstanding <= 0) return 0;

  const termYears = Math.max(1, Math.round(Number(product.termYears) || projectYears));
  const loanEndYear = Math.min(projectYears, termYears);
  const graceYears = Math.max(0, Math.round(Number(product.graceYears) || 0));
  const effectiveRepaymentStartYear = type === "grace" ? Math.min(projectYears, graceYears + 1) : repaymentStartYear;

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

function calculateInfrastructureGuarantees(guarantees) {
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

function getInfraGuaranteeFacilityPct(product, year, constructionYears = 0, rampUpYears = 0) {
  const stageStartYear = getInfraProductStageStartYear(product, constructionYears, rampUpYears);
  const relativeYear = year - stageStartYear + 1;
  if (relativeYear < 1 || relativeYear > Math.max(1, Math.round(Number(constructionYears) || 0))) return 0;
  const fieldConfig = INFRA_GUARANTEE_FRAME_FIELDS[relativeYear - 1];
  if (!fieldConfig) return 0;
  return clampNumber(product[fieldConfig.field] ?? DEFAULT_INFRA_GUARANTEE_FRAME_PCTS[relativeYear - 1] ?? 0, 0, 100) / 100;
}

function calculateInfrastructureFees(fees, projectTotalScope, constructionYears, rampUpYears, projectYears) {
  const rows = (fees || []).map((fee) => {
    const config = INFRA_FEE_TYPES[fee.feeType] || INFRA_FEE_TYPES.arrangement;
    const amount = Math.max(0, Number(fee.amount) || 0);
    const pct = Math.max(0, Number(fee.pct) || 0);
    const resolvedAmount = amount > 0 ? amount : projectTotalScope * (pct / 100);
    const resolvedPct = projectTotalScope > 0 ? (resolvedAmount / projectTotalScope) * 100 : pct;
    const spreadYears = Math.max(1, Math.round(Number(fee.spreadYears) || 1));

    return {
      ...fee,
      label: config.label,
      timing: config.timing,
      amount: resolvedAmount,
      pct: resolvedPct,
      spreadYears,
    };
  });

  const incomeByYear = Array.from({ length: projectYears }, (_, index) => {
    const year = index + 1;
    return rows.reduce((sum, fee) => {
      if (fee.timing === "year1") return sum + (year === 1 ? fee.amount : 0);
      if (fee.timing === "spread") return sum + (year <= fee.spreadYears ? fee.amount / fee.spreadYears : 0);
      if (fee.timing === "construction") return sum + (year <= constructionYears ? fee.amount : 0);
      if (fee.timing === "operation") return sum + (year > constructionYears + rampUpYears ? fee.amount : 0);
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

function calculateInfrastructureProjectForecast(input) {
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
  const discountRate = Math.max(0, Number(input.discountRate) || 0);
  const depositBalance = Math.max(0, Number(input.depositBalance) || 0) * projectFx;
  const depositMargin = Math.max(0, Number(input.depositMargin) || 0);
  const otherIncome = Math.max(0, Number(input.otherIncome) || 0) * projectFx;
  const annualDepositIncome = depositBalance * (depositMargin / 100);
  const feeAnalysis = calculateInfrastructureFees(
    (input.fees || []).map((fee) => ({ ...fee, amount: Math.max(0, Number(fee.amount) || 0) * projectFx })),
    projectTotalScope,
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
    let interestIncome = 0;
    let feeIncome = 0;
    let ead = 0;

    products.forEach((product) => {
      const rule = INFRA_PRODUCT_TYPES[product.productType] || INFRA_PRODUCT_TYPES.infraLongTermLoan;
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
      const repayment = getInfraProductRepayment(beforeRepayment, product, year, years, repaymentStartYear);
      const closing = Math.max(0, beforeRepayment - repayment);
      balances[product.id] = closing;

      const averageOutstanding = rule.isLoan ? (opening + closing) / 2 : 0;
      const guaranteeExposure = rule.isGuaranteeFacility ? guaranteeFacilityUtilized : rule.isLoan ? 0 : nonLoanExposureApplies ? amountIls : 0;
      const ccf = Math.max(0, Number(product.ccf ?? rule.defaultCcf) || 0) / 100;
      const ccfUndrawn = Math.max(0, Number(product.ccfUndrawn ?? rule.defaultCcfUndrawn ?? 0) || 0) / 100;
      const phasedLoanAfterFinalPulse = rule.isPhasedLoan ? isInfraPhasedLoanAfterFinalPulse(product, year, constructionYears, rampUpYears) : false;
      const loanFrameForRwa =
        rule.isPhasedLoan
          ? phasedLoanAfterFinalPulse ? averageOutstanding : amountIls
          : loanFacilityMode === "facility" ? amountIls : averageOutstanding;
      const averageUndrawn = rule.isLoan ? Math.max(0, loanFrameForRwa - averageOutstanding) : 0;
      const productEad = rule.isGuaranteeFacility
        ? guaranteeFacilityUtilized * ccf + guaranteeFacilityUndrawn * ccfUndrawn
        : rule.isLoan
        ? averageOutstanding * ccf + averageUndrawn * ccfUndrawn
        : guaranteeExposure * ccf;
      const rate = Math.max(0, Number(product.rate) || 0) / 100;
      let productIncome = 0;
      if (rule.incomeMode === "interest") {
        productIncome = averageOutstanding * rate;
      } else {
        productIncome = nonLoanExposureApplies ? (rule.isGuaranteeFacility ? guaranteeFacilityLimit : guaranteeExposure) * rate : 0;
      }

      yearDrawdown += drawdown;
      yearOutstanding += closing + (rule.isGuaranteeFacility ? guaranteeFacilityLimit : guaranteeExposure);
      yearAverageOutstanding += averageOutstanding + (rule.isGuaranteeFacility ? guaranteeFacilityLimit : guaranteeExposure);
      yearUndrawn += rule.isGuaranteeFacility ? guaranteeFacilityUndrawn : rule.isLoan ? Math.max(0, loanFrameForRwa - closing) : 0;
      interestIncome += rule.incomeMode === "interest" ? productIncome : 0;
      feeIncome += rule.incomeMode === "feeRate" ? productIncome : 0;
      ead += productEad;
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
    const additionalIncome = annualDepositIncome + otherIncome + (feeAnalysis.incomeByYear[index] || 0);
    const nominalIncome = interestIncome + feeIncome + additionalIncome;
    const discountedIncome = nominalIncome / Math.pow(1 + discountRate / 100, Math.max(0, year - 1));
    const totalIncome = nominalIncome;

    const bankShareLimitExceeded = bankShareAmount > 0 && yearOutstanding > bankShareAmount;
    const bankShareExcess = bankShareLimitExceeded ? yearOutstanding - bankShareAmount : 0;

    return {
      year,
      label: `שנה ${year}`,
      stage,
      drawdown: yearDrawdown,
      outstanding: yearOutstanding,
      bankShareLimit: bankShareAmount,
      bankShareLimitExceeded,
      bankShareExcess,
      averageOutstanding: yearAverageOutstanding,
      undrawn: yearUndrawn,
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
      feeIncome,
      additionalIncome,
      totalIncome,
      discountedIncome,
      rwa,
      returnOnRwa: rwa > 0 ? (totalIncome / rwa) * 100 : 0,
    };
  });

  const totalIncome = rows.reduce((sum, row) => sum + row.totalIncome, 0);
  const totalProductFeeIncome = rows.reduce((sum, row) => sum + row.feeIncome, 0);
  const totalAdditionalIncome = rows.reduce((sum, row) => sum + row.additionalIncome, 0);
  const discountedIncome = rows.reduce((sum, row) => sum + row.discountedIncome, 0);
  const averageAnnualIncome = totalIncome / years;
  const averageRwa = rows.reduce((sum, row) => sum + row.rwa, 0) / years;
  const averageReturnOnRwa = averageRwa > 0 ? (averageAnnualIncome / averageRwa) * 100 : 0;
  const peakExposure = rows.reduce((max, row) => Math.max(max, row.outstanding), 0);
  const peakRwa = rows.reduce((max, row) => Math.max(max, row.rwa), 0);
  const bankShareLimitBreaches = rows.filter((row) => row.bankShareLimitExceeded);
  const maxBankShareExcess = rows.reduce((max, row) => Math.max(max, row.bankShareExcess || 0), 0);
  const totalCrmSaving = rows.reduce((sum, row) => sum + row.crmSaving, 0);
  const totalCollateralRwaSaving = rows.reduce((sum, row) => sum + row.collateralRwaSaving, 0);
  const totalGuaranteeRwaSaving = rows.reduce((sum, row) => sum + row.guaranteeRwaSaving, 0);
  const totalFacility = products.reduce((sum, product) => {
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
    discountRate,
    depositBalance,
    depositMargin,
    annualDepositIncome,
    feeAnalysis,
    annualProjectManagementFee: feeAnalysis.rows.filter((row) => row.feeType === "constructionAnnual" || row.feeType === "operationAnnual").reduce((sum, row) => sum + row.amount, 0),
    oneTimeFee: feeAnalysis.rows.filter((row) => row.timing === "year1").reduce((sum, row) => sum + row.amount, 0),
    annualFixedFeeEnabled: false,
    annualFixedFee: 0,
    recurringAdditionalIncome: annualDepositIncome + otherIncome + (feeAnalysis.incomeByYear[0] || 0),
    firstYearAdditionalIncome,
    additionalFees: feeAnalysis.totalIncome,
    otherIncome,
    annualAdditionalIncome,
    totalFacility,
    totalProductFeeIncome,
    totalAdditionalIncome,
    totalIncome,
    discountedIncome,
    averageAnnualIncome,
    averageRwa,
    averageReturnOnRwa,
    peakExposure,
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

function calculateAdditionalIncome(input) {
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

function calculateEligibleSecurities(securities) {
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

function runCalculationTests() {
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
    Math.abs(productAggregation.totalEad - 94) < 0.0001 &&
    Math.abs(productAggregation.totalAnnualIncome - 2.15) < 0.0001 &&
    Math.abs(productAggregation.weightedMargin - 2) < 0.0001;

import {
  Badge,
  Checkbox,
  CompactProductsTable,
  DefinitionCard,
  DefinitionItem,
  FieldBox,
  FormulaLine,
  Kpi,
  MetricInput,
  MonthsCell,
  MonthsMetricInput,
  NumberCell,
  Panel,
  ReadOnlyBox,
  ResultSection,
  SummaryBox,
  TabButton,
} from "./components/common/index.jsx";

import {
  AccountLookupModal,
  DefinitionsPanel,
  Header,
  InfraFeesModal,
  InfraGuaranteesModal,
  InfraProductsModal,
  InfrastructureProjectPanel,
  PrintPreviewModal,
  ProductsModal,
  SecuritiesModal,
} from "./components/simulator/index.jsx";

export { calculateRwaResult } from "./domain/simulatorEngine.js";

export default function RwaReturnSimulator() {
  const historyRef = useRef([]);
  const lastSnapshotKeyRef = useRef("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [clientName, setClientName] = useState("לקוח לדוגמה בע״מ");
  const [dealName, setDealName] = useState("עסקת אשראי חדשה");
  const [riskWeight, setRiskWeight] = useState(100);
  const [collateral, setCollateral] = useState(10000);
  const [guarantee, setGuarantee] = useState(0);
  const [capitalRatio, setCapitalRatio] = useState(12.5);
  const [segment, setSegment] = useState("corporate");
  const [entityStatus, setEntityStatus] = useState("regular");
  const [spRating, setSpRating] = useState("unrated");
  const [realEstateExposureType, setRealEstateExposureType] = useState("none");
  const [viewMode, setViewMode] = useState("singleDeal");
  const [existingEad, setExistingEad] = useState(120000);
  const [existingRwa, setExistingRwa] = useState(95000);
  const [existingAnnualIncome, setExistingAnnualIncome] = useState(3400);
  const [depositBalance, setDepositBalance] = useState(60000);
  const [depositMargin, setDepositMargin] = useState(0.7);
  const [accountFees, setAccountFees] = useState(150);
  const [guaranteeFees, setGuaranteeFees] = useState(200);
  const [fxFees, setFxFees] = useState(100);
  const [tradeFinanceFees, setTradeFinanceFees] = useState(50);
  const [otherFees, setOtherFees] = useState(50);
  const [activeTab, setActiveTab] = useState("waterfall");
  const [infraProjectYears, setInfraProjectYears] = useState(25);
  const [infraConstructionYears, setInfraConstructionYears] = useState(4);
  const [infraRampUpYears, setInfraRampUpYears] = useState(2);
  const [infraProjectCurrency, setInfraProjectCurrency] = useState("ILS");
  const [infraProjectTotalScope, setInfraProjectTotalScope] = useState(1000000);
  const [infraBankSharePct, setInfraBankSharePct] = useState(40);
  const [infraOrganizedByBank, setInfraOrganizedByBank] = useState(true);
  const [infraArrangerName, setInfraArrangerName] = useState("גוף מוסדי / בנק מוביל אחר");
  const [infraDiscountRate, setInfraDiscountRate] = useState(0);
  const [infraDepositBalance, setInfraDepositBalance] = useState(0);
  const [infraDepositMargin, setInfraDepositMargin] = useState(0);
  const [infraAdditionalFees, setInfraAdditionalFees] = useState(0);
  const [infraOtherIncome, setInfraOtherIncome] = useState(0);
  const [infraProjectManagementFeePct, setInfraProjectManagementFeePct] = useState(0);
  const [infraOneTimeFee, setInfraOneTimeFee] = useState(0);
  const [infraAnnualFixedFeeEnabled, setInfraAnnualFixedFeeEnabled] = useState(true);
  const [infraAnnualFixedFee, setInfraAnnualFixedFee] = useState(0);
  const [isInfraProductsModalOpen, setIsInfraProductsModalOpen] = useState(false);
  const [infraProductsModalStage, setInfraProductsModalStage] = useState("construction");
  const [isInfraGuaranteesModalOpen, setIsInfraGuaranteesModalOpen] = useState(false);
  const [isInfraSecuritiesModalOpen, setIsInfraSecuritiesModalOpen] = useState(false);
  const [isInfraFeesModalOpen, setIsInfraFeesModalOpen] = useState(false);
  const [infraFees, setInfraFees] = useState([
    { id: 1, feeType: "arrangement", amountMode: "pct", pct: 0.4, amount: 0, spreadYears: 1 },
    { id: 2, feeType: "upfront1", amountMode: "amount", pct: 0, amount: 0, spreadYears: 3 },
    { id: 3, feeType: "upfront2", amountMode: "amount", pct: 0, amount: 0, spreadYears: 5 },
    { id: 4, feeType: "constructionAnnual", amountMode: "pct", pct: 0.1, amount: 0, spreadYears: 1 },
    { id: 5, feeType: "operationAnnual", amountMode: "pct", pct: 0.05, amount: 0, spreadYears: 1 },
  ]);
  const [infraProducts, setInfraProducts] = useState([
    {
      id: 1,
      name: "הלוואת הקמה בכירה",
      stage: "construction",
      productType: "infraLongTermLoan",
      currency: "ILS",
      fxRate: 1,
      amount: 650000,
      rate: 2.8,
      interestBase: "צמוד מדד",
      customerRate: 5.1,
      lenderType: "bank",
      lenderName: "הבנק",
      ccf: 100,
      ccfUndrawn: 40,
      utilizationPct: 100,
      facilityMode: "standalone",
      termYears: 6,
      amortizationType: "equalPrincipal",
      graceYears: 1,
      customRepaymentPct: 8,
      pulseFrequency: "annual",
      pulse1Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse2Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse3Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse4Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse5Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse6Pct: DEFAULT_INFRA_PULSE_PCT,
      pulse7Pct: DEFAULT_INFRA_PULSE_PCT,
        pulse8Pct: DEFAULT_INFRA_PULSE_PCT,
        guaranteeFrameYear1Pct: 100,
        guaranteeFrameYear2Pct: 90,
        guaranteeFrameYear3Pct: 75,
        guaranteeFrameYear4Pct: 60,
        guaranteeFrameYear5Pct: 45,
        guaranteeFrameYear6Pct: 30,
        guaranteeFrameYear7Pct: 15,
        guaranteeFrameYear8Pct: 0,
        drawdownYear1: 100,
      drawdownYear2: 0,
      drawdownYear3: 0,
      drawdownYear4: 0,
    },
    {
      id: 2,
      name: "ערבות ביצוע",
      stage: "construction",
      productType: "infraPerformanceGuarantee",
      currency: "ILS",
      fxRate: 1,
      amount: 100000,
      rate: 1.1,
      lenderType: "bank",
      lenderName: "הבנק",
      feeTiming: "constructionAnnual",
      ccf: 50,
      amortizationType: "grace",
      customRepaymentPct: 0,
      drawdownYear1: 0,
      drawdownYear2: 0,
      drawdownYear3: 0,
      drawdownYear4: 0,
    },
  ]);
  const [infraSecurities, setInfraSecurities] = useState([
    {
      id: 1,
      name: "פקדון שקלי משועבד לפרויקט",
      securityType: "cashDeposit",
      marketValue: 100000,
      legalPledge: true,
      marketable: true,
      concentrationLimitOk: true,
      currencyMatch: true,
      securityRating: "aaaToAa",
    },
  ]);
  const [infraGuarantees, setInfraGuarantees] = useState([
    {
      id: 1,
      name: "ערבות מדינה / גוף חזק",
      amount: 250000,
      guarantorRating: "aaaToAa",
      legalValid: true,
      unconditional: true,
      maturityMatch: true,
    },
  ]);
  const [infraConstructionRiskWeight, setInfraConstructionRiskWeight] = useState(150);
  const [infraOperatingRiskWeight, setInfraOperatingRiskWeight] = useState(100);
  const [infraRepaymentStartYear, setInfraRepaymentStartYear] = useState(7);
  const [isSecuritiesModalOpen, setIsSecuritiesModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isAccountLookupModalOpen, setIsAccountLookupModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "הלוואה לזמן קצר",
      productType: "cashCredit",
      limit: 80000,
      expectedUtilizationPct: 75,
      ccfUtilized: 100,
      ccfUndrawn: 40,
      margin: 2.2,
      facilityMode: "standalone",
      termMonths: 12,
      amortizationType: "equalPrincipal",
      riskSaleSaleAmount: 0,
      riskSaleAfterMonths: 6,
      riskSaleBuyerPrice: 0,
    },
    {
      id: 2,
      name: "ערבות ביצוע",
      productType: "performanceGuarantee",
      limit: 30000,
      expectedUtilizationPct: 60,
      ccfUtilized: 50,
      ccfUndrawn: 20,
      margin: 1.4,
    },
    {
      id: 3,
      name: "פעילות נגזרים",
      productType: "derivatives",
      limit: 10000,
      expectedUtilizationPct: 100,
      ccfUtilized: 100,
      ccfUndrawn: 0,
      margin: 0.8,
    },
  ]);
  const [securities, setSecurities] = useState([
    {
      id: 1,
      name: "אג״ח ממשלת ישראל",
      securityType: "govBondLocal",
      marketValue: 20000,
      legalPledge: true,
      marketable: true,
      concentrationLimitOk: true,
      currencyMatch: true,
      securityRating: "aaaToAa",
    },
    {
      id: 2,
      name: "אג״ח קונצרני מדורג",
      securityType: "corpBondRated",
      marketValue: 15000,
      legalPledge: true,
      marketable: true,
      concentrationLimitOk: true,
      currencyMatch: true,
      securityRating: "bbb",
    },
  ]);

  const getSnapshot = () => ({
    clientName,
    dealName,
    riskWeight,
    collateral,
    guarantee,
    capitalRatio,
    segment,
    entityStatus,
    spRating,
    realEstateExposureType,
    viewMode,
    existingEad,
    existingRwa,
    existingAnnualIncome,
    depositBalance,
    depositMargin,
    accountFees,
    guaranteeFees,
    fxFees,
    tradeFinanceFees,
    otherFees,
    infraProjectYears,
    infraConstructionYears,
    infraRampUpYears,
    infraProjectCurrency,
    infraProjectTotalScope,
    infraBankSharePct,
    infraOrganizedByBank,
    infraArrangerName,
    infraDiscountRate,
    infraDepositBalance,
    infraDepositMargin,
    infraAdditionalFees,
    infraOtherIncome,
    infraProjectManagementFeePct,
    infraOneTimeFee,
    infraAnnualFixedFeeEnabled,
    infraAnnualFixedFee,
    infraFees,
    infraProducts,
    infraSecurities,
    infraGuarantees,
    infraConstructionRiskWeight,
    infraOperatingRiskWeight,
    infraRepaymentStartYear,
    activeTab,
    products: JSON.parse(JSON.stringify(products)),
    securities: JSON.parse(JSON.stringify(securities)),
  });

  const applySnapshot = (snapshot) => {
    setClientName(snapshot.clientName);
    setDealName(snapshot.dealName);
    setRiskWeight(snapshot.riskWeight);
    setCollateral(snapshot.collateral);
    setGuarantee(snapshot.guarantee);
    setCapitalRatio(snapshot.capitalRatio);
    setSegment(snapshot.segment);
    setEntityStatus(snapshot.entityStatus);
    setSpRating(snapshot.spRating || "unrated");
    setRealEstateExposureType(snapshot.realEstateExposureType || "none");
    setViewMode(snapshot.viewMode);
    setExistingEad(snapshot.existingEad);
    setExistingRwa(snapshot.existingRwa);
    setExistingAnnualIncome(snapshot.existingAnnualIncome);
    setDepositBalance(snapshot.depositBalance);
    setDepositMargin(snapshot.depositMargin);
    setAccountFees(snapshot.accountFees);
    setGuaranteeFees(snapshot.guaranteeFees);
    setFxFees(snapshot.fxFees);
    setTradeFinanceFees(snapshot.tradeFinanceFees);
    setOtherFees(snapshot.otherFees);
    setInfraProjectYears(snapshot.infraProjectYears || 25);
    setInfraConstructionYears(snapshot.infraConstructionYears || 4);
    setInfraRampUpYears(snapshot.infraRampUpYears || 2);
    setInfraProjectCurrency(snapshot.infraProjectCurrency || "ILS");
    setInfraProjectTotalScope(snapshot.infraProjectTotalScope ?? 1000000);
    setInfraBankSharePct(snapshot.infraBankSharePct ?? 40);
    setInfraOrganizedByBank(snapshot.infraOrganizedByBank ?? true);
    setInfraArrangerName(snapshot.infraArrangerName || "גוף מוסדי / בנק מוביל אחר");
    setInfraDiscountRate(snapshot.infraDiscountRate ?? 0);
    setInfraDepositBalance(snapshot.infraDepositBalance ?? 0);
    setInfraDepositMargin(snapshot.infraDepositMargin ?? 0);
    setInfraAdditionalFees(snapshot.infraAdditionalFees ?? 0);
    setInfraOtherIncome(snapshot.infraOtherIncome ?? 0);
    setInfraProjectManagementFeePct(snapshot.infraProjectManagementFeePct ?? 0);
    setInfraOneTimeFee(snapshot.infraOneTimeFee ?? 0);
    setInfraAnnualFixedFeeEnabled(snapshot.infraAnnualFixedFeeEnabled ?? true);
    setInfraAnnualFixedFee(snapshot.infraAnnualFixedFee ?? 0);
    setInfraFees(snapshot.infraFees || []);
    setInfraProducts(snapshot.infraProducts || []);
    setInfraSecurities(snapshot.infraSecurities || []);
    setInfraGuarantees(snapshot.infraGuarantees || []);
    setInfraConstructionRiskWeight(snapshot.infraConstructionRiskWeight || 150);
    setInfraOperatingRiskWeight(snapshot.infraOperatingRiskWeight || 100);
    setInfraRepaymentStartYear(snapshot.infraRepaymentStartYear || 7);
    setActiveTab(snapshot.activeTab);
    setProducts(snapshot.products || []);
    setSecurities(snapshot.securities || []);
  };

  const saveSnapshot = () => {
    const snapshot = getSnapshot();
    const key = JSON.stringify(snapshot);
    if (key === lastSnapshotKeyRef.current) return;
    historyRef.current = [...historyRef.current.slice(-19), snapshot];
    lastSnapshotKeyRef.current = key;
    setHistoryVersion((value) => value + 1);
  };

  const undoLastAction = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    applySnapshot(previous);
    lastSnapshotKeyRef.current = JSON.stringify(previous);
    setHistoryVersion((value) => value + 1);
  };

  const resetDealFields = () => {
    saveSnapshot();
    setClientName("");
    setDealName("");
    setRiskWeight(100);
    setCollateral(0);
    setGuarantee(0);
    setCapitalRatio(12.5);
    setSegment("corporate");
    setEntityStatus("regular");
    setSpRating("unrated");
    setRealEstateExposureType("none");
    setViewMode("singleDeal");
    setExistingEad(0);
    setExistingRwa(0);
    setExistingAnnualIncome(0);
    setDepositBalance(0);
    setDepositMargin(0);
    setAccountFees(0);
    setGuaranteeFees(0);
    setFxFees(0);
    setTradeFinanceFees(0);
    setOtherFees(0);
    setInfraProjectYears(25);
    setInfraConstructionYears(4);
    setInfraRampUpYears(2);
    setInfraProjectCurrency("ILS");
    setInfraProjectTotalScope(0);
    setInfraBankSharePct(0);
    setInfraOrganizedByBank(true);
    setInfraArrangerName("");
    setInfraDiscountRate(0);
    setInfraDepositBalance(0);
    setInfraDepositMargin(0);
    setInfraAdditionalFees(0);
    setInfraOtherIncome(0);
    setInfraProjectManagementFeePct(0);
    setInfraOneTimeFee(0);
    setInfraAnnualFixedFeeEnabled(true);
    setInfraAnnualFixedFee(0);
    setInfraFees([]);
    setInfraProducts([]);
    setInfraSecurities([]);
    setInfraGuarantees([]);
    setInfraConstructionRiskWeight(150);
    setInfraOperatingRiskWeight(100);
    setInfraRepaymentStartYear(7);
    setActiveTab("products");
    setProducts([]);
    setSecurities([]);
    setIsProductsModalOpen(false);
    setIsSecuritiesModalOpen(false);
    setIsAccountLookupModalOpen(false);
    setIsPrintPreviewOpen(false);
  };

  const printOnePageVersion = () => {
    setIsProductsModalOpen(false);
    setIsSecuritiesModalOpen(false);
    setIsAccountLookupModalOpen(false);
    setIsInfraProductsModalOpen(false);
    setIsInfraGuaranteesModalOpen(false);
    setIsInfraSecuritiesModalOpen(false);
    setIsInfraFeesModalOpen(false);
    setIsPrintPreviewOpen(true);
  };

  const captureHistoryBeforeUserAction = (event) => {
    if (event.target.closest("[data-skip-history='true']")) return;
    saveSnapshot();
  };

  const productsAnalysis = useMemo(() => calculateProductRows(products), [products]);
  const additionalIncome = useMemo(
    () =>
      calculateAdditionalIncome({
        depositBalance,
        depositMargin,
        accountFees,
        guaranteeFees,
        fxFees,
        tradeFinanceFees,
        otherFees,
      }),
    [depositBalance, depositMargin, accountFees, guaranteeFees, fxFees, tradeFinanceFees, otherFees]
  );
  const ratingConfig = RATING_RULES[spRating] || RATING_RULES.unrated;
  const realEstateConfig = REAL_ESTATE_EXPOSURE_RULES[realEstateExposureType] || REAL_ESTATE_EXPOSURE_RULES.none;
  const securitiesAnalysis = useMemo(() => calculateEligibleSecurities(securities), [securities]);
  const entityConfig = ENTITY_STATUS[entityStatus] || ENTITY_STATUS.regular;
  const regulatoryRiskWeight = entityConfig.riskWeight;
  const ratingRiskWeight = ratingConfig.riskWeight;
  const realEstateRiskWeight = realEstateConfig.riskWeightOverride;

  const result = useMemo(
    () =>
      calculateRwaResult({
        exposure: productsAnalysis.totalUtilized,
        productEad: productsAnalysis.totalEad,
        productAnnualIncome: productsAnalysis.totalAnnualIncome,
        additionalAnnualIncome: additionalIncome.totalAdditionalIncome,
        riskSaleRwaReduction: productsAnalysis.totalRiskSaleRwaReduction,
        margin: productsAnalysis.weightedMargin,
        riskWeight,
        regulatoryRiskWeight,
        ratingRiskWeight,
        realEstateRiskWeight,
        collateral,
        securitiesCollateralEligibleValue: securitiesAnalysis.totalEligibleValue,
        guarantee,
        ccf: productsAnalysis.weightedCcfUndrawn,
        undrawn: productsAnalysis.totalUndrawn,
        capitalRatio,
        existingEad,
        existingRwa,
        existingAnnualIncome,
      }),
    [
      productsAnalysis,
      additionalIncome.totalAdditionalIncome,
      productsAnalysis.totalRiskSaleRwaReduction,
      riskWeight,
      regulatoryRiskWeight,
      ratingRiskWeight,
      realEstateRiskWeight,
      collateral,
      securitiesAnalysis.totalEligibleValue,
      guarantee,
      capitalRatio,
      existingEad,
      existingRwa,
      existingAnnualIncome,
    ]
  );

  const calculationTests = useMemo(() => runCalculationTests(), []);
  const allTestsPassed = calculationTests.every((test) => test.passed);

  const waterfall = useMemo(
    () => [
      { name: "לפני הקלות", value: Number(result.rwaBase.toFixed(1)) },
      {
        name: "הנחת PSE/רשות",
        value: Number((-(result.ead - result.eligibleCollateral - result.eligibleGuarantee) * Math.max(result.manualRiskWeight - result.effectiveRiskWeight, 0) / 100).toFixed(1)),
      },
      { name: "חיסכון מבטוחות", value: Number((-result.collateralRwaSaving).toFixed(1)) },
      {
        name: "חיסכון מערבות CRM",
        value: Number((-result.guaranteeRwaSaving).toFixed(1)),
      },
      {
        name: "מכירת סיכון",
        value: Number((-result.eligibleRiskSaleRwaReduction).toFixed(1)),
      },
      { name: "אחרי אופטימיזציה", value: Number(result.rwaAfter.toFixed(1)) },
    ],
    [result]
  );

  const scenarios = useMemo(
    () => [
      { name: "Base", returnOnRwa: Number(result.returnOnRwaBase.toFixed(2)), rwa: Number(result.rwaBase.toFixed(1)) },
      { name: "PSE/CRM", returnOnRwa: Number(result.returnOnRwaAfter.toFixed(2)), rwa: Number(result.rwaAfter.toFixed(1)) },
      {
        name: "+ תמחור",
        returnOnRwa: Number((result.returnOnRwaAfter + 0.18).toFixed(2)),
        rwa: Number(result.rwaAfter.toFixed(1)),
      },
      {
        name: "+ מבנה",
        returnOnRwa: Number((result.returnOnRwaAfter + 0.31).toFixed(2)),
        rwa: Number(Math.max(result.rwaAfter - 4, 0).toFixed(1)),
      },
    ],
    [result]
  );

  const existingPlusNewDeal = useMemo(
    () => [
      {
        name: "מצב קיים",
        ead: Number(result.existingEad.toFixed(1)),
        rwa: Number(result.existingRwa.toFixed(1)),
        returnOnRwa: Number(result.existingReturnOnRwa.toFixed(2)),
      },
      {
        name: "עסקה חדשה",
        ead: Number(result.incrementalEad.toFixed(1)),
        rwa: Number(result.incrementalRwa.toFixed(1)),
        returnOnRwa: Number(result.returnOnRwaAfter.toFixed(2)),
      },
      {
        name: "סה״כ אחרי",
        ead: Number(result.totalEadAfterNewDeal.toFixed(1)),
        rwa: Number(result.totalRwaAfterNewDeal.toFixed(1)),
        returnOnRwa: Number(result.totalReturnOnRwaAfterNewDeal.toFixed(2)),
      },
    ],
    [result]
  );

  const productChartData = useMemo(
    () =>
      productsAnalysis.rows.map((row) => ({
        name: row.ruleLabel,
        utilized: Number(row.utilizedAmount.toFixed(1)),
        undrawn: Number(row.undrawnAmount.toFixed(1)),
        ead: Number(row.ead.toFixed(1)),
      })),
    [productsAnalysis]
  );

  const creditUtilizationForecast = useMemo(
    () => calculateMonthlyCreditForecast(productsAnalysis.rows, result.effectiveRiskWeight),
    [productsAnalysis.rows, result.effectiveRiskWeight]
  );

  const infrastructureForecast = useMemo(
    () =>
      calculateInfrastructureProjectForecast({
        projectYears: infraProjectYears,
        constructionYears: infraConstructionYears,
        rampUpYears: infraRampUpYears,
        projectCurrency: infraProjectCurrency,
        projectTotalScope: infraProjectTotalScope,
        bankSharePct: infraBankSharePct,
        organizedByBank: infraOrganizedByBank,
        arrangerName: infraArrangerName,
        discountRate: infraDiscountRate,
        depositBalance: infraDepositBalance,
        depositMargin: infraDepositMargin,
        additionalFees: infraAdditionalFees,
        otherIncome: infraOtherIncome,
        projectManagementFeePct: infraProjectManagementFeePct,
        oneTimeFee: infraOneTimeFee,
        annualFixedFeeEnabled: infraAnnualFixedFeeEnabled,
        annualFixedFee: infraAnnualFixedFee,
        fees: infraFees,
        products: infraProducts,
        securities: infraSecurities,
        guarantees: infraGuarantees,
        constructionRiskWeight: infraConstructionRiskWeight,
        operatingRiskWeight: infraOperatingRiskWeight,
        repaymentStartYear: infraRepaymentStartYear,
      }),
    [
      infraProjectYears,
      infraConstructionYears,
      infraRampUpYears,
      infraProjectCurrency,
      infraProjectTotalScope,
      infraBankSharePct,
      infraOrganizedByBank,
      infraArrangerName,
      infraDiscountRate,
      infraDepositBalance,
      infraDepositMargin,
      infraAdditionalFees,
      infraOtherIncome,
      infraProjectManagementFeePct,
      infraOneTimeFee,
      infraAnnualFixedFeeEnabled,
      infraAnnualFixedFee,
      infraFees,
      infraProducts,
      infraSecurities,
      infraGuarantees,
      infraConstructionRiskWeight,
      infraOperatingRiskWeight,
      infraRepaymentStartYear,
    ]
  );

  const hasRiskSale = productsAnalysis.totalRiskSaleSaleAmount > 0;
  const resultBeforeRiskSale = useMemo(
    () =>
      calculateRwaResult({
        exposure: productsAnalysis.totalUtilized,
        productEad: productsAnalysis.totalEad,
        productAnnualIncome: productsAnalysis.totalAnnualIncome + productsAnalysis.totalRiskSaleCost,
        additionalAnnualIncome: additionalIncome.totalAdditionalIncome,
        riskSaleRwaReduction: 0,
        margin: productsAnalysis.weightedMargin,
        riskWeight,
        regulatoryRiskWeight,
        ratingRiskWeight,
        realEstateRiskWeight,
        collateral,
        securitiesCollateralEligibleValue: securitiesAnalysis.totalEligibleValue,
        guarantee,
        ccf: productsAnalysis.weightedCcfUndrawn,
        undrawn: productsAnalysis.totalUndrawn,
        capitalRatio,
        existingEad,
        existingRwa,
        existingAnnualIncome,
      }),
    [
      productsAnalysis,
      additionalIncome.totalAdditionalIncome,
      riskWeight,
      regulatoryRiskWeight,
      ratingRiskWeight,
      realEstateRiskWeight,
      collateral,
      securitiesAnalysis.totalEligibleValue,
      guarantee,
      capitalRatio,
      existingEad,
      existingRwa,
      existingAnnualIncome,
    ]
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body { background: white !important; }
          .print-hide { display: none !important; }
          .print-page { padding: 0 !important; background: white !important; }
          .print-container { max-width: none !important; width: 100% !important; transform: scale(0.72); transform-origin: top right; }
          .print-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 8px !important; }
          .print-panel { padding: 10px !important; box-shadow: none !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid; }
          .print-panel h2 { font-size: 15px !important; margin-bottom: 8px !important; }
          .print-panel .mb-5 { margin-bottom: 8px !important; }
          .print-panel .space-y-4 > * + * { margin-top: 6px !important; }
          .print-panel input[type='range'] { display: none !important; }
          .print-panel .rounded-3xl { border-radius: 12px !important; }
          .print-panel .p-4 { padding: 8px !important; }
          .print-header { padding: 12px !important; box-shadow: none !important; }
          .print-header h1 { font-size: 20px !important; }
          .print-header p { display: none !important; }
          .print-kpis { width: 100% !important; gap: 6px !important; }
          .print-kpis > div { padding: 8px !important; }
          .print-kpis .text-3xl { font-size: 20px !important; }
        }
      `}</style>
      <div
      className="print-page min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6"
      dir="rtl"
      onPointerDownCapture={captureHistoryBeforeUserAction}
      onKeyDownCapture={captureHistoryBeforeUserAction}
    >
      <div className="print-container mx-auto max-w-[1800px] space-y-6">
        <Header
          result={result}
          viewMode={viewMode}
          productsAnalysis={productsAnalysis}
          infrastructureForecast={infrastructureForecast}
          clientName={clientName}
          dealName={dealName}
        />

        <div className="print-hide rounded-3xl bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-8">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-slate-600">שם לקוח</span>
              <input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="הקלידי שם לקוח"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-200 transition focus:ring-4"
              />
            </label>
            <label className="space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-slate-600">שם / תיאור עסקה</span>
              <input
                value={dealName}
                onChange={(event) => setDealName(event.target.value)}
                placeholder="לדוגמה: הגדלת מסגרות + ערבויות"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-200 transition focus:ring-4"
              />
            </label>
            <div className="flex gap-2 xl:col-span-4">
              <button
                type="button"
                data-skip-history="true"
                onClick={() => setIsAccountLookupModalOpen(true)}
                className="flex-[1.4] rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                טעינת נתוני לקוח/חשבון
              </button>
              <button
                type="button"
                data-skip-history="true"
                onClick={printOnePageVersion}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <span className="inline-flex items-center gap-2"><Printer className="h-4 w-4" /> גרסת הדפסה</span>
              </button>
              <button
                type="button"
                data-skip-history="true"
                onClick={resetDealFields}
                className="flex-1 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                איפוס
              </button>
              <button
                type="button"
                data-skip-history="true"
                onClick={undoLastAction}
                disabled={historyRef.current.length === 0}
                className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                בטל
              </button>
            </div>
          </div>
        </div>

        <div className="print-hide flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
          <TabButton active={viewMode === "singleDeal"} onClick={() => setViewMode("singleDeal")}>
            עסקה בודדת
          </TabButton>
          <TabButton active={viewMode === "existingPlusNew"} onClick={() => setViewMode("existingPlusNew")}>
            מצב קיים + עסקה חדשה
          </TabButton>
          <TabButton active={viewMode === "infrastructureProject"} onClick={() => setViewMode("infrastructureProject")}>
            פרויקט תשתית
          </TabButton>
        </div>

        {viewMode === "existingPlusNew" && (
          <div className="print-hide rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">מצב קיים של הלקוח בבנק</h2>
                <p className="text-sm text-slate-500">נתוני בסיס שמגיעים ממערכות הבנק ומשמשים להשוואה מול העסקה החדשה.</p>
              </div>
              <Badge tone="blue">קלט מצב קיים — לא חלק ממנוע ההקלות</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <MetricInput label="EAD קיים, ₪k" value={existingEad} setValue={setExistingEad} min={0} max={1000000} />
              <MetricInput label="RWA קיים, ₪k" value={existingRwa} setValue={setExistingRwa} min={0} max={1000000} />
              <MetricInput label="הכנסה שנתית קיימת, ₪k" value={existingAnnualIncome} setValue={setExistingAnnualIncome} min={0} max={100000} step={10} />
              <SummaryBox title="תשואה ל־RWA קיימת" value={`${result.existingReturnOnRwa.toFixed(2)}%`} positive />
              <SummaryBox title="הון קיים נדרש" value={formatK(result.existingCapital)} />
              <SummaryBox title="מצב אחרי עסקה" value={formatK(result.totalRwaAfterNewDeal)} positive />
            </div>
          </div>
        )}

        {viewMode === "infrastructureProject" && (
          <InfrastructureProjectPanel
            forecast={infrastructureForecast}
            projectYears={infraProjectYears}
            setProjectYears={setInfraProjectYears}
            constructionYears={infraConstructionYears}
            setConstructionYears={setInfraConstructionYears}
            rampUpYears={infraRampUpYears}
            setRampUpYears={setInfraRampUpYears}
            projectCurrency={infraProjectCurrency}
            setProjectCurrency={setInfraProjectCurrency}
            feeBaseAmount={infrastructureForecast.bankShareAmount}
            setProjectTotalScope={setInfraProjectTotalScope}
            bankSharePct={infraBankSharePct}
            setBankSharePct={setInfraBankSharePct}
            organizedByBank={infraOrganizedByBank}
            setOrganizedByBank={setInfraOrganizedByBank}
            arrangerName={infraArrangerName}
            setArrangerName={setInfraArrangerName}
            discountRate={infraDiscountRate}
            setDiscountRate={setInfraDiscountRate}
            depositBalance={infraDepositBalance}
            setDepositBalance={setInfraDepositBalance}
            depositMargin={infraDepositMargin}
            setDepositMargin={setInfraDepositMargin}
            additionalFees={infraAdditionalFees}
            setAdditionalFees={setInfraAdditionalFees}
            otherIncome={infraOtherIncome}
            setOtherIncome={setInfraOtherIncome}
            projectManagementFeePct={infraProjectManagementFeePct}
            setProjectManagementFeePct={setInfraProjectManagementFeePct}
            oneTimeFee={infraOneTimeFee}
            setOneTimeFee={setInfraOneTimeFee}
            annualFixedFeeEnabled={infraAnnualFixedFeeEnabled}
            setAnnualFixedFeeEnabled={setInfraAnnualFixedFeeEnabled}
            annualFixedFee={infraAnnualFixedFee}
            setAnnualFixedFee={setInfraAnnualFixedFee}
            fees={infraFees}
            setFees={setInfraFees}
            products={infraProducts}
            setProducts={setInfraProducts}
            guarantees={infraGuarantees}
            setGuarantees={setInfraGuarantees}
            securities={infraSecurities}
            setSecurities={setInfraSecurities}
            onOpenProducts={(stage, lenderType = "bank") => {
              setInfraProductsModalStage({ stage: stage || "construction", lenderType });
              setIsInfraProductsModalOpen(true);
            }}
            onOpenGuarantees={() => setIsInfraGuaranteesModalOpen(true)}
            onOpenSecurities={() => setIsInfraSecuritiesModalOpen(true)}
            onOpenFees={() => setIsInfraFeesModalOpen(true)}
            constructionRiskWeight={infraConstructionRiskWeight}
            setConstructionRiskWeight={setInfraConstructionRiskWeight}
            operatingRiskWeight={infraOperatingRiskWeight}
            setOperatingRiskWeight={setInfraOperatingRiskWeight}
            repaymentStartYear={infraRepaymentStartYear}
            setRepaymentStartYear={setInfraRepaymentStartYear}
          />
        )}

        {viewMode !== "infrastructureProject" && (
        <div className="print-grid grid gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">עסקה חדשה — סל מוצרים</h2>
              <PackagePlus className="h-5 w-5 text-orange-500" />
            </div>

            <div className="mb-5 rounded-3xl border border-orange-100 bg-orange-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-orange-900">מוצרי העסקה</h3>
                  <p className="text-xs text-orange-800">מסגרת, צפי ניצול, CCF ומרווח</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductsModalOpen(true)}
                  className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                >
                  הזנת מוצרים
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <SummaryBox title="חבות ברוטו" value={formatK(productsAnalysis.totalLimit)} />
                <SummaryBox title="צפי ניצול" value={formatK(productsAnalysis.totalUtilized)} />
                <SummaryBox title="EAD" value={formatK(productsAnalysis.totalEad)} positive />
                <SummaryBox title="מרווח משוקלל" value={`${productsAnalysis.weightedMargin.toFixed(2)}%`} positive />
              </div>
              <div className="mt-3 text-xs text-orange-900">
                CCF משוקלל: מנוצל {productsAnalysis.weightedCcfUtilized.toFixed(1)}% | לא מנוצל {productsAnalysis.weightedCcfUndrawn.toFixed(1)}%
              </div>
            </div>

            <label className="mb-5 block space-y-2">
              <span className="text-sm font-medium">סגמנט / סיווג חשיפה</span>
              <select
                value={segment}
                onChange={(event) => setSegment(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 transition focus:ring-4"
              >
                {Object.entries(SEGMENTS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-5 block space-y-2">
              <span className="text-sm font-medium">סטטוס רגולטורי</span>
              <select
                value={entityStatus}
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  setEntityStatus(nextStatus);
                  if (nextStatus === "pseRecognized") setSegment("pse");
                  if (nextStatus === "municipalityDiscount") setSegment("municipality");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 transition focus:ring-4"
              >
                {Object.entries(ENTITY_STATUS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-5 block space-y-2">
              <span className="text-sm font-medium">דירוג חברה לפי S&P</span>
              <select
                value={spRating}
                onChange={(event) => setSpRating(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 transition focus:ring-4"
              >
                {Object.entries(RATING_RULES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">
                משקל סיכון לפי דירוג הלווה: {ratingConfig.riskWeight}%. הדירוג משפיע על RWA בלבד; כשירות בטוחות נקבעת לפי סוג ודירוג ני״ע.
              </div>
            </label>

            <label className="mb-5 block space-y-2">
              <span className="text-sm font-medium">סוג חשיפת נדל״ן / פרויקט</span>
              <select
                value={realEstateExposureType}
                onChange={(event) => setRealEstateExposureType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 transition focus:ring-4"
              >
                {Object.entries(REAL_ESTATE_EXPOSURE_RULES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">{realEstateConfig.note}</div>
            </label>

            <div className="mb-5 rounded-3xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">
              <b>משקל סיכון אפקטיבי:</b> {result.effectiveRiskWeight.toFixed(0)}%
              {regulatoryRiskWeight !== null && (
                <div className="mt-1 text-xs">
                  במקום {result.manualRiskWeight.toFixed(0)}%. הערך להדגמה בלבד.
                </div>
              )}
            </div>

            <MetricInput label="משקל סיכון בסיסי, %" value={riskWeight} setValue={setRiskWeight} min={20} max={150} />
            <MetricInput
              label="יחס הון פנימי, %"
              value={capitalRatio}
              setValue={setCapitalRatio}
              min={8}
              max={16}
              step={0.1}
              help="היחס שבו הבנק מתרגם RWA להון נדרש לצורכי ניהול. לדוגמה: RWA של ₪100,000k × יחס הון 12.5% = ₪12,500k הון נדרש. זה יכול לשקף יעד פנימי, דרישת הון רגולטורית בתוספת כריות, או שיעור הקצאת הון שהבנק קובע לצורכי תשואה וניהול." 
            />
          </Panel>

          <Panel className="xl:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">הכנסות נוספות</h2>
              <TrendingUp className="h-5 w-5 text-sky-600" />
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
              <p className="mb-4 text-xs text-sky-800">הכנסות שאינן צורכות RWA בעסקה החדשה: פקדונות, עמלות, מט״ח וסחר חוץ.</p>
              <MetricInput label="יתרת פקדונות צפויה, ₪k" value={depositBalance} setValue={setDepositBalance} min={0} max={1000000} />
              <MetricInput label="מרווח על פקדונות, %" value={depositMargin} setValue={setDepositMargin} min={0} max={10} step={0.05} />
              <MetricInput label="עמלות חשבון וניהול, ₪k" value={accountFees} setValue={setAccountFees} min={0} max={20000} step={10} />
              <MetricInput label="עמלות ערבויות, ₪k" value={guaranteeFees} setValue={setGuaranteeFees} min={0} max={20000} step={10} />
              <MetricInput label="עמלות מט״ח/חדר עסקאות, ₪k" value={fxFees} setValue={setFxFees} min={0} max={20000} step={10} />
              <MetricInput label="עמלות סחר חוץ, ₪k" value={tradeFinanceFees} setValue={setTradeFinanceFees} min={0} max={20000} step={10} />
              <MetricInput label="עמלות אחרות, ₪k" value={otherFees} setValue={setOtherFees} min={0} max={20000} step={10} />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <SummaryBox title="פקדונות" value={formatK(additionalIncome.annualDepositIncome)} positive />
                <SummaryBox title="עמלות" value={formatK(additionalIncome.totalFeeIncome)} positive />
                <SummaryBox title="סה״כ" value={formatK(additionalIncome.totalAdditionalIncome)} positive />
              </div>
            </div>
          </Panel>

          <Panel className="xl:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">מנוע הקלות מותרות</h2>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>


            <div className="mb-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-emerald-900">ני״ע/פקדון משועבדים לבטוחה</h3>
                  <p className="text-xs text-emerald-800">בדיקת כשירות, haircut ושווי מוכר אוטומטי</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSecuritiesModalOpen(true)}
                  className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                >
                  הזנת ני״ע
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <SummaryBox title="שווי שוק" value={formatK(securitiesAnalysis.totalMarketValue)} />
                <SummaryBox title="שווי כשיר" value={formatK(securitiesAnalysis.totalEligibleValue)} positive />
                <SummaryBox title="לא כשירים" value={`${securitiesAnalysis.ineligibleCount}`} warning />
              </div>
            </div>

            <MetricInput
              label="בטוחות פיננסיות אחרות כשירות, ₪k — להזין רק סכום כשיר"
              value={collateral}
              setValue={setCollateral}
              min={0}
              max={1000000}
            />

            <div className="mb-5 rounded-3xl bg-slate-100 p-4 text-sm">
              <div className="flex justify-between">
                <span>סה״כ בטוחות פיננסיות כשירות לחישוב</span>
                <b>{formatK(result.totalFinancialCollateral)}</b>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                כולל {formatK(result.securitiesCollateralEligibleValue)} מני״ע לאחר haircut + {formatK(result.manualCollateral)} בטוחות אחרות. יש להזין בשדות הידניים רק סכומים שכבר נבדקו ונמצאו כשירים.
              </div>
            </div>

            <MetricInput
              label="ערבות כשירה להפחתת RWA (CRM), ₪k — להזין רק סכום כשיר"
              value={guarantee}
              setValue={setGuarantee}
              min={0}
              max={1000000}
            />

            <div className="mb-5 rounded-3xl bg-violet-50 p-4 text-sm text-violet-900">
              <div className="flex justify-between gap-3">
                <span>ערבות מוכרת בפועל לאחר בטוחות</span>
                <b>{formatK(result.eligibleGuarantee)}</b>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span>חיסכון RWA מערבות CRM</span>
                <b>{formatK(result.guaranteeRwaSaving)}</b>
              </div>
              <div className="mt-1 text-xs">
                הערבות כאן היא CRM שמפחיתה RWA רק על יתרת החשיפה שלא כוסתה בבטוחות. יש להזין רק את סכום הערבות הכשיר והמוכר להפחתת RWA. ערבויות ביצוע / חוק מכר / כספיות בתוך סל המוצרים הן מוצרי חשיפה שמייצרים EAD לפי CCF.
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Badge tone="green">Legal certainty ✓</Badge>
              <Badge tone="orange">Haircuts נבדקו</Badge>
              <Badge tone="blue">כשירות לפי דירוג ני״ע</Badge>
              <Badge tone="purple">מגבלות ריכוזיות</Badge>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-100 p-4 text-sm leading-6">
              <b>המלצות מנוע:</b>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>סל המוצרים מחשב EAD והכנסות אשראי לפי CCF ומרווח נפרדים לכל מוצר.</li>
                <li>אזור ההכנסות הנוספות מוסיף לתשואה לנכסי סיכון הכנסות מפקדונות ועמלות שאינן מגדילות את EAD.</li>
                <li>הזנת ני״ע/פקדון משועבדים לבטוחה מחשבת שווי כשיר לאחר haircut ובדיקות בסיס.</li>
                <li>בדוק אם הלקוח הוא PSE מוכר או רשות מקומית הזכאית למשקל סיכון מופחת.</li>
                <li>שמור בטבלת פרמטרים את CCF, משקל הסיכון לפי דירוג לווה S&P, סוגי חשיפות נדל״ן/תשתיות בהקמה, סוגי ני״ע מוכרים ו־haircuts המאושרים.</li>
                <li>הפרד בין דירוג הלווה, שמשפיע על RWA, לבין דירוג ני״ע לבטוחה, שמשפיע על כשירות הבטוחה וה־haircut.</li>
              </ul>
            </div>
          </Panel>

          <Panel className="xl:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">תוצאה ניהולית</h2>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div className="space-y-5">
              {viewMode === "singleDeal" ? (
                <>
                  <ResultSection title="נכסי סיכון">
                    <Kpi title="חבות מלאה ברוטו" value={formatK(productsAnalysis.totalLimit)} />
                    <Kpi title="חשיפה לאחר CCF / EAD" value={formatK(result.ead)} />
                    <Kpi title="חיסכון RWA מבטחונות" value={formatK(result.collateralRwaSaving)} positive />
                    <Kpi title="חיסכון RWA מערבות CRM" value={formatK(result.guaranteeRwaSaving)} positive />
                    <Kpi title="חיסכון RWA מ-PSE/דירוג/סיווג" value={formatK(Math.max(0, result.rwaBase - result.ead * (result.effectiveRiskWeight / 100)))} positive />
                    <Kpi title="RWA סופי" value={formatK(result.rwaAfter)} positive />
                  </ResultSection>

                  <ResultSection title="הכנסות ותשואה">
                    <Kpi title="מרווח אשראי משוקלל" value={`${productsAnalysis.weightedMargin.toFixed(2)}%`} />
                    <Kpi title="הכנסות מאשראי" value={formatK(result.productAnnualIncome)} positive />
                    <Kpi title="הכנסות נוספות" value={formatK(additionalIncome.totalAdditionalIncome)} positive />
                    <Kpi title="הכנסה שנתית כוללת" value={formatK(result.annualIncome)} positive />
                    {hasRiskSale && <Kpi title="תשואה לפני מכירה" value={`${resultBeforeRiskSale.returnOnRwaAfter.toFixed(2)}%`} />}
                    {hasRiskSale && <Kpi title="תשואה אחרי מכירה" value={`${result.returnOnRwaAfter.toFixed(2)}%`} positive />}
                    {!hasRiskSale && <Kpi title="תשואה לנכסי סיכון" value={`${result.returnOnRwaAfter.toFixed(2)}%`} positive />}
                    <Kpi
                      title="הון נדרש שנחסך"
                      value={formatK(result.capitalSaving)}
                      positive
                      help="מחושב כחיסכון ב-RWA כפול יחס ההון הפנימי. יחס ההון הפנימי הוא שיעור ההון שהבנק מקצה מול נכסי סיכון לצורכי ניהול/רגולציה. לדוגמה: חיסכון RWA של ₪10,000k × יחס הון 12.5% = ₪1,250k הון נדרש שנחסך."
                    />
                    <Kpi
                      title="שיפור תשואה ל־RWA"
                      value={`+${(result.returnOnRwaAfter - result.returnOnRwaBase).toFixed(2)} נק׳`}
                      positive
                      help="הפער בנקודות אחוז בין תשואה לנכסי סיכון אחרי ההקלות לבין התשואה לפני ההקלות. לדוגמה: מ־2.00% ל־2.40% = שיפור של 0.40 נק׳."
                    />
                  </ResultSection>
                </>
              ) : (
                <>
                  <ResultSection title="נכסי סיכון — עסקה חדשה">
                    <Kpi title="חבות ברוטו עסקה חדשה" value={formatK(productsAnalysis.totalLimit)} />
                    <Kpi title="חשיפה לאחר CCF / EAD" value={formatK(result.incrementalEad)} />
                    <Kpi title="חיסכון RWA מבטחונות" value={formatK(result.collateralRwaSaving)} positive />
                    <Kpi title="חיסכון RWA מערבות CRM" value={formatK(result.guaranteeRwaSaving)} positive />
                    <Kpi title="RWA עסקה חדשה" value={formatK(result.incrementalRwa)} positive />
                  </ResultSection>

                  <ResultSection title="הכנסות ותשואה — עסקה חדשה">
                    <Kpi title="מרווח אשראי משוקלל" value={`${productsAnalysis.weightedMargin.toFixed(2)}%`} />
                    <Kpi title="הכנסות מאשראי" value={formatK(result.productAnnualIncome)} positive />
                    <Kpi title="הכנסות נוספות" value={formatK(additionalIncome.totalAdditionalIncome)} positive />
                    <Kpi title="הכנסה שנתית עסקה" value={formatK(result.incrementalAnnualIncome)} positive />
                    {hasRiskSale && <Kpi title="תשואה לפני מכירה" value={`${resultBeforeRiskSale.returnOnRwaAfter.toFixed(2)}%`} />}
                    {hasRiskSale && <Kpi title="תשואה אחרי מכירה" value={`${result.returnOnRwaAfter.toFixed(2)}%`} positive />}
                    {!hasRiskSale && <Kpi title="תשואה לנכסי סיכון — עסקה" value={`${result.returnOnRwaAfter.toFixed(2)}%`} positive />}
                    <Kpi title="הון נוסף נדרש" value={formatK(result.incrementalCapital)} />
                  </ResultSection>

                  <ResultSection title="השפעה מצטברת על לקוח קיים">
                    <Kpi title="RWA מצב קיים" value={formatK(result.existingRwa)} muted />
                    <Kpi title="RWA כולל אחרי" value={formatK(result.totalRwaAfterNewDeal)} positive />
                    <Kpi title="הכנסה כוללת אחרי" value={formatK(result.totalAnnualIncomeAfterNewDeal)} positive />
                    <Kpi title="תשואה לנכסי סיכון כולל" value={`${result.totalReturnOnRwaAfterNewDeal.toFixed(2)}%`} positive />
                  </ResultSection>
                </>
              )}
            </div>

            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> בקרות לפני אישור
              </div>
              <p className="mt-1">
                לא להציג כהמלצה אוטומטית ללא אימות: CCF לפי סוג מוצר, דירוג הלווה והשפעתו על RWA, סיווג קרקע/פרויקט בהקמה,
                הכרה כ־PSE או רשות מקומית, כשירות ני״ע לבטוחה לפי דירוג ני״ע, שעבוד משפטי, שווי שוק, סחירות, Haircuts,
                מגבלת ריכוזיות, מגבלת לווה/קבוצה ומדיניות אשראי פנימית.
              </p>
            </div>

            <div className={`mt-4 rounded-3xl p-4 text-sm ${allTestsPassed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              <b>בדיקות חישוב:</b> {allTestsPassed ? "עברו בהצלחה" : "נמצאה חריגה"}
              {!allTestsPassed && (
                <ul className="mt-2 list-inside list-disc">
                  {calculationTests
                    .filter((test) => !test.passed)
                    .map((test) => (
                      <li key={test.name}>{test.name}</li>
                    ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
        )}

        {viewMode !== "infrastructureProject" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
            <TabButton active={activeTab === "products"} onClick={() => setActiveTab("products")}>
              סל מוצרים
            </TabButton>
            <TabButton active={activeTab === "waterfall"} onClick={() => setActiveTab("waterfall")}>
              פירוק RWA
            </TabButton>
            <TabButton active={activeTab === "scenarios"} onClick={() => setActiveTab("scenarios")}>
              תרחישי תשואה
            </TabButton>
            <TabButton active={activeTab === "existingPlusNew"} onClick={() => setActiveTab("existingPlusNew")}>
              מצב קיים + עסקה
            </TabButton>
            <TabButton active={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")}>
              תצוגת תיק
            </TabButton>
            <TabButton active={activeTab === "definitions"} onClick={() => setActiveTab("definitions")}>
              הגדרות ומונחים
            </TabButton>
          </div>

          {activeTab === "products" && (
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">פירוק עסקה חדשה לפי מוצרים ו־CCF</div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="orange">חבות ברוטו: {formatK(productsAnalysis.totalLimit)}</Badge>
                  <Badge tone="blue">EAD: {formatK(productsAnalysis.totalEad)}</Badge>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="h-80 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productChartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatK(Number(value))} />
                      <Bar dataKey="utilized" fill="#94a3b8" radius={[12, 12, 0, 0]} name="צפי ניצול" />
                      <Bar dataKey="ead" fill="#f97316" radius={[12, 12, 0, 0]} name="EAD" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <CompactProductsTable rows={productsAnalysis.rows} />
              </div>
            </Panel>
          )}

          {activeTab === "waterfall" && (
            <Panel>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfall} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatK(Number(value))} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          {activeTab === "scenarios" && (
            <Panel>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenarios} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "returnOnRwa" ? `${Number(value).toFixed(2)}%` : formatK(Number(value))
                      }
                    />
                    <Line type="monotone" dataKey="returnOnRwa" stroke="#f97316" strokeWidth={3} dot={{ r: 5 }} name="תשואה ל־RWA" />
                    <Line type="monotone" dataKey="rwa" stroke="#64748b" strokeWidth={2} dot={{ r: 4 }} name="RWA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          {activeTab === "existingPlusNew" && (
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">השוואת מצב קיים + תוספת עסקה חדשה</div>
                <Badge tone="blue">כולל סל מוצרים + PSE / רשות מקומית + ני״ע/פקדון משועבדים לבטוחה</Badge>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="h-80 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={existingPlusNewDeal} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatK(Number(value))} />
                      <Bar dataKey="ead" fill="#94a3b8" radius={[12, 12, 0, 0]} name="EAD" />
                      <Bar dataKey="rwa" fill="#f97316" radius={[12, 12, 0, 0]} name="RWA" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-hidden rounded-2xl border bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3 text-right">מצב</th>
                        <th className="p-3 text-right">EAD</th>
                        <th className="p-3 text-right">RWA</th>
                        <th className="p-3 text-right">תשואה ל־RWA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingPlusNewDeal.map((row) => (
                        <tr className="border-t" key={row.name}>
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3">{formatK(row.ead)}</td>
                          <td className="p-3">{formatK(row.rwa)}</td>
                          <td className="p-3">{row.returnOnRwa.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}

          {activeTab === "definitions" && (
            <DefinitionsPanel />
          )}

          {activeTab === "portfolio" && (
            <Panel>
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Landmark className="h-5 w-5" /> תיעדוף עסקאות לפי פוטנציאל שיפור
              </div>
              <div className="overflow-hidden rounded-2xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-3 text-right">לקוח</th>
                      <th className="p-3 text-right">סטטוס</th>
                      <th className="p-3 text-right">RWA נוכחי</th>
                      <th className="p-3 text-right">פוטנציאל חיסכון</th>
                      <th className="p-3 text-right">תשואה ל־RWA אחרי</th>
                      <th className="p-3 text-right">פעולה מומלצת</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["חברה א׳", "תאגיד רגיל", "₪80m", "₪18m", "2.18%", "הוספת בטוחה פיננסית"],
                      ["רשות ב׳", "רשות מקומית", "₪45m", "₪21m", "2.85%", "בדיקת זכאות למשקל סיכון מועדף"],
                      ["גוף ג׳", "PSE מוכר", "₪120m", "₪34m", "2.39%", "עדכון סיווג חשיפה במנוע RWA"],
                    ].map((row) => (
                      <tr className="border-t" key={row[0]}>
                        {row.map((cell) => (
                          <td className="p-3" key={cell}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
        )}

        {viewMode !== "infrastructureProject" && (
        <Panel>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">תחזית ניצול אשראי, מסגרות ונכסי סיכון — 12 חודשים</div>
              <div className="text-sm text-slate-500">
                בהלוואות לזמן ארוך התחזית משתמשת בלוח הסילוקין; במוצר מכירת סיכון ה־RWA יורד רק מהחודש שאחרי מועד המכירה הצפוי.
              </div>
            </div>
            <Badge tone="blue">פער מסגרת לא מנוצלת: {formatK(creditUtilizationForecast[0]?.gap || 0)} בחודש 1</Badge>
          </div>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creditUtilizationForecast} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatK(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="limit" stroke="#64748b" strokeWidth={3} dot={{ r: 4 }} name="מסגרות" />
                <Line type="monotone" dataKey="utilized" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="ניצול אשראי" />
                <Line type="monotone" dataKey="rwa" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="נכסי סיכון" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        )}
      </div>

      {isPrintPreviewOpen && (
        <PrintPreviewModal
          clientName={clientName}
          dealName={dealName}
          viewMode={viewMode}
          result={result}
          productsAnalysis={productsAnalysis}
          additionalIncome={additionalIncome}
          entityStatus={entityStatus}
          spRating={spRating}
          realEstateExposureType={realEstateExposureType}
          infrastructureForecast={infrastructureForecast}
          projectYears={infraProjectYears}
          constructionYears={infraConstructionYears}
          rampUpYears={infraRampUpYears}
          onClose={() => setIsPrintPreviewOpen(false)}
        />
      )}

      {isAccountLookupModalOpen && (
        <AccountLookupModal onClose={() => setIsAccountLookupModalOpen(false)} />
      )}

      {isProductsModalOpen && (
        <ProductsModal
          products={products}
          setProducts={setProducts}
          analysis={productsAnalysis}
          onBeforeChange={saveSnapshot}
          onClose={() => setIsProductsModalOpen(false)}
        />
      )}

      {isInfraProductsModalOpen && (
        <InfraProductsModal
          products={infraProducts}
          setProducts={setInfraProducts}
          projectCurrency={infraProjectCurrency}
          stage={typeof infraProductsModalStage === "string" ? infraProductsModalStage : infraProductsModalStage.stage}
          lenderType={typeof infraProductsModalStage === "string" ? "bank" : infraProductsModalStage.lenderType}
          onClose={() => setIsInfraProductsModalOpen(false)}
        />
      )}

      {isInfraSecuritiesModalOpen && (
        <SecuritiesModal
          securities={infraSecurities}
          setSecurities={setInfraSecurities}
          analysis={infrastructureForecast.securitiesAnalysis}
          onBeforeChange={saveSnapshot}
          onClose={() => setIsInfraSecuritiesModalOpen(false)}
        />
      )}

      {isInfraGuaranteesModalOpen && (
        <InfraGuaranteesModal
          guarantees={infraGuarantees}
          setGuarantees={setInfraGuarantees}
          analysis={infrastructureForecast.guaranteeAnalysis}
          onClose={() => setIsInfraGuaranteesModalOpen(false)}
        />
      )}

      {isInfraFeesModalOpen && (
        <InfraFeesModal
          fees={infraFees}
          setFees={setInfraFees}
          feeBaseAmount={infrastructureForecast.bankShareAmount}
          onClose={() => setIsInfraFeesModalOpen(false)}
        />
      )}

      {isSecuritiesModalOpen && (
        <SecuritiesModal
          securities={securities}
          setSecurities={setSecurities}
          analysis={securitiesAnalysis}
          onBeforeChange={saveSnapshot}
          onClose={() => setIsSecuritiesModalOpen(false)}
        />
      )}
    </div>
    </>
  );
}
