import assert from "node:assert/strict";
import {
  calculateConstructionProjectForecast,
  createDefaultConstructionCreditProducts,
} from "../construction/constructionEngine.js";

function findFirstRowAfterStage(forecast, stage) {
  return forecast.rows.find((row) => row.stage === stage);
}

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

console.log("Construction engine tests passed");
