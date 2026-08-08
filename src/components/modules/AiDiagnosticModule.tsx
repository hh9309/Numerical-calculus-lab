import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Lightbulb,
  ShieldCheck,
  Settings,
  Key,
  Bot,
  User,
  Send,
  Eye,
  EyeOff,
  MessageSquare,
  Check,
  X,
  HelpCircle,
  Cpu,
  Lock,
} from "lucide-react";
import {
  DiffMethod,
  IntMethod,
  FilterMethod,
  SignalPreset,
  SliceBounds,
  AiDiagnosisResult,
} from "../../types";
import { motion, AnimatePresence } from "motion/react";

interface AiDiagnosticModuleProps {
  signalPreset: SignalPreset;
  sampleCount: number;
  dx: number;
  noiseLevel: number;
  diffMethod: DiffMethod;
  intMethod: IntMethod;
  filterMethod: FilterMethod;
  sliceBounds: SliceBounds;
}

export type LLMModelOption = "gemini-2.5-flash" | "deepseek-v4-pro";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  model?: LLMModelOption;
  timestamp: string;
}

export const AiDiagnosticModule: React.FC<AiDiagnosticModuleProps> = ({
  signalPreset,
  sampleCount,
  dx,
  noiseLevel,
  diffMethod,
  intMethod,
  filterMethod,
  sliceBounds,
}) => {
  // LLM Config state with localStorage persistence
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("llm_api_key") || "";
  });
  const [selectedModel, setSelectedModel] = useState<LLMModelOption>(() => {
    return (localStorage.getItem("llm_selected_model") as LLMModelOption) || "gemini-2.5-flash";
  });

  // Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [tempModel, setTempModel] = useState<LLMModelOption>("gemini-2.5-flash");
  const [showKeyText, setShowKeyText] = useState(false);
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);

  // Diagnosis State
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat QA Dialogue State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: `你好！我是离散数据微积分实验室 AI 助手。已为您连接 ${selectedModel === "gemini-2.5-flash" ? "Google Gemini 2.5 Flash" : "DeepSeek V4 Pro"}。请问关于高频噪声对求导的放大效应、数值积分的累积漂移或 Savitzky-Golay 卷积平滑算法，您有什么疑问？`,
      model: selectedModel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Open settings modal prefilled
  const openSettingsModal = () => {
    setTempApiKey(apiKey);
    setTempModel(selectedModel);
    setIsSettingsOpen(true);
    setApiKeyNotice(null);
  };

  // Save Settings
  const handleSaveSettings = () => {
    const trimmedKey = tempApiKey.trim();
    setApiKey(trimmedKey);
    setSelectedModel(tempModel);
    localStorage.setItem("llm_api_key", trimmedKey);
    localStorage.setItem("llm_selected_model", tempModel);
    setIsSettingsOpen(false);
    setApiKeyNotice(null);

    // Update welcome message model badge
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "ai",
        text: `大模型配置已更新：已成功切换至 ${tempModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash" : "DeepSeek V4 Pro"}${trimmedKey ? " (API-Key 已验证输入)" : " (注：尚未输入 API-Key，调用前请输入)"}。`,
        model: tempModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Direct LLM API Call function
  const callLLMDirectly = async (promptText: string, modelToUse: LLMModelOption, keyToUse: string): Promise<string> => {
    if (!keyToUse) {
      throw new Error("REQUIRED_API_KEY");
    }

    if (modelToUse === "gemini-2.5-flash") {
      // Gemini Direct REST Call
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(keyToUse)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Gemini API Call Failed with HTTP ${response.status}`);
      }

      const resData = await response.json();
      const generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error("Gemini API 返回内容为空");
      }
      return generatedText;
    } else {
      // DeepSeek Direct OpenAI-compatible REST Call
      const endpoint = "https://api.deepseek.com/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyToUse}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一位离散数据微积分、数字信号处理 (DSP) 与数值分析领域的顶尖专家 AI 助手。" },
            { role: "user", content: promptText },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `DeepSeek API Call Failed with HTTP ${response.status}`);
      }

      const resData = await response.json();
      const replyText = resData?.choices?.[0]?.message?.content;
      if (!replyText) {
        throw new Error("DeepSeek API 返回内容为空");
      }
      return replyText;
    }
  };

  // Execute AI Diagnosis
  const fetchAiDiagnosis = async () => {
    setLoading(true);
    setErrorMsg(null);

    // If no API Key is entered, prompt user to enter key first
    if (!apiKey) {
      setApiKeyNotice("项目要部署到 Github / Netlify，浏览器端调用必须先输入 API-Key 才能发起 LLM 诊断。");
      openSettingsModal();
      setLoading(false);
      return;
    }

    try {
      const prompt = `你是一个数值微积分与 DSP 专家。请对以下离散信号与微积分沙盒配置进行诊断分析并输出 JSON：
- 信号类型: ${signalPreset}
- 采样点数: ${sampleCount}, 步长 dx: ${dx.toFixed(4)}, 区间: [${sliceBounds.startX}, ${sliceBounds.endX}]
- 噪声强度 σ: ${noiseLevel}
- 求导算法: ${diffMethod}
- 积分算法: ${intMethod}
- 滤波平滑: ${filterMethod}

请只返回 JSON 格式 (不要 markdown 代码块，纯 JSON 字符串)，字段如下：
{
  "noiseRiskLevel": "高" | "中" | "低",
  "noiseRiskScore": 数字 (0-100),
  "driftRiskLevel": "高" | "中" | "低",
  "driftRiskScore": 数字 (0-100),
  "derivativeDiagnosis": "关于高频噪声对求导振荡放大的具体诊断描述",
  "integralDiagnosis": "关于数值积分长程累积漂移与 DC 偏置的具体诊断描述",
  "recommendedFilterPipeline": "先滤波后微积分的最佳算法组合推荐建议",
  "mathematicalInsight": "深度的离散与连续转换数学原理解析",
  "actionableSteps": ["行动建议1", "行动建议2", "行动建议3"]
}`;

      const rawResult = await callLLMDirectly(prompt, selectedModel, apiKey);
      
      // Clean potential codeblocks
      const cleaned = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed: AiDiagnosisResult = JSON.parse(cleaned);
      setDiagnosis(parsed);
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      if (err.message === "REQUIRED_API_KEY") {
        setApiKeyNotice("请先输入 API-Key 才能调用大模型！");
        openSettingsModal();
      } else {
        setErrorMsg(`[${selectedModel}] 调用失败: ${err.message}。正在展示预设算法回退诊断结果。`);
        // Fallback
        setDiagnosis({
          noiseRiskLevel: noiseLevel > 0.1 ? "高" : "中",
          noiseRiskScore: Math.min(100, Math.round(noiseLevel * 350 + 20)),
          driftRiskLevel: sampleCount > 150 ? "高" : "低",
          driftRiskScore: Math.min(100, Math.round(sampleCount * 0.25 + 10)),
          derivativeDiagnosis: `当前高频高斯噪声强度为 σ=${noiseLevel}。离散求导操作 Δy/Δx 会产生 (2σ/Δx) 倍的导数振荡风险。`,
          integralDiagnosis: `数值积分在当前区间具有良好抗噪性，但需防范 DC 常数偏置带来的长程线性累积漂移。`,
          recommendedFilterPipeline: `推荐算法链路：使用 Savitzky-Golay (窗口 5, 多项式 2) 预平滑后，应用中心差分求导。`,
          mathematicalInsight: `在连续与离散转换中，极限定理要求平衡离散截断误差 O(Δx²) 与高频高斯噪声放大，寻找最优采样点密度。`,
          actionableSteps: [
            "优先开启 Savitzky-Golay 卷积平滑滤波器",
            "使用中心差分 (Central Difference) 替代前向差分",
            "在二次积分前执行均值扣除 (Demean / Zero-Velocity Update)",
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchAiDiagnosis();
    } else {
      // Show default fallback diagnosis if no API key yet
      setDiagnosis({
        noiseRiskLevel: noiseLevel > 0.1 ? "高" : "中",
        noiseRiskScore: Math.min(100, Math.round(noiseLevel * 350 + 20)),
        driftRiskLevel: sampleCount > 150 ? "高" : "低",
        driftRiskScore: Math.min(100, Math.round(sampleCount * 0.25 + 10)),
        derivativeDiagnosis: `当前高频高斯噪声强度为 σ=${noiseLevel}。离散求导操作 Δy/Δx 会产生 (2σ/Δx) 倍的导数振荡风险。`,
        integralDiagnosis: `数值积分在当前区间具有良好抗噪性，但需防范 DC 常数偏置带来的长程线性累积漂移。`,
        recommendedFilterPipeline: `推荐算法链路：使用 Savitzky-Golay (窗口 5, 多项式 2) 预平滑后，应用中心差分求导。`,
        mathematicalInsight: `在连续与离散转换中，极限定理要求平衡离散截断误差 O(Δx²) 与高频高斯噪声放大，寻找最优采样点密度。`,
        actionableSteps: [
          "优先开启 Savitzky-Golay 卷积平滑滤波器",
          "使用中心差分 (Central Difference) 替代前向差分",
          "在二次积分前执行均值扣除 (Demean / Zero-Velocity Update)",
        ],
      });
    }
  }, [signalPreset, noiseLevel, diffMethod, intMethod, filterMethod]);

  // Handle Question Answering in Chat
  const handleSendQuestion = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || chatLoading) return;

    if (!apiKey) {
      setApiKeyNotice("项目要部署到 Github / Netlify，所有大模型调用必须输入 API-Key 后才能调用。请在下方配置您的 API-Key。");
      openSettingsModal();
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setChatLoading(true);

    try {
      const systemPrompt = `你是一位专业的数字信号处理 (DSP) 与离散微积分专家。
当前用户正在离散数据微积分实验室中使用以下配置：
- 信号源: ${signalPreset}
- 采样点数 N = ${sampleCount}, 步长 dx = ${dx.toFixed(4)}
- 噪声强度 σ = ${noiseLevel}
- 离散求导算法: ${diffMethod}
- 数值积分算法: ${intMethod}
- 滤波降噪算法: ${filterMethod}

请针对用户提出的问题进行条理清晰、数学严谨且通俗易懂的专业解答：
"${question}"`;

      const aiAnswer = await callLLMDirectly(systemPrompt, selectedModel, apiKey);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiAnswer,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsgText = err.message === "REQUIRED_API_KEY"
        ? "调用失败：未检测到 API-Key，请点击右上角小齿轮配置您的 API-Key。"
        : `[${selectedModel}] 调用失败: ${err.message}。请检查 API-Key 或网络配置。`;

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: errorMsgText,
          model: selectedModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (err.message === "REQUIRED_API_KEY") {
        openSettingsModal();
      }
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner with Gear Icon */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs">
              <BrainCircuit className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold">AI 噪声与积分漂移实时诊断引擎</h3>
                <span className="text-[11px] bg-indigo-400/30 text-indigo-100 border border-indigo-300/40 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 font-semibold">
                  <Cpu className="w-3 h-3 text-sky-300" />
                  {selectedModel === "gemini-2.5-flash" ? "Google Gemini 2.5 Flash" : "DeepSeek V4 Pro"}
                </span>
                {apiKey ? (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> API-Key 已配置
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 未输入 API-Key
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200">
                实时剖析高频噪声对离散导数的放大攻击力，与数值积分长程累积漂移风险
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* LLM Settings Gear Button */}
            <button
              onClick={openSettingsModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-white/20 transition-all active:scale-95 shadow-2xs"
              title="配置大模型与输入 API-Key"
            >
              <Settings className="w-4 h-4 text-sky-300 animate-spin-slow" />
              <span>配置大模型 (API-Key)</span>
            </button>

            <button
              onClick={fetchAiDiagnosis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 font-semibold rounded-xl text-xs hover:bg-indigo-50 transition-all shadow-xs disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              {loading ? "诊断分析中..." : "重新发起 AI 诊断"}
            </button>
          </div>
        </div>

        {/* Notice Bar for GitHub/Netlify static deployment */}
        {!apiKey && (
          <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-2 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>GitHub / Netlify 部署提示：</strong> 本项目部署为前端静态页面，所有大模型调用必须先手工输入 API-Key 才能激活。
              </span>
            </div>
            <button
              onClick={openSettingsModal}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] whitespace-nowrap transition-all"
            >
              立即输入 API-Key
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Diagnosis Content */}
      {diagnosis && (
        <div className="space-y-6">
          {/* Dual Risk Index Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Derivative Noise Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-600" />
                  <h4 className="font-bold text-slate-800 text-sm">高频噪声放大攻击指数</h4>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  diagnosis.noiseRiskLevel === "高" || diagnosis.noiseRiskLevel === "极高"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  {diagnosis.noiseRiskLevel}风险 ({diagnosis.noiseRiskScore}/100)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    diagnosis.noiseRiskScore > 60 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${diagnosis.noiseRiskScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {diagnosis.derivativeDiagnosis}
              </p>
            </div>

            {/* Integral Drift Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-800 text-sm">数值积分累积漂移风险</h4>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  diagnosis.driftRiskLevel === "高" || diagnosis.driftRiskLevel === "极高"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                }`}>
                  {diagnosis.driftRiskLevel}风险 ({diagnosis.driftRiskScore}/100)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    diagnosis.driftRiskScore > 60 ? "bg-amber-500" : "bg-sky-500"
                  }`}
                  style={{ width: `${diagnosis.driftRiskScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {diagnosis.integralDiagnosis}
              </p>
            </div>
          </div>

          {/* AI Recommended Optimization Pipeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-800 text-sm">推荐的先滤波后微积分的最佳算法组合</h4>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 leading-relaxed font-medium">
              {diagnosis.recommendedFilterPipeline}
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                AI 算法推荐行动清单 (Actionable Remediation Checklist)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {diagnosis.actionableSteps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LLM Question-Answering Dialogue Box (大模型回答问题对话框) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                大模型微积分问答与沙盒对话
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Active Model: {selectedModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash" : "DeepSeek V4 Pro"}
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                向 AI 提问关于当前离散信号 (信号: {signalPreset}, 噪声: σ={noiseLevel}, 算法: {diffMethod}/{intMethod}) 的任何难题
              </p>
            </div>
          </div>

          {!apiKey && (
            <button
              onClick={openSettingsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-all"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              未配置 API-Key (点击设置)
            </button>
          )}
        </div>

        {/* Preset Prompt Quick Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            推荐快速提问 (点击直接发起 AI 问答)：
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              "为什么高频高斯噪声对前向/后向差分求导是灾难性的？",
              "如何在惯性测量单元(IMU)加速度二次积分中应用零速更新(ZUPT)消除漂移？",
              "Savitzky-Golay 卷积平滑滤波与中心差分求导的配合数学原理是什么？",
              "梯形积分 (Trapezoidal) 与 Simpson 积分在离散采样点上的截断误差对比",
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuestion(preset)}
                disabled={chatLoading}
                className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-200/80 hover:border-indigo-200 text-xs transition-all active:scale-95 disabled:opacity-50 text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Container */}
        <div className="h-80 overflow-y-auto bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4 shadow-inner">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 space-y-1.5 leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white font-medium rounded-tr-xs"
                    : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[10px] opacity-80">
                  <span className="font-bold flex items-center gap-1">
                    {msg.sender === "user" ? "我 (User)" : `AI 诊断助手 (${msg.model || selectedModel})`}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800 text-indigo-300 p-3.5 rounded-2xl rounded-tl-xs border border-slate-700 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>[{selectedModel}] 正在推演数理解答，请稍候...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Question Input Box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
            placeholder={
              apiKey
                ? `输入您关于数值微积分、高频噪声放大或积分漂移的疑问 (当前模型: ${selectedModel})...`
                : "请先点击右上角齿轮设置 API-Key 后方可发起对话..."
            }
            disabled={chatLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />

          <button
            onClick={() => handleSendQuestion()}
            disabled={chatLoading || !inputQuestion.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送提问</span>
          </button>
        </div>
      </div>

      {/* LLM Settings Configuration Modal (大模型与 API-Key 设置弹窗) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-800 relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Settings className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      大模型与 API-Key 参数配置
                    </h3>
                    <p className="text-xs text-slate-500">
                      项目支持部署至 GitHub Pages / Netlify，所有 LLM 调用完全由前端独立完成
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {apiKeyNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{apiKeyNotice}</span>
                </div>
              )}

              {/* Form Option 1: Select LLM Model */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  1. 选择预设大模型 (LLM Model Selection)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Gemini 2.5 Flash */}
                  <div
                    onClick={() => setTempModel("gemini-2.5-flash")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      tempModel === "gemini-2.5-flash"
                        ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        gemini-2.5-flash
                      </span>
                      {tempModel === "gemini-2.5-flash" && (
                        <Check className="w-4 h-4 text-indigo-600 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Google 官方数理大模型，极速多模态分析与微积分推演
                    </p>
                  </div>

                  {/* Option B: DeepSeek V4 Pro */}
                  <div
                    onClick={() => setTempModel("deepseek-v4-pro")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      tempModel === "deepseek-v4-pro"
                        ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-purple-600" />
                        deepseek-v4-pro
                      </span>
                      {tempModel === "deepseek-v4-pro" && (
                        <Check className="w-4 h-4 text-purple-600 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      DeepSeek 深度代码与算法推理模型，专精 DSP 与数值漂移
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Option 2: Manual API-Key Input */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" />
                  2. 手工输入 API-Key (Manual API Key Input)
                </label>

                <div className="relative">
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={
                      tempModel === "gemini-2.5-flash"
                        ? "请输入您的 Gemini API-Key (例如: AIzaSy...)"
                        : "请输入您的 DeepSeek API-Key (例如: sk-...)"
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-slate-700">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    如何获取免费 API-Key？
                  </div>
                  {tempModel === "gemini-2.5-flash" ? (
                    <p>
                      访问 Google AI Studio (
                      <a
                        href="https://aistudio.google.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline font-semibold"
                      >
                        aistudio.google.com
                      </a>
                      ) 免费创建 Gemini API Key 并粘贴在上方。
                    </p>
                  ) : (
                    <p>
                      访问 DeepSeek 开放平台 (
                      <a
                        href="https://platform.deepseek.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 underline font-semibold"
                      >
                        platform.deepseek.com
                      </a>
                      ) 获取 API Key 并粘贴在上方。
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  确认大模型与 API-Key 配置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
