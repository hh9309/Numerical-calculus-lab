import { DataPoint, DiffMethod, IntMethod, FilterMethod, SignalPreset } from "../types";

/**
 * Generates raw signal data points along with analytical derivative and integral values
 */
export function generateBaseSignal(
  preset: SignalPreset,
  count: number = 100,
  xMin: number = 0,
  xMax: number = 10,
  noiseLevel: number = 0.05
): DataPoint[] {
  const dx = (xMax - xMin) / (count - 1);
  const points: DataPoint[] = [];

  for (let i = 0; i < count; i++) {
    const x = xMin + i * dx;
    let yRaw = 0;
    let dyExact = 0;
    let intExact = 0;

    switch (preset) {
      case "sine_composite":
        // f(x) = sin(x) + 0.5 * sin(3x)
        yRaw = Math.sin(x) + 0.5 * Math.sin(3 * x);
        dyExact = Math.cos(x) + 1.5 * Math.cos(3 * x);
        intExact = (1 - Math.cos(x)) + (0.5 / 3) * (1 - Math.cos(3 * x));
        break;

      case "polynomial":
        // f(x) = 0.1*x^3 - 0.8*x^2 + 1.5*x + 1
        yRaw = 0.1 * Math.pow(x, 3) - 0.8 * Math.pow(x, 2) + 1.5 * x + 1;
        dyExact = 0.3 * Math.pow(x, 2) - 1.6 * x + 1.5;
        intExact = 0.025 * Math.pow(x, 4) - (0.8 / 3) * Math.pow(x, 3) + 0.75 * Math.pow(x, 2) + x;
        break;

      case "sensor_accel":
        // Simulated acceleration: a(t) = -9.81 + 2.5 * sin(2*PI*0.5*t) * exp(-0.1*t)
        yRaw = -9.81 + 3.0 * Math.sin(Math.PI * x) * Math.exp(-0.2 * x);
        dyExact = 3.0 * (Math.PI * Math.cos(Math.PI * x) - 0.2 * Math.sin(Math.PI * x)) * Math.exp(-0.2 * x);
        intExact = -9.81 * x + (3.0 / (Math.PI * Math.PI + 0.04)) * (Math.PI - (Math.PI * Math.cos(Math.PI * x) + 0.2 * Math.sin(Math.PI * x)) * Math.exp(-0.2 * x));
        break;

      case "financial_stock":
        // Simulated stock trajectory: trend + cycles + drift
        yRaw = 100 + 15 * Math.sin(0.8 * x) + 3 * x;
        dyExact = 12 * Math.cos(0.8 * x) + 3;
        intExact = 100 * x - (15 / 0.8) * (Math.cos(0.8 * x) - 1) + 1.5 * x * x;
        break;

      case "gaussian_peak":
        // f(x) = exp(-((x-5)^2)/2)
        const mean = (xMin + xMax) / 2;
        const sigma = (xMax - xMin) / 6;
        const norm = (x - mean) / sigma;
        yRaw = Math.exp(-0.5 * norm * norm);
        dyExact = -norm * (1 / sigma) * yRaw;
        // Approximation for Gaussian integral using error function-like steps
        intExact = sigma * Math.sqrt(Math.PI / 2) * (1 + erf(norm / Math.SQRT2));
        break;

      case "chirp_wave":
        // f(x) = sin(0.2 * x^2)
        yRaw = Math.sin(0.2 * x * x);
        dyExact = 0.4 * x * Math.cos(0.2 * x * x);
        intExact = 0; // Approximated numerically
        break;

      case "roc_dataset":
        // Sigmoidal curve for ROC
        yRaw = 1 / (1 + Math.exp(-2 * (x - 5)));
        dyExact = 2 * yRaw * (1 - yRaw);
        intExact = (1 / 2) * Math.log(1 + Math.exp(2 * (x - 5)));
        break;
    }

    // Add pseudo-random Gaussian noise
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const gNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const yNoisy = yRaw + gNoise * noiseLevel;

    points.push({
      index: i,
      x,
      yRaw,
      yNoisy,
      yFiltered: yNoisy, // Default to yNoisy until filtered
      dyExact,
      intExact,
    });
  }

  return points;
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation for error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Apply filtering/denoising to signal points
 */
export function applyFilter(points: DataPoint[], method: FilterMethod, windowSize: number = 5): DataPoint[] {
  const result = points.map((p) => ({ ...p }));
  const n = result.length;

  if (method === "none" || n < 3) {
    return result;
  }

  if (method === "moving_average") {
    const half = Math.floor(windowSize / 2);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i - half; j <= i + half; j++) {
        if (j >= 0 && j < n) {
          sum += result[j].yNoisy;
          count++;
        }
      }
      result[i].yFiltered = sum / count;
    }
  } else if (method === "savitzky_golay") {
    // 5-point Savitzky-Golay quadratic/cubic smoothing coefficients:
    // [-3, 12, 17, 12, -3] / 35
    for (let i = 0; i < n; i++) {
      if (i >= 2 && i < n - 2) {
        const y0 = result[i - 2].yNoisy;
        const y1 = result[i - 1].yNoisy;
        const y2 = result[i].yNoisy;
        const y3 = result[i + 1].yNoisy;
        const y4 = result[i + 2].yNoisy;
        result[i].yFiltered = (-3 * y0 + 12 * y1 + 17 * y2 + 12 * y3 - 3 * y4) / 35;
      } else if (i === 0 || i === n - 1) {
        result[i].yFiltered = result[i].yNoisy;
      } else {
        // Boundary fallback
        result[i].yFiltered = (result[i - 1].yNoisy + result[i].yNoisy + result[i + 1].yNoisy) / 3;
      }
    }
  } else if (method === "cubic_spline") {
    // Weighted smoothing spline approximation
    for (let i = 0; i < n; i++) {
      if (i > 0 && i < n - 1) {
        result[i].yFiltered = 0.25 * result[i - 1].yNoisy + 0.5 * result[i].yNoisy + 0.25 * result[i + 1].yNoisy;
      } else {
        result[i].yFiltered = result[i].yNoisy;
      }
    }
  }

  return result;
}

