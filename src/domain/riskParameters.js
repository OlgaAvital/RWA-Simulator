// Centralized business/risk parameters used by the simulator engine and UI.
// In production these objects can be replaced by, or hydrated from, the bank's internal parameter tables.

export const ENTITY_STATUS = {
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



export const RATING_RULES = {
  aaaToAa: { label: "AAA עד AA-", riskWeight: 20 },
  a: { label: "A+ עד A-", riskWeight: 50 },
  bbb: { label: "BBB+ עד BBB-", riskWeight: 75 },
  bb: { label: "BB+ עד BB-", riskWeight: 100 },
  bAndBelow: { label: "B+ ומטה", riskWeight: 150 },
  unrated: { label: "לא מדורג", riskWeight: 100 },
};



export const REAL_ESTATE_EXPOSURE_RULES = {
  none: { label: "לא נדל״ן מיוחד", riskWeightOverride: null, note: "אין התאמה ייעודית לסוג נדל״ן." },
  incomeProducing: { label: "נדל״ן מניב", riskWeightOverride: null, note: "בדוגמה נשאר לפי דירוג/סיווג כללי. בפועל ייתכן חישוב לפי LTV ותלות בתזרים הנכס." },
  constructionProject: { label: "פרויקט נדל״ן בהקמה", riskWeightOverride: 150, note: "דוגמה: פרויקט נדל״ן בהקמה עשוי לקבל הקצאת RWA גבוהה יותר עד השלמת תנאים רגולטוריים." },
  infrastructureConstruction: { label: "פרויקט תשתית בתקופת הקמה", riskWeightOverride: 150, note: "דוגמה: בתקופת ההקמה של פרויקט תשתית נכסי הסיכון עשויים להיות גבוהים יותר, עד מעבר לשלב תפעולי/יציב." },
  land: { label: "קרקע / רכישת קרקע", riskWeightOverride: 150, note: "דוגמה: קרקע וחשיפות יזמיות עשויות לקבל משקל סיכון מוגבר." },
};



export const PRODUCT_TYPES = {
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



export const CONSTRUCTION_INSURER_RATING_RULES = {
  aaaToAa: { label: "AAA עד AA-", riskWeight: 20 },
  a: { label: "A+ עד A-", riskWeight: 30 },
  bbb: { label: "BBB+ עד BBB-", riskWeight: 50 },
  bb: { label: "BB+ עד BB-", riskWeight: 100 },
  bAndBelow: { label: "B+ ומטה", riskWeight: 150 },
  unrated: { label: "לא מדורג", riskWeight: 150 },
};



export const CONSTRUCTION_RISK_WEIGHT_TABLE = {
  cashCreditDefault: 100,
  landLoanHighLtvThresholdPct: 75,
  landLoanHighLtv: 150,
  otherGuaranteeUtilized: 50,
  otherGuaranteeUndrawn: 50,
  saleLawGuaranteeUtilized: 30,
  saleLawGuaranteeUndrawn: 30,
  saleLawGuaranteeOccupancy: 10,
  residualProjectFrame: 0,
};



export const CONSTRUCTION_SALES_SCENARIOS = {
  linear: { label: "מכירות לינאריות" },
  backLoaded: { label: "מכירות שמתחילות לאט ומתגברות בסוף" },
  frontLoaded: { label: "מכירות שמתחילות מהר ומאטות בסוף" },
  incompleteAtBuildEnd: { label: "מכירות לא מסתיימות עם סיום הבניה" },
  exitAfterLand: { label: "הלקוח לא ממשיך ליווי בבנק ופורע בסוף תקופת הקרקע" },
};



export const CONSTRUCTION_CREDIT_PRODUCT_TYPES = {
  landLoan: { label: "הלוואת קרקע", stage: "land", isLoan: true, isMezzanine: false, defaultRiskWeight: 100, defaultCcfUndrawn: 0, defaultStandalone: true },
  seniorConstruction: { label: "מסגרת הלוואות בניה", stage: "construction", isLoan: true, isMezzanine: false, defaultRiskWeight: 100, defaultCcfUndrawn: 50, hasHalfYearUtilization: true },
  mezzanineLoan: { label: "הלוואת מזנין", stage: "construction", isLoan: true, isMezzanine: true, defaultRiskWeight: 100, defaultCcfUndrawn: 0, defaultBalloonAtEnd: true, defaultStandalone: true },
  vatLoan: { label: "הלוואת מע״מ", stage: "construction", isLoan: true, isMezzanine: true, defaultRiskWeight: 100, defaultCcfUndrawn: 0, defaultBalloonAtEnd: true, defaultStandalone: true },
  tenderGuarantee: { label: "ערבות מכרז", stage: "construction", isGuarantee: true, isSaleLaw: false, defaultRiskWeight: 20, defaultCcfUndrawn: 50, defaultCcfUtilized: 20 },
  performanceGuarantee: { label: "ערבות ביצוע", stage: "construction", isGuarantee: true, isSaleLaw: false, defaultRiskWeight: 50, defaultCcfUndrawn: 50, defaultCcfUtilized: 50 },
  financialGuarantee: { label: "ערבות כספית", stage: "construction", isGuarantee: true, isSaleLaw: false, defaultRiskWeight: 100, defaultCcfUndrawn: 50, defaultCcfUtilized: 50 },
  saleLawGuarantee: { label: "מסגרת ערבויות חוק מכר", stage: "construction", isGuarantee: true, isSaleLaw: true, defaultRiskWeight: 30, defaultCcfUndrawn: 30, paymentTerms: "30-70" },
};


