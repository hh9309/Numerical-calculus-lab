import React, { useState } from "react";
import { Info, HelpCircle, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { MathFormula } from "./MathFormula";

export interface AlgorithmInfo {
  id: string;
  name: string;
  shortFormula: string;
  latexFormula: string;
  accuracyOrder: string;
  algebraicAccuracy?: string;
  scenarios: string[];
  pros: string;
  cons: string;
  recommendation?: string;
}

export const ALGORITHM_DETAILS: Record<string, AlgorithmInfo> = {
  forward: {
    id: "forward",
    name: "前向差分法 (Forward Difference)",
    shortFormula: "f'(x_i) ≈ (y_{i+1} - y_i) / Δx",
    latexFormula: "f'(x_i) \\approx \\frac{y_{i+1} - y_i}{\\Delta x}",
    accuracyOrder: "O(Δx) 一阶精度",
    scenarios: [
      "实时/流式数据计算（无未来数据缓冲）",
      "前向欧拉法 (Forward Euler) 常微分方程求解",
      "结构简单且对时延不敏感的系统",
    ],
    pros: "仅依赖当前点与下一个未来点，无历史数据依赖，计算复杂度低。",
    cons: "仅一阶精度，存在单向相位偏移，对高频随机噪声极度敏感（噪声放大幅度 2σ/Δx）。",
    recommendation: "适合简单流式计算；若有后处理缓冲区，建议改用中心差分法。",
  },
  backward: {
    id: "backward",
    name: "后向差分法 (Backward Difference)",
    shortFormula: "f'(x_i) ≈ (y_i - y_{i-1}) / Δx",
    latexFormula: "f'(x_i) \\approx \\frac{y_i - y_{i-1}}{\\Delta x}",
    accuracyOrder: "O(Δx) 一阶精度",
    scenarios: [
      "实时因果控制系统（只掌握当前及历史采样点）",
      "隐式欧拉法 (Implicit Euler) 数值解法",
      "无预警时序突变检测",
    ],
    pros: "因果性好，仅依赖历史采样点 $y_{i-1}$，易于在单片机与 FPGA 中实时流水线实现。",
    cons: "一阶截断误差较大，且求导结果存在滞后效应，无法抵御高频高斯噪声。",
    recommendation: "适合在线因果监控；非实时分析时建议使用中心差分。",
  },
  central: {
    id: "central",
    name: "中心差分法 (Central Difference)",
    shortFormula: "f'(x_i) ≈ (y_{i+1} - y_{i-1}) / (2Δx)",
    latexFormula: "f'(x_i) \\approx \\frac{y_{i+1} - y_{i-1}}{2\\Delta x}",
    accuracyOrder: "O(Δx²) 二阶高精度",
    scenarios: [
      "离线信号处理与历史数据轨迹分析",
      "二维图像 Sobel/Laplacian 边缘梯度计算",
      "高质量数值求导分析",
    ],
    pros: "利用两侧对称采样点，奇数阶泰勒误差项相互抵消，精度比前向/后向提升一阶，且无相位偏置。",
    cons: "需要后一个采样点（非绝对因果）；在数组首尾边界点需退化为单侧差分。",
    recommendation: "★★ 离线数据求导最佳选择，结合 Savitzky-Golay 平滑滤波效果更佳。",
  },
  cumsum: {
    id: "cumsum",
    name: "矩形法 / 累积和 (Left Rectangle / Cumsum)",
    shortFormula: "I(x_k) = ∑ y_i · Δx",
    latexFormula: "I(x_k) = \\sum_{i=0}^{k-1} y_i \\Delta x",
    accuracyOrder: "O(Δx) 一阶精度",
    algebraicAccuracy: "代数精确度 0 阶 (仅对常数精确)",
    scenarios: [
      "高频信号能量阶梯粗估",
      "简单流式传感器数据累加",
      "教学展示离散黎曼和概念",
    ],
    pros: "计算极简，等价于单次循环累加（NumPy cumsum），占用内存少。",
    cons: "由于用左/右阶梯矩形近似曲边，在斜率较大区域存在明显的矩形填充欠估或过估误差。",
    recommendation: "适合粗略估算；对精度有要求时优先采用梯形法。",
  },
  trapezoidal: {
    id: "trapezoidal",
    name: "梯形求积法 (Trapezoidal Rule)",
    shortFormula: "I(x) = ∑ [(y_i + y_{i+1}) / 2] · Δx",
    latexFormula: "I(x) = \\sum_{i=0}^{k-1} \\frac{y_i + y_{i+1}}{2} \\Delta x",
    accuracyOrder: "O(Δx²) 二阶精度",
    algebraicAccuracy: "代数精确度 1 阶 (对一次多项式完全精确)",
    scenarios: [
      "IMU 惯性导航加速度/角速度二次积分",
      "机器学习 ROC 曲线下 AUC 面积计算",
      "工程通用离散数据定积分计算",
    ],
    pros: "用相邻两点割线构成的梯形替代矩形，兼顾二阶高精度与计算稳定性，非等距采样同样适用。",
    cons: "对高度弯曲的高阶多项式拟合能力有限，精度低于抛物线插值的辛普森法。",
    recommendation: "★★ 工程离散数据积分的首选标准算法（SciPy integrate.cumtrapz）。",
  },
  simpson: {
    id: "simpson",
    name: "辛普森 1/3 法则 (Simpson's 1/3 Rule)",
    shortFormula: "I = (Δx/3) · (y0 + 4y1 + 2y2 + ... + yn)",
    latexFormula: "I = \\frac{\\Delta x}{3} \\left( y_0 + 4y_1 + 2y_2 + \\dots + y_N \\right)",
    accuracyOrder: "O(Δx⁴) 四阶极高精度",
    algebraicAccuracy: "代数精确度 3 阶 (对三次及以下多项式完全精确)",
    scenarios: [
      "光滑连续函数的高精度定积分计算",
      "科学计算与物理学能量累积分析",
      "等距平滑采样信号的高阶求积",
    ],
    pros: "采用二次抛物线插值拟合局部曲线，精度比梯形法高出两个数量级（误差为 O(Δx⁴)）。",
    cons: "要求采样点数为奇数（小区间数为偶数）且等距；若数据含有随机噪声，可能造成抛物线过拟合。",
    recommendation: "★★ 光滑数据定积分的最佳算法；含噪数据建议先降噪后再使用。",
  },
  savgol: {
    id: "savgol",
    name: "Savitzky-Golay 卷积平滑滤波",
    shortFormula: "y*_i = ∑ c_m · y_{i+m}",
    latexFormula: "y^*_i = \\sum_{m=-M}^{M} c_m y_{i+m}",
    accuracyOrder: "局部多项式最小二乘拟合",
    scenarios: [
      "含噪信号求导前的预平滑处理",
      "光谱分析与传感器峰值特征保留",
      "高频高斯噪声抑制",
    ],
    pros: "在有效滤除高频噪声的同时，能最大程度保持信号的峰值高矮、波形宽度与局部微分特性。",
    cons: "需要设定合适的多项式阶数与窗口大小；窗口过大会导致边缘失真。",
    recommendation: "离散数据求导前推荐必备的预处理滤波器。",
  },
  moving_avg: {
    id: "moving_avg",
    name: "移动平均滤波 (Moving Average)",
    shortFormula: "y*_i = (1/W) · ∑ y_{i+m}",
    latexFormula: "y^*_i = \\frac{1}{W} \\sum_{m=-M}^{M} y_{i+m}",
    accuracyOrder: "一阶均值低通滤波",
    scenarios: [
      "金融股票价格平滑",
      "趋势线提取",
      "基线背景噪声粗滤",
    ],
    pros: "算法极简，计算开销小，消噪能力强。",
    cons: "容易削平信号的尖锐峰值，造成波形平缓失真。",
    recommendation: "适合平缓趋势分析，不适合陡峭峰值信号求导前处理。",
  },
};

interface AlgorithmTooltipProps {
  algorithmKey: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  inlineIconOnly?: boolean;
}

export const AlgorithmTooltip: React.FC<AlgorithmTooltipProps> = ({
  algorithmKey,
  children,
  position = "top",
  inlineIconOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = ALGORITHM_DETAILS[algorithmKey];

  if (!info) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <div className="w-72 md:w-80 p-4 bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-700/80 text-xs space-y-2.5 z-50 text-left font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-2 gap-2">
        <div>
          <div className="font-bold text-white text-sm flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
            {info.name}
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 font-mono text-[10px] border border-blue-800/50">
            精度阶数: {info.accuracyOrder}
          </span>
        </div>
      </div>

      {/* Formula */}
      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-center">
        <span className="text-[10px] text-slate-400 block mb-1">离散数学公式:</span>
        <div className="text-amber-300 font-bold overflow-x-auto py-0.5">
          <MathFormula latex={info.latexFormula} block />
        </div>
      </div>

      {info.algebraicAccuracy && (
        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{info.algebraicAccuracy}</span>
        </div>
      )}

      {/* Scenarios */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-300 block">典型适用场景:</span>
        <ul className="space-y-1 text-[11px] text-slate-300">
          {info.scenarios.map((sc, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
              <span>{sc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 gap-1.5 text-[10px] pt-1 border-t border-slate-800/80">
        <div>
          <span className="text-emerald-400 font-bold">优势: </span>
          <span className="text-slate-300">{info.pros}</span>
        </div>
        <div>
          <span className="text-rose-400 font-bold">局限: </span>
          <span className="text-slate-300">{info.cons}</span>
        </div>
      </div>

      {info.recommendation && (
        <div className="bg-amber-950/40 p-2 rounded text-[10px] text-amber-200 border border-amber-800/40 font-medium">
          💡 {info.recommendation}
        </div>
      )}
    </div>
  );

  if (inlineIconOnly) {
    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <button
          type="button"
          className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-blue-50 focus:outline-hidden"
          title="查看离散公式与适用场景"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {isOpen && (
          <div
            className={`absolute z-50 ${
              position === "top"
                ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "top-full mt-2 left-1/2 -translate-x-1/2"
                : position === "left"
                ? "right-full mr-2 top-1/2 -translate-y-1/2"
                : "left-full ml-2 top-1/2 -translate-y-1/2"
            }`}
          >
            {tooltipContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group w-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}

      {isOpen && (
        <div
          className={`absolute z-50 pointer-events-none ${
            position === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : position === "bottom"
              ? "top-full mt-2 left-1/2 -translate-x-1/2"
              : position === "left"
              ? "right-full mr-2 top-1/2 -translate-y-1/2"
              : "left-full ml-2 top-1/2 -translate-y-1/2"
          }`}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};
