var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  function safeJsonParse(rawText) {
    let cleaned = (rawText || "").trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const fixedBackslashes = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      try {
        return JSON.parse(fixedBackslashes);
      } catch (err2) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          const sub = match[0].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          return JSON.parse(sub);
        }
        throw err2;
      }
    }
  }
  app.post("/api/gemini/diagnose", async (req, res) => {
    const {
      signalType = "\u6B63\u5F26\u590D\u5408\u4FE1\u53F7",
      sampleCount = 100,
      dx = 0.1,
      noiseLevel = 0.05,
      diffMethod = "\u4E2D\u5FC3\u5DEE\u5206 (Central Difference)",
      intMethod = "\u68AF\u5F62\u6CD5 (Trapezoidal)",
      filterMethod = "\u65E0 / Savitzky-Golay",
      appContext = "\u901A\u7528\u65F6\u5E8F\u6C42\u5BFC\u4E0E\u79EF\u5206",
      dataStats = {}
    } = req.body || {};
    const fallbackResponse = {
      noiseRiskLevel: noiseLevel > 0.1 ? "\u9AD8" : "\u4E2D",
      noiseRiskScore: Math.min(100, Math.round(noiseLevel * 350 + 20)),
      driftRiskLevel: sampleCount > 150 ? "\u9AD8" : "\u4F4E",
      driftRiskScore: Math.min(100, Math.round(sampleCount * 0.25 + 10)),
      derivativeDiagnosis: `\u5F53\u524D\u9AD8\u9891\u9AD8\u65AF\u566A\u58F0\u5F3A\u5EA6\u4E3A \u03C3=${noiseLevel}\u3002\u79BB\u6563\u6C42\u5BFC\u64CD\u4F5C \u0394y/\u0394x \u4F1A\u4EA7\u751F (2\u03C3/\u0394x) \u500D\u7684\u5BFC\u6570\u632F\u8361\u98CE\u9669\uFF0C\u6570\u503C\u8BEF\u5DEE\u968F\u91C7\u6837\u5BC6\u5EA6\u589E\u52A0\u5448\u975E\u7EBF\u6027\u653E\u5927\u3002`,
      integralDiagnosis: `\u6570\u503C\u79EF\u5206\u5728\u5F53\u524D\u533A\u95F4\u5177\u6709\u826F\u597D\u4F4E\u901A\u7279\u6027\uFF0C\u4F46\u9700\u9632\u8303 DC \u5E38\u6570\u504F\u7F6E\u5E26\u6765\u7684\u957F\u7A0B\u7EBF\u6027\u7D2F\u79EF\u6F02\u79FB\u3002`,
      recommendedFilterPipeline: `\u63A8\u8350\u7B97\u6CD5\u94FE\u8DEF\uFF1A\u4F7F\u7528 Savitzky-Golay (\u7A97\u53E3 11, \u591A\u9879\u5F0F 3) \u9884\u5E73\u6ED1\u540E\uFF0C\u5E94\u7528\u4E2D\u5FC3\u5DEE\u5206\u6C42\u5BFC\u3002`,
      mathematicalInsight: `\u5728\u8FDE\u7EED\u4E0E\u79BB\u6563\u8F6C\u6362\u4E2D\uFF0C\u6781\u9650\u5B9A\u7406\u8981\u6C42\u5E73\u8861\u79BB\u6563\u622A\u65AD\u8BEF\u5DEE O(\u0394x\xB2) \u4E0E\u9AD8\u9891\u9AD8\u65AF\u566A\u58F0\u653E\u5927\uFF0C\u5BFB\u627E\u6700\u4F18\u91C7\u6837\u70B9\u5BC6\u5EA6\u3002`,
      actionableSteps: [
        "\u4F18\u5148\u5F00\u542F Savitzky-Golay \u5377\u79EF\u5E73\u6ED1\u6EE4\u6CE2\u5668",
        "\u4F7F\u7528\u4E2D\u5FC3\u5DEE\u5206 (Central Difference) \u66FF\u4EE3\u524D\u5411\u5DEE\u5206",
        "\u5728\u4E8C\u6B21\u79EF\u5206\u524D\u6267\u884C\u5747\u503C\u6263\u9664 (Demean / Zero-Velocity Update)"
      ]
    };
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackResponse);
    }
    try {
      const prompt = `
\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u6570\u503C\u8BA1\u7B97\u3001\u6570\u636E\u79D1\u5B66\u4E0E\u4FE1\u53F7\u5904\u7406\u7684 AI \u4E13\u5BB6\u3002\u8BF7\u5BF9\u5F53\u524D\u201C\u6570\u636E\u5FAE\u79EF\u5206\u5B9E\u9A8C\u5BA4\u201D\u4E2D\u7684\u5B9E\u9A8C\u53C2\u6570\u548C\u4FE1\u53F7\u72B6\u6001\u8FDB\u884C\u6DF1\u5EA6\u4E13\u4E1A\u8BCA\u65AD\u3002

\u3010\u5F53\u524D\u5B9E\u9A8C\u73AF\u5883\u4E0E\u6570\u636E\u7279\u5F81\u3011\uFF1A
- \u4FE1\u53F7\u7C7B\u578B: ${signalType}
- \u91C7\u6837\u70B9\u6570: ${sampleCount}
- \u91C7\u6837\u6B65\u957F \u0394x: ${dx}
- \u9AD8\u9891\u9AD8\u65AF\u566A\u58F0\u5F3A\u5EA6 \u03C3: ${noiseLevel}
- \u79BB\u6563\u6C42\u5BFC\u7B97\u6CD5: ${diffMethod}
- \u6570\u503C\u79EF\u5206\u7B97\u6CD5: ${intMethod}
- \u5E73\u6ED1\u6EE4\u6CE2\u7B97\u6CD5: ${filterMethod}
- \u5E94\u7528\u573A\u666F\u4E0A\u4E0B\u6587: ${appContext}
- \u6570\u636E\u7EDF\u8BA1\u91CF: ${JSON.stringify(dataStats)}

\u8BF7\u4EE5\u6807\u51C6\u7684 JSON \u683C\u5F0F\u8FD4\u56DE\u4E00\u4EFD\u8BE6\u5C3D\u7684\u8BCA\u65AD\u62A5\u544A\u3002\u6CE8\u610F\uFF1A\u8BF7\u52FF\u5728\u5B57\u7B26\u4E32\u4E2D\u4F7F\u7528\u672A\u8F6C\u4E49\u7684\u5355\u659C\u6760\uFF08\u5982 LaTeX \u7B26\u53F7 \\Delta \u8BF7\u5199\u4E3A \u0394 \u6216\u53CC\u659C\u6760 \\\\Delta\uFF09\u3002

\u683C\u5F0F\u5982\u4E0B\uFF1A
{
  "noiseRiskLevel": "\u4F4E / \u4E2D / \u9AD8 / \u6781\u9AD8",
  "noiseRiskScore": 85,
  "driftRiskLevel": "\u4F4E / \u4E2D / \u9AD8 / \u6781\u9AD8",
  "driftRiskScore": 40,
  "derivativeDiagnosis": "\u5173\u4E8E\u79BB\u6563\u6C42\u5BFC\u5728\u5F53\u524D\u566A\u58F0\u4E0E\u6B65\u957F\u4E0B\u653E\u5927\u7684\u5177\u4F53\u7269\u7406\u4E0E\u6570\u5B66\u673A\u5236\u5206\u6790\uFF08\u7EA680-120\u5B57\uFF09",
  "integralDiagnosis": "\u5173\u4E8E\u6570\u503C\u79EF\u5206\u7D2F\u79EF\u8BEF\u5DEE\u4E0E\u76F4\u6D41\u6F02\u79FB\uFF08Drift\uFF09\u7684\u5F71\u54CD\u5206\u6790\uFF08\u7EA680-120\u5B57\uFF09",
  "recommendedFilterPipeline": "\u63A8\u8350\u7684\u5148\u6EE4\u6CE2\u540E\u5FAE\u79EF\u5206\u7684\u6700\u4F73\u7B97\u6CD5\u7EC4\u5408\u4E0E\u53C2\u6570\u5EFA\u8BAE",
  "mathematicalInsight": "\u4ECE\u8FDE\u7EED\u5FAE\u79EF\u5206 f'(x) / \u222Bf(x)dx \u6620\u5C04\u5230\u79BB\u6563 \u0394y/\u0394x \u4E0E \u2211y_i \u0394x \u7684\u6838\u5FC3\u6570\u5B66\u6D1E\u5BDF",
  "actionableSteps": [
    "\u5177\u4F53\u6B65\u9AA4 1",
    "\u5177\u4F53\u6B65\u9AA4 2",
    "\u5177\u4F53\u6B65\u9AA4 3"
  ]
}
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const resultText = response.text || "{}";
      const parsed = safeJsonParse(resultText);
      res.json(parsed);
    } catch (error) {
      console.error("Gemini diagnose error:", error);
      res.json(fallbackResponse);
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
