import React from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Zap } from "lucide-react";

interface AnimationPlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepForward?: () => void;
  onStepBack?: () => void;
  currentIndex: number;
  maxIndex: number;
  onIndexChange: (idx: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  label?: string;
  currentValueLabel?: string;
}

export const AnimationPlayerControls: React.FC<AnimationPlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  onStepForward,
  onStepBack,
  currentIndex,
  maxIndex,
  onIndexChange,
  speed,
  onSpeedChange,
  label = "动态扫描播放控制",
  currentValueLabel,
}) => {
  return (
    <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Play/Pause & Step Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                自动播放演示
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="重置到起点"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onStepBack && (
            <button
              onClick={onStepBack}
              disabled={currentIndex <= 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
              title="退回一步"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          )}

          {onStepForward && (
            <button
              onClick={onStepForward}
              disabled={currentIndex >= maxIndex}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
              title="前进一步"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live indicator badge */}
        {isPlaying && (
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60 text-[11px] font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            扫描演示中
          </div>
        )}
      </div>

      {/* Progress Slider */}
      <div className="flex-1 w-full flex items-center gap-2">
        <span className="text-slate-400 font-mono text-[11px] shrink-0">{label}:</span>
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={currentIndex}
          onChange={(e) => onIndexChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />
        <span className="text-amber-300 font-mono text-[11px] shrink-0 min-w-[70px] text-right font-bold">
          {currentValueLabel || `${currentIndex} / ${maxIndex}`}
        </span>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <Zap className="w-3 h-3 text-amber-400 ml-1" />
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
              speed === s
                ? "bg-indigo-600 text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
