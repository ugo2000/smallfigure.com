import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ANCHORS, COLORS, placeAt, spinStyle, rot } from './theme';

const GROUND = 470;
const HAND = { x: 205, y: 286 };
const CH_H = 320;
const CH_W = CH_H * ANCHORS.char_shooter.aspect;
const P_H = 88;
const P_W = P_H * ANCHORS.prop_pistol.aspect;
const MUZZLE_LOCAL = {
  x: (ANCHORS.prop_pistol.muzzle[0] - ANCHORS.prop_pistol.grip[0]) * P_W,
  y: (ANCHORS.prop_pistol.muzzle[1] - ANCHORS.prop_pistol.grip[1]) * P_H,
};
const TARGET = { x: 452, y: 240 };
const FIRE = 29;

// 第 f 帧的枪口世界坐标（后坐 + 瞄准微摆）
function muzzleAt(f: number) {
  const sway = 0.8 * Math.sin((2 * Math.PI * f) / 60);
  const k = f - FIRE;
  const rec = k >= 0 && k < 14 ? Math.exp(-k / 4) * Math.cos(k * 0.9) : 0;
  const rx = -11 * rec;
  const ry = -7 * rec;
  const d = rot(MUZZLE_LOCAL.x, MUZZLE_LOCAL.y, sway);
  return { x: HAND.x + rx + d.x, y: HAND.y + ry + d.y, rec };
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export const Shooting: React.FC = () => {
  const f = useCurrentFrame();
  const k = f - FIRE;

  const m = muzzleAt(f);
  const charRecoil = k >= 0 && k < 14 ? -4 * Math.exp(-k / 5) : 0;
  const sway = 0.8 * Math.sin((2 * Math.PI * f) / 60);
  const dy = 1.5 * Math.sin((2 * Math.PI * f) / 30);

  const flashOn = k >= 0 && k < 5;
  const flashScale = k < 2 ? 1 : 1 - (k - 2) / 3;
  const bulletOn = f >= 30 && f < 37;
  const bp = clamp01((f - 30) / 7);
  const B0 = muzzleAt(30);
  const bx = B0.x + (TARGET.x - B0.x) * bp;
  const by = B0.y + (TARGET.y - B0.y) * bp;

  const impactOn = f >= 37 && f < 45;
  const ip = clamp01((f - 37) / 8);
  const holeOn = f >= 38;

  const smokeSpawns = [30, 33, 36, 39];
  const shellOn = f >= 31 && f < 47;
  const st = f - 31;
  const EJECT = { x: muzzleAt(31).x - 34, y: muzzleAt(31).y - 16 };
  // 弹孔在收尾 7 帧淡出，循环时不突消失
  const holeOpacity = f < 52 ? 1 : Math.max(0, 1 - (f - 52) / 7);

  const starPts = (R: number) =>
    [[0, -1], [0.24, -0.24], [1, 0], [0.24, 0.24], [0, 1], [-0.24, 0.24], [-1, 0], [-0.24, -0.24]]
      .map(([x, y]) => `${(x * R * 1.35).toFixed(1)},${(y * R).toFixed(1)}`)
      .join(' ');

  return (
    <AbsoluteFill>
      {/* 靶 + 支架 */}
      <rect x={448} y={286} width={9} height={GROUND - 286} fill={COLORS.dock} stroke={COLORS.dockDark} strokeWidth={2} />
      <ellipse cx={452} cy={GROUND} rx={34} ry={7} fill="#000" opacity={0.3} />
      <svg width={110} height={110} viewBox="0 0 110 110" style={{ position: 'absolute', left: TARGET.x - 55, top: TARGET.y - 55 }}>
        <circle cx="55" cy="55" r="52" fill={COLORS.targetWhite} stroke="#c9c2b2" strokeWidth={2} />
        <circle cx="55" cy="55" r="40" fill={COLORS.targetRed} />
        <circle cx="55" cy="55" r="27" fill={COLORS.targetWhite} />
        <circle cx="55" cy="55" r="14" fill={COLORS.targetRed} />
        <circle cx="55" cy="55" r="5" fill="#1a2130" />
      </svg>

      {/* 角色（含后坐位移） */}
      <AbsoluteFill style={{ transform: `translate(${charRecoil}px, ${dy}px)` }}>
        <Img src={staticFile('motion_char_shooter.png')} style={placeAt(ANCHORS.char_shooter.hand, HAND, CH_W, CH_H)} />
        {/* 手枪：握把跟手，自身后坐 + 瞄准微摆 */}
        <div style={{ position: 'absolute', ...placeAt(ANCHORS.prop_pistol.grip, { x: HAND.x - 11 * m.rec, y: HAND.y - 7 * m.rec }, P_W, P_H) }}>
          <Img src={staticFile('motion_prop_pistol.png')} style={spinStyle(ANCHORS.prop_pistol.grip, sway)} />
        </div>
      </AbsoluteFill>

      {/* 瞄准线（击发前） */}
      {f < FIRE && (
        <svg width={512} height={512} style={{ position: 'absolute', left: 0, top: 0 }}>
          <line x1={m.x + 14} y1={m.y} x2={TARGET.x - 52} y2={TARGET.y} stroke={COLORS.waterLine} strokeWidth={1.5} strokeDasharray="5 7" opacity={0.3} />
        </svg>
      )}

      {/* 枪口焰 */}
      {flashOn && (
        <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: 'absolute', left: m.x - 60, top: m.y - 60, pointerEvents: 'none' }}>
          <circle cx="0" cy="0" r={44 * flashScale} fill={COLORS.muzzle} opacity={0.35 * flashScale} />
          <polygon points={starPts(38 * flashScale)} fill={COLORS.muzzle} transform="rotate(12)" />
          <circle cx="0" cy="0" r={9 * flashScale} fill="#ffffff" />
        </svg>
      )}

      {/* 弹道 + 弹头 */}
      {bulletOn && (
        <svg width={512} height={512} style={{ position: 'absolute', left: 0, top: 0 }}>
          {[0, 1, 2].map((i) => {
            const tp = clamp01((f - 30 - i * 1.5) / 7);
            if (tp <= 0) return null;
            const tx = B0.x + (TARGET.x - B0.x) * tp;
            const ty = B0.y + (TARGET.y - B0.y) * tp;
            return <line key={i} x1={tx} y1={ty} x2={tx - 26} y2={ty - (TARGET.y - B0.y) * (26 / (TARGET.x - B0.x))} stroke="#ffe9a8" strokeWidth={3 - i} opacity={0.55 - i * 0.15} />;
          })}
          <ellipse cx={bx} cy={by} rx={7} ry={2.6} fill="#ffe9a8" transform={`rotate(${((TARGET.y - B0.y) / (TARGET.x - B0.x)) * (180 / Math.PI)})`} />
          <ellipse cx={bx} cy={by} rx={7} ry={2.6} fill="#ffe9a8" transform={`rotate(${((TARGET.y - B0.y) / (TARGET.x - B0.x)) * (180 / Math.PI)}) ${bx} ${by}`} />
        </svg>
      )}

      {/* 命中：闪光环 + 木屑 + 弹孔 */}
      {impactOn && (
        <>
          <div style={{
            position: 'absolute', left: TARGET.x, top: TARGET.y,
            width: (4 + 20 * ip) * 2, height: (4 + 20 * ip) * 2, borderRadius: '50%',
            border: `2px solid ${COLORS.muzzle}`, opacity: 0.9 * (1 - ip), transform: 'translate(-50%, -50%)',
          }} />
          {[[-2.6, -5.2, 5], [2.2, -6.4, 4], [4.2, -3.4, 5], [-4.4, -3.2, 4]].map(([vx, vy, s], i) => (
            <div key={i} style={{
              position: 'absolute',
              left: TARGET.x + vx * ip * 2.4 - s / 2, top: TARGET.y + vy * ip * 2.4 + 90 * ip * ip - s / 2,
              width: s, height: s, background: i % 2 ? COLORS.dock : COLORS.dockDark,
              opacity: 1 - ip, transform: `rotate(${300 * ip}deg)`,
            }} />
          ))}
        </>
      )}
      {holeOn && (
        <svg width={18} height={18} viewBox="-9 -9 18 18" style={{ position: 'absolute', left: TARGET.x - 9, top: TARGET.y - 9, opacity: holeOpacity }}>
          <circle cx="0" cy="0" r="3.6" fill="#10141d" />
          <path d="M -3 -1 L -7 -4 M 2 -3 L 6 -6 M 3 1 L 7 3" stroke="#10141d" strokeWidth={1.2} />
        </svg>
      )}

      {/* 硝烟 */}
      {smokeSpawns.map((sp) => {
        const pp = clamp01((f - sp) / 18);
        if (pp <= 0 || pp > 1) return null;
        const s0 = muzzleAt(sp);
        return (
          <div key={sp} style={{
            position: 'absolute', left: s0.x + 16 * pp, top: s0.y - 22 * pp,
            width: (5 + 11 * pp) * 2, height: (5 + 11 * pp) * 2, borderRadius: '50%',
            background: COLORS.smoke, opacity: 0.3 * (1 - pp), transform: 'translate(-50%, -50%)',
          }} />
        );
      })}

      {/* 跳壳 */}
      {shellOn && (
        <div style={{
          position: 'absolute', left: EJECT.x + 1.8 * st - 3, top: EJECT.y - 4.2 * st + 0.085 * st * st - 2.2,
          width: 6, height: 4.4, borderRadius: 1.5, background: COLORS.brass,
          opacity: st > 12 ? 1 - (st - 12) / 4 : 1,
          transform: `rotate(${45 * st}deg)`,
        }} />
      )}
    </AbsoluteFill>
  );
};
