// 公共常量：裁后锚点（源自 tools/_motion_anchors_crop.json）+ 站点配色 + 定位助手

export const CANVAS = 512;

export const ANCHORS = {
  char_miner: { aspect: 0.678, hand: [0.503, 0.0571] as const, headTop: [0.5, 0.0363] as const },
  char_fisher: { aspect: 0.635, hand: [0.9566, 0.394] as const },
  char_shooter: { aspect: 0.653, hand: [0.9554, 0.424] as const },
  prop_pickaxe: { aspect: 0.61, grip: [0.5001, 0.9627] as const, head: [0.5001, 0.0363] as const },
  prop_rod: { aspect: 1.218, grip: [0.0416, 0.9433] as const, tip: [0.8444, 0.1021] as const },
  prop_pistol: { aspect: 1.255, grip: [0.0474, 0.8401] as const, muzzle: [0.9624, 0.3164] as const },
};

export const COLORS = {
  water: '#123a44',
  waterDeep: '#0d2a33',
  waterLine: '#5eead4',
  dock: '#7a5230',
  dockDark: '#523722',
  rock: '#5b6478',
  rockDark: '#3d4354',
  rockLight: '#767f94',
  dust: '#8b96a9',
  spark: '#ffd166',
  sparkHot: '#fff3c4',
  targetRed: '#e4572e',
  targetWhite: '#f4f1ea',
  muzzle: '#fff3c4',
  smoke: '#9aa7bd',
  brass: '#d9a441',
  fish: '#f4a259',
  fishDark: '#d17f33',
};

// 把精灵按「锚点对齐到画布目标点」摆放
export function placeAt(
  anchor: readonly [number, number],
  target: { x: number; y: number },
  w: number,
  h: number
) {
  return {
    position: 'absolute' as const,
    left: target.x - anchor[0] * w,
    top: target.y - anchor[1] * h,
    width: w,
    height: h,
  };
}

// 绕锚点旋转的精灵样式（transformOrigin 用百分比，天然绕锚点）
export function spinStyle(anchor: readonly [number, number], angleDeg: number) {
  return {
    width: '100%' as const,
    height: '100%' as const,
    transformOrigin: `${anchor[0] * 100}% ${anchor[1] * 100}%`,
    transform: `rotate(${angleDeg}deg)`,
  };
}

// 二维旋转（屏幕坐标，y 向下，角度为度，顺时针为正）
export function rot(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
}

// 绕 pivot 旋转一个点
export function rotAround(
  px: number,
  py: number,
  cx: number,
  cy: number,
  deg: number
) {
  const d = rot(px - cx, py - cy, deg);
  return { x: cx + d.x, y: cy + d.y };
}
