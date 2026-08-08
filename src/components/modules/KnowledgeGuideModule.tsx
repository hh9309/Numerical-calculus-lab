import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Filter,
  Briefcase,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  Info,
  Layers,
  Zap,
  ShieldCheck,
  Compass,
  ArrowRight,
  GraduationCap,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Tag,
  Scale,
} from "lucide-react";
import { MathFormula } from "../MathFormula";

type TermCategory =
  | "all"
  | "discrete"
  | "difference"
  | "integration"
  | "filter"
  | "manifold"
  | "applications"
  | "tradeoffs";

interface TermItem {
  id: string;
  nameZh: string;
  nameEn: string;
  category: TermCategory;
  categoryLabel: string;
  formulaLatex?: string;
  orderOfAccuracy?: string;
  definition: string;
  physicalMeaning: string;
  labApplication: string;
  keyRisk: string;
  bestPractice: string;
  tags: string[];
}

const KNOWLEDGE_TERMS: TermItem[] = [
  {
    id: "dx_sampling",
    nameZh: "采样步长与离散化",
    nameEn: "Sampling Step Size (Δx)",
    category: "discrete",
    categoryLabel: "离散本质",
    formulaLatex: "\\Delta x = \\frac{x_{\\max} - x_{\\min}}{N - 1}, \\quad x_i = x_{\\min} + i \\cdot \\Delta x",
    orderOfAccuracy: "离散逼近基元",
    definition: "将连续实数域上的连续函数 f(x) 映射为有限点集 { (x_i, y_i) } 的空间离散分割间距。",
    physicalMeaning: "离散微积分中物理测量仪器的采样周期（如 100Hz 传感器采样即 Δt=0.01s）。决定奈奎斯特 (Nyquist) 采样定理限界。",
    labApplication: "离散本质沙盒：调节采样点数 N (10 ~ 500) 观察割线渐近趋近切线的微积分极限过程。",
    keyRisk: "步长 Δx 过大导致高频信号欠采样锯齿畸变；过小增加计算开销且放大浮点数舍入误差 (Round-off Error)。",
    bestPractice: "确保采样频率满足 f_s ≥ 2 · f_max，并在高频段配置抗混叠 (Anti-Aliasing) 低通滤波。",
    tags: ["采样定理", "离散化", "奈奎斯特", "网格分割"],
  },
  {
    id: "central_diff",
    nameZh: "中心差分求导",
    nameEn: "Central Difference Derivative",
    category: "difference",
    categoryLabel: "差分求导",
    formulaLatex: "f'(x_i) \\approx \\frac{f(x_{i+1}) - f(x_{i-1})}{2 \\Delta x} - \\frac{f'''(\\xi)}{6} \\Delta x^2",
    orderOfAccuracy: "O(Δx²) 截断误差",
    definition: "利用自变量双侧对称节点 (x_{i+1} 与 x_{i-1}) 的函数值相减逼近一点处的瞬时导数。",
    physicalMeaning: "相较于单侧前向/后向差分，中心差分利用泰勒展开抵消了二次方奇数项，使逼近精度从一阶提升至二阶。",
    labApplication: "差分沙盒：作为默认高精度离散求导算法，用于平滑信号的导数极值与驻点计算。",
    keyRisk: "对高频高斯噪声极敏感；无法计算边界端点 (i=0 与 i=N-1) 的导数，需端点退化处理。",
    bestPractice: "在输入信号包含高频噪声时，切勿直接使用中心差分，必须先进行 Savitzky-Golay 卷积平滑。",
    tags: ["二阶精度", "中心差分", "泰勒展开", "截断误差"],
  },
  {
    id: "noise_amplification",
    nameZh: "高频噪声微分放大效应",
    nameEn: "High-Frequency Noise Amplification",
    category: "difference",
    categoryLabel: "差分求导",
    formulaLatex: "\\frac{d}{dx} [f(x) + A \\sin(\\omega x)] = f'(x) + A \\cdot \\omega \\cos(\\omega x)",
    orderOfAccuracy: "噪点放大比 ∝ 2/Δx",
    definition: "离散求导本质上为高通滤波器，频率为 ω 的微小噪声幅值在求导后会被乘以频率因子 ω。",
    physicalMeaning: "即便原始信号中仅有 1% 的高频噪点，微分后噪点幅度会被放大十倍甚至百倍，导致导数曲线完全被噪点淹没。",
    labApplication: "差分沙盒与 AI 诊断：可视化显示噪声注入强度 σ 从 0.01 升至 0.2 时，差分 RMSE 剧烈飙升现象。",
    keyRisk: "直接对未经滤波处理的工业传感器原始加速度或电压信号进行微分会导致逻辑崩塌。",
    bestPractice: "采用“先低通平滑降噪，再离散微分”的黄金处理链路 (Filtering-then-Differentiation Pipeline)。",
    tags: ["噪声放大", "高通滤波", "信号处理", "数值不稳定性"],
  },
  {
    id: "trapezoidal_int",
    nameZh: "复合梯形数值积分",
    nameEn: "Composite Trapezoidal Integration",
    category: "integration",
    categoryLabel: "数值积分",
    formulaLatex: "\\int_{a}^{b} f(x) dx \\approx \\sum_{i=0}^{N-1} \\frac{f(x_i) + f(x_{i+1})}{2} \\Delta x",
    orderOfAccuracy: "O(Δx²) 代数精度 1 阶",
    definition: "将连续定积分曲边梯形面积分割为 N 个离散直线梯形微元面积之和。",
    physicalMeaning: "数值积分具备天然的高频低通滤波特性，能够相互抵消均值为 0 的正负高斯随机噪点。",
    labApplication: "积分沙盒：展示复合梯形累加和计算与原函数精确曲边面积的快速收敛。",
    keyRisk: "在强高频振荡函数上存在截断凹凸偏差；对持续 DC 常数偏移不具备自修正能力。",
    bestPractice: "常态化数值积分的首选平衡算法，计算复杂度为 O(N)，适合实时流式数据计算。",
    tags: ["梯形公式", "数值求积", "低通滤波", "曲边面积"],
  },
  {
    id: "simpson_int",
    nameZh: "Simpson 三点二次抛物线积分",
    nameEn: "Composite Simpson's 1/3 Rule",
    category: "integration",
    categoryLabel: "数值积分",
    formulaLatex: "\\int_{x_0}^{x_2} f(x)dx \\approx \\frac{\\Delta x}{3} [f(x_0) + 4 f(x_1) + f(x_2)]",
    orderOfAccuracy: "O(Δx⁴) 代数精度 3 阶",
    definition: "每三个相邻节点利用二次抛物线局部拟合函数曲线进行曲边微元求积的高阶积分算法。",
    physicalMeaning: "利用二次多项式逼近高阶弯曲函数，极大幅度降低几何曲率带来的梯形截断割线偏差。",
    labApplication: "积分沙盒：高精度平滑信号定积分计算，在较小采样点数下即可达成高位数精度。",
    keyRisk: "要求采样节点数为奇数（区间微元数为偶数）；对非光滑或离散断点函数可能出现 Runge 振荡。",
    bestPractice: "适用于已知光滑高阶多项式或高精度实验室离散数据集的定积分离线高精求解。",
    tags: ["Simpson算法", "高阶抛物线", "四阶精度", "高精求积"],
  },
  {
    id: "cumulative_drift",
    nameZh: "积分长程累积漂移",
    nameEn: "Long-Term Cumulative Drift",
    category: "integration",
    categoryLabel: "数值积分",
    formulaLatex: "x(t) = \\int_0^t \\int_0^t [a(\\tau) + b_0] d\\tau^2 = x_{\\text{true}}(t) + \\frac{1}{2} b_0 t^2",
    orderOfAccuracy: "二次抛物线形发散",
    definition: "在微元累加积分过程中，被积函数中的微小直流偏置 (DC Bias) 被时间二次乘方放大引起的曲线失真。",
    physicalMeaning: "惯性导航 (IMU) 加速度计若存在微小零偏 0.05 m/s²，二次积分推算位移在 100 秒后将产生高达 250 米的致命累积漂移。",
    labApplication: "传感器二次积分实战：对比开启/关闭 ZUPT 零速修正下位移曲线的显著收敛效果。",
    keyRisk: "长时二次积分会导致数值彻底脱离真实轨迹，呈二次抛物线抛向无穷大。",
    bestPractice: "结合零速更新 (ZUPT)、卡尔曼滤波 (EKF) 或定期 GPS 绝对坐标锚定修正。",
    tags: ["累积漂移", "IMU惯导", "零偏修正", "ZUPT"],
  },
  {
    id: "savitzky_golay",
    nameZh: "Savitzky-Golay 卷积多项式平滑",
    nameEn: "Savitzky-Golay Filter (S-G Filter)",
    category: "filter",
    categoryLabel: "滤波拟合",
    formulaLatex: "y_i^* = \\sum_{m=-M}^{M} c_m \\cdot y_{i+m}",
    orderOfAccuracy: "局部最小二乘多项式",
    definition: "在局部移动窗口内利用低阶多项式通过最小二乘法拟合数据集，推导出固定卷积系数核进行平滑。",
    physicalMeaning: "相较于简单滑动平均 (Moving Average) 破坏波峰与高频细节，S-G 滤波能完美保留峰值形状与高阶导数特征。",
    labApplication: "滤波拟合模块与 AI 诊断：求导前必备的预滤波算法，将求导 RMSE 降低 90% 以上。",
    keyRisk: "窗口宽度 M 与多项式阶数 k 选择不当会导致过平滑或过拟合；边缘端点窗口未满需要外推。",
    bestPractice: "通常选用 2 阶或 4 阶多项式，滑动窗口取 5 ~ 15 个采样点。",
    tags: ["SG滤波", "卷积平滑", "保峰滤波", "最小二乘"],
  },
  {
    id: "cubic_spline",
    nameZh: "三次样条插值与连续重构",
    nameEn: "Cubic Spline Interpolation",
    category: "filter",
    categoryLabel: "滤波拟合",
    formulaLatex: "S_i(x) = a_i + b_i(x - x_i) + c_i(x - x_i)^2 + d_i(x - x_i)^3",
    orderOfAccuracy: "C² 二阶连续可导",
    definition: "在相邻离散点区间内建立三次多项式，保证一阶导数（切线）与二阶导数（曲率）在节点处全局连续。",
    physicalMeaning: "将稀疏不规则的离散数据点重构为处处光滑、可无限求导的连续可微函数曲线。",
    labApplication: "滤波拟合与代码引擎：展示离散重构连续曲线后的高阶解析微分计算。",
    keyRisk: "在陡峭台阶信号处可能产生过冲振荡 (Runge Phenomenon)；解三对角矩阵三阶方程组计算量较大。",
    bestPractice: "适用于非均匀采样重采样、动画轨迹光滑插值与高精度机械臂路径规划。",
    tags: ["三次样条", "C2连续", "曲线重构", "高阶光滑"],
  },
  {
    id: "sobel_gradient",
    nameZh: "Sobel 图像二维离散偏导算子",
    nameEn: "Sobel 2D Discrete Gradient Operator",
    category: "applications",
    categoryLabel: "实战应用",
    formulaLatex: "G_x = \\begin{bmatrix} -1 & 0 & 1 \\\\ -2 & 0 & 2 \\\\ -1 & 0 & 1 \\end{bmatrix} * I, \\quad |\\nabla I| = \\sqrt{G_x^2 + G_y^2}",
    orderOfAccuracy: "二维空间离散偏导",
    definition: "结合高斯平滑与差分求导的 3x3 空间卷积核，计算图像灰度矩阵在水平与垂直方向的各向异性偏导数。",
    physicalMeaning: "图像中物体的边界对应像素灰度剧烈变化的转折点，即偏导数幅值 |∇I| 出现峰值极值的区域。",
    labApplication: "实战应用切片 1：通过二维矩阵阈值分割从灰度图像中高亮提取物体边缘边界。",
    keyRisk: "对高频椒盐噪声敏感；核尺寸 3x3 在粗粒度大纹理图像上边缘响应较粗糙。",
    bestPractice: "先使用高斯核进行图像降噪 (Gaussian Blur)，再应用 Sobel 或 Canny 边缘检测算子。",
    tags: ["Sobel算子", "图像边缘检测", "二维梯度", "空间卷积"],
  },
  {
    id: "auc_trapezoid",
    nameZh: "ROC 曲线 AUC 梯形数值求积",
    nameEn: "ROC Area Under Curve (AUC)",
    category: "applications",
    categoryLabel: "实战应用",
    formulaLatex: "\\text{AUC} = \\sum_{i=1}^{M-1} \\frac{\\text{TPR}_i + \\text{TPR}_{i+1}}{2} \\cdot (\\text{FPR}_{i+1} - \\text{FPR}_i)",
    orderOfAccuracy: "非均匀网格数值积分",
    definition: "通过扫过分类阈值，对真阳性率 (TPR) 关于假阳性率 (FPR) 的离散曲线进行复合梯形积分得到的全局评价标量。",
    physicalMeaning: "AUC 衡量二分类模型随机抽取一个正样本和负样本时，正样本预测概率高于负样本的概率（取值 0.5 ~ 1.0）。",
    labApplication: "实战应用切片 3：展示不同分类器质量下 ROC 曲线积分面积的动态计算与性能等级划分。",
    keyRisk: "分类阈值采样过于稀疏会导致梯形积分估算偏低；正负样本极度不平衡时 AUC 可能存在虚高。",
    bestPractice: "结合 PR 曲线 (Precision-Recall Curve) 积分与混淆矩阵综合评估极度不平衡数据集。",
    tags: ["AUC积分", "ROC曲线", "分类评估", "梯形求积"],
  },
  {
    id: "decision_manifold",
    nameZh: "分类决策流形与概率梯度",
    nameEn: "Classification Decision Manifold & Gradient",
    category: "manifold",
    categoryLabel: "流形拓扑",
    formulaLatex: "\\nabla P(C_k \\mid \\mathbf{x}) = \\left( \\frac{\\partial P}{\\partial x}, \\frac{\\partial P}{\\partial y} \\right), \\quad d^2P/dx^2 = 0 \\text{ (拐点)}",
    orderOfAccuracy: "高维空间软分类流形",
    definition: "由核概率模型在特征空间中生成的连续软分类概率曲面 P(x, y)，其梯度幅值刻画了决策分类的敏感区域。",
    physicalMeaning: "决策流形的陡峭程度代表模型分类的确定性，概率偏导数最高点即为分类决策边界 (Decision Boundary)。",
    labApplication: "实战应用切片 5：鸢尾花分类决策流形，可视化二阶导数过零点精确锁定 Softmax 决策拐点。",
    keyRisk: "平滑带宽 τ 过小导致决策流形产生陡峭尖锐死区（过拟合）；过大则混淆相邻类别边界。",
    bestPractice: "使用交叉验证 (Cross-Validation) 优化 RBF 葵花带宽 τ，最大化决策边界泛化边距 (Margin)。",
    tags: ["决策流形", "概率梯度", "Softmax拐点", "分类边界"],
  },
  {
    id: "geodesic_unfolding",
    nameZh: "测地线距离与流形拓扑展开",
    nameEn: "Geodesic Distance & Manifold Unfolding",
    category: "manifold",
    categoryLabel: "流形拓扑",
    formulaLatex: "d_G(\\mathbf{p}_a, \\mathbf{p}_b) = \\min_{\\gamma} \\int_a^b \\sqrt{g_{ij} \\dot{\\gamma}^i \\dot{\\gamma}^j} dt",
    orderOfAccuracy: "微分流形等距投影",
    definition: "沿弯曲数据流形表面最短路径积分计算的测地线距离，用于替代穿透高维空间的普通三维欧氏距离。",
    physicalMeaning: "在 Swiss Roll 卷轴流形上，两个看似靠近的点可能隔着几圈卷轴；测地线距离准确认知其沿流形表面的真实内在距离。",
    labApplication: "实战应用切片 6：数据流形邻域拓扑展开过程，展示 k-NN 邻域图在维持拓扑结构下的二维平面展开。",
    keyRisk: "k-NN 邻域半径 k 过大产生“短路”破坏流形拓扑；k 过小导致流形图分裂断连。",
    bestPractice: "采用 Isomap 算法利用 Dijkstra 最短路径搜索近似测地线距离矩阵，再通过 MDS 降维展开。",
    tags: ["测地线", "流形学习", "Isomap", "拓扑展开"],
  },
];

