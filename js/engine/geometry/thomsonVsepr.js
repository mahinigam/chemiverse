// engine/geometry/thomsonVsepr.js
// ============================================================================
// Subsystem D1 — Thomson problem on the sphere + VSEPR mapping.
//
// Electron domains are point charges on a sphere; their equilibrium is the
// minimum of the Coulomb repulsion. The solver finds that arrangement, assigns
// bonding domains and lone pairs, then emits 3D coordinates and bond angles.
// ============================================================================

import { ELEMENTS_TENSOR } from '../../../data/elements_tensor.js';
import { buildMolecularGraph, idealAngle, vseprShape } from './molecularGraph.js';

export function thomsonPoints(n, restarts = 28) {
  if (n <= 0) return [];
  if (n === 1) return [[0, 0, 1]];
  const rng = mulberry32(0x9e3779b9 + n * 7919);
  let best = null;
  let bestE = Infinity;

  // Canonical Thomson minima seed the search so symmetric solutions are never
  // missed by a saddle point.
  const seed = canonicalSeed(n);
  if (seed) {
    const pts = seed.map(p => p.slice());
    relax(pts, 400, 0.008);
    bestE = coulombEnergy(pts);
    best = pts;
  }

  for (let r = 0; r < restarts; r++) {
    const pts = fibonacciSphere(n, rng);
    if (r > 0) jitter(pts, rng, 0.25);
    relax(pts, 900, 0.012);
    const e = coulombEnergy(pts);
    if (e < bestE) { bestE = e; best = pts.map(p => p.slice()); }
  }
  return best;
}

function canonicalSeed(n) {
  const norm = (p) => { const l = Math.hypot(...p) || 1; return p.map(x => x / l); };
  if (n === 2) return [[0, 0, 1], [0, 0, -1]];
  if (n === 3) return [[1, 0, 0], [-0.5, Math.sqrt(3) / 2, 0], [-0.5, -Math.sqrt(3) / 2, 0]];
  if (n === 4) return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(norm);
  if (n === 5) return [
    [0, 0, 1], [0, 0, -1],
    ...Array.from({ length: 3 }, (_, k) => norm([Math.cos(k * 2 * Math.PI / 3), Math.sin(k * 2 * Math.PI / 3), 0])),
  ];
  if (n === 6) return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  if (n === 7) return [
    [0, 0, 1], [0, 0, -1],
    ...Array.from({ length: 5 }, (_, k) => norm([Math.cos(k * 2 * Math.PI / 5), Math.sin(k * 2 * Math.PI / 5), 0])),
  ];
  return null;
}

function fibonacciSphere(n, rng) {
  const pts = [];
  const off = rng() * 2;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = (i + off) * Math.PI * (3 - Math.sqrt(5));
    pts.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
  }
  return pts;
}

function jitter(pts, rng, amt) {
  for (const p of pts) {
    p[0] += (rng() - 0.5) * amt;
    p[1] += (rng() - 0.5) * amt;
    p[2] += (rng() - 0.5) * amt;
    normalize(p);
  }
}

function normalize(p) {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  p[0] /= l; p[1] /= l; p[2] /= l;
}

function coulombEnergy(pts) {
  let e = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      const dz = pts[i][2] - pts[j][2];
      e += 1 / Math.max(1e-6, Math.hypot(dx, dy, dz));
    }
  }
  return e;
}

function relax(pts, steps, lr) {
  const n = pts.length;
  const g = Array.from({ length: n }, () => [0, 0, 0]);
  for (let it = 0; it < steps; it++) {
    for (const v of g) { v[0] = 0; v[1] = 0; v[2] = 0; }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + 1e-9;
        const inv = 1 / (r2 * Math.sqrt(r2));
        g[i][0] += dx * inv; g[i][1] += dy * inv; g[i][2] += dz * inv;
        g[j][0] -= dx * inv; g[j][1] -= dy * inv; g[j][2] -= dz * inv;
      }
    }
    for (let i = 0; i < n; i++) {
      pts[i][0] -= lr * g[i][0];
      pts[i][1] -= lr * g[i][1];
      pts[i][2] -= lr * g[i][2];
      normalize(pts[i]);
    }
  }
}

function angleBetween(a, b) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
}

