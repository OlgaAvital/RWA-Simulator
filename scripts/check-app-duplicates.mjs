import fs from "node:fs";

const appPath = "src/App.jsx";
const domainPath = "src/domain/simulatorEngine.js";
const app = fs.readFileSync(appPath, "utf8");
const domain = fs.readFileSync(domainPath, "utf8");

const conflictMarker = /^(<<<<<<<|=======|>>>>>>>) /m;
if (conflictMarker.test(app) || conflictMarker.test(domain)) {
  console.error("Found unresolved merge conflict markers in App/domain files.");
  process.exit(1);
}

const exportedDomainNames = new Set(
  [...domain.matchAll(/^export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)].map((match) => match[1])
);

const topLevelAppNames = new Set();
for (const match of app.matchAll(/^(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)) {
  topLevelAppNames.add(match[1]);
}

for (const importBlock of app.matchAll(/import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/domain\/simulatorEngine\.js["']/g)) {
  for (const rawName of importBlock[1].split(",")) {
    const name = rawName.trim().split(/\s+as\s+/).pop()?.trim();
    if (name) topLevelAppNames.add(name);
  }
}

const duplicates = [...topLevelAppNames].filter((name) => exportedDomainNames.has(name));
if (duplicates.length > 0) {
  console.error(`Duplicate App/domain symbols detected: ${duplicates.join(", ")}`);
  process.exit(1);
}

console.log("No App/domain duplicate symbols or conflict markers found.");