/**
 * Compute numerical derivatives across points
 */
export function computeDerivatives(
  points: DataPoint[],
  diffMethod: DiffMethod,
  useFiltered: boolean = true
): DataPoint[] {
  const result = points.map((p) => ({ ...p }));
  const n = result.length;
  if (n < 2) return result;

  for (let i = 0; i < n; i++) {
    const getY = (idx: number) => (useFiltered ? result[idx].yFiltered : result[idx].yNoisy);

    // Forward Difference: [y(i+1) - y(i)] / dx
    if (i < n - 1) {
      const dxFwd = result[i + 1].x - result[i].x;
      result[i].dyForward = (getY(i + 1) - getY(i)) / dxFwd;
    } else {
      result[i].dyForward = result[i - 1].dyForward;
    }

    // Backward Difference: [y(i) - y(i-1)] / dx
    if (i > 0) {
      const dxBwd = result[i].x - result[i - 1].x;
      result[i].dyBackward = (getY(i) - getY(i - 1)) / dxBwd;
    } else {
      result[i].dyBackward = result[1].dyBackward;
    }

    // Central Difference: [y(i+1) - y(i-1)] / (2*dx)
    if (i > 0 && i < n - 1) {
      const dxCent = result[i + 1].x - result[i - 1].x;
      result[i].dyCentral = (getY(i + 1) - getY(i - 1)) / dxCent;
    } else if (i === 0) {
      result[i].dyCentral = result[i].dyForward;
    } else {
      result[i].dyCentral = result[i].dyBackward;
    }

    // Assign selected derivative method
    switch (diffMethod) {
      case "forward":
        result[i].dySelected = result[i].dyForward;
        break;
      case "backward":
        result[i].dySelected = result[i].dyBackward;
        break;
      case "central":
        result[i].dySelected = result[i].dyCentral;
        break;
    }

    if (result[i].dyExact !== undefined && result[i].dySelected !== undefined) {
      result[i].dyError = Math.abs(result[i].dySelected! - result[i].dyExact!);
    }
  }

  return result;
}

/**
 * Compute numerical integrals across points
 */
