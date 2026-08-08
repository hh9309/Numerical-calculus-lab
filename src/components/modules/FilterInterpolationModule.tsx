import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
  ReferenceArea,
} from "recharts";
import { MathFormula } from "../MathFormula";
import { AlgorithmTooltip } from "../AlgorithmTooltip";
import { AnimationPlayerControls } from "../AnimationPlayerControls";
import { DataPoint, FilterMethod, SliceBounds } from "../../types";
import { computeRMSE } from "../../utils/calculusMath";
import { Filter, CheckCircle2, Sliders, ArrowRight, Sparkles, Info, Activity } from "lucide-react";
import { motion } from "motion/react";

interface FilterInterpolationModuleProps {
  dataPoints: DataPoint[];
  sliceBounds: SliceBounds;
  filterMethod: FilterMethod;
  setFilterMethod: (method: FilterMethod) => void;
  noiseLevel: number;
}

export const FilterInterpolationModule: React.FC<FilterInterpolationModuleProps> = ({
  dataPoints,
  sliceBounds,
  filterMethod,
  setFilterMethod,
  noiseLevel,
}) => {
  const [windowSize, setWindowSize] = useState(5);
  const [hoverIndex, setHoverIndex] = useState<number>(sliceBounds.startIdx);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Auto-play animation timer for sliding filter window
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

  // Raw noise derivative RMSE vs Filtered derivative RMSE
  const rawDerivativeRmse = computeRMSE(
    slicedData.map((p) => ({
      ...p,
      dyRawNoisy: (p.dyForward || 0) + (p.yNoisy - p.yRaw) * 2,
    })),
    "dyRawNoisy" as any,
    "dyExact"
  );

  const filteredDerivativeRmse = computeRMSE(slicedData, "dySelected" as any, "dyExact");

  const activePoint = dataPoints[hoverIndex] || slicedData[0] || dataPoints[0];
  const halfWin = Math.floor(windowSize / 2);

  const winStartPoint = dataPoints[Math.max(0, hoverIndex - halfWin)] || activePoint;
  const winEndPoint = dataPoints[Math.min(dataPoints.length - 1, hoverIndex + halfWin)] || activePoint;

  return (
    <div className="space-y-6">
      {/* Pipeline Explanation Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            数据微积分黄金准则：先平滑滤波，再求导 (Filtering Optimization Pipeline)
          </div>
          <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full">
            Noise Reduction Factor: {(rawDerivativeRmse / Math.max(0.001, filteredDerivativeRmse)).toFixed(1)}x
          </span>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-slate-200">输入含噪数据 y(x)</div>
              <div className="text-slate-400 text-[11px]">高频高斯噪声干扰 (σ = {noiseLevel.toFixed(2)})</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-indigo-500/40 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-indigo-300">滤波与插值平滑 y_fit(x)</div>
              <div className="text-slate-400 text-[11px]">Savitzky-Golay / Moving Average</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-emerald-500/40 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-emerald-300">高质量离散求导 dy_fit/dx</div>
              <div className="text-slate-400 text-[11px]">大幅削减导数振荡暴增现象</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              平滑滤波算法选择 (Filter & Interpolation Methods)
            </h3>
            <p className="text-xs text-slate-500">
              选择适合信号特性的时域卷积与多项式插值滤波器
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="text-slate-600 font-medium">滤波窗口大小 W:</label>
            <input
              type="range"
              min={3}
              max={15}
              step={2}
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value))}
              className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="font-mono text-indigo-700 font-bold w-6">{windowSize}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* None */}
          <div
            onClick={() => setFilterMethod("none")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMethod === "none"
                ? "bg-slate-200/80 border-slate-400 ring-2 ring-slate-400/20"
                : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
            }`}
          >
            <div className="font-bold text-slate-800 text-xs mb-1">无滤波 (Raw Noisy)</div>
            <p className="text-[11px] text-slate-500">直接对原始含噪数据求导，保留高频成分。</p>
          </div>

          {/* Moving Average */}
          <AlgorithmTooltip algorithmKey="moving_avg" position="top">
            <div
              onClick={() => setFilterMethod("moving_average")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterMethod === "moving_average"
                  ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  移动平均 (Moving Avg)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">滑动窗口均值平滑，简单高效但易模糊波峰。</p>
            </div>
          </AlgorithmTooltip>

          {/* Savitzky-Golay */}
          <AlgorithmTooltip algorithmKey="savgol" position="top">
            <div
              onClick={() => setFilterMethod("savitzky_golay")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                filterMethod === "savitzky_golay"
                  ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  Savitzky-Golay 滤波
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 transition-colors" />
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-1 rounded">推荐</span>
              </div>
              <p className="text-[11px] text-slate-500">局部多项式拟合，<span className="font-medium text-purple-700">完美保留峰值与波形高阶导数</span>。</p>
            </div>
          </AlgorithmTooltip>

          {/* Cubic Spline */}
          <div
            onClick={() => setFilterMethod("cubic_spline")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMethod === "cubic_spline"
                ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20"
                : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
            }`}
          >
            <div className="font-bold text-slate-800 text-xs mb-1">三次样条插值 (Cubic Spline)</div>
            <p className="text-[11px] text-slate-500">分段三次曲线拟合，重采样非均匀稀疏采样点。</p>
          </div>
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
        label="滑动窗口平滑动画"
        currentValueLabel={`窗口中心 x = ${activePoint ? activePoint.x.toFixed(2) : 0}`}
      />

      {/* Signal Comparison Chart (Before vs After Filter) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signal Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              1. 原始信号 vs 滤波降噪后信号 y_filtered
            </h4>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200">
              窗口覆盖 [{winStartPoint?.x.toFixed(2)}, {winEndPoint?.x.toFixed(2)}]
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={slicedData}
                onMouseMove={(state) => {
                  if (!isPlaying && state && state.activeTooltipIndex !== undefined) {
                    setHoverIndex(sliceBounds.startIdx + state.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                
                {/* Active Sliding Window Highlight Area */}
                {winStartPoint && winEndPoint && (
                  <ReferenceArea
                    x1={winStartPoint.x}
                    x2={winEndPoint.x}
                    {...({
                      fill: "#a5b4fc",
                      fillOpacity: 0.25,
                      stroke: "#6366f1",
                      strokeDasharray: "2 2"
                    } as any)}
                  />
                )}

                <Line type="monotone" dataKey="yNoisy" stroke="#f43f5e" strokeWidth={1} dot={{ r: 1.5 }} opacity={0.6} name="含噪原始数据 y_noisy" />
                <Line type="monotone" dataKey="yFiltered" stroke="#4f46e5" strokeWidth={2.5} dot={false} name={`滤波后数据 y_filtered (${filterMethod})`} />
                <Line type="monotone" dataKey="yRaw" stroke="#0284c7" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="真实无噪基准 y_raw" />

                {/* Window center point */}
                {activePoint && (
                  <ReferenceDot x={activePoint.x} y={activePoint.yFiltered || activePoint.yRaw} r={6} fill="#4f46e5" stroke="#ffffff" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Derivative Quality Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              2. 滤波后求导 Quality: dy_filtered/dx vs f'(x)
            </h4>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={slicedData}
                onMouseMove={(state) => {
                  if (!isPlaying && state && state.activeTooltipIndex !== undefined) {
                    setHoverIndex(sliceBounds.startIdx + state.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="dyExact" stroke="#0284c7" strokeWidth={2.5} dot={false} name="真实理论导数 f'(x)" />
                <Line type="monotone" dataKey="dySelected" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="平滑后离散导数 dy_filtered/dx" />

                {activePoint && (
                  <ReferenceDot x={activePoint.x} y={(activePoint as any).dySelected || activePoint.dyExact} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
