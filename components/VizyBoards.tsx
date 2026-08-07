// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  MousePointer2, Hand, StickyNote, Type as TypeIcon, Image as ImageIcon, Link2,
  Spline, Undo2, Redo2, Plus, Minus, Sun, Moon, FileDown, Trash2, Copy,
  ChevronDown, X, Check, ArrowUp, ArrowDown, Maximize, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Layers, Lock, Unlock, Download, Search
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   VIZY BOARDS — infinite canvas
   Single-file component. Drop into Vizzy as a section.
   Storage is isolated in `Store` (свап на Supabase — одно место, см. ниже).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────── tokens ─────────────────────────── */

const UI = {
  light: {
    bg: "#FFFFFF", dot: "#E4E5E9",
    glass: "rgba(255,255,255,0.78)", solid: "#FFFFFF",
    line: "rgba(11,12,14,0.09)", line2: "rgba(11,12,14,0.16)",
    ink: "#0B0C0E", ink2: "#6C7075", ink3: "#A2A6AC",
    hov: "rgba(11,12,14,0.05)", act: "rgba(11,12,14,0.085)",
    sel: "#0B0C0E", handle: "#FFFFFF",
    sh: "0 10px 34px rgba(11,12,14,0.10), 0 1px 2px rgba(11,12,14,0.07)",
    shItem: "0 1px 2px rgba(11,12,14,0.07), 0 6px 18px rgba(11,12,14,0.06)",
  },
  dark: {
    bg: "#0B0C0E", dot: "#1C1E23",
    glass: "rgba(21,23,26,0.80)", solid: "#151719",
    line: "rgba(255,255,255,0.10)", line2: "rgba(255,255,255,0.20)",
    ink: "#F2F3F5", ink2: "#989CA3", ink3: "#63676E",
    hov: "rgba(255,255,255,0.065)", act: "rgba(255,255,255,0.11)",
    sel: "#FFFFFF", handle: "#0B0C0E",
    sh: "0 10px 34px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.45)",
    shItem: "0 1px 2px rgba(0,0,0,0.45), 0 6px 18px rgba(0,0,0,0.35)",
  },
};

// content palette: [stroke, fill, sticky, text] × light/dark
const C = {
  graphite: { l: ["#16181C", "#F1F2F4", "#E7E9EC", "#16181C"], d: ["#E7E9EC", "#1B1E22", "#272B31", "#EDEFF2"] },
  red:      { l: ["#D2453C", "#FCEDEB", "#FAD8D4", "#7E241E"], d: ["#EE8880", "#2B1917", "#3C1F1C", "#F6CBC6"] },
  orange:   { l: ["#DC7A34", "#FDF1E7", "#FADFC7", "#7E4413"], d: ["#F09C5A", "#2A1D12", "#3A2617", "#F7D9BC"] },
  amber:    { l: ["#C99A16", "#FCF6E1", "#F8EDBB", "#6E5307"], d: ["#E4BB43", "#262010", "#352C14", "#F4E4AE"] },
  green:    { l: ["#3B9660", "#EBF6F0", "#D2ECDD", "#1C5334"], d: ["#63BE86", "#13241A", "#1B3122", "#C3E7D2"] },
  teal:     { l: ["#2A94A1", "#E7F5F7", "#CCE9ED", "#12525A"], d: ["#54B8C4", "#122427", "#1A3136", "#BEE5EA"] },
  blue:     { l: ["#2E67CE", "#EBF1FC", "#D3E1FA", "#173765", "" ], d: ["#6E9BEE", "#141B2A", "#1C2739", "#C8D9F7"] },
  indigo:   { l: ["#5757CE", "#EEEEFC", "#DCDCF9", "#2C2C6B"], d: ["#8C8CEE", "#191A2B", "#22233A", "#D2D2F8"] },
  violet:   { l: ["#8452C4", "#F4EDFB", "#E6D8F6", "#452766"], d: ["#AE85E2", "#1F182B", "#2A2039", "#E0CDF6"] },
  pink:     { l: ["#C7477F", "#FCEBF2", "#F8D5E4", "#6C1F41"], d: ["#E67FAC", "#291620", "#371D2B", "#F7CCDE"] },
};
const CKEYS = Object.keys(C);
const col = (key, i, dark) => (C[key] || C.graphite)[dark ? "d" : "l"][i];
const STROKE = 0, FILL = 1, STICKY = 2, ONCOLOR = 3;