export function computeIntegrals(
  points: DataPoint[],
  intMethod: IntMethod,
  useFiltered: boolean = true
): DataPoint[] {
  const result = points.map((p) => ({ ...p }));
  const n = result.length;
  if (n < 1) return result;

  const getY = (idx: number) => (useFiltered ? result[idx].yFiltered : result[idx].yNoisy);

  let cumsum = 0;
  let trapezoidSum = 0;
  let simpsonSum = 0;

  result[0].intCumsum = 0;
  result[0].intTrapezoid = 0;
  result[0].intSimpson = 0;
  result[0].intSelected = 0;

  for (let i = 1; i < n; i++) {
    const dx = result[i].x - result[i - 1].x;

    // Cumsum (Left Rectangle)
    cumsum += getY(i - 1) * dx;
    result[i].intCumsum = cumsum;

    // Trapezoidal rule: dx * (y[i-1] + y[i]) / 2
    trapezoidSum += (dx * (getY(i - 1) + getY(i))) / 2;
    result[i].intTrapezoid = trapezoidSum;

    // Composite Simpson's 1/3 Rule
    if (i % 2 === 0) {
      const dx2 = result[i].x - result[i - 2].x;
      const h = dx2 / 2;
      const stepSimpson = (h / 3) * (getY(i - 2) + 4 * getY(i - 1) + getY(i));
      simpsonSum += stepSimpson;
      result[i].intSimpson = simpsonSum;
    } else {
      result[i].intSimpson = trapezoidSum;
    }

    // Selected Integral Method
    switch (intMethod) {
      case "left_rect":
      case "cumsum":
        result[i].intSelected = result[i].intCumsum;
        break;
      case "right_rect":
        result[i].intSelected = result[i].intCumsum + getY(i) * dx;
        break;
      case "trapezoidal":
        result[i].intSelected = result[i].intTrapezoid;
        break;
      case "simpson":
        result[i].intSelected = result[i].intSimpson;
        break;
    }

    if (result[i].intExact !== undefined && result[i].intSelected !== undefined) {
      result[i].intError = Math.abs(result[i].intSelected! - result[i].intExact!);
    }
  }

  return result;
}

/**
 * 2D Sobel Operator & Image Edge Detection Matrix generator
 */
export function generate2DSobelGrid(pattern: "box" | "circle" | "diagonal" | "checkerboard", size: number = 10) {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (pattern === "box") {
        if (r >= 2 && r <= 7 && c >= 2 && c <= 7) grid[r][c] = 255;
      } else if (pattern === "circle") {
        const dr = r - size / 2;
        const dc = c - size / 2;
        if (dr * dr + dc * dc <= 12) grid[r][c] = 255;
      } else if (pattern === "diagonal") {
        if (r + c >= size - 1) grid[r][c] = 255;
      } else if (pattern === "checkerboard") {
        if ((Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0) grid[r][c] = 255;
      }
    }
  }

  // Sobel Kernel Horizontal (Gx) and Vertical (Gy)
  const Gx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const Gy = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const gradientX: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const gradientY: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const magnitude: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) {
      let gx = 0;
      let gy = 0;
      for (let kr = -1; kr <= 1; kr++) {
        for (let kc = -1; kc <= 1; kc++) {
          const val = grid[r + kr][c + kc];
          gx += val * Gx[kr + 1][kc + 1];
          gy += val * Gy[kr + 1][kc + 1];
        }
      }
      gradientX[r][c] = gx;
      gradientY[r][c] = gy;
      magnitude[r][c] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return { grid, gradientX, gradientY, magnitude };
}

/**
 * Sensor Double Integration: Acceleration a(t) -> Velocity v(t) -> Position x(t)
 */
export function computeSensorDoubleIntegration(
  accelPoints: { t: number; a: number }[],
  bias: number = 0.05,
  enableZupt: boolean = false
) {
  const n = accelPoints.length;
  const result: { t: number; aRaw: number; aCorrected: number; v: number; x: number; driftV: number }[] = [];

  let currentV = 0;
  let currentX = 0;
  let driftV = 0;

  for (let i = 0; i < n; i++) {
    const pt = accelPoints[i];
    const dt = i > 0 ? pt.t - accelPoints[i - 1].t : 0.05;

    // Apply baseline bias correction
    const aCorrected = pt.a - bias;

    // Velocity integration: v_t = v_{t-1} + a_t * dt
    currentV += aCorrected * dt;
    driftV += pt.a * dt; // Pure drift without bias subtraction

    // Zero Velocity Update (ZUPT): If acceleration is static near rest, reset velocity
    if (enableZupt && Math.abs(aCorrected) < 0.08) {
      currentV *= 0.85; // Damping/resetting drift
    }

    // Displacement integration: x_t = x_{t-1} + v_t * dt
    currentX += currentV * dt;

    result.push({
      t: pt.t,
      aRaw: pt.a,
      aCorrected,
      v: currentV,
      x: currentX,
      driftV,
    });
  }

  return result;
}

/**
 * Calculate ROC Curve (FPR vs TPR) & Area Under Curve (AUC) via Trapezoidal Integration
 */
