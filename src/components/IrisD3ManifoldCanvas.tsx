import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  IrisPoint,
  IrisGridCell,
  IrisFeature,
  IRIS_FEATURE_LABELS,
} from "../utils/calculusMath";
import {
  RotateCcw,
  Sparkles,
  Network,
  Sliders,
  Play,
  Eye,
  Flower2,
  Info,
} from "lucide-react";

interface IrisD3ManifoldCanvasProps {
  points: IrisPoint[];
  grid: IrisGridCell[][];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xFeature: IrisFeature;
  yFeature: IrisFeature;
  onChangeFeaturePair: (xFeat: IrisFeature, yFeat: IrisFeature) => void;
}

const PRESET_PAIRS: {
  id: string;
  name: string;
  desc: string;
  x: IrisFeature;
  y: IrisFeature;
}[] = [
  {
    id: "petal_len_wid",
    name: "🌸 花瓣长/宽 辨识切面",
    desc: "三类别分类 Margin 最大的经典黄金投影维",
    x: "petalLength",
    y: "petalWidth",
  },
  {
    id: "sepal_len_wid",
    name: "🍃 花萼长/宽 重叠切面",
    desc: "Versicolor 与 Virginica 产生混淆转折边界",
    x: "sepalLength",
    y: "sepalWidth",
  },
  {
    id: "sepal_petal_len",
    name: "🌿 花萼长 vs 花瓣长",
    desc: "展示花萼与花瓣沿高维流形的主轴延伸",
    x: "sepalLength",
    y: "petalLength",
  },
  {
    id: "sepal_petal_wid",
    name: "🌺 花萼宽 vs 花瓣宽",
    desc: "横向宽幅分布与 Setosa 显著聚类孤立区",
    x: "sepalWidth",
    y: "petalWidth",
  },
];

