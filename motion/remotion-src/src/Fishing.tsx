import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ANCHORS, COLORS, placeAt, spinStyle, rot } from './theme';

const WATER_Y = 402;
const DOCK_END = 214;
const HAND = { x: 170, y: 248 };
const CH_H = 250;
const CH_W = CH_H * ANCHORS.char_fisher.aspect;
const ROD_H = 118;
const ROD_W = ROD_H * ANCHORS.prop_rod.aspect;
// 竿尖相对握把的局部偏移
const TIP_LOCAL = {
  x: (ANCHORS.prop_rod.tip[0] - ANCHORS.prop_rod.grip[0]) * ROD_W,
  y: (ANCHORS.prop_rod.tip[1] - ANCHORS.prop_rod.grip[1]) * ROD_H,
};
const BX = 330; // 浮漂横坐标（入水点）
const CYCLE = 36;

export const Fishing: React.FC = () => {
  const f = useCurrentFrame();
  const phase = f % CYCLE;

  // 竿：轻颤 + 咬钩时顿点
  const quiver = 2.2 * Math.sin((2 * Math.PI * f) / CYCLE);
  const dip = phase >= 18 && phase < 26 ? 6 * Math.sin((Math.PI * (phase - 18)) / 8) : 0;
  const rodAngle = quiver + dip;

  const tipD = rot(TIP_LOCAL.x, TIP_LOCAL.y, rodAngle);
  const TIP = { x: HAND.x + tipD.x, y: HAND.y + tipD.y };

  // 浮漂：常态轻浮 + 咬钩猛地下拽
  const bobFloat = 4 * Math.sin((2 * Math.PI * f) / 24);
  const yank = phase >= 18 && phase < 24 ? 14 * Math.sin((Math.PI * (phase - 18)) / 6) : 0;
  const BY = WATER_Y - 5 + bobFloat + yank;

  // 鱼线（带下垂的贝塞尔）
  const sag = 16 + 4 * Math.sin((2 * Math.PI * f) / 24);
  const midX = (TIP.x + BX) / 2;
  const midY = Math.max(TIP.y, BY) + sag;

  // 鱼咬钩跳出水面
  const jt = (phase - 18) / 12;
  const fish = jt >= 0 && jt <= 1
    ? { x: BX + 30 * jt, y: WATER_Y - 74 * Math.sin(Math.PI * jt), t: jt }
    : null;
  const fishAngle = fish
    ? (Math.atan2(-74 * Math.PI * Math.cos(Math.PI * fish.t) / 12, 30 / 12) * 180) / Math.PI
    : 0;

  // 涟漪：每周期两环（phase 0 与 18 生成），寿命 18 帧与 36 帧周期对齐，循环无缝
  const rings = [0, 18].map((spawn) => {
    const rp = (phase - spawn) / 18;
    return rp >= 0 && rp <= 1 ? { rp, key: spawn } : null;
  }).filter(Boolean) as { rp: number; key: number }[];

  // 咬钩水花
  const splash = phase >= 18 && phase < 26 ? (phase - 18) / 8 : -1;
  const droplets = [
    { vx: -1.8, vy: -3.4 }, { vx: 1.2, vy: -4.2 }, { vx: 2.6, vy: -2.8 },
    { vx: -2.8, vy: -2.2 }, { vx: 0.2, vy: -4.8 },
  ];

  return (
    <AbsoluteFill>
      {/* 水体 + 木码头 + 水面微光（SVG 元素必须包在 svg 里） */}
      <svg width={512} height={512} viewBox="0 0 512 512" style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#17424e" />
            <stop offset="100%" stopColor={COLORS.waterDeep} />
          </linearGradient>
        </defs>
        <rect x={DOCK_END} y={WATER_Y} width={512 - DOCK_END} height={512 - WATER_Y} fill="url(#waterGrad)" />
        <rect x={DOCK_END} y={WATER_Y - 2} width={512 - DOCK_END} height={3} fill={COLORS.waterLine} opacity={0.45} />
        <rect x={0} y={WATER_Y} width={DOCK_END} height={512 - WATER_Y} fill={COLORS.dock} />
        <rect x={0} y={WATER_Y - 6} width={DOCK_END} height={6} fill={COLORS.dockDark} />
        {[40, 90, 140, 190].map((x) => (
          <rect key={x} x={x} y={WATER_Y + 8} width={2} height={512 - WATER_Y - 16} fill={COLORS.dockDark} opacity={0.35} />
        ))}
        {[424, 452, 482].map((y, i) => (
          <rect key={y} x={240 + 18 * Math.sin((2 * Math.PI * f) / 36 + i)} y={y} width={44 + i * 22} height={2.5} rx={1.5}
            fill={COLORS.waterLine} opacity={0.16} />
        ))}
      </svg>

      {/* rig：角色 + 竿（整体轻呼吸） */}
      <AbsoluteFill style={{ transform: `translateY(${2 * Math.sin((2 * Math.PI * f) / 72)}px)` }}>
        <Img src={staticFile('motion_char_fisher.png')} style={placeAt(ANCHORS.char_fisher.hand, HAND, CH_W, CH_H)} />
        <div style={{ position: 'absolute', ...placeAt(ANCHORS.prop_rod.grip, HAND, ROD_W, ROD_H) }}>
          <Img src={staticFile('motion_prop_rod.png')} style={spinStyle(ANCHORS.prop_rod.grip, rodAngle)} />
        </div>
      </AbsoluteFill>

      {/* 鱼线 */}
      <svg width={512} height={512} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
        <path d={`M ${TIP.x} ${TIP.y} Q ${midX} ${midY} ${BX} ${BY}`} stroke="#e8eef7" strokeWidth={1.5} fill="none" opacity={0.75} />
      </svg>

      {/* 涟漪 */}
      {rings.map((r) => {
        const rx = 4 + 42 * r.rp;
        return (
          <div key={r.key} style={{
            position: 'absolute', left: BX, top: WATER_Y + 3,
            width: rx * 2, height: rx * 0.34 * 2, borderRadius: '50%',
            border: `${2 * (1 - r.rp) + 0.5}px solid ${COLORS.waterLine}`,
            opacity: 0.6 * (1 - r.rp), transform: 'translate(-50%, -50%)',
          }} />
        );
      })}

      {/* 咬钩水花 */}
      {splash >= 0 &&
        droplets.map((d, i) => {
          const p = splash;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: BX + d.vx * p * 3 - 1.5, top: WATER_Y + d.vy * p * 3 + 90 * p * p - 1.5,
              width: 3, height: 3, borderRadius: '50%', background: '#9fe8d8', opacity: 1 - p,
            }} />
          );
        })}

      {/* 跳出水面的鱼 */}
      {fish && (
        <svg width={60} height={34} viewBox="-30 -17 60 34" style={{ position: 'absolute', left: fish.x - 30, top: fish.y - 17 }}>
          <g transform={`rotate(${fishAngle})`}>
            <ellipse cx="0" cy="0" rx="16" ry="8" fill={COLORS.fish} stroke={COLORS.fishDark} strokeWidth={2} />
            <polygon points="14,0 26,-9 26,9" fill={COLORS.fishDark} />
            <circle cx="-9" cy="-2" r="1.8" fill="#1a2130" />
            <path d="M -4 7 Q 2 12 8 7" stroke={COLORS.fishDark} strokeWidth={1.5} fill="none" />
          </g>
        </svg>
      )}

      {/* 浮漂 */}
      <svg width={24} height={24} viewBox="-12 -12 24 24" style={{ position: 'absolute', left: BX - 12, top: BY - 12 }}>
        <line x1="0" y1="-12" x2="0" y2="-6" stroke="#e8eef7" strokeWidth={1.5} />
        <circle cx="0" cy="0" r="7" fill="#f4f1ea" stroke="#c9c2b2" strokeWidth={1.5} />
        <path d="M -7 0 A 7 7 0 0 1 7 0 Z" fill={COLORS.targetRed} />
        <ellipse cx="0" cy="8.5" rx="9" ry="2.5" fill="none" stroke={COLORS.waterLine} strokeWidth={1} opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};