export function computeROCCurve(quality: number = 0.85) {
  const points: { fpr: number; tpr: number; threshold: number }[] = [];
  const steps = 50;

  for (let i = 0; i <= steps; i++) {
    const threshold = i / steps;
    // Simulated ROC trajectory curve based on classifier quality
    const fpr = Math.pow(1 - threshold, 2.5 / quality);
    const tpr = Math.pow(1 - threshold, quality * 0.8);

    points.push({
      fpr: Math.min(1, Math.max(0, fpr)),
      tpr: Math.min(1, Math.max(0, tpr)),
      threshold,
    });
  }

  // Sort by FPR ascending for trapezoidal AUC
  points.sort((a, b) => a.fpr - b.fpr);

  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const dFpr = points[i].fpr - points[i - 1].fpr;
    const avgTpr = (points[i].tpr + points[i - 1].tpr) / 2;
    auc += dFpr * avgTpr;
  }

  return { points, auc: Math.min(1, Math.max(0.5, auc)) };
}

/**
 * Calculate Financial Log Returns, Volatility and Cumulative Returns
 */
export function computeFinancialData(pricePoints: { t: number; price: number }[]) {
  const result: {
    t: number;
    price: number;
    logReturn: number;
    pctReturn: number;
    volatility: number;
    cumReturn: number;
    drawdown: number;
  }[] = [];

  let cumReturn = 1.0;
  let maxPriceSoFar = pricePoints[0]?.price || 100;

  for (let i = 0; i < pricePoints.length; i++) {
    const p = pricePoints[i];
    const prevP = i > 0 ? pricePoints[i - 1].price : p.price;

    const logReturn = Math.log(p.price / prevP);
    const pctReturn = (p.price - prevP) / prevP;

    cumReturn *= 1 + pctReturn;

    if (p.price > maxPriceSoFar) {
      maxPriceSoFar = p.price;
    }
    const drawdown = (p.price - maxPriceSoFar) / maxPriceSoFar;

    // 5-period rolling volatility
    let volSum = 0;
    let count = 0;
    for (let k = Math.max(0, i - 4); k <= i; k++) {
      const kPrev = k > 0 ? pricePoints[k - 1].price : pricePoints[k].price;
      const kRet = Math.log(pricePoints[k].price / kPrev);
      volSum += kRet * kRet;
      count++;
    }
    const volatility = Math.sqrt(volSum / count) * Math.sqrt(252); // Annualized

    result.push({
      t: p.t,
      price: p.price,
      logReturn,
      pctReturn,
      volatility,
      cumReturn,
      drawdown,
    });
  }

  return result;
}

/**
 * Compute root mean square error (RMSE) for derivatives
 */
export function computeRMSE(points: DataPoint[], key: "dySelected" | "intSelected", targetKey: "dyExact" | "intExact"): number {
  let sumSq = 0;
  let count = 0;
  for (const p of points) {
    const val = p[key];
    const target = p[targetKey];
    if (val !== undefined && target !== undefined && !isNaN(val) && !isNaN(target)) {
      sumSq += Math.pow(val - target, 2);
      count++;
    }
  }
  return count > 0 ? Math.sqrt(sumSq / count) : 0;
}

// ----------------------------------------------------------------------
// 1. Iris Decision Manifold Types & Generator
// ----------------------------------------------------------------------

export type IrisFeature = "petalLength" | "petalWidth" | "sepalLength" | "sepalWidth";

export const IRIS_FEATURE_LABELS: Record<IrisFeature, { nameZh: string; nameEn: string; unit: string }> = {
  petalLength: { nameZh: "花瓣长度", nameEn: "Petal Length", unit: "cm" },
  petalWidth: { nameZh: "花瓣宽度", nameEn: "Petal Width", unit: "cm" },
  sepalLength: { nameZh: "花萼长度", nameEn: "Sepal Length", unit: "cm" },
  sepalWidth: { nameZh: "花萼宽度", nameEn: "Sepal Width", unit: "cm" },
};

export interface IrisPoint {
  id: number;
  species: "setosa" | "versicolor" | "virginica";
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
  xVal: number; // Selected X feature value
  yVal: number; // Selected Y feature value
  predictedSpecies: "setosa" | "versicolor" | "virginica";
  confidence: number;
  neighbors: number[]; // Indices of topological k-NN neighbors
}

export interface IrisGridCell {
  x: number;
  y: number;
  pSetosa: number;
  pVersicolor: number;
  pVirginica: number;
  gradMagnitude: number; // |∇P| = sqrt((dP/dx)^2 + (dP/dy)^2)
  topSpecies: "setosa" | "versicolor" | "virginica";
}

export interface IrisSlicePoint {
  x: number; // Feature X value along fixed Feature Y
  pVersicolor: number;
  pVirginica: number;
  dp_dx: number; // dP/dx derivative
  d2p_dx2: number; // d^2 P / dx^2 second derivative
}

