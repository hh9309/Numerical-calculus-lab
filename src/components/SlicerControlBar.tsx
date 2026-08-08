import React from "react";
import { Sliders, Scissors, Layers, Volume2, Sparkles, RefreshCw } from "lucide-react";
import { SliceBounds, SignalPreset } from "../types";

interface SlicerControlBarProps {
  sampleCount: number;
  setSampleCount: (val: number) => void;
  noiseLevel: number;
  setNoiseLevel: (val: number) => void;
  sliceBounds: SliceBounds;
  setSliceBounds: (bounds: SliceBounds) => void;
  signalPreset: SignalPreset;
  setSignalPreset: (preset: SignalPreset) => void;
  xMin: number;
  xMax: number;
  resetAll: () => void;
  comparisonMode: boolean;
  setComparisonMode: (val: boolean) => void;
}

export const SlicerControlBar: React.FC<SlicerControlBarProps> = ({
  sampleCount,
  setSampleCount,
  noiseLevel,
  setNoiseLevel,
  sliceBounds,
  setSliceBounds,
  signalPreset,
  setSignalPreset,
  xMin,
  xMax,
  resetAll,
  comparisonMode,
  setComparisonMode,
}) => {
  const dx = (xMax - xMin) / (sampleCount - 1);

  const handleStartSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startIdx = Math.max(0, Math.min(parseInt(e.target.value) || 0, sliceBounds.endIdx - 5));
    const startX = xMin + startIdx * dx;
    setSliceBounds({
      ...sliceBounds,
      startIdx,
      startX: Number(startX.toFixed(3)),
    });
  };

  const handleEndSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endIdx = Math.min(sampleCount - 1, Math.max(parseInt(e.target.value) || sampleCount - 1, sliceBounds.startIdx + 5));
    const endX = xMin + endIdx * dx;
    setSliceBounds({
      ...sliceBounds,
      endIdx,
      endX: Number(endX.toFixed(3)),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Scissors className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            交互式数据切片控制台
            <span className="text-xs font-mono font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Slicing Range: [{sliceBounds.startX.toFixed(2)}, {sliceBounds.endX.toFixed(2)}]
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-600 font-medium">基准信号源:</label>
          <select
            value={signalPreset}
            onChange={(e) => setSignalPreset(e.target.value as SignalPreset)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-xs shadow-2xs"
          >
            <option value="sine_composite">正弦复合波 (Sinusoidal)</option>
            <option value="polynomial">多项式曲线 (Polynomial)</option>
            <option value="sensor_accel">传感器加速度 (Sensor Accel)</option>
            <option value="financial_stock">股票资产价格 (Stock Asset)</option>
            <option value="gaussian_peak">高斯分布峰 (Gaussian Peak)</option>
            <option value="chirp_wave">高频调频波 (Chirp Wave)</option>
            <option value="roc_dataset">S型概率分布 (Sigmoid ROC)</option>
          </select>

          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
              comparisonMode
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            {comparisonMode ? "退出切片对比" : "开启切片双区对比"}
          </button>

          <button
            onClick={resetAll}
            className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
            title="重置参数与切片"
          >
            <RefreshCw className="w-3.5 h-3.5 inline" />
            重置
          </button>
        </div>
      </div>

      {/* Slicer Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slice Start & End Slider */}
        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="flex justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Scissors className="w-3 h-3 text-blue-600" />
              左切片起点 xa
            </span>
            <span className="font-mono text-blue-700 font-semibold">{sliceBounds.startX.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={sampleCount - 6}
            value={sliceBounds.startIdx}
            onChange={handleStartSliceChange}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="flex justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Scissors className="w-3 h-3 text-emerald-600" />
              右切片终点 xb
            </span>
            <span className="font-mono text-emerald-700 font-semibold">{sliceBounds.endX.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={sliceBounds.startIdx + 5}
            max={sampleCount - 1}
            value={sliceBounds.endIdx}
            onChange={handleEndSliceChange}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Sampling density / dx slider */}
        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="flex justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-600" />
              采样点数 N (步长 dx = {dx.toFixed(3)})
            </span>
            <span className="font-mono text-amber-700 font-semibold">{sampleCount}</span>
          </div>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={sampleCount}
            onChange={(e) => setSampleCount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        {/* Noise level slider */}
        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="flex justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-rose-600" />
              高频噪声强度 σ
            </span>
            <span className="font-mono text-rose-700 font-semibold">{noiseLevel.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={noiseLevel}
            onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
        </div>
      </div>
    </div>
  );
};
