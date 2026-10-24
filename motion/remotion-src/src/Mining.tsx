import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, Easing } from 'remotion';
import { ANCHORS, COLORS, placeAt, spinStyle, rot, rotAround } from './theme';

const GROUND = 460;
const HAND = { x: 256, y: 215 };
const CH_H = 260;
const CH_W = CH_H * ANCHORS.char_miner.aspect;
const PX_H = 240;
const PX_W = PX_H * ANCHORS.prop_pickaxe.aspect;
const L = (ANCHORS.prop_pickaxe.grip[1] - ANCHORS.prop_pickaxe.head[1]) * PX_H; // 握把→镐头
const IMPACT_F = 26;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInCubic = (t: number) => { const x = clamp01(t); return x * x * x; };
const easeOutQuad = (t: number) => { const x = clamp01(t); return 1 - (1 - x) * (1 - x); };
const easeInOutCubic = (t: number) => { const x = clamp01(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

// 挥砍角度：-78° 后仰预备 → +150° 砸下 → 回弹 → 收回
function swingAngle(f: number): number {
  if (f < 8) return -75;
  if (f < 16) return -78;
  if (f < 26) return -78 + 228 * easeInCubic((f - 16) / 10);
  if (f < 30) return 150 + 6 * easeOutQuad((f - 26) / 4);
  return 156 - 231 * easeInOutCubic((f - 30) / 16);
}

// 镐头在 rig 局部坐标
function headLocal(f: number) {
  const d = rot(0, -L, swingAngle(f));
  return { x: HAND.x + d.x, y: HAND.y + d.y };
}

export const Mining: React.FC = () => {
  const f = useCurrentFrame();

  const lean = f >= 16 && f < 38 ? 2.5 * easeOutQuad((f - 16) / 10) * (1 - clamp01((f - 26) / 12)) : 0;
  const idle = 1.2 * Math.sin((2 * Math.PI * f) / 48);
  const recoil = f >= IMPACT_F ? 3 * Math.exp(-(f - IMPACT_F) / 5) * Math.cos((f - IMPACT_F) * 1.2) : 0;
  const bob = idle + recoil;

  // 撞击点 = 第 25 帧镐头的世界坐标（特效发射点固定）
  const hl = headLocal(IMPACT_F);
  const hw = rotAround(hl.x, hl.y, HAND.x, GROUND, 2.5);
  const IMPACT = { x: hw.x, y: hw.y + 3 };

  // 屏震
  const shakeAmp = f >= IMPACT_F && f < IMPACT_F + 8 ? 4 * (1 - (f - IMPACT_F) / 8) : 0;
  const sx = shakeAmp * Math.sin(f * 2.7);
  const sy = shakeAmp * 0.6 * Math.cos(f * 3.3);

  const t = f - IMPACT_F;
  const showFx = t >= 0 && t <= 16;

  const sparks = Array.from({ length: 9 }, (_, i) => {
    const a = -165 + i * 21;
    const len = 15 + (i % 3) * 7;
    const p = clamp01(t / 9);
    return { a, len, p, key: i };
  });
  const chips = [
    { vx: -3.4, vy: -7.6, s: 6, c: COLORS.rockLight },
    { vx: 1.6, vy: -8.6, s: 5, c: COLORS.rock },
    { vx: 4.6, vy: -6.6, s: 6, c: COLORS.rockDark },
    { vx: -5.2, vy: -4.8, s: 4, c: COLORS.rock },
    { vx: 0.8, vy: -9.6, s: 5, c: COLORS.rockLight },
    { vx: 6.0, vy: -3.8, s: 4, c: COLORS.rock },
  ].map((c, i) => ({ ...c, p: clamp01(t / 16), key: i }));

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      {/* 地面阴影 + 鹅卵石 */}
      <div style={{ position: 'absolute', left: 196, top: 452, width: 120, height: 18, borderRadius: '50%', background: '#000', opacity: 0.28 }} />
      <div style={{ position: 'absolute', left: 130, top: 452, width: 10, height: 6, borderRadius: '50%', background: COLORS.rockDark, opacity: 0.5 }} />
      <div style={{ position: 'absolute', left: 396, top: 454, width: 8, height: 5, borderRadius: '50%', background: COLORS.rockDark, opacity: 0.5 }} />

      {/* 岩石（世界坐标，不随 rig 动） */}
      <svg width={110} height={80} viewBox="0 0 110 80" style={{ position: 'absolute', left: 314, top: 392 }}>
        <polygon points="2,72 14,32 34,10 62,16 84,40 96,72" fill={COLORS.rock} stroke={COLORS.rockDark} strokeWidth={3} strokeLinejoin="round" />
        <polygon points="34,10 62,16 84,40 52,34" fill={COLORS.rockLight} opacity={0.45} />
        <ellipse cx="55" cy="74" rx="52" ry="6" fill="#000" opacity={0.3} />
      </svg>

      {/* rig：角色 + 镐，整体绕脚跟着地轻微前倾 + 上下起伏 */}
      <AbsoluteFill style={{ transform: `translateY(${bob}px) rotate(${lean}deg)`, transformOrigin: `${HAND.x}px ${GROUND}px` }}>
        <Img src={staticFile('motion_char_miner.png')} style={placeAt(ANCHORS.char_miner.hand, HAND, CH_W, CH_H)} />
        <div style={{ position: 'absolute', ...placeAt(ANCHORS.prop_pickaxe.grip, HAND, PX_W, PX_H) }}>
          <Img src={staticFile('motion_prop_pickaxe.png')} style={spinStyle(ANCHORS.prop_pickaxe.grip, swingAngle(f))} />
        </div>
      </AbsoluteFill>

      {/* 撞击特效 */}
      {showFx && (
        <>
          {t < 4 && (
            <div style={{
              position: 'absolute', left: IMPACT.x, top: IMPACT.y,
              width: (6 + 34 * easeOutQuad(t / 4)) * 2, height: (6 + 34 * easeOutQuad(t / 4)) * 2,
              borderRadius: '50%', background: '#ffffff', opacity: 0.9 * (1 - t / 4),
              transform: 'translate(-50%, -50%)',
            }} />
          )}
          {sparks.map((s) => (
            <div key={`sp${s.key}`} style={{
              position: 'absolute', left: IMPACT.x, top: IMPACT.y - 1.5,
              width: s.len * s.p, height: 3, borderRadius: 2,
              background: s.key % 3 === 0 ? COLORS.sparkHot : COLORS.spark,
              opacity: 1 - s.p,
              transformOrigin: '0 50%',
              transform: `translateY(${26 * s.p * s.p}px) rotate(${s.a}deg)`,
            }} />
          ))}
          {chips.map((c) => (
            <div key={`ch${c.key}`} style={{
              position: 'absolute',
              left: IMPACT.x + c.vx * c.p - c.s / 2,
              top: IMPACT.y + c.vy * c.p + 320 * c.p * c.p - c.s / 2,
              width: c.s, height: c.s, background: c.c,
              opacity: 1 - c.p,
              transform: `rotate(${540 * c.p}deg)`,
            }} />
          ))}
          {[0, 1, 2].map((i) => (
            <div key={`du${i}`} style={{
              position: 'absolute',
              left: IMPACT.x + (i - 1) * 14, top: 436,
              width: (5 + 30 * easeOutQuad(t / 14)) * 2, height: (5 + 30 * easeOutQuad(t / 14)) * 2,
              borderRadius: '50%', background: COLORS.dust, opacity: 0.4 * (1 - t / 14),
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
          {t < 10 && (
            <div style={{
              position: 'absolute', left: IMPACT.x, top: 452,
              width: (8 + 34 * easeOutQuad(t / 10)) * 2, height: (3 + 12 * easeOutQuad(t / 10)) * 2,
              borderRadius: '50%', border: `2px solid ${COLORS.spark}`, opacity: 0.8 * (1 - t / 10),
              transform: 'translate(-50%, -50%)',
            }} />
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
