import assert from "node:assert/strict";
import {
  calculateConstructionProjectForecast,
  calculateInfrastructureProjectForecast,
  createDefaultConstructionCreditProducts,
} from "../simulatorEngine.js";
import { CONSTRUCTION_UTILIZATION_FIELDS } from "../construction/constructionEngine.js";

function findFirstRowAfterStage(forecast, stage) {
  return forecast.rows.find((row) => row.stage === stage);
}

assert.equal(CONSTRUCTION_UTILIZATION_FIELDS[0].field, "utilH1Pct", "construction module bridge should export utilization fields for merged imports");

const defaultProducts = createDefaultConstructionCreditProducts({
  totalCost: 420_000,
  landCost: 140_000,
  equityPct: 25,
  bankSharePct: 100,
});

const highLandLtvProducts = defaultProducts.map((product) =>
  product.productType === "landLoan" ? { ...product, amount: 120_000, limit: 120_000 } : product
);
const highLandLtvForecast = calculateConstructionProjectForecast({
  landMonths: 3,
  constructionMonths: 12,
  totalCost: 420_000,
  landCost: 140_000,
  expectedRevenue: 560_000,
  creditProducts: highLandLtvProducts,
});
assert.equal(highLandLtvForecast.rows[0].riskWeight, 150, "land loan above 80% of land value should use 150% risk weight");

const delayedForecast = calculateConstructionProjectForecast({
  landMonths: 3,
  constructionMonths: 12,
  constructionDelayMonths: 99,
  totalCost: 420_000,
  landCost: 140_000,
  expectedRevenue: 560_000,
  creditProducts: defaultProducts,
});
assert.equal(delayedForecast.constructionDelayMonths, 24, "construction delay should be capped at 24 months");

const exitForecast = calculateConstructionProjectForecast({
  landMonths: 3,
  constructionMonths: 12,
  salesScenario: "exitAfterLand",
  totalCost: 420_000,
  landCost: 140_000,
  expectedRevenue: 560_000,
  creditProducts: defaultProducts,
});
const exitRow = findFirstRowAfterStage(exitForecast, "פירעון בסוף קרקע");
assert.ok(exitRow, "exit-after-land scenario should produce payoff stage rows");
assert.equal(exitRow.loanOutstanding, 0, "exit-after-land scenario should repay outstanding land credit after land period");
assert.equal(exitForecast.peakSaleLawGuarantees, 0, "exit-after-land scenario should not generate sale-law guarantees");

const saleLawProductForecast = calculateConstructionProjectForecast({
  landMonths: 3,
  constructionMonths: 12,
  finalMonths: 3,
  totalCost: 420_000,
  landCost: 140_000,
  expectedRevenue: 560_000,
  creditProducts: [
    ...defaultProducts,
    { id: 10, name: "מסגרת ערבויות חוק מכר", productType: "saleLawGuarantee", amount: 560_000, limit: 560_000, margin: 0.65, ccfUndrawn: 30, riskWeight: 30, repaymentPriority: 1 },
  ],
});
const occupancyRow = saleLawProductForecast.rows.find((row) => row.stage === "אכלוס/סוף פרויקט");
assert.ok(occupancyRow, "forecast should include occupancy/final period");
assert.equal(occupancyRow.effectiveSaleLawGuaranteeCcf, 10, "sale-law guarantee CCF should be 10% in occupancy period");

const utilizationWithSaleLawForecast = calculateConstructionProjectForecast({
  landMonths: 0,
  constructionMonths: 6,
  finalMonths: 0,
  totalCost: 1_500,
  landCost: 0,
  expectedRevenue: 3_600,
  bankSharePct: 100,
  creditProducts: [
    {
      id: 1,
      name: "הלוואת בניה בכירה",
      productType: "seniorConstruction",
      amount: 1_000,
      limit: 1_000,
      margin: 3.2,
      customerInterest: 3.2,
      ccfUndrawn: 50,
      riskWeight: 100,
      utilH1Pct: 80,
    },
    { id: 2, name: "מסגרת ערבויות חוק מכר", productType: "saleLawGuarantee", amount: 600, limit: 600, margin: 0.65, ccfUndrawn: 30, riskWeight: 30 },
  ],
});
const utilizationRow = utilizationWithSaleLawForecast.rows[0];
assert.equal(utilizationRow.loanOutstanding, 800, "80% utilization on a 1,000 loan frame should create 800 utilized credit");
assert.equal(utilizationRow.saleLawGuaranteeOutstanding, 600, "issued sale-law guarantees should be included alongside loan utilization");
assert.equal(utilizationRow.undrawnLoan, 100, "undrawn real-estate loan frame should be residual project frame: 1,500 - 800 - 600 = 100");

const infrastructureSmokeForecast = calculateInfrastructureProjectForecast({
  projectYears: 25,
  constructionYears: 4,
  rampUpYears: 2,
  projectCurrency: "ILS",
  projectTotalScope: 1_000_000,
  bankSharePct: 40,
  products: [],
});
assert.equal(infrastructureSmokeForecast.rows.length, 25, "infrastructure forecast should initialize for app preview without construction-only references");

console.log("Construction engine tests passed");
