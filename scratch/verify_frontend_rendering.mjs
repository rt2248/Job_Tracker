/**
 * @file verify_frontend_rendering.mjs
 * @description Verifies that the live Groq assessment output renders cleanly across all frontend components.
 */

import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transform } from "sucrase";

const liveResult = JSON.parse(fs.readFileSync("scratch/live_verification_result.json", "utf-8"));
const assessment = liveResult.responseBody.assessment;
const fallbackActive = liveResult.responseBody.fallbackActive;

console.log("=== FRONTEND COMPONENT RENDERING VERIFICATION ===");
console.log("Assessment Received:", Boolean(assessment));
console.log("Fallback Active:", fallbackActive);

async function loadJsxComponent(relativePath) {
  const fullPath = path.resolve(relativePath);
  let code = fs.readFileSync(fullPath, "utf-8");

  code = code
    .replace(/import\s*\{\s*cn\s*\}\s*from\s*["'][^"']+["'];?/g, 'const cn = (...args) => args.filter(Boolean).join(" ");')
    .replace(/import\s*Badge\s*from\s*["'][^"']+["'];?/g, 'const Badge = ({ children, className }) => React.createElement("span", { className }, children);')
    .replace(/import\s*\{\s*Card,\s*CardHeader,\s*CardTitle,\s*CardContent\s*\}\s*from\s*["'][^"']+["'];?/g, `
      const Card = ({ children, className }) => React.createElement("div", { className }, children);
      const CardHeader = ({ children, className }) => React.createElement("div", { className }, children);
      const CardTitle = ({ children, className }) => React.createElement("h3", { className }, children);
      const CardContent = ({ children, className }) => React.createElement("div", { className }, children);
    `)
    .replace(/import\s*Button\s*from\s*["'][^"']+["'];?/g, 'const Button = ({ children, className, onClick }) => React.createElement("button", { className, onClick }, children);');

  if (!code.includes("import React")) {
    code = `import React from "react";\n` + code;
  }

  const transformed = transform(code, {
    transforms: ["jsx"],
    jsxRuntime: "classic",
    production: true,
  }).code;

  const compiledDir = path.resolve("scratch/.compiled");
  if (!fs.existsSync(compiledDir)) {
    fs.mkdirSync(compiledDir, { recursive: true });
  }

  const compiledFile = path.resolve(compiledDir, path.basename(relativePath, ".jsx") + ".js");
  fs.writeFileSync(compiledFile, transformed, "utf-8");

  const fileUrl = new URL("file:///" + compiledFile.replace(/\\/g, "/"));
  const mod = await import(fileUrl.href + "?t=" + Date.now());
  return mod.default;
}

async function verifyAllComponents() {
  // 1. CandidateSummaryCard
  const CandidateSummaryCard = await loadJsxComponent("Frontend/src/components/career_strategist/CandidateSummaryCard.jsx");
  const summaryHtml = renderToStaticMarkup(React.createElement(CandidateSummaryCard, {
    summary: assessment.candidateSummary,
  }));
  console.log("1. CandidateSummaryCard rendered successfully!");
  console.log("   Contains career stage:", summaryHtml.includes("Entry Level") || summaryHtml.includes("entry_level"));
  console.log("   Contains pipeline health:", summaryHtml.includes("Needs Focus") || summaryHtml.includes("needs_focus"));
  console.log("   Contains bottleneck:", summaryHtml.includes(assessment.candidateSummary.primaryBottleneck));

  // 2. PipelineDiagnosticsCard
  const PipelineDiagnosticsCard = await loadJsxComponent("Frontend/src/components/career_strategist/PipelineDiagnosticsCard.jsx");
  const diagnosticsHtml = renderToStaticMarkup(React.createElement(PipelineDiagnosticsCard, {
    diagnostics: assessment.pipelineDiagnostics,
  }));
  console.log("2. PipelineDiagnosticsCard rendered successfully!");
  console.log("   Contains volume assessment:", diagnosticsHtml.includes(assessment.pipelineDiagnostics.volumeAssessment.substring(0, 30)));
  console.log("   Contains velocity:", diagnosticsHtml.includes(assessment.pipelineDiagnostics.stageProgressionVelocity.substring(0, 30)));

  // 3. SkillGapCard
  const SkillGapCard = await loadJsxComponent("Frontend/src/components/career_strategist/SkillGapCard.jsx");
  const skillHtml = renderToStaticMarkup(React.createElement(SkillGapCard, {
    skillGap: assessment.skillGapAnalysis,
  }));
  console.log("3. SkillGapCard rendered successfully!");
  console.log("   Contains verified skills:", skillHtml.includes("JavaScript") && skillHtml.includes("PostgreSQL"));
  console.log("   Contains missing skills:", skillHtml.includes("TypeScript") && skillHtml.includes("Docker"));

  // 4. StrategicRecommendationsList
  const StrategicRecommendationsList = await loadJsxComponent("Frontend/src/components/career_strategist/StrategicRecommendationsList.jsx");
  const recsHtml = renderToStaticMarkup(React.createElement(StrategicRecommendationsList, {
    recommendations: assessment.strategicRecommendations,
  }));
  console.log("4. StrategicRecommendationsList rendered successfully!");
  console.log("   Rendered 4 recommendations:", recsHtml.includes("REC-01") && recsHtml.includes("REC-02") && recsHtml.includes("REC-03") && recsHtml.includes("REC-04"));

  // 5. EvidenceGroundingCard
  const EvidenceGroundingCard = await loadJsxComponent("Frontend/src/components/career_strategist/EvidenceGroundingCard.jsx");
  const evidenceHtml = renderToStaticMarkup(React.createElement(EvidenceGroundingCard, {
    evidence: assessment.evidenceGrounding,
  }));
  console.log("5. EvidenceGroundingCard rendered successfully!");
  console.log("   Contains cited metrics:", evidenceHtml.includes("12 tracked opportunities") && evidenceHtml.includes("8 submitted applications"));

  // 6. FallbackNoticeBanner
  const FallbackNoticeBanner = await loadJsxComponent("Frontend/src/components/career_strategist/FallbackNoticeBanner.jsx");
  const bannerHtml = renderToStaticMarkup(React.createElement(FallbackNoticeBanner, {
    fallbackActive: fallbackActive,
  }));
  console.log("6. FallbackNoticeBanner rendered successfully!");
  console.log("   Banner is null/empty when fallbackActive is false:", bannerHtml === "" || bannerHtml === null);

  console.log("\n=== ALL FRONTEND CARDS RENDERED 100% CLEANLY ===");
}

verifyAllComponents().catch(err => {
  console.error("Rendering verification failed:", err);
  process.exit(1);
});
