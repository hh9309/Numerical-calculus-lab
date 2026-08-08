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
} from "recharts";
import { MathFormula } from "../MathFormula";
import { AlgorithmTooltip } from "../AlgorithmTooltip";
import { AnimationPlayerControls } from "../AnimationPlayerControls";
import { DataPoint, DiffMethod, SliceBounds } from "../../types";
import { computeRMSE } from "../../utils/calculusMath";
import { TrendingUp, AlertTriangle, Info, CheckCircle2, Sliders, HelpCircle, Activity } from "lucide-react";
import { motion } from "motion/react";

interface DifferenceSandboxModuleProps {
  dataPoints: DataPoint[];
  sliceBounds: SliceBounds;
  diffMethod: DiffMethod;
  setDiffMethod: (method: DiffMethod) => void;
  noiseLevel: number;
}

export const DifferenceSandboxModule: React.FC<DifferenceSandboxModuleProps> = ({
  dataPoints,
  sliceBounds,
  diffMethod,
  setDiffMethod,
  noiseLevel,
}) => {
  const [showNoiseFreeOverlay, setShowNoiseFreeOverlay] = useState(true);
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

  const forwardRmse = computeRMSE(slicedData, "dyForward" as any, "dyExact");
  const backwardRmse = computeRMSE(slicedData, "dyBackward" as any, "dyExact");
  const centralRmse = computeRMSE(slicedData, "dyCentral" as any, "dyExact");

  const activePoint = dataPoints[hoverIndex] || slicedData[0] || dataPoints[0];

  return (
    <div className="space-y-6">
      {/* Control & Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              离散差分算法选择与比较 (Difference Methods)
            </h3>
            <p className="text-xs text-slate-500">
              对比前向、后向与中心差分法的截断误差及其对噪声的敏感度
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNoiseFreeOverlay(!showNoiseFreeOverlay)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                showNoiseFreeOverlay
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {showNoiseFreeOverlay ? "隐藏无噪声基准线" : "显示无噪声基准线"}
            </button>
          </div>
        </div>

        {/* Method Selection Radio Group & RMSE Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Forward Difference */}
          <AlgorithmTooltip algorithmKey="forward" position="top">
            <div
              onClick={() => setDiffMethod("forward")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                diffMethod === "forward"
                  ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  前向差分 (Forward)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  误差 O(dx)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                dy/dx = (y_i+1 - y_i) / dx
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-indigo-700">{forwardRmse.toFixed(4)}</span>
              </div>
            </div>
          </AlgorithmTooltip>

          {/* Backward Difference */}
          <AlgorithmTooltip algorithmKey="backward" position="top">
            <div
              onClick={() => setDiffMethod("backward")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                diffMethod === "backward"
                  ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  后向差分 (Backward)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  误差 O(dx)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                dy/dx = (y_i - y_i-1) / dx
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-emerald-700">{backwardRmse.toFixed(4)}</span>
              </div>
            </div>
          </AlgorithmTooltip>

          {/* Central Difference */}
          <AlgorithmTooltip algorithmKey="central" position="top">
            <div
              onClick={() => setDiffMethod("central")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                diffMethod === "central"
                  ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  中心差分 (Central)
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 transition-colors" />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  推荐：高精度 O(dx²)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                dy/dx = (y_i+1 - y_i-1) / (2dx)
              </p>
              <div className="text-xs text-slate-600 font-mono">
                均方根误差 RMSE: <span className="font-bold text-purple-700">{centralRmse.toFixed(4)}</span>
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
        label="求导切点动画追踪"
        currentValueLabel={`x = ${activePoint ? activePoint.x.toFixed(2) : 0}`}
      />

      {/* Derivative Comparison Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            离散求导曲线 vs 真实解析导数 f'(x) (Numerical Derivatives Chart)
          </h4>
          {activePoint && (
            <div className="text-xs font-mono bg-purple-50 text-purple-800 px-3 py-1 rounded-lg border border-purple-200 hidden sm:flex items-center gap-3">
              <span>切点 x={activePoint.x.toFixed(2)}</span>
              <span>当前求导={((activePoint as any)[`dy${diffMethod.charAt(0).toUpperCase() + diffMethod.slice(1)}`] || 0).toFixed(4)}</span>
              <span>理论 f'={activePoint.dyExact?.toFixed(4)}</span>
            </div>
          )}
        </div>

        <div className="h-80 w-full">
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
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DataPoint;
                    return (
                      <div className="bg-slate-900/90 text-white p-3 rounded-xl text-xs space-y-1 font-mono border border-slate-800">
                        <div className="text-amber-400 font-bold border-b border-slate-700 pb-1">
                          x = {data.x.toFixed(3)}
                        </div>
                        <div>真实导数 f'(x): <span className="text-sky-300">{(data.dyExact || 0).toFixed(4)}</span></div>
                        <div>前向差分 Δy/Δx: <span className="text-indigo-300 font-semibold">{(data.dyForward || 0).toFixed(4)}</span></div>
                        <div>后向差分: <span className="text-emerald-300">{(data.dyBackward || 0).toFixed(4)}</span></div>
                        <div>中心差分: <span className="text-purple-300 font-bold">{(data.dyCentral || 0).toFixed(4)}</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />

              {/* Exact Analytical Derivative */}
              {showNoiseFreeOverlay && (
                <Line
                  type="monotone"
                  dataKey="dyExact"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={false}
                  name="真实导数 f'(x)"
                />
              )}

              {/* Numerical Selected Derivative */}
              <Line
                type="monotone"
                dataKey="dySelected"
                stroke={diffMethod === "central" ? "#9333ea" : diffMethod === "forward" ? "#4f46e5" : "#059669"}
                strokeWidth={2}
                dot={{ r: 2 }}
                name={`当前已选差分 (${diffMethod})`}
              />

              {/* Reference Dot for Animation Tracking */}
              {activePoint && (
                <ReferenceDot
                  x={activePoint.x}
                  y={(activePoint as any)[`dy${diffMethod.charAt(0).toUpperCase() + diffMethod.slice(1)}`] || activePoint.dyExact}
                  r={7}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-Frequency Noise Amplification Warning Box */}
      <div className={`p-5 rounded-2xl border transition-all ${
        noiseLevel > 0.05
          ? "bg-rose-50/90 border-rose-200 text-rose-900"
          : "bg-sky-50/90 border-sky-200 text-sky-900"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl mt-0.5 ${
            noiseLevel > 0.05 ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-sm flex items-center gap-2">
              离散求导的核心困境：高频噪声放大效应 (Noise Amplification Hazard)
            </h4>
            <p className="leading-relaxed">
              假定原始真实信号为 $y_0(t)$，叠加高频微小噪声 $n(t) = \epsilon \cdot \sin(\omega t)$。原始信号中噪声幅度仅为 $\epsilon$，但对其进行离散求导时：
            </p>
            <MathFormula latex="\frac{d}{dt} [y_0(t) + \epsilon \sin(\omega t)] = y_0'(t) + \mathbf{\epsilon \cdot \omega} \cdot \cos(\omega t)" block />
            <p className="leading-relaxed font-medium">
              注意到求导后噪声幅值被放大了 <span className="font-bold font-mono text-rose-700">$\omega$ 倍</span>（角频率）！即便原信号噪声幅度 $\epsilon$ 极小，若高频噪声频率 $\omega$ 很高，求导后的噪声振荡将直接淹没真实导数信号。因此，<span className="underline font-bold">先平滑滤波，再进行离散求导</span>是数据科学中的基本法则！
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Point Slice Inspector Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-bold text-slate-800 text-sm">
            切片数据点详细导数表 (Sliced Points Derivative Inspector)
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            Displaying {slicedData.length} sliced points
          </span>
        </div>

        <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200/60">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-mono"># Index</th>
                <th className="p-2.5 font-mono">$x_i$</th>
                <th className="p-2.5 font-mono">含噪 $y_i$</th>
                <th className="p-2.5 font-mono">真实 $f'(x)$</th>
                <th className="p-2.5 font-mono">前向差分</th>
                <th className="p-2.5 font-mono">后向差分</th>
                <th className="p-2.5 font-mono">中心差分</th>
                <th className="p-2.5 font-mono">绝对误差 $|E|$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {slicedData.slice(0, 15).map((p) => (
                <tr key={p.index} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-2.5 text-slate-400 font-bold">#{p.index}</td>
                  <td className="p-2.5 text-slate-800">{p.x.toFixed(3)}</td>
                  <td className="p-2.5 text-slate-600">{p.yNoisy.toFixed(4)}</td>
                  <td className="p-2.5 text-sky-700 font-semibold">{(p.dyExact || 0).toFixed(4)}</td>
                  <td className="p-2.5 text-indigo-700">{(p.dyForward || 0).toFixed(4)}</td>
                  <td className="p-2.5 text-emerald-700">{(p.dyBackward || 0).toFixed(4)}</td>
                  <td className="p-2.5 text-purple-700 font-bold">{(p.dyCentral || 0).toFixed(4)}</td>
                  <td className="p-2.5 text-rose-600">{(p.dyError || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