export interface IrisManifoldResult {
  points: IrisPoint[];
  grid: IrisGridCell[][];
  gridSize: number;
  slice: IrisSlicePoint[];
  accuracy: number;
  maxGradient: number;
  meanMargin: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xFeature: IrisFeature;
  yFeature: IrisFeature;
}

/**
 * Computes Iris dataset decision boundaries, probability density gradients, and 1D derivative slice
 * Supports 4 features selection (sepalLength, sepalWidth, petalLength, petalWidth)
 */
export function computeIrisDecisionManifold(
  noiseLevel: number = 0.05,
  bandwidth: number = 0.5,
  decisionThreshold: number = 0.5,
  xFeature: IrisFeature = "petalLength",
  yFeature: IrisFeature = "petalWidth"
): IrisManifoldResult {
  // Deterministic 150 Iris data points with all 4 botanical features
  const rawData: { species: "setosa" | "versicolor" | "virginica"; sl: number; sw: number; pl: number; pw: number }[] = [];
  
  // Setosa (N=50): Small petals, wide sepals
  for (let i = 0; i < 50; i++) {
    const pl = 1.46 + 0.18 * Math.sin(i * 1.3) + 0.15 * Math.cos(i * 2.1);
    const pw = 0.24 + 0.08 * Math.cos(i * 1.7);
    const sl = 5.01 + 0.35 * Math.sin(i * 0.9) + 0.2 * Math.cos(i * 1.5);
    const sw = 3.42 + 0.38 * Math.cos(i * 1.1) + 0.15 * Math.sin(i * 2.4);
    rawData.push({ species: "setosa", sl, sw, pl, pw });
  }
  // Versicolor (N=50): Medium petals & sepals
  for (let i = 0; i < 50; i++) {
    const pl = 4.26 + 0.45 * Math.sin(i * 0.9) + 0.25 * Math.cos(i * 2.3);
    const pw = 1.32 + 0.18 * Math.cos(i * 1.4);
    const sl = 5.94 + 0.52 * Math.sin(i * 1.2) + 0.22 * Math.cos(i * 1.8);
    const sw = 2.77 + 0.31 * Math.cos(i * 1.3) + 0.12 * Math.sin(i * 2.0);
    rawData.push({ species: "versicolor", sl, sw, pl, pw });
  }
  // Virginica (N=50): Large petals & sepals
  for (let i = 0; i < 50; i++) {
    const pl = 5.55 + 0.55 * Math.sin(i * 1.1) + 0.3 * Math.cos(i * 1.8);
    const pw = 2.02 + 0.22 * Math.cos(i * 1.2);
    const sl = 6.59 + 0.63 * Math.sin(i * 1.0) + 0.28 * Math.cos(i * 2.2);
    const sw = 2.97 + 0.32 * Math.cos(i * 1.5) + 0.14 * Math.sin(i * 1.9);
    rawData.push({ species: "virginica", sl, sw, pl, pw });
  }

  // RBF Kernel Softmax probability model in selected 2D feature space
  const getFeatureVal = (item: { sl: number; sw: number; pl: number; pw: number }, feat: IrisFeature) => {
    switch (feat) {
      case "sepalLength": return item.sl;
      case "sepalWidth": return item.sw;
      case "petalLength": return item.pl;
      case "petalWidth": return item.pw;
    }
  };

  const predictProbabilities = (x: number, y: number) => {
    let scoreSetosa = 0;
    let scoreVersicolor = 0;
    let scoreVirginica = 0;
    const bw2 = 2 * bandwidth * bandwidth;

    for (const p of rawData) {
      const px = getFeatureVal(p, xFeature);
      const py = getFeatureVal(p, yFeature);
      const dist2 = Math.pow(x - px, 2) + Math.pow(y - py, 2);
      const w = Math.exp(-dist2 / bw2);
      if (p.species === "setosa") scoreSetosa += w;
      else if (p.species === "versicolor") scoreVersicolor += w;
      else scoreVirginica += w;
    }

    const sum = scoreSetosa + scoreVersicolor + scoreVirginica + 1e-9;
    return {
      pSetosa: scoreSetosa / sum,
      pVersicolor: scoreVersicolor / sum,
      pVirginica: scoreVirginica / sum,
    };
  };

  // Build Iris points with noise
  let correctCount = 0;
  let totalMargin = 0;

  const points: IrisPoint[] = rawData.map((p, idx) => {
    const noisySl = p.sl + (Math.sin(idx * 3.1) * noiseLevel);
    const noisySw = p.sw + (Math.cos(idx * 2.5) * noiseLevel);
    const noisyPl = p.pl + (Math.sin(idx * 3.7) * noiseLevel);
    const noisyPw = p.pw + (Math.cos(idx * 2.9) * noiseLevel);

    const pointObj = {
      sl: parseFloat(noisySl.toFixed(2)),
      sw: parseFloat(noisySw.toFixed(2)),
      pl: parseFloat(noisyPl.toFixed(2)),
      pw: parseFloat(noisyPw.toFixed(2)),
    };

    const xVal = getFeatureVal(pointObj, xFeature);
    const yVal = getFeatureVal(pointObj, yFeature);

    const probs = predictProbabilities(xVal, yVal);

    let topSpecies: "setosa" | "versicolor" | "virginica" = "setosa";
    let maxP = probs.pSetosa;
    if (probs.pVersicolor > maxP) {
      topSpecies = "versicolor";
      maxP = probs.pVersicolor;
    }
    if (probs.pVirginica > maxP) {
      topSpecies = "virginica";
      maxP = probs.pVirginica;
    }

    if (topSpecies === p.species) correctCount++;
    totalMargin += (maxP - (1 - maxP));

    return {
      id: idx,
      species: p.species,
      sepalLength: pointObj.sl,
      sepalWidth: pointObj.sw,
      petalLength: pointObj.pl,
      petalWidth: pointObj.pw,
      xVal,
      yVal,
      predictedSpecies: topSpecies,
      confidence: parseFloat(maxP.toFixed(3)),
      neighbors: [],
    };
  });

  // Calculate 3-NN topological neighbors for each point
  for (let i = 0; i < points.length; i++) {
    const dists: { idx: number; d: number }[] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      // Distance across 4D normalized feature space
      const d = Math.sqrt(
        Math.pow(points[i].sepalLength - points[j].sepalLength, 2) +
        Math.pow(points[i].sepalWidth - points[j].sepalWidth, 2) +
        Math.pow(points[i].petalLength - points[j].petalLength, 2) +
        Math.pow(points[i].petalWidth - points[j].petalWidth, 2)
      );
      dists.push({ idx: j, d });
    }
    dists.sort((a, b) => a.d - b.d);
    points[i].neighbors = dists.slice(0, 3).map((item) => item.idx);
  }

  // Calculate dynamic axis range for grid
  const allX = points.map((p) => p.xVal);
  const allY = points.map((p) => p.yVal);
  const xMin = Math.floor(Math.min(...allX) * 10) / 10 - 0.2;
  const xMax = Math.ceil(Math.max(...allX) * 10) / 10 + 0.2;
  const yMin = Math.floor(Math.min(...allY) * 10) / 10 - 0.2;
  const yMax = Math.ceil(Math.max(...allY) * 10) / 10 + 0.2;

  // Build 2D Decision Grid (20x20)
  const gridSize = 20;
  const dxGrid = (xMax - xMin) / (gridSize - 1);
  const dyGrid = (yMax - yMin) / (gridSize - 1);

  const probGrid: { pSetosa: number; pVersicolor: number; pVirginica: number }[][] = [];
  for (let r = 0; r < gridSize; r++) {
    probGrid[r] = [];
    const y = yMin + r * dyGrid;
    for (let c = 0; c < gridSize; c++) {
      const x = xMin + c * dxGrid;
      probGrid[r][c] = predictProbabilities(x, y);
    }
  }

  // Compute 2D Decision Gradient |∇P| = sqrt((dP/dx)^2 + (dP/dy)^2) using central differences
  let maxGrad = 0;
  const grid: IrisGridCell[][] = [];

  for (let r = 0; r < gridSize; r++) {
    grid[r] = [];
    const y = yMin + r * dyGrid;
    for (let c = 0; c < gridSize; c++) {
      const x = xMin + c * dxGrid;
      const cur = probGrid[r][c];

      // Central difference for Virginica probability gradient as proxy
      const cPrev = c > 0 ? probGrid[r][c - 1].pVirginica : cur.pVirginica;
      const cNext = c < gridSize - 1 ? probGrid[r][c + 1].pVirginica : cur.pVirginica;
      const rPrev = r > 0 ? probGrid[r - 1][c].pVirginica : cur.pVirginica;
      const rNext = r < gridSize - 1 ? probGrid[r + 1][c].pVirginica : cur.pVirginica;

      const dp_dx = (cNext - cPrev) / (2 * dxGrid);
      const dp_dy = (rNext - rPrev) / (2 * dyGrid);
      const gradMag = Math.sqrt(dp_dx * dp_dx + dp_dy * dp_dy);
      if (gradMag > maxGrad) maxGrad = gradMag;

      let topSpecies: "setosa" | "versicolor" | "virginica" = "setosa";
      if (cur.pVersicolor > cur.pSetosa && cur.pVersicolor > cur.pVirginica) topSpecies = "versicolor";
      if (cur.pVirginica > cur.pSetosa && cur.pVirginica > cur.pVersicolor) topSpecies = "virginica";

      grid[r][c] = {
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        pSetosa: cur.pSetosa,
        pVersicolor: cur.pVersicolor,
        pVirginica: cur.pVirginica,
        gradMagnitude: parseFloat(gradMag.toFixed(3)),
        topSpecies,
      };
    }
  }

  // Compute 1D Slice along midpoint Y
  const fixedY = (yMin + yMax) / 2;
  const sliceCount = 60;
  const dxSlice = (xMax - xMin) / (sliceCount - 1);
  const rawSliceProbs: { x: number; pVersicolor: number; pVirginica: number }[] = [];

  for (let i = 0; i < sliceCount; i++) {
    const x = xMin + i * dxSlice;
    const probs = predictProbabilities(x, fixedY);
    rawSliceProbs.push({ x, pVersicolor: probs.pVersicolor, pVirginica: probs.pVirginica });
  }

  const slice: IrisSlicePoint[] = [];
  for (let i = 0; i < sliceCount; i++) {
    const x = rawSliceProbs[i].x;
    const pVir = rawSliceProbs[i].pVirginica;
    const pVer = rawSliceProbs[i].pVersicolor;

    const pPrev = i > 0 ? rawSliceProbs[i - 1].pVirginica : pVir;
    const pNext = i < sliceCount - 1 ? rawSliceProbs[i + 1].pVirginica : pVir;
    const dp_dx = (pNext - pPrev) / (2 * dxSlice);

    const d2p_dx2 = (pNext - 2 * pVir + pPrev) / (dxSlice * dxSlice);

    slice.push({
      x: parseFloat(x.toFixed(2)),
      pVersicolor: parseFloat(pVer.toFixed(3)),
      pVirginica: parseFloat(pVir.toFixed(3)),
      dp_dx: parseFloat(dp_dx.toFixed(3)),
      d2p_dx2: parseFloat(d2p_dx2.toFixed(3)),
    });
  }

  return {
    points,
    grid,
    gridSize,
    slice,
    accuracy: parseFloat(((correctCount / rawData.length) * 100).toFixed(1)),
    maxGradient: parseFloat(maxGrad.toFixed(3)),
    meanMargin: parseFloat((totalMargin / rawData.length).toFixed(3)),
    xMin,
    xMax,
    yMin,
    yMax,
    xFeature,
    yFeature,
  };
}