export const IrisD3ManifoldCanvas: React.FC<IrisD3ManifoldCanvasProps> = ({
  points,
  grid,
  xMin,
  xMax,
  yMin,
  yMax,
  xFeature,
  yFeature,
  onChangeFeaturePair,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<IrisPoint | null>(null);
  const [showKNNMesh, setShowKNNMesh] = useState<boolean>(true);
  const [transitionDuration, setTransitionDuration] = useState<number>(1400);
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [unfoldArcFactor, setUnfoldArcFactor] = useState<number>(0.25);

  // Keep track of previous positions for smooth D3 interpolation
  const prevPositionsRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );

  const width = 640;
  const height = 440;
  const margin = { top: 25, right: 30, bottom: 50, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Render or Update D3 Visualization with Topological Unfolding
  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([xMin, xMax])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // Select container group
    const g = svg.select<SVGGElement>(".main-group");
    if (g.empty()) return;

    setIsReconstructing(true);

    // 1. Update Grid Cells (Background Contour)
    const gridFlat = grid.flat();
    const cellWidth = innerWidth / (grid.length - 1 || 1);
    const cellHeight = innerHeight / (grid[0]?.length - 1 || 1);

    const gridSelection = g
      .select(".grid-layer")
      .selectAll<SVGRectElement, IrisGridCell>("rect.grid-cell")
      .data(gridFlat, (d: any) => `${d.x}-${d.y}`);

    gridSelection
      .enter()
      .append("rect")
      .attr("class", "grid-cell")
      .attr("x", (d: IrisGridCell) => xScale(d.x) - cellWidth / 2)
      .attr("y", (d: IrisGridCell) => yScale(d.y) - cellHeight / 2)
      .attr("width", cellWidth + 0.5)
      .attr("height", cellHeight + 0.5)
      .attr("opacity", 0)
      .merge(gridSelection)
      .transition()
      .duration(transitionDuration * 0.8)
      .attr("x", (d: IrisGridCell) => xScale(d.x) - cellWidth / 2)
      .attr("y", (d: IrisGridCell) => yScale(d.y) - cellHeight / 2)
      .attr("width", cellWidth + 0.5)
      .attr("height", cellHeight + 0.5)
      .attr("fill", (d: IrisGridCell) => {
        if (d.topSpecies === "setosa") return "rgba(14, 165, 233, 0.25)";
        if (d.topSpecies === "versicolor") return "rgba(16, 185, 129, 0.25)";
        return "rgba(168, 85, 247, 0.25)";
      })
      .attr("opacity", (d: IrisGridCell) => Math.min(0.85, 0.2 + d.gradMagnitude * 0.35));

    gridSelection.exit().remove();

    // 2. Compute Topo Mesh Links (k-NN Network Edges)
    type LinkType = { source: IrisPoint; target: IrisPoint; id: string };
    const links: LinkType[] = [];
    points.forEach((pt) => {
      pt.neighbors.forEach((nIdx) => {
        const target = points[nIdx];
        if (target && pt.id < target.id) {
          links.push({
            source: pt,
            target,
            id: `${pt.id}-${target.id}`,
          });
        }
      });
    });

    const linkSelection = g
      .select(".mesh-layer")
      .selectAll<SVGLineElement, LinkType>("line.mesh-edge")
      .data(showKNNMesh ? links : [], (d: any) => d.id);

    linkSelection
      .enter()
      .append("line")
      .attr("class", "mesh-edge")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0)
      .merge(linkSelection)
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr("x1", (d: LinkType) => xScale(d.source.xVal))
      .attr("y1", (d: LinkType) => yScale(d.source.yVal))
      .attr("x2", (d: LinkType) => xScale(d.target.xVal))
      .attr("y2", (d: LinkType) => yScale(d.target.yVal))
      .attr("stroke-opacity", 0.4);

    linkSelection
      .exit()
      .transition()
      .duration(300)
      .attr("stroke-opacity", 0)
      .remove();

    // 3. D3 Nodes with Custom Topological Unfolding Arc Interpolation Tween
    const prevPositions = prevPositionsRef.current;

    const nodeSelection = g
      .select(".nodes-layer")
      .selectAll<SVGGElement, IrisPoint>("g.iris-node")
      .data(points, (d: any) => d.id);

    const newNodes = nodeSelection
      .enter()
      .append("g")
      .attr("class", "iris-node")
      .attr(
        "transform",
        (d: IrisPoint) => `translate(${xScale(d.xVal)}, ${yScale(d.yVal)})`
      );

    newNodes
      .append("circle")
      .attr("r", 5)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5);

    const mergedNodes = newNodes.merge(nodeSelection);

    // Update node color
    mergedNodes.select("circle").attr("fill", (d: any) => {
      const item = d as IrisPoint;
      if (item.species === "setosa") return "#0284c7"; // Sky Blue
      if (item.species === "versicolor") return "#059669"; // Emerald
      return "#9333ea"; // Purple
    });

    // Custom D3 Tween Transition for Topological Arc Unfolding
    mergedNodes
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeCubicInOut)
      .attrTween("transform", function (d: any) {
        const item = d as IrisPoint;
        const prev = prevPositions.get(item.id) || {
          x: xScale(item.xVal),
          y: yScale(item.yVal),
        };
        const targetX = xScale(item.xVal);
        const targetY = yScale(item.yVal);

        const interpolateX = d3.interpolateNumber(prev.x, targetX);
        const interpolateY = d3.interpolateNumber(prev.y, targetY);

        // Calculate perpendicular offset vector for manifold unfolding arc effect
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dist > 0 ? -dy / dist : 0;
        const ny = dist > 0 ? dx / dist : 0;

        // Directional wave amplitude based on point ID
        const arcAmp =
          Math.sin(item.id * 0.4) * dist * unfoldArcFactor;

        return function (t: number) {
          // Arc envelope: 0 at t=0, peak at t=0.5, 0 at t=1
          const wave = Math.sin(t * Math.PI) * arcAmp;
          const currX = interpolateX(t) + nx * wave;
          const currY = interpolateY(t) + ny * wave;

          return `translate(${currX}, ${currY})`;
        };
      })
      .on("end", function (d: any) {
        const item = d as IrisPoint;
        // Store final position for next transition
        prevPositions.set(item.id, { x: xScale(item.xVal), y: yScale(item.yVal) });
        setIsReconstructing(false);
      });

    // Attach Interactivity Hover Handlers
    mergedNodes
      .on("mouseenter", (event, d) => {
        setHoveredPoint(d);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", 8)
          .attr("stroke-width", 2.5);
      })
      .on("mouseleave", (event) => {
        setHoveredPoint(null);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", 5)
          .attr("stroke-width", 1.5);
      });

    // 4. Update Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((v) => `${v}`);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((v) => `${v}`);

    svg
      .select<SVGGElement>(".x-axis")
      .transition()
      .duration(transitionDuration * 0.8)
      .call(xAxis);

    svg
      .select<SVGGElement>(".y-axis")
      .transition()
      .duration(transitionDuration * 0.8)
      .call(yAxis);
  }, [
    points,
    grid,
    xMin,
    xMax,
    yMin,
    yMax,
    showKNNMesh,
    transitionDuration,
    unfoldArcFactor,
  ]);

  const xMeta = IRIS_FEATURE_LABELS[xFeature];
  const yMeta = IRIS_FEATURE_LABELS[yFeature];

  return (
    <div className="space-y-4">
      {/* Control Bar: Dimension Switcher & Reconstruction Controls */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
        {/* Preset Pairs Fast Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            快速选择流形特征维度 (Topology Feature Projections):
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowKNNMesh(!showKNNMesh);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                showKNNMesh
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              {showKNNMesh ? "拓扑网络 (On)" : "拓扑网络 (Off)"}
            </button>

            <button
              onClick={() => {
                // Force trigger re-render reconstruction transition
                onChangeFeaturePair(xFeature, yFeature);
              }}
              disabled={isReconstructing}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${
                  isReconstructing ? "animate-spin" : ""
                }`}
              />
              重构拓扑展开
            </button>
          </div>
        </div>

        {/* Feature Pair Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_PAIRS.map((pair) => {
            const isSelected =
              xFeature === pair.x && yFeature === pair.y;
            return (
              <button
                key={pair.id}
                onClick={() => onChangeFeaturePair(pair.x, pair.y)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200"
                    : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100/80"
                }`}
              >
                <div className="font-bold text-xs">{pair.name}</div>
                <div
                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isSelected ? "text-indigo-100" : "text-slate-400"
                  }`}
                >
                  {pair.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Axis Dropdowns & Animation Speed */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">X 轴特征:</span>
              <select
                value={xFeature}
                onChange={(e) =>
                  onChangeFeaturePair(e.target.value as IrisFeature, yFeature)
                }
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700"
              >
                <option value="petalLength">花瓣长度 (Petal Length)</option>
                <option value="petalWidth">花瓣宽度 (Petal Width)</option>
                <option value="sepalLength">花萼长度 (Sepal Length)</option>
                <option value="sepalWidth">花萼宽度 (Sepal Width)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Y 轴特征:</span>
              <select
                value={yFeature}
                onChange={(e) =>
                  onChangeFeaturePair(xFeature, e.target.value as IrisFeature)
                }
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700"
              >
                <option value="petalWidth">花瓣宽度 (Petal Width)</option>
                <option value="petalLength">花瓣长度 (Petal Length)</option>
                <option value="sepalLength">花萼长度 (Sepal Length)</option>
                <option value="sepalWidth">花萼宽度 (Sepal Width)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">拓扑弧度:</span>
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.05}
                value={unfoldArcFactor}
                onChange={(e) => setUnfoldArcFactor(parseFloat(e.target.value))}
                className="w-16 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">动画时长:</span>
              <select
                value={transitionDuration}
                onChange={(e) => setTransitionDuration(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono font-semibold text-slate-700"
              >
                <option value={800}>800ms (快)</option>
                <option value={1400}>1400ms (适中)</option>
                <option value={2400}>2400ms (行云流水)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main D3 Canvas Area */}
      <div className="relative w-full aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
        {/* SVG Visualization */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full font-sans select-none"
        >
          <g
            className="main-group"
            transform={`translate(${margin.left}, ${margin.top})`}
          >
            {/* Grid background layer */}
            <g className="grid-layer" />

            {/* k-NN Topological Mesh layer */}
            <g className="mesh-layer" />

            {/* Iris Data Nodes layer */}
            <g className="nodes-layer" />
          </g>

          {/* D3 Axes */}
          <g
            className="x-axis text-slate-400 font-mono text-[10px]"
            transform={`translate(${margin.left}, ${height - margin.bottom})`}
          />
          <g
            className="y-axis text-slate-400 font-mono text-[10px]"
            transform={`translate(${margin.left}, ${margin.top})`}
          />

          {/* Axis Labels */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill="#94a3b8"
            className="text-[11px] font-bold font-sans"
          >
            {xMeta.nameZh} ({xMeta.nameEn}) / {xMeta.unit}
          </text>

          <text
            x={16}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            fill="#94a3b8"
            className="text-[11px] font-bold font-sans"
            transform={`rotate(-90, 16, ${margin.top + innerHeight / 2})`}
          >
            {yMeta.nameZh} ({yMeta.nameEn}) / {yMeta.unit}
          </text>
        </svg>

        {/* Status Overlay Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>D3.js 拓扑展开重构</span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-indigo-300">N=150 点</span>
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-medium text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Setosa
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{" "}
            Versicolor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>{" "}
            Virginica
          </span>
        </div>

        {/* Hover Point Inspector Tooltip */}
        {hoveredPoint && (
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-700 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-20 pointer-events-none">
            <div className="font-bold flex items-center justify-between gap-3 text-indigo-300">
              <span>
                #{hoveredPoint.id + 1} Iris {hoveredPoint.species.toUpperCase()}
              </span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800 font-mono">
                P={(hoveredPoint.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono text-slate-300">
              <div>花瓣长: {hoveredPoint.petalLength}cm</div>
              <div>花瓣宽: {hoveredPoint.petalWidth}cm</div>
              <div>花萼长: {hoveredPoint.sepalLength}cm</div>
              <div>花萼宽: {hoveredPoint.sepalWidth}cm</div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
              Topological 3-NN: [{hoveredPoint.neighbors.map((n) => `#${n + 1}`).join(", ")}]
            </div>
          </div>
        )}
      </div>

      {/* Explanatory Caption */}
      <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-indigo-950">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>D3.js 拓扑重构机制：</strong>{" "}
          当切换特征维度时，D3 采用三阶贝塞尔-弧度插值 (Topological Arc Interpolation)，演示数据点在四维真实空间中的近邻拓扑关系（紫蓝色 $k$-NN 连线）。点群与决策背景网格呈现平滑展开与拉伸重构，展示非线性映射下的流形连续性。
        </p>
      </div>
    </div>
  );
};
