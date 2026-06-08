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

const appNameSources = new Map();
const addAppName = (name, source) => {
  if (!appNameSources.has(name)) appNameSources.set(name, []);
  appNameSources.get(name).push(source);
};

for (const match of app.matchAll(/^(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)) {
  addAppName(nameFromMatch(match), "top-level declaration");
}

const namedDomainImports = [];
for (const importBlock of app.matchAll(/import\s+\{([^;]*?)\}\s+from\s+["']\.\/domain\/simulatorEngine\.js["']/g)) {
  for (const rawName of importBlock[1].split(",")) {
    const name = rawName.trim().split(/\s+as\s+/).pop()?.trim();
    if (!name) continue;
    namedDomainImports.push(name);
    addAppName(name, "named domain import");
  }
}

const appInternalDuplicates = [...appNameSources.entries()].filter(([, sources]) => sources.length > 1);
if (appInternalDuplicates.length > 0) {
  console.error(
    `Duplicate App symbols detected: ${appInternalDuplicates
      .map(([name, sources]) => `${name} (${sources.join(" + ")})`)
      .join(", ")}`
  );
  process.exit(1);
}

if (namedDomainImports.length > 0) {
  console.error(
    `Named imports from simulatorEngine are not allowed in App.jsx; use the namespace import instead: ${namedDomainImports.join(", ")}`
  );
  process.exit(1);
}

const domainCollisions = [...appNameSources.keys()].filter((name) => exportedDomainNames.has(name));
if (domainCollisions.length > 0) {
  console.error(`App symbols collide with simulatorEngine exports: ${domainCollisions.join(", ")}`);
  process.exit(1);
}

console.log("No App/domain duplicate symbols or conflict markers found.");

function nameFromMatch(match) {
  return match[1];
}
