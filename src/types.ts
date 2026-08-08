export type SignalPreset =
  | "sine_composite"
  | "polynomial"
  | "sensor_accel"
  | "financial_stock"
  | "gaussian_peak"
  | "chirp_wave"
  | "roc_dataset";

export type DiffMethod = "forward" | "backward" | "central";

export type IntMethod = "left_rect" | "right_rect" | "trapezoidal" | "simpson" | "cumsum";

export type FilterMethod = "none" | "moving_average" | "savitzky_golay" | "cubic_spline";

export interface DataPoint {
  index: number;
  x: number;
  yRaw: number; // Clean signal
  yNoisy: number; // Signal with injected noise
  yFiltered: number; // Signal after filtering
  
  // Exact analytical values (when available)
  dyExact?: number;
  intExact?: number;

  // Numerical derivatives
  dyForward?: number;
  dyBackward?: number;
  dyCentral?: number;
  dySelected?: number;

  // Numerical integrals
  intCumsum?: number;
  intTrapezoid?: number;
  intSimpson?: number;
  intSelected?: number;

  // Error terms
  dyError?: number;
  intError?: number;
}

export interface SliceBounds {
  startIdx: number;
  endIdx: number;
  startX: number;
  endX: number;
}

export interface AiDiagnosisResult {
  noiseRiskLevel: "低" | "中" | "高" | "极高";
  noiseRiskScore: number;
  driftRiskLevel: "低" | "中" | "高" | "极高";
  driftRiskScore: number;
  derivativeDiagnosis: string;
  integralDiagnosis: string;
  recommendedFilterPipeline: string;
  mathematicalInsight: string;
  actionableSteps: string[];
}

export interface RealWorldAppConfig {
  appType: "sobel" | "sensor" | "roc" | "finance";
  
  // Sobel image settings
  sobelThreshold: number;
  imagePattern: "box" | "circle" | "diagonal" | "checkerboard";

  // Sensor double integration settings
  accelBias: number;
  enableZupt: boolean; // Zero Velocity Update
  initialVelocity: number;
  initialDisplacement: number;

  // ROC/AUC settings
  positiveClassRatio: number;
  classifierQuality: number; // 0.5 (random) to 0.99 (excellent)

  // Finance settings
  driftRate: number;
  volatility: number;
}
