// engine/physics/electronicConfig.js
// ============================================================================
// Subsystem A/E — procedural ground-state electronic structure, Slater
// effective nuclear charge, and derived valence properties.
//
// No electron configuration is hardcoded as a "reaction rule": configurations
// are generated from the Madelung (n + ℓ) Aufbau order, then a compact anomaly
// table applies the known ground-state exceptions (Cr, Cu, Mo, Ag, Au, the
// lanthanide/actinide anomalies, etc.).
// ============================================================================

const SUBSHELL_CAPACITY = { s: 2, p: 6, d: 10, f: 14 };

// Madelung order (n + ℓ, then n)
const AUFBAU = [
  [1, 's'], [2, 's'], [2, 'p'], [3, 's'], [3, 'p'], [4, 's'], [3, 'd'],
  [4, 'p'], [5, 's'], [4, 'd'], [5, 'p'], [6, 's'], [4, 'f'], [5, 'd'],
  [6, 'p'], [7, 's'], [5, 'f'], [6, 'd'], [7, 'p'],
];

// Ground-state anomalies: move `moves` electrons from `from` to `to`.
const ANOMALIES = {
  24: { from: '4s', to: '3d', moves: 1 },  // Cr  [Ar] 3d5 4s1
  29: { from: '4s', to: '3d', moves: 1 },  // Cu  [Ar] 3d10 4s1
  41: { from: '5s', to: '4d', moves: 1 },  // Nb
  42: { from: '5s', to: '4d', moves: 1 },  // Mo
  44: { from: '5s', to: '4d', moves: 1 },  // Ru
  45: { from: '5s', to: '4d', moves: 1 },  // Rh
  46: { from: '5s', to: '4d', moves: 2 },  // Pd [Kr] 4d10
  47: { from: '5s', to: '4d', moves: 1 },  // Ag
  57: { from: '4f', to: '5d', moves: 1 },  // La [Xe] 5d1 6s2
  58: { from: '4f', to: '5d', moves: 1 },  // Ce 4f1 5d1 6s2
  64: { from: '4f', to: '5d', moves: 1 },  // Gd 4f7 5d1 6s2
  78: { from: '6s', to: '5d', moves: 1 },  // Pt
  79: { from: '6s', to: '5d', moves: 1 },  // Au
  89: { from: '5f', to: '6d', moves: 1 },  // Ac
  90: { from: '5f', to: '6d', moves: 2 },  // Th
  91: { from: '5f', to: '6d', moves: 1 },  // Pa
  92: { from: '5f', to: '6d', moves: 1 },  // U
  93: { from: '5f', to: '6d', moves: 1 },  // Np
  96: { from: '5f', to: '6d', moves: 1 },  // Cm
  103: { from: '6d', to: '7p', moves: 1 }, // Lr
};

const N_STAR = { 1: 1.0, 2: 2.0, 3: 3.0, 4: 3.7, 5: 4.0, 6: 4.2, 7: 4.4 };
const RYDBERG_KJ = 13.6057 * 96.485; // ionization energy of H, kJ/mol

/** Generate the ground-state subshell occupancy for atomic number Z. */
export function generateElectronConfiguration(Z) {
  const occ = new Map(); // "3d" -> electrons
  let remaining = Z;
  for (const [n, l] of AUFBAU) {
    if (remaining <= 0) break;
    const key = `${n}${l}`;
    const e = Math.min(SUBSHELL_CAPACITY[l], remaining);
    if (e > 0) { occ.set(key, e); remaining -= e; }
  }
  // Apply the compact anomaly bitmask.
  const anomaly = ANOMALIES[Z];
  if (anomaly) {
    for (let i = 0; i < anomaly.moves; i++) {
      const from = occ.get(anomaly.from) || 0;
      if (from > 0) {
        occ.set(anomaly.from, from - 1);
        occ.set(anomaly.to, (occ.get(anomaly.to) || 0) + 1);
      }
    }
  }
  const subshells = [];
  for (const [n, l] of AUFBAU) {
    const key = `${n}${l}`;
    const e = occ.get(key) || 0;
    if (e > 0) subshells.push({ n, l, e });
  }
  return subshells;
}

/** Aggregate subshells into per-principal-shell occupancy (K, L, M, ...). */
export function shellOccupancy(subshells) {
  const shells = [];
  for (const s of subshells) {
    shells[s.n - 1] = (shells[s.n - 1] || 0) + s.e;
  }
  return shells.map(x => x || 0);
}

