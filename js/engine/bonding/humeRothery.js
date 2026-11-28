// engine/bonding/humeRothery.js
// ============================================================================
// Hume-Rothery rules + Miedema-style regular-solution model for alloys.
// Determines whether two metals form a substitutional solid solution, the
// likely crystal structure from the average VEC, and the mixing enthalpy.
// ============================================================================

import { isMetal } from '../physics/electronicConfig.js';

const R = 8.314462618;

function metallicRadius(t) {
  return t.radii?.metallic || t.radii?.covalentSingle || 1.4;
}

/** Pairwise Hume-Rothery assessment. */
export function solidSolubility(A, B) {
  if (!isMetal(A) || !isMetal(B)) {
    return { soluble: false, limit: 0, reasons: ['Both components must be metallic.'] };
  }
  const rA = metallicRadius(A), rB = metallicRadius(B);
  const sizeMismatch = Math.abs(rA - rB) / ((rA + rB) / 2);
  const dChi = Math.abs((A.chiAllen || 0) - (B.chiAllen || 0));
  const sameStructure = A.nativeLattice && B.nativeLattice && A.nativeLattice === B.nativeLattice;
  const reasons = [];
  let limit = 100;
  if (sizeMismatch > 0.15) {
    limit = Math.max(0, 100 * (1 - (sizeMismatch - 0.15) * 6));
    reasons.push(`Size mismatch ${(sizeMismatch * 100).toFixed(1)}% > 15% — limited substitutional solubility.`);
  }
  if (dChi > 0.4) {
    limit = Math.min(limit, Math.max(0, 100 * (1 - (dChi - 0.4) * 1.5)));
    reasons.push(`Electronegativity difference Δχ=${dChi.toFixed(2)} favours intermetallic phases.`);
  }
  if (!sameStructure) reasons.push('Different ambient lattices — polymorphic solubility.');
  if (!reasons.length) reasons.push('Favourable size, electronegativity and structure: continuous solid solution likely.');
  return {
    soluble: limit >= 10,
    limit,
    sizeMismatch,
    deltaChi: dChi,
    sameStructure,
    reasons,
  };
}

/** Average valence-electron concentration of an alloy. */
export function averageVEC(tensors, fractions = null) {
  const ws = fractions || tensors.map(() => 1 / tensors.length);
  let vec = 0, wsum = 0;
  tensors.forEach((t, i) => {
    const v = t.vec || t.group || 0;
    vec += v * ws[i];
    wsum += ws[i];
  });
  return wsum ? vec / wsum : 0;
}

/** Hume-Rothery structure map for transition-metal alloys. */
export function predictAlloyStructure(tensors, fractions = null) {
  const vec = averageVEC(tensors, fractions);
  let lattice;
  if (vec < 7.05) lattice = 'BCC';
  else if (vec <= 8.0) lattice = 'FCC';
  else lattice = 'HCP';

  // Ordered B2 (CsCl-type) is common for near-equiatomic binaries with a
  // noticeable electronegativity difference — NiTi and TiFe are canonical.
  const binary = tensors.length === 2;
  const dChi = binary
    ? Math.abs((tensors[0].chiAllen || 0) - (tensors[1].chiAllen || 0))
    : 0;
  if (binary && vec >= 6.0 && vec <= 7.4 && dChi >= 0.25) lattice = 'B2';

  // Large atoms with low VEC favour BCC; late transition metals FCC/HCP.
  return {
    lattice,
    vec,
    rationale: `Average VEC = ${vec.toFixed(2)} → ${lattice} (Hume-Rothery electron-concentration rule).`,
  };
}

/** Miedema-style mixing enthalpy (kJ/mol of atoms). */
export function mixingEnthalpy(A, B, xA = 0.5) {
  const xB = 1 - xA;
  const dChi = Math.abs((A.chiAllen || 0) - (B.chiAllen || 0));
  const rA = metallicRadius(A), rB = metallicRadius(B);
  const dr = Math.abs(rA - rB) / ((rA + rB) / 2);
  const omega = 96.485 * dChi * dChi + 120 * dr * dr;
  return xA * xB * omega * 4;
}

/** Full alloy report for a set of metals. */
export function alloyReport(tensors, fractions = null) {
  const structure = predictAlloyStructure(tensors, fractions);
  const ws = fractions || tensors.map(() => 1 / tensors.length);
  let dH = 0;
  let worst = { mismatch: 0, dChi: 0, pair: null };
  for (let i = 0; i < tensors.length; i++) {
    for (let j = i + 1; j < tensors.length; j++) {
      const sol = solidSolubility(tensors[i], tensors[j]);
      dH += ws[i] * ws[j] * mixingEnthalpy(tensors[i], tensors[j], 0.5) * 2;
      if (sol.sizeMismatch > worst.mismatch) worst = { mismatch: sol.sizeMismatch, dChi: sol.deltaChi, pair: [tensors[i].symbol, tensors[j].symbol] };
    }
  }
  let dS = 0;
  for (const w of ws) if (w > 0) dS -= R * w * Math.log(w);
  return {
    ...structure,
    deltaHmix: dH,
    deltaSconfig: dS,
    deltaGmix: dH - 298.15 * dS / 1000,
    worstSizeMismatch: worst.mismatch,
    worstDeltaChi: worst.dChi,
    worstPair: worst.pair,
    singlePhase: worst.mismatch < 0.18,
  };
}
