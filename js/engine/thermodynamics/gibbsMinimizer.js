// engine/thermodynamics/gibbsMinimizer.js
// ============================================================================
// Subsystem B — constrained Gibbs minimisation.
//
// Minimise Σ nᵢ·ΔG_f,i subject to element conservation A·n ≤ b, n ≥ 0, where
// the slack is unreacted elemental standard state. A small dense simplex with
// Bland's rule solves the LP; the result is converted to rational
// stoichiometry for the balanced equation.
// ============================================================================

import { Rational } from '../rational.js';

const EPS = 1e-9;

/**
 * @param {Record<number, number>} reactantAtoms atoms per element
 * @param {Array} products candidate species (non-element) with `.thermo.deltaG`
 * @param {number} T
 * @returns {{amounts:number[], leftover:Record<number,number>, gibbs:number}}
 */
export function minimizeProducts(reactantAtoms, products, T = 298.15) {
  const vars = products.filter(p => p.kind !== 'element');
  const zs = Object.keys(reactantAtoms).map(Number).sort((a, b) => a - b);
  if (!vars.length || !zs.length) {
    return { amounts: [], leftover: { ...reactantAtoms }, gibbs: 0, vars: [], zs };
  }

  const m = zs.length;
  const n = vars.length;
  const A = Array.from({ length: m }, () => new Array(n).fill(0));
  vars.forEach((sp, j) => {
    zs.forEach((z, i) => { A[i][j] = sp.atomCounts[z] || 0; });
  });
  const b = zs.map(z => reactantAtoms[z] || 0);
  const c = vars.map(sp => sp.thermo?.deltaG ?? 0);

  // Standard-form tableau: [A | I | b]; objective row [c | 0 | 0] (maximise -c·x).
  const cols = n + m;
  const tableau = Array.from({ length: m + 1 }, () => new Array(cols + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) tableau[i][j] = A[i][j];
    tableau[i][n + i] = 1;
    tableau[i][cols] = b[i];
  }
  for (let j = 0; j < n; j++) tableau[m][j] = c[j];

  const basis = Array.from({ length: m }, (_, i) => n + i);
  let iter = 0;
  while (iter++ < 5000) {
    // Bland's rule: smallest index with a negative reduced cost.
    let enter = -1;
    for (let j = 0; j < cols; j++) {
      if (tableau[m][j] < -EPS) { enter = j; break; }
    }
    if (enter === -1) break;

    let leave = -1;
    let bestRatio = Infinity;
    for (let i = 0; i < m; i++) {
      const a = tableau[i][enter];
      if (a > EPS) {
        const ratio = tableau[i][cols] / a;
        if (ratio < bestRatio - EPS ||
            (Math.abs(ratio - bestRatio) <= EPS && (leave === -1 || basis[i] < basis[leave]))) {
          bestRatio = ratio;
          leave = i;
        }
      }
    }
    if (leave === -1) break; // unbounded — cannot happen with finite b.

    const pivot = tableau[leave][enter];
    for (let j = 0; j <= cols; j++) tableau[leave][j] /= pivot;
    for (let i = 0; i <= m; i++) {
      if (i === leave) continue;
      const f = tableau[i][enter];
      if (Math.abs(f) < EPS) continue;
      for (let j = 0; j <= cols; j++) tableau[i][j] -= f * tableau[leave][j];
    }
    basis[leave] = enter;
  }

  const amounts = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) amounts[basis[i]] = Math.max(0, tableau[i][cols]);
  }

  const leftover = {};
  let gibbs = 0;
  zs.forEach((z, i) => {
    let used = 0;
    vars.forEach((sp, j) => { used += (sp.atomCounts[z] || 0) * amounts[j]; });
    leftover[z] = Math.max(0, (reactantAtoms[z] || 0) - used);
  });
  vars.forEach((sp, j) => { gibbs += amounts[j] * (sp.thermo?.deltaG ?? 0); });

  return { amounts, leftover, gibbs, vars, zs };
}

/** Convert a float to a small rational via continued fractions. */
export function toRational(x, maxDen = 10000) {
  if (!Number.isFinite(x)) return new Rational(0n);
  if (Math.abs(x) < 1e-8) return new Rational(0n);
  const sign = x < 0 ? -1n : 1n;
  let v = Math.abs(x);
  let h0 = 0n, h1 = 1n, k0 = 1n, k1 = 0n;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(v);
    const h2 = BigInt(a) * h1 + h0;
    const k2 = BigInt(a) * k1 + k0;
    if (k2 > BigInt(maxDen)) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    const frac = v - a;
    if (frac < 1e-9) break;
    v = 1 / frac;
  }
  return new Rational(sign * h1, k1);
}

/** Scale a vector of rationals to the smallest all-integer coefficients. */
export function integerize(amounts) {
  const rats = amounts.map(a => toRational(a));
  let lcm = 1n;
  for (const r of rats) {
    lcm = (lcm / gcdBig(lcm, r.den)) * r.den;
  }
  let ints = rats.map(r => r.num * (lcm / r.den));
  const g = ints.reduce((acc, v) => gcdBig(acc, v < 0n ? -v : v), 0n) || 1n;
  ints = ints.map(v => v / g);
  return ints;
}

function gcdBig(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) { const t = x % y; x = y; y = t; }
  return x || 1n;
}