export function configurationString(subshells) {
  return subshells.map(s => `${s.n}${s.l}${s.e}`).join(' ');
}

/** Slater effective nuclear charge for an electron in (n, l). */
export function slaterZeff(Z, subshells, n, l) {
  let sigma = 0;
  const isSP = l === 's' || l === 'p';
  for (const s of subshells) {
    const sameSubshell = s.n === n && s.l === l;
    if (sameSubshell) {
      sigma += Math.max(0, s.e - 1) * (n === 1 ? 0.30 : 0.35);
    } else if (isSP && s.n === n) {
      sigma += s.e * (n === 1 ? 0.30 : 0.35);
    } else if (isSP && s.n === n - 1) {
      sigma += s.e * 0.85;
    } else if (isSP && s.n < n - 1) {
      sigma += s.e * 1.0;
    } else if (!isSP) {
      // nd/nf: all electrons in subshells to the left screen fully.
      sigma += s.e * 1.0;
    }
  }
  return Math.max(0.1, Z - sigma);
}

function outermostSubshell(subshells) {
  let best = null;
  for (const s of subshells) {
    if (!best) { best = s; continue; }
    const a = s.n + (s.l === 's' ? 0 : s.l === 'p' ? 1 : s.l === 'd' ? 2 : 3);
    const b = best.n + (best.l === 's' ? 0 : best.l === 'p' ? 1 : best.l === 'd' ? 2 : 3);
    if (a > b || (a === b && s.n > best.n)) best = s;
  }
  return best;
}

/** Count valence electrons (N_v) and Hume-Rothery VEC from subshell occupancy.
 *  `period` is the periodic-table period (principal quantum number of the
 *  valence shell); using it avoids confusing 3s with the 3d shell of period 4. */
export function valenceCounts(subshells, block, period) {
  let valence = 0;
  let vec = 0;
  if (!subshells.length) return { valence: 0, vec: 0 };
  for (const s of subshells) {
    if (block === 'd') {
      // (n−1)d + ns
      if ((s.l === 'd' && s.n === period - 1) || (s.l === 's' && s.n === period)) {
        valence += s.e; vec += s.e;
      }
    } else if (block === 'f') {
      // (n−2)f + (n−1)d + ns
      if ((s.l === 'f' && s.n === period - 2) || (s.l === 'd' && s.n === period - 1) ||
          (s.l === 's' && s.n === period)) {
        valence += s.e; vec += s.e;
      }
    } else {
      if (s.n === period) { valence += s.e; vec += s.e; }
    }
  }
  if (valence === 0) {
    const last = outermostSubshell(subshells);
    valence = last ? last.e : 0;
    vec = valence;
  }
  return { valence, vec };
}

/** Estimate an ionization energy (kJ/mol) from Slater shielding, used when a
 *  tabulated value is unavailable. */
export function estimateIonizationEnergy(Z, order = 1) {
  let subshells = generateElectronConfiguration(Z);
  // Strip (order - 1) electrons from the outermost subshells first.
  for (let k = 0; k < order - 1; k++) {
    const outer = outermostSubshell(subshells);
    if (!outer) break;
    outer.e -= 1;
    subshells = subshells.filter(s => s.e > 0);
  }
  const outer = outermostSubshell(subshells);
  if (!outer) return 0;
  const zeff = slaterZeff(Z, subshells, outer.n, outer.l);
  const nStar = N_STAR[outer.n] || outer.n;
  return Math.max(120, Math.min(30000, RYDBERG_KJ * (zeff / nStar) ** 2));
}

/** Ionization energy of the m-th electron (m starts at 1). */
export function ionizationEnergy(tensor, m) {
  const tab = tensor.ionizationEnergies?.[m];
  if (m === 1 && tab && tab > 0) return tab;
  // Successive ionization of d-block metals removes 4s electrons and then
  // tightly-bound (n−1)d electrons. The tabulated second/third values in many
  // compact datasets are unreliable, so anchor on the first IE and use the
  // observed ~1.95× progression instead.
  if (tensor.block === 'd' && m >= 2) {
    const i1 = tensor.ionizationEnergies?.[1] || estimateIonizationEnergy(tensor.Z, 1);
    return i1 * Math.pow(2.0, m - 1);
  }
  if (tab && tab > 0) return tab;
  return estimateIonizationEnergy(tensor.Z, m);
}