const ALGORITHM_COMPARISON_MATRIX = [
  {
    name: "前向/后向差分 (Forward/Backward Diff)",
    category: "数值求导",
    order: "O(Δx)",
    complexity: "O(N)",
    noiseResilience: "极差 (极易被高频噪声破坏)",
    bestScenario: "实时流式单向计算、边界端点",
    pros: "简单直观，单侧节点即可计算",
    cons: "一阶截断误差较大",
  },
  {
    name: "中心差分 (Central Difference)",
    category: "数值求导",
    order: "O(Δx²)",
    complexity: "O(N)",
    noiseResilience: "较差 (需预平滑)",
    bestScenario: "内部光滑节点的高精度瞬时导数",
    pros: "二阶对称精度，抵消奇数次误差项",
    cons: "无法计算边界点，依赖滤波预处理",
  },
  {
    name: "Savitzky-Golay + 中心差分",
    category: "滤波求导链路",
    order: "O(Δx²)",
    complexity: "O(N · W)",
    noiseResilience: "极佳 (有效抑制高频噪声)",
    bestScenario: "含高斯白噪声的工业/医学传感器数据",
    pros: "保峰平滑与高精度微分完美融合",
    cons: "需要调整窗口宽度 W 与阶数 k",
  },
  {
    name: "复合梯形积分 (Trapezoidal Rule)",
    category: "数值积分",
    order: "O(Δx²)",
    complexity: "O(N)",
    noiseResilience: "优秀 (具备天然高通噪声抵消)",
    bestScenario: "常态化实时定积分、面积计算",
    pros: "算法鲁棒，对点数无奇偶限制",
    cons: "低阶割线逼近，强弯曲函数需较小 Δx",
  },
  {
    name: "Simpson 抛物线积分 (Simpson's 1/3)",
    category: "数值积分",
    order: "O(Δx⁴)",
    complexity: "O(N)",
    noiseResilience: "良好",
    bestScenario: "已知光滑高阶函数的离线高精定积分",
    pros: "四阶收敛精度，极少点数达高位数精",
    cons: "要求区间切片节点数 N 为奇数",
  },
  {
    name: "ZUPT 修正二次积分 (ZUPT Double Int)",
    category: "惯导应用",
    order: "O(Δx²)",
    complexity: "O(N)",
    noiseResilience: "极佳 (消除二次方长程漂移)",
    bestScenario: "IMU 传感器加速度推算速度位移",
    pros: "有效阻断零偏引起的二次抛物线发散",
    cons: "需要依赖运动静止区间 trigger",
  },
];

