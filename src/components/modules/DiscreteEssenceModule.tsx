import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { MathFormula } from "../MathFormula";
import { AnimationPlayerControls } from "../AnimationPlayerControls";
import { DataPoint, SliceBounds } from "../../types";
import { Activity, BookOpen, Layers, Sparkles, Play, RotateCcw } from "lucide-react";
import { motion } from "motion/react";

interface DiscreteEssenceModuleProps {
  dataPoints: DataPoint[];
  sliceBounds: SliceBounds;
  xMin: number;
  xMax: number;
  sampleCount: number;
}

export const DiscreteEssenceModule: React.FC<DiscreteEssenceModuleProps> = ({
  dataPoints,
  sliceBounds,
  xMin,
  xMax,
  sampleCount,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number>(Math.floor(sampleCount / 2));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Limit convergence simulation state (dx -> 0)
  const [deltaXStep, setDeltaXStep] = useState<number>(4);
  const [isDeltaXAnimating, setIsDeltaXAnimating] = useState<boolean>(false);

  const dx = (xMax - xMin) / (sampleCount - 1);

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
      }, 200 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sliceBounds.startIdx, sliceBounds.endIdx, playbackSpeed]);

  // DeltaX limit convergence auto animation
  useEffect(() => {
    let timer: any = null;
    if (isDeltaXAnimating) {
      timer = setInterval(() => {
        setDeltaXStep((prev) => {
          if (prev <= 1) {
            setIsDeltaXAnimating(false);
            return 1;
          }
          return prev - 1;
        });
      }, 800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDeltaXAnimating]);

  // Filter sliced data points
  const slicedData = dataPoints.filter(
    (p) => p.index >= sliceBounds.startIdx && p.index <= sliceBounds.endIdx
  );

  const safeHoverIdx = Math.max(0, Math.min(dataPoints.length - 1, hoverIndex));
  const selectedPoint = dataPoints[safeHoverIdx] || dataPoints[0];

  // Point for secant slope depending on deltaXStep
  const secantTargetIdx = Math.min(dataPoints.length - 1, safeHoverIdx + deltaXStep);
  const secantTargetPoint = dataPoints[secantTargetIdx] || selectedPoint;

  const actualDeltaX = secantTargetPoint.x - selectedPoint.x;
  const secantSlope = actualDeltaX > 0 ? (secantTargetPoint.yRaw - selectedPoint.yRaw) / actualDeltaX : selectedPoint.dyExact || 0;
  const exactTangentSlope = selectedPoint.dyExact || 0;
  const slopeError = Math.abs(secantSlope - exactTangentSlope);

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discrete Derivative Concept */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">离散求导：割线斜率逼近连续切线</h3>
              <p className="text-xs text-slate-500">Derivative Mapping: Secant Slope to Tangent Slope</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            连续微积分中，导数定义为极限定理 f'(x) = lim Δy/Δx。但在离散计算机采样中，步长 dx 无法做到无穷小，因而使用有限差分 Δy/Δx 逼近导数。
          </p>
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
            <div className="font-medium text-indigo-900 flex justify-between">
              <span>当前切点 x = {selectedPoint.x.toFixed(2)}:</span>
              <span className="font-mono text-indigo-700">采样 dx = {dx.toFixed(3)} (Δx = {actualDeltaX.toFixed(3)})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono pt-1">
              <div className="bg-white/80 p-1.5 rounded border border-indigo-200/60">
                割线斜率 Δy/Δx: <span className="font-bold text-indigo-600">{secantSlope.toFixed(4)}</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded border border-indigo-200/60">
                真实切线 f'(x): <span className="font-bold text-slate-700">{exactTangentSlope.toFixed(4)}</span>
              </div>
            </div>
            <div className="text-[11px] text-indigo-700/80 pt-1 border-t border-indigo-200/50 flex items-center justify-between">
              <span>截断误差 (Truncation Error):</span>
              <span className="font-mono font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">{slopeError.toFixed(5)}</span>
            </div>
          </div>
        </motion.div>

        {/* Discrete Integration Concept */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">数值积分：黎曼和与梯形面积累加</h3>
              <p className="text-xs text-slate-500">Integral Mapping: Discrete Sum to Definite Integral</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            连续定积分 ∫f(x)dx 表示曲线下的连续曲边梯形面积。在离散数据中，我们通过将区间拆分为离散采样切片，用矩形柱 ∑y_i·Δx 或梯形面积累加求和。
          </p>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-xs space-y-1.5">
            <div className="font-medium text-emerald-900 flex justify-between">
              <span>切片区间 [{sliceBounds.startX.toFixed(2)}, {sliceBounds.endX.toFixed(2)}]:</span>
              <span className="font-mono text-emerald-700">采样点数 N = {slicedData.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono pt-1">
              <div className="bg-white/80 p-1.5 rounded border border-emerald-200/60">
                离散累加和 ∑y_i·Δx: <span className="font-bold text-emerald-600">{(slicedData[slicedData.length - 1]?.intTrapezoid || 0).toFixed(4)}</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded border border-emerald-200/60">
                解析定积分 ∫f(x)dx: <span className="font-bold text-slate-700">{(slicedData[slicedData.length - 1]?.intExact || 0).toFixed(4)}</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-700/80 pt-1 border-t border-emerald-200/50 flex items-center justify-between">
              <span>面积近似偏差:</span>
              <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                {Math.abs((slicedData[slicedData.length - 1]?.intTrapezoid || 0) - (slicedData[slicedData.length - 1]?.intExact || 0)).toFixed(5)}
              </span>
            </div>
          </div>
        </motion.div>
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
        label="动态扫描进度"
        currentValueLabel={`x = ${selectedPoint.x.toFixed(2)}`}
      />

      {/* Main Visual Interactive Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              连续曲线 f(x) 与离散采样切片柱状图 (Riemann Sum vs Continuous)
            </h4>
            <p className="text-xs text-slate-500">
              观察随游标扫过时，特定采样点 (x_i, y_i) 的割线逼近与离散积分矩形填充
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
              割线跨度 Δx = {actualDeltaX.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={slicedData}
              onMouseMove={(state) => {
                if (!isPlaying && state && state.activeTooltipIndex !== undefined) {
                  const actualIdx = sliceBounds.startIdx + state.activeTooltipIndex;
                  setHoverIndex(actualIdx);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="x" tickFormatter={(val) => Number(val).toFixed(2)} stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DataPoint;
                    return (
                      <div className="bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl text-xs space-y-1.5 border border-slate-800 shadow-xl font-mono">
                        <div className="text-amber-400 font-bold border-b border-slate-700 pb-1">
                          切片点 index #{data.index} (x = {data.x.toFixed(3)})
                        </div>
                        <div>信号值 y_i: <span className="text-indigo-300 font-semibold">{data.yRaw.toFixed(4)}</span></div>
                        <div>前向差分 Δy/Δx: <span className="text-emerald-300">{(data.dyForward || 0).toFixed(4)}</span></div>
                        <div>真实的 f'(x): <span className="text-sky-300">{(data.dyExact || 0).toFixed(4)}</span></div>
                        <div>累加积分 ∫f(t)dt: <span className="text-purple-300">{(data.intTrapezoid || 0).toFixed(4)}</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Riemann Rectangles */}
              <Bar dataKey="yRaw" fill="#e0e7ff" opacity={0.6} radius={[2, 2, 0, 0]} name="离散采样矩形柱 (Riemann Rectangle)" />

              {/* Continuous Signal Curve */}
              <Line
                type="monotone"
                dataKey="yRaw"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#4f46e5" }}
                activeDot={{ r: 6, fill: "#4f46e5" }}
                name="连续原函数 f(x)"
              />

              {/* Highlight active hovered point */}
              {selectedPoint && (
                <ReferenceDot x={selectedPoint.x} y={selectedPoint.yRaw} r={7} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
              )}
              {secantTargetPoint && deltaXStep > 0 && (
                <ReferenceDot x={secantTargetPoint.x} y={secantTargetPoint.yRaw} r={5} fill="#0284c7" stroke="#ffffff" strokeWidth={1.5} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Delta X -> 0 Limit Convergence Animation Sandbox */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            极限定理动态逼近演示 (Dynamic Limit Convergence: Δx → 0)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDeltaXStep(5);
                setIsDeltaXAnimating(true);
              }}
              disabled={isDeltaXAnimating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              动画播放 Δx → 0 逼近过程
            </button>
            <button
              onClick={() => {
                setDeltaXStep(4);
                setIsDeltaXAnimating(false);
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              title="重置 Δx"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-white text-sm">离散求导极限定理</h5>
              <span className="font-mono text-amber-300 font-bold">
                当前跨度步数 Δi = {deltaXStep} (Δx = {actualDeltaX.toFixed(3)})
              </span>
            </div>
            <MathFormula latex="f'(x) = \lim_{\Delta x \to 0} \frac{f(x+\Delta x) - f(x)}{\Delta x}" block />
            
            <div className="space-y-2 pt-2">
              <label className="text-[11px] text-slate-400 flex justify-between">
                <span>手动调节割线邻域距离 Δx:</span>
                <span className="text-indigo-300 font-mono font-bold">{deltaXStep} 个采样点</span>
              </label>
              <input
                type="range"
                min={1}
                max={8}
                value={deltaXStep}
                onChange={(e) => setDeltaXStep(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>割线斜率 Δy/Δx:</span>
                <span className="text-amber-300 font-bold">{secantSlope.toFixed(5)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>连续切线 f'(x):</span>
                <span className="text-sky-300 font-bold">{exactTangentSlope.toFixed(5)}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                <span>逼近误差 |Δ - f'|:</span>
                <span className="text-rose-400 font-bold">{slopeError.toFixed(6)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <h5 className="font-bold text-white text-sm">离散积分极限定理</h5>
            <MathFormula latex="\int_a^b f(x) dx = \lim_{\Delta x \to 0} \sum_{i=0}^{N-1} f(x_i) \Delta x" block />
            <p className="text-slate-300 text-[11px]">
              当 Δx → 0 时，无限细分的离散柱状矩形/梯形切片累加和完美收敛于曲边梯形的定积分面积。在动画播放过程中，可以看到随着 Δx 的不断缩小，割线斜率与理论切线重合度指数级提升！
            </p>
            <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-[11px] text-indigo-200 font-medium">
              💡 结论：在无噪声理想信号中，采样点越密 (Δx 越小)，离散微积分精度越高；但在含噪信号中，过度缩小的 Δx 会剧烈放大噪声，这需要通过平滑滤波平衡！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

