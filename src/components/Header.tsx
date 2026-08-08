import React from "react";
import {
  Activity,
  TrendingUp,
  BarChart3,
  Filter,
  Briefcase,
  Code2,
  BrainCircuit,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export type ModuleTab =
  | "essence"
  | "difference"
  | "integration"
  | "filter"
  | "applications"
  | "code_engine"
  | "ai_diagnosis"
  | "export_report"
  | "knowledge_guide";

interface HeaderProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
}

const MODULES = [
  { id: "essence", name: "1. 离散本质", icon: Activity, desc: "连续至离散映射" },
  { id: "difference", name: "2. 差分沙盒", icon: TrendingUp, desc: "变化率与噪声放大" },
  { id: "integration", name: "3. 积分沙盒", icon: BarChart3, desc: "数值积分与累加" },
  { id: "filter", name: "4. 滤波拟合", icon: Filter, desc: "先降噪再求导" },
  { id: "applications", name: "5. 实战应用", icon: Briefcase, desc: "图像/传感器/金融/ROC/流形" },
  { id: "code_engine", name: "6. 代码引擎", icon: Code2, desc: "Python/Pandas源码" },
  { id: "ai_diagnosis", name: "7. AI 诊断", icon: BrainCircuit, desc: "噪声与漂移诊断" },
  { id: "export_report", name: "8. 成果导出", icon: FileSpreadsheet, desc: "报告与数据集" },
  { id: "knowledge_guide", name: "9. 知识导引", icon: GraduationCap, desc: "概念与术语速查" },
] as const;

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Brand Bar */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  数据微积分实验室
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/60">
                  Data Calculus Lab v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                从离散差分与微分到累加和与数值积分的可视化分析与算法引擎
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              内核: <span className="font-mono text-xs font-medium text-slate-800">NumPy / SciPy 1.2</span>
            </div>
            <button
              onClick={() => setActiveTab("ai_diagnosis")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 智能诊断
            </button>
          </div>
        </div>

        {/* 8 Module Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = activeTab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id as ModuleTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