// ----------------------------------------------------------------------
// 2. Data Manifold Topology Unfolding Types & Generator
// ----------------------------------------------------------------------

export interface ManifoldPoint {
  id: number;
  s: number; // intrinsic parameter along roll [0, 1]
  v: number; // width parameter [0, 1]
  x3d: number;
  y3d: number;
  z3d: number;
  x2d: number; // unfolded 2D projection
  y2d: number;
  xMorph: number; // interpolated position based on unfolding t
  yMorph: number;
  zMorph: number;
  neighbors: number[]; // indices of k nearest neighbors
  localCurvature: number;
  geodesicDistFromOrigin: number;
  euclideanDistFromOrigin: number;
}

export interface ManifoldTopologyResult {
  points: ManifoldPoint[];
  distanceComparison: {
    pointPair: string;
    geodesicDist: number;
    euclideanDist: number;
    ratio: number;
  }[];
  avgCurvature: number;
  maxTangentSpeed: number;
}

/**
 * Computes 3D Swiss Roll / S-curve data manifold unfolding topology, k-NN graph, and metric tensor derivatives
 */
export function computeDataManifoldTopology(
  unfoldProgress: number = 0, // 0 to 100%
  kNN: number = 5,
  noiseLevel: number = 0.02,
  numPoints: number = 60
): ManifoldTopologyResult {
  const tMorph = unfoldProgress / 100;
  const rawPoints: { id: number; s: number; v: number; x3d: number; y3d: number; z3d: number }[] = [];

  // Generate 3D Swiss-Roll / S-Curve manifold points
  for (let i = 0; i < numPoints; i++) {
    const s = i / (numPoints - 1); // 0 to 1 intrinsic length
    const v = (i % 5) / 4;         // 0 to 1 intrinsic width

    // S-curve spiral parameterized equations
    const theta = 1.5 * Math.PI * (s + 0.1);
    const radius = 2.0 + 3.0 * s;

    const noiseX = (Math.sin(i * 4.3) * noiseLevel);
    const noiseY = (Math.cos(i * 3.1) * noiseLevel);
    const noiseZ = (Math.sin(i * 2.7) * noiseLevel);

    const x3d = radius * Math.cos(theta) + noiseX;
    const y3d = 4.0 * v - 2.0 + noiseY;
    const z3d = radius * Math.sin(theta) + noiseZ;

    rawPoints.push({ id: i, s, v, x3d, y3d, z3d });
  }

  // Compute Unfolded 2D tangent coordinates
  // Intrinsic length L = integral of radius d_theta
  const mappedPoints: ManifoldPoint[] = rawPoints.map((pt) => {
    // True arc length along spiral
    const arcLength = 8.5 * pt.s;
    const x2d = arcLength - 4.25;
    const y2d = pt.y3d;

    // Linear morph between 3D folded coordinates and 2D unfolded tangent space
    const xMorph = (1 - tMorph) * pt.x3d + tMorph * x2d;
    const yMorph = (1 - tMorph) * pt.y3d + tMorph * y2d;
    const zMorph = (1 - tMorph) * pt.z3d + tMorph * 0;

    // Geodesic distance along manifold parameter vs Euclidean distance in 3D
    const origin = rawPoints[0];
    const geodesicDist = 8.5 * Math.abs(pt.s - origin.s);
    const euclideanDist = Math.sqrt(
      Math.pow(pt.x3d - origin.x3d, 2) +
      Math.pow(pt.y3d - origin.y3d, 2) +
      Math.pow(pt.z3d - origin.z3d, 2)
    );

    // Local curvature kappa(s) ~ d^2 x / ds^2
    const theta = 1.5 * Math.PI * (pt.s + 0.1);
    const localCurvature = (1.5 * Math.PI) / (2.0 + 3.0 * pt.s);

    return {
      id: pt.id,
      s: parseFloat(pt.s.toFixed(3)),
      v: parseFloat(pt.v.toFixed(3)),
      x3d: parseFloat(pt.x3d.toFixed(2)),
      y3d: parseFloat(pt.y3d.toFixed(2)),
      z3d: parseFloat(pt.z3d.toFixed(2)),
      x2d: parseFloat(x2d.toFixed(2)),
      y2d: parseFloat(y2d.toFixed(2)),
      xMorph: parseFloat(xMorph.toFixed(2)),
      yMorph: parseFloat(yMorph.toFixed(2)),
      zMorph: parseFloat(zMorph.toFixed(2)),
      neighbors: [],
      localCurvature: parseFloat(localCurvature.toFixed(3)),
      geodesicDistFromOrigin: parseFloat(geodesicDist.toFixed(2)),
      euclideanDistFromOrigin: parseFloat(euclideanDist.toFixed(2)),
    };
  });

  // Calculate k-NN neighbors based on Geodesic manifold proximity
  let totalCurv = 0;
  for (let i = 0; i < mappedPoints.length; i++) {
    totalCurv += mappedPoints[i].localCurvature;
    const dists: { idx: number; dGeo: number }[] = [];

    for (let j = 0; j < mappedPoints.length; j++) {
      if (i === j) continue;
      const dGeo = Math.abs(mappedPoints[i].s - mappedPoints[j].s) + Math.abs(mappedPoints[i].v - mappedPoints[j].v);
      dists.push({ idx: j, dGeo });
    }

    dists.sort((a, b) => a.dGeo - b.dGeo);
    mappedPoints[i].neighbors = dists.slice(0, kNN).map((d) => d.idx);
  }

  // Selected distance comparison pairs (Point 0 -> Point 15, Point 30, Point 45, Point 59)
  const compareIndices = [15, 30, 45, 55];
  const distanceComparison = compareIndices.map((targetIdx) => {
    const target = mappedPoints[Math.min(targetIdx, mappedPoints.length - 1)];
    const origin = mappedPoints[0];
    const gDist = Math.abs(target.geodesicDistFromOrigin - origin.geodesicDistFromOrigin);
    const eDist = target.euclideanDistFromOrigin;
    const ratio = eDist > 0 ? gDist / eDist : 1.0;

    return {
      pointPair: `P(0) ➔ P(${target.id}) [s=${target.s}]`,
      geodesicDist: parseFloat(gDist.toFixed(2)),
      euclideanDist: parseFloat(eDist.toFixed(2)),
      ratio: parseFloat(ratio.toFixed(2)),
    };
  });

  return {
    points: mappedPoints,
    distanceComparison,
    avgCurvature: parseFloat((totalCurv / mappedPoints.length).toFixed(3)),
    maxTangentSpeed: 8.5,
  };
}