function chooseBondPositions(domains, nBonds) {
  if (nBonds >= domains) return Array.from({ length: domains }, (_, i) => i);
  let best = null, bestScore = Infinity;
  const combo = [];
  const rec = (start, left) => {
    if (left === 0) {
      const lone = [];
      for (let i = 0; i < domains; i++) if (!combo.includes(i)) lone.push(i);
      // Coulomb-like repulsion on the unit sphere: 1/sin(θ/2). Lone pairs are
      // given more angular room than bonding pairs, which reproduces VSEPR.
      let score = 0;
      for (let i = 0; i < combo.length; i++) {
        for (let j = i + 1; j < combo.length; j++) {
          score += pairRepulsion(POS[combo[i]], POS[combo[j]]);
        }
        for (const l of lone) {
          score += 1.6 * pairRepulsion(POS[combo[i]], POS[l]);
        }
      }
      for (let i = 0; i < lone.length; i++) {
        for (let j = i + 1; j < lone.length; j++) {
          score += 2.4 * pairRepulsion(POS[lone[i]], POS[lone[j]]);
        }
      }
      if (score < bestScore) { bestScore = score; best = combo.slice(); }
      return;
    }
    for (let i = start; i <= domains - left; i++) {
      combo.push(i); rec(i + 1, left - 1); combo.pop();
    }
  };
  // POS is filled by solveGeometry before this call.
  rec(0, nBonds);
  return best;
}

function pairRepulsion(a, b) {
  const angle = angleBetween(a, b) * Math.PI / 180;
  return 1 / Math.max(0.08, Math.sin(angle / 2));
}

let POS = [];

export function solveGeometry(sp) {
  const graph = buildMolecularGraph(sp);
  const nBonds = graph.bonds.filter(b => b.a === graph.center || b.b === graph.center).length;
  const domains = Math.max(1, graph.domains);
  POS = thomsonPoints(domains);
  const bondPositions = chooseBondPositions(domains, nBonds);
  const lonePositions = [];
  for (let i = 0; i < domains; i++) if (!bondPositions.includes(i)) lonePositions.push(i);

  // Assign bond vectors to actual bonds.
  const center = graph.center;
  const ligandBonds = graph.bonds.filter(b => b.a === center || b.b === center);
  const vecs = ligandBonds.map((bd, k) => {
    const v = POS[bondPositions[k] % POS.length].slice();
    return { bond: bd, v };
  });

  // Compress bond angles to account for lone-pair repulsion. The target angle
  // comes from the VSEPR table; a short binary search finds the compression
  // factor that reproduces it on the Thomson sphere.
  const target = targetAngle(domains, graph.lonePairs);
  const compression = fitCompression(vecs.map(x => x.v), target);
  compressVectors(vecs.map(x => x.v), compression);

  const centerZ = graph.atoms[center];
  const centerT = ELEMENTS_TENSOR[centerZ - 1];
  const atomsOut = [{
    Z: centerZ,
    symbol: centerT.symbol,
    color: centerT.color,
    x: 0, y: 0, z: 0,
    radius: (centerT.radii?.covalentSingle || 0.8) * 0.55,
    isCenter: true,
  }];
  const bondsOut = [];
  const angles = [];

  vecs.forEach(({ bond, v }, k) => {
    const otherIdx = bond.a === center ? bond.b : bond.a;
    const z = graph.atoms[otherIdx];
    const t = ELEMENTS_TENSOR[z - 1];
    const rc = centerT.radii?.covalentSingle || 0.8;
    const rl = t.radii?.covalentSingle || 0.7;
    const orderFactor = bond.order === 3 ? 0.78 : bond.order === 2 ? 0.87 : 1;
    const len = (rc + rl) * orderFactor;
    atomsOut.push({
      Z: z,
      symbol: t.symbol,
      color: t.color,
      x: v[0] * len, y: v[1] * len, z: v[2] * len,
      radius: rl * 0.55,
      bondOrder: bond.order,
    });
    bondsOut.push([0, k + 1, bond.order]);
  });

  for (let i = 0; i < vecs.length; i++) {
    for (let j = i + 1; j < vecs.length; j++) {
      angles.push({
        atoms: [atomsOut[i + 1].symbol, atomsOut[j + 1].symbol],
        angle: angleBetween(vecs[i].v, vecs[j].v),
      });
    }
  }

  // Rotate so the first bond points along +z for a stable camera framing.
  if (vecs.length) rotateToZ(atomsOut, vecs[0].v);

  // A two-atom molecule has a single bond axis, so it is linear regardless of
  // how many lone pairs sit on the central atom (N₂, O₂, Cl₂, HF…).
  const shape = graph.atoms.length === 2 ? 'Linear' : vseprShape(domains, graph.lonePairs);
  const avgAngle = angles.length ? angles.reduce((a, x) => a + x.angle, 0) / angles.length : null;
  return {
    mode: 'molecule',
    formula: sp.formula,
    name: sp.name,
    shape,
    domains,
    lonePairs: graph.lonePairs,
    centralAtom: centerT.symbol,
    atoms: atomsOut,
    bonds: bondsOut,
    angles,
    averageAngle: avgAngle,
    idealAngle: idealAngle(domains),
    hybridization: hybridization(domains, graph.lonePairs),
    notes: `Thomson minimum for ${domains} domains; ${graph.lonePairs} lone pair${graph.lonePairs === 1 ? '' : 's'} on ${centerT.symbol}.`,
  };
}