const FONTS = {
  inter:      { label: "Inter",      css: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", w: 500 },
  montserrat: { label: "Montserrat", css: "'Montserrat',sans-serif", w: 600 },
  times:      { label: "Times",      css: "'Times New Roman',Times,serif", w: 400 },
  marker:     { label: "Marker",     css: "'Permanent Marker',cursive", w: 400 },
};

/* ─────────────────────────── shape geometry ─────────────────────────── */

const pts = (a) => "M" + a.map((p, i) => `${i ? "L" : ""}${r2(p[0])} ${r2(p[1])}`).join("") + "Z";
const r2 = (n) => Math.round(n * 100) / 100;
const rrect = (w, h, r) => {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${r2(r)} 0H${r2(w - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(w)} ${r2(r)}V${r2(h - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(w - r)} ${r2(h)}H${r2(r)}A${r2(r)} ${r2(r)} 0 0 1 0 ${r2(h - r)}V${r2(r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(r)} 0Z`;
};
const poly = (w, h, n, rot) => {
  const a = [];
  for (let i = 0; i < n; i++) {
    const t = rot + (i * 2 * Math.PI) / n;
    a.push([w / 2 + (w / 2) * Math.cos(t), h / 2 + (h / 2) * Math.sin(t)]);
  }
  return pts(a);
};

const SHAPES = {
  rect:      { name: "Прямоугольник", d: (w, h) => `M0 0H${r2(w)}V${r2(h)}H0Z` },
  round:     { name: "Скруглённый",   d: (w, h) => rrect(w, h, Math.min(18, w / 4, h / 4)) },
  pill:      { name: "Капсула",       d: (w, h) => rrect(w, h, Math.min(w, h) / 2) },
  ellipse:   { name: "Эллипс",        d: (w, h) => `M0 ${r2(h / 2)}A${r2(w / 2)} ${r2(h / 2)} 0 0 1 ${r2(w)} ${r2(h / 2)}A${r2(w / 2)} ${r2(h / 2)} 0 0 1 0 ${r2(h / 2)}Z` },
  diamond:   { name: "Ромб",          d: (w, h) => pts([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) },
  triangle:  { name: "Треугольник",   d: (w, h) => pts([[w / 2, 0], [w, h], [0, h]]) },
  rtri:      { name: "Прямоугольный", d: (w, h) => pts([[0, 0], [w, h], [0, h]]) },
  trapezoid: { name: "Трапеция",      d: (w, h) => pts([[w * .22, 0], [w * .78, 0], [w, h], [0, h]]) },
  parallel:  { name: "Параллелограмм",d: (w, h) => pts([[w * .22, 0], [w, 0], [w * .78, h], [0, h]]) },
  pentagon:  { name: "Пятиугольник",  d: (w, h) => poly(w, h, 5, -Math.PI / 2) },
  hexagon:   { name: "Шестиугольник", d: (w, h) => pts([[w * .25, 0], [w * .75, 0], [w, h / 2], [w * .75, h], [w * .25, h], [0, h / 2]]) },
  octagon:   { name: "Восьмиугольник",d: (w, h) => pts([[w * .29, 0], [w * .71, 0], [w, h * .29], [w, h * .71], [w * .71, h], [w * .29, h], [0, h * .71], [0, h * .29]]) },
  star:      { name: "Звезда",        d: (w, h) => { const a = []; for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? .42 : 1; a.push([w / 2 + (w / 2) * k * Math.cos(t), h / 2 + (h / 2) * k * Math.sin(t)]); } return pts(a); } },
  cross:     { name: "Крест",         d: (w, h) => pts([[w * .34, 0], [w * .66, 0], [w * .66, h * .34], [w, h * .34], [w, h * .66], [w * .66, h * .66], [w * .66, h], [w * .34, h], [w * .34, h * .66], [0, h * .66], [0, h * .34], [w * .34, h * .34]]) },
  arrowR:    { name: "Стрелка",       d: (w, h) => pts([[0, h * .29], [w * .62, h * .29], [w * .62, 0], [w, h / 2], [w * .62, h], [w * .62, h * .71], [0, h * .71]]) },
  chevron:   { name: "Шеврон",        d: (w, h) => pts([[0, 0], [w * .74, 0], [w, h / 2], [w * .74, h], [0, h], [w * .26, h / 2]]) },
  cylinder:  { name: "Цилиндр",       d: (w, h) => { const ry = Math.min(h * .16, 24); return `M0 ${r2(ry)}A${r2(w / 2)} ${r2(ry)} 0 0 1 ${r2(w)} ${r2(ry)}V${r2(h - ry)}A${r2(w / 2)} ${r2(ry)} 0 0 1 0 ${r2(h - ry)}Z`; }, extra: (w, h) => { const ry = Math.min(h * .16, 24); return `M0 ${r2(ry)}A${r2(w / 2)} ${r2(ry)} 0 0 0 ${r2(w)} ${r2(ry)}`; } },
  doc:       { name: "Документ",      d: (w, h) => `M0 0H${r2(w)}V${r2(h * .84)}C${r2(w * .74)} ${r2(h * 1.0)} ${r2(w * .26)} ${r2(h * .68)} 0 ${r2(h * .86)}Z` },
  note:      { name: "Заметка",       d: (w, h) => { const f = Math.min(w, h) * .22; return pts([[0, 0], [w - f, 0], [w, f], [w, h], [0, h]]); }, extra: (w, h) => { const f = Math.min(w, h) * .22; return `M${r2(w - f)} 0V${r2(f)}H${r2(w)}`; } },
  cloud:     { name: "Облако",        d: (w, h) => `M${r2(w * .26)} ${r2(h * .92)}C${r2(w * .10)} ${r2(h * .92)} ${r2(w * .02)} ${r2(h * .74)} ${r2(w * .11)} ${r2(h * .60)}C${r2(w * .04)} ${r2(h * .44)} ${r2(w * .16)} ${r2(h * .30)} ${r2(w * .29)} ${r2(h * .34)}C${r2(w * .34)} ${r2(h * .12)} ${r2(w * .56)} ${r2(h * .06)} ${r2(w * .64)} ${r2(h * .22)}C${r2(w * .78)} ${r2(h * .12)} ${r2(w * .94)} ${r2(h * .24)} ${r2(w * .90)} ${r2(h * .42)}C${r2(w * .99)} ${r2(h * .52)} ${r2(w * .96)} ${r2(h * .74)} ${r2(w * .84)} ${r2(h * .78)}C${r2(w * .82)} ${r2(h * .90)} ${r2(w * .70)} ${r2(h * .96)} ${r2(w * .61)} ${r2(h * .89)}C${r2(w * .50)} ${r2(h * .98)} ${r2(w * .35)} ${r2(h * .99)} ${r2(w * .26)} ${r2(h * .92)}Z` },
  callout:   { name: "Реплика",       d: (w, h) => { const b = h * .8, r = Math.min(14, w / 4, b / 4); return `M${r2(r)} 0H${r2(w - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(w)} ${r2(r)}V${r2(b - r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(w - r)} ${r2(b)}H${r2(w * .38)}L${r2(w * .20)} ${r2(h)}L${r2(w * .24)} ${r2(b)}H${r2(r)}A${r2(r)} ${r2(r)} 0 0 1 0 ${r2(b - r)}V${r2(r)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(r)} 0Z`; } },
};
const SHAPE_KEYS = Object.keys(SHAPES);

/* ─────────────────────────── math ─────────────────────────── */

const uid = (p = "x") => p + Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const len = (x, y) => Math.hypot(x, y) || 1;
const norm = (x, y) => { const l = len(x, y); return { x: x / l, y: y / l }; };

function bbox(list) {
  if (!list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of list) { x0 = Math.min(x0, it.x); y0 = Math.min(y0, it.y); x1 = Math.max(x1, it.x + it.w); y1 = Math.max(y1, it.y + it.h); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function anchorOf(it, side, toward) {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
  let s = side;
  if (!s || s === "auto") {
    const dx = (toward.x - cx) / (it.w / 2 || 1), dy = (toward.y - cy) / (it.h / 2 || 1);
    s = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "b" : "t");
  }
  if (s === "t") return { x: cx, y: it.y, n: { x: 0, y: -1 } };
  if (s === "b") return { x: cx, y: it.y + it.h, n: { x: 0, y: 1 } };
  if (s === "l") return { x: it.x, y: cy, n: { x: -1, y: 0 } };
  return { x: it.x + it.w, y: cy, n: { x: 1, y: 0 } };
}

function ends(c, map) {
  const A = c.from.id ? map[c.from.id] : null;
  const B = c.to.id ? map[c.to.id] : null;
  const pa = A ? { x: A.x + A.w / 2, y: A.y + A.h / 2 } : { x: c.from.x, y: c.from.y };
  const pb = B ? { x: B.x + B.w / 2, y: B.y + B.h / 2 } : { x: c.to.x, y: c.to.y };
  const a = A ? anchorOf(A, c.from.side, pb) : { x: c.from.x, y: c.from.y, n: norm(c.from.x - pb.x, c.from.y - pb.y) };
  const b = B ? anchorOf(B, c.to.side, pa) : { x: c.to.x, y: c.to.y, n: norm(c.to.x - pa.x, c.to.y - pa.y) };
  return { a, b };
}

function elbow(a, b) {
  const e = 26;
  const p0 = { x: a.x, y: a.y }, p1 = { x: a.x + a.n.x * e, y: a.y + a.n.y * e };
  const p3 = { x: b.x, y: b.y }, p2 = { x: b.x + b.n.x * e, y: b.y + b.n.y * e };
  const mid = [];
  const aH = a.n.x !== 0, bH = b.n.x !== 0;
  if (aH && bH) { const mx = (p1.x + p2.x) / 2; mid.push({ x: mx, y: p1.y }, { x: mx, y: p2.y }); }
  else if (!aH && !bH) { const my = (p1.y + p2.y) / 2; mid.push({ x: p1.x, y: my }, { x: p2.x, y: my }); }
  else if (aH) mid.push({ x: p2.x, y: p1.y });
  else mid.push({ x: p1.x, y: p2.y });
  const all = [p0, p1, ...mid, p2, p3];
  const out = [all[0]];
  for (let i = 1; i < all.length; i++) if (Math.hypot(all[i].x - out[out.length - 1].x, all[i].y - out[out.length - 1].y) > .5) out.push(all[i]);
  return out;
}

function geom(c, map) {
  const { a, b } = ends(c, map);
  if (c.style === "elbow") return { kind: "poly", p: elbow(a, b) };
  if (c.style === "curved") {
    const k = clamp(Math.hypot(b.x - a.x, b.y - a.y) * .42, 34, 190);
    return { kind: "curve", a, b, c1: { x: a.x + a.n.x * k, y: a.y + a.n.y * k }, c2: { x: b.x + b.n.x * k, y: b.y + b.n.y * k } };
  }
  return { kind: "poly", p: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }] };
}

function trimSeg(p, q, d) { const v = norm(q.x - p.x, q.y - p.y); return { x: p.x + v.x * d, y: p.y + v.y * d }; }

function roundPath(p, r) {
  if (p.length < 3) return `M${r2(p[0].x)} ${r2(p[0].y)}L${r2(p[p.length - 1].x)} ${r2(p[p.length - 1].y)}`;
  let d = `M${r2(p[0].x)} ${r2(p[0].y)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1], b = p[i], c = p[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const v1 = norm(a.x - b.x, a.y - b.y), v2 = norm(c.x - b.x, c.y - b.y);
    d += `L${r2(b.x + v1.x * rr)} ${r2(b.y + v1.y * rr)}Q${r2(b.x)} ${r2(b.y)} ${r2(b.x + v2.x * rr)} ${r2(b.y + v2.y * rr)}`;
  }
  const e = p[p.length - 1];
  return d + `L${r2(e.x)} ${r2(e.y)}`;
}

function connPath(g, cap0, cap1, w) {
  const s0 = cap0 && cap0 !== "none" ? capLen(cap0, w) : 0;
  const s1 = cap1 && cap1 !== "none" ? capLen(cap1, w) : 0;
  if (g.kind === "curve") {
    let { a, b, c1, c2 } = g;
    const t0 = norm(c1.x - a.x, c1.y - a.y), t1 = norm(c2.x - b.x, c2.y - b.y);
    const A = { x: a.x + t0.x * s0, y: a.y + t0.y * s0 }, B = { x: b.x + t1.x * s1, y: b.y + t1.y * s1 };
    return {
      d: `M${r2(A.x)} ${r2(A.y)}C${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(B.x)} ${r2(B.y)}`,
      p0: a, p1: b, d0: { x: -t0.x, y: -t0.y }, d1: { x: -t1.x, y: -t1.y },
      mid: { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 },
    };
  }
  const p = g.p.map((q) => ({ ...q }));
  const first = p[0], last = p[p.length - 1];
  const d0 = norm(first.x - p[1].x, first.y - p[1].y);
  const d1 = norm(last.x - p[p.length - 2].x, last.y - p[p.length - 2].y);
  if (s0) p[0] = trimSeg(p[0], p[1], s0);
  if (s1) p[p.length - 1] = trimSeg(p[p.length - 1], p[p.length - 2], s1);
  let total = 0; const seg = [];
  for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); seg.push(L); total += L; }
  let acc = 0, mid = p[0];
  for (let i = 0; i < seg.length; i++) { if (acc + seg[i] >= total / 2) { const t = (total / 2 - acc) / (seg[i] || 1); mid = { x: p[i].x + (p[i + 1].x - p[i].x) * t, y: p[i].y + (p[i + 1].y - p[i].y) * t }; break; } acc += seg[i]; }
  return { d: roundPath(p, 12), p0: first, p1: last, d0, d1, mid };
}

const capLen = (kind, w) => (kind === "circle" || kind === "diamond" ? 4 + w * 1.6 : kind === "bar" ? 0 : 6 + w * 2.4);

function capShape(p, dir, kind, w) {
  const s = 6 + w * 2.4;
  const ux = -dir.x, uy = -dir.y;          // back along the line
  const px = -uy, py = ux;                 // perpendicular
  const bx = p.x + ux * s, by = p.y + uy * s;
  if (kind === "arrow") return { d: `M${r2(bx + px * s * .58)} ${r2(by + py * s * .58)}L${r2(p.x)} ${r2(p.y)}L${r2(bx - px * s * .58)} ${r2(by - py * s * .58)}`, fill: false };
  if (kind === "triangle") return { d: pts([[p.x, p.y], [bx + px * s * .5, by + py * s * .5], [bx - px * s * .5, by - py * s * .5]]), fill: true };
  if (kind === "diamond") { const q = 4 + w * 1.6; const m = { x: p.x + ux * q, y: p.y + uy * q }; return { d: pts([[p.x, p.y], [m.x + px * q * .72, m.y + py * q * .72], [p.x + ux * q * 2, p.y + uy * q * 2], [m.x - px * q * .72, m.y - py * q * .72]]), fill: true }; }
  if (kind === "circle") { const q = 3 + w * 1.3; const c = { x: p.x + ux * q, y: p.y + uy * q }; return { d: `M${r2(c.x - q)} ${r2(c.y)}a${r2(q)} ${r2(q)} 0 1 0 ${r2(q * 2)} 0a${r2(q)} ${r2(q)} 0 1 0 ${r2(-q * 2)} 0Z`, fill: true }; }
  if (kind === "bar") return { d: `M${r2(p.x + px * s * .6)} ${r2(p.y + py * s * .6)}L${r2(p.x - px * s * .6)} ${r2(p.y - py * s * .6)}`, fill: false };
  return null;
}

/* ─────────────────────────── storage ───────────────────────────
   ЕДИНСТВЕННОЕ место, которое меняется при переносе в Vizzy:
   заменить тело get/set/del на supabase.from('boards')... — всё.
   ──────────────────────────────────────────────────────────── */

const mem = new Map();
const MAX_BOARDS = 10;
const BOARD_BUCKET = "board-images";
const boardLastKey = (userId) => `vizy:boards:last:${userId}`;

const Boards = {
  async list(userId) {
    const { data, error } = await supabase
      .from("vizy_boards")
      .select("id,name,icon,updated_at,version")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((b) => ({ id: b.id, name: b.name, icon: b.icon, at: b.updated_at, version: b.version }));
  },
  async load(userId, id) {
    const { data, error } = await supabase
      .from("vizy_boards")
      .select("id,name,icon,doc,cam,version")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (error) throw error;
    return {
      id: data.id, name: data.name, icon: data.icon,
      items: data.doc?.items || [], connectors: data.doc?.connectors || [],
      cam: data.cam || { x: 0, y: 0, z: 1 }, version: data.version,
    };
  },
  async save(userId, id, items, connectors, cam, version) {
    const { data, error } = await supabase.rpc("save_vizy_board", {
      p_id: id, p_doc: { items, connectors }, p_cam: cam, p_version: version ?? null,
    });
    if (error) {
      if (String(error.message || "").includes("VERSION_CONFLICT") || String(error.message || "").includes("BOARD_VERSION_CONFLICT")) return { conflict: true };
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { version: row?.version, updated_at: row?.updated_at };
  },
  async create(userId, name = "Новая доска", icon = "◇", initial = null) {
    const payload = { user_id: userId, name, icon };
    if (initial) {
      payload.doc = { items: initial.items || [], connectors: initial.connectors || [] };
      payload.cam = initial.cam || { x: 0, y: 0, z: 1 };
    }
    const { data, error } = await supabase
      .from("vizy_boards").insert(payload)
      .select("id,name,icon,updated_at,version").single();
    if (error) {
      if (String(error.message || "").includes("BOARD_LIMIT_REACHED")) return { limit: true };
      throw error;
    }
    return { board: { id: data.id, name: data.name, icon: data.icon, at: data.updated_at, version: data.version } };
  },
  async rename(userId, id, patch) {
    const { data, error } = await supabase.from("vizy_boards")
      .update(patch).eq("user_id", userId).eq("id", id)
      .select("id,name,icon,updated_at,version").single();
    if (error) throw error;
    return data;
  },
  async remove(userId, id) {
    const { error } = await supabase.from("vizy_boards").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  },
  getLast(userId) { try { return localStorage.getItem(boardLastKey(userId)); } catch { return null; } },
  setLast(userId, id) { try { localStorage.setItem(boardLastKey(userId), id); } catch {} },
  async uploadImage(userId, blob, ext = "jpg") {
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BOARD_BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000", upsert: false });
    if (error) throw error;
    return supabase.storage.from(BOARD_BUCKET).getPublicUrl(path).data.publicUrl;
  },
};

const loadCors = (url) => {
  const im = new Image();
  im.crossOrigin = "anonymous";
  im.src = url;
  return im;
};

/* ─────────────────────────── raster + PDF ─────────────────────────── */

function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text || "").split("\n")) {
    if (!para) { out.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const t = line ? line + " " + word : word;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

function drawText(ctx, it, box, dark) {
  if (!it.text) return;
  const f = FONTS[it.font] || FONTS.inter;
  const size = it.fs || 16;
  ctx.font = `${it.italic ? "italic " : ""}${it.bold ? 700 : f.w} ${size}px ${f.css}`;
  ctx.fillStyle = it.type === "text" ? col(it.color || "graphite", STROKE, dark) : col(it.color || "graphite", ONCOLOR, dark);
  ctx.textBaseline = "middle";
  const pad = 14;
  const lines = wrap(ctx, it.text, box.w - pad * 2);
  const lh = size * 1.32;
  const total = lines.length * lh;
  let y = it.type === "text" || it.align === "top" ? box.y + pad + lh / 2 : box.y + box.h / 2 - total / 2 + lh / 2;
  for (const ln of lines) {
    const w = ctx.measureText(ln).width;
    const x = it.halign === "left" ? box.x + pad : it.halign === "right" ? box.x + box.w - pad - w : box.x + box.w / 2 - w / 2;
    ctx.fillText(ln, x, y); y += lh;
  }
}

async function raster(items, conns, box, scale, dark, pad = 48) {
  const W = Math.round((box.w + pad * 2) * scale), H = Math.round((box.h + pad * 2) * scale);
  const cv = document.createElement("canvas");
  cv.width = Math.min(W, 6000); cv.height = Math.min(H, 6000);
  const k = Math.min(cv.width / (box.w + pad * 2), cv.height / (box.h + pad * 2));
  const ctx = cv.getContext("2d");
  ctx.fillStyle = dark ? UI.dark.bg : "#FFFFFF";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, -(box.x - pad) * k, -(box.y - pad) * k);
  try { await document.fonts.ready; } catch {}

  const map = {}; items.forEach((i) => (map[i.id] = i));
  for (const c of conns) {
    if ((c.from.id && !map[c.from.id]) || (c.to.id && !map[c.to.id])) continue;
    const g = geom(c, map), cp = connPath(g, c.cap0, c.cap1, c.w || 2);
    ctx.strokeStyle = col(c.color || "graphite", STROKE, dark);
    ctx.lineWidth = c.w || 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.setLineDash(c.dash === "dashed" ? [10, 8] : c.dash === "dotted" ? [1, 6] : []);
    ctx.stroke(new Path2D(cp.d));
    ctx.setLineDash([]);
    for (const [p, d, kind] of [[cp.p0, cp.d0, c.cap0], [cp.p1, cp.d1, c.cap1]]) {
      if (!kind || kind === "none") continue;
      const s = capShape(p, d, kind, c.w || 2); if (!s) continue;
      const path = new Path2D(s.d);
      if (s.fill) { ctx.fillStyle = col(c.color || "graphite", STROKE, dark); ctx.fill(path); }
      else ctx.stroke(path);
    }
    if (c.label) {
      ctx.font = `500 13px ${FONTS.inter.css}`;
      const w = ctx.measureText(c.label).width;
      ctx.fillStyle = dark ? UI.dark.bg : "#fff";
      ctx.fillRect(cp.mid.x - w / 2 - 6, cp.mid.y - 10, w + 12, 20);
      ctx.fillStyle = col(c.color || "graphite", STROKE, dark);
      ctx.textBaseline = "middle"; ctx.fillText(c.label, cp.mid.x - w / 2, cp.mid.y);
    }
  }

  for (const it of [...items].sort((a, b) => a.z - b.z)) {
    ctx.save(); ctx.translate(it.x, it.y);
    if (it.type === "shape") {
      const sp = SHAPES[it.shape] || SHAPES.round;
      const path = new Path2D(sp.d(it.w, it.h));
      if (it.fill !== "none") { ctx.fillStyle = col(it.fill || "graphite", FILL, dark); ctx.fill(path); }
      if (it.sstyle !== "none") {
        ctx.strokeStyle = col(it.stroke || "graphite", STROKE, dark);
        ctx.lineWidth = it.sw || 2; ctx.lineJoin = "round";
        ctx.setLineDash(it.sstyle === "dashed" ? [9, 7] : it.sstyle === "dotted" ? [1, 5] : []);
        ctx.stroke(path);
        if (sp.extra) ctx.stroke(new Path2D(sp.extra(it.w, it.h)));
        ctx.setLineDash([]);
      }
    } else if (it.type === "sticky") {
      ctx.fillStyle = col(it.color || "amber", STICKY, dark);
      ctx.shadowColor = "rgba(0,0,0,0.14)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
      ctx.fill(new Path2D(rrect(it.w, it.h, 4))); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    } else if (it.type === "image" && it._img) {
      ctx.save(); ctx.clip(new Path2D(rrect(it.w, it.h, it.radius ?? 6)));
      ctx.drawImage(it._img, 0, 0, it.w, it.h); ctx.restore();
    } else if (it.type === "link") {
      ctx.fillStyle = dark ? "#17191D" : "#FFFFFF";
      ctx.strokeStyle = dark ? UI.dark.line2 : UI.light.line2; ctx.lineWidth = 1;
      const p = new Path2D(rrect(it.w, it.h, 12)); ctx.fill(p); ctx.stroke(p);
      const c0 = col(it.color || "blue", STROKE, dark);
      ctx.fillStyle = c0; ctx.beginPath(); ctx.arc(34, 34, 16, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `700 16px ${FONTS.inter.css}`; ctx.textBaseline = "middle";
      const ch = (it.domain || "?")[0].toUpperCase();
      ctx.fillText(ch, 34 - ctx.measureText(ch).width / 2, 35);
      ctx.fillStyle = dark ? UI.dark.ink : UI.light.ink; ctx.font = `600 15px ${FONTS.inter.css}`;
      wrap(ctx, it.title || it.domain, it.w - 32).slice(0, 2).forEach((l, i) => ctx.fillText(l, 16, 76 + i * 20));
      ctx.fillStyle = dark ? UI.dark.ink3 : UI.light.ink3; ctx.font = `400 12px ${FONTS.inter.css}`;
      ctx.fillText(it.domain || "", 16, it.h - 18);
    }
    ctx.restore();
    if (it.type !== "image" && it.type !== "link") drawText(ctx, it, { x: it.x, y: it.y, w: it.w, h: it.h }, dark);
  }
  return cv;
}

const b64ToBytes = (b64) => { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
const latin = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff; return a; };

function buildPDF(jpeg, px, py, iw, ih) {
  const parts = []; let off = 0; const xref = [];
  const put = (b) => { parts.push(b); off += b.length; };
  const obj = (n, body) => { xref[n] = off; put(latin(`${n} 0 obj\n${body}\nendobj\n`)); };
  put(latin("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${r2(px)} ${r2(py)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  xref[4] = off;
  put(latin(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${iw} /Height ${ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`));
  put(jpeg); put(latin("\nendstream\nendobj\n"));
  const cs = `q ${r2(px)} 0 0 ${r2(py)} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
  const start = off;
  let x = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) x += String(xref[i]).padStart(10, "0") + " 00000 n \n";
  x += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  put(latin(x));
  let total = 0; parts.forEach((p) => (total += p.length));
  const out = new Uint8Array(total); let o = 0;
  parts.forEach((p) => { out.set(p, o); o += p.length; });
  return out;
}

const dl = (blob, name) => {
  const u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1500);
};

/* ─────────────────────────── UI atoms ─────────────────────────── */

const Btn = ({ t, active, onClick, children, title, disabled, wide, danger }) => (
  <button title={title} disabled={disabled} onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      height: 32, minWidth: wide ? 0 : 32, padding: wide ? "0 10px" : 0,
      borderRadius: 9, border: "none", cursor: disabled ? "default" : "pointer",
      background: active ? t.act : "transparent", color: danger ? "#D2453C" : active ? t.ink : t.ink2,
      opacity: disabled ? .32 : 1, transition: "background .13s, color .13s",
      fontSize: 12.5, fontWeight: 500, fontFamily: FONTS.inter.css, whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = t.hov; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
    {children}
  </button>
);

const Sep = ({ t }) => <div style={{ width: 1, height: 20, background: t.line, margin: "0 3px", flex: "0 0 auto" }} />;

const Panel = ({ t, style, children, onPointerDown }) => (
  <div onPointerDown={onPointerDown} style={{
    background: t.glass, backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: `1px solid ${t.line}`, borderRadius: 14, boxShadow: t.sh, ...style,
  }}>{children}</div>
);

/* ═══════════════════════════ MAIN ═══════════════════════════ */

export default function VizyBoards({ userId, dark = false, onToggleTheme }) {
  const t = dark ? UI.dark : UI.light;

  const [boards, setBoards] = useState([]);
  const [active, setActive] = useState(null);
  const [doc, setDoc] = useState({ items: [], connectors: [] });
  const [cam, setCam] = useState({ x: 0, y: 0, z: 1 });
  const [tool, setTool] = useState("select");
  const [kind, setKind] = useState("round");
  const [sel, setSel] = useState([]);
  const [selC, setSelC] = useState([]);
  const [edit, setEdit] = useState(null);
  const [marq, setMarq] = useState(null);
  const [draw, setDraw] = useState(null);
  const [hover, setHover] = useState(null);
  const [pop, setPop] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [space, setSpace] = useState(false);
  const [saveState, setSaveState] = useState("loading");

  const vp = useRef(null), fileIn = useRef(null), hist = useRef({ p: [], f: [] }), snap = useRef(null), imgs = useRef({});
  const verRef = useRef(null);
  const savingRef = useRef(false);
  const R = useRef({});
  R.current = { doc, cam, sel, selC, tool, kind, dark, edit, active, space };

  const say = (m) => { setToast(m); clearTimeout(say._t); say._t = setTimeout(() => setToast(null), 2200); };
  const map = useMemo(() => { const m = {}; doc.items.forEach((i) => (m[i.id] = i)); return m; }, [doc.items]);
  const selItems = useMemo(() => sel.map((id) => map[id]).filter(Boolean), [sel, map]);
  const selConns = useMemo(() => doc.connectors.filter((c) => selC.includes(c.id)), [selC, doc.connectors]);

  /* ── fonts ── */
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Permanent+Marker&display=swap";
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  /* ── cloud load / autosave / realtime ── */
  useEffect(() => {
    let alive = true;
    setReady(false); setSaveState("loading");
    (async () => {
      let list = await Boards.list(userId);
      if (!list.length) {
        const demo = seed();
        const created = await Boards.create(userId, "Воронка", "◈", demo);
        if (created.limit) throw new Error("BOARD_LIMIT_REACHED");
        list = [created.board];
      }
      if (!alive) return;
      setBoards(list);
      const last = Boards.getLast(userId);
      const id = list.find((b) => b.id === last)?.id || list[0].id;
      await open(id, list);
      if (alive) { setReady(true); setSaveState("saved"); }
    })().catch((e) => {
      console.error(e);
      if (alive) { setReady(true); setSaveState("error"); say("Не удалось загрузить Vizy Boards"); }
    });
    return () => { alive = false; };
  }, [userId]);

  const open = async (id, list) => {
    setSaveState("loading");
    const b = await Boards.load(userId, id);
    verRef.current = b.version;
    hist.current = { p: [], f: [] };
    setActive(id); setSel([]); setSelC([]); setEdit(null);
    setDoc({ items: b.items, connectors: b.connectors });
    setCam(b.cam);
    setBoards(list || boards);
    Boards.setLast(userId, id);
    b.items.forEach(preload);
    setSaveState("saved");
  };

  const preload = (it) => {
    if (it.type !== "image" || !it.src || imgs.current[it.id]) return;
    imgs.current[it.id] = loadCors(it.src);
  };

  const saveT = useRef(null);
  useEffect(() => {
    if (!ready || !active) return;
    clearTimeout(saveT.current);
    setSaveState("dirty");
    saveT.current = setTimeout(async () => {
      savingRef.current = true;
      setSaveState("saving");
      try {
        const r = await Boards.save(userId, active, doc.items, doc.connectors, cam, verRef.current);
        if (r.conflict) {
          setSaveState("conflict");
          say("Доска изменена на другом устройстве — откройте её заново");
          return;
        }
        verRef.current = r.version;
        setBoards((list) => list.map((b) => b.id === active ? { ...b, at: r.updated_at || new Date().toISOString(), version: r.version } : b));
        setSaveState("saved");
      } catch (e) {
        console.error(e);
        setSaveState("error");
        say("Не удалось сохранить доску");
      } finally {
        savingRef.current = false;
      }
    }, 800);
    return () => clearTimeout(saveT.current);
  }, [doc, cam, active, ready, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    const channel = supabase.channel(`vizy-boards-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vizy_boards", filter: `user_id=eq.${userId}` }, async (payload) => {
        try {
          const list = await Boards.list(userId);
          setBoards(list);
          const changedId = payload?.new?.id || payload?.old?.id;
          const incomingVersion = payload?.new?.version;
          if (changedId === active && incomingVersion && incomingVersion > (verRef.current || 0) && !savingRef.current) {
            setSaveState("remote");
            say("Доска обновлена на другом устройстве — откройте её заново");
          }
        } catch {}
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ready, userId, active]);

  /* ── history ── */
  const tx = () => { snap.current = R.current.doc; };
  const commit = () => {
    if (!snap.current || snap.current === R.current.doc) { snap.current = null; return; }
    hist.current.p.push(snap.current); if (hist.current.p.length > 90) hist.current.p.shift();
    hist.current.f.length = 0; snap.current = null; setTick((n) => n + 1);
  };
  const act = (fn) => { tx(); setDoc((d) => fn(d)); queueMicrotask(commit); };
  const undo = () => { const h = hist.current; if (!h.p.length) return; h.f.push(R.current.doc); setDoc(h.p.pop()); setSel([]); setSelC([]); setTick((n) => n + 1); };
  const redo = () => { const h = hist.current; if (!h.f.length) return; h.p.push(R.current.doc); setDoc(h.f.pop()); setSel([]); setSelC([]); setTick((n) => n + 1); };

  /* ── coords ── */
  const rect = () => vp.current?.getBoundingClientRect() || { left: 0, top: 0, width: 800, height: 600 };
  const toWorld = (cx, cy) => { const r = rect(), c = R.current.cam; return { x: (cx - r.left - c.x) / c.z, y: (cy - r.top - c.y) / c.z }; };
  const toScreen = (x, y) => { const c = R.current.cam; return { x: x * c.z + c.x, y: y * c.z + c.y }; };
  const center = () => { const r = rect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); };

  /* ── item factory ── */
  const topZ = () => (doc.items.length ? Math.max(...doc.items.map((i) => i.z)) + 1 : 1);
  const base = (type, x, y, w, h) => ({ id: uid(type[0]), type, x, y, w, h, z: 0, text: "", font: "inter", fs: 16, halign: "center", bold: false, italic: false });

  const make = (type, x, y, w, h, extra = {}) => {
    const z = topZ();
    if (type === "shape") return { ...base(type, x, y, w, h), z, shape: R.current.kind, fill: "graphite", stroke: "graphite", sw: 2, sstyle: "solid", color: "graphite", ...extra };
    if (type === "sticky") return { ...base(type, x, y, w, h), z, color: "amber", fs: 18, font: "inter", ...extra };
    if (type === "text") return { ...base(type, x, y, w, h), z, color: "graphite", fs: 22, halign: "left", align: "top", ...extra };
    if (type === "image") return { ...base(type, x, y, w, h), z, radius: 6, ...extra };
    if (type === "link") return { ...base(type, x, y, w, h), z, color: "blue", ...extra };
    return { ...base(type, x, y, w, h), z, ...extra };
  };

  const add = (it, startEdit) => {
    act((d) => ({ ...d, items: [...d.items, it] }));
    setSel([it.id]); setSelC([]); setTool("select");
    if (startEdit) setTimeout(() => setEdit(it.id), 30);
  };

  /* ── pointer machine ── */
  const drag = useRef(null);

  const onDown = (e) => {
    if (e.button === 2) return;
    if (pop) setPop(null);
    const T = R.current.tool, panning = e.button === 1 || R.current.space || T === "hand";
    const w = toWorld(e.clientX, e.clientY);
    if (panning) { drag.current = { m: "pan", sx: e.clientX, sy: e.clientY, c: { ...R.current.cam } }; return; }
    if (T === "select") {
      if (!e.shiftKey) { setSel([]); setSelC([]); }
      setEdit(null);
      drag.current = { m: "marq", sx: e.clientX, sy: e.clientY, add: e.shiftKey, base: e.shiftKey ? R.current.sel : [] };
      setMarq({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
      return;
    }
    if (T === "conn") { drag.current = { m: "conn", from: { x: w.x, y: w.y } }; setDraw({ from: { x: w.x, y: w.y }, to: w }); return; }
    if (T === "image") { fileIn.current?.click(); setTool("select"); return; }
    if (T === "link") { setModal({ kind: "link", url: "", at: w }); setTool("select"); return; }
    drag.current = { m: "new", type: T, ox: w.x, oy: w.y };
    setDraw({ box: { x: w.x, y: w.y, w: 0, h: 0 } });
  };

  const itemDown = (e, it) => {
    if (e.button === 2 || R.current.space || R.current.tool === "hand") return;
    e.stopPropagation();
    if (R.current.tool === "conn") {
      const w = toWorld(e.clientX, e.clientY);
      drag.current = { m: "conn", from: { id: it.id, side: "auto" } }; setDraw({ from: { id: it.id }, to: w }); return;
    }
    if (R.current.tool !== "select") return;
    if (R.current.edit === it.id) return;
    let next = R.current.sel;
    if (e.shiftKey) next = next.includes(it.id) ? next.filter((x) => x !== it.id) : [...next, it.id];
    else if (!next.includes(it.id)) next = [it.id];
    setSel(next); setSelC([]); setEdit(null);
    tx();
    drag.current = { m: "move", sx: e.clientX, sy: e.clientY, snap: R.current.doc.items.filter((i) => next.includes(i.id) && !i.locked).map((i) => ({ id: i.id, x: i.x, y: i.y })) };
  };

  const portDown = (e, it, side) => {
    e.stopPropagation();
    const w = toWorld(e.clientX, e.clientY);
    drag.current = { m: "conn", from: { id: it.id, side } };
    setDraw({ from: { id: it.id, side }, to: w });
  };

  const handleDown = (e, i) => {
    e.stopPropagation();
    const b = bbox(selItems); if (!b) return;
    tx();
    drag.current = { m: "size", i, b, snap: selItems.map((s) => ({ id: s.id, x: s.x, y: s.y, w: s.w, h: s.h })) };
  };

  const endDown = (e, c, which) => {
    e.stopPropagation();
    tx();
    drag.current = { m: "cend", id: c.id, which };
  };

  useEffect(() => {
    const move = (e) => {
      const d = drag.current; if (!d) return;
      if (d.m === "pan") { setCam({ ...d.c, x: d.c.x + (e.clientX - d.sx), y: d.c.y + (e.clientY - d.sy) }); return; }
      if (d.m === "marq") {
        const x = Math.min(d.sx, e.clientX), y = Math.min(d.sy, e.clientY), w = Math.abs(e.clientX - d.sx), h = Math.abs(e.clientY - d.sy);
        setMarq({ x, y, w, h });
        const r = rect(), a = toWorld(x, y), b = toWorld(x + w, y + h);
        const hit = R.current.doc.items.filter((i) => i.x < b.x && i.x + i.w > a.x && i.y < b.y && i.y + i.h > a.y).map((i) => i.id);
        setSel([...new Set([...d.base, ...hit])]);
        return;
      }
      if (d.m === "move") {
        const z = R.current.cam.z, dx = (e.clientX - d.sx) / z, dy = (e.clientY - d.sy) / z;
        const g = e.altKey ? 1 : 8;
        setDoc((doc) => ({ ...doc, items: doc.items.map((i) => { const s = d.snap.find((q) => q.id === i.id); return s ? { ...i, x: Math.round((s.x + dx) / g) * g, y: Math.round((s.y + dy) / g) * g } : i; }) }));
        return;
      }
      if (d.m === "size") {
        const w = toWorld(e.clientX, e.clientY), b = d.b;
        let nx = b.x, ny = b.y, nw = b.w, nh = b.h;
        const i = d.i;
        if (i.includes("w")) { nx = Math.min(w.x, b.x + b.w - 20); nw = b.x + b.w - nx; }
        if (i.includes("e")) { nw = Math.max(20, w.x - b.x); }
        if (i.includes("n")) { ny = Math.min(w.y, b.y + b.h - 20); nh = b.y + b.h - ny; }
        if (i.includes("s")) { nh = Math.max(20, w.y - b.y); }
        if (e.shiftKey && i.length === 2) { const k = Math.max(nw / b.w, nh / b.h); nw = b.w * k; nh = b.h * k; if (i.includes("w")) nx = b.x + b.w - nw; if (i.includes("n")) ny = b.y + b.h - nh; }
        const kx = nw / (b.w || 1), ky = nh / (b.h || 1);
        setDoc((doc) => ({ ...doc, items: doc.items.map((it) => { const s = d.snap.find((q) => q.id === it.id); if (!s) return it; return { ...it, x: nx + (s.x - b.x) * kx, y: ny + (s.y - b.y) * ky, w: Math.max(16, s.w * kx), h: Math.max(16, s.h * ky) }; }) }));
        return;
      }
      if (d.m === "conn" || d.m === "cend") {
        const w = toWorld(e.clientX, e.clientY);
        const over = [...R.current.doc.items].reverse().find((i) => i.type !== "text" && w.x > i.x && w.x < i.x + i.w && w.y > i.y && w.y < i.y + i.h);
        const target = over ? { id: over.id, side: "auto" } : { x: w.x, y: w.y };
        setHover(over ? over.id : null);
        if (d.m === "conn") setDraw({ from: d.from, to: w, target });
        else setDoc((doc) => ({ ...doc, connectors: doc.connectors.map((c) => (c.id === d.id ? { ...c, [d.which]: target } : c)) }));
        return;
      }
      if (d.m === "new") {
        const w = toWorld(e.clientX, e.clientY);
        setDraw({ box: { x: Math.min(d.ox, w.x), y: Math.min(d.oy, w.y), w: Math.abs(w.x - d.ox), h: Math.abs(w.y - d.oy) } });
      }
    };
    const up = (e) => {
      const d = drag.current; drag.current = null;
      if (!d) return;
      if (d.m === "marq") setMarq(null);
      if (d.m === "move" || d.m === "size" || d.m === "cend") commit();
      if (d.m === "conn") {
        const dr = draw || {};
        const w = toWorld(e.clientX, e.clientY);
        const over = [...R.current.doc.items].reverse().find((i) => i.type !== "text" && w.x > i.x && w.x < i.x + i.w && w.y > i.y && w.y < i.y + i.h);
        const to = over ? { id: over.id, side: "auto" } : { x: w.x, y: w.y };
        const from = d.from;
        const far = from.id ? over?.id !== from.id : Math.hypot(w.x - from.x, w.y - from.y) > 12;
        if (far) {
          const c = { id: uid("c"), from, to, style: "curved", cap0: "none", cap1: "arrow", dash: "solid", color: "graphite", w: 2, label: "" };
          act((doc) => ({ ...doc, connectors: [...doc.connectors, c] }));
          setSelC([c.id]); setSel([]);
        }
        setDraw(null); setHover(null); setTool("select");
      }
      if (d.m === "new") {
        const b = draw?.box;
        const big = b && (b.w > 12 || b.h > 12);
        const def = d.type === "sticky" ? { w: 220, h: 220 } : d.type === "text" ? { w: 300, h: 60 } : { w: 200, h: 130 };
        const box = big ? b : { x: d.ox - def.w / 2, y: d.oy - def.h / 2, ...def };
        const it = make(d.type, Math.round(box.x), Math.round(box.y), Math.max(24, Math.round(box.w)), Math.max(24, Math.round(box.h)));
        setDraw(null);
        add(it, d.type === "text" || d.type === "sticky");
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [draw]);

  /* ── wheel + pinch ── */
  useEffect(() => {
    const el = vp.current; if (!el) return;
    const wheel = (e) => {
      e.preventDefault();
      const c = R.current.cam, r = rect();
      if (e.ctrlKey || e.metaKey) {
        const z = clamp(c.z * Math.exp(-e.deltaY * 0.01), 0.08, 6);
        const px = e.clientX - r.left, py = e.clientY - r.top;
        setCam({ z, x: px - ((px - c.x) / c.z) * z, y: py - ((py - c.y) / c.z) * z });
      } else setCam({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    let p = new Map(), st = null;
    const pd = (e) => { p.set(e.pointerId, e); if (p.size === 2) { const [a, b] = [...p.values()]; st = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), c: { ...R.current.cam }, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2 }; drag.current = null; } };
    const pm = (e) => {
      if (!p.has(e.pointerId)) return; p.set(e.pointerId, e);
      if (p.size === 2 && st) {
        const [a, b] = [...p.values()], r = rect();
        const nd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const z = clamp(st.c.z * (nd / st.d), 0.08, 6);
        const px = st.mx - r.left, py = st.my - r.top;
        const nmx = (a.clientX + b.clientX) / 2 - r.left, nmy = (a.clientY + b.clientY) / 2 - r.top;
        setCam({ z, x: nmx - ((px - st.c.x) / st.c.z) * z, y: nmy - ((py - st.c.y) / st.c.z) * z });
      }
    };
    const pu = (e) => { p.delete(e.pointerId); if (p.size < 2) st = null; };
    el.addEventListener("pointerdown", pd); window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu); window.addEventListener("pointercancel", pu);
    return () => { el.removeEventListener("wheel", wheel); el.removeEventListener("pointerdown", pd); window.removeEventListener("pointermove", pm); window.removeEventListener("pointerup", pu); window.removeEventListener("pointercancel", pu); };
  }, []);

  /* ── keyboard ── */
  useEffect(() => {
    const typing = () => { const a = document.activeElement; return a && (a.isContentEditable || /input|textarea/i.test(a.tagName)); };
    const kd = (e) => {
      if (e.code === "Space" && !typing()) { setSpace(true); e.preventDefault(); }
      if (typing() || R.current.edit) { if (e.key === "Escape") { setEdit(null); document.activeElement?.blur?.(); } return; }
      const m = e.metaKey || e.ctrlKey;
      if (m && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (m && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (m && e.key.toLowerCase() === "a") { e.preventDefault(); setSel(R.current.doc.items.map((i) => i.id)); setSelC(R.current.doc.connectors.map((c) => c.id)); return; }
      if (m && e.key.toLowerCase() === "d") { e.preventDefault(); dup(); return; }
      if (m && e.key === "0") { e.preventDefault(); fit(); return; }
      if (m && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomBy(1.2); return; }
      if (m && e.key === "-") { e.preventDefault(); zoomBy(1 / 1.2); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); del(); return; }
      if (e.key === "Escape") { setSel([]); setSelC([]); setTool("select"); setPop(null); setModal(null); return; }
      if (e.key === "Enter" && R.current.sel.length === 1) { e.preventDefault(); setEdit(R.current.sel[0]); return; }
      const k = { v: "select", h: "hand", s: "shape", n: "sticky", t: "text", l: "link", c: "conn", i: "image" }[e.key.toLowerCase()];
      if (k && !m) { setTool(k); if (k === "image") fileIn.current?.click(); }
    };
    const ku = (e) => { if (e.code === "Space") setSpace(false); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  /* ── ops ── */
  const patch = (fn) => act((d) => ({ ...d, items: d.items.map((i) => (R.current.sel.includes(i.id) ? { ...i, ...fn(i) } : i)) }));
  const patchC = (fn) => act((d) => ({ ...d, connectors: d.connectors.map((c) => (R.current.selC.includes(c.id) ? { ...c, ...fn(c) } : c)) }));
  const del = () => {
    const s = R.current.sel, sc = R.current.selC;
    if (!s.length && !sc.length) return;
    act((d) => ({
      items: d.items.filter((i) => !s.includes(i.id)),
      connectors: d.connectors.filter((c) => !sc.includes(c.id) && !s.includes(c.from.id) && !s.includes(c.to.id)),
    }));
    setSel([]); setSelC([]);
  };
  const dup = () => {
    const s = selItems; if (!s.length) return;
    let z = topZ(); const idm = {};
    const copies = s.map((i) => { const n = { ...i, id: uid(i.type[0]), x: i.x + 24, y: i.y + 24, z: z++ }; idm[i.id] = n.id; if (i.type === "image") imgs.current[n.id] = imgs.current[i.id]; return n; });
    const cc = doc.connectors.filter((c) => idm[c.from.id] && idm[c.to.id]).map((c) => ({ ...c, id: uid("c"), from: { ...c.from, id: idm[c.from.id] }, to: { ...c.to, id: idm[c.to.id] } }));
    act((d) => ({ items: [...d.items, ...copies], connectors: [...d.connectors, ...cc] }));
    setSel(copies.map((c) => c.id));
  };
  const layer = (dir) => {
    const all = [...doc.items].sort((a, b) => a.z - b.z);
    const s = new Set(R.current.sel);
    const rest = all.filter((i) => !s.has(i.id)), mine = all.filter((i) => s.has(i.id));
    const order = dir > 0 ? [...rest, ...mine] : [...mine, ...rest];
    act((d) => ({ ...d, items: d.items.map((i) => ({ ...i, z: order.findIndex((o) => o.id === i.id) + 1 })) }));
  };
  const zoomBy = (k) => { const r = rect(), c = R.current.cam, z = clamp(c.z * k, 0.08, 6), px = r.width / 2, py = r.height / 2; setCam({ z, x: px - ((px - c.x) / c.z) * z, y: py - ((py - c.y) / c.z) * z }); };
  const fit = (list) => {
    const src = list || (selItems.length ? selItems : doc.items);
    const b = bbox(src); const r = rect();
    if (!b) { setCam({ x: 0, y: 0, z: 1 }); return; }
    const z = clamp(Math.min((r.width - 140) / b.w, (r.height - 180) / b.h), 0.08, 2);
    setCam({ z, x: r.width / 2 - (b.x + b.w / 2) * z, y: r.height / 2 - (b.y + b.h / 2) * z });
  };

  /* ── files ── */
  const onFile = async (e) => {
    const files = [...(e.target.files || [])]; e.target.value = "";
    let c = center(), z = topZ();
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const { blob, w, h } = await downscale(f);
        const url = await Boards.uploadImage(userId, blob);
        const k = Math.min(1, 460 / Math.max(w, h));
        const it = make("image", Math.round(c.x - (w * k) / 2), Math.round(c.y - (h * k) / 2), Math.round(w * k), Math.round(h * k), { src: url, z: z++ });
        imgs.current[it.id] = loadCors(url);
        act((d) => ({ ...d, items: [...d.items, it] }));
        setSel([it.id]);
        c = { x: c.x + 30, y: c.y + 30 };
      } catch (err) {
        console.error(err);
        say("Не удалось загрузить изображение");
      }
    }
  };

  const downscale = (file) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const M = 1600, k = Math.min(1, M / Math.max(im.width, im.height));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        cv.toBlob((blob) => blob ? res({ blob, w: cv.width, h: cv.height }) : rej(new Error("IMAGE_CONVERSION_FAILED")), "image/jpeg", 0.86);
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  const addLink = (raw, at) => {
    let url = raw.trim(); if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    let domain = ""; try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { return say("Не похоже на ссылку"); }
    const path = (() => { try { return decodeURIComponent(new URL(url).pathname).split("/").filter(Boolean).pop() || ""; } catch { return ""; } })();
    const title = path ? path.replace(/[-_]+/g, " ").replace(/\.\w{2,4}$/, "").replace(/^\w/, (c) => c.toUpperCase()) : domain;
    const p = at || center();
    add(make("link", Math.round(p.x - 150), Math.round(p.y - 60), 300, 120, { url, domain, title }));
  };

  /* ── boards ── */
  const newBoard = async () => {
    if (boards.length >= MAX_BOARDS) return say(`Лимит — ${MAX_BOARDS} досок. Удалите одну, чтобы создать новую`);
    try {
      const r = await Boards.create(userId);
      if (r.limit) return say(`Лимит — ${MAX_BOARDS} досок. Удалите одну, чтобы создать новую`);
      const list = [r.board, ...boards];
      setBoards(list);
      await open(r.board.id, list);
      setModal(null);
    } catch (e) { console.error(e); say("Не удалось создать доску"); }
  };
  const dropBoard = async (id) => {
    if (boards.length <= 1) return say("Последнюю доску удалить нельзя");
    try {
      await Boards.remove(userId, id);
      const list = boards.filter((b) => b.id !== id);
      setBoards(list);
      if (id === active) await open(list[0].id, list);
    } catch (e) { console.error(e); say("Не удалось удалить доску"); }
  };
  const renameBoard = async (id, name, icon) => {
    const patch = {};
    if (name != null) patch.name = name;
    if (icon != null) patch.icon = icon;
    const prev = boards;
    setBoards((list) => list.map((b) => b.id === id ? { ...b, ...patch } : b));
    try {
      const row = await Boards.rename(userId, id, patch);
      setBoards((list) => list.map((b) => b.id === id ? { ...b, ...patch, at: row.updated_at, version: row.version } : b));
      if (id === active) verRef.current = row.version;
    } catch (e) {
      console.error(e); setBoards(prev); say("Не удалось переименовать доску");
    }
  };

  /* ── export ── */
  const exportAs = async (fmt) => {
    const src = selItems.length ? selItems : doc.items;
    if (!src.length) return say("Нечего экспортировать");
    const ids = new Set(src.map((i) => i.id));
    const cs = doc.connectors.filter((c) => (!c.from.id || ids.has(c.from.id)) && (!c.to.id || ids.has(c.to.id)));
    const b = bbox(src);
    const withImgs = src.map((i) => (i.type === "image" ? { ...i, _img: imgs.current[i.id] } : i));
    say("Готовлю файл…");
    try {
      const cv = await raster(withImgs, cs, b, 2, dark);
      const name = (boards.find((x) => x.id === active)?.name || "board").replace(/[^\wа-яА-Я\- ]/g, "").trim() || "board";
      if (fmt === "png") {
        cv.toBlob((bl) => { dl(bl, `${name}.png`); say("PNG сохранён"); }, "image/png");
      } else {
        const b64 = cv.toDataURL("image/jpeg", 0.93).split(",")[1];
        const pdf = buildPDF(b64ToBytes(b64), (b.w + 96) * 0.75, (b.h + 96) * 0.75, cv.width, cv.height);
        dl(new Blob([pdf], { type: "application/pdf" }), `${name}.pdf`);
        say(selItems.length ? "PDF: выделенное сохранено" : "PDF: доска сохранена");
      }
    } catch (err) { console.error(err); say("Экспорт не удался"); }
  };

  /* ─────────────── render ─────────────── */

  const selBox = useMemo(() => {
    const b = bbox(selItems); if (!b) return null;
    const p = toScreen(b.x, b.y);
    return { x: p.x, y: p.y, w: b.w * cam.z, h: b.h * cam.z, world: b };
  }, [selItems, cam]);

  const one = selItems.length === 1 ? selItems[0] : null;
  const oneC = selConns.length === 1 ? selConns[0] : null;
  const showStyle = (selItems.length > 0 || selConns.length > 0) && !drag.current;

  const cursor = space || tool === "hand" ? "grab" : tool === "select" ? "default" : tool === "text" ? "text" : "crosshair";

  return (
    <div className="vizy-boards-root" style={{ position: "relative", width:"100%", height:"100%", minHeight:520, background: t.bg, color: t.ink, fontFamily: FONTS.inter.css, overflow: "hidden", userSelect: "none", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        .vizy-boards-root,.vizy-boards-root *{box-sizing:border-box}
        .vizy-boards-root ::-webkit-scrollbar{width:8px;height:8px}
        .vizy-boards-root ::-webkit-scrollbar-thumb{background:${t.line2};border-radius:8px}
        .vizy-boards-root ::-webkit-scrollbar-track{background:transparent}
        .vizy-boards-root [contenteditable]{outline:none}
        .vizy-boards-root input{font-family:inherit}
        @media (prefers-reduced-motion: reduce){.vizy-boards-root *{transition:none!important;animation:none!important}}
      `}</style>

      {/* canvas */}
      <div ref={vp} onPointerDown={onDown} onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "absolute", inset: 0, cursor,
          backgroundImage: cam.z > 0.35 ? `radial-gradient(${t.dot} ${clamp(cam.z, .5, 1.4)}px, transparent ${clamp(cam.z, .5, 1.4)}px)` : "none",
          backgroundSize: `${24 * cam.z}px ${24 * cam.z}px`,
          backgroundPosition: `${cam.x}px ${cam.y}px`,
        }}>

        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`, transformOrigin: "0 0" }}>

          {/* connectors */}
          <svg style={{ position: "absolute", overflow: "visible", width: 1, height: 1, pointerEvents: "none" }}>
            {doc.connectors.map((c) => {
              if ((c.from.id && !map[c.from.id]) || (c.to.id && !map[c.to.id])) return null;
              const g = geom(c, map), cp = connPath(g, c.cap0, c.cap1, c.w || 2);
              const on = selC.includes(c.id);
              const stroke = col(c.color || "graphite", STROKE, dark);
              return (
                <g key={c.id}>
                  {on && <path d={cp.d} fill="none" stroke={t.sel} strokeWidth={(c.w || 2) + 7 / cam.z} strokeOpacity={.16} strokeLinecap="round" />}
                  <path d={cp.d} fill="none" stroke="transparent" strokeWidth={Math.max(16, 16 / cam.z)} style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onPointerDown={(e) => { e.stopPropagation(); if (R.current.tool !== "select") return; setSelC(e.shiftKey ? [...selC, c.id] : [c.id]); setSel([]); setEdit(null); }}
                    onDoubleClick={(e) => { e.stopPropagation(); setModal({ kind: "clabel", id: c.id, v: c.label || "" }); }} />
                  <path d={cp.d} fill="none" stroke={stroke} strokeWidth={c.w || 2} strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={c.dash === "dashed" ? "10 8" : c.dash === "dotted" ? "0.1 6" : undefined} />
                  {[[cp.p0, cp.d0, c.cap0], [cp.p1, cp.d1, c.cap1]].map(([p, d, kk], i) => {
                    if (!kk || kk === "none") return null;
                    const s = capShape(p, d, kk, c.w || 2); if (!s) return null;
                    return <path key={i} d={s.d} fill={s.fill ? stroke : "none"} stroke={s.fill ? "none" : stroke} strokeWidth={c.w || 2} strokeLinecap="round" strokeLinejoin="round" />;
                  })}
                  {c.label && (
                    <text x={cp.mid.x} y={cp.mid.y} textAnchor="middle" dominantBaseline="central"
                      style={{ font: `500 13px ${FONTS.inter.css}`, paintOrder: "stroke", stroke: t.bg, strokeWidth: 7, strokeLinejoin: "round", fill: stroke, pointerEvents: "none" }}>{c.label}</text>
                  )}
                  {on && [["from", cp.p0], ["to", cp.p1]].map(([wch, p]) => (
                    <circle key={wch} cx={p.x} cy={p.y} r={5 / cam.z} fill={t.handle} stroke={t.sel} strokeWidth={1.5 / cam.z}
                      style={{ pointerEvents: "all", cursor: "grab" }} onPointerDown={(e) => endDown(e, c, wch)} />
                  ))}
                </g>
              );
            })}
            {draw?.from && (() => {
              const from = draw.from.id ? anchorOf(map[draw.from.id], draw.from.side, draw.to) : draw.from;
              return <>
                <path d={`M${from.x} ${from.y}L${draw.to.x} ${draw.to.y}`} fill="none" stroke={t.sel} strokeWidth={2 / cam.z} strokeDasharray={`${6 / cam.z} ${5 / cam.z}`} opacity={.7} />
                <circle cx={draw.to.x} cy={draw.to.y} r={4 / cam.z} fill={t.sel} />
              </>;
            })()}
          </svg>

          {/* items */}
          {[...doc.items].sort((a, b) => a.z - b.z).map((it) => (
            <ItemView key={it.id} it={it} t={t} dark={dark} z={cam.z} img={imgs.current[it.id]}
              sel={sel.includes(it.id)} hot={hover === it.id} editing={edit === it.id} tool={tool}
              onDown={(e) => itemDown(e, it)} onPort={(e, s) => portDown(e, it, s)}
              onEdit={() => setEdit(it.id)}
              onText={(v) => { act((d) => ({ ...d, items: d.items.map((i) => (i.id === it.id ? { ...i, text: v } : i)) })); }}
              onDoneEdit={() => setEdit(null)} />
          ))}

          {/* draft shape */}
          {draw?.box && (
            <div style={{
              position: "absolute", left: draw.box.x, top: draw.box.y, width: draw.box.w, height: draw.box.h,
              border: `${1.5 / cam.z}px dashed ${t.sel}`, opacity: .5, borderRadius: tool === "shape" ? 6 : 3, pointerEvents: "none",
            }} />
          )}
        </div>

        {/* selection chrome (screen space) */}
        {selBox && !edit && (
          <div style={{ position: "absolute", left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h, pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: -1, border: `1.5px solid ${t.sel}`, borderRadius: 3, opacity: .9 }} />
            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((h) => {
              const pos = { nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] }[h];
              const mid = h.length === 1;
              return <div key={h} onPointerDown={(e) => handleDown(e, h)}
                style={{
                  position: "absolute", left: `${pos[0] * 100}%`, top: `${pos[1] * 100}%`,
                  width: mid ? 8 : 10, height: mid ? 8 : 10, transform: "translate(-50%,-50%)",
                  background: t.handle, border: `1.5px solid ${t.sel}`, borderRadius: mid ? 2 : 3,
                  pointerEvents: "all", cursor: `${h}-resize`, boxShadow: "0 1px 3px rgba(0,0,0,.18)",
                }} />;
            })}
          </div>
        )}

        {/* marquee */}
        {marq && (() => { const r = rect(); return (
          <div style={{ position: "absolute", left: marq.x - r.left, top: marq.y - r.top, width: marq.w, height: marq.h, border: `1px solid ${t.sel}`, background: dark ? "rgba(255,255,255,.06)" : "rgba(11,12,14,.045)", borderRadius: 2, pointerEvents: "none" }} />
        ); })()}
      </div>

      <input ref={fileIn} type="file" accept="image/*" multiple onChange={onFile} style={{ display: "none" }} />

      {/* ── top left: board switcher ── */}
      <div style={{ position: "absolute", left: 16, top: 16, zIndex: 40 }}>
        <Panel t={t} style={{ display: "flex", alignItems: "center", padding: 5, gap: 2 }} onPointerDown={(e) => e.stopPropagation()}>
          <span style={{padding:"0 8px",fontSize:9.5,fontWeight:600,letterSpacing:1.2,color:t.ink3,whiteSpace:"nowrap"}}>VIZY BOARDS</span>
          <Sep t={t} />
          <button onClick={() => setModal(modal?.kind === "boards" ? null : { kind: "boards" })}
            style={{ display: "flex", alignItems: "center", gap: 9, height: 32, padding: "0 10px 0 8px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 9, color: t.ink }}>
            <span style={{ fontSize: 15, width: 20, textAlign: "center", lineHeight: 1 }}>{boards.find((b) => b.id === active)?.icon || "◇"}</span>
            <span style={{ fontFamily: FONTS.montserrat.css, fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em", maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {boards.find((b) => b.id === active)?.name || "Доска"}
            </span>
            <ChevronDown size={14} style={{ color: t.ink3, transform: modal?.kind === "boards" ? "rotate(180deg)" : "none", transition: "transform .16s" }} />
          </button>
          <Sep t={t} />
          <Btn t={t} title="Отменить  ⌘Z" onClick={undo} disabled={!hist.current.p.length}><Undo2 size={15} /></Btn>
          <Btn t={t} title="Вернуть  ⇧⌘Z" onClick={redo} disabled={!hist.current.f.length}><Redo2 size={15} /></Btn>
        </Panel>

        {modal?.kind === "boards" && (
          <BoardMenu t={t} boards={boards} active={active} max={MAX_BOARDS}
            onOpen={(id) => { open(id); setModal(null); }} onNew={newBoard} onDrop={dropBoard} onRename={renameBoard}
            onClose={() => setModal(null)} doc={doc} dark={dark} />
        )}
      </div>

      <div style={{
        position:"absolute",left:"50%",top:20,transform:"translateX(-50%)",zIndex:39,
        padding:"6px 10px",borderRadius:999,border:`1px solid ${t.line}`,
        background:t.glass,backdropFilter:"blur(12px)",fontSize:10.5,color:t.ink3,
        pointerEvents:"none",whiteSpace:"nowrap"
      }}>
        {saveState==="saving"?"Сохраняется…":saveState==="dirty"?"Есть изменения":saveState==="conflict"?"Конфликт версии":saveState==="remote"?"Обновлено на другом устройстве":saveState==="error"?"Ошибка сохранения":saveState==="loading"?"Загрузка…":"Сохранено в облаке"}
      </div>

      {/* ── top right ── */}
      <div style={{ position: "absolute", right: 16, top: 16, zIndex: 40 }}>
        <Panel t={t} style={{ display: "flex", alignItems: "center", padding: 5, gap: 2 }} onPointerDown={(e) => e.stopPropagation()}>
          <Btn t={t} wide title="Сохранить в PDF" onClick={() => exportAs("pdf")}><FileDown size={15} />PDF</Btn>
          <Btn t={t} title="Сохранить в PNG" onClick={() => exportAs("png")}><Download size={15} /></Btn>
          <Sep t={t} />
          <Btn t={t} title={dark ? "Светлая тема" : "Тёмная тема"} onClick={() => onToggleTheme?.()}>{dark ? <Sun size={15} /> : <Moon size={15} />}</Btn>
        </Panel>
        {(selItems.length > 0 || selConns.length > 0) && (
          <div style={{ marginTop: 8, textAlign: "right", fontSize: 11, color: t.ink3, letterSpacing: ".01em" }}>
            {selItems.length ? `${selItems.length} объект${selItems.length > 1 ? "ов" : ""} → PDF` : "связь выделена"}
          </div>
        )}
      </div>

      {/* ── style panel ── */}
      {showStyle && (
        <StylePanel t={t} dark={dark} one={one} many={selItems} conns={selConns} oneC={oneC}
          box={selBox} pop={pop} setPop={setPop}
          patch={patch} patchC={patchC} onDel={del} onDup={dup} onLayer={layer}
          onShape={(k) => { setKind(k); patch(() => ({ shape: k })); }}
          onLabel={(c) => setModal({ kind: "clabel", id: c.id, v: c.label || "" })} />
      )}

      {/* ── toolbar ── */}
      <div style={{ position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 40 }}>
        <Panel t={t} style={{ display: "flex", alignItems: "center", padding: 6, gap: 2 }} onPointerDown={(e) => e.stopPropagation()}>
          <Btn t={t} active={tool === "select"} title="Выбор  V" onClick={() => setTool("select")}><MousePointer2 size={16} /></Btn>
          <Btn t={t} active={tool === "hand"} title="Рука  H  (или Space)" onClick={() => setTool("hand")}><Hand size={16} /></Btn>
          <Sep t={t} />
          <div style={{ position: "relative", display: "flex" }}>
            <Btn t={t} active={tool === "shape"} title={`Фигура  S — ${SHAPES[kind].name}`} onClick={() => { setTool("shape"); }}>
              <svg width={16} height={16} viewBox="0 0 16 16"><path d={SHAPES[kind].d(15, 15)} transform="translate(0.5,0.5)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" /></svg>
            </Btn>
            <button onClick={() => setPop(pop === "shapes" ? null : "shapes")} title="Все фигуры"
              style={{ border: "none", background: pop === "shapes" ? t.act : "transparent", cursor: "pointer", borderRadius: 9, width: 18, height: 32, color: t.ink3, padding: 0 }}>
              <ChevronDown size={12} />
            </button>
            {pop === "shapes" && (
              <Panel t={t} style={{ position: "absolute", bottom: 42, left: -6, padding: 10, width: 268 }}>
                <div style={{ fontSize: 10.5, color: t.ink3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>Фигуры</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>
                  {SHAPE_KEYS.map((k) => (
                    <button key={k} title={SHAPES[k].name}
                      onClick={() => { setKind(k); setPop(null); if (sel.length) patch(() => ({ shape: k })); else setTool("shape"); }}
                      style={{ height: 38, border: "none", borderRadius: 8, background: kind === k ? t.act : "transparent", cursor: "pointer", color: t.ink, display: "grid", placeItems: "center" }}
                      onMouseEnter={(e) => { if (kind !== k) e.currentTarget.style.background = t.hov; }}
                      onMouseLeave={(e) => { if (kind !== k) e.currentTarget.style.background = "transparent"; }}>
                      <svg width={20} height={20} viewBox="0 0 20 20"><path d={SHAPES[k].d(18, 18)} transform="translate(1,1)" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
                        {SHAPES[k].extra && <path d={SHAPES[k].extra(18, 18)} transform="translate(1,1)" fill="none" stroke="currentColor" strokeWidth={1.4} />}</svg>
                    </button>
                  ))}
                </div>
              </Panel>
            )}
          </div>
          <Btn t={t} active={tool === "conn"} title="Связь  C" onClick={() => setTool("conn")}><Spline size={16} /></Btn>
          <Btn t={t} active={tool === "sticky"} title="Стикер  N" onClick={() => setTool("sticky")}><StickyNote size={16} /></Btn>
          <Btn t={t} active={tool === "text"} title="Текст  T" onClick={() => setTool("text")}><TypeIcon size={16} /></Btn>
          <Btn t={t} active={tool === "image"} title="Изображение  I" onClick={() => fileIn.current?.click()}><ImageIcon size={16} /></Btn>
          <Btn t={t} active={tool === "link"} title="Ссылка  L" onClick={() => setModal({ kind: "link", url: "" })}><Link2 size={16} /></Btn>
        </Panel>
      </div>

      {/* ── zoom ── */}
      <div style={{ position: "absolute", right: 16, bottom: 20, zIndex: 40 }}>
        <Panel t={t} style={{ display: "flex", alignItems: "center", padding: 5, gap: 1 }} onPointerDown={(e) => e.stopPropagation()}>
          <Btn t={t} title="Уменьшить" onClick={() => zoomBy(1 / 1.25)}><Minus size={15} /></Btn>
          <button onClick={() => setCam((c) => ({ ...c, z: 1 }))} style={{ border: "none", background: "transparent", color: t.ink2, fontSize: 11.5, fontWeight: 500, width: 46, cursor: "pointer", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(cam.z * 100)}%
          </button>
          <Btn t={t} title="Увеличить" onClick={() => zoomBy(1.25)}><Plus size={15} /></Btn>
          <Sep t={t} />
          <Btn t={t} title="Вместить  ⌘0" onClick={() => fit()}><Maximize size={14} /></Btn>
        </Panel>
      </div>

      {/* ── modals ── */}
      {modal?.kind === "link" && (
        <Prompt t={t} title="Вставить ссылку" placeholder="https://" value={modal.url} cta="Добавить"
          onChange={(v) => setModal({ ...modal, url: v })}
          onOk={() => { addLink(modal.url, modal.at); setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "clabel" && (
        <Prompt t={t} title="Подпись связи" placeholder="например: приводит к" value={modal.v} cta="Сохранить"
          onChange={(v) => setModal({ ...modal, v })}
          onOk={() => { act((d) => ({ ...d, connectors: d.connectors.map((c) => (c.id === modal.id ? { ...c, label: modal.v } : c)) })); setModal(null); }}
          onClose={() => setModal(null)} />
      )}

      {/* ── toast ── */}
      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: 84, transform: "translateX(-50%)", zIndex: 60,
          background: dark ? "#F2F3F5" : "#0B0C0E", color: dark ? "#0B0C0E" : "#FFF",
          padding: "9px 15px", borderRadius: 10, fontSize: 12.5, fontWeight: 500, boxShadow: t.sh, whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* empty state */}
      {ready && !doc.items.length && !draw && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONTS.marker.css, fontSize: 34, color: t.ink3, marginBottom: 10 }}>пустая доска</div>
            <div style={{ fontSize: 13, color: t.ink3 }}>Возьмите инструмент внизу или нажмите S, N, T</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── item view ─────────────────────────── */

function ItemView({ it, t, dark, z, img, sel, hot, editing, tool, onDown, onPort, onEdit, onText, onDoneEdit }) {
  const ref = useRef(null);
  const [ports, setPorts] = useState(false);
  useEffect(() => {
    if (!editing || !ref.current) return;
    const el = ref.current; el.focus();
    const r = document.createRange(); r.selectNodeContents(el);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }, [editing]);

  const f = FONTS[it.font] || FONTS.inter;
  const showPorts = (ports || hot) && (tool === "select" || tool === "conn") && it.type !== "text";

  const textStyle = {
    fontFamily: f.css, fontWeight: it.bold ? 700 : f.w, fontStyle: it.italic ? "italic" : "normal",
    fontSize: it.fs, lineHeight: 1.32, textAlign: it.halign || "center",
    color: it.type === "text" ? col(it.color || "graphite", STROKE, dark) : col(it.color || "graphite", ONCOLOR, dark),
    width: "100%", wordBreak: "break-word", whiteSpace: "pre-wrap",
  };

  const inner = (
    <div style={{
      position: "absolute", inset: 0, padding: 14, display: "flex",
      alignItems: it.type === "text" || it.align === "top" ? "flex-start" : "center",
      justifyContent: "center", flexDirection: "column", pointerEvents: editing ? "auto" : "none", overflow: "hidden",
    }}>
      {editing ? (
        <div ref={ref} contentEditable suppressContentEditableWarning
          onBlur={(e) => { onText(e.currentTarget.innerText); onDoneEdit(); }}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") { e.currentTarget.blur(); } }}
          style={{ ...textStyle, cursor: "text", minHeight: it.fs }}>{it.text}</div>
      ) : it.text ? <div style={textStyle}>{it.text}</div> : it.type === "text" ? <div style={{ ...textStyle, color: t.ink3 }}>Текст</div> : null}
    </div>
  );

  const body = () => {
    if (it.type === "shape") {
      const sp = SHAPES[it.shape] || SHAPES.round;
      return <svg width={it.w} height={it.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={sp.d(it.w, it.h)} fill={it.fill === "none" ? "none" : col(it.fill, FILL, dark)}
          stroke={it.sstyle === "none" ? "none" : col(it.stroke, STROKE, dark)} strokeWidth={it.sw ?? 2} strokeLinejoin="round"
          strokeDasharray={it.sstyle === "dashed" ? "9 7" : it.sstyle === "dotted" ? "0.1 5" : undefined} strokeLinecap="round" />
        {sp.extra && it.sstyle !== "none" && <path d={sp.extra(it.w, it.h)} fill="none" stroke={col(it.stroke, STROKE, dark)} strokeWidth={it.sw ?? 2} strokeLinecap="round" />}
      </svg>;
    }
    if (it.type === "sticky") return <div style={{ position: "absolute", inset: 0, background: col(it.color, STICKY, dark), borderRadius: 4, boxShadow: dark ? "0 6px 16px rgba(0,0,0,.4)" : "0 6px 16px rgba(11,12,14,.13)" }} />;
    if (it.type === "image") return <div style={{ position: "absolute", inset: 0, borderRadius: it.radius ?? 6, overflow: "hidden", background: t.hov }}>
      {it.src && <img src={it.src} crossOrigin="anonymous" alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
    </div>;
    if (it.type === "link") {
      const c0 = col(it.color || "blue", STROKE, dark);
      return <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: dark ? "#17191D" : "#FFF", border: `1px solid ${t.line2}`, boxShadow: t.shItem, overflow: "hidden", display: "flex", flexDirection: "column", padding: 16, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: c0, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 15, flex: "0 0 auto" }}>
            {(it.domain || "?")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 11.5, color: t.ink3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.domain}</div>
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: t.ink, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{it.title}</div>
        <a href={it.url} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          style={{ marginTop: "auto", fontSize: 11.5, color: c0, textDecoration: "none", fontWeight: 500, pointerEvents: "all" }}>Открыть ↗</a>
      </div>;
    }
    return null;
  };

  return (
    <div
      onPointerDown={onDown} onDoubleClick={(e) => { e.stopPropagation(); if (it.type !== "image" && it.type !== "link") onEdit(); }}
      onMouseEnter={() => setPorts(true)} onMouseLeave={() => setPorts(false)}
      style={{
        position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h,
        cursor: tool === "conn" ? "crosshair" : "move", touchAction: "none",
      }}>
      {body()}
      {inner}
      {(sel || hot) && <div style={{ position: "absolute", inset: -2 / z, border: `${1.5 / z}px solid ${t.sel}`, borderRadius: 4 / z, opacity: sel ? 0 : .45, pointerEvents: "none" }} />}
      {showPorts && ["t", "r", "b", "l"].map((s) => {
        const p = { t: ["50%", 0], r: ["100%", "50%"], b: ["50%", "100%"], l: [0, "50%"] }[s];
        return <div key={s} onPointerDown={(e) => onPort(e, s)}
          style={{
            position: "absolute", left: p[0], top: p[1], transform: "translate(-50%,-50%)",
            width: 9 / z, height: 9 / z, borderRadius: "50%", background: t.handle, border: `${1.5 / z}px solid ${t.sel}`,
            cursor: "crosshair", zIndex: 5,
          }} />;
      })}
    </div>
  );
}

/* ─────────────────────────── style panel ─────────────────────────── */

function StylePanel({ t, dark, one, many, conns, oneC, box, pop, setPop, patch, patchC, onDel, onDup, onLayer, onShape, onLabel }) {
  const isConn = conns.length > 0 && !many.length;
  const anchorX = box ? clamp(box.x + box.w / 2, 220, window.innerWidth - 220) : window.innerWidth / 2;
  const anchorY = box ? Math.max(74, box.y - 58) : 100;

  const Swatches = ({ value, onPick, allowNone, mode }) => (
    <Panel t={t} style={{ position: "absolute", top: 44, left: 0, padding: 10, width: 216 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {allowNone && (
          <button onClick={() => onPick("none")} title="Без заливки"
            style={{ height: 30, borderRadius: 8, border: `1px solid ${value === "none" ? t.sel : t.line2}`, background: "transparent", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 3, right: 3, top: "50%", height: 1.5, background: "#D2453C", transform: "rotate(-32deg)" }} />
          </button>
        )}
        {CKEYS.map((k) => (
          <button key={k} onClick={() => onPick(k)} title={k}
            style={{
              height: 30, borderRadius: 8, cursor: "pointer",
              background: mode === "stroke" ? col(k, STROKE, dark) : mode === "sticky" ? col(k, STICKY, dark) : col(k, FILL, dark),
              border: `1.5px solid ${value === k ? t.sel : mode === "stroke" ? "transparent" : col(k, STROKE, dark) + "55"}`,
              boxShadow: value === k ? `0 0 0 2px ${t.bg}, 0 0 0 3.5px ${t.sel}` : "none",
            }} />
        ))}
      </div>
    </Panel>
  );

  const Menu = ({ items, value, onPick, w = 176 }) => (
    <Panel t={t} style={{ position: "absolute", top: 44, left: 0, padding: 5, width: w }}>
      {items.map((o) => (
        <button key={o.v} onClick={() => onPick(o.v)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", height: 32, padding: "0 9px", border: "none", borderRadius: 8, background: value === o.v ? t.act : "transparent", color: t.ink, cursor: "pointer", fontSize: 12.5, fontFamily: o.font || "inherit", textAlign: "left" }}
          onMouseEnter={(e) => { if (value !== o.v) e.currentTarget.style.background = t.hov; }}
          onMouseLeave={(e) => { if (value !== o.v) e.currentTarget.style.background = "transparent"; }}>
          {o.icon && <span style={{ display: "grid", placeItems: "center", width: 22, color: t.ink2 }}>{o.icon}</span>}
          <span style={{ flex: 1 }}>{o.l}</span>
          {value === o.v && <Check size={13} style={{ color: t.ink3 }} />}
        </button>
      ))}
    </Panel>
  );

  const Grp = ({ id, label, children, content }) => (
    <div style={{ position: "relative" }}>
      <Btn t={t} wide active={pop === id} title={label} onClick={() => setPop(pop === id ? null : id)}>{children}<ChevronDown size={11} style={{ opacity: .5 }} /></Btn>
      {pop === id && content}
    </div>
  );

  const capOpts = [
    { v: "none", l: "Без наконечника" }, { v: "arrow", l: "Стрелка" }, { v: "triangle", l: "Треугольник" },
    { v: "circle", l: "Круг" }, { v: "diamond", l: "Ромб" }, { v: "bar", l: "Черта" },
  ];

  return (
    <div style={{ position: "absolute", left: anchorX, top: anchorY, transform: "translateX(-50%)", zIndex: 45 }}
      onPointerDown={(e) => e.stopPropagation()}>
      <Panel t={t} style={{ display: "flex", alignItems: "center", padding: 5, gap: 2, maxWidth: "min(94vw,720px)", overflowX: "auto" }}>
        {isConn ? (
          <>
            <Grp id="ccolor" label="Цвет" content={<Swatches mode="stroke" value={oneC?.color} onPick={(v) => { patchC(() => ({ color: v })); setPop(null); }} />}>
              <span style={{ width: 15, height: 15, borderRadius: 5, background: col(oneC?.color || "graphite", STROKE, dark), border: `1px solid ${t.line2}` }} />
            </Grp>
            <Grp id="cstyle" label="Тип линии" content={<Menu value={oneC?.style} onPick={(v) => { patchC(() => ({ style: v })); setPop(null); }}
              items={[{ v: "straight", l: "Прямая" }, { v: "curved", l: "Кривая" }, { v: "elbow", l: "Уступами" }]} />}>
              <Spline size={15} />
            </Grp>
            <Grp id="cdash" label="Штрих" content={<Menu value={oneC?.dash} onPick={(v) => { patchC(() => ({ dash: v })); setPop(null); }}
              items={[{ v: "solid", l: "Сплошная" }, { v: "dashed", l: "Пунктир" }, { v: "dotted", l: "Точки" }]} />}>
              <svg width={16} height={16} viewBox="0 0 16 16"><path d="M1 8h14" stroke="currentColor" strokeWidth={1.6} strokeDasharray={oneC?.dash === "dashed" ? "4 3" : oneC?.dash === "dotted" ? "0.1 3" : ""} strokeLinecap="round" /></svg>
            </Grp>
            <Grp id="cap0" label="Начало" content={<Menu value={oneC?.cap0} onPick={(v) => { patchC(() => ({ cap0: v })); setPop(null); }} items={capOpts} w={190} />}>
              <svg width={16} height={16} viewBox="0 0 16 16"><path d="M6 4L2 8l4 4M2 8h12" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Grp>
            <Grp id="cap1" label="Конец" content={<Menu value={oneC?.cap1} onPick={(v) => { patchC(() => ({ cap1: v })); setPop(null); }} items={capOpts} w={190} />}>
              <svg width={16} height={16} viewBox="0 0 16 16"><path d="M10 4l4 4-4 4M14 8H2" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Grp>
            <Grp id="cw" label="Толщина" content={<Menu value={oneC?.w} onPick={(v) => { patchC(() => ({ w: v })); setPop(null); }}
              items={[{ v: 1, l: "Тонкая" }, { v: 2, l: "Обычная" }, { v: 3, l: "Средняя" }, { v: 5, l: "Жирная" }]} />}>
              <Layers size={15} />
            </Grp>
            <Sep t={t} />
            <Btn t={t} wide title="Подпись" onClick={() => oneC && onLabel(oneC)}><TypeIcon size={14} />Подпись</Btn>
            <Btn t={t} title="Удалить  ⌫" danger onClick={onDel}><Trash2 size={15} /></Btn>
          </>
        ) : (
          <>
            {many.some((i) => i.type === "shape") && (
              <>
                <Grp id="shape" label="Фигура" content={
                  <Panel t={t} style={{ position: "absolute", top: 44, left: 0, padding: 10, width: 268 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>
                      {SHAPE_KEYS.map((k) => (
                        <button key={k} title={SHAPES[k].name} onClick={() => { onShape(k); setPop(null); }}
                          style={{ height: 38, border: "none", borderRadius: 8, background: one?.shape === k ? t.act : "transparent", cursor: "pointer", color: t.ink, display: "grid", placeItems: "center" }}>
                          <svg width={20} height={20} viewBox="0 0 20 20"><path d={SHAPES[k].d(18, 18)} transform="translate(1,1)" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" /></svg>
                        </button>
                      ))}
                    </div>
                  </Panel>
                }>
                  <svg width={16} height={16} viewBox="0 0 16 16"><path d={SHAPES[one?.shape || "round"].d(15, 15)} transform="translate(0.5,0.5)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" /></svg>
                </Grp>
                <Grp id="fill" label="Заливка" content={<Swatches allowNone value={one?.fill} onPick={(v) => { patch(() => ({ fill: v })); setPop(null); }} />}>
                  <span style={{ width: 15, height: 15, borderRadius: 5, background: one?.fill === "none" ? "transparent" : col(one?.fill || "graphite", FILL, dark), border: `1.5px solid ${col(one?.stroke || "graphite", STROKE, dark)}` }} />
                </Grp>
                <Grp id="stroke" label="Контур" content={
                  <Panel t={t} style={{ position: "absolute", top: 44, left: 0, padding: 10, width: 216 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 10 }}>
                      {CKEYS.map((k) => (
                        <button key={k} onClick={() => patch(() => ({ stroke: k }))}
                          style={{ height: 30, borderRadius: 8, cursor: "pointer", background: col(k, STROKE, dark), border: "none", boxShadow: one?.stroke === k ? `0 0 0 2px ${t.bg}, 0 0 0 3.5px ${t.sel}` : "none" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[{ v: "solid", l: "—" }, { v: "dashed", l: "- -" }, { v: "dotted", l: "···" }, { v: "none", l: "нет" }].map((o) => (
                        <button key={o.v} onClick={() => patch(() => ({ sstyle: o.v }))}
                          style={{ flex: 1, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: one?.sstyle === o.v ? t.act : t.hov, color: t.ink, fontSize: 12 }}>{o.l}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {[1, 2, 3, 5].map((w) => (
                        <button key={w} onClick={() => patch(() => ({ sw: w }))}
                          style={{ flex: 1, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: one?.sw === w ? t.act : t.hov, display: "grid", placeItems: "center" }}>
                          <div style={{ width: 18, height: w, background: t.ink, borderRadius: 2 }} />
                        </button>
                      ))}
                    </div>
                  </Panel>
                }>
                  <span style={{ width: 15, height: 15, borderRadius: 5, border: `2px solid ${col(one?.stroke || "graphite", STROKE, dark)}` }} />
                </Grp>
              </>
            )}

            {many.some((i) => i.type === "sticky") && (
              <Grp id="sticky" label="Цвет стикера" content={<Swatches mode="sticky" value={one?.color} onPick={(v) => { patch(() => ({ color: v })); setPop(null); }} />}>
                <span style={{ width: 15, height: 15, borderRadius: 4, background: col(one?.color || "amber", STICKY, dark), border: `1px solid ${t.line2}` }} />
              </Grp>
            )}
            {many.some((i) => i.type === "text") && (
              <Grp id="tcolor" label="Цвет текста" content={<Swatches mode="stroke" value={one?.color} onPick={(v) => { patch(() => ({ color: v })); setPop(null); }} />}>
                <span style={{ width: 15, height: 15, borderRadius: 5, background: col(one?.color || "graphite", STROKE, dark) }} />
              </Grp>
            )}
            {many.some((i) => i.type === "link") && (
              <Grp id="lcolor" label="Акцент" content={<Swatches mode="stroke" value={one?.color} onPick={(v) => { patch(() => ({ color: v })); setPop(null); }} />}>
                <span style={{ width: 15, height: 15, borderRadius: 5, background: col(one?.color || "blue", STROKE, dark) }} />
              </Grp>
            )}

            {many.some((i) => ["shape", "sticky", "text"].includes(i.type)) && (
              <>
                <Sep t={t} />
                <Grp id="font" label="Шрифт" content={<Menu value={one?.font} onPick={(v) => { patch(() => ({ font: v })); setPop(null); }}
                  items={Object.entries(FONTS).map(([k, v]) => ({ v: k, l: v.label, font: v.css }))} />}>
                  <span style={{ fontFamily: (FONTS[one?.font] || FONTS.inter).css, fontSize: 13 }}>Aa</span>
                </Grp>
                <Grp id="size" label="Размер" content={<Menu value={one?.fs} w={130} onPick={(v) => { patch(() => ({ fs: v })); setPop(null); }}
                  items={[12, 14, 16, 18, 22, 28, 36, 48, 64].map((n) => ({ v: n, l: `${n} px` }))} />}>
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{one?.fs ?? 16}</span>
                </Grp>
                <Btn t={t} active={one?.bold} title="Жирный" onClick={() => patch((i) => ({ bold: !i.bold }))}><Bold size={14} /></Btn>
                <Btn t={t} active={one?.italic} title="Курсив" onClick={() => patch((i) => ({ italic: !i.italic }))}><Italic size={14} /></Btn>
                <Btn t={t} title="Выравнивание" onClick={() => patch((i) => ({ halign: i.halign === "left" ? "center" : i.halign === "center" ? "right" : "left" }))}>
                  {one?.halign === "left" ? <AlignLeft size={14} /> : one?.halign === "right" ? <AlignRight size={14} /> : <AlignCenter size={14} />}
                </Btn>
              </>
            )}

            <Sep t={t} />
            <Btn t={t} title="На передний план" onClick={() => onLayer(1)}><ArrowUp size={15} /></Btn>
            <Btn t={t} title="На задний план" onClick={() => onLayer(-1)}><ArrowDown size={15} /></Btn>
            <Btn t={t} title="Дублировать  ⌘D" onClick={onDup}><Copy size={15} /></Btn>
            <Btn t={t} title="Удалить  ⌫" danger onClick={onDel}><Trash2 size={15} /></Btn>
          </>
        )}
      </Panel>
    </div>
  );
}

/* ─────────────────────────── board menu ─────────────────────────── */

const ICONS = ["◇", "◆", "○", "●", "□", "■", "△", "▲", "☾", "✦", "⚑", "⌘", "∞", "⟁", "◈", "☰", "✳", "⊘"];

function BoardMenu({ t, boards, active, max, onOpen, onNew, onDrop, onRename, onClose, doc, dark }) {
  const [ren, setRen] = useState(null);
  const [ico, setIco] = useState(null);
  const [q, setQ] = useState("");
  const list = boards.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Panel t={t} style={{ position: "absolute", top: 50, left: 0, width: 330, padding: 8, zIndex: 50 }} onPointerDown={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 8px" }}>
        <Search size={13} style={{ color: t.ink3, flex: "0 0 auto" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти доску"
          style={{ flex: 1, border: "none", background: "transparent", color: t.ink, fontSize: 12.5, outline: "none" }} />
        <span style={{ fontSize: 11, color: t.ink3, fontVariantNumeric: "tabular-nums" }}>{boards.length}/{max}</span>
      </div>
      <div style={{ height: 1, background: t.line, margin: "0 -8px 6px" }} />
      <div style={{ maxHeight: 340, overflowY: "auto", margin: "0 -2px" }}>
        {list.map((b) => {
          const on = b.id === active;
          return (
            <div key={b.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 10, background: on ? t.act : "transparent", cursor: "pointer", position: "relative" }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = t.hov; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              onClick={() => { if (ren !== b.id) onOpen(b.id); }}>
              <button onClick={(e) => { e.stopPropagation(); setIco(ico === b.id ? null : b.id); }}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.line}`, background: t.bg, color: t.ink, cursor: "pointer", fontSize: 14, flex: "0 0 auto", display: "grid", placeItems: "center" }}>
                {b.icon}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                {ren === b.id ? (
                  <input autoFocus defaultValue={b.name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { onRename(b.id, e.target.value.trim() || b.name); setRen(null); }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setRen(null); }}
                    style={{ width: "100%", border: "none", background: "transparent", color: t.ink, fontSize: 13, fontWeight: 600, fontFamily: FONTS.montserrat.css, outline: "none" }} />
                ) : (
                  <div onDoubleClick={(e) => { e.stopPropagation(); setRen(b.id); }}
                    style={{ fontSize: 13, fontWeight: 600, fontFamily: FONTS.montserrat.css, letterSpacing: "-0.01em", color: t.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.name}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: t.ink3, marginTop: 1 }}>
                  {on ? `${doc.items.length} объектов · ${doc.connectors.length} связей` : "двойной клик — переименовать"}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDrop(b.id); }} title="Удалить доску"
                style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", color: t.ink3, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#D2453C"; e.currentTarget.style.background = t.hov; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.ink3; e.currentTarget.style.background = "transparent"; }}>
                <Trash2 size={13} />
              </button>
              {ico === b.id && (
                <Panel t={t} style={{ position: "absolute", left: 4, top: 42, padding: 8, zIndex: 60, width: 210 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3 }}>
                    {ICONS.map((s) => (
                      <button key={s} onClick={(e) => { e.stopPropagation(); onRename(b.id, null, s); setIco(null); }}
                        style={{ height: 30, borderRadius: 7, border: "none", background: b.icon === s ? t.act : "transparent", color: t.ink, cursor: "pointer", fontSize: 14 }}>{s}</button>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ height: 1, background: t.line, margin: "6px -8px" }} />
      <button onClick={onNew} disabled={boards.length >= max}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 8px", border: "none", borderRadius: 10, background: "transparent", color: boards.length >= max ? t.ink3 : t.ink, cursor: boards.length >= max ? "default" : "pointer", fontSize: 12.5, fontWeight: 500 }}
        onMouseEnter={(e) => { if (boards.length < max) e.currentTarget.style.background = t.hov; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        <Plus size={15} />{boards.length >= max ? `Достигнут лимит ${max} досок` : "Создать доску"}
      </button>
    </Panel>
  );
}

/* ─────────────────────────── prompt ─────────────────────────── */

function Prompt({ t, title, placeholder, value, cta, onChange, onOk, onClose }) {
  return (
    <div onPointerDown={onClose} style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(0,0,0,.25)", display: "grid", placeItems: "center", backdropFilter: "blur(3px)" }}>
      <Panel t={t} onPointerDown={(e) => e.stopPropagation()} style={{ width: 380, padding: 18, background: t.solid }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.montserrat.css, fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", color: t.ink3, cursor: "pointer", padding: 2 }}><X size={15} /></button>
        </div>
        <input autoFocus value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") onOk(); if (e.key === "Escape") onClose(); }}
          style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: `1px solid ${t.line2}`, background: t.bg, color: t.ink, fontSize: 13.5, outline: "none" }} />
        <button onClick={onOk}
          style={{ width: "100%", height: 38, marginTop: 12, borderRadius: 10, border: "none", cursor: "pointer", background: t.ink, color: t.bg, fontSize: 13, fontWeight: 600, fontFamily: FONTS.inter.css }}>
          {cta}
        </button>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── seed board ─────────────────────────── */

function seed() {
  const mk = (o) => ({ id: uid("s"), type: "shape", shape: "round", fill: "graphite", stroke: "graphite", sw: 2, sstyle: "solid", color: "graphite", text: "", font: "inter", fs: 16, halign: "center", bold: false, italic: false, z: 1, ...o });
  const a = mk({ x: -300, y: -140, w: 220, h: 100, shape: "pill", text: "Трафик", fill: "blue", stroke: "blue", color: "blue", z: 1 });
  const b = mk({ x: 20, y: -160, w: 230, h: 140, shape: "round", text: "Лид-магнит", fill: "violet", stroke: "violet", color: "violet", z: 2 });
  const c = mk({ x: 20, y: 90, w: 230, h: 140, shape: "diamond", text: "Заявка", fill: "amber", stroke: "amber", color: "amber", z: 3 });
  const d = mk({ x: 380, y: -60, w: 240, h: 120, shape: "note", text: "Стратегическая\nсессия", fill: "green", stroke: "green", color: "green", z: 4 });
  const st = { id: uid("n"), type: "sticky", x: 390, y: 120, w: 200, h: 200, color: "amber", text: "Узкое место:\nконверсия в заявку", font: "marker", fs: 19, halign: "center", bold: false, italic: false, z: 5 };
  const tx = { id: uid("t"), type: "text", x: -300, y: -280, w: 420, h: 60, color: "graphite", text: "Воронка Kirill Scales", font: "montserrat", fs: 32, halign: "left", align: "top", bold: true, italic: false, z: 6 };
  const cn = (f, tt, style = "curved") => ({ id: uid("c"), from: { id: f, side: "auto" }, to: { id: tt, side: "auto" }, style, cap0: "none", cap1: "arrow", dash: "solid", color: "graphite", w: 2, label: "" });
  return {
    id: uid("b"), name: "Воронка", icon: "◈",
    items: [tx, a, b, c, d, st],
    connectors: [cn(a.id, b.id), cn(b.id, c.id), { ...cn(c.id, d.id), label: "фильтр" }],
    cam: { x: 0, y: 0, z: 1 },
  };
}