const QUIZ_QUESTIONS = [
  {
    question: "为何直接对含高斯噪声的传感器信号进行离散求导会导致导数曲线严重失真？",
    options: [
      "A. 因为离散求导算子分母为 Δx，相当于高通滤波器，会将高频噪声乘上频率因子 ω 放大",
      "B. 因为数值求导会导致内存溢出舍入误差",
      "C. 因为采样定理要求离散信号不能求导",
      "D. 因为差分算法计算速度太慢",
    ],
    correctIdx: 0,
    explanation: "正确！离散求导算子的频域特性为 H(jw) = jw，其增益随频率线性增加。高频随机噪声在求导后幅值会被放大 2/Δx 倍，因此必须先用 S-G 卷积平滑降噪。",
  },
  {
    question: "在惯性导航 IMU 传感器中，加速度二次积分推算位移时最致命的数值问题是什么？",
    options: [
      "A. 内存占用过大",
      "B. 加速度零偏 b0 导致位移产生 1/2 · b0 · t² 的抛物线形长程累积漂移",
      "C. 梯形积分无法计算负数加速度",
      "D. 高斯噪声被积分完全消除了，导致没有噪声",
    ],
    correctIdx: 1,
    explanation: "正确！数值积分虽然能消除零均值高斯噪声，但无法消除 DC 零偏。常数零偏在二次积分下会随时间 t 的平方二次累加，必须开启 ZUPT 零速修正。",
  },
  {
    question: "Savitzky-Golay 卷积滤波相比普通滑动平均 (Moving Average) 滤波的核心优势是什么？",
    options: [
      "A. 代码更简单",
      "B. 能够更好地保留信号的峰值高频形状与高阶导数特征，避免波峰削平与过渡抹平",
      "C. 只能用于一维信号，无法用于二维",
      "D. 完全不需要任何参数设置",
    ],
    correctIdx: 1,
    explanation: "正确！S-G 滤波在移动窗口内拟合低阶多项式，相比简单算术平均，能够最大限度保持波峰波谷高度与微分变化率特征。",
  },
];

