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

import * as simulatorEngine from "./domain/simulatorEngine.js";

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
  const {
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
  } = simulatorEngine;
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