function compressVectors(vecs, f) {
  if (vecs.length < 2) return;
  const u = [0, 0, 0];
  for (const v of vecs) { u[0] += v[0]; u[1] += v[1]; u[2] += v[2]; }
  normalize(u);
  for (const v of vecs) {
    const dot = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
    v[0] = u[0] * dot + f * (v[0] - u[0] * dot);
    v[1] = u[1] * dot + f * (v[1] - u[1] * dot);
    v[2] = u[2] * dot + f * (v[2] - u[2] * dot);
    normalize(v);
  }
}

function targetAngle(domains, lonePairs) {
  const table = {
    '2/0': 180, '2/1': 180,
    '3/0': 120, '3/1': 117, '3/2': 180,
    '4/0': 109.47, '4/1': 107.0, '4/2': 104.5,
    '5/0': 108, '5/1': 100, '5/2': 90, '5/3': 180,
    '6/0': 90, '6/1': 85, '6/2': 90,
    '7/0': 72,
  };
  return table[`${domains}/${lonePairs}`] ?? idealAngle(domains);
}

function meanPairAngle(vecs) {
  let sum = 0, count = 0;
  for (let i = 0; i < vecs.length; i++) {
    for (let j = i + 1; j < vecs.length; j++) {
      sum += angleBetween(vecs[i], vecs[j]);
      count++;
    }
  }
  return count ? sum / count : 0;
}

function fitCompression(vecs, target) {
  if (vecs.length < 2) return 1;
  let lo = 0.3, hi = 1.0;
  for (let it = 0; it < 28; it++) {
    const mid = (lo + hi) / 2;
    const copy = vecs.map(v => v.slice());
    compressVectors(copy, mid);
    if (meanPairAngle(copy) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function rotateToZ(atoms, v) {
  // Build rotation that maps v to +z, apply to all ligand atoms.
  const z = [0, 0, 1];
  const axis = [
    v[1] * z[2] - v[2] * z[1],
    v[2] * z[0] - v[0] * z[2],
    v[0] * z[1] - v[1] * z[0],
  ];
  const s = Math.hypot(...axis);
  const c = v[0] * z[0] + v[1] * z[1] + v[2] * z[2];
  if (s < 1e-9) return;
  const ax = axis.map(x => x / s);
  const angle = Math.atan2(s, c);
  const cs = Math.cos(angle), sn = Math.sin(angle);
  const rot = (p) => {
    const dot = ax[0] * p[0] + ax[1] * p[1] + ax[2] * p[2];
    const cross = [
      ax[1] * p[2] - ax[2] * p[1],
      ax[2] * p[0] - ax[0] * p[2],
      ax[0] * p[1] - ax[1] * p[0],
    ];
    return [
      p[0] * cs + cross[0] * sn + ax[0] * dot * (1 - cs),
      p[1] * cs + cross[1] * sn + ax[1] * dot * (1 - cs),
      p[2] * cs + cross[2] * sn + ax[2] * dot * (1 - cs),
    ];
  };
  for (const a of atoms) {
    const [x, y, zz] = rot([a.x, a.y, a.z]);
    a.x = x; a.y = y; a.z = zz;
  }
}

function hybridization(domains, lonePairs) {
  const steric = domains;
  if (steric === 2) return 'sp';
  if (steric === 3) return 'sp²';
  if (steric === 4) return 'sp³';
  if (steric === 5) return 'sp³d';
  if (steric === 6) return 'sp³d²';
  if (steric === 7) return 'sp³d³';
  return '—';
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
