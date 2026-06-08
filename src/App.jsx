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

function PrintPreviewModal({ clientName, dealName, viewMode, result, productsAnalysis, additionalIncome, entityStatus, spRating, realEstateExposureType, infrastructureForecast, onClose }) {
  if (viewMode === "infrastructureProject") {
    return <InfrastructurePrintPreviewModal clientName={clientName} dealName={dealName} forecast={infrastructureForecast} onClose={onClose} />;
  }

  const returnOnRwa = result.rwaAfter > 0 ? (result.annualIncome / result.rwaAfter) * 100 : 0;
  const displayMode = viewMode === "existingPlusNew" ? "מצב קיים + עסקה חדשה" : "עסקה בודדת";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" dir="rtl">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <div className="print-hide flex flex-col gap-3 border-b bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">גרסת הדפסה — תצוגת HTML</h2>
            <p className="mt-1 text-sm text-slate-600">
              תצוגה מקדימה בגודל A4 לרוחב. אפשר להשתמש ב־Ctrl+P ולבחור Save as PDF.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              הדפס / שמור PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              סגור
            </button>
          </div>
        </div>

        <div className="overflow-auto p-4">
          <div className="mx-auto w-[1123px] min-h-[794px] rounded-2xl bg-white p-6 shadow-lg print:shadow-none">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <div className="text-sm text-orange-200">סימולטור תשואה ונכסי סיכון</div>
              <h1 className="mt-1 text-3xl font-bold">גרסת הדפסה לסימולציית עסקה</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">לקוח: {clientName || "לא הוזן"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">עסקה: {dealName || "לא הוזנה"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">תצוגה: {displayMode}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-3">
              <PrintKpi title="חבות מלאה ברוטו" value={formatM(productsAnalysis.totalLimit)} />
              <PrintKpi title="חשיפה לאחר CCF / EAD" value={formatM(result.ead)} />
              <PrintKpi title="נכסי סיכון אחרי" value={formatM(result.rwaAfter)} />
              <PrintKpi title="תשואה לנכסי סיכון" value={`${returnOnRwa.toFixed(2)}%`} />
              <PrintKpi title="חיסכון RWA" value={formatM(result.rwaSaving)} positive />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              <PrintCard title="סל מוצרי אשראי">
                <PrintRow label="חבות ברוטו" value={formatM(productsAnalysis.totalLimit)} />
                <PrintRow label="צפי ניצול" value={formatM(productsAnalysis.totalUtilized)} />
                <PrintRow label="לא מנוצל" value={formatM(productsAnalysis.totalUndrawn)} />
                <PrintRow label="EAD" value={formatM(productsAnalysis.totalEad)} />
                <PrintRow label="מרווח משוקלל" value={`${productsAnalysis.weightedMargin.toFixed(2)}%`} />
                <PrintRow label="הכנסות מאשראי" value={formatM(result.productAnnualIncome, 2)} />
              </PrintCard>

              <PrintCard title="הכנסות נוספות">
                <PrintRow label="יתרת פקדונות" value={formatM(additionalIncome.depositBalance)} />
                <PrintRow label="מרווח פקדונות" value={`${additionalIncome.depositMargin.toFixed(2)}%`} />
                <PrintRow label="הכנסת פקדונות" value={formatM(additionalIncome.annualDepositIncome, 2)} />
                <PrintRow label="עמלות" value={formatM(additionalIncome.totalFeeIncome, 2)} />
                <PrintRow label="סה״כ הכנסות נוספות" value={formatM(additionalIncome.totalAdditionalIncome, 2)} />
              </PrintCard>

              <PrintCard title="הקלות ובטוחות">
                <PrintRow label="בטוחות פיננסיות כשירות" value={formatM(result.totalFinancialCollateral)} />
                <PrintRow label="ערבות CRM מוכרת" value={formatM(result.eligibleGuarantee)} />
                <PrintRow label="חיסכון RWA מערבות" value={formatM(result.guaranteeRwaSaving)} />
                <PrintRow label="משקל סיכון אפקטיבי" value={`${result.effectiveRiskWeight.toFixed(0)}%`} />
                <PrintRow label="סטטוס רגולטורי" value={ENTITY_STATUS[entityStatus]?.label || "תאגיד רגיל"} />
                <PrintRow label="דירוג S&P" value={RATING_RULES[spRating]?.label || "לא מדורג"} />
                <PrintRow label="סוג נדל״ן/פרויקט" value={REAL_ESTATE_EXPOSURE_RULES[realEstateExposureType]?.label || "לא נדל״ן מיוחד"} />
              </PrintCard>

              <PrintCard title="תוצאה ניהולית">
                <PrintRow label="RWA לפני" value={formatM(result.rwaBase)} />
                <PrintRow label="RWA אחרי" value={formatM(result.rwaAfter)} />
                <PrintRow label="הכנסה שנתית כוללת" value={formatM(result.annualIncome, 2)} />
                <PrintRow label="תשואה לנכסי סיכון" value={`${returnOnRwa.toFixed(2)}%`} />
                <PrintRow label="הון נדרש שנחסך" value={formatM(result.capitalSaving, 2)} />
              </PrintCard>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2 text-right">מוצר</th>
                    <th className="p-2 text-right">סוג</th>
                    <th className="p-2 text-right">מסגרת</th>
                    <th className="p-2 text-right">ניצול צפוי</th>
                    <th className="p-2 text-right">לא מנוצל</th>
                    <th className="p-2 text-right">EAD</th>
                    <th className="p-2 text-right">מרווח / עמלה</th>
                    <th className="p-2 text-right">הכנסה שנתית</th>
                  </tr>
                </thead>
                <tbody>
                  {productsAnalysis.rows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2">{row.ruleLabel}</td>
                      <td className="p-2">{formatM(row.limit)}</td>
                      <td className="p-2">{formatM(row.utilizedAmount)}</td>
                      <td className="p-2">{formatM(row.undrawnAmount)}</td>
                      <td className="p-2 font-bold text-orange-700">{formatK(row.ead)}</td>
                      <td className="p-2">{row.isInterestBearing ? row.margin.toFixed(2) : row.feeRate.toFixed(2)}%</td>
                      <td className="p-2 font-bold text-emerald-700">{formatK(row.annualIncome)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              מוקאפ לצורכי בדיקות משתמשים. הנתונים והמשקלים להמחשה בלבד, ויש לאמת מול הוראות בנק ישראל, מדיניות הבנק ומנוע RWA מאושר.
            </div>

            <PrintChecklist />
          </div>
        </div>
      </div>
    </div>
  );
}


function InfrastructurePrintPreviewModal({ clientName, dealName, forecast, onClose }) {
  const firstYear = forecast.rows[0] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" dir="rtl">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <div className="print-hide flex flex-col gap-3 border-b bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">פלט PDF — מודול תשואת פרויקט</h2>
            <p className="mt-1 text-sm text-slate-600">שני עמודי A4 לרוחב עם הנחות, אשראי, הכנסות ותשואה. להפקת PDF לחצי הדפס / שמור PDF.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">הדפס / שמור PDF</button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">סגור</button>
          </div>
        </div>

        <div className="overflow-auto p-4">
          <div className="mx-auto w-[1123px] space-y-4">
            <div className="min-h-[794px] rounded-2xl bg-white p-6 shadow-lg print:break-after-page print:shadow-none">
              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <div className="text-sm text-orange-200">מודול תשואת פרויקט</div>
                <h1 className="mt-1 text-3xl font-bold">פלט פרויקט תשתית</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/10 px-3 py-1">לקוח: {clientName || "לא הוזן"}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">פרויקט: {dealName || "לא הוזן"}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">ארגון: {forecast.arrangerName}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                <PrintKpi title="היקף פרויקט" value={formatM(forecast.projectTotalScope)} />
                <PrintKpi title="חלק הבנק" value={formatM(forecast.bankShareAmount)} />
                <PrintKpi title="מימון בנק" value={formatM(forecast.totalFacility)} />
                <PrintKpi title="מימון כל הפרויקט" value={formatM(forecast.totalProjectFacility)} />
                <PrintKpi title="תשואה ממוצעת" value={`${forecast.averageReturnOnRwa.toFixed(2)}%`} positive />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <PrintCard title="הנחות סינדיקציה">
                  <PrintRow label="הפרויקט בארגון הבנק" value={forecast.organizedByBank ? "כן" : "לא"} />
                  <PrintRow label="גוף מארגן" value={forecast.arrangerName} />
                  <PrintRow label="חלק הבנק" value={`${forecast.bankSharePct.toFixed(1)}%`} />
                  <PrintRow label="מטבע" value={INFRA_CURRENCIES[forecast.projectCurrency]?.label || forecast.projectCurrency} />
                </PrintCard>
                <PrintCard title="אשראי ו-RWA">
                  <PrintRow label="חשיפה מקסימלית בנק" value={formatM(forecast.peakExposure)} />
                  <PrintRow label="חשיפה מקסימלית פרויקט" value={formatM(forecast.peakProjectExposure)} />
                  <PrintRow label="RWA ממוצע" value={formatM(forecast.averageRwa)} />
                  <PrintRow label="RWA שיא" value={formatM(forecast.peakRwa)} />
                </PrintCard>
                <PrintCard title="הכנסות">
                  <PrintRow label="הכנסה שנה 1" value={formatM(firstYear.totalIncome || 0, 2)} />
                  <PrintRow label="הכנסה ממוצעת" value={formatM(forecast.averageAnnualIncome, 2)} />
                  <PrintRow label="עמלות פרויקט" value={formatM(forecast.feeAnalysis.totalIncome, 2)} />
                  <PrintRow label="הכנסות מהוונות" value={formatM(forecast.discountedIncome, 2)} />
                </PrintCard>
                <PrintCard title="CRM ובקרות">
                  <PrintRow label="שווי בטוחות כשיר" value={formatM(forecast.securitiesAnalysis.totalEligibleValue)} />
                  <PrintRow label="ערבויות CRM" value={formatM(forecast.guaranteeAnalysis.totalEligibleAmount)} />
                  <PrintRow label="חיסכון RWA" value={formatM(forecast.totalCrmSaving)} />
                  <PrintRow label="חריגה מחלק הבנק" value={forecast.maxBankShareExcess > 0 ? formatM(forecast.maxBankShareExcess) : "אין"} />
                </PrintCard>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <PrintLineChart title="אשראי ו-RWA — חלק הבנק" data={forecast.rows} lines={[{ key: "outstanding", name: "יתרת אשראי", color: "#f97316" }, { key: "rwa", name: "RWA", color: "#22c55e" }, { key: "bankShareLimit", name: "חלק הבנק", color: "#dc2626" }]} />
                <PrintLineChart title="הכנסות ותשואה" data={forecast.rows} lines={[{ key: "totalIncome", name: "הכנסות", color: "#f97316" }, { key: "discountedIncome", name: "מהוון", color: "#64748b" }]} />
              </div>
            </div>

            <div className="min-h-[794px] rounded-2xl bg-white p-6 shadow-lg print:shadow-none">
              <h2 className="text-2xl font-bold text-slate-900">פירוט שנתי וגרף כל הפרויקט</h2>
              <div className="mt-4 h-64 rounded-2xl border border-slate-200 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast.rows} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₪${Number(value / 1000).toFixed(0)}m`} />
                    <Tooltip formatter={(value) => formatK(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="projectOutstanding" stroke="#0ea5e9" strokeWidth={3} dot={false} name="יתרת כל הפרויקט" />
                    <Line type="monotone" dataKey="projectUndrawn" stroke="#f59e0b" strokeWidth={3} dot={false} name="מסגרות לא מנוצלות" />
                    <Line type="monotone" dataKey="outstanding" stroke="#f97316" strokeWidth={3} dot={false} name="יתרת הבנק" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2 text-right">שנה</th><th className="p-2 text-right">שלב</th><th className="p-2 text-right">בנק</th><th className="p-2 text-right">כל הפרויקט</th><th className="p-2 text-right">RWA</th><th className="p-2 text-right">ריבית</th><th className="p-2 text-right">עמלות</th><th className="p-2 text-right">תשואה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.rows.slice(0, 18).map((row) => (
                      <tr key={row.year} className="border-t">
                        <td className="p-2 font-medium">{row.year}</td><td className="p-2">{row.stage}</td><td className="p-2">{formatM(row.outstanding)}</td><td className="p-2">{formatM(row.projectOutstanding)}</td><td className="p-2 font-bold text-emerald-700">{formatM(row.rwa)}</td><td className="p-2">{formatM(row.interestIncome, 2)}</td><td className="p-2">{formatM(row.feeIncome, 2)}</td><td className="p-2">{row.returnOnRwa.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">פלט מוקאפ להמחשה. יש לאמת נתונים, CCF, משקלי סיכון והכרה בבטוחות מול מדיניות הבנק והוראות רגולטוריות.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintLineChart({ title, data, lines }) {
  return (
    <div className="h-64 rounded-2xl border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₪${Number(value / 1000).toFixed(0)}m`} />
          <Tooltip formatter={(value) => formatK(Number(value))} />
          <Legend />
          {lines.map((line) => <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={3} dot={false} name={line.name} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PrintChecklist() {
  const groups = [
    {
      title: "פרטי לקוח ועסקה",
      items: [
        "שם לקוח, סניף, חשבון ו-CIF אומתו מול מערכות הבנק",
        "סוג התצוגה מתאים: עסקה בודדת או מצב קיים + עסקה חדשה",
        "סל המוצרים משקף את מבנה העסקה בפועל",
      ],
    },
    {
      title: "מוצרים, CCF והכנסות",
      items: [
        "לכל מוצר נבחר סוג מוצר נכון וטבלת CCF מאושרת",
        "בהלוואות לזמן ארוך הוזנו תקופה ולוח סילוקין מתאים",
        "בערבויות נבדק שההכנסה נרשמת כעמלה ולא כמרווח אשראי",
        "בסינדיקציה/מכירת סיכון הוזנו סכום מכירה, מועד מכירה ותשלום לקונה",
      ],
    },
    {
      title: "בטוחות ושעבודים",
      items: [
        "הוזרמו/נקלטו פרטי השעבודים הרלוונטיים",
        "קיים שעבוד משפטי תקף ובר אכיפה",
        "שווי שוק עדכני נבדק ותועד",
        "Haircut חושב לפי סוג בטוחה, דירוג, מח״מ ופער מטבע",
        "הוזן רק הסכום הכשיר להפחתת RWA",
      ],
    },
    {
      title: "הקלות רגולטוריות וסיווגים",
      items: [
        "PSE / רשות מקומית אומתו לפי הוראות ומדיניות הבנק",
        "דירוג הלווה והשפעתו על משקל הסיכון נבדקו",
        "סיווג נדל״ן, קרקע או פרויקט בהקמה נבדק",
        "ערבות CRM מוכרת נבדקה בנפרד מערבויות כמוצר אשראי",
      ],
    },
    {
      title: "אישורים ובקרת איכות",
      items: [
        "הכלכלן/בנקאי בדק את נתוני הקלט והנחות החישוב",
        "גורם אשראי/רגולציה אישר חריגות או הנחות ידניות",
        "הסימולציה אינה מהווה אישור אוטומטי להקלה",
        "הנתונים מוכנים להעברה למנוע RWA / מערכת אשראי",
      ],
    },
  ];

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">צ׳קליסט בקרות לפני אישור / הפעלה</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">למילוי ידני לאחר הדפסה</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {groups.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-bold text-slate-800">{group.title}</h3>
            <table className="w-full text-[10px]">
              <thead className="text-slate-500">
                <tr>
                  <th className="w-[58%] border-b border-slate-100 py-1 text-right">בדיקה</th>
                  <th className="w-[22%] border-b border-slate-100 py-1 text-center">סטטוס</th>
                  <th className="w-[20%] border-b border-slate-100 py-1 text-right">הערות</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item}>
                    <td className="border-b border-slate-100 py-1.5 pr-1 align-top">{item}</td>
                    <td className="border-b border-slate-100 py-1.5 text-center align-top">☐ כן&nbsp;&nbsp;☐ לא&nbsp;&nbsp;☐ נ/ר</td>
                    <td className="border-b border-slate-100 py-1.5 align-top text-slate-300">________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        חתימה/אישור: ____________________ &nbsp;&nbsp; תאריך: ____________________ &nbsp;&nbsp; הערות כלליות: ____________________
      </div>
    </div>
  );
}

function PrintKpi({ title, value, positive = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-orange-50 p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${positive ? "text-emerald-700" : "text-orange-800"}`}>{value}</div>
    </div>
  );
}

function PrintCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <h3 className="mb-2 text-base font-bold">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function PrintRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1 text-xs last:border-b-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function AccountLookupModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b bg-slate-50 p-5">
          <h2 className="text-2xl font-bold">טעינת נתוני לקוח / חשבון</h2>
          <p className="mt-1 text-sm text-slate-600">
            מוקאפ בלבד: כאן הבנקאי יזין פרטי סניף וחשבון, ובהמשך המערכת תוכל למשוך נתונים קיימים או לשכפל עסקה דומה.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">סניף</span>
              <input
                placeholder="לדוגמה: 123"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-200 transition focus:ring-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">מספר חשבון</span>
              <input
                placeholder="לדוגמה: 456789"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-200 transition focus:ring-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">מספר לקוח / CIF</span>
              <input
                placeholder="אופציונלי"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-200 transition focus:ring-4"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
              <h3 className="text-lg font-semibold text-orange-900">עסקה לדוגמה</h3>
              <p className="mt-2 text-sm leading-6 text-orange-800">
                מיועד למצב שבו כבר בוצעה בעבר עסקה דומה ללקוח/חשבון. המערכת תעתיק את נתוני העסקה הקיימת כסל מוצרים חדש,
                כדי שהבנקאי יוכל לשנות פרמטרים ולבדוק השפעה על RWA ותשואה.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-2xl bg-orange-200 px-4 py-3 text-sm font-semibold text-orange-700 opacity-60"
              >
                עסקה לדוגמה — לא פעיל במוקאפ
              </button>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
              <h3 className="text-lg font-semibold text-sky-900">פרטי לקוח קיים</h3>
              <p className="mt-2 text-sm leading-6 text-sky-800">
                מיועד למצב שבו הלקוח כבר קיים בבנק. המערכת תטען מצב קיים: EAD, RWA, הכנסות קיימות, מוצרים, פקדונות ובטוחות,
                ואז ניתן יהיה להוסיף עסקה חדשה ולבחון השפעה מצטברת.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-2xl bg-sky-200 px-4 py-3 text-sm font-semibold text-sky-700 opacity-60"
              >
                פרטי לקוח קיים — לא פעיל במוקאפ
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t bg-slate-50 p-4">
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ result, viewMode, productsAnalysis, infrastructureForecast, clientName, dealName }) {
  const isInfrastructureProject = viewMode === "infrastructureProject";
  const returnOnRwa = isInfrastructureProject
    ? infrastructureForecast.averageReturnOnRwa
    : viewMode === "existingPlusNew"
      ? result.totalRwaAfterNewDeal > 0
        ? (result.totalAnnualIncomeAfterNewDeal / result.totalRwaAfterNewDeal) * 100
        : 0
      : result.rwaAfter > 0
        ? (result.annualIncome / result.rwaAfter) * 100
        : 0;

  return (
    <div className="print-header flex flex-col gap-4 rounded-3xl bg-gradient-to-l from-slate-900 to-slate-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-orange-200">
          <Calculator className="h-4 w-4" /> סימולטור תשואה ונכסי סיכון
        </div>
        <h1 className="text-3xl font-bold">{isInfrastructureProject ? "מודל פרויקט תשתית — תחזית רב־שנתית" : "בחינת עסקה / תיק עסקי לפי RWA ותשואה לנכסי סיכון"}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1 text-orange-100">לקוח: {clientName || "לא הוזן"}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-orange-100">עסקה: {dealName || "לא הוזנה"}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          {isInfrastructureProject
            ? "כולל סל מוצרי פרויקט, מטבעות, שחרורי כספים, לוחות סילוקין, ערבויות CRM, תחזית RWA והכנסות לאורך חיי הפרויקט."
            : "כולל סל מוצרי עסקה חדשה, CCF נפרד למנוצל וללא מנוצל, מצב קיים, סיווג PSE / רשות מקומית, בטוחות ני״ע כשירות, ערבויות ותמחור."}
        </p>
      </div>
      <div className="print-kpis grid grid-cols-6 gap-3 text-center md:w-[1240px]">
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "סך מוצרים" : "חבות מלאה ברוטו"}</div>
          <div className="text-3xl font-bold text-orange-200">{formatM(isInfrastructureProject ? infrastructureForecast.totalFacility : productsAnalysis.totalLimit)}</div>
          <div className="mt-1 text-[11px] text-slate-300">{isInfrastructureProject ? "בש״ח לאחר המרה" : "לפני CCF"}</div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "חשיפה מקסימלית" : "חשיפה לאחר CCF / EAD"}</div>
          <div className="text-3xl font-bold text-orange-200">
            {formatM(isInfrastructureProject ? infrastructureForecast.peakExposure : viewMode === "existingPlusNew" ? result.totalEadAfterNewDeal : result.ead)}
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "RWA ממוצע" : viewMode === "existingPlusNew" ? "נכסי סיכון כולל" : "נכסי סיכון אחרי"}</div>
          <div className="text-3xl font-bold text-orange-200">
            {formatM(isInfrastructureProject ? infrastructureForecast.averageRwa : viewMode === "existingPlusNew" ? result.totalRwaAfterNewDeal : result.rwaAfter)}
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "הכנסה שנה ראשונה" : "הכנסות שנתיות"}</div>
          <div className="text-3xl font-bold text-orange-200">
            {formatM(isInfrastructureProject ? infrastructureForecast.rows[0]?.totalIncome || 0 : viewMode === "existingPlusNew" ? result.totalAnnualIncomeAfterNewDeal : result.annualIncome, 2)}
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "תשואה שנתית ממוצעת" : "תשואה לנכסי סיכון"}</div>
          <div className="text-3xl font-bold text-orange-200">{returnOnRwa.toFixed(2)}%</div>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-slate-300">{isInfrastructureProject ? "חיסכון CRM מערבויות" : viewMode === "existingPlusNew" ? "RWA עסקה חדשה" : "חיסכון RWA"}</div>
          <div className="text-3xl font-bold text-emerald-200">
            {formatM(isInfrastructureProject ? infrastructureForecast.totalCrmSaving : viewMode === "existingPlusNew" ? result.incrementalRwa : result.rwaSaving)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsModal({ products, setProducts, analysis, onBeforeChange, onClose }) {
  const updateProduct = (id, field, value) => {
    setProducts((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProduct = () => {
    onBeforeChange?.();
    const productType = "cashCredit";
    const rule = PRODUCT_TYPES[productType];
    setProducts((rows) => [
      {
        id: Date.now(),
        name: "מוצר חדש",
        productType,
        limit: 0,
        expectedUtilizationPct: 0,
        ccfUtilized: rule.defaultCcfUtilized,
        ccfUndrawn: rule.defaultCcfUndrawn,
        margin: 2,
        facilityMode: "standalone",
        termMonths: 60,
        amortizationType: "equalPrincipal",
        riskSaleSaleAmount: 0,
        riskSaleAfterMonths: 6,
        riskSaleBuyerPrice: 0,
      },
      ...rows,
    ]);
  };

  const removeProduct = (id) => {
    onBeforeChange?.();
    setProducts((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="max-h-[90vh] w-[80vw] max-w-[1800px] min-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">בניית עסקה חדשה לפי מוצרים</h2>
            <p className="mt-1 text-sm text-slate-600">
              לכל מוצר מזינים מסגרת או סכום הלוואה, צפי ניצול, CCF ומרווח. בהלוואה stand-alone הניצול הוא 100% ואין חלק לא מנוצל; בהלוואה לזמן ארוך ניתן להזין תקופה ולוח סילוקין. מוצר מכירת סיכון מפחית RWA רק אחרי מועד המכירה הצפוי.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addProduct} className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              הוסף מוצר
            </button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              סגור
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b p-4 md:grid-cols-3 xl:grid-cols-6">
          <Kpi title="חבות מלאה ברוטו" value={formatK(analysis.totalLimit)} muted />
          <Kpi title="צפי ניצול" value={formatK(analysis.totalUtilized)} />
          <Kpi title="EAD כולל" value={formatK(analysis.totalEad)} positive />
          <Kpi title="מרווח משוקלל" value={`${analysis.weightedMargin.toFixed(2)}%`} />
          <Kpi title="סכום מכירה" value={formatK(analysis.totalRiskSaleSaleAmount)} />
          <Kpi title="תשלום לקונה" value={formatK(analysis.totalRiskSaleCost)} />
        </div>

        <div className="max-h-[55vh] overflow-auto p-4">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="sticky top-0 z-10 bg-white text-slate-600 shadow-sm">
              <tr>
                <th className="p-2 text-right">שם מוצר</th>
                <th className="p-2 text-right">סוג מוצר</th>
                <th className="p-2 text-right">סכום / מסגרת ₪k</th>
                <th className="p-2 text-right">אופן העמדה</th>
                <th className="p-2 text-right">צפי ניצול %</th>
                <th className="p-2 text-right">CCF מנוצל</th>
                <th className="p-2 text-right">CCF לא מנוצל</th>
                <th className="p-2 text-right">מרווח / שיעור עמלה / מחיר %</th>
                <th className="p-2 text-right">EAD</th>
                <th className="p-2 text-right">הכנסה נטו</th>
                <th className="p-2 text-right">מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b align-top">
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(event) => updateProduct(row.id, "name", event.target.value)}
                        className="w-36 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.productType}
                        onChange={(event) => {
                          const nextType = event.target.value;
                          const rule = PRODUCT_TYPES[nextType] || PRODUCT_TYPES.cashCredit;
                          setProducts((rows) =>
                            rows.map((product) =>
                              product.id === row.id
                                ? {
                                    ...product,
                                    productType: nextType,
                                    ccfUtilized: rule.defaultCcfUtilized,
                                    ccfUndrawn: rule.defaultCcfUndrawn,
                                    facilityMode: rule.isLoan ? product.facilityMode || "standalone" : "facility",
                                    termMonths: rule.loanTermMode === "long" ? product.termMonths || 60 : product.termMonths,
                                    amortizationType: rule.loanTermMode === "long" ? product.amortizationType || "equalPrincipal" : product.amortizationType,
                                  }
                                : product
                            )
                          );
                        }}
                        className="w-56 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        {Object.entries(PRODUCT_TYPES).map(([value, rule]) => (
                          <option key={value} value={value}>
                            {rule.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      {row.isRiskSale ? (
                        <NumberCell value={row.riskSaleSaleAmount} onChange={(v) => updateProduct(row.id, "riskSaleSaleAmount", clampNumber(v, 0, 1000000))} />
                      ) : (
                        <NumberCell value={row.limit} onChange={(v) => updateProduct(row.id, "limit", clampNumber(v, 0, 1000000))} />
                      )}
                      <div className="mt-1 text-[11px] text-slate-400">{row.isRiskSale ? "סכום מכירה" : row.isStandaloneLoan ? "סכום הלוואה" : "מסגרת"}</div>
                    </td>
                    <td className="p-2">
                      <select
                        value={row.facilityMode || (row.isLoan ? "standalone" : "facility")}
                        disabled={!row.isLoan || row.isRiskSale}
                        onChange={(event) => updateProduct(row.id, "facilityMode", event.target.value)}
                        className={`w-32 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200 ${!row.isLoan || row.isRiskSale ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
                      >
                        <option value="standalone">stand-alone</option>
                        <option value="facility">מתוך מסגרת</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <NumberCell value={row.expectedUtilizationPct} disabled={row.isStandaloneLoan || row.isRiskSale} onChange={(v) => updateProduct(row.id, "expectedUtilizationPct", clampNumber(v, 0, 100))} />
                      {row.isStandaloneLoan && <div className="mt-1 text-[11px] text-slate-400">100%</div>}
                    </td>
                    <td className="p-2">
                      <NumberCell value={row.ccfUtilized} disabled={row.isRiskSale} onChange={(v) => updateProduct(row.id, "ccfUtilized", clampNumber(v, 0, 100))} />
                    </td>
                    <td className="p-2">
                      <NumberCell value={row.ccfUndrawn} disabled={row.isStandaloneLoan || row.isRiskSale} onChange={(v) => updateProduct(row.id, "ccfUndrawn", clampNumber(v, 0, 100))} />
                    </td>
                    <td className="p-2">
                      {row.isRiskSale ? (
                        <NumberCell value={row.riskSaleBuyerPrice} onChange={(v) => updateProduct(row.id, "riskSaleBuyerPrice", clampNumber(v, 0, 10))} />
                      ) : (
                        <NumberCell
                          value={row.isInterestBearing ? row.margin : row.feeRate}
                          disabled={row.isRiskSale}
                          onChange={(v) => updateProduct(row.id, row.isInterestBearing ? "margin" : "feeRate", clampNumber(v, 0, 10))}
                        />
                      )}
                      <div className="mt-1 text-[11px] text-slate-400">{row.isRiskSale ? "מחיר לקונה" : !row.isInterestBearing ? "שיעור עמלה" : "מרווח"}</div>
                    </td>
                    <td className="p-2 font-bold text-orange-700">{formatK(row.ead)}</td>
                    <td className={`p-2 font-bold ${row.annualIncome < 0 ? "text-orange-700" : "text-emerald-700"}`}>{formatK(row.annualIncome)}</td>
                    <td className="p-2">
                      <button type="button" onClick={() => removeProduct(row.id)} className="rounded-xl bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100">
                        מחק
                      </button>
                    </td>
                  </tr>

                  {(row.isLongTermLoan || row.isRiskSale) && (
                    <tr className="border-b bg-slate-50/70">
                      <td colSpan={11} className="p-3">
                        {row.isLongTermLoan && (
                          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
                            <FieldBox title="תקופה בחודשים">
                              <MonthsCell
                                value={row.termMonths ?? ""}
                                min={12}
                                max={360}
                                disabled={!row.isLongTermLoan}
                                onChange={(v) => updateProduct(row.id, "termMonths", v)}
                                onBlur={(v) => updateProduct(row.id, "termMonths", clampNumber(v || 12, 12, 360))}
                              />
                              <div className="mt-1 text-[11px] text-slate-400">מינימום 12 חודשים</div>
                            </FieldBox>
                            <FieldBox title="בסיס ההלוואה">
                              <input
                                value={row.interestBase || ""}
                                onChange={(event) => updateProduct(row.id, "interestBase", event.target.value)}
                                placeholder="צמוד מדד / SOFR 3M / יוריבור 3M"
                                className="w-full rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                              />
                            </FieldBox>

                            <FieldBox title="ריבית ללקוח, %">
                              <NumberCell wide value={row.customerRate ?? 0} onChange={(v) => updateProduct(row.id, "customerRate", clampNumber(v, 0, 30))} />
                              <div className="mt-1 text-[11px] text-slate-500">מחיר צל: {Number(row.customerRate) > 0 ? `${(Math.max(0, Number(row.customerRate) || 0) - Math.max(0, Number(row.margin) || 0)).toFixed(2)}%` : "—"}</div>
                            </FieldBox>

                            <FieldBox title="לוח סילוקין">
                              <select
                                value={row.amortizationType || "equalPrincipal"}
                                onChange={(event) => updateProduct(row.id, "amortizationType", event.target.value)}
                                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                              >
                                <option value="equalPrincipal">קרן שווה</option>
                                <option value="spitzer">שפיצר</option>
                                <option value="grace">גרייס</option>
                              </select>
                            </FieldBox>
                            <ReadOnlyBox title="יתרה ממוצעת ל-RWA" value={formatK(row.rwaUtilizedExposure)} tone="sky" />
                            <ReadOnlyBox title="ניצול צפוי" value={formatK(row.utilizedAmount)} />
                            <ReadOnlyBox title="לא מנוצל" value={formatK(row.undrawnAmount)} />
                            <ReadOnlyBox title="הערה" value={row.facilityMode === "standalone" ? "הלוואה stand-alone" : "מתוך מסגרת"} />
                          </div>
                        )}

                        {row.isRiskSale && (
                          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
                            <ReadOnlyBox title="סכום מכירה" value={formatK(row.riskSaleSaleAmount)} />
                            <FieldBox title="מכירה צפויה אחרי חודשים">
                              <MonthsCell
                                value={row.riskSaleAfterMonths ?? 0}
                                min={0}
                                max={12}
                                onChange={(v) => updateProduct(row.id, "riskSaleAfterMonths", clampNumber(v, 0, 12))}
                              />
                              <div className="mt-1 text-[11px] text-slate-400">0 = מהיום הראשון, 12 = אין השפעה השנה</div>
                            </FieldBox>
                            <ReadOnlyBox title="מחיר / מרווח לקונה" value={`${row.riskSaleBuyerPrice.toFixed(2)}%`} />
                            <ReadOnlyBox title="תקופת השפעה השנה" value={`${row.riskSaleActiveMonths.toFixed(0)} חודשים`} />
                            <ReadOnlyBox title="תשלום לקונה" value={formatK(row.riskSaleCost)} tone="orange" />
                            <ReadOnlyBox title="הפחתת RWA שנתית" value={formatK(row.riskSaleRwaReduction)} tone="green" />
                            <ReadOnlyBox title="השפעה על הכנסה" value={`-${formatK(row.riskSaleCost)}`} tone="orange" />
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          במערכת אמיתית יש לחבר את סוג המוצר לטבלת פרמטרים מאושרת: Product type, commitment type, CCF למנוצל, CCF ללא מנוצל, תקופה, לוח סילוקין כולל גרייס, מוצר מכירת סיכון/סינדיקציה, סכום מכירה, מחיר/מרווח לקונה, תשלום לקונה, תאריך תחולה, גרסת הוראה, ומיפוי למנוע RWA.
          פעילות נגזרים דורשת בדרך כלל חישוב EAD ייעודי ולא רק CCF פשוט — כאן מוצג קירוב לצורך אפיון מסך.
          שימי לב: ערבויות ביצוע, ערבויות חוק מכר וערבויות כספיות בטבלה הזו הן מוצרי אשראי/חשיפה שמייצרים EAD. ערבות שמפחיתה RWA מופיעה בנפרד באזור מנוע ההקלות תחת “ערבות כשירה להפחתת RWA (CRM)”.
        </div>
      </div>
    </div>
  );
}

function InfraProductsModal({ products, setProducts, projectCurrency, stage = "construction", lenderType = "bank", onClose }) {
  const stageConfig = INFRA_PRODUCT_STAGES[stage] || INFRA_PRODUCT_STAGES.construction;
  const isOtherLenderModal = lenderType === "other";
  const lenderTitle = isOtherLenderModal ? "אשראי מממנים אחרים" : "אשראי במימון הבנק";
  const visibleProducts = (products || []).filter((product) => (product.stage || "construction") === stage && (product.lenderType || "bank") === lenderType);
  const updateProduct = (id, field, value) => {
    setProducts((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProduct = () => {
    setProducts((rows) => [
      {
        id: Date.now(),
        name: `מוצר ${stageConfig.shortLabel} חדש`,
        stage,
        productType: "infraLongTermLoan",
        lenderType,
        lenderName: isOtherLenderModal ? "מממן אחר" : "הבנק",
        currency: projectCurrency,
        fxRate: INFRA_CURRENCIES[projectCurrency]?.lastKnownRate || 1,
        amount: 0,
        rate: 2,
        interestBase: "",
        customerRate: 0,
        feeTiming: "fullProjectAnnual",
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
      ...rows,
    ]);
  };

  const removeProduct = (id) => {
    setProducts((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="h-[70vh] w-[82vw] max-w-[1800px] min-w-[980px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{stageConfig.label} — {lenderTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">
              השורה הראשית כוללת את פרטי המוצר והסכומים. בהלוואות נפתחת שורת משנה ללוח סילוקין, ובמידת הצורך שורת פעימות. המוצרים בפופ־אפ זה שייכים לשלב הפרויקט שנבחר.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addProduct} className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">הוסף מוצר</button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">סגור</button>
          </div>
        </div>

        <div className="max-h-[calc(70vh-112px)] overflow-auto p-4">
          {visibleProducts.length === 0 && (
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              עדיין לא הוזנו מוצרים לשלב {stageConfig.shortLabel}. לחצי על ״הוסף מוצר״ כדי להתחיל.
            </div>
          )}
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="sticky top-0 z-10 bg-white text-slate-600 shadow-sm">
              <tr>
                <th className="p-2 text-right">שם מוצר</th>
                <th className="p-2 text-right">מממן</th>
                <th className="p-2 text-right">סוג</th>
                <th className="p-2 text-right">מטבע</th>
                <th className="p-2 text-right">שער ביצוע</th>
                <th className="p-2 text-right">סכום במטבע, k</th>
                <th className="p-2 text-right">מרווח / שיעור עמלה %</th>
                <th className="p-2 text-right">CCF</th>
                <th className="p-2 text-right">תדירות עמלה</th>
                <th className="p-2 text-right">מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const rule = INFRA_PRODUCT_TYPES[product.productType] || INFRA_PRODUCT_TYPES.infraLongTermLoan;
                const currencyCode = product.currency || projectCurrency;
                return (
                  <React.Fragment key={product.id}>
                    <tr className="border-b align-top">
                      <td className="p-2">
                        <input value={product.name} onChange={(event) => updateProduct(product.id, "name", event.target.value)} className="w-36 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200" />
                      </td>
                      <td className="p-2">
                        <input
                          value={product.lenderName || (isOtherLenderModal ? "מממן אחר" : "הבנק")}
                          onChange={(event) => updateProduct(product.id, "lenderName", event.target.value)}
                          disabled={!isOtherLenderModal}
                          className={`w-32 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200 ${!isOtherLenderModal ? "bg-slate-100 text-slate-500" : ""}`}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={product.productType}
                          onChange={(event) => {
                            const nextType = event.target.value;
                            const nextRule = INFRA_PRODUCT_TYPES[nextType] || INFRA_PRODUCT_TYPES.infraLongTermLoan;
                            setProducts((rows) =>
                              rows.map((row) =>
                                row.id === product.id
                                  ? {
                                      ...row,
                                      productType: nextType,
                                      ccf: nextRule.defaultCcf,
                                      ccfUndrawn: nextRule.defaultCcfUndrawn ?? row.ccfUndrawn ?? 0,
                                      facilityMode: nextRule.isLoan ? row.facilityMode || "standalone" : row.facilityMode,
                                      utilizationPct: nextRule.isLoan || nextRule.isGuaranteeFacility ? row.utilizationPct ?? 100 : row.utilizationPct,
                                      amortizationType: nextRule.isLoan ? row.amortizationType || "equalPrincipal" : "grace",
                                      termYears: nextRule.isLoan ? row.termYears || 6 : row.termYears,
                                      graceYears: nextRule.isLoan ? row.graceYears ?? 1 : row.graceYears,
                                      pulseFrequency: nextRule.isPhasedLoan ? row.pulseFrequency || "annual" : row.pulseFrequency,
                                      ...Object.fromEntries(
                                        INFRA_PULSE_FIELDS.map(({ field }) => [
                                          field,
                                          nextRule.isPhasedLoan ? row[field] ?? DEFAULT_INFRA_PULSE_PCT : row[field],
                                        ])
                                      ),
                                      ...Object.fromEntries(
                                        INFRA_GUARANTEE_FRAME_FIELDS.map(({ field }, index) => [
                                          field,
                                          nextRule.isGuaranteeFacility ? row[field] ?? DEFAULT_INFRA_GUARANTEE_FRAME_PCTS[index] ?? 0 : row[field],
                                        ])
                                      ),
                                      feeTiming: nextRule.incomeMode === "feeRate" ? row.feeTiming || "fullProjectAnnual" : row.feeTiming,
                                    }
                                  : row
                              )
                            );
                          }}
                          className="w-40 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          {Object.entries(INFRA_PRODUCT_TYPES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                        </select>
                        <div className="mt-1 text-[11px] text-slate-400">{rule.incomeMode === "feeRate" ? "שיעור עמלה" : "מרווח"}</div>
                      </td>
                      <td className="p-2">
                        <select
                          value={currencyCode}
                          onChange={(event) => {
                            const nextCurrency = event.target.value;
                            setProducts((rows) =>
                              rows.map((row) =>
                                row.id === product.id
                                  ? {
                                      ...row,
                                      currency: nextCurrency,
                                      fxRate: INFRA_CURRENCIES[nextCurrency]?.lastKnownRate || 1,
                                    }
                                  : row
                              )
                            );
                          }}
                          className="w-24 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          {Object.entries(INFRA_CURRENCIES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <NumberCell
                          value={currencyCode === "ILS" ? 1 : product.fxRate ?? INFRA_CURRENCIES[currencyCode]?.lastKnownRate ?? 1}
                          disabled={currencyCode === "ILS"}
                          step="0.0001"
                          onChange={(v) => updateProduct(product.id, "fxRate", clampNumber(v, 0.0001, 99))}
                        />
                        <div className="mt-1 text-[11px] text-slate-400">
                          {currencyCode === "ILS" ? "שקל" : `ברירת מחדל: ${INFRA_CURRENCIES[currencyCode]?.lastKnownRate}`}
                        </div>
                      </td>
                      <td className="p-2">
                        <NumberCell value={product.amount} onChange={(v) => updateProduct(product.id, "amount", clampNumber(v, 0, 5000000))} />
                        {currencyCode !== projectCurrency && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            {formatInputNumber(convertIlsToInfraCurrency((Number(product.amount) || 0) * getInfraFxRate(currencyCode, product.fxRate), projectCurrency))} {INFRA_CURRENCIES[projectCurrency]?.symbol || "₪"}k
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <NumberCell value={product.rate} onChange={(v) => updateProduct(product.id, "rate", clampNumber(v, 0, 20))} />
                        {rule.isLoan && Number(product.customerRate) > 0 && (
                          <div className="mt-1 text-[11px] text-slate-400">מחיר צל: {Number(product.customerRate) > 0 ? `${(Math.max(0, Number(product.customerRate) || 0) - Math.max(0, Number(product.rate) || 0)).toFixed(2)}%` : "—"}</div>
                        )}
                      </td>
                      <td className="p-2">
                        <NumberCell value={product.ccf} onChange={(v) => updateProduct(product.id, "ccf", clampNumber(v, 0, 100))} />
                        {rule.isGuaranteeFacility && (
                          <div className="mt-2 space-y-1">
                            <div className="text-[11px] text-slate-500">ניצול</div>
                            <NumberCell value={product.utilizationPct ?? 100} onChange={(v) => updateProduct(product.id, "utilizationPct", clampNumber(v, 0, 100))} />
                            <div className="text-[11px] text-slate-500">CCF לא מנוצל</div>
                            <NumberCell value={product.ccfUndrawn ?? 20} onChange={(v) => updateProduct(product.id, "ccfUndrawn", clampNumber(v, 0, 100))} />
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <select
                          value={product.feeTiming || "fullProjectAnnual"}
                          disabled={rule.incomeMode !== "feeRate"}
                          onChange={(event) => updateProduct(product.id, "feeTiming", event.target.value)}
                          className={`w-44 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200 ${rule.incomeMode !== "feeRate" ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
                        >
                          {Object.entries(INFRA_FEE_TIMING_OPTIONS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <button type="button" onClick={() => removeProduct(product.id)} className="rounded-xl bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100">מחק</button>
                      </td>
                    </tr>

                    {rule.isLoan && (
                      <tr className="border-b bg-slate-50/80">
                        <td colSpan={10} className="p-3">
                          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
                            <FieldBox title="תקופת הלוואה, חודשים">
                              <MonthsCell
                                value={Math.round((product.termYears ?? 6) * 12)}
                                min={12}
                                max={420}
                                onChange={(v) => updateProduct(product.id, "termYears", clampNumber(v, 12, 420) / 12)}
                                onBlur={(v) => updateProduct(product.id, "termYears", clampNumber(v || 12, 12, 420) / 12)}
                              />
                            </FieldBox>

                            <FieldBox title="בסיס ההלוואה">
                              <input
                                value={product.interestBase || ""}
                                onChange={(event) => updateProduct(product.id, "interestBase", event.target.value)}
                                placeholder="צמוד מדד / SOFR 3M / יוריבור 3M"
                                className="w-full rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                              />
                            </FieldBox>

                            <FieldBox title="ריבית ללקוח, %">
                              <NumberCell wide value={product.customerRate ?? 0} onChange={(v) => updateProduct(product.id, "customerRate", clampNumber(v, 0, 30))} />
                              <div className="mt-1 text-[11px] text-slate-500">מחיר צל: {Number(product.customerRate) > 0 ? `${(Math.max(0, Number(product.customerRate) || 0) - Math.max(0, Number(product.rate) || 0)).toFixed(2)}%` : "—"}</div>
                            </FieldBox>

                            <FieldBox title="לוח סילוקין">
                              <select
                                value={product.amortizationType || "equalPrincipal"}
                                onChange={(event) => updateProduct(product.id, "amortizationType", event.target.value)}
                                className="w-full rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                              >
                                <option value="equalPrincipal">קרן שווה</option>
                                <option value="spitzer">שפיצר</option>
                                <option value="balloon">בלון</option>
                                <option value="grace">גרייס ואז שפיצר</option>
                                <option value="custom">מיוחד</option>
                              </select>
                            </FieldBox>

                            <FieldBox title="אופן העמדה">
                              {rule.isPhasedLoan ? (
                                <ReadOnlyBox title="מסגרת" value="מקסימום עד סיום הפעימות" tone="sky" />
                              ) : (
                                <select
                                  value={product.facilityMode || "standalone"}
                                  onChange={(event) => updateProduct(product.id, "facilityMode", event.target.value)}
                                  className="w-full rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                  <option value="standalone">stand-alone</option>
                                  <option value="facility">מתוך מסגרת</option>
                                </select>
                              )}
                            </FieldBox>

                            {!rule.isPhasedLoan && (product.facilityMode || "standalone") === "facility" && (
                              <FieldBox title="שיעור ניצול, %">
                                <NumberCell wide value={product.utilizationPct ?? 100} onChange={(v) => updateProduct(product.id, "utilizationPct", clampNumber(v, 0, 100))} />
                              </FieldBox>
                            )}

                            {(rule.isPhasedLoan || (product.facilityMode || "standalone") === "facility") && (
                              <FieldBox title="CCF לא מנוצל, %">
                                <NumberCell wide value={product.ccfUndrawn ?? rule.defaultCcfUndrawn ?? 40} onChange={(v) => updateProduct(product.id, "ccfUndrawn", clampNumber(v, 0, 100))} />
                              </FieldBox>
                            )}

                            {product.amortizationType === "grace" && (
                              <FieldBox title="גרייס, חודשים">
                                <MonthsCell
                                  value={Math.round((product.graceYears ?? 1) * 12)}
                                  min={0}
                                  max={420}
                                  onChange={(v) => updateProduct(product.id, "graceYears", clampNumber(v, 0, 420) / 12)}
                                  onBlur={(v) => updateProduct(product.id, "graceYears", clampNumber(v || 0, 0, 420) / 12)}
                                />
                                <div className="mt-1 text-[11px] text-slate-400">לאחר הגרייס הפירעון מחושב כשפיצר ביתרת התקופה</div>
                              </FieldBox>
                            )}

                            {product.amortizationType === "custom" && (
                              <FieldBox title="פירעון שנתי בלוח מיוחד, %">
                                <NumberCell wide value={product.customRepaymentPct} onChange={(v) => updateProduct(product.id, "customRepaymentPct", clampNumber(v, 0, 100))} />
                              </FieldBox>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            בהלוואה stand-alone אין מסגרת לא מנוצלת לאחר העמדה. בהלוואה מתוך מסגרת מחושב EAD גם על החלק הלא מנוצל. בהלוואה בפעימות המסגרת נשארת בגובה ההלוואה המקסימלית עד הפעימה האחרונה, ולאחריה מצטמצמת לגובה האשראי שנוצל.
                          </div>
                        </td>
                      </tr>
                    )}

                    {rule.isPhasedLoan && (
                      <tr className="border-b bg-orange-50/70">
                        <td colSpan={10} className="p-3">
                          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                            <FieldBox title="תדירות פעימות">
                              <select
                                value={product.pulseFrequency || "annual"}
                                onChange={(event) => updateProduct(product.id, "pulseFrequency", event.target.value)}
                                className="w-full rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                              >
                                <option value="quarterly">רבעונית</option>
                                <option value="annual">שנתית</option>
                              </select>
                            </FieldBox>

                            {INFRA_PULSE_FIELDS.map(({ field, label }) => (
                              <FieldBox key={field} title={label}>
                                <NumberCell wide value={product[field] ?? 0} onChange={(v) => updateProduct(product.id, field, clampNumber(v, 0, 100))} />
                              </FieldBox>
                            ))}

                            <ReadOnlyBox
                              title="סה״כ פעימות"
                              value={`${INFRA_PULSE_FIELDS.reduce((sum, { field }) => sum + (Number(product[field]) || 0), 0).toFixed(1)}%`}
                              tone="orange"
                            />

                            <FieldBox title="CCF לא מנוצל">
                              <NumberCell wide value={product.ccfUndrawn ?? 40} onChange={(v) => updateProduct(product.id, "ccfUndrawn", clampNumber(v, 0, 100))} />
                              <div className="mt-1 text-[11px] text-slate-500">מחושב על החלק שטרם הועמד בפעימות</div>
                            </FieldBox>
                          </div>
                          <div className="mt-2 text-xs text-orange-900">
                            הלוואה בפעימות מוצגת בשלוש שורות: שורה ראשית, שורת פרטי הלוואה ושורת פעימות. בתצוגה רבעונית, 4 פעימות ראשונות מרוכזות בשנה הראשונה ו־4 נוספות בשנה השנייה; בתצוגה שנתית, הפעימות נפרסות על שנים 1–8.
                          </div>
                        </td>
                      </tr>
                    )}

                    {rule.isGuaranteeFacility && (
                      <tr className="border-b bg-amber-50/70">
                        <td colSpan={10} className="p-3">
                          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                            {INFRA_GUARANTEE_FRAME_FIELDS.map(({ field, label }, index) => (
                              <FieldBox key={field} title={label}>
                                <NumberCell
                                  wide
                                  value={product[field] ?? DEFAULT_INFRA_GUARANTEE_FRAME_PCTS[index] ?? 0}
                                  onChange={(v) => updateProduct(product.id, field, clampNumber(v, 0, 100))}
                                />
                              </FieldBox>
                            ))}
                            <ReadOnlyBox
                              title="מסגרת התחלתית"
                              value={`${clampNumber(product.guaranteeFrameYear1Pct ?? 100, 0, 100).toFixed(0)}%`}
                              tone="orange"
                            />
                            <ReadOnlyBox
                              title="שיעור ניצול"
                              value={`${clampNumber(product.utilizationPct ?? 100, 0, 100).toFixed(0)}%`}
                              tone="sky"
                            />
                            <ReadOnlyBox
                              title="לא מנוצל לפי CCF"
                              value={`${clampNumber(product.ccfUndrawn ?? 20, 0, 100).toFixed(0)}%`}
                              tone="green"
                            />
                          </div>
                          <div className="mt-2 text-xs text-amber-900">
                            לכל שנה בתקופת ההקמה מזינים את המסגרת כאחוז מהסכום המקסימלי. החלק המנוצל והלא מנוצל מחושבים לפי שיעור הניצול, כך שגם נכסי הסיכון של הלא מנוצל פוחתים עם ירידת המסגרת.
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfraFeesModal({ fees, setFees, feeBaseAmount, onClose }) {
  const updateFee = (id, field, value) => {
    setFees((rows) =>
      (rows || []).map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, [field]: value };
        if (field === "pct") {
          next.amountMode = "pct";
          next.amount = feeBaseAmount * (clampNumber(value, 0, 100) / 100);
        }
        if (field === "amount") {
          next.amountMode = "amount";
          next.pct = feeBaseAmount > 0 ? (clampNumber(value, 0, 10000000) / feeBaseAmount) * 100 : 0;
        }
        return next;
      })
    );
  };

  const addFee = () => {
    setFees((rows) => [
      { id: Date.now(), feeType: "constructionAnnual", amountMode: "pct", pct: 0, amount: 0, spreadYears: 1 },
      ...(rows || []),
    ]);
  };

  const removeFee = (id) => setFees((rows) => (rows || []).filter((row) => row.id !== id));
  const analysis = calculateInfrastructureFees(fees, feeBaseAmount, 99, 0, 99);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">עמלות פרויקט ועסקה</h2>
            <p className="mt-1 text-sm text-slate-600">
              עמלת ארגון נגבית בתחילת העסקה, עמלות UP FRONT נפרסות לשנים, ועמלות פרויקט נגבות בכל שנה בתקופת ההקמה או ההפעלה.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addFee} className="rounded-2xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800">הוסף עמלה</button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">סגור</button>
          </div>
        </div>

        <div className="grid gap-3 border-b p-4 md:grid-cols-3">
          <Kpi title="עמלות שנה 1" value={formatK(analysis.firstYearIncome)} positive />
          <Kpi title="סה״כ עמלות במודל" value={formatK(analysis.totalIncome)} positive />
          <Kpi title="מספר עמלות" value={`${analysis.rows.length}`} muted />
        </div>

        <div className="max-h-[58vh] overflow-auto p-4">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="sticky top-0 z-10 bg-white text-slate-600 shadow-sm">
              <tr>
                <th className="p-2 text-right">סוג עמלה</th>
                <th className="p-2 text-right">אחוז מחלק הבנק</th>
                <th className="p-2 text-right">סכום ₪k</th>
                <th className="p-2 text-right">פריסה בשנים</th>
                <th className="p-2 text-right">מועד גבייה</th>
                <th className="p-2 text-right">מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {(fees || []).map((fee) => {
                const config = INFRA_FEE_TYPES[fee.feeType] || INFRA_FEE_TYPES.arrangement;
                const amountMode = fee.amountMode || (Number(fee.amount) > 0 ? "amount" : "pct");
                const resolvedAmount = amountMode === "pct" ? feeBaseAmount * ((Number(fee.pct) || 0) / 100) : Math.max(0, Number(fee.amount) || 0);
                const resolvedPct = feeBaseAmount > 0 ? (resolvedAmount / feeBaseAmount) * 100 : Number(fee.pct) || 0;
                return (
                  <tr key={fee.id} className="border-b align-top">
                    <td className="p-2">
                      <select value={fee.feeType} onChange={(event) => updateFee(fee.id, "feeType", event.target.value)} className="w-56 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200">
                        {Object.entries(INFRA_FEE_TYPES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <NumberCell value={resolvedPct} disabled={!config.allowPct} onChange={(v) => setFees((rows) => (rows || []).map((row) => row.id === fee.id ? { ...row, amountMode: "pct", pct: clampNumber(v, 0, 100), amount: 0 } : row))} />
                      {!config.allowPct && <div className="mt-1 text-[11px] text-slate-400">מחושב מהסכום</div>}
                    </td>
                    <td className="p-2">
                      <NumberCell value={resolvedAmount} onChange={(v) => setFees((rows) => (rows || []).map((row) => row.id === fee.id ? { ...row, amountMode: "amount", amount: clampNumber(v, 0, 10000000) } : row))} />
                      <div className="mt-1 text-[11px] text-slate-400">הזיני אחוז מחלק הבנק או סכום, השני יושלם</div>
                    </td>
                    <td className="p-2">
                      <NumberCell value={fee.spreadYears ?? 1} disabled={config.timing !== "spread"} onChange={(v) => updateFee(fee.id, "spreadYears", clampNumber(v, 1, 35))} />
                    </td>
                    <td className="p-2 text-xs leading-5 text-slate-600">
                      {config.timing === "year1" && "נגבית בתחילת העסקה"}
                      {config.timing === "spread" && "נפרסת על פני מספר שנים"}
                      {config.timing === "construction" && "נגבית כל שנה בתקופת ההקמה"}
                      {config.timing === "operation" && "נגבית כל שנה בתקופת ההפעלה"}
                    </td>
                    <td className="p-2">
                      <button type="button" onClick={() => removeFee(fee.id)} className="rounded-xl bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100">מחק</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfraGuaranteesModal({ guarantees, setGuarantees, analysis, onClose }) {
  const updateGuarantee = (id, field, value) => {
    setGuarantees((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addGuarantee = () => {
    setGuarantees((rows) => [
      {
        id: Date.now(),
        name: "ערבות חדשה",
        amount: 0,
        guarantorRating: "aaaToAa",
        legalValid: true,
        unconditional: true,
        maturityMatch: true,
      },
      ...rows,
    ]);
  };

  const removeGuarantee = (id) => setGuarantees((rows) => rows.filter((row) => row.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">הזנת ערבויות CRM לפרויקט</h2>
            <p className="mt-1 text-sm text-slate-600">הזנת סכום ערבות, דירוג ערב ותנאי כשירות בסיסיים לצורך חישוב CRM.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addGuarantee} className="rounded-2xl bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800">הוסף ערבות</button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">סגור</button>
          </div>
        </div>

        <div className="grid gap-3 border-b p-4 md:grid-cols-4">
          <Kpi title="סכום ערבויות" value={formatK(analysis.totalAmount)} muted />
          <Kpi title="CRM כשיר" value={formatK(analysis.totalEligibleAmount)} positive />
          <Kpi title="משקל סיכון ערב" value={`${analysis.weightedGuarantorRiskWeight.toFixed(0)}%`} />
          <Kpi title="לא כשירות" value={`${analysis.ineligibleCount}`} />
        </div>

        <div className="max-h-[58vh] overflow-auto p-4">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-white text-slate-600 shadow-sm">
              <tr>
                <th className="p-2 text-right">שם ערבות</th>
                <th className="p-2 text-right">סכום ₪k</th>
                <th className="p-2 text-right">דירוג ערב</th>
                <th className="p-2 text-right">משפטי</th>
                <th className="p-2 text-right">בלתי מותנית</th>
                <th className="p-2 text-right">התאמת תקופה</th>
                <th className="p-2 text-right">סכום כשיר</th>
                <th className="p-2 text-right">סטטוס</th>
                <th className="p-2 text-right">מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {(analysis.rows || []).map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="p-2"><input value={row.name} onChange={(event) => updateGuarantee(row.id, "name", event.target.value)} className="w-44 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200" /></td>
                  <td className="p-2"><NumberCell value={row.amount} onChange={(v) => updateGuarantee(row.id, "amount", clampNumber(v, 0, 5000000))} /></td>
                  <td className="p-2">
                    <select value={row.guarantorRating} onChange={(event) => updateGuarantee(row.id, "guarantorRating", event.target.value)} className="w-40 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200">
                      {Object.entries(INFRA_GUARANTOR_RATING_RULES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                    </select>
                    <div className="mt-1 text-[11px] text-slate-400">RW ערב: {row.guarantorRiskWeight}%</div>
                  </td>
                  <td className="p-2"><Checkbox checked={row.legalValid} onChange={(v) => updateGuarantee(row.id, "legalValid", v)} /></td>
                  <td className="p-2"><Checkbox checked={row.unconditional} onChange={(v) => updateGuarantee(row.id, "unconditional", v)} /></td>
                  <td className="p-2"><Checkbox checked={row.maturityMatch} onChange={(v) => updateGuarantee(row.id, "maturityMatch", v)} /></td>
                  <td className="p-2 font-bold text-emerald-700">{formatK(row.eligibleAmount)}</td>
                  <td className="p-2">
                    {row.eligible ? <Badge tone="green">כשירה</Badge> : <div className="space-y-1"><Badge tone="orange">לא כשירה</Badge><div className="max-w-44 text-xs text-amber-800">{row.issues.join("; ")}</div></div>}
                  </td>
                  <td className="p-2"><button type="button" onClick={() => removeGuarantee(row.id)} className="rounded-xl bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100">מחק</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SecuritiesModal({ securities, setSecurities, analysis, onBeforeChange, onClose }) {
  const updateSecurity = (id, field, value) => {
    setSecurities((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addSecurity = () => {
    onBeforeChange?.();
    setSecurities((rows) => [
      {
        id: Date.now(),
        name: "ני״ע/פקדון חדש",
        securityType: "cashDeposit",
        marketValue: 0,
        legalPledge: true,
        marketable: true,
        concentrationLimitOk: true,
        currencyMatch: true,
        securityRating: "aaaToAa",
      },
      ...rows,
    ]);
  };

  const removeSecurity = (id) => {
    onBeforeChange?.();
    setSecurities((rows) => rows.filter((row) => row.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">בדיקת ני״ע לבטוחה כשירה</h2>
            <p className="mt-1 text-sm text-slate-600">
              הזנת ני״ע או פקדון משועבד, בדיקת תנאי כשירות בסיסיים וחישוב שווי מוכר לאחר haircut. הערכים בדוגמה נועדו לאפיון בלבד.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addSecurity} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              הוסף ני״ע
            </button>
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              סגור
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b p-4 md:grid-cols-4">
          <Kpi title="שווי שוק כולל" value={formatK(analysis.totalMarketValue)} muted />
          <Kpi title="שווי כשיר לאחר haircut" value={formatK(analysis.totalEligibleValue)} positive />
          <Kpi title="מספר ני״ע" value={`${analysis.rows.length}`} />
          <Kpi title="לא כשירים" value={`${analysis.ineligibleCount}`} />
        </div>

        <div className="max-h-[55vh] overflow-auto p-4">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="sticky top-0 bg-white text-slate-600 shadow-sm">
              <tr>
                <th className="p-2 text-right">שם ני״ע/פקדון</th>
                <th className="p-2 text-right">סוג</th>
                <th className="p-2 text-right">שווי שוק ₪k</th>
                <th className="p-2 text-right">דירוג ני״ע</th>
                <th className="p-2 text-right">שעבוד</th>
                <th className="p-2 text-right">סחירות</th>
                <th className="p-2 text-right">ריכוזיות</th>
                <th className="p-2 text-right">מטבע</th>
                <th className="p-2 text-right">Haircut</th>
                <th className="p-2 text-right">שווי כשיר</th>
                <th className="p-2 text-right">סטטוס</th>
                <th className="p-2 text-right">מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="p-2">
                    <input
                      value={row.name}
                      onChange={(event) => updateSecurity(row.id, "name", event.target.value)}
                      className="w-36 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={row.securityType}
                      onChange={(event) => updateSecurity(row.id, "securityType", event.target.value)}
                      className="w-52 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      {Object.entries(SECURITY_RULES).map(([value, rule]) => (
                        <option key={value} value={value}>
                          {rule.label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs text-slate-500">{row.ruleNote}</div>
                  </td>
                  <td className="p-2">
                    <NumberCell value={row.marketValue} onChange={(v) => updateSecurity(row.id, "marketValue", clampNumber(v, 0, 1000000))} />
                  </td>
                  <td className="p-2">
                    {requiresSecurityRating(row.securityType) ? (
                      <select
                        value={row.securityRating || "unrated"}
                        onChange={(event) => updateSecurity(row.id, "securityRating", event.target.value)}
                        className="w-36 rounded-xl border px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        {Object.entries(RATING_RULES).map(([value, config]) => (
                          <option key={value} value={value}>{config.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">לא נדרש</span>
                    )}
                  </td>
                  <td className="p-2"><Checkbox checked={row.legalPledge} onChange={(v) => updateSecurity(row.id, "legalPledge", v)} /></td>
                  <td className="p-2"><Checkbox checked={row.marketable} onChange={(v) => updateSecurity(row.id, "marketable", v)} /></td>
                  <td className="p-2"><Checkbox checked={row.concentrationLimitOk} onChange={(v) => updateSecurity(row.id, "concentrationLimitOk", v)} /></td>
                  <td className="p-2"><Checkbox checked={row.currencyMatch} onChange={(v) => updateSecurity(row.id, "currencyMatch", v)} /></td>
                  <td className="p-2 font-medium">
                    {row.haircut.toFixed(0)}%
                    {requiresSecurityRating(row.securityType) && <div className="text-[11px] text-slate-400">לפי דירוג</div>}
                  </td>
                  <td className="p-2 font-bold text-emerald-700">{formatK(row.eligibleValue)}</td>
                  <td className="p-2">
                    {row.eligible ? (
                      <Badge tone="green">כשיר</Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge tone="orange">לא כשיר</Badge>
                        <div className="max-w-44 text-xs text-amber-800">{row.issues.join("; ")}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <button type="button" onClick={() => removeSecurity(row.id)} className="rounded-xl bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100">
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          במערכת אמיתית כדאי להחליף את חוקי הדוגמה בטבלת פרמטרים: ISIN/מספר פקדון, סוג ני״ע/פקדון, דירוג, מח״מ, מטבע, סחירות, issuer,
          haircut רגולטורי/פנימי לפי דירוג ני״ע או פער מטבע, מגבלת ריכוזיות, תוקף שווי שוק, ותיעוד שעבוד משפטי.
        </div>
      </div>
    </div>
  );
}

function InfrastructureProjectPanel({
  forecast,
  projectYears,
  setProjectYears,
  constructionYears,
  setConstructionYears,
  rampUpYears,
  setRampUpYears,
  projectCurrency,
  setProjectCurrency,
  projectTotalScope,
  setProjectTotalScope,
  bankSharePct,
  setBankSharePct,
  organizedByBank,
  setOrganizedByBank,
  arrangerName,
  setArrangerName,
  discountRate,
  setDiscountRate,
  depositBalance,
  setDepositBalance,
  depositMargin,
  setDepositMargin,
  additionalFees,
  setAdditionalFees,
  otherIncome,
  setOtherIncome,
  projectManagementFeePct,
  setProjectManagementFeePct,
  oneTimeFee,
  setOneTimeFee,
  annualFixedFeeEnabled,
  setAnnualFixedFeeEnabled,
  annualFixedFee,
  setAnnualFixedFee,
  fees,
  setFees,
  products,
  setProducts,
  guarantees,
  securities,
  onOpenProducts,
  onOpenGuarantees,
  onOpenSecurities,
  onOpenFees,
  constructionRiskWeight,
  setConstructionRiskWeight,
  operatingRiskWeight,
  setOperatingRiskWeight,
  repaymentStartYear,
  setRepaymentStartYear,
}) {
  const firstYear = forecast.rows[0] || {};
  const [projectChartTab, setProjectChartTab] = useState("creditRisk");
  const handleProjectCurrencyChange = (nextCurrency) => {
    setProjectCurrency(nextCurrency);
    setProducts?.((rows) =>
      (rows || []).map((product) => ({
        ...product,
        currency: nextCurrency,
        fxRate: INFRA_CURRENCIES[nextCurrency]?.lastKnownRate || 1,
      }))
    );
  };

  return (
    <div className="space-y-5">
      <Panel>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">מודל פרויקטי תשתית — תחזית רב־שנתית</h2>
            <p className="text-sm text-slate-500">
              לשונית ייעודית לפרויקטים ארוכי טווח: הנחות פרויקט, מוצרי אשראי לפי שלבים, הכנסות נוספות, בטוחות/ערבויות ותוצאות ניהוליות.
            </p>
          </div>
          <Badge tone="purple">מודל ראשוני להתאמה עם צוות תשתיות</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-4 font-semibold text-slate-800">הנחות הפרויקט</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <MonthsMetricInput label="משך חיי הפרויקט, חודשים" valueYears={projectYears} setValueYears={setProjectYears} minMonths={12} maxMonths={420} help="משך ההקמה + משך הזיכיון/ההפעלה של הפרויקט." />
              <MonthsMetricInput label="תקופת הקמה, חודשים" valueYears={constructionYears} setValueYears={setConstructionYears} minMonths={0} maxMonths={180} />
              <MonthsMetricInput label="תקופת הרצה, חודשים" valueYears={rampUpYears} setValueYears={setRampUpYears} minMonths={0} maxMonths={120} />
              <MonthsMetricInput label="תחילת פירעון, חודשים" valueYears={repaymentStartYear} setValueYears={setRepaymentStartYear} minMonths={1} maxMonths={420} />
              <MetricInput label={`היקף פרויקט כולל, ${INFRA_CURRENCIES[projectCurrency]?.symbol || "₪"}k`} value={projectTotalScope} setValue={setProjectTotalScope} min={0} max={10000000} step={1000} />
              <MetricInput label="חלק הבנק בסינדיקציה, %" value={bankSharePct} setValue={setBankSharePct} min={0} max={100} step={1} />
              <div className="space-y-2 rounded-2xl bg-white p-3">
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-600">
                  <span>הפרויקט בארגון הבנק</span>
                  <Checkbox checked={organizedByBank} onChange={setOrganizedByBank} />
                </label>
                {!organizedByBank && (
                  <input
                    value={arrangerName}
                    onChange={(event) => setArrangerName(event.target.value)}
                    placeholder="שם הגוף המארגן"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                )}
                <div className="text-[11px] text-slate-500">מוצג בפלט ובניתוח סינדיקציה.</div>
              </div>
              <MetricInput label="ריבית היוון, %" value={discountRate} setValue={setDiscountRate} min={0} max={20} step={0.1} help="כרגע ברירת המחדל היא 0%, ולכן אין השפעת היוון. בעתיד ניתן להשתמש בשדה לחישוב NPV של הכנסות הפרויקט." />
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600">מטבע ברירת מחדל לפרויקט</span>
                <select
                  value={projectCurrency}
                  onChange={(event) => handleProjectCurrencyChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-200 transition focus:ring-4"
                >
                  {Object.entries(INFRA_CURRENCIES).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </label>
              <MetricInput label="משקל סיכון בהקמה, %" value={constructionRiskWeight} setValue={setConstructionRiskWeight} min={20} max={250} step={5} />
              <MetricInput label="משקל סיכון בתפעול, %" value={operatingRiskWeight} setValue={setOperatingRiskWeight} min={20} max={250} step={5} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-orange-900">מוצרי אשראי בפרויקט</h3>
                <p className="text-xs text-orange-800">הזנה נפרדת לפי שלב הפרויקט: הקמה, הרצה והפעלה.</p>
              </div>
              <div className="space-y-3">
                {Object.entries(INFRA_PRODUCT_STAGES).map(([stageKey, stageConfig]) => {
                  const stageProducts = products.filter((product) => (product.stage || "construction") === stageKey);
                  const bankProducts = stageProducts.filter((product) => (product.lenderType || "bank") === "bank");
                  const otherProducts = stageProducts.filter((product) => (product.lenderType || "bank") === "other");
                  const summarize = (rows) => rows.reduce((sum, product) => {
                    const currencyCode = product.currency || projectCurrency;
                    const fx = getInfraFxRate(currencyCode, product.fxRate);
                    return sum + Math.max(0, Number(product.amount) || 0) * fx;
                  }, 0);
                  return (
                    <div key={stageKey} className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800">{stageConfig.label}</div>
                          <div className="text-xs text-slate-500">הזנה נפרדת לחלק הבנק ולמממנים אחרים</div>
                        </div>
                        <div className="text-left text-xs text-slate-500">{stageProducts.length} מוצרים</div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <button type="button" onClick={() => onOpenProducts(stageKey, "bank")} className="rounded-xl bg-orange-50 p-2 text-right transition hover:bg-orange-100">
                          <div className="font-semibold text-orange-800">אשראי במימון הבנק</div>
                          <div className="text-xs text-slate-500">{bankProducts.length} מוצרים · {formatK(summarize(bankProducts))}</div>
                        </button>
                        <button type="button" onClick={() => onOpenProducts(stageKey, "other")} className="rounded-xl bg-sky-50 p-2 text-right transition hover:bg-sky-100">
                          <div className="font-semibold text-sky-800">אשראי מממנים אחרים</div>
                          <div className="text-xs text-slate-500">{otherProducts.length} מוצרים · {formatK(summarize(otherProducts))}</div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <SummaryBox title="סה״כ מוצרים" value={`${products.length}`} />
                <SummaryBox title="מימון הבנק" value={formatK(forecast.totalFacility)} />
                <SummaryBox title="כל הפרויקט" value={formatK(forecast.totalProjectFacility)} />
                <SummaryBox title="הכנסות מוצרים" value={formatK(forecast.totalIncome - forecast.totalAdditionalIncome - forecast.feeAnalysis.totalIncome)} positive />
              </div>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-violet-900">בטוחות / ערבויות בפרויקט</h3>
                  <p className="text-xs text-violet-800">פקדונות/ני״ע לאחר haircut + ערבויות CRM לפי דירוג ערב</p>
                </div>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <button type="button" onClick={onOpenSecurities} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                  הזנת פקדונות / ני״ע
                </button>
                <button type="button" onClick={onOpenGuarantees} className="rounded-2xl bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800">
                  הזנת ערבויות
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <SummaryBox title="שווי בטוחות" value={formatK(forecast.securitiesAnalysis.totalMarketValue)} />
                <SummaryBox title="שווי כשיר" value={formatK(forecast.securitiesAnalysis.totalEligibleValue)} positive />
                <SummaryBox title="CRM ערבויות" value={formatK(forecast.guaranteeAnalysis.totalEligibleAmount)} positive />
                <SummaryBox title="חיסכון RWA" value={formatK(forecast.totalCrmSaving)} positive />
              </div>
              <div className="mt-2 text-xs text-violet-900">
                כולל חיסכון מבטוחות {formatK(forecast.totalCollateralRwaSaving)} וחיסכון מערבויות {formatK(forecast.totalGuaranteeRwaSaving)}. משקל סיכון ערב משוקלל: {forecast.guaranteeAnalysis.weightedGuarantorRiskWeight.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="mb-3 font-semibold text-sky-900">הכנסות נוספות</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <MetricInput label={`יתרת פקדון, ${INFRA_CURRENCIES[projectCurrency]?.symbol || "₪"}k`} value={depositBalance} setValue={setDepositBalance} min={0} max={5000000} step={1000} />
              <MetricInput label="מרווח פקדון, %" value={depositMargin} setValue={setDepositMargin} min={0} max={10} step={0.05} />
              <div className="rounded-2xl bg-white p-3 md:col-span-2 xl:col-span-1 2xl:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">עמלות פרויקט ועסקה</div>
                    <div className="text-xs text-slate-500">ארגון, UP FRONT ועמלות שנתיות לפי תקופות</div>
                  </div>
                  <button type="button" onClick={onOpenFees} className="rounded-2xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800">
                    הזנת עמלות
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <SummaryBox title="עמלות שנה 1" value={formatK(forecast.feeAnalysis.firstYearIncome)} positive />
                  <SummaryBox title="סה״כ עמלות" value={formatK(forecast.feeAnalysis.totalIncome)} positive />
                  <SummaryBox title="מספר עמלות" value={`${forecast.feeAnalysis.rows.length}`} />
                </div>
              </div>
              <MetricInput label={`הכנסות אחרות שנתיות, ${INFRA_CURRENCIES[projectCurrency]?.symbol || "₪"}k`} value={otherIncome} setValue={setOtherIncome} min={0} max={100000} step={100} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <SummaryBox title="פקדון" value={formatK(forecast.annualDepositIncome)} positive />
              <SummaryBox title="עמלות פרויקט" value={formatK(forecast.feeAnalysis.firstYearIncome)} positive />
              <SummaryBox title="עמלות מוצרים" value={formatK(forecast.totalProductFeeIncome)} positive />
              <SummaryBox title="עמלת עסקה" value={formatK(forecast.oneTimeFee)} positive />
              <SummaryBox title="סה״כ עמלות" value={formatK(forecast.feeAnalysis.totalIncome)} positive />
              <SummaryBox title="סה״כ שנה 1" value={formatK(forecast.firstYearAdditionalIncome)} positive />
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-800">תוצאות ניהוליות</h3>
            <div className="space-y-3">
              <Kpi title="היקף פרויקט כולל" value={formatK(forecast.projectTotalScope)} />
              <Kpi title="חלק הבנק בפרויקט" value={formatK(forecast.bankShareAmount)} positive />
              <Kpi
                title="חריגה מחלק הבנק"
                value={forecast.maxBankShareExcess > 0 ? formatK(forecast.maxBankShareExcess) : "אין חריגה"}
                positive={forecast.maxBankShareExcess <= 0}
              />
              <Kpi title="סך הכנסות חיי פרויקט" value={formatK(forecast.totalIncome)} positive />
              <Kpi title="הכנסה שנה ראשונה" value={formatK(firstYear.totalIncome || 0)} positive />
              <Kpi title="הכנסה שנתית ממוצעת" value={formatK(forecast.averageAnnualIncome)} positive />
              <Kpi title="הכנסות מהוונות" value={formatK(forecast.discountedIncome)} />
              <Kpi title="תשואה שנה ראשונה" value={`${(firstYear.returnOnRwa || 0).toFixed(2)}%`} positive />
              <Kpi title="תשואה שנתית ממוצעת" value={`${forecast.averageReturnOnRwa.toFixed(2)}%`} positive />
              <Kpi title="חיסכון RWA מבטוחות" value={formatK(forecast.totalCollateralRwaSaving)} positive />
              <Kpi title="חיסכון RWA מערבויות" value={formatK(forecast.totalGuaranteeRwaSaving)} positive />
              <Kpi title="RWA ממוצע" value={formatK(forecast.averageRwa)} />
            </div>
            {forecast.bankShareLimitBreaches.length > 0 && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                <b>בקרת חריגה:</b> קיימות {forecast.bankShareLimitBreaches.length} שנים שבהן החבות בפרויקט גבוהה מחלק הבנק בפרויקט. החריגה המקסימלית היא {formatK(forecast.maxBankShareExcess)}. יש להקטין סכומי מוצרים או לעדכן את חלק הבנק בסינדיקציה.
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">גרפים לאורך חיי הפרויקט</h3>
            <p className="text-sm text-slate-500">מעבר בין גרף אשראי/RWA לבין גרף הכנסות ותשואה לאורך השנים.</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
            <TabButton active={projectChartTab === "creditRisk"} onClick={() => setProjectChartTab("creditRisk")}>אשראי ו־RWA</TabButton>
            <TabButton active={projectChartTab === "projectCredit"} onClick={() => setProjectChartTab("projectCredit")}>אשראי ומסגרות — כל הפרויקט</TabButton>
            <TabButton active={projectChartTab === "incomeReturn"} onClick={() => setProjectChartTab("incomeReturn")}>הכנסות ותשואה</TabButton>
          </div>
        </div>

        {projectChartTab === "creditRisk" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 font-semibold">אשראי, חבות ונכסי סיכון לאורך חיי הפרויקט</div>
            <div className="h-96 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.rows} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₪${Number(value / 1000).toFixed(0)}m`} />
                  <Tooltip formatter={(value) => formatK(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="outstanding" stroke="#f97316" strokeWidth={3} dot={false} name="יתרת אשראי" />
                  <Line type="monotone" dataKey="averageOutstanding" stroke="#64748b" strokeWidth={3} dot={false} name="חבות / חשיפה ממוצעת" />
                  <Line type="monotone" dataKey="rwa" stroke="#22c55e" strokeWidth={3} dot={false} name="נכסי סיכון" />
                  <Line type="monotone" dataKey="bankShareLimit" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} name="חלק הבנק בפרויקט" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {projectChartTab === "projectCredit" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 font-semibold">אשראי ומסגרות בכל הפרויקט — כולל מממנים אחרים</div>
            <div className="h-96 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.rows} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₪${Number(value / 1000).toFixed(0)}m`} />
                  <Tooltip formatter={(value) => formatK(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="projectOutstanding" stroke="#0ea5e9" strokeWidth={3} dot={false} name="יתרת אשראי כל הפרויקט" />
                  <Line type="monotone" dataKey="projectAverageOutstanding" stroke="#64748b" strokeWidth={3} dot={false} name="חשיפה ממוצעת כל הפרויקט" />
                  <Line type="monotone" dataKey="projectUndrawn" stroke="#f59e0b" strokeWidth={3} dot={false} name="מסגרות לא מנוצלות" />
                  <Line type="monotone" dataKey="bankShareLimit" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} name="חלק הבנק" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {projectChartTab === "incomeReturn" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 font-semibold">הכנסות, הכנסות מהוונות ותשואה שנתית</div>
            <div className="h-96 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.rows} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="income" tick={{ fontSize: 12 }} tickFormatter={(value) => `₪${Number(value / 1000).toFixed(0)}m`} />
                  <YAxis yAxisId="return" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Tooltip formatter={(value, name) => (name === "תשואה שנתית" ? `${Number(value).toFixed(2)}%` : formatK(Number(value)))} />
                  <Legend />
                  <Line yAxisId="income" type="monotone" dataKey="totalIncome" stroke="#f97316" strokeWidth={3} dot={false} name="הכנסות צפויות" />
                  <Line yAxisId="income" type="monotone" dataKey="discountedIncome" stroke="#64748b" strokeWidth={3} dot={false} name="הכנסות מהוונות" />
                  <Line yAxisId="return" type="monotone" dataKey="returnOnRwa" stroke="#22c55e" strokeWidth={3} dot={false} name="תשואה שנתית" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <div className="mb-3 text-lg font-semibold">טבלה לפי שנים</div>
        <div className="overflow-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3 text-right">שנה</th>
                <th className="p-3 text-right">שלב</th>
                <th className="p-3 text-right">שחרור כספים</th>
                <th className="p-3 text-right">יתרת אשראי</th>
                <th className="p-3 text-right">חבות/חשיפה ממוצעת</th>
                <th className="p-3 text-right">לא מנוצל</th>
                <th className="p-3 text-right">חלק הבנק</th>
                <th className="p-3 text-right">חריגה</th>
                <th className="p-3 text-right">RWA</th>
                <th className="p-3 text-right">הכנסות ריבית</th>
                <th className="p-3 text-right">עמלות</th>
                <th className="p-3 text-right">הכנסות נוספות</th>
                <th className="p-3 text-right">הכנסות מהוונות</th>
                <th className="p-3 text-right">תשואה ל־RWA</th>
              </tr>
            </thead>
            <tbody>
              {forecast.rows.map((row) => (
                <tr key={row.year} className="border-t">
                  <td className="p-3 font-medium">{row.year}</td>
                  <td className="p-3">{row.stage}</td>
                  <td className="p-3">{formatK(row.drawdown)}</td>
                  <td className="p-3 font-medium">{formatK(row.outstanding)}</td>
                  <td className="p-3">{formatK(row.averageOutstanding)}</td>
                  <td className="p-3">{formatK(row.undrawn)}</td>
                  <td className="p-3">{formatK(row.bankShareLimit)}</td>
                  <td className={`p-3 font-bold ${row.bankShareLimitExceeded ? "text-red-700" : "text-emerald-700"}`}>{row.bankShareLimitExceeded ? formatK(row.bankShareExcess) : "תקין"}</td>
                  <td className="p-3 font-bold text-emerald-700">{formatK(row.rwa)}</td>
                  <td className="p-3">{formatK(row.interestIncome)}</td>
                  <td className="p-3">{formatK(row.feeIncome)}</td>
                  <td className="p-3">{formatK(row.additionalIncome)}</td>
                  <td className="p-3 font-bold text-orange-700">{formatK(row.discountedIncome)}</td>
                  <td className="p-3">{row.returnOnRwa.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <b>הערת אפיון:</b> כרגע ריבית ההיוון מוגדרת כברירת מחדל 0%, ולכן ההכנסות המהוונות שוות להכנסות הנומינליות. לאחר אישור הצוות ניתן להשתמש בריבית היוון לצורך NPV. כמו כן כדאי להחליף את מודל השחרורים/פעימות בטבלת תזרים שנתית או חודשית שתגיע ממודל הפרויקט.
      </div>
    </div>
  );
}

function DefinitionsPanel() {
  return (
    <Panel>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">הגדרות ומונחים בסימולטור</h2>
          <p className="text-sm text-slate-500">עמוד עזר לבנקאים ולמתכנתים: מה כל שדה אומר, איך הוא משפיע על החישוב, ומה דורש טבלת פרמטרים מאושרת.</p>
        </div>
        <Badge tone="blue">מוקאפ — יש לאשר מול הוראות ומדיניות הבנק</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DefinitionCard title="מונחי חשיפה ונכסי סיכון">
          <DefinitionItem term="חבות מלאה ברוטו" text="סך המסגרות/סכומי ההלוואה לפני מקדמי CCF, בטוחות או הקלות. במוצר מכירת סיכון לא נוצרת חבות חדשה." />
          <DefinitionItem term="EAD / חשיפה לאחר CCF" text="Exposure at Default. החשיפה לצורכי RWA לאחר החלת CCF על מנוצל ולא מנוצל. בהלוואת stand-alone הניצול הוא 100%." />
          <DefinitionItem term="RWA / נכסי סיכון" text="Risk Weighted Assets. מחושב כ-EAD כפול משקל סיכון אפקטיבי, לאחר בטוחות, ערבויות CRM ומכירת סיכון." />
          <DefinitionItem term="CCF" text="Credit Conversion Factor. מקדם המרה למסגרות/התחייבויות חוץ מאזניות. יש CCF נפרד למנוצל וללא מנוצל במוקאפ." />
          <DefinitionItem term="משקל סיכון אפקטיבי" text="משקל הסיכון שנבחר בפועל אחרי סדר עדיפות: נדל״ן/תשתית בהקמה, PSE/רשות, דירוג לווה, ולבסוף משקל ידני לגיבוי." />
        </DefinitionCard>

        <DefinitionCard title="מוצרים וחישוב הכנסות">
          <DefinitionItem term="הלוואה לזמן קצר" text="מוצר נושא ריבית. ה-EAD מחושב לפי הניצול וה-CCF. אם היא stand-alone אין חלק לא מנוצל." />
          <DefinitionItem term="הלוואה לזמן ארוך" text="מוצר נושא ריבית עם תקופה ולוח סילוקין. היתרה הממוצעת ל-RWA מחושבת לפי קרן שווה, שפיצר או גרייס." />
          <DefinitionItem term="קרן שווה" text="הקרן נפרעת בחלקים שווים לאורך התקופה, ולכן היתרה הממוצעת ל-RWA יורדת לאורך השנה." />
          <DefinitionItem term="שפיצר" text="תשלום חודשי קבוע בקירוב; רכיב הקרן עולה לאורך הזמן. היתרה הממוצעת ל-RWA מחושבת לפי לוח שפיצר." />
          <DefinitionItem term="גרייס" text="אין ירידת קרן בתקופת הגרייס, ולכן היתרה הממוצעת ל-RWA נשארת שווה לניצול." />
          <DefinitionItem term="ערבויות / L/C / נגזרים" text="במוקאפ מוצגים כמוצרים עמלתיים: הם מייצרים EAD לפי CCF, אך לא מרווח אשראי. ההכנסה נרשמת באזור עמלות." />
        </DefinitionCard>

        <DefinitionCard title="סינדיקציה ומכירת סיכון">
          <DefinitionItem term="מכירת סיכון / סינדיקציה" text="מוצר התאמה שאינו מוסיף EAD או חבות. הוא מפחית RWA לפי סכום המכירה ומועד המכירה הצפוי." />
          <DefinitionItem term="סכום מכירה" text="הסכום שנמכר/מועבר לגוף הרוכש. במוקאפ הוא משמש גם כהפחתת RWA לפני שקלול מועד המכירה." />
          <DefinitionItem term="מכירה צפויה אחרי חודשים" text="מספר חודשים עד שהמכירה נכנסת לתוקף. לדוגמה 6 חודשים: ההפחתה והעלות מחושבות רק עבור 6 החודשים שנותרו בשנה." />
          <DefinitionItem term="תשלום לקונה" text="עלות שנתית יחסית: סכום מכירה × מחיר/מרווח לקונה × חלק השנה אחרי המכירה." />
          <DefinitionItem term="תשואה לפני/אחרי מכירה" text="כאשר קיימת מכירת סיכון, הסיכום הניהולי מציג תשואה ל-RWA לפני השפעת המכירה ואחריה." />
        </DefinitionCard>

        <DefinitionCard title="בטוחות, ערבויות ודירוגים">
          <DefinitionItem term="בטוחות פיננסיות כשירות" text="בטוחות המוכרות להפחתת חשיפה/RWA לאחר בדיקת כשירות, שעבוד, סחירות, ריכוזיות, מטבע ו-haircut." />
          <DefinitionItem term="ני״ע/פקדון משועבדים לבטוחה" text="פופ-אפ הבטוחות מחשב שווי כשיר לאחר haircut. אג״ח ממשלתי/קונצרני מדורג מקבל haircut לפי דירוג ני״ע; פקדון שקלי מוצג ללא haircut, ופקדון מט״ח מוצג במוקאפ עם haircut דוגמה של 10% בגין פער מטבע." />
          <DefinitionItem term="Haircut" text="הפחתה משווי השוק של הבטוחה לצורך הכרה רגולטורית/פנימית. במוקאפ נקבע לפי סוג ני״ע, דירוג או פער מטבע." />
          <DefinitionItem term="ערבות CRM" text="ערבות מוכרת שמפחיתה RWA על יתרת החשיפה שלא כוסתה בבטוחות. שונה מערבות כמוצר אשראי שמייצרת EAD." />
          <DefinitionItem term="דירוג לווה S&P" text="משפיע על משקל הסיכון של הלווה/RWA. אינו קובע כשירות בטוחות; כשירות בטוחות נקבעת לפי דירוג ני״ע וסוג הבטוחה." />
        </DefinitionCard>

        <DefinitionCard title="הכנסות ותשואה">
          <DefinitionItem term="הכנסות מאשראי" text="הכנסה שנתית ממוצרים נושאי ריבית: ניצול צפוי × מרווח אשראי, בניכוי תשלום לקונה במקרה של מכירת סיכון." />
          <DefinitionItem term="הכנסות נוספות" text="הכנסות שאינן מגדילות EAD במוקאפ: מרווח פקדונות, עמלות ערבויות, עמלות חשבון, מט״ח, סחר חוץ ואחרות." />
          <DefinitionItem term="תשואה לנכסי סיכון" text="הכנסות שנתיות כוללות חלקי RWA סופי. זה המדד המרכזי בסימולטור במקום RORAC." />
          <DefinitionItem term="שיפור תשואה ל-RWA" text="פער בנקודות אחוז בין תשואה ל-RWA אחרי ההקלות לבין לפני ההקלות. לדוגמה 2.00% ל-2.40% = 0.40 נק׳." />
          <DefinitionItem term="הון נדרש שנחסך" text="חיסכון RWA × יחס הון פנימי. זה חיסכון/שחרור הון ניהולי, לא בהכרח חיסכון תזרימי." />
        </DefinitionCard>

        <DefinitionCard title="נוסחאות מרכזיות במוקאפ">
          <FormulaLine label="EAD מוצר" formula="ניצול × CCF מנוצל + לא מנוצל × CCF לא מנוצל" />
          <FormulaLine label="RWA בסיס" formula="EAD × משקל סיכון בסיסי" />
          <FormulaLine label="RWA אחרי בטוחות" formula="יתרה לא מכוסה × משקל סיכון אפקטיבי + ערבות CRM × משקל ערב" />
          <FormulaLine label="מכירת סיכון" formula="סכום מכירה × (12 - חודשים עד מכירה) / 12" />
          <FormulaLine label="תשלום לקונה" formula="סכום מכירה × מחיר לקונה × חלק השנה אחרי המכירה" />
          <FormulaLine label="תשואה ל-RWA" formula="הכנסות שנתיות כוללות / RWA סופי" />
          <FormulaLine label="הון נדרש" formula="RWA × יחס הון פנימי" />
        </DefinitionCard>
      </div>
    </Panel>
  );
}
