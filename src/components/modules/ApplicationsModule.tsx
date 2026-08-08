import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { MathFormula } from "../MathFormula";
import { AnimationPlayerControls } from "../AnimationPlayerControls";
import {
  generate2DSobelGrid,
  computeSensorDoubleIntegration,
  computeROCCurve,
  computeFinancialData,
  computeIrisDecisionManifold,
  computeDataManifoldTopology,
  IrisFeature,
} from "../../utils/calculusMath";
import { IrisD3ManifoldCanvas } from "../IrisD3ManifoldCanvas";
import {
  Briefcase,
  Image,
  Activity,
  Award,
  TrendingUp,
  Flower2,
  Network,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Layers,
  Compass,
  BarChart3,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";

type AppSubTab = "sobel" | "sensor" | "roc" | "finance" | "iris" | "manifold";

export const ApplicationsModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AppSubTab>("sobel");

  // Sobel State
  const [sobelPattern, setSobelPattern] = useState<"box" | "circle" | "diagonal" | "checkerboard">("box");
  const [sobelThreshold, setSobelThreshold] = useState(100);

  // Sensor State
  const [sensorBias, setSensorBias] = useState(0.08);
  const [enableZupt, setEnableZupt] = useState(true);
  const [sensorHoverIndex, setSensorHoverIndex] = useState<number>(0);
  const [isSensorPlaying, setIsSensorPlaying] = useState<boolean>(false);
  const [sensorSpeed, setSensorSpeed] = useState<number>(1);

  // Auto-play timer for IMU sensor integration sweep
  useEffect(() => {
    let interval: any = null;
    if (isSensorPlaying) {
      interval = setInterval(() => {
        setSensorHoverIndex((prev) => {
          if (prev >= 99) return 0;
          return prev + 1;
        });
      }, 120 / sensorSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSensorPlaying, sensorSpeed]);

  // ROC State
  const [classifierQuality, setClassifierQuality] = useState(0.85);

  // Financial State
  const [stockDrift, setStockDrift] = useState(0.02);

  // Iris Decision Manifold State
  const [irisNoise, setIrisNoise] = useState<number>(0.05);
  const [irisBandwidth, setIrisBandwidth] = useState<number>(0.5);
  const [irisCutoff, setIrisCutoff] = useState<number>(0.5);
  const [irisXFeature, setIrisXFeature] = useState<IrisFeature>("petalLength");
  const [irisYFeature, setIrisYFeature] = useState<IrisFeature>("petalWidth");

  // Data Manifold Explorer State
  const [manifoldUnfoldProgress, setManifoldUnfoldProgress] = useState<number>(0);
  const [manifoldKNN, setManifoldKNN] = useState<number>(5);
  const [manifoldNoise, setManifoldNoise] = useState<number>(0.02);
  const [isManifoldPlaying, setIsManifoldPlaying] = useState<boolean>(false);
  const [manifoldSpeed, setManifoldSpeed] = useState<number>(1);

  // Auto-play timer for Data Manifold Topology unfolding
  useEffect(() => {
    let interval: any = null;
    if (isManifoldPlaying) {
      interval = setInterval(() => {
        setManifoldUnfoldProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 70 / manifoldSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isManifoldPlaying, manifoldSpeed]);

  // Computations
  const { grid, magnitude } = generate2DSobelGrid(sobelPattern, 10);

  const sensorRawPoints = Array.from({ length: 100 }, (_, i) => {
    const t = i * 0.1;
    const a = Math.sin(t) * Math.exp(-0.15 * t) + 0.1;
    return { t, a };
  });
  const sensorResult = computeSensorDoubleIntegration(sensorRawPoints, sensorBias, enableZupt);

  const { points: rocPoints, auc } = computeROCCurve(classifierQuality);

  const stockPrices = Array.from({ length: 80 }, (_, i) => {
    const t = i;
    const price = 100 + 12 * Math.sin(0.15 * t) + 1.2 * t + Math.sin(0.8 * t) * 2;
    return { t, price };
  });
  const financialResult = computeFinancialData(stockPrices);

  const irisResult = computeIrisDecisionManifold(irisNoise, irisBandwidth, irisCutoff, irisXFeature, irisYFeature);
  const manifoldResult = computeDataManifoldTopology(manifoldUnfoldProgress, manifoldKNN, manifoldNoise);

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">数据科学经典应用案例库 (Real-World Applications)</h3>
            <p className="text-xs text-slate-500">离散微积分在计算机视觉、传感器惯导、机器学习分类流形与拓扑展开中的落地方案</p>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("sobel")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "sobel"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            1. 图像 Sobel 梯度
          </button>

          <button
            onClick={() => setActiveSubTab("sensor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "sensor"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            2. 传感器二次积分
          </button>

          <button
            onClick={() => setActiveSubTab("roc")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "roc"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            3. ML ROC/AUC 积分
          </button>

          <button
            onClick={() => setActiveSubTab("finance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "finance"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            4. 金融对数收益率
          </button>

          <button
            onClick={() => setActiveSubTab("iris")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "iris"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            5. 鸢尾花分类决策流形
          </button>

          <button
            onClick={() => setActiveSubTab("manifold")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === "manifold"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            6. 流形邻域拓扑展开
          </button>
        </div>
      </div>

      {/* Sub Tab 1: Image Sobel 2D Discrete Gradient */}
      {activeSubTab === "sobel" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-600" />
                图像边缘检测：二维离散梯度与 Sobel 算子
              </h4>
              <p className="text-xs text-slate-500">
                图像在像素点 (x, y) 的灰度值变化率即二维离散偏导数。Sobel 卷积算子通过加权差分提取图像边缘
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="text-slate-600 font-medium">图案模式:</label>
              <select
                value={sobelPattern}
                onChange={(e) => setSobelPattern(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs"
              >
                <option value="box">矩形边缘 (Box)</option>
                <option value="circle">圆形边界 (Circle)</option>
                <option value="diagonal">对角线 (Diagonal)</option>
                <option value="checkerboard">棋盘格 (Checkerboard)</option>
              </select>

              <label className="text-slate-600 font-medium">边缘阈值:</label>
              <input
                type="range"
                min={20}
                max={200}
                value={sobelThreshold}
                onChange={(e) => setSobelThreshold(parseInt(e.target.value))}
                className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="font-mono text-indigo-700 font-bold">{sobelThreshold}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-700">1. 原始像素矩阵 I(x,y)</span>
              <div className="grid grid-cols-10 gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                {grid.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="w-full aspect-square rounded-xs transition-all"
                      style={{ backgroundColor: `rgb(${val}, ${val}, ${val})` }}
                      title={`I(${r},${c}) = ${val}`}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-700">2. 二维梯度幅值 |Grad I| = √(Gx² + Gy²)</span>
              <div className="grid grid-cols-10 gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                {magnitude.map((row, r) =>
                  row.map((val, c) => {
                    const norm = Math.min(255, Math.round(val));
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="w-full aspect-square rounded-xs transition-all"
                        style={{ backgroundColor: `rgb(${norm}, ${Math.round(norm * 0.4)}, ${255 - norm})` }}
                        title={`|Grad|(${r},${c}) = ${val.toFixed(1)}`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-slate-700">3. 阈值分割提取离散边缘</span>
              <div className="grid grid-cols-10 gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                {magnitude.map((row, r) =>
                  row.map((val, c) => {
                    const isEdge = val >= sobelThreshold;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-full aspect-square rounded-xs transition-all ${
                          isEdge ? "bg-emerald-400 shadow-xs shadow-emerald-400/50" : "bg-slate-950"
                        }`}
                        title={`Edge(${r},${c}) = ${isEdge ? "YES" : "NO"}`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Sensor Acceleration Double Integration */}
      {activeSubTab === "sensor" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                传感器惯导应用：加速度二次积分推导速度与位移 (a(t) → v(t) → x(t))
              </h4>
              <p className="text-xs text-slate-500">
                IMU 加速度数据 a(t) 一次积分得速度 v(t) = ∫a(t)dt，二次积分得位移 x(t) = ∫v(t)dt
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="text-slate-600 font-medium">加速度零偏 a_bias:</label>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={sensorBias}
                onChange={(e) => setSensorBias(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="font-mono text-indigo-700 font-bold">{sensorBias.toFixed(2)}</span>

              <button
                onClick={() => setEnableZupt(!enableZupt)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  enableZupt
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {enableZupt ? "✓ 零速修正 ZUPT 已开启" : "开启 ZUPT 漂移抑制"}
              </button>
            </div>
          </div>

          <AnimationPlayerControls
            isPlaying={isSensorPlaying}
            onTogglePlay={() => setIsSensorPlaying(!isSensorPlaying)}
            onReset={() => {
              setIsSensorPlaying(false);
              setSensorHoverIndex(0);
            }}
            onStepForward={() => setSensorHoverIndex((prev) => Math.min(sensorResult.length - 1, prev + 1))}
            onStepBack={() => setSensorHoverIndex((prev) => Math.max(0, prev - 1))}
            currentIndex={sensorHoverIndex}
            maxIndex={sensorResult.length - 1}
            onIndexChange={setSensorHoverIndex}
            speed={sensorSpeed}
            onSpeedChange={setSensorSpeed}
            label="IMU 二次积分动态推演"
            currentValueLabel={`t = ${sensorResult[sensorHoverIndex]?.t.toFixed(1)}s`}
          />

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sensorResult}
                onMouseMove={(state) => {
                  if (!isSensorPlaying && state && state.activeTooltipIndex !== undefined) {
                    setSensorHoverIndex(state.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="t" tickFormatter={(val) => Number(val).toFixed(1)} stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="aCorrected" stroke="#82ca9d" strokeWidth={1.5} dot={false} name="矫正加速度 a(t)" />
                <Line type="monotone" dataKey="v" stroke="#8884d8" strokeWidth={2} dot={false} name="一次积分速度 v(t)" />
                <Line type="monotone" dataKey="x" stroke="#ff7300" strokeWidth={2.5} dot={false} name="二次积分位移 x(t)" />

                {sensorResult[sensorHoverIndex] && (
                  <>
                    <ReferenceDot t={sensorResult[sensorHoverIndex].t} y={sensorResult[sensorHoverIndex].aCorrected} r={5} fill="#82ca9d" stroke="#ffffff" />
                    <ReferenceDot t={sensorResult[sensorHoverIndex].t} y={sensorResult[sensorHoverIndex].v} r={5} fill="#8884d8" stroke="#ffffff" />
                    <ReferenceDot t={sensorResult[sensorHoverIndex].t} y={sensorResult[sensorHoverIndex].x} r={7} fill="#ff7300" stroke="#ffffff" strokeWidth={2} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Machine Learning ROC / AUC Trapezoidal Integration */}
      {activeSubTab === "roc" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                机器学习模型评估：ROC 曲线下面积 AUC 梯形积分
              </h4>
              <p className="text-xs text-slate-500">
                利用梯形数值积分 AUC = ∑ (TPR_i + TPR_i+1)/2 · ΔFPR 评估二分类模型性能
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="text-slate-600 font-medium">分类器质量指标:</label>
              <input
                type="range"
                min={0.5}
                max={0.98}
                step={0.01}
                value={classifierQuality}
                onChange={(e) => setClassifierQuality(parseFloat(e.target.value))}
                className="w-28 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                AUC = {auc.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rocPoints}>
                <defs>
                  <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fpr" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} name="假阳性率 FPR" />
                <YAxis stroke="#64748b" fontSize={11} name="真阳性率 TPR" domain={[0, 1]} />
                <Tooltip />
                <Area type="monotone" dataKey="tpr" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#rocGradient)" name="ROC 曲线 (TPR vs FPR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub Tab 4: Financial Stock Log Return & Volatility */}
      {activeSubTab === "finance" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                金融工程：资产价格对数收益率 ln(P_t / P_t-1) 与累计收益率
              </h4>
              <p className="text-xs text-slate-500">
                对数收益率相当于价格曲线的离散导数变化率，其滑动标准差衡量市场波动率 (Volatility)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialResult}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="t" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="price" stroke="#0284c7" strokeWidth={2} dot={false} name="股票价格 P(t)" />
                <Line type="monotone" dataKey="volatility" stroke="#e11d48" strokeWidth={1.5} dot={false} name="波动率 Volatility (差分变异)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub Tab 5: Iris Decision Manifold Lab */}
      {activeSubTab === "iris" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-indigo-600" />
                鸢尾花泛化实验室：分类决策流形 (Iris Decision Manifold Lab)
              </h4>
              <p className="text-xs text-slate-500">
                通过 RBF 核函数构建软边界概率流形，分析分类概率偏导数 ∇P(x,y) 与决策转折点 (Inflection Points)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-medium">测量噪声 σ:</label>
                <input
                  type="range"
                  min={0.0}
                  max={0.3}
                  step={0.02}
                  value={irisNoise}
                  onChange={(e) => setIrisNoise(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-mono text-indigo-700 font-bold">{irisNoise.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-medium">核平滑带宽 τ:</label>
                <input
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  value={irisBandwidth}
                  onChange={(e) => setIrisBandwidth(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-mono text-indigo-700 font-bold">{irisBandwidth.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">决策流形分类准确率</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{irisResult.accuracy}%</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-500 opacity-80" />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">最大决策概率梯度 max |∇P|</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{irisResult.maxGradient}</span>
              </div>
              <Zap className="w-5 h-5 text-emerald-500 opacity-80" />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">平均软分类 Margin</span>
                <span className="font-mono font-bold text-purple-700 text-sm">{irisResult.meanMargin}</span>
              </div>
              <Sliders className="w-5 h-5 text-purple-500 opacity-80" />
            </div>
          </div>

          {/* 2 Visual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: D3.js Topological Manifold Canvas with Dynamic Transitions */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <IrisD3ManifoldCanvas
                points={irisResult.points}
                grid={irisResult.grid}
                xMin={irisResult.xMin}
                xMax={irisResult.xMax}
                yMin={irisResult.yMin}
                yMax={irisResult.yMax}
                xFeature={irisXFeature}
                yFeature={irisYFeature}
                onChangeFeaturePair={(xFeat, yFeat) => {
                  setIrisXFeature(xFeat);
                  setIrisYFeature(yFeat);
                }}
              />
            </div>

            {/* Column 2: 1D Cross-Section Slice along Petal Length */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                2. 决策边界切片 (花瓣宽度 y = 1.3cm 处的概率导数)
              </h5>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={irisResult.slice}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="x" stroke="#64748b" fontSize={11} name="花瓣长度 x (cm)" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="pVersicolor" stroke="#10b981" strokeWidth={2} dot={false} name="P(Versicolor)" />
                    <Line type="monotone" dataKey="pVirginica" stroke="#a855f7" strokeWidth={2} dot={false} name="P(Virginica)" />
                    <Line type="monotone" dataKey="dp_dx" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="一阶导 dP/dx (边界陡峭度)" />
                    <Line type="monotone" dataKey="d2p_dx2" stroke="#f43f5e" strokeWidth={1} strokeDasharray="2 2" dot={false} name="二阶导 d²P/dx² (拐点过零)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                一阶导数最高峰代表决策最敏感区域，二阶导数过零点 $d^2P/dx^2 = 0$ 精确刻画了 Softmax 决策拐点 (Inflection Point)。
              </p>
            </div>
          </div>

          {/* Math Theory Card */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2 text-xs text-slate-700">
            <h5 className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              分类决策流形微分学原理
            </h5>
            <MathFormula
              latex="P(C_k \mid \mathbf{x}) = \frac{\exp(-\|\mathbf{x} - \boldsymbol{\mu}_k\|^2 / 2\tau^2)}{\sum_j \exp(-\|\mathbf{x} - \boldsymbol{\mu}_j\|^2 / 2\tau^2)}, \quad \nabla P(C_k \mid \mathbf{x}) = \left( \frac{\partial P}{\partial x}, \frac{\partial P}{\partial y} \right)"
              block
            />
            <p className="text-slate-600 leading-relaxed text-[11px]">
              核平滑带宽 $\tau$ 决定了决策边界的粘滞度与微分连续性。带宽越小，决策边界越陡峭（$\nabla P$ 峰值越高），容易导致过拟合；带宽较大时边界变平缓，提供更好的泛化边距 (Generalization Margin)。
            </p>
          </div>
        </div>
      )}

      {/* Sub Tab 6: Data Manifold Topology Unfolding Explorer */}
      {activeSubTab === "manifold" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-600" />
                数据流形邻域拓扑展开过程 (Data Manifold Explorer)
              </h4>
              <p className="text-xs text-slate-500">
                三维 Swiss Roll 弯曲流形在离散微分几何下的 $k$-NN 邻域图与测地线 (Geodesic) 拓扑展开等距映射
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-medium">k-NN 邻域半径:</label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={manifoldKNN}
                  onChange={(e) => setManifoldKNN(parseInt(e.target.value))}
                  className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-mono text-indigo-700 font-bold">k={manifoldKNN}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-medium">流形噪声 σ:</label>
                <input
                  type="range"
                  min={0.0}
                  max={0.1}
                  step={0.01}
                  value={manifoldNoise}
                  onChange={(e) => setManifoldNoise(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-mono text-indigo-700 font-bold">{manifoldNoise.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Animation Bar */}
          <AnimationPlayerControls
            isPlaying={isManifoldPlaying}
            onTogglePlay={() => setIsManifoldPlaying(!isManifoldPlaying)}
            onReset={() => {
              setIsManifoldPlaying(false);
              setManifoldUnfoldProgress(0);
            }}
            onStepForward={() => setManifoldUnfoldProgress((prev) => Math.min(100, prev + 5))}
            onStepBack={() => setManifoldUnfoldProgress((prev) => Math.max(0, prev - 5))}
            currentIndex={manifoldUnfoldProgress}
            maxIndex={100}
            onIndexChange={setManifoldUnfoldProgress}
            speed={manifoldSpeed}
            onSpeedChange={setManifoldSpeed}
            label="拓扑展开流形演化进度"
            currentValueLabel={`${manifoldUnfoldProgress}% ${manifoldUnfoldProgress === 100 ? "(完全展开切平面)" : "(三维流形弯曲)"}`}
          />

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">展开切平面进度 (Progress)</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{manifoldUnfoldProgress}%</span>
              </div>
              <Compass className="w-5 h-5 text-indigo-500 opacity-80" />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">平均局部曲率 κ(s)</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{manifoldResult.avgCurvature} rad/m</span>
              </div>
              <Layers className="w-5 h-5 text-emerald-500 opacity-80" />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">测地线/欧氏距离极值畸变比</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  {manifoldResult.distanceComparison[2]?.ratio || 1.8}x
                </span>
              </div>
              <Activity className="w-5 h-5 text-rose-500 opacity-80" />
            </div>
          </div>

          {/* 2 Visual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Topological Manifold Points & k-NN Graph Unfolding View */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-600" />
                1. 动态拓扑展开散点图与 k-NN 图相连边
              </h5>

              <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-3">
                <svg className="w-full h-full" viewBox="-12 -6 24 12">
                  {/* Grid background lines */}
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#334155" strokeWidth="0.05" strokeDasharray="0.2 0.2" />
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#334155" strokeWidth="0.05" strokeDasharray="0.2 0.2" />

                  {/* Draw k-NN Graph Connection Edges */}
                  {manifoldResult.points.map((pt) =>
                    pt.neighbors.map((nIdx) => {
                      const neighbor = manifoldResult.points[nIdx];
                      if (!neighbor) return null;
                      return (
                        <line
                          key={`${pt.id}-${neighbor.id}`}
                          x1={pt.xMorph * 1.6}
                          y1={pt.yMorph * 1.6}
                          x2={neighbor.xMorph * 1.6}
                          y2={neighbor.yMorph * 1.6}
                          stroke="#6366f1"
                          strokeWidth="0.06"
                          strokeOpacity={0.35}
                        />
                      );
                    })
                  )}

                  {/* Draw Manifold Data Points */}
                  {manifoldResult.points.map((pt) => {
                    // Color hue based on intrinsic parameter s
                    const hue = Math.round(pt.s * 280);
                    return (
                      <g key={pt.id} className="transition-transform duration-200 hover:scale-150">
                        <circle
                          cx={pt.xMorph * 1.6}
                          cy={pt.yMorph * 1.6}
                          r={0.28}
                          fill={`hsl(${hue}, 85%, 60%)`}
                          stroke="#ffffff"
                          strokeWidth="0.05"
                        />
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute top-2 left-2 text-[10px] font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  Intrinsic Parameter s: [0 ➔ 1 Color Spectrum]
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                紫蓝色连线代表 $k$-NN 邻域拓扑关系。拉动进度条可观察数据在维持邻域结构的拓扑变换下由弯曲三维折叠展开为二维切平面。
              </p>
            </div>

            {/* Column 2: Geodesic Distance vs Euclidean Distance */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                2. 测地线距离 (Geodesic) vs 3D 欧氏距离 (Euclidean) 对比
              </h5>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manifoldResult.distanceComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="pointPair" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={11} name="距离" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="geodesicDist" fill="#6366f1" name="测地线距离 (沿流形)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="euclideanDist" fill="#94a3b8" name="三维欧氏距离 (直线穿透)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                传统欧氏距离穿透三维空间导致弯曲流形上的远距离点被误判为“近邻”；离散微分测地线距离沿流形积分，准确保留了高维流形的真实内在拓扑度量。
              </p>
            </div>
          </div>

          {/* Topological Theory Card */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2 text-xs text-slate-700">
            <h5 className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              离散微分几何与度量张量展开原理
            </h5>
            <MathFormula
              latex="ds^2 = g_{ij} du^i du^j, \quad d_G(\mathbf{p}_a, \mathbf{p}_b) = \min_{\gamma} \int_{a}^{b} \sqrt{g_{ij} \dot{\gamma}^i \dot{\gamma}^j} dt \approx \sum_{k \in \text{path}} \|\mathbf{x}_k - \mathbf{x}_{k+1}\|"
              block
            />
            <p className="text-slate-600 leading-relaxed text-[11px]">
              流形学习 (Isomap / LLE) 的核心思想是通过局部邻域图上的最短路径算法（如 Dijkstra）近似流形上的测地线积分 $d_G$，从而将非线性高维流形通过等距投影 (Isometric Mapping) 展开至低维欧氏空间。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
