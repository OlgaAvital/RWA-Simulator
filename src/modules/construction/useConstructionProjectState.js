import { useState } from "react";

const defaultConstructionUtilization = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => [`utilH${index + 1}Pct`, index < 6 ? Number((((index + 1) / 6) * 100).toFixed(2)) : 100])
);
const zeroConstructionUtilization = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`utilH${index + 1}Pct`, 0]));

export function useConstructionProjectState() {
  const [constructionLandMonths, setConstructionLandMonths] = useState(24);
  const [constructionBuildMonths, setConstructionBuildMonths] = useState(36);
  const [constructionFinalMonths, setConstructionFinalMonths] = useState(6);
  const [constructionSalesScenario, setConstructionSalesScenario] = useState("linear");
  const [constructionDelayMonths, setConstructionDelayMonths] = useState(0);
  const [constructionIncompleteSalesAtBuildEndPct, setConstructionIncompleteSalesAtBuildEndPct] = useState(80);
  const [constructionTotalCost, setConstructionTotalCost] = useState(0);
  const [constructionLandCost, setConstructionLandCost] = useState(0);
  const [constructionExpectedRevenue, setConstructionExpectedRevenue] = useState(0);
  const [constructionEquityPct, setConstructionEquityPct] = useState(25);
  const [constructionBankSharePct, setConstructionBankSharePct] = useState(100);
  const [constructionLoanMargin, setConstructionLoanMargin] = useState(3.2);
  const [constructionGuaranteeFeeRate, setConstructionGuaranteeFeeRate] = useState(1.1);
  const [constructionSaleLawGuaranteeFeeRate, setConstructionSaleLawGuaranteeFeeRate] = useState(0.65);
  const [constructionAccountManagementFee, setConstructionAccountManagementFee] = useState(0);
  const [constructionSetupFeePct, setConstructionSetupFeePct] = useState(0.45);
  const [constructionProjectManagementFee, setConstructionProjectManagementFee] = useState(0);
  const [constructionLandDocumentFee, setConstructionLandDocumentFee] = useState(0);
  const [constructionEscortDocumentFee, setConstructionEscortDocumentFee] = useState(0);
  const [constructionWorkingCapitalIssuanceFee, setConstructionWorkingCapitalIssuanceFee] = useState(0);
  const [constructionLegalAndControlFees, setConstructionLegalAndControlFees] = useState(0);
  const [constructionCompletionGuaranteeLimit, setConstructionCompletionGuaranteeLimit] = useState(0);
  const [constructionLandRiskWeight, setConstructionLandRiskWeight] = useState(100);
  const [constructionBuildRiskWeight, setConstructionBuildRiskWeight] = useState(100);
  const [constructionSaleLawGuaranteeCcf, setConstructionSaleLawGuaranteeCcf] = useState(30);
  const [constructionGuaranteeCcf, setConstructionGuaranteeCcf] = useState(50);
  const [constructionUndrawnLoanCcf, setConstructionUndrawnLoanCcf] = useState(0);
  const [constructionSaleLawGuaranteeFinalCcf, setConstructionSaleLawGuaranteeFinalCcf] = useState(10);
  const [constructionSaleLawGuaranteeReductionStartPct, setConstructionSaleLawGuaranteeReductionStartPct] = useState(80);
  const [isConstructionCreditModalOpen, setIsConstructionCreditModalOpen] = useState(false);

  const [isConstructionCollateralModalOpen, setIsConstructionCollateralModalOpen] = useState(false);
  const [constructionCollaterals, setConstructionCollaterals] = useState([
    { id: 1, name: "שעבוד קרקע מדרגה ראשונה", collateralType: "landMortgage", amount: 0, haircutPct: 35, eligible: true },
    { id: 2, name: "ערבות אישית בעלי מניות", collateralType: "personalGuarantee", amount: 0, haircutPct: 100, eligible: false },
  ]);
  const [constructionInsurances, setConstructionInsurances] = useState([
    { id: 1, name: "ביטוח ערבויות חוק מכר", insuranceType: "guaranteeInsurance", insuredAmount: 0, insurerRating: "a", paymentMode: "pct", paymentPct: 0.35, paymentAmount: 0 },
  ]);
  const [constructionCreditProducts, setConstructionCreditProducts] = useState([]);

  return {
    constructionLandMonths,
    setConstructionLandMonths,
    constructionBuildMonths,
    setConstructionBuildMonths,
    constructionFinalMonths,
    setConstructionFinalMonths,
    constructionSalesScenario,
    setConstructionSalesScenario,
    constructionDelayMonths,
    setConstructionDelayMonths,
    constructionIncompleteSalesAtBuildEndPct,
    setConstructionIncompleteSalesAtBuildEndPct,
    constructionTotalCost,
    setConstructionTotalCost,
    constructionLandCost,
    setConstructionLandCost,
    constructionExpectedRevenue,
    setConstructionExpectedRevenue,
    constructionEquityPct,
    setConstructionEquityPct,
    constructionBankSharePct,
    setConstructionBankSharePct,
    constructionLoanMargin,
    setConstructionLoanMargin,
    constructionGuaranteeFeeRate,
    setConstructionGuaranteeFeeRate,
    constructionSaleLawGuaranteeFeeRate,
    setConstructionSaleLawGuaranteeFeeRate,
    constructionAccountManagementFee,
    setConstructionAccountManagementFee,
    constructionSetupFeePct,
    setConstructionSetupFeePct,
    constructionProjectManagementFee,
    setConstructionProjectManagementFee,
    constructionLandDocumentFee,
    setConstructionLandDocumentFee,
    constructionEscortDocumentFee,
    setConstructionEscortDocumentFee,
    constructionWorkingCapitalIssuanceFee,
    setConstructionWorkingCapitalIssuanceFee,
    constructionLegalAndControlFees,
    setConstructionLegalAndControlFees,
    constructionCompletionGuaranteeLimit,
    setConstructionCompletionGuaranteeLimit,
    constructionLandRiskWeight,
    setConstructionLandRiskWeight,
    constructionBuildRiskWeight,
    setConstructionBuildRiskWeight,
    constructionSaleLawGuaranteeCcf,
    setConstructionSaleLawGuaranteeCcf,
    constructionGuaranteeCcf,
    setConstructionGuaranteeCcf,
    constructionUndrawnLoanCcf,
    setConstructionUndrawnLoanCcf,
    constructionSaleLawGuaranteeFinalCcf,
    setConstructionSaleLawGuaranteeFinalCcf,
    constructionSaleLawGuaranteeReductionStartPct,
    setConstructionSaleLawGuaranteeReductionStartPct,
    isConstructionCreditModalOpen,
    setIsConstructionCreditModalOpen,
    isConstructionCollateralModalOpen,
    setIsConstructionCollateralModalOpen,
    constructionCollaterals,
    setConstructionCollaterals,
    constructionInsurances,
    setConstructionInsurances,
    constructionCreditProducts,
    setConstructionCreditProducts,
  };
}
