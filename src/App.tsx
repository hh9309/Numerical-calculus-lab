/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Header, ModuleTab } from "./components/Header";
import { SlicerControlBar } from "./components/SlicerControlBar";
import { DiscreteEssenceModule } from "./components/modules/DiscreteEssenceModule";
import { DifferenceSandboxModule } from "./components/modules/DifferenceSandboxModule";
import { IntegrationSandboxModule } from "./components/modules/IntegrationSandboxModule";
import { FilterInterpolationModule } from "./components/modules/FilterInterpolationModule";
import { ApplicationsModule } from "./components/modules/ApplicationsModule";
import { CodeEngineModule } from "./components/modules/CodeEngineModule";
import { AiDiagnosticModule } from "./components/modules/AiDiagnosticModule";
import { ExportReportModule } from "./components/modules/ExportReportModule";
import { KnowledgeGuideModule } from "./components/modules/KnowledgeGuideModule";

import {
  SignalPreset,
  DiffMethod,
  IntMethod,
  FilterMethod,
  SliceBounds,
} from "./types";
import {
  generateBaseSignal,
  applyFilter,
  computeDerivatives,
  computeIntegrals,
} from "./utils/calculusMath";

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>("essence");

  // Global Sandbox Parameters
  const [signalPreset, setSignalPreset] = useState<SignalPreset>("sine_composite");
  const [sampleCount, setSampleCount] = useState(100);
  const xMin = 0;
  const xMax = 10;
  const [noiseLevel, setNoiseLevel] = useState(0.05);

  const [diffMethod, setDiffMethod] = useState<DiffMethod>("central");
  const [intMethod, setIntMethod] = useState<IntMethod>("trapezoidal");
  const [filterMethod, setFilterMethod] = useState<FilterMethod>("savitzky_golay");

  const [comparisonMode, setComparisonMode] = useState(false);

  // Slice Bounds State
  const [sliceBounds, setSliceBounds] = useState<SliceBounds>({
    startIdx: 0,
    endIdx: 99,
    startX: 0,
    endX: 10,
  });

  // Calculate DX
  const dx = (xMax - xMin) / (sampleCount - 1);

  // Keep sliceBounds in sync when sampleCount changes
  const adjustedSliceBounds = useMemo(() => {
    const endIdx = Math.min(sampleCount - 1, sliceBounds.endIdx);
    const startIdx = Math.min(endIdx - 5, sliceBounds.startIdx);
    return {
      startIdx: Math.max(0, startIdx),
      endIdx,
      startX: Number((xMin + Math.max(0, startIdx) * dx).toFixed(3)),
      endX: Number((xMin + endIdx * dx).toFixed(3)),
    };
  }, [sampleCount, sliceBounds.startIdx, sliceBounds.endIdx, dx]);

  // Reset parameters
  const resetAll = () => {
    setSignalPreset("sine_composite");
    setSampleCount(100);
    setNoiseLevel(0.05);
    setDiffMethod("central");
    setIntMethod("trapezoidal");
    setFilterMethod("savitzky_golay");
    setSliceBounds({
      startIdx: 0,
      endIdx: 99,
      startX: 0,
      endX: 10,
    });
    setComparisonMode(false);
  };

  // Compute Full Interactive Data Pipeline
  const dataPoints = useMemo(() => {
    // 1. Generate base raw signal + noise
    const raw = generateBaseSignal(signalPreset, sampleCount, xMin, xMax, noiseLevel);

    // 2. Apply filtering
    const filtered = applyFilter(raw, filterMethod, 5);

    // 3. Compute derivatives
    const withDiff = computeDerivatives(filtered, diffMethod, filterMethod !== "none");

    // 4. Compute integrals
    const withInt = computeIntegrals(withDiff, intMethod, filterMethod !== "none");

    return withInt;
  }, [signalPreset, sampleCount, noiseLevel, filterMethod, diffMethod, intMethod]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* Sticky Header Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Interactive Slicer Controller */}
        <SlicerControlBar
          sampleCount={sampleCount}
          setSampleCount={setSampleCount}
          noiseLevel={noiseLevel}
          setNoiseLevel={setNoiseLevel}
          sliceBounds={adjustedSliceBounds}
          setSliceBounds={setSliceBounds}
          signalPreset={signalPreset}
          setSignalPreset={setSignalPreset}
          xMin={xMin}
          xMax={xMax}
          resetAll={resetAll}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
        />

        {/* Dynamic Module Render based on Active Tab */}
        <div className="transition-all duration-300">
          {activeTab === "essence" && (
            <DiscreteEssenceModule
              dataPoints={dataPoints}
              sliceBounds={adjustedSliceBounds}
              xMin={xMin}
              xMax={xMax}
              sampleCount={sampleCount}
            />
          )}

          {activeTab === "difference" && (
            <DifferenceSandboxModule
              dataPoints={dataPoints}
              sliceBounds={adjustedSliceBounds}
              diffMethod={diffMethod}
              setDiffMethod={setDiffMethod}
              noiseLevel={noiseLevel}
            />
          )}

          {activeTab === "integration" && (
            <IntegrationSandboxModule
              dataPoints={dataPoints}
              sliceBounds={adjustedSliceBounds}
              intMethod={intMethod}
              setIntMethod={setIntMethod}
            />
          )}

          {activeTab === "filter" && (
            <FilterInterpolationModule
              dataPoints={dataPoints}
              sliceBounds={adjustedSliceBounds}
              filterMethod={filterMethod}
              setFilterMethod={setFilterMethod}
              noiseLevel={noiseLevel}
            />
          )}

          {activeTab === "applications" && <ApplicationsModule />}

          {activeTab === "code_engine" && (
            <CodeEngineModule
              signalPreset={signalPreset}
              sampleCount={sampleCount}
              dx={dx}
              noiseLevel={noiseLevel}
              diffMethod={diffMethod}
              intMethod={intMethod}
              filterMethod={filterMethod}
              sliceBounds={adjustedSliceBounds}
            />
          )}

          {activeTab === "ai_diagnosis" && (
            <AiDiagnosticModule
              signalPreset={signalPreset}
              sampleCount={sampleCount}
              dx={dx}
              noiseLevel={noiseLevel}
              diffMethod={diffMethod}
              intMethod={intMethod}
              filterMethod={filterMethod}
              sliceBounds={adjustedSliceBounds}
            />
          )}

          {activeTab === "export_report" && (
            <ExportReportModule
              dataPoints={dataPoints}
              sliceBounds={adjustedSliceBounds}
              signalPreset={signalPreset}
              sampleCount={sampleCount}
              dx={dx}
              noiseLevel={noiseLevel}
              diffMethod={diffMethod}
              intMethod={intMethod}
              filterMethod={filterMethod}
            />
          )}

          {activeTab === "knowledge_guide" && <KnowledgeGuideModule />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          数据微积分实验室 (Data Calculus Lab) · 连续至离散映射与信号求导/数值积分沙盒
        </div>
      </footer>
    </div>
  );
}
