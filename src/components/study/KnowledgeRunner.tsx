"use client";

/**
 * SKYBOUND — Meadow Isles
 * A polished 2.5D fantasy endless runner rendered on a single 2D canvas.
 * - 3 lanes, jump / slide / dash, collectibles, route forks, knowledge gates.
 * - Perspective-projected track + parallax sky for depth without a 3D engine.
 * - All gameplay state lives in React refs + a single RAF loop.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Cloud, Flame, Heart, Maximize2, Minimize2, Pause, Play, RefreshCw, Shield, Sparkles, Trophy, Zap,
  Gem, BookOpen, Wind, Layers, Mountain, Star,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { GamePair, QuizQuestion } from "../../types/study";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = "idle" | "running" | "paused" | "knowledge" | "crashed" | "gameover";
type PlayerState = "running" | "jumping" | "sliding" | "dashing" | "stumble";
type ObstacleKind = "arch" | "gap" | "boulder" | "barrier" | "pillar";
type CollectibleKind = "shard" | "fragment" | "relic";
type ForkChoice = 0 | 1 | 2 | null;

interface Obstacle {
  id: number;
  kind: ObstacleKind;
  lane: 0 | 1 | 2; // 3 means all lanes (gap/arch that spans)
  z: number; // distance ahead (0 = at player)
  width: number; // in lane units
  height: number;
  // For lane-spanning obstacles:
  span?: boolean;
  // how to avoid:
  avoid: "jump" | "slide" | "dodge" | "dash";
  dashable?: boolean;
  passed: boolean;
  hit: boolean;
}

interface Collectible {
  id: number;
  kind: CollectibleKind;
  lane: 0 | 1 | 2;
  z: number;
  y: number; // vertical offset (0 = ground, 1 = mid-air)
  collected: boolean;
  magnetized?: boolean;
}

interface KnowledgeGate {
  id: number;
  z: number;
  lane: 0 | 1 | 2;
  question: QuizQuestion | { id: string; question: string; options: string[]; correctIndex: number; topic: string };
  passed: boolean;
  triggered: boolean;
}

interface Fork {
  id: number;
  z: number;
  // which lane leads to which reward tier
  rewards: ("safe" | "risky" | "rare")[];
  chosenLane: ForkChoice;
  passed: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  color: string; size: number;
}

interface Segment {
  // A pattern entry that spawns obstacles/collectibles
  kind: "obstacle" | "collectible" | "gate" | "fork" | "empty";
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const CANVAS_W = 480;
const CANVAS_H = 640;
const LANE_W = 90; // world lane width
const TRACK_W_NEAR = 420;
const TRACK_W_FAR = 120;
const HORIZON_Y = 135;
const GROUND_Y = 610;
const PLAYER_SCREEN_Y = 505; // where player sits on screen

const GRAVITY = 0.85;
const JUMP_VEL = -14.5;
const DOUBLE_JUMP_VEL = -12;
const SLIDE_DURATION = 420; // ms
const DASH_DURATION = 320; // ms
const DASH_SPEED_BONUS = 3.5;
const DASH_COOLDOWN = 2200;
const STUMBLE_DURATION = 500;

const BASE_SPEED = 5.5;
const MAX_SPEED = 14;
const SPEED_RAMP = 0.0009; // per frame
const SHARD_SCORE = 10;
const FRAGMENT_SCORE = 25;
const RELIC_SCORE = 100;
const OBSTACLE_SCORE = 25;
const PERFECT_BONUS = 40;
const COMBO_WINDOW = 1400; // ms between clean dodges to keep combo

const LIVES_START = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function randRange(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function perspectiveScale(z: number): number {
  // z=0 at player, z~700 at far horizon. Larger z = farther = smaller.
  // Scale 1 at player, ~0.06 at horizon.
  return clamp(1 - z / 820, 0.06, 1);
}

function laneWorldX(lane: 0 | 1 | 2): number {
  return (lane - 1) * LANE_W;
}
function laneScreenX(lane: 0 | 1 | 2, canvasW = CANVAS_W): number {
  // Used for UI hints only — rendering uses perspective math
  return canvasW / 2 + laneWorldX(lane) * 0.55;
}

// Quiz helpers
function buildQuizPool(quiz: QuizQuestion[], gamePairs?: GamePair[]): QuizQuestion[] {
  const pool: QuizQuestion[] = [...quiz];
  if (gamePairs && pool.length < 6) {
    for (const p of gamePairs) {
      pool.push({
        id: `gp-${p.id}`,
        question: `Which matches: "${p.prompt}"?`,
        options: shuffleOptions([p.answer, ...otherAnswers(p.answer, gamePairs).slice(0, 3)]),
        correctIndex: 0, // will be fixed by shuffle
        topic: "matching",
      } as unknown as QuizQuestion);
      // fix correctIndex after shuffle
      const last = pool[pool.length - 1];
      last.correctIndex = last.options.indexOf(p.answer);
    }
  }
  return pool;
}
function shuffleOptions(a: string[]): string[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b.slice(0, 4);
}
function otherAnswers(exclude: string, pairs: GamePair[]): string[] {
  const others = pairs.map(p => p.answer).filter(v => v !== exclude);
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
  return others;
}

// ---------------------------------------------------------------------------
// Segment patterns — Meadow Isles
// ---------------------------------------------------------------------------

type PatternName = "singleDodge" | "jumpGap" | "slideArch" | "zigzag" | "wallWithGap" | "collectTrail" | "forkChoice" | "dashBarrier" | "mixedParkour";

const PATTERNS: Record<PatternName, (nextId: () => number, dist: number) => Array<Obstacle | Collectible | Fork | KnowledgeGate>> = {
  singleDodge: (nid) => [{ id: nid(), kind: pick(["arch","boulder","pillar"] as ObstacleKind[]), lane: pick([0,1,2] as const), z: 800, width: 1, height: 1, avoid: pick(["dodge","jump"] as const), passed: false, hit: false } as Obstacle],
  jumpGap: (nid) => [{ id: nid(), kind: "gap" as ObstacleKind, lane: 1 as const, z: 820, width: 3, height: 0.2, span: true, avoid: "jump" as const, passed: false, hit: false } as Obstacle],
  slideArch: (nid) => [{ id: nid(), kind: "arch" as ObstacleKind, lane: pick([0,1,2] as const), z: 820, width: 1, height: 1.2, avoid: "slide" as const, passed: false, hit: false } as Obstacle],
  zigzag: (nid) => [
    { id: nid(), kind: "boulder" as ObstacleKind, lane: 0 as const, z: 780, width: 1, height: 1, avoid: "dodge" as const, passed: false, hit: false } as Obstacle,
    { id: nid(), kind: "boulder" as ObstacleKind, lane: 2 as const, z: 900, width: 1, height: 1, avoid: "dodge" as const, passed: false, hit: false } as Obstacle,
    { id: nid(), kind: "arch" as ObstacleKind, lane: 1 as const, z: 1020, width: 1, height: 1.2, avoid: "slide" as const, passed: false, hit: false } as Obstacle,
  ],
  wallWithGap: (nid) => {
    // Two pillars leave one safe lane
    const safe = pick([0,1,2] as const);
    return ([0,1,2] as const).filter(l => l !== safe).map(l =>
      ({ id: nid(), kind: "pillar" as ObstacleKind, lane: l, z: 820, width: 1, height: 1, avoid: "dodge" as const, passed: false, hit: false } as Obstacle)
    );
  },
  collectTrail: (nid) => {
    // Curving trail of shards
    const startLane = pick([0,1,2] as const);
    const out: Collectible[] = [];
    for (let i = 0; i < 7; i++) {
      const lane = clamp(startLane + (i % 2 === 0 ? 0 : (i < 4 ? 1 : -1)), 0, 2) as 0|1|2;
      out.push({ id: nid(), kind: "shard" as CollectibleKind, lane, z: 720 + i * 52, y: i % 3 === 0 ? 0.6 : 0, collected: false } as Collectible);
    }
    return out;
  },
  forkChoice: (nid) => [
    { id: nid(), z: 820, rewards: ["safe","risky","rare"] as const, chosenLane: null, passed: false } as unknown as Fork,
  ],
  dashBarrier: (nid) => [{ id: nid(), kind: "barrier" as ObstacleKind, lane: 1 as const, z: 820, width: 3, height: 1, span: true, avoid: "dash" as const, dashable: true, passed: false, hit: false } as Obstacle],
  mixedParkour: (nid) => [
    { id: nid(), kind: "pillar" as ObstacleKind, lane: 0 as const, z: 780, width: 1, height: 1, avoid: "dodge" as const, passed: false, hit: false } as Obstacle,
    { id: nid(), kind: "arch" as ObstacleKind, lane: 1 as const, z: 880, width: 1, height: 1.2, avoid: "slide" as const, passed: false, hit: false } as Obstacle,
    { id: nid(), kind: "boulder" as ObstacleKind, lane: 2 as const, z: 980, width: 1, height: 1, avoid: "jump" as const, passed: false, hit: false } as Obstacle,
  ],
};

const PATTERN_ORDER: PatternName[] = ["singleDodge","collectTrail","wallWithGap","slideArch","zigzag","forkChoice","jumpGap","collectTrail","mixedParkour","dashBarrier","singleDodge","collectTrail"];
const EARLY_PATTERNS: PatternName[] = ["singleDodge","collectTrail","wallWithGap","slideArch"];

// ---------------------------------------------------------------------------
// Player sprite drawing (2.5D stylized adventurer)
// ---------------------------------------------------------------------------

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: PlayerState,
  laneX: number,
  frame: number,
  hasShield: boolean,
  isDashing: boolean,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x + laneX, y);
  ctx.scale(scale, scale);

  const legPhase = frame * 0.55;
  const armSwing = state === "running" ? Math.sin(legPhase + Math.PI) * 6 : 0;
  const isSlide = state === "sliding";
  const isJump = state === "jumping" || state === "stumble" && false;

  // Slide pose squashes silhouette; jump tucks up. Stumble tilts.
  if (isSlide) {
    ctx.translate(0, 7);
    ctx.scale(1.14, 0.86);
  } else if (state === "jumping") {
    ctx.translate(0, -2);
  }
  if (state === "stumble") {
    ctx.rotate(-0.18);
    ctx.translate(0, 2);
  } else if (isDashing) {
    ctx.rotate(-0.12);
    ctx.translate(3, -1);
  }

  // Soft ground shadow (perspective — wider near, fades on air)
  ctx.save();
  ctx.globalAlpha = isSlide ? 0.22 : state === "jumping" ? 0.09 : 0.18;
  ctx.fillStyle = "rgba(15,23,42,1)";
  ctx.beginPath();
  ctx.ellipse(0, 18, isSlide ? 22 : 18, isSlide ? 8 : 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Dash after-images
  if (isDashing) {
    ctx.globalAlpha = 0.18;
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = i === 1 ? "#38bdf8" : i === 2 ? "#a78bfa" : "#fbbf24";
      ctx.beginPath();
      ctx.ellipse(-i * 11, 1, 14 - i * 2.2, 9 - i * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Body bob + run lean
  const bob = state === "running" ? Math.sin(frame * 0.48) * 1.25 : state === "jumping" ? Math.sin(frame * 0.18) * 0.6 : 0;
  const lean = isSlide ? 0 : isDashing ? -1 : 0;
  ctx.translate(0, bob + lean);

  // ── Backpack (behind torso) ─────────────────────────────────────
  ctx.fillStyle = "#78350f";
  ctx.beginPath(); ctx.roundRect(5, -9, 8, 12, 2.5); ctx.fill();
  ctx.fillStyle = "#92400e";
  ctx.beginPath(); ctx.roundRect(6, -7, 6, 8, 1.5); ctx.fill();
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.roundRect(6, -2, 6, 2.2, 0.8); ctx.stroke();

  // ── Legs ────────────────────────────────────────────────────────
  let legSwing: number;
  if (state === "running") legSwing = Math.sin(legPhase) * 8;
  else if (state === "jumping") legSwing = -8;
  else if (isSlide) legSwing = 11;
  else legSwing = 0;

  // Back leg + highlight
  ctx.fillStyle = "#1e3a8a";
  ctx.beginPath(); ctx.roundRect(-8, 5 + legSwing * 0.28, 6.5, 13, 3); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath(); ctx.roundRect(-7.2, 6 + legSwing * 0.28, 2, 11, 1); ctx.fill();
  // Front leg
  ctx.fillStyle = "#2563eb";
  ctx.beginPath(); ctx.roundRect(2, 5 - legSwing * 0.28, 6.5, 13, 3); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.roundRect(2.8, 6 - legSwing * 0.28, 2, 11, 1); ctx.fill();
  // Shoes (warm amber, with sole)
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.roundRect(-9, 16.2, 8.5, 4.4, 2); ctx.fill();
  ctx.fillStyle = "#92400e"; ctx.fillRect(-9, 17.8, 8.5, 1.4);
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.roundRect(1, 16.2, 8.5, 4.4, 2); ctx.fill();
  ctx.fillStyle = "#92400e"; ctx.fillRect(1, 17.8, 8.5, 1.4);

  // ── Tunic (teal gradient with sash) ─────────────────────────────
  const tunGrad = ctx.createLinearGradient(-10, -12, 10, 6);
  if (state === "stumble") {
    tunGrad.addColorStop(0, "#94a3b8"); tunGrad.addColorStop(1, "#64748b");
  } else {
    tunGrad.addColorStop(0, "#5eead4"); tunGrad.addColorStop(0.5, "#22d3ee"); tunGrad.addColorStop(1, "#0e7490");
  }
  ctx.fillStyle = tunGrad;
  ctx.beginPath(); ctx.roundRect(-11, -11, 22, 19, 5); ctx.fill();
  // top highlight (rim light from sun)
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(-11, -11, 22, 19, 5); ctx.stroke();
  // bottom shadow edge
  ctx.fillStyle = "rgba(12,74,110,0.28)";
  ctx.beginPath(); ctx.roundRect(-11, 5, 22, 3, 1.5); ctx.fill();
  // diagonal sash (warm)
  ctx.fillStyle = "rgba(251,191,36,0.95)";
  ctx.beginPath();
  ctx.moveTo(-11, -2); ctx.lineTo(2, -11); ctx.lineTo(5, -8); ctx.lineTo(-8, 4);
  ctx.closePath(); ctx.fill();
  // Belt
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-11, 4, 22, 3.2);
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.roundRect(-2.5, 3.2, 5.6, 5, 1); ctx.fill();
  ctx.fillStyle = "#78350f";
  ctx.beginPath(); ctx.arc(0.3, 5.7, 1.2, 0, Math.PI * 2); ctx.fill();

  // ── Arms ────────────────────────────────────────────────────────
  ctx.fillStyle = "#fde68a";
  // back arm
  ctx.beginPath();
  if (isSlide) {
    // both arms forward-low in slide
    ctx.roundRect(-13, 1, 6, 9, 3);
  } else if (state === "jumping") {
    ctx.roundRect(-12, -12 + armSwing * 0.4, 5.2, 11, 3);
  } else {
    ctx.roundRect(-14, -7 + armSwing * 0.4, 5.5, 11, 3);
  }
  ctx.fill();
  // front arm
  ctx.beginPath();
  if (isSlide) {
    ctx.roundRect(8, 1, 6, 9, 3);
  } else if (state === "jumping") {
    ctx.roundRect(9, -12 - armSwing * 0.4, 5.2, 11, 3);
  } else {
    ctx.roundRect(9, -7 - armSwing * 0.4, 5.5, 11, 3);
  }
  ctx.fill();
  // arm highlight
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath(); ctx.roundRect(-13.2, -6, 1.6, 9, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(9.8, -6, 1.6, 9, 1); ctx.fill();

  // ── Cloak / cape (short, flutters) ──────────────────────────────
  ctx.fillStyle = "rgba(124,58,237,0.92)";
  ctx.beginPath();
  const flutter = Math.sin(frame * 0.34) * 2.6;
  const flutter2 = Math.cos(frame * 0.5) * 1.2;
  if (isSlide) {
    ctx.moveTo(-7, -9); ctx.quadraticCurveTo(-20 + flutter, -2, -18 + flutter2, 9); ctx.lineTo(-5, 7); ctx.closePath();
  } else if (state === "jumping") {
    ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-22 + flutter, -6, -16, 6); ctx.lineTo(-4, 4); ctx.closePath();
  } else {
    ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-20 + flutter, 0, -14 + flutter2, 11); ctx.lineTo(-4, 8); ctx.closePath();
  }
  ctx.fill();
  // cloak trim
  ctx.strokeStyle = "rgba(196,181,253,0.7)"; ctx.lineWidth = 0.9;
  ctx.beginPath();
  if (isSlide) { ctx.moveTo(-7, -9); ctx.quadraticCurveTo(-20 + flutter, -2, -18 + flutter2, 9); }
  else { ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-20 + flutter, 0, -14 + flutter2, 11); }
  ctx.stroke();

  // ── Head ────────────────────────────────────────────────────────
  ctx.fillStyle = "#fde68a";
  ctx.beginPath(); ctx.arc(0, -16.5, 9.4, 0, Math.PI * 2); ctx.fill();
  // subtle rim outline so the face pops from sky
  ctx.strokeStyle = "rgba(15,23,42,0.18)"; ctx.lineWidth = 1.1;
  ctx.stroke();
  // Hair (violet bob with bangs)
  ctx.fillStyle = "#7c3aed";
  ctx.beginPath(); ctx.arc(0, -19.5, 10.2, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.fillStyle = "#6d28d9";
  ctx.beginPath(); ctx.ellipse(0, -22, 8.4, 4.2, 0, 0, Math.PI * 2); ctx.fill();
  // bangs highlight
  ctx.fillStyle = "rgba(196,181,253,0.9)";
  ctx.beginPath(); ctx.ellipse(-2, -23, 3, 1.4, -0.2, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = "#1e293b";
  const eyeY = state === "stumble" ? -15.8 : -16.4;
  ctx.beginPath(); ctx.arc(-3.2, eyeY, 1.45, 0, Math.PI * 2); ctx.arc(3.2, eyeY, 1.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath(); ctx.arc(-2.6, eyeY - 0.6, 0.55, 0, Math.PI * 2); ctx.arc(3.8, eyeY - 0.6, 0.55, 0, Math.PI * 2); ctx.fill();
  // Cheeks
  ctx.fillStyle = "rgba(251,113,133,0.48)";
  ctx.beginPath(); ctx.arc(-6.2, -14.2, 1.7, 0, Math.PI * 2); ctx.arc(6.2, -14.2, 1.7, 0, Math.PI * 2); ctx.fill();
  // Slide dust puff
  if (isSlide) {
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.beginPath(); ctx.ellipse(2, 18, 14, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.ellipse(-6, 17, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Shield aura
  if (hasShield) {
    ctx.strokeStyle = "rgba(56,189,248,0.9)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(0, -2, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(56,189,248,0.11)";
    ctx.beginPath(); ctx.arc(0, -2, 27, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Obstacle drawing (fantasy environmental — no floating text)
// ---------------------------------------------------------------------------

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  kind: ObstacleKind,
  sx: number, sy: number,
  w: number, h: number,
  scale: number,
  dashable?: boolean,
) {
  ctx.save();
  ctx.translate(sx, sy);

  if (kind === "arch") {
    // Low mossy stone arch — slide under
    const bw = w * scale;
    const bh = h * scale;
    const t = 1;
    // Pillar base + highlight
    ctx.fillStyle = "#8a8070";
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, 9 * scale, bh, 2 * scale); ctx.fill();
    ctx.beginPath(); ctx.roundRect(bw / 2 - 9 * scale, -bh, 9 * scale, bh, 2 * scale); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath(); ctx.roundRect(-bw / 2 + 1, -bh + 2, 3 * scale, bh - 4, 1 * scale); ctx.fill();
    ctx.beginPath(); ctx.roundRect(bw / 2 - 3 * scale, -bh + 2, 2 * scale, bh - 4, 1 * scale); ctx.fill();
    // Lintel — stone arch
    ctx.fillStyle = "#a89c86";
    ctx.beginPath(); ctx.roundRect(-bw / 2 - 3 * scale, -bh, bw + 6 * scale, 11 * scale, 3 * scale); ctx.fill();
    ctx.fillStyle = "#6f6658";
    ctx.beginPath(); ctx.roundRect(-bw / 2 - 1 * scale, -bh + 8 * scale, bw + 2 * scale, 3 * scale, 2 * scale); ctx.fill();
    // Moss drip
    ctx.fillStyle = "rgba(126,190,90,0.85)";
    ctx.beginPath(); ctx.roundRect(-bw / 2 - 2 * scale, -bh - 2 * scale, bw + 4 * scale, 4 * scale, 2 * scale); ctx.fill();
    // rune keystone
    ctx.fillStyle = "rgba(56,189,248,0.8)";
    ctx.beginPath(); ctx.arc(0, -bh + 5.5 * scale, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
    // chevron glyph → "slide under"
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, 2 * scale); ctx.lineTo(-4 * scale, -2 * scale); ctx.lineTo(-4 * scale, -5 * scale); ctx.lineTo(0, -1 * scale); ctx.lineTo(4 * scale, -5 * scale); ctx.lineTo(4 * scale, -2 * scale); ctx.closePath();
    ctx.fill();
    void t;
  } else if (kind === "gap") {
    // Broken rope bridge gap — jump
    const bw = w * 26 * scale;
    // rope rails (curved, broken)
    ctx.strokeStyle = "#6f5c45";
    ctx.lineWidth = Math.max(1.4, 1.8 * scale);
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -7 * scale); ctx.quadraticCurveTo(-bw / 6, -4 * scale, 0, -6 * scale); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -6 * scale); ctx.quadraticCurveTo(bw / 6, -8 * scale, bw / 2, -5 * scale); ctx.stroke();
    // plank deck (jagged edges, peeling)
    ctx.fillStyle = "#9d855e";
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -2 * scale);
    ctx.lineTo(-bw / 2 + 3 * scale, 3 * scale);
    ctx.lineTo(-bw / 2 + 7 * scale, 0);
    ctx.lineTo(0, 4 * scale);
    ctx.lineTo(bw / 2 - 6 * scale, 0);
    ctx.lineTo(bw / 2, 3 * scale);
    ctx.lineTo(bw / 2, -3 * scale);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#77603f";
    ctx.fillRect(-bw / 2, -2 * scale, bw, 1.5 * scale);
    // dangling ropes
    ctx.strokeStyle = "rgba(111,92,69,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-bw / 2 + 4 * scale, 3 * scale); ctx.lineTo(-bw / 2 + 2 * scale, 9 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bw / 2 - 5 * scale, 3 * scale); ctx.lineTo(bw / 2 - 8 * scale, 9 * scale); ctx.stroke();
    // cloud gap below + mist
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath(); ctx.ellipse(-bw * 0.12, 9 * scale, bw * 0.24, 6 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bw * 0.1, 14 * scale, bw * 0.18, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();
    // upward chevron → "jump" + glow ring
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(56,189,248,0.5)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -11 * scale); ctx.lineTo(6 * scale, -4 * scale); ctx.lineTo(3.5 * scale, -4 * scale); ctx.lineTo(3.5 * scale, 7 * scale); ctx.lineTo(-3.5 * scale, 7 * scale); ctx.lineTo(-3.5 * scale, -4 * scale); ctx.lineTo(-6 * scale, -4 * scale); ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 9 * scale, 13 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === "boulder") {
    // Rounded mossy boulder with cracks
    const r = 17 * scale;
    const tm = tRefBoulder++;
    // body
    ctx.fillStyle = "#6d665a";
    ctx.beginPath(); ctx.arc(0, -r + 6 * scale, r, 0, Math.PI * 2); ctx.fill();
    // lighter top face
    ctx.fillStyle = "#8a8172";
    ctx.beginPath(); ctx.arc(-3 * scale, -r + 4 * scale, r * 0.62, 0, Math.PI * 2); ctx.fill();
    // dark crevices
    ctx.strokeStyle = "#4a4438";
    ctx.lineWidth = Math.max(1.2, 1.5 * scale);
    ctx.beginPath(); ctx.moveTo(-4 * scale, -r + 4 * scale); ctx.lineTo(2 * scale, -4 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6 * scale, -r + 8 * scale); ctx.lineTo(9 * scale, -2 * scale); ctx.stroke();
    // moss patches
    ctx.fillStyle = "rgba(126,190,90,0.7)";
    ctx.beginPath(); ctx.ellipse(6 * scale, -r + 11 * scale, 4.5 * scale, 2.2 * scale, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-8 * scale, -r + 9 * scale, 3.4 * scale, 1.8 * scale, -0.3, 0, Math.PI * 2); ctx.fill();
    // soft shadow on ground
    ctx.fillStyle = "rgba(15,23,42,0.16)";
    ctx.beginPath(); ctx.ellipse(2 * scale, 4 * scale, r * 0.9, 3.4 * scale, 0, 0, Math.PI * 2); ctx.fill();
    // chevron → dodge-lane
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.5); ctx.lineTo(-4 * scale, -r * 0.5 + 5 * scale); ctx.lineTo(4 * scale, -r * 0.5 + 5 * scale); ctx.closePath(); ctx.fill();
    void tm;
  } else if (kind === "barrier") {
    const bw = w * 26 * scale;
    const bh = 30 * scale;
    // Magical rune wall — dash through
    const base = dashable ? "139,92,246" : "239,68,68";
    ctx.fillStyle = `rgba(${base},0.4)`;
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, bw, bh, 7 * scale); ctx.fill();
    // inner glow gradient
    const g = ctx.createLinearGradient(0, -bh, 0, 0);
    g.addColorStop(0, `rgba(${base},0.9)`);
    g.addColorStop(0.5, `rgba(${base},0.28)`);
    g.addColorStop(1, `rgba(${base},0.85)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.roundRect(-bw / 2 + 2 * scale, -bh + 2 * scale, bw - 4 * scale, bh - 4 * scale, 6 * scale); ctx.stroke();
    // orbiting motes (drift with time)
    const m = tMote++;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.3 * Math.sin(m * 0.0008)})`;
    for (let i = 0; i < 4; i++) {
      const ang = m * 0.0022 + i * Math.PI / 2;
      const ox = Math.cos(ang) * bw * 0.22;
      const oy = Math.sin(ang) * bh * 0.3 - bh * 0.18;
      ctx.beginPath(); ctx.arc(ox, oy, 1.6 * scale, 0, Math.PI * 2); ctx.fill();
    }
    // center symbol
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    if (dashable) {
      ctx.moveTo(0, -bh * 0.36); ctx.lineTo(5 * scale, -bh * 0.18); ctx.lineTo(0, -bh * 0.18); ctx.lineTo(-5 * scale, -bh * 0.36); ctx.closePath();
      ctx.moveTo(0, -bh + bh * 0.42); ctx.lineTo(-5 * scale, -bh + bh * 0.6); ctx.lineTo(0, -bh + bh * 0.6); ctx.lineTo(5 * scale, -bh + bh * 0.42); ctx.closePath();
    } else {
      ctx.beginPath(); // X
      ctx.moveTo(-4 * scale, -bh / 2 - 4 * scale); ctx.lineTo(4 * scale, -bh / 2 + 4 * scale);
      ctx.moveTo(4 * scale, -bh / 2 - 4 * scale); ctx.lineTo(-4 * scale, -bh / 2 + 4 * scale);
      ctx.lineWidth = 2 * scale; ctx.stroke();
    }
    ctx.fill();
  } else if (kind === "pillar") {
    const bw = 22 * scale;
    const bh = 34 * scale;
    // weathered stone pillar with runes + ivy
    ctx.fillStyle = "#7c7263";
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, bw, bh, 3 * scale); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath(); ctx.roundRect(-bw / 2 + 1, -bh + 2, 4 * scale, bh - 4, 2 * scale); ctx.fill();
    ctx.fillStyle = "#63594b";
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, bw, 5 * scale, 2 * scale); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-bw / 2, -7 * scale, bw, 7 * scale, 2 * scale); ctx.fill();
    // carved runes
    ctx.strokeStyle = "rgba(56,189,248,0.55)";
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(-2 * scale, -bh + 12 * scale); ctx.lineTo(-1 * scale, -bh + 18 * scale); ctx.lineTo(2 * scale, -bh + 15 * scale); ctx.lineTo(0, -bh + 22 * scale);
    ctx.stroke();
    // ivy
    ctx.strokeStyle = "rgba(110,190,90,0.9)";
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath(); ctx.moveTo(-bw / 2, -6 * scale); ctx.quadraticCurveTo(-bw / 2 + 2 * scale, -bh * 0.4, -2 * scale, -bh * 0.7); ctx.stroke();
    ctx.fillStyle = "rgba(126,190,90,0.95)";
    ctx.beginPath(); ctx.arc(-bw / 2 + 1 * scale, -bh * 0.35, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-1 * scale, -bh * 0.68, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
    // cyan crystal on top
    ctx.fillStyle = "#52e6db";
    ctx.beginPath(); ctx.moveTo(0, -bh - 9 * scale); ctx.lineTo(-6 * scale, -bh - 1 * scale); ctx.lineTo(6 * scale, -bh - 1 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.moveTo(1 * scale, -bh - 6 * scale); ctx.lineTo(3 * scale, -bh - 2 * scale); ctx.lineTo(-0.5 * scale, -bh - 2 * scale); ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

// tiny time counters for the obstacle animations (module-level so no deps)
let tRefBoulder = 0;
let tMote = 0;

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  kind: CollectibleKind,
  sx: number, sy: number,
  scale: number,
  t: number,
) {
  const bob = Math.sin(t * 0.004 + sx * 0.01) * 4 * scale;
  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.rotate(Math.sin(t * 0.002 + sx) * 0.08);

  // soft drop shadow
  ctx.fillStyle = "rgba(15,23,42,0.18)";
  ctx.beginPath(); ctx.ellipse(0, 11 * scale, 8 * scale, 2.6 * scale, 0, 0, Math.PI * 2); ctx.fill();

  if (kind === "shard") {
    // faceted sky-crystal shard
    const s = 9 * scale;
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "rgba(56,189,248,0.9)";
    ctx.shadowBlur = 10 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.8, 0);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    // bevel highlight
    ctx.fillStyle = "#bae6fd";
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.8, 0); ctx.closePath(); ctx.fill();
    // sparkle
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(0, -s * 0.4, 1 * scale + 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (kind === "fragment") {
    const r = 8 * scale;
    // violet orb with pulsing ring
    ctx.fillStyle = "#a78bfa";
    ctx.shadowColor = "rgba(167,139,250,0.85)";
    ctx.shadowBlur = 12 * scale;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ddd6fe";
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.4, 0, Math.PI * 2); ctx.fill();
    const pr = r * (1 + 0.22 * Math.sin(t * 0.006));
    ctx.strokeStyle = "rgba(196,181,253,0.7)";
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.stroke();
  } else {
    // relic — golden locket with gem
    const r = 9 * scale;
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "rgba(245,158,11,0.9)";
    ctx.shadowBlur = 14 * scale;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // rim
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    // bale loop
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath(); ctx.arc(0, -r - 2 * scale, 2.2 * scale, Math.PI, 0); ctx.stroke();
    // gem center
    ctx.fillStyle = "#f472b6";
    ctx.beginPath(); ctx.moveTo(0, -4 * scale); ctx.lineTo(3.4 * scale, 0); ctx.lineTo(0, 4 * scale); ctx.lineTo(-3.4 * scale, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath(); ctx.moveTo(0, -4 * scale); ctx.lineTo(1.4 * scale, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  scale: number,
  t: number,
) {
  const pulse = 1 + Math.sin(t * 0.005) * 0.06;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(pulse, pulse);
  const w = 44 * scale, h = 50 * scale;
  // Stone portal arch (carved, mossed) — not a flat rounded rect
  ctx.fillStyle = "#8a8070";
  ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 14 * scale); ctx.fill();
  // inner face (recessed arch opening)
  ctx.fillStyle = "#5f5646";
  ctx.beginPath(); ctx.roundRect(-w / 2 + 5 * scale, -h + 6 * scale, w - 10 * scale, h - 6 * scale, 9 * scale); ctx.fill();
  // lintel stone slab on top
  ctx.fillStyle = "#a89c86";
  ctx.beginPath(); ctx.roundRect(-w / 2 - 3 * scale, -h - 6 * scale, w + 6 * scale, 9 * scale, 4 * scale); ctx.fill();
  ctx.fillStyle = "#6f6658";
  ctx.beginPath(); ctx.roundRect(-w / 2 - 3 * scale, -h + 1 * scale, w + 6 * scale, 4 * scale, 2 * scale); ctx.fill();
  // moss between lintel and arch
  ctx.fillStyle = "rgba(126,190,90,0.8)";
  ctx.beginPath(); ctx.ellipse(0, -h - 1 * scale, w * 0.34, 2.6 * scale, 0, 0, Math.PI * 2); ctx.fill();
  // violet swirl vortex inside the arch (radial glow + spiral)
  const g = ctx.createRadialGradient(0, -h / 2, 0, 0, -h / 2, 13 * scale);
  g.addColorStop(0, "rgba(167,139,250,0.85)");
  g.addColorStop(0.55, "rgba(139,92,246,0.4)");
  g.addColorStop(1, "rgba(139,92,246,0.02)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -h / 2, 13 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(221,214,254,0.75)";
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath(); ctx.arc(0, -h / 2, 9 * scale, t * 0.0012, t * 0.0012 + Math.PI * 1.6); ctx.stroke();
  // drifting motes in the vortex
  for (let i = 0; i < 3; i++) {
    const ang = t * 0.003 + i * Math.PI * 2 / 3;
    const rad = 3.5 * scale + Math.sin(t * 0.002 + i * 2) * 2 * scale;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.arc(Math.cos(ang) * rad, -h / 2 + Math.sin(ang) * rad * 0.8, 1.3 * scale, 0, Math.PI * 2); ctx.fill();
  }
  // small "?" glyph — no text
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -h / 2 - 5 * scale, 3.2 * scale, 0.35 * Math.PI, 1.75 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 - 1 * scale);
  ctx.lineTo(0, -h / 2 + 2 * scale);
  ctx.moveTo(-1.8 * scale, -h / 2 + 5 * scale);
  ctx.lineTo(1.8 * scale, -h / 2 + 5 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawFork(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(sx, sy);
  // Three floating meadow platforms — tier color + icon glyph only, no text.
  // lane colors: SAFE=sage green, RISKY=sky blue, RARE=gold.
  const tiers = [
    { fill: "rgba(52,211,153,0.16)", stroke: "rgba(52,211,153,0.95)", glow: "rgba(52,211,153,0.5)" },
    { fill: "rgba(56,189,248,0.16)", stroke: "rgba(56,189,248,0.95)", glow: "rgba(56,189,248,0.5)" },
    { fill: "rgba(251,191,36,0.18)", stroke: "rgba(251,191,36,0.95)", glow: "rgba(251,191,36,0.5)" },
  ];
  for (let i = 0; i < 3; i++) {
    const px = (i - 1) * 40 * scale;
    const pr = tiers[i];
    // soft floating shadow
    ctx.fillStyle = "rgba(15,23,42,0.14)";
    ctx.beginPath(); ctx.ellipse(px, 8 * scale, 20 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();
    // edge glow
    ctx.shadowColor = pr.glow;
    ctx.shadowBlur = 9 * scale;
    // platform body
    ctx.fillStyle = pr.fill;
    ctx.beginPath(); ctx.roundRect(px - 19 * scale, -11 * scale, 38 * scale, 14 * scale, 6 * scale); ctx.fill();
    // grass top strip (like a floating turf pad)
    ctx.fillStyle = "rgba(88,200,120,0.35)";
    ctx.beginPath(); ctx.roundRect(px - 19 * scale, -11 * scale, 38 * scale, 5 * scale, 6 * scale); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = pr.stroke;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath(); ctx.roundRect(px - 19 * scale, -11 * scale, 38 * scale, 14 * scale, 6 * scale); ctx.stroke();
    // icon glyph: circle / diamond / hexagon
    ctx.fillStyle = pr.stroke;
    ctx.beginPath();
    if (i === 0) {
      ctx.arc(px, -4 * scale, 3 * scale, 0, Math.PI * 2); ctx.fill();
    } else if (i === 1) {
      ctx.moveTo(px, -9 * scale); ctx.lineTo(px + 4 * scale, -4 * scale);
      ctx.lineTo(px, 1 * scale); ctx.lineTo(px - 4 * scale, -4 * scale); ctx.closePath(); ctx.fill();
    } else {
      for (let j = 0; j < 6; j++) {
        const a = Math.PI / 6 + j * Math.PI / 3;
        const gx = px + Math.cos(a) * 4 * scale;
        const gy = -4 * scale + Math.sin(a) * 4 * scale;
        if (j === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SkyboundRunner({
  materialId,
  quiz,
  gamePairs,
}: {
  materialId: Id<"materials">;
  quiz: QuizQuestion[];
  gamePairs?: GamePair[];
}) {
  const reduceMotion = useReducedMotion();
  const recordRun = useMutation(api.materials.recordGameRun);
  const pastRuns = useQuery(api.materials.getGameRuns, { materialId });
  const bestPastScore = useMemo(
    () => (pastRuns ? Math.max(0, ...pastRuns.filter(r => r.gameType === "speed").map(r => r.score), 0) : 0),
    [pastRuns],
  );

  const quizPool = useMemo(() => buildQuizPool(quiz, gamePairs), [quiz, gamePairs]);
  const hasQuiz = quizPool.length > 0;

  // Persistent refs (game state that ticks every frame)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const laneRef = useRef<0|1|2>(1);
  const laneVisualRef = useRef(0); // smoothed lane x (-1..1)
  const yRef = useRef(0); // vertical offset (0 = ground, negative = airborne)
  const vyRef = useRef(0);
  const playerStateRef = useRef<PlayerState>("running");
  const slideUntilRef = useRef(0);
  const dashUntilRef = useRef(0);
  const dashCooldownUntilRef = useRef(0);
  const stumbleUntilRef = useRef(0);
  const groundedRef = useRef(true);
  const canDoubleJumpRef = useRef(false);
  const hasShieldRef = useRef(false);
  const magnetUntilRef = useRef(0);

  const speedRef = useRef(BASE_SPEED);
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const shardsRef = useRef(0);
  const fragmentsRef = useRef(0);
  const livesRef = useRef(LIVES_START);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const lastCleanDodgeAtRef = useRef(0);
  const perfectStreakRef = useRef(0);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const gatesRef = useRef<KnowledgeGate[]>([]);
  const forksRef = useRef<Fork[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const nextIdRef = useRef(1);
  const spawnTimerRef = useRef(0);
  const patternIndexRef = useRef(0);
  const gateCooldownRef = useRef(0);

  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const parallaxRef = useRef({ cloud: 0, far: 0, mid: 0 });

  const activeGateRef = useRef<KnowledgeGate | null>(null);
  const forkChoiceRef = useRef<ForkChoice>(null);
  const invulnUntilRef = useRef(0);

  const camRef = useRef({ x: 0, y: 0, zoom: 1, shakeT: 0, shakeAmp: 0 });
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  // lightbox class for shell when fullscreen — keeps runner centered & letterboxed

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!shellRef.current) return;
    if (!isFs) {
      await shellRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, [isFs]);

  useEffect(() => {
    const onChange = () => {
      setIsFs(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  // If Escape pressed while in fullscreen, exit (do not pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFs) {
        document.exitFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFs]);

  // React state (for HUD + screens)
  const [phase, setPhase] = useState<Phase>("idle");
  const [hud, setHud] = useState({ score: 0, distance: 0, shards: 0, fragments: 0, lives: LIVES_START, combo: 0, bestCombo: 0, hasShield: false, dashReady: true, magnetUp: false });
  const [gateQuestion, setGateQuestion] = useState<QuizQuestion | null>(null);
  const [gatePicked, setGatePicked] = useState<number | null>(null);
  const [gateResult, setGateResult] = useState<"correct" | "wrong" | null>(null);
  const [showPerfect, setShowPerfect] = useState(false);
  const [showCombo, setShowCombo] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync phase ref -> state
  const setPhaseBoth = useCallback((p: Phase) => { phaseRef.current = p; setPhase(p); }, []);

  const nextId = useCallback(() => nextIdRef.current++, []);

  // Reset
  const reset = useCallback(() => {
    phaseRef.current = "idle";
    laneRef.current = 1; laneVisualRef.current = 0;
    yRef.current = 0; vyRef.current = 0;
    playerStateRef.current = "running";
    slideUntilRef.current = 0; dashUntilRef.current = 0; dashCooldownUntilRef.current = 0;
    stumbleUntilRef.current = 0; invulnUntilRef.current = 0; groundedRef.current = true; canDoubleJumpRef.current = false;
    hasShieldRef.current = false; magnetUntilRef.current = 0;
    speedRef.current = BASE_SPEED; distanceRef.current = 0; scoreRef.current = 0;
    shardsRef.current = 0; fragmentsRef.current = 0; livesRef.current = LIVES_START;
    comboRef.current = 0; bestComboRef.current = 0; lastCleanDodgeAtRef.current = 0; perfectStreakRef.current = 0;
    obstaclesRef.current = []; collectiblesRef.current = []; gatesRef.current = []; forksRef.current = [];
    particlesRef.current = []; nextIdRef.current = 1; spawnTimerRef.current = 0; patternIndexRef.current = 0;
    gateCooldownRef.current = 0; activeGateRef.current = null; forkChoiceRef.current = null;
    frameRef.current = 0; lastTimeRef.current = 0;
    setGateQuestion(null); setGatePicked(null); setGateResult(null);
    setShowPerfect(false); setShowCombo(null); setFeedback(null);
    setPhase("idle");
    setHud({ score: 0, distance: 0, shards: 0, fragments: 0, lives: LIVES_START, combo: 0, bestCombo: 0, hasShield: false, dashReady: true, magnetUp: false });
  }, []);

  // Abilities
  const tryJump = useCallback(() => {
    if (phaseRef.current !== "running") return;
    if (stumbleUntilRef.current > performance.now()) return;
    if (groundedRef.current) {
      vyRef.current = JUMP_VEL;
      groundedRef.current = false;
      canDoubleJumpRef.current = true;
      playerStateRef.current = "jumping";
    } else if (canDoubleJumpRef.current) {
      vyRef.current = DOUBLE_JUMP_VEL;
      canDoubleJumpRef.current = false;
      playerStateRef.current = "jumping";
      // puff
      for (let i = 0; i < 6; i++) particlesRef.current.push({
        x: laneVisualRef.current * 18, y: yRef.current, vx: randRange(-2, 2), vy: randRange(-1, 1), life: 18, maxLife: 18, color: "rgba(255,255,255,0.9)", size: randRange(2,4),
      });
    }
  }, []);

  const trySlide = useCallback(() => {
    if (phaseRef.current !== "running") return;
    if (!groundedRef.current) return;
    if (stumbleUntilRef.current > performance.now()) return;
    slideUntilRef.current = performance.now() + SLIDE_DURATION;
    playerStateRef.current = "sliding";
  }, []);

  const tryDash = useCallback(() => {
    const now = performance.now();
    if (phaseRef.current !== "running") return;
    if (now < dashCooldownUntilRef.current) return;
    if (stumbleUntilRef.current > now) return;
    dashUntilRef.current = now + DASH_DURATION;
    dashCooldownUntilRef.current = now + DASH_COOLDOWN;
    playerStateRef.current = "dashing";
  }, []);

  const toggleShield = useCallback(() => {
    if (fragmentsRef.current >= 3) {
      fragmentsRef.current -= 3;
      hasShieldRef.current = true;
      setFeedback("Shield active!");
      setTimeout(() => setFeedback(null), 1400);
    }
  }, []);

  const toggleMagnet = useCallback(() => {
    if (fragmentsRef.current >= 2) {
      fragmentsRef.current -= 2;
      magnetUntilRef.current = performance.now() + 5200;
      setFeedback("Magnet on!");
      setTimeout(() => setFeedback(null), 1400);
    }
  }, []);

  const laneTo = useCallback((dir: "left" | "right") => {
    if (phaseRef.current !== "running") return;
    if (stumbleUntilRef.current > performance.now()) return;
    laneRef.current = clamp(dir === "left" ? laneRef.current - 1 : laneRef.current + 1, 0, 2) as 0|1|2;
  }, []);

  // Spawning
  const spawnPattern = useCallback(() => {
    const dist = distanceRef.current;
    const early = dist < 1100;
    const pool = early ? EARLY_PATTERNS : PATTERN_ORDER;
    // Every ~6 patterns, try a knowledge gate if quiz available and cooldown elapsed
    const shouldGate = hasQuiz && gateCooldownRef.current <= 0 && Math.random() < 0.28 && !early;
    if (shouldGate) {
      const lane = pick([0,1,2] as const);
      const q = pick(quizPool);
      gatesRef.current.push({ id: nextId(), z: 820, lane, question: q, passed: false, triggered: false });
      gateCooldownRef.current = 4; // patterns until next gate
      return;
    }
    if (gateCooldownRef.current > 0) gateCooldownRef.current--;

    // First pattern of each run is always a collecting lane — never an obstacle —
    // so players aren't hit before they've even seen the controls.
    let name: PatternName;
    if (patternIndexRef.current === 0) {
      name = "collectTrail";
      patternIndexRef.current = 1; // next time through, yield "collectTrail" again via pool index; skip duplicate
    } else {
      name = pool[patternIndexRef.current % pool.length];
      patternIndexRef.current++;
    }
    const items = PATTERNS[name](nextId, dist);

    for (const it of items) {
      // Fork is a special case (has rewards)
      if ((it as unknown as Fork).rewards) {
        forksRef.current.push(it as unknown as Fork);
      } else if ((it as Collectible).kind === "shard" || (it as Collectible).kind === "fragment" || (it as Collectible).kind === "relic") {
        collectiblesRef.current.push(it as Collectible);
      } else {
        obstaclesRef.current.push(it as Obstacle);
      }
    }

    // Sprinkle a couple shards between obstacles in richer sections
    if (!early && Math.random() < 0.35) {
      for (let i = 0; i < 2; i++) {
        collectiblesRef.current.push({
          id: nextId(), kind: Math.random() < 0.12 ? "relic" : Math.random() < 0.3 ? "fragment" : "shard",
          lane: pick([0,1,2] as const), z: 740 + i * 70, y: Math.random() < 0.3 ? 0.65 : 0, collected: false,
        } as Collectible);
      }
    }
  }, [hasQuiz, nextId, quizPool]);

  // Input handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phaseRef.current === "idle") { setPhaseBoth("running"); return; }
      if (e.key === "Escape" && document.fullscreenElement) { document.exitFullscreen(); return; }
      if (e.key === "Escape" && phaseRef.current === "running") { setPhaseBoth("paused"); return; }
      if (e.key === "Escape" && phaseRef.current === "paused") { setPhaseBoth("running"); return; }
      if (phaseRef.current !== "running") return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") laneTo("left");
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") laneTo("right");
      else if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" || e.key === " ") { e.preventDefault(); tryJump(); }
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") trySlide();
      else if (e.key === "Shift") tryDash();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [laneTo, setPhaseBoth, tryDash, tryJump, trySlide]);

  // Touch
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // double tap = dash
    const now = performance.now();
    const lastTap = (onTouchEnd as unknown as { _lastTap?: number })._lastTap ?? 0;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18 && now - lastTap < 320) {
      tryDash();
      (onTouchEnd as unknown as { _lastTap: number })._lastTap = 0;
      return;
    }
    (onTouchEnd as unknown as { _lastTap: number })._lastTap = now;

    if (phaseRef.current !== "running") return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 28) laneTo(dx > 0 ? "right" : "left");
    } else {
      if (dy < -28) tryJump();
      else if (dy > 28) trySlide();
    }
  }, [laneTo, tryDash, tryJump, trySlide]);

  // Knowledge gate answer
  const answerGate = useCallback((idx: number) => {
    if (!activeGateRef.current || gatePicked !== null) return;
    const g = activeGateRef.current;
    setGatePicked(idx);
    const correct = idx === g.question.correctIndex;
    setGateResult(correct ? "correct" : "wrong");
    if (correct) {
      // reward
      scoreRef.current += 80;
      fragmentsRef.current += 1;
      shardsRef.current += 6;
      for (let i = 0; i < 14; i++) particlesRef.current.push({
        x: 0, y: -18, vx: randRange(-4,4), vy: randRange(-5,-1), life: 22, maxLife: 22, color: pick(["#a78bfa","#38bdf8","#fbbf24"]), size: randRange(2,5),
      });
    }
    setTimeout(() => {
      setGateQuestion(null); setGatePicked(null); setGateResult(null);
      activeGateRef.current = null;
      setPhaseBoth("running");
    }, 900);
  }, [gatePicked, setPhaseBoth]);

  // -------------------------------------------------------------------------
  // Canvas render + game loop
  // -------------------------------------------------------------------------

  const render = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const W = CANVAS_W, H = CANVAS_H;

    // — Cinematic camera transform (zoom on dash, lane lead, jump/slide dip, shake) —
    const cam = camRef.current;
    let shakeX = 0, shakeY = 0;
    if (!reduceMotion && cam.shakeT > 0) {
      const k = cam.shakeT / 300;
      shakeX = (Math.random() - 0.5) * 2 * cam.shakeAmp * k;
      shakeY = (Math.random() - 0.5) * 2 * cam.shakeAmp * k;
    }
    // Base fill covers any edges exposed by zoom-out, so the scene never shows
    // canvas void when the camera pulls back on a dash.
    ctx.fillStyle = "#9fd8f2";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2 + cam.x + shakeX, H / 2 + cam.y + shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-W / 2, -H / 2);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 80);
    sky.addColorStop(0, "#38bdf8");
    sky.addColorStop(0.45, "#7dd3fc");
    sky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HORIZON_Y + 80);

    // Distant floating islands (parallax)
    const farOff = parallaxRef.current.far;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    for (let i = 0; i < 5; i++) {
      const px = ((i * 110 + farOff * 0.18) % (W + 160)) - 80;
      const py = 68 + Math.sin(i * 1.7 + farOff * 0.0006) * 8;
      ctx.beginPath();
      ctx.ellipse(px, py, 44 + i * 6, 18 + i * 2, 0, 0, Math.PI * 2); ctx.fill();
      // island top
      ctx.fillStyle = "rgba(34,197,94,0.9)";
      ctx.beginPath(); ctx.ellipse(px, py + 6, 36 + i * 5, 10 + i, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(120,113,108,0.95)";
      ctx.beginPath(); ctx.ellipse(px, py + 10, 30 + i * 4, 7 + i, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
    }
    // Closer islands
    const midOff = parallaxRef.current.mid;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (let i = 0; i < 4; i++) {
      const px = ((i * 150 + midOff * 0.42) % (W + 200)) - 100;
      const py = 98 + Math.sin(i * 2.1 + midOff * 0.0009) * 6;
      ctx.beginPath(); ctx.ellipse(px, py, 58, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(34,197,94,0.92)"; ctx.beginPath(); ctx.ellipse(px, py + 7, 50, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(120,113,108,0.96)"; ctx.beginPath(); ctx.ellipse(px, py + 11, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
    }

    // Cloud sea below track (subtle)
    const cloudOff = parallaxRef.current.cloud;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 6; i++) {
      const px = ((i * 90 + cloudOff * 0.6) % (W + 120)) - 60;
      const py = HORIZON_Y + 14 + (i % 3) * 14;
      const s = 0.9 + (i % 2) * 0.2;
      ctx.beginPath(); ctx.ellipse(px, py, 34 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 18 * s, py - 2, 26 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Track — perspective trapezoid
    const trackLeftNear = (W - TRACK_W_NEAR) / 2;
    const trackRightNear = (W + TRACK_W_NEAR) / 2;
    const trackLeftFar = (W - TRACK_W_FAR) / 2;
    const trackRightFar = (W + TRACK_W_FAR) / 2;

    // — MEADOW ISLES: floating slab beneath the path —
    // Side rock face (gives the island volume + sells "floating")
    const slabDepth = 18;
    ctx.fillStyle = "#a0906f";
    ctx.beginPath();
    ctx.moveTo(trackLeftFar, HORIZON_Y);
    ctx.lineTo(trackRightFar, HORIZON_Y);
    ctx.lineTo(trackRightFar - 2, HORIZON_Y + 5);
    ctx.lineTo(trackRightNear + 6, GROUND_Y + slabDepth);
    ctx.lineTo(trackLeftNear - 6, GROUND_Y + slabDepth);
    ctx.lineTo(trackLeftFar + 2, HORIZON_Y + 5);
    ctx.closePath(); ctx.fill();
    // darker crevice / underside
    ctx.fillStyle = "rgba(120,103,77,0.95)";
    ctx.beginPath();
    ctx.moveTo(trackLeftNear - 6, GROUND_Y + 4);
    ctx.lineTo(trackRightNear + 6, GROUND_Y + 4);
    ctx.lineTo(trackRightNear + 6, GROUND_Y + slabDepth);
    ctx.lineTo(trackLeftNear - 6, GROUND_Y + slabDepth);
    ctx.closePath(); ctx.fill();
    // grass lip on top edge of slab
    ctx.fillStyle = "#88d46f";
    ctx.beginPath();
    ctx.moveTo(trackLeftFar, HORIZON_Y);
    ctx.lineTo(trackRightFar, HORIZON_Y);
    ctx.lineTo(trackRightNear + 1, GROUND_Y + 3);
    ctx.lineTo(trackLeftNear - 1, GROUND_Y + 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#63b650";
    ctx.beginPath();
    ctx.moveTo(trackLeftNear - 1, GROUND_Y + 1);
    ctx.lineTo(trackRightNear + 1, GROUND_Y + 1);
    ctx.lineTo(trackRightNear + 1, GROUND_Y + 3.5);
    ctx.lineTo(trackLeftNear - 1, GROUND_Y + 3.5);
    ctx.closePath(); ctx.fill();
    // roots hanging off the lip (near portion only)
    ctx.strokeStyle = "rgba(94,72,44,0.55)";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const x = lerp(trackLeftNear, trackRightNear, t);
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 4);
        ctx.quadraticCurveTo(x + 3, GROUND_Y + 10, x - 1, GROUND_Y + 14);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 4);
        ctx.quadraticCurveTo(x - 2, GROUND_Y + 9, x + 2, GROUND_Y + 12);
        ctx.stroke();
      }
    }

    // — Stone paver road (replaces flat green) —
    // base stone
    ctx.fillStyle = "#cfc3a8";
    ctx.beginPath();
    ctx.moveTo(trackLeftFar, HORIZON_Y);
    ctx.lineTo(trackRightFar, HORIZON_Y);
    ctx.lineTo(trackRightNear, GROUND_Y);
    ctx.lineTo(trackLeftNear, GROUND_Y);
    ctx.closePath(); ctx.fill();
    // subtle warm stone gradient toward horizon
    {
      const g = ctx.createLinearGradient(0, HORIZON_Y, 0, GROUND_Y);
      g.addColorStop(0, "rgba(207,195,168,0.0)");
      g.addColorStop(0.55, "rgba(185,171,140,0.18)");
      g.addColorStop(1, "rgba(154,137,99,0.22)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(trackLeftFar, HORIZON_Y);
      ctx.lineTo(trackRightFar, HORIZON_Y);
      ctx.lineTo(trackRightNear, GROUND_Y);
      ctx.lineTo(trackLeftNear, GROUND_Y);
      ctx.closePath(); ctx.fill();
    }
    // grout + paver tiles receding with perspective
    const paveStep = 44;
    const paveOff = distanceRef.current * 0.55 % paveStep;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trackLeftFar, HORIZON_Y);
    ctx.lineTo(trackRightFar, HORIZON_Y);
    ctx.lineTo(trackRightNear, GROUND_Y);
    ctx.lineTo(trackLeftNear, GROUND_Y);
    ctx.closePath(); ctx.clip();
    // horizontal grout every tile
    ctx.strokeStyle = "rgba(143,130,95,0.55)";
    for (let sz = paveOff; sz < 700; sz += paveStep) {
      const sc = perspectiveScale(sz);
      if (sc < 0.07) continue;
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      ctx.lineWidth = Math.max(1, 1.4 * sc + 0.4);
      ctx.globalAlpha = 0.55 + sc * 0.35;
      ctx.beginPath(); ctx.moveTo(trackLeftFar + (1 - sc) * 6, y); ctx.lineTo(trackRightFar - (1 - sc) * 6, y); ctx.stroke();
    }
    // vertical grout — staggered brick (every other row offset)
    for (let row = 0; row < 16; row++) {
      const z = row * paveStep - paveOff;
      const sc = perspectiveScale(Math.max(20, z));
      if (sc < 0.08) continue;
      const y0 = lerp(HORIZON_Y, GROUND_Y, sc);
      const y1 = lerp(HORIZON_Y, GROUND_Y, perspectiveScale(Math.max(20, z + paveStep)));
      const w = lerp(TRACK_W_FAR, TRACK_W_NEAR, sc);
      const x0 = (W - w) / 2;
      const cols = 4 + (row % 2); // stagger
      const colW = w / cols;
      const off = (row % 2 === 0) ? 0 : colW * 0.5;
      ctx.lineWidth = Math.max(1, 1.1 * sc + 0.3);
      ctx.globalAlpha = 0.35 + sc * 0.22;
      for (let c = 0; c <= cols; c++) {
        const cx = x0 + off + c * colW;
        if (cx < x0 - 2 || cx > x0 + w + 2) continue;
        ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.stroke();
      }
      // faint rune inlay on occasional tiles (center lane, near-mid)
      if (row % 4 === 2 && sc > 0.22) {
        const rx = W / 2; const ry = (y0 + y1) / 2;
        const rs = 3.2 * sc;
        ctx.globalAlpha = 0.18 + sc * 0.18;
        ctx.strokeStyle = "rgba(251,191,36,0.95)";
        ctx.lineWidth = 1 * sc + 0.6;
        ctx.beginPath();
        ctx.moveTo(rx - rs, ry); ctx.lineTo(rx + rs, ry);
        ctx.moveTo(rx, ry - rs); ctx.lineTo(rx, ry + rs);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(rx, ry, rs * 0.7, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // lane grooves (inset darker paver lines, not highway dashes)
    ctx.strokeStyle = "rgba(120,103,77,0.22)";
    ctx.lineWidth = 1.6;
    for (let lane = 0; lane < 2; lane++) {
      const tNear = (lane === 0 ? -1 : 1) * 0.33;
      const nearX = W / 2 + tNear * TRACK_W_NEAR / 2;
      const farX = W / 2 + tNear * TRACK_W_FAR / 2;
      ctx.beginPath(); ctx.moveTo(farX, HORIZON_Y); ctx.lineTo(nearX, GROUND_Y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(farX, HORIZON_Y); ctx.lineTo(nearX, GROUND_Y); ctx.stroke();
      ctx.strokeStyle = "rgba(120,103,77,0.22)"; ctx.lineWidth = 1.6;
    }
    // moss at edges (thin, not neon)
    ctx.fillStyle = "rgba(110,190,90,0.55)";
    for (let z = 50; z < 740; z += 110) {
      const sc = perspectiveScale(z);
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      const w = lerp(TRACK_W_FAR, TRACK_W_NEAR, sc) * 0.02;
      const ml = lerp(trackLeftFar, trackLeftNear, sc);
      const mr = lerp(trackRightFar, trackRightNear, sc);
      ctx.beginPath(); ctx.ellipse(ml + 3 * sc, y, 4 * sc, 2.2 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(mr - 3 * sc, y, 4 * sc, 2.2 * sc, 0, 0, Math.PI * 2); ctx.fill();
      void w;
    }

    // Crystal decorations on track edges (Moss + small crystals)
    for (let i = 0; i < 5; i++) {
      const z = 120 + i * 140 + (distanceRef.current * 0.2 % 140);
      if (z > 750) continue;
      const sc = perspectiveScale(z);
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      const edgeL = lerp(trackLeftNear, trackLeftFar, sc) - 4;
      const edgeR = lerp(trackRightNear, trackRightFar, sc) + 4;
      ctx.fillStyle = "rgba(34,211,238,0.9)";
      ctx.beginPath(); ctx.moveTo(edgeL, y); ctx.lineTo(edgeL - 4 * sc, y - 8 * sc); ctx.lineTo(edgeL + 4 * sc, y - 8 * sc); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(edgeR, y); ctx.lineTo(edgeR - 4 * sc, y - 8 * sc); ctx.lineTo(edgeR + 4 * sc, y - 8 * sc); ctx.closePath(); ctx.fill();
    }

    // --- World objects (back-to-front) ---
    // Collect forks, gates, obstacles, collectibles together by z for correct depth
    type DrawItem =
      | { z: number; draw: () => void };

    const items: DrawItem[] = [];

    for (const g of gatesRef.current) {
      if (g.passed) continue;
      const sc = perspectiveScale(g.z);
      if (sc <= 0.07) continue;
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      const laneX = laneWorldX(g.lane) * sc * 0.55;
      const sx = W / 2 + laneX;
      items.push({ z: g.z, draw: () => drawGate(ctx, sx, y, sc, t) });
    }
    for (const f of forksRef.current) {
      if (f.passed) continue;
      const sc = perspectiveScale(f.z);
      if (sc <= 0.07) continue;
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      items.push({ z: f.z, draw: () => drawFork(ctx, W / 2, y, sc) });
    }
    for (const c of collectiblesRef.current) {
      if (c.collected) continue;
      const sc = perspectiveScale(c.z);
      if (sc <= 0.07) continue;
      const y = lerp(HORIZON_Y, GROUND_Y, sc) - c.y * 26 * sc;
      const laneX = laneWorldX(c.lane) * sc * 0.55;
      const sx = W / 2 + laneX;
      items.push({ z: c.z, draw: () => drawCollectible(ctx, c.kind, sx, y, sc, t) });
    }
    for (const o of obstaclesRef.current) {
      if (o.passed) continue;
      const sc = perspectiveScale(o.z);
      if (sc <= 0.07) continue;
      const y = lerp(HORIZON_Y, GROUND_Y, sc);
      if (o.span) {
        const w = o.width;
        const sx = W / 2;
        items.push({ z: o.z, draw: () => drawObstacle(ctx, o.kind, sx, y, w, 1, sc, o.dashable) });
      } else {
        const laneX = laneWorldX(o.lane) * sc * 0.55;
        const sx = W / 2 + laneX;
        items.push({ z: o.z, draw: () => drawObstacle(ctx, o.kind, sx, y, 1, 1, sc, o.dashable) });
      }
    }

    items.sort((a, b) => b.z - a.z); // far first
    for (const it of items) it.draw();

    // Particles (over world, under player)
    for (const p of particlesRef.current) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player
    const playerLaneX = laneVisualRef.current * LANE_W * 0.55 * 0.92;
    const playerY = PLAYER_SCREEN_Y + yRef.current; // yRef 0=ground, negative=up
    const dashing = dashUntilRef.current > t;
    const stumbling = stumbleUntilRef.current > t;
    drawPlayer(ctx, W / 2, playerY, stumbling ? "stumble" : playerStateRef.current, playerLaneX, frameRef.current, hasShieldRef.current, dashing, 1);

    // Speed lines on dash
    if (dashing && !reduceMotion) {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const x = W / 2 + (Math.random() - 0.5) * 320;
        const y0 = PLAYER_SCREEN_Y - 40 + Math.random() * 80;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 18, y0); ctx.stroke();
      }
    }

    ctx.restore();

    // Vignette (screen-locked — outside the camera transform)
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.9);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(15,23,42,0.14)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }, [reduceMotion]);

  // Main tick
  const tick = useCallback((now: number) => {
    const dt = lastTimeRef.current ? Math.min(32, now - lastTimeRef.current) : 16;
    lastTimeRef.current = now;
    frameRef.current += dt * 0.06;

    if (phaseRef.current === "running") {
      const isDashing = dashUntilRef.current > now;
      const curSpeed = speedRef.current + (isDashing ? DASH_SPEED_BONUS : 0);

      // Speed ramp
      speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_RAMP * dt);

      // Distance + score trickle
      distanceRef.current += curSpeed * dt * 0.06;
      scoreRef.current += curSpeed * dt * 0.02;

      // Smooth lane visual
      const targetLaneX = laneRef.current - 1;
      laneVisualRef.current = lerp(laneVisualRef.current, targetLaneX, Math.min(1, dt * 0.018));

      // Vertical physics
      const sliding = slideUntilRef.current > now;
      const stumbling = stumbleUntilRef.current > now;

      if (!groundedRef.current) {
        vyRef.current += GRAVITY;
        yRef.current += vyRef.current * dt * 0.06;
        if (yRef.current >= 0) {
          yRef.current = 0; vyRef.current = 0; groundedRef.current = true;
          canDoubleJumpRef.current = false;
          if (!sliding && !isDashing && !stumbling) playerStateRef.current = "running";
          // landing puff
          for (let i = 0; i < 5; i++) particlesRef.current.push({
            x: CANVAS_W / 2 + laneVisualRef.current * 22, y: PLAYER_SCREEN_Y + 12,
            vx: randRange(-2.5, 2.5), vy: randRange(-2, -0.3), life: 14, maxLife: 14,
            color: "rgba(255,255,255,0.75)", size: randRange(2, 3.2),
          });
        }
      } else {
        if (sliding) playerStateRef.current = "sliding";
        else if (isDashing) playerStateRef.current = "dashing";
        else if (stumbling) playerStateRef.current = "stumble";
        else playerStateRef.current = "running";
      }
      if (sliding && slideUntilRef.current <= now && groundedRef.current) {
        playerStateRef.current = "running";
      }
      if (isDashing && dashUntilRef.current <= now) {
        if (groundedRef.current && !sliding) playerStateRef.current = "running";
      }
      if (stumbling && stumbleUntilRef.current <= now) {
        playerStateRef.current = "running";
      }

      // — Cinematic camera (x/y/zoom/shake, respects reducedMotion) —
      {
        const cam = camRef.current;
        const zoomTarget = isDashing ? 0.97 : 1;
        const zoomRate = reduceMotion ? 0.006 : 0.012;
        cam.zoom = lerp(cam.zoom, zoomTarget, Math.min(1, dt * zoomRate));
        const xTarget = -laneVisualRef.current * 8;
        cam.x = lerp(cam.x, xTarget, Math.min(1, dt * 0.012));
        let yTarget = 0;
        if (!groundedRef.current) {
          const airFrac = clamp(-yRef.current / 55, 0, 1);
          yTarget = airFrac * 6;
        }
        if (sliding) yTarget = 4;
        if (stumbling) yTarget = 5;
        cam.y = lerp(cam.y, yTarget, Math.min(1, dt * 0.02));
        if (stumbling && stumbleUntilRef.current > now) {
          cam.shakeT = 300;
          cam.shakeAmp = 4;
        }
        if (cam.shakeT > 0) cam.shakeT -= dt;
        if (cam.shakeT < 0) cam.shakeT = 0;
        if (reduceMotion) cam.shakeT = 0;
      }

      // Move world objects toward player.
      // Units are world-pace matched to the jump arc and distance term (both *0.06),
      // so an obstacle at the horizon reaches the player in ~2s at base speed —
      // a reactionable window. (A 0.6 multiplier was 10x too fast to react to.)
      const move = curSpeed * dt * 0.06;
      for (const o of obstaclesRef.current) o.z -= move;
      for (const c of collectiblesRef.current) c.z -= move;
      for (const g of gatesRef.current) g.z -= move;
      for (const f of forksRef.current) f.z -= move;

      // Parallax
      parallaxRef.current.cloud += curSpeed * dt * 0.12;
      parallaxRef.current.far += curSpeed * dt * 0.04;
      parallaxRef.current.mid += curSpeed * dt * 0.08;

      // Cull passed
      obstaclesRef.current = obstaclesRef.current.filter(o => o.z > -80 && !o.passed);
      collectiblesRef.current = collectiblesRef.current.filter(c => c.z > -80 && !c.collected);
      gatesRef.current = gatesRef.current.filter(g => g.z > -80 && !g.passed);
      forksRef.current = forksRef.current.filter(f => f.z > -80 && !f.passed);

      // Magnet: pull nearby shards
      const magnetOn = magnetUntilRef.current > now;
      if (magnetOn) {
        for (const c of collectiblesRef.current) {
          if (c.collected) continue;
          if (c.z < 220 && c.z > -20) {
            // lerp lane toward player lane
            const dl = laneRef.current - c.lane;
            if (Math.abs(dl) <= 1.2) {
              c.z -= 3.2; // pull forward
              // lane pull
              if (Math.abs(dl) > 0.08) c.lane = (c.lane + Math.sign(dl) * 0.12) as 0|1|2;
            }
          }
        }
      }

      // Spawn pacing
      spawnTimerRef.current -= move;
      if (spawnTimerRef.current <= 0) {
        spawnPattern();
        // spacing scales with speed: faster = tighter
        const gap = clamp(520 - speedRef.current * 18, 340, 640);
        spawnTimerRef.current = gap;
      }

      // Collisions — obstacles
      const playerLane = laneRef.current;
      const playerY = yRef.current; // 0 ground, negative air
      const isSliding = slideUntilRef.current > now;
      const canDashThrough = isDashing;

      for (const o of obstaclesRef.current) {
        if (o.passed || o.hit) continue;
        if (o.z > 45 || o.z < -18) continue;
        // invincibility window after a hit — skip collision, still mark passed if behind player
        if (now < invulnUntilRef.current) {
          if (o.z < 6) {
            o.passed = true;
            // no combo/dodge bonus during i-frames
          }
          continue;
        }

        // lane check
        const laneMatch = o.span ? true : o.lane === playerLane;
        if (!laneMatch) {
          // Fork-adjacent obstacles already handled by dodge
          // Mark as passed if about to go behind player
          if (o.z < 6) {
            o.passed = true;
            // perfect dodge bonus if the player was in a different lane
            if (!o.span) {
              const withinWindow = now - lastCleanDodgeAtRef.current < COMBO_WINDOW;
              comboRef.current = withinWindow ? comboRef.current + 1 : 1;
              lastCleanDodgeAtRef.current = now;
              bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
              perfectStreakRef.current++;
              scoreRef.current += OBSTACLE_SCORE + (comboRef.current > 1 ? comboRef.current * 6 : 0);
              if (comboRef.current >= 3) {
                setShowCombo(comboRef.current);
                setTimeout(() => setShowCombo(null), 650);
              }
              if (perfectStreakRef.current % 3 === 0) {
                setShowPerfect(true); setTimeout(() => setShowPerfect(false), 520);
              }
            }
          }
          continue;
        }

        // In same lane — check vertical / special
        let hit = false;
        if (o.kind === "gap") {
          // must be airborne (y < -6)
          if (playerY > -6) hit = true;
        } else if (o.kind === "arch") {
          // must be sliding
          if (!isSliding) hit = true;
        } else if (o.kind === "barrier") {
          if (o.dashable) {
            if (!canDashThrough) hit = true;
            else {
              // dash through — reward
              o.passed = true;
              scoreRef.current += 50;
              for (let i = 0; i < 10; i++) particlesRef.current.push({
                x: CANVAS_W / 2 + laneWorldX(playerLane) * 0.42, y: PLAYER_SCREEN_Y - 10,
                vx: randRange(-5, 5), vy: randRange(-4, 2), life: 16, maxLife: 16,
                color: pick(["#a78bfa","#c4b5fd","#38bdf8"]), size: randRange(2,4),
              });
              continue;
            }
          } else hit = true;
        } else {
          // boulder / pillar — must dodge lane (already laneMatch) so hit, unless airborne over small boulder
          if (o.kind === "boulder" && playerY < -10) {
            o.passed = true;
            scoreRef.current += OBSTACLE_SCORE + 10;
            continue;
          }
          hit = true;
        }

        if (hit) {
          if (hasShieldRef.current) {
            hasShieldRef.current = false;
            o.passed = true;
            for (let i = 0; i < 12; i++) particlesRef.current.push({
              x: CANVAS_W / 2, y: PLAYER_SCREEN_Y - 8, vx: randRange(-4,4), vy: randRange(-4,1), life: 18, maxLife: 18,
              color: "rgba(56,189,248,0.95)", size: randRange(2,4),
            });
            setFeedback("Shield saved you!");
            setTimeout(() => setFeedback(null), 1100);
            continue;
          }
          o.hit = true; o.passed = true;
          livesRef.current -= 1;
          comboRef.current = 0; perfectStreakRef.current = 0;
          stumbleUntilRef.current = now + STUMBLE_DURATION;
          invulnUntilRef.current = now + 1300; // invincibility after hit
          playerStateRef.current = "stumble";
          // knock
          for (let i = 0; i < 10; i++) particlesRef.current.push({
            x: CANVAS_W / 2, y: PLAYER_SCREEN_Y - 6, vx: randRange(-4,4), vy: randRange(-3,1), life: 16, maxLife: 16,
            color: "rgba(239,68,68,0.9)", size: randRange(2,3.5),
          });
          if (livesRef.current <= 0) {
            setPhaseBoth("gameover");
            void recordRun({ materialId, gameType: "speed", score: Math.floor(scoreRef.current), bestStreak: bestComboRef.current });
          } else {
            setPhaseBoth("crashed");
            setTimeout(() => { if (phaseRef.current === "crashed") setPhaseBoth("running"); }, 680);
          }
          break;
        } else {
          // clean pass
          o.passed = true;
          scoreRef.current += OBSTACLE_SCORE;
          const withinWindow = now - lastCleanDodgeAtRef.current < COMBO_WINDOW;
          comboRef.current = withinWindow ? comboRef.current + 1 : 1;
          lastCleanDodgeAtRef.current = now;
          bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
          if (comboRef.current >= 3) { setShowCombo(comboRef.current); setTimeout(() => setShowCombo(null), 650); }
        }
      }

      // Collectibles
      for (const c of collectiblesRef.current) {
        if (c.collected) continue;
        if (c.z > 38 || c.z < -10) continue;
        if (c.lane !== playerLane) continue;
        // y check: shards on ground need grounded or low air, high ones need air
        if (c.y > 0.3 && playerY > -4) continue;
        c.collected = true;
        if (c.kind === "shard") { shardsRef.current += 1; scoreRef.current += SHARD_SCORE; }
        else if (c.kind === "fragment") { fragmentsRef.current += 1; scoreRef.current += FRAGMENT_SCORE; }
        else { shardsRef.current += 3; fragmentsRef.current += 1; scoreRef.current += RELIC_SCORE; }
        // pop
        for (let i = 0; i < 6; i++) particlesRef.current.push({
          x: CANVAS_W / 2 + laneWorldX(c.lane) * 0.4, y: PLAYER_SCREEN_Y + (c.y > 0.3 ? -18 : 6),
          vx: randRange(-2.5,2.5), vy: randRange(-3, -0.5), life: 14, maxLife: 14,
          color: c.kind === "shard" ? "#38bdf8" : c.kind === "fragment" ? "#a78bfa" : "#f59e0b",
          size: randRange(2,3),
        });
      }

      // Knowledge gates — trigger when close
      for (const g of gatesRef.current) {
        if (g.passed || g.triggered) continue;
        if (g.z < 42 && g.z > -6 && g.lane === playerLane) {
          g.triggered = true; g.passed = true;
          activeGateRef.current = g;
          setGateQuestion(g.question as unknown as QuizQuestion);
          setGatePicked(null); setGateResult(null);
          setPhaseBoth("knowledge");
          break;
        }
        if (g.z < -6) g.passed = true;
      }

      // Forks — choose by lane when passing
      for (const f of forksRef.current) {
        if (f.passed) continue;
        if (f.z < 18 && f.z > -10) {
          f.chosenLane = playerLane;
          const tier = f.rewards[playerLane];
          if (tier === "risky") { shardsRef.current += 4; scoreRef.current += 60; }
          else if (tier === "rare") { shardsRef.current += 3; fragmentsRef.current += 1; scoreRef.current += 90; }
          else { shardsRef.current += 1; scoreRef.current += 20; }
          f.passed = true;
          // bonus collectibles on rare route
          if (tier === "rare") {
            for (let i = 0; i < 3; i++) collectiblesRef.current.push({
              id: nextId(), kind: i === 1 ? "fragment" : "shard", lane: playerLane, z: 220 + i * 50, y: 0.45, collected: false,
            } as Collectible);
          }
        }
        if (f.z < -10) f.passed = true;
      }

      // Particles tick
      for (const p of particlesRef.current) { p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life--; }
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // HUD push (throttled)
      if (frameRef.current % 3 < 1) {
        setHud({
          score: Math.floor(scoreRef.current),
          distance: Math.floor(distanceRef.current),
          shards: shardsRef.current,
          fragments: fragmentsRef.current,
          lives: livesRef.current,
          combo: comboRef.current,
          bestCombo: bestComboRef.current,
          hasShield: hasShieldRef.current,
          dashReady: now >= dashCooldownUntilRef.current,
          magnetUp: magnetUntilRef.current > now,
        });
      }
    }

    // Render (DPR-crisp backing store)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render(ctx, now);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [recordRun, materialId, render, setPhaseBoth, spawnPattern, nextId]);

  // Start/stop RAF
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  // When phase becomes running / paused / knowledge, ensure RAF keeps going — tick handles it.

  const startRun = useCallback(() => {
    // reset world for a fresh run
    laneRef.current = 1; laneVisualRef.current = 0;
    yRef.current = 0; vyRef.current = 0;
    playerStateRef.current = "running";
    slideUntilRef.current = 0; dashUntilRef.current = 0; dashCooldownUntilRef.current = 0;
    stumbleUntilRef.current = 0; invulnUntilRef.current = 0; groundedRef.current = true; canDoubleJumpRef.current = false;
    hasShieldRef.current = false; magnetUntilRef.current = 0;
    speedRef.current = BASE_SPEED; distanceRef.current = 0; scoreRef.current = 0;
    shardsRef.current = 0; fragmentsRef.current = 0; livesRef.current = LIVES_START;
    comboRef.current = 0; bestComboRef.current = 0; lastCleanDodgeAtRef.current = 0; perfectStreakRef.current = 0;
    obstaclesRef.current = []; collectiblesRef.current = []; gatesRef.current = []; forksRef.current = [];
    particlesRef.current = []; patternIndexRef.current = 0; gateCooldownRef.current = 2;
    spawnTimerRef.current = 420;
    setPhaseBoth("running");
  }, [setPhaseBoth]);

  const canAffordShield = hud.fragments >= 3;
  const canAffordMagnet = hud.fragments >= 2;

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------

  return (
    <div className={isFs ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950' : 'mx-auto max-w-[560px] select-none'}
         role="region"
         aria-label="Skybound — Meadow Isles">
      {/* Top bar — only when running/paused/crashed/knowledge */}
      {phase !== "idle" && phase !== "gameover" && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white">
              <Trophy className="h-3.5 w-3.5 text-amber-300" /> {hud.score.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <Mountain className="h-3.5 w-3.5 text-sky-500" /> {hud.distance} m
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-1.5 text-xs font-extrabold text-white">
              <Gem className="h-3.5 w-3.5" /> {hud.shards}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1.5 text-xs font-extrabold text-white">
              <BookOpen className="h-3.5 w-3.5" /> {hud.fragments}
            </span>
            <div className="ml-1 flex items-center gap-1" aria-label={`${hud.lives} lives`}>
              {Array.from({ length: LIVES_START }).map((_, i) => (
                <Heart key={i} className={`h-4 w-4 ${i < hud.lives ? "fill-red-500 text-red-500" : "text-slate-300"}`} />
              ))}
            </div>
            {phase === "running" ? (
              <button onClick={() => setPhaseBoth("paused")} aria-label="Pause" className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
                <Pause className="h-4 w-4" />
              </button>
            ) : phase === "paused" ? (
              <button onClick={() => setPhaseBoth("running")} aria-label="Resume" className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800">
                <Play className="h-4 w-4" />
              </button>
            ) : null}
            <button onClick={toggleFullscreen} aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Canvas shell */}
      <div
        ref={shellRef}
        className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-sky-50 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
        style={
          isFs
            ? { height: "min(100vh - 24px, calc((100vw - 24px) * 4 / 3 + 0px))", maxHeight: "calc(100vh - 24px)", width: "min(100vw - 24px, calc((100vh - 24px) * 3 / 4))" }
            : { height: CANVAS_H, maxHeight: "min(74vh, 640px)" }
        }
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={isFs ? "block h-full w-full object-contain" : "block h-full w-full object-cover"}
          style={{ display: "block" }}
        />

        {/* Combo / Perfect overlays */}
        <AnimatePresence>
          {showPerfect && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute left-1/2 top-[22%] -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black tracking-widest text-amber-950 shadow-lg"
            >
              PERFECT DODGE!
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showCombo !== null && (
            <motion.div
              key={showCombo}
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg"
            >
              <Flame className="h-4 w-4 text-amber-400" /> x{showCombo} COMBO
            </motion.div>
          )}
        </AnimatePresence>

        {feedback && (
          <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow">
            {feedback}
          </div>
        )}

        {/* Ability bar — over canvas bottom */}
        {phase === "running" && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShield}
                disabled={!canAffordShield || hud.hasShield}
                className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold shadow ${hud.hasShield ? "bg-sky-500 text-white" : canAffordShield ? "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50" : "bg-white/60 text-slate-400 border border-slate-200"}`}
              >
                <Shield className="h-4 w-4" /> Shield {hud.hasShield ? "ON" : "· 3◆"}
              </button>
              <button
                onClick={toggleMagnet}
                disabled={!canAffordMagnet || hud.magnetUp}
                className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold shadow ${hud.magnetUp ? "bg-violet-600 text-white" : canAffordMagnet ? "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50" : "bg-white/60 text-slate-400 border border-slate-200"}`}
              >
                <Sparkles className="h-4 w-4" /> Magnet {hud.magnetUp ? "ON" : "· 2◆"}
              </button>
            </div>
            <button
              onClick={tryDash}
              disabled={!hud.dashReady}
              className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black shadow ${hud.dashReady ? "bg-amber-400 text-amber-950 hover:bg-amber-300" : "bg-slate-900 text-white border border-slate-700"}`}
            >
              <Zap className="h-4 w-4" /> DASH
            </button>
          </div>
        )}

        {/* Tap hints — desktop uses keys, mobile uses swipes */}
        {phase === "running" && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-600 shadow">
            ← → lane &nbsp;·&nbsp; ↑ jump / double-jump &nbsp;·&nbsp; ↓ slide &nbsp;·&nbsp; Shift dash
          </div>
        )}

        {/* Knowledge gate modal */}
        <AnimatePresence>
          {phase === "knowledge" && gateQuestion && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }}
                className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-violet-600">
                  <Star className="h-3.5 w-3.5" /> KNOWLEDGE GATE · optional
                </p>
                <h3 className="mt-2 text-[15px] font-extrabold leading-snug text-slate-900">
                  {gateQuestion.question}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{gateQuestion.topic}</p>
                <div className="mt-4 grid gap-2">
                  {gateQuestion.options.map((opt, i) => {
                    const picked = gatePicked === i;
                    const isCorrect = i === gateQuestion.correctIndex;
                    const showState = gatePicked !== null;
                    return (
                      <button
                        key={i}
                        onClick={() => answerGate(i)}
                        disabled={gatePicked !== null}
                        className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition
                          ${!showState ? "border-slate-300 bg-white hover:border-violet-400 hover:bg-violet-50 text-slate-950"
                            : picked && isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : picked && !isCorrect ? "border-red-300 bg-red-50 text-red-700"
                            : isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-600"}`}
                      >
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {gateResult && (
                  <p className={`mt-3 text-center text-sm font-bold ${gateResult === "correct" ? "text-emerald-600" : "text-amber-600"}`}>
                    {gateResult === "correct" ? "Correct! +80 pts · +1 fragment · +6 shards" : "Not quite — you keep running either way."}
                  </p>
                )}
                <p className="mt-3 text-center text-xs text-slate-400">Wrong answers don’t end the run. Learning helps, never punishes.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paused */}
        <AnimatePresence>
          {phase === "paused" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/45 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
                <p className="text-xs font-bold tracking-widest text-slate-500">PAUSED</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Take a breath, explorer</h3>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => setPhaseBoth("running")} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                    <Play className="h-4 w-4" /> Resume
                  </button>
                  <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    <RefreshCw className="h-4 w-4" /> Restart
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crashed flash */}
        <AnimatePresence>
          {phase === "crashed" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.18 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 bg-red-500" />
          )}
        </AnimatePresence>
      </div>

      {/* Idle screen */}
      {phase === "idle" && (
        <div className="mt-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow">
                <Cloud className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[18px] font-black tracking-tight text-slate-900">SKYBOUND</h2>
                <p className="text-xs font-semibold tracking-widest text-slate-500">MEADOW ISLES · District 1</p>
              </div>
            </div>
            {bestPastScore > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-right">
                <p className="text-[11px] font-bold tracking-widest text-slate-500">BEST RUN</p>
                <p className="text-lg font-black text-slate-900">{bestPastScore.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-[11px] font-bold tracking-[0.16em] text-white/60">HOW IT PLAYS</p>
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-white/90">
                <li>• Run automatically — react, don’t memorize.</li>
                <li>• Jump gaps, slide under arches, dash barriers.</li>
                <li>• Collect shards &amp; fragments, choose risky routes.</li>
                <li>• Knowledge Gates are optional — rewards, no punishment.</li>
                <li>• Abilities (Shield / Magnet / Dash) change how you move.</li>
              </ul>
              <p className="mt-4 text-xs font-bold text-white/60">Keys: ← → lane · ↑/Space jump (×2) · ↓ slide · Shift dash · Esc pause</p>
              <p className="text-xs font-bold text-white/60">Touch: swipe to move · double-tap to dash</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-600">
                <Layers className="h-4 w-4 text-sky-600" /> THE WORLD
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Floating grass islands, broken bridges, ancient ruins, crystal caverns and cloud seas. One polished district first — more to come.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  ["Jump gaps", Wind],
                  ["Slide arches", Layers],
                  ["Dash barriers", Zap],
                  ["Route forks", Mountain],
                ].map(([label, Icon]) => (
                  <span key={label as string} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                    <Icon className="h-3.5 w-3.5 text-slate-500" /> {label as string}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Gem className="h-3.5 w-3.5 text-sky-500" /> Shards = score
                <span className="h-3 w-px bg-slate-300" />
                <BookOpen className="h-3.5 w-3.5 text-violet-500" /> Fragments = abilities
              </div>
              {!hasQuiz && (
                <p className="mt-2 text-xs text-amber-600">No quiz yet — you can still run. Generate a study kit to enable Knowledge Gates.</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={startRun} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow hover:bg-slate-800">
              <Play className="h-4 w-4" /> Play Skybound
            </button>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600">
              <Heart className="h-4 w-4 text-red-500" /> {LIVES_START} lives · Endless · Gets faster
            </span>
            <button onClick={toggleFullscreen} aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Gameover */}
      {phase === "gameover" && (
        <div className="mt-3 rounded-[22px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-white shadow">
            <Trophy className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-xl font-black text-slate-900">Run complete</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hud.score > bestPastScore ? "New best — the isles remember you." : "Nice line. Go again and push farther."}
          </p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-900 px-3 py-4 text-white">
              <p className="text-[11px] font-bold tracking-widest text-white/60">SCORE</p>
              <p className="mt-1 text-xl font-black">{hud.score.toLocaleString()}</p>
              <p className="text-xs text-white/60">{hud.distance} m</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4">
              <p className="flex items-center justify-center gap-1 text-[11px] font-bold tracking-widest text-slate-500"><Flame className="h-3.5 w-3.5 text-orange-500" /> BEST COMBO</p>
              <p className="mt-1 text-xl font-black text-slate-900">x{hud.bestCombo}</p>
              <p className="text-xs text-slate-500">{hud.shards} shards · {hud.fragments} fragments</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-500">SPEED</p>
              <p className="mt-1 text-xl font-black text-slate-900">×{(speedRef.current / BASE_SPEED).toFixed(1)}</p>
              <p className="text-xs text-slate-500">max ×{(MAX_SPEED / BASE_SPEED).toFixed(1)}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={startRun} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" /> Play again
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to menu
            </button>
            <button onClick={toggleFullscreen} aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} Fullscreen
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] font-bold tracking-widest text-slate-400">
        Tip: take the rare fork when you’re confident — that’s where the relics are.
      </p>
    </div>
  );
}
