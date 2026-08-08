import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to parse JSON from Gemini safely even if LaTeX backslashes or code fences are present
  function safeJsonParse(rawText: string) {
    let cleaned = (rawText || "").trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // Fix unescaped backslashes commonly found in LaTeX output (e.g., \Delta, \frac, \partial)
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

  // AI Calculus Diagnostic Endpoint
  app.post("/api/gemini/diagnose", async (req, res) => {
    const {
      signalType = "正弦复合信号",
      sampleCount = 100,
      dx = 0.1,
      noiseLevel = 0.05,
      diffMethod = "中心差分 (Central Difference)",
      intMethod = "梯形法 (Trapezoidal)",
      filterMethod = "无 / Savitzky-Golay",
      appContext = "通用时序求导与积分",
      dataStats = {},
    } = req.body || {};

    const fallbackResponse = {
      noiseRiskLevel: noiseLevel > 0.1 ? "高" : "中",
      noiseRiskScore: Math.min(100, Math.round(noiseLevel * 350 + 20)),
      driftRiskLevel: sampleCount > 150 ? "高" : "低",
      driftRiskScore: Math.min(100, Math.round(sampleCount * 0.25 + 10)),
      derivativeDiagnosis: `当前高频高斯噪声强度为 σ=${noiseLevel}。离散求导操作 Δy/Δx 会产生 (2σ/Δx) 倍的导数振荡风险，数值误差随采样密度增加呈非线性放大。`,
      integralDiagnosis: `数值积分在当前区间具有良好低通特性，但需防范 DC 常数偏置带来的长程线性累积漂移。`,
      recommendedFilterPipeline: `推荐算法链路：使用 Savitzky-Golay (窗口 11, 多项式 3) 预平滑后，应用中心差分求导。`,
      mathematicalInsight: `在连续与离散转换中，极限定理要求平衡离散截断误差 O(Δx²) 与高频高斯噪声放大，寻找最优采样点密度。`,
      actionableSteps: [
        "优先开启 Savitzky-Golay 卷积平滑滤波器",
        "使用中心差分 (Central Difference) 替代前向差分",
        "在二次积分前执行均值扣除 (Demean / Zero-Velocity Update)",
      ],
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackResponse);
    }

    try {
      const prompt = `
你是一位精通数值计算、数据科学与信号处理的 AI 专家。请对当前“数据微积分实验室”中的实验参数和信号状态进行深度专业诊断。

【当前实验环境与数据特征】：
- 信号类型: ${signalType}
- 采样点数: ${sampleCount}
- 采样步长 Δx: ${dx}
- 高频高斯噪声强度 σ: ${noiseLevel}
- 离散求导算法: ${diffMethod}
- 数值积分算法: ${intMethod}
- 平滑滤波算法: ${filterMethod}
- 应用场景上下文: ${appContext}
- 数据统计量: ${JSON.stringify(dataStats)}

请以标准的 JSON 格式返回一份详尽的诊断报告。注意：请勿在字符串中使用未转义的单斜杠（如 LaTeX 符号 \\Delta 请写为 Δ 或双斜杠 \\\\Delta）。

格式如下：
{
  "noiseRiskLevel": "低 / 中 / 高 / 极高",
  "noiseRiskScore": 85,
  "driftRiskLevel": "低 / 中 / 高 / 极高",
  "driftRiskScore": 40,
  "derivativeDiagnosis": "关于离散求导在当前噪声与步长下放大的具体物理与数学机制分析（约80-120字）",
  "integralDiagnosis": "关于数值积分累积误差与直流漂移（Drift）的影响分析（约80-120字）",
  "recommendedFilterPipeline": "推荐的先滤波后微积分的最佳算法组合与参数建议",
  "mathematicalInsight": "从连续微积分 f'(x) / ∫f(x)dx 映射到离散 Δy/Δx 与 ∑y_i Δx 的核心数学洞察",
  "actionableSteps": [
    "具体步骤 1",
    "具体步骤 2",
    "具体步骤 3"
  ]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      const parsed = safeJsonParse(resultText);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini diagnose error:", error);
      // Return structured fallback response gracefully instead of 500 error
      res.json(fallbackResponse);
    }
  });

  // Vite or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