/** Fallback ionic radii (Å) for common coordination environments. */
const IONIC_FALLBACK = {
  3: { 1: 0.76 }, 4: { 2: 0.45 }, 5: { 3: 0.27 }, 6: { '-4': 2.60 },
  7: { '-3': 1.46 }, 8: { '-2': 1.40 }, 9: { '-1': 1.33 },
  11: { 1: 1.02 }, 12: { 2: 0.72 }, 13: { 3: 0.535 }, 14: { 4: 0.40 },
  15: { '-3': 2.12 }, 16: { '-2': 1.84 }, 17: { '-1': 1.81 },
  19: { 1: 1.38 }, 20: { 2: 1.00 }, 22: { 3: 0.67, 4: 0.605 },
  24: { 3: 0.615 }, 25: { 2: 0.83, 3: 0.65 }, 26: { 2: 0.78, 3: 0.65 },
  27: { 2: 0.745, 3: 0.545 }, 28: { 2: 0.69 }, 29: { 1: 0.77, 2: 0.73 },
  30: { 2: 0.74 }, 31: { 3: 0.62 }, 32: { 4: 0.53 }, 33: { 3: 0.58 },
  34: { '-2': 1.98 }, 35: { '-1': 1.96 }, 37: { 1: 1.52 }, 38: { 2: 1.18 },
  50: { 2: 1.18, 4: 0.69 }, 51: { 3: 0.76 }, 52: { '-2': 2.21 },
  53: { '-1': 2.20 }, 55: { 1: 1.67 }, 56: { 2: 1.35 }, 57: { 3: 1.032 },
  58: { 3: 1.01, 4: 0.87 }, 63: { 2: 1.17, 3: 0.947 }, 64: { 3: 0.938 },
  65: { 3: 0.923 }, 66: { 3: 0.912 }, 67: { 3: 0.901 }, 68: { 3: 0.890 },
  69: { 3: 0.880 }, 70: { 3: 0.868 }, 71: { 3: 0.861 }, 72: { 4: 0.71 },
  73: { 5: 0.64 }, 74: { 4: 0.66, 6: 0.60 }, 76: { 4: 0.63 },
  77: { 3: 0.68, 4: 0.625 }, 78: { 2: 0.80, 4: 0.625 },
  79: { 1: 1.37, 3: 0.85 }, 80: { 1: 1.19, 2: 1.02 },
  81: { 1: 1.50, 3: 0.885 }, 82: { 2: 1.19, 4: 0.775 },
  83: { 3: 1.03 }, 84: { 2: 0.94 }, 87: { 1: 1.80 }, 88: { 2: 1.48 },
  89: { 3: 1.12 }, 90: { 4: 1.05 }, 92: { 4: 0.89, 6: 0.73 },
};

/** Fallback ionic radius (Å) for oxidation state q when Shannon data is absent. */
export function ionicRadius(tensor, q) {
  const tab = tensor.radii?.ionic?.[q];
  if (tab != null) return tab;
  const fb = IONIC_FALLBACK[tensor.Z]?.[q];
  if (fb != null) return fb;
  const cov = tensor.radii?.covalentSingle || 0.8;
  if (q > 0) {
    const scale = 1 / (1 + 0.28 * (q - 1) + 0.06 * Math.max(0, q - 3));
    return Math.max(0.2, cov * scale);
  }
  if (q < 0) {
    return cov * 1.05 + 0.22 + 0.28 * (Math.abs(q) - 1);
  }
  return cov;
}

export function isMetal(tensor) {
  const c = tensor.category || '';
  return c === 'alkali-metal' || c === 'alkaline-earth' || c === 'transition-metal' ||
    c === 'post-transition-metal' || c === 'lanthanide' || c === 'actinide';
}

export function isMetalloid(tensor) {
  return tensor.category === 'metalloid';
}

export function isNobleGas(tensor) {
  return tensor.category === 'noble-gas';
}

/** Enrich a raw tensor with derived electronic structure (Subsystem A → E). */
export function deriveTensor(tensor) {
  const subshells = generateElectronConfiguration(tensor.Z);
  const shells = shellOccupancy(subshells);
  const { valence, vec } = valenceCounts(subshells, tensor.block, tensor.period);
  const outer = outermostSubshell(subshells);
  const zEff = outer ? slaterZeff(tensor.Z, subshells, outer.n, outer.l) : tensor.Z;
  return {
    ...tensor,
    subshells,
    derivedShells: shells,
    valenceElectrons: valence,
    vec,
    zEff,
    nStar: outer ? N_STAR[outer.n] || outer.n : 1,
    configuration: configurationString(subshells),
  };
}
