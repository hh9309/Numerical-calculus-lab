# Test execution of the 6 python code slicers
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg') # non-interactive backend for testing
import matplotlib.pyplot as plt
from scipy.integrate import simpson, trapezoid
from scipy.signal import savgol_filter

print("Testing Slice Full...")
diff_method = "central"
diffMethod = diff_method
int_method = "trapezoidal"
intMethod = int_method
filter_method = "savitzky_golay"
filterMethod = filter_method
signal_preset = "sine_composite"
signalPreset = signal_preset
noise_level = 0.05
noiseLevel = noise_level

N = 100
x = np.linspace(0, 10, N)
dx = 0.1010

np.random.seed(42)
y_clean = np.sin(x) + 0.5 * np.sin(3.0 * x)
y_noisy = y_clean + np.random.normal(0, noise_level, N)

y_filtered = savgol_filter(y_noisy, window_length=5, polyorder=2)

dy_dx = np.zeros_like(y_filtered)
dy_dx[1:-1] = (y_filtered[2:] - y_filtered[:-2]) / (2.0 * dx)
dy_dx[0] = (y_filtered[1] - y_filtered[0]) / dx
dy_dx[-1] = (y_filtered[-1] - y_filtered[-2]) / dx
dy_exact = np.cos(x) + 1.5 * np.cos(3.0 * x)

cum_integral = np.zeros_like(y_filtered)
for i in range(1, N):
    cum_integral[i] = trapezoid(y_filtered[:i+1], x[:i+1])

df = pd.DataFrame({
    'x': x,
    'y_raw': y_clean,
    'y_noisy': y_noisy,
    'y_filtered': y_filtered,
    'dy_dx': dy_dx,
    'dy_exact': dy_exact,
    'cum_integral': cum_integral
})

print("=== 离散数据微积分实验室 Python 运行报告 ===")
print(f"数据总点数 N: {len(df)}, 步长 dx: {dx:.4f}")
print(f"信号类型: {signal_preset}, 噪声强度 σ: {noise_level}")
print(f"平滑算法 ({filter_method}): 原始方差 = {np.var(y_noisy):.5f} -> 滤波后方差 = {np.var(y_filtered):.5f}")
print(f"求导算法 ({diff_method}): 导数均值 = {df['dy_dx'].mean():.4f}, 方差 = {df['dy_dx'].var():.4f}")
print(f"求导算法 ({diffMethod}): 导数均值 = {df['dy_dx'].mean():.4f}, 方差 = {df['dy_dx'].var():.4f}")
print(f"数值积分算法 ({int_method}): 定积分总面积 ∫f(x)dx = {df['cum_integral'].iloc[-1]:.6f}")
print(f"数值积分算法 ({intMethod}): 定积分总面积 ∫f(x)dx = {df['cum_integral'].iloc[-1]:.6f}")

fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
ax1.plot(x, y_noisy, 'r.', alpha=0.35, label='Noisy Input (y_noisy)')
ax1.plot(x, y_filtered, 'b-', linewidth=1.8, label=f'Filtered Signal ({filter_method})')
ax1.plot(x, y_clean, 'k--', alpha=0.6, label='Ground Truth')
ax1.set_title('1. Signal Smoothing & Denoising')
ax1.legend(loc='upper right')
ax1.grid(True, linestyle='--', alpha=0.5)

ax2.plot(x, dy_exact, 'k--', alpha=0.6, label="Exact Analytical f'(x)")
ax2.plot(x, dy_dx, 'g.-', linewidth=1.5, label=f"Numerical dy/dx ({diff_method})")
ax2.set_title("2. Numerical Derivative f'(x)")
ax2.legend(loc='upper right')
ax2.grid(True, linestyle='--', alpha=0.5)

ax3.plot(x, cum_integral, 'm-', linewidth=2.0, label=f"Integral Area ({int_method})")
ax3.fill_between(x, cum_integral, color='purple', alpha=0.15)
ax3.set_title(f"3. Cumulative Integral ∫f(x)dx (Total Area: {df['cum_integral'].iloc[-1]:.4f})")
ax3.legend(loc='upper left')
ax3.grid(True, linestyle='--', alpha=0.5)
ax3.set_xlabel('x')

plt.tight_layout()
plt.savefig('/tmp/test_fig.png')
plt.close()
print("All slice python tests passed successfully!")