export const KnowledgeGuideModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TermCategory>("all");
  const [expandedTermId, setExpandedTermId] = useState<string | null>("noise_amplification");
  
  // Interactive Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);

  // Filtered Terms List
  const filteredTerms = useMemo(() => {
    return KNOWLEDGE_TERMS.filter((term) => {
      const matchCat = selectedCategory === "all" || term.category === selectedCategory;
      const matchSearch =
        searchTerm.trim() === "" ||
        term.nameZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  const categories: { id: TermCategory; label: string; icon: any }[] = [
    { id: "all", label: "全部知识条目", icon: Layers },
    { id: "discrete", label: "1. 离散本质", icon: BookOpen },
    { id: "difference", label: "2. 差分求导", icon: TrendingUp },
    { id: "integration", label: "3. 数值积分", icon: BarChart3 },
    { id: "filter", label: "4. 滤波拟合", icon: Filter },
    { id: "applications", label: "5. 经典实战", icon: Briefcase },
    { id: "manifold", label: "6. 流形拓扑", icon: Compass },
    { id: "tradeoffs", label: "7. 算法矩阵", icon: Scale },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Module Master Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  9. 知识导引切片 (Numerical Calculus Knowledge Guide)
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  概念与术语速查手册
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                深度解构数值微积分核心术语、数学公式推导、截断误差收敛阶、工程风险与算力权衡矩阵
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">知识条目: {KNOWLEDGE_TERMS.length} 项</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              交互式自测与术语检索
            </span>
          </div>
        </div>

        {/* Search & Category Filter Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索术语、公式或标签 (如: 噪点、S-G、梯形)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      {selectedCategory !== "tradeoffs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Detailed Knowledge Cards List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>找到 {filteredTerms.length} 个相关知识词条</span>
              {searchTerm && <span>搜索关键字: "{searchTerm}"</span>}
            </div>

            {filteredTerms.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-600 text-sm font-semibold">未找到匹配的知识词条</p>
                <p className="text-xs text-slate-400">尝试清空搜索框或切换顶部知识分类标签</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  重置筛选条件
                </button>
              </div>
            ) : (
              filteredTerms.map((term) => {
                const isExpanded = expandedTermId === term.id;
                return (
                  <div
                    key={term.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-indigo-300 shadow-xs ring-1 ring-indigo-200"
                        : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Card Header Bar */}
                    <div
                      onClick={() => setExpandedTermId(isExpanded ? null : term.id)}
                      className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{term.nameZh}</span>
                          <span className="text-xs text-slate-400 font-mono">({term.nameEn})</span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {term.categoryLabel}
                          </span>
                          {term.orderOfAccuracy && (
                            <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                              {term.orderOfAccuracy}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{term.definition}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 text-xs">
                        {/* Formula TeX Section */}
                        {term.formulaLatex && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">核心表达公式:</span>
                            <MathFormula latex={term.formulaLatex} block />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Definition & Physical Meaning */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              概念定义与数学原理
                            </div>
                            <p className="text-slate-600 leading-relaxed">{term.definition}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              物理直观与几何直觉
                            </div>
                            <p className="text-slate-600 leading-relaxed">{term.physicalMeaning}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Risk & Best Practice */}
                          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1.5">
                            <div className="font-bold text-rose-900 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-rose-600" />
                              潜在工程风险与陷阱
                            </div>
                            <p className="text-rose-800 leading-relaxed">{term.keyRisk}</p>
                          </div>

                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              最佳实践与优化方案
                            </div>
                            <p className="text-emerald-800 leading-relaxed">{term.bestPractice}</p>
                          </div>
                        </div>

                        {/* Lab Application Mapping */}
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-indigo-950">
                          <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>本实验室对应切片：</strong> {term.labApplication}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {term.tags.map((tag, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right 1 Column: Interactive Knowledge Self-Test & Formula Quick Reference */}
          <div className="space-y-6">
            {/* Interactive Concept Quiz Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  知识掌控力自测 (Concept Self-Test)
                </h3>
                <span className="font-mono text-[10px] text-slate-400">
                  {currentQuizIdx + 1} / {QUIZ_QUESTIONS.length}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {QUIZ_QUESTIONS[currentQuizIdx].question}
                </p>

                <div className="space-y-2">
                  {QUIZ_QUESTIONS[currentQuizIdx].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === QUIZ_QUESTIONS[currentQuizIdx].correctIdx;
                    let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";

                    if (showQuizExplanation) {
                      if (isCorrect) btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold";
                      else if (isSelected && !isCorrect) btnStyle = "bg-rose-50 border-rose-300 text-rose-800";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedOption(idx);
                          setShowQuizExplanation(true);
                        }}
                        disabled={showQuizExplanation}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${btnStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {showQuizExplanation && (
                  <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 space-y-2 text-xs">
                    <p className="text-indigo-900 font-medium">
                      {selectedOption === QUIZ_QUESTIONS[currentQuizIdx].correctIdx ? "🎉 回答正确！" : "❌ 选错了，看下解析吧："}
                    </p>
                    <p className="text-indigo-800 leading-relaxed text-[11px]">
                      {QUIZ_QUESTIONS[currentQuizIdx].explanation}
                    </p>
                    <button
                      onClick={() => {
                        setShowQuizExplanation(false);
                        setSelectedOption(null);
                        setCurrentQuizIdx((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      下一题 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Master Formula Reference Box */}
            <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-3">
              <h3 className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                数值微积分三大核心对立统一定理
              </h3>

              <div className="space-y-3 text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-3">
                <div>
                  <span className="text-indigo-400 block font-bold">1. 微积分基本定理 (FTC):</span>
                  <MathFormula latex="\int_a^b f'(x) dx = f(b) - f(a)" block className="text-white" />
                  <p className="text-[10px] text-slate-400 mt-1">离散含义：差分后的累加和等于首尾离散端点值之差。</p>
                </div>

                <div>
                  <span className="text-emerald-400 block font-bold">2. 高通与低通算子对偶性:</span>
                  <MathFormula latex="\text{Diff} \leftrightarrow \text{High-Pass (Amplifies Noise)}, \quad \text{Int} \leftrightarrow \text{Low-Pass (Smoothes Noise)}" block className="text-white" />
                  <p className="text-[10px] text-slate-400 mt-1">求导放大幅值噪声；求积相互抵消随机噪点。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Trade-offs & Algorithm Comparison Matrix View */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              7. 数值微积分核心算法性能与精度对比矩阵 (Algorithm Trade-off Matrix)
            </h3>
            <p className="text-xs text-slate-500">
              横向对比算法截断误差收敛阶、计算时间复杂度、抗噪能力与推荐工程落地场景
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">算法名称</th>
                  <th className="py-3 px-4">分类</th>
                  <th className="py-3 px-4">截断误差阶</th>
                  <th className="py-3 px-4">时间复杂度</th>
                  <th className="py-3 px-4">抗噪性能</th>
                  <th className="py-3 px-4">核心优势与局限</th>
                  <th className="py-3 px-4">推荐落地场景</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {ALGORITHM_COMPARISON_MATRIX.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.order}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.complexity}</td>
                    <td className="py-3 px-4 font-medium">{item.noiseResilience}</td>
                    <td className="py-3 px-4 text-slate-600 leading-normal text-[11px]">
                      <div><strong className="text-emerald-700">优:</strong> {item.pros}</div>
                      <div><strong className="text-rose-600">局限:</strong> {item.cons}</div>
                    </td>
                    <td className="py-3 px-4 text-indigo-900 font-semibold">{item.bestScenario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
