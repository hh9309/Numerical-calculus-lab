import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from "recharts";
import { MathFormula } from "../MathFormula";
import { AlgorithmTooltip } from "../AlgorithmTooltip";
import { AnimationPlayerControls } from "../AnimationPlayerControls";
import { DataPoint, IntMethod, SliceBounds } from "../../types";
import { computeRMSE } from "../../utils/calculusMath";
import { BarChart3, TrendingDown, Layers, Sparkles, AlertCircle, Info } from "lucide-react";

interface IntegrationSandboxModuleProps {
  dataPoints: DataPoint[];
  sliceBounds: SliceBounds;
  intMethod: IntMethod;
  setIntMethod: (method: IntMethod) => void;
}

export const IntegrationSandboxModule: React.FC<IntegrationSandboxModuleProps> = ({
  dataPoints,
  sliceBounds,
  intMethod,
  setIntMethod,
}) => {
  const [dcOffset, setDcOffset] = useState(0.05); // Constant bias producing integral drift
  const [hoverIndex, setHoverIndex] = useState<number>(sliceBounds.startIdx);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Auto-play animation timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setHoverIndex((prev) => {
          if (prev >= sliceBounds.endIdx) {
            return sliceBounds.startIdx;
          }
          return prev + 1;
        });
      }, 180 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sliceBounds.startIdx, sliceBounds.endIdx, playbackSpeed]);

  // Filter sliced data
  const slicedData = dataPoints.filter(
    (p) => p.index >= sliceBounds.startIdx && p.index <= sliceBounds.endIdx
  );

  // Compute animated sweep data: only fill up to hoverIndex when scanning
  const animatedFillData = slicedData.map((p) => ({
    ...p,
    animatedArea: p.index <= hoverIndex ? p.yRaw : null,
  }));

  // Compute artificial drift data
  const driftedData = slicedData.map((p, idx) => {
    const dx = idx > 0 ? p.x - slicedData[idx - 1].x : 0.1;
    const accumulatedBias = dcOffset * (p.x - slicedData[0].x);
    return {
      ...p,
      intDrifted: (p.intSelected || 0) + accumulatedBias,
    };
  });

  const trapRmse = computeRMSE(slicedData, "intTrapezoid" as any, "intExact");
  const simpsonRmse = computeRMSE(slicedData, "intSimpson" as any, "intExact");
  const cumsumRmse = computeRMSE(slicedData, "intCumsum" as any, "intExact");

  const activePoint = dataPoints[hoverIndex] || slicedData[0] || dataPoints[0];

  return (
    <div className="space-y-6">
      {/* Overview & Algorithm Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              数值积分算法比较 (Numerical Integration Sandbox)
            </h3>
            <p className="text-xs text-slate-500">
              分析矩形法、梯形法与辛普森法在离散数据积分中的求和精度与曲边梯形逼近
            </p>
          </div>
        </div>

        {/* Integration Methods Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cumsum / Left Rect */}
          <AlgorithmTooltip algorithmKey="cumsum" position="top">
            <div
              onClick={() => setIntMethod("cumsum")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                intMethod === "cumsum" || intMethod === "left_rect"
                  ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  矩形法 / 累积和 (Cumsum)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  阶数 O(dx)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                I(x_k) = ∑ y_i · dx
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-indigo-700">{cumsumRmse.toFixed(4)}</span>
              </div>
            </div>
          </AlgorithmTooltip>

          {/* Trapezoidal Rule */}
          <AlgorithmTooltip algorithmKey="trapezoidal" position="top">
            <div
              onClick={() => setIntMethod("trapezoidal")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                intMethod === "trapezoidal"
                  ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  梯形法 (Trapezoidal Rule)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  常用: O(dx²)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                I(x) = ∑ (y_i + y_i+1)/2 · dx
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-emerald-700">{trapRmse.toFixed(4)}</span>
              </div>
            </div>
          </AlgorithmTooltip>

          {/* Simpson's 1/3 Rule */}
          <AlgorithmTooltip algorithmKey="simpson" position="top">
            <div
              onClick={() => setIntMethod("simpson")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                intMethod === "simpson"
                  ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  辛普森法 (Simpson's 1/3 Rule)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  最高精度: O(dx⁴)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                dx/3 · (y0 + 4y1 + y2)
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-purple-700">{simpsonRmse.toFixed(4)}</span>
              </div>
            </div>
          </AlgorithmTooltip>
        </div>
      </div>

      {/* Animation Sweep Controller */}
      <AnimationPlayerControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => {
          setIsPlaying(false);
          setHoverIndex(sliceBounds.startIdx);
        }}
        onStepForward={() => setHoverIndex((prev) => Math.min(sliceBounds.endIdx, prev + 1))}
        onStepBack={() => setHoverIndex((prev) => Math.max(sliceBounds.startIdx, prev - 1))}
        currentIndex={hoverIndex - sliceBounds.startIdx}
        maxIndex={sliceBounds.endIdx - sliceBounds.startIdx}
        onIndexChange={(val) => setHoverIndex(sliceBounds.startIdx + val)}
        speed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        label="积分扫过填充动画"
        currentValueLabel={`x = ${activePoint ? activePoint.x.toFixed(2) : 0}`}
      />

      {/* Area Slicing Filled Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            定积分曲边梯形动态面积填充 (Animated Integral Area Filling)
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              当前累积积分: {(activePoint?.intSelected || 0).toFixed(4)}
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={animatedFillData}
              onMouseMove={(state) => {
                if (!isPlaying && state && state.activeTooltipIndex !== undefined) {
                  setHoverIndex(sliceBounds.startIdx + state.activeTooltipIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="x" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DataPoint;
                    return (
                      <div className="bg-slate-900/90 text-white p-3 rounded-xl text-xs space-y-1 font-mono border border-slate-800">
                        <div className="text-emerald-400 font-bold border-b border-slate-700 pb-1">
                          x = {data.x.toFixed(3)}
                        </div>
                        <div>信号值 y_i: <span className="text-slate-200">{data.yRaw.toFixed(4)}</span></div>
                        <div>当前累积积分: <span className="text-emerald-300 font-bold">{(data.intSelected || 0).toFixed(4)}</span></div>
                        <div>解析理论积分: <span className="text-sky-300">{(data.intExact || 0).toFixed(4)}</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="yRaw" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="被积原函数 f(x)" />
              <Area type="monotone" dataKey="animatedArea" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGradient)" name="已扫过积分填充面积" />
              {activePoint && (
                <ReferenceDot x={activePoint.x} y={activePoint.yRaw} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Integral Baseline Drift Hazard Section */}
      <div className="bg-amber-50/90 p-5 rounded-2xl border border-amber-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            数值积分的致命陷阱：基线直流偏移与低频漂移 (Baseline Integral Drift)
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-amber-800 font-medium">基线直流偏置 b:</label>
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.01}
              value={dcOffset}
              onChange={(e) => setDcOffset(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <span className="font-mono text-amber-900 font-bold w-12">{dcOffset.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed">
          与求导会放大高频噪声相反，<span className="font-bold">数值积分具有低通滤波特性</span>（能平滑高频随机噪声），但如果被积信号存在微小零点偏置 $b$（例如传感器零点漂移或未矫正的重力偏置），积分计算将对偏置进行长程累加：
        </p>
        <MathFormula latex="I_{\text{drift}}(t) = \int_0^t [f(\tau) + b] d\tau = \int_0^t f(\tau)d\tau + \mathbf{b \cdot t}" block />
        <p className="text-xs text-amber-900 font-medium">
          观察下方曲线：基线偏置 $b = {dcOffset.toFixed(2)}$ 导致积分结果随时间 $t$ 呈线性斜坡向外漂移离谱！解决方法：在积分前进行高通滤波/基线扣除（High-pass Filter / Zero-velocity update）。
        </p>

        {/* Drift Chart */}
        <div className="h-60 w-full bg-white p-3 rounded-xl border border-amber-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="x" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="intExact" stroke="#0284c7" strokeWidth={2} dot={false} name="真实无漂移积分 ∫f(x)dx" />
              <Line type="monotone" dataKey="intDrifted" stroke="#d97706" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name="含基线偏置累积漂移积分 I(t)+b·t" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
