// engine/physics/quantumNuance.js
// ============================================================================
// Subsystem E — continuous quantum/relativistic perturbation fields.
//
// Instead of `if (element === 'Au')` special cases, this module computes
// continuous physical fields from (Z, n, ℓ, shells) that feed thermodynamics,
// bonding classification and the PBR renderer:
//   • Dirac relativistic contraction γ(Z), R(Z)
//   • Inert-pair promotion penalty (Tl(I), Pb(II), Bi(III))
//   • Ionic potential Φ and polarizing power P_pol (diagonal relationships)
//   • Relativistic optical absorption edge (Au yellow, Hg liquidity, etc.)
// ============================================================================

import { ionizationEnergy, ionicRadius, isMetal } from './electronicConfig.js';

export const FINE_STRUCTURE = 1 / 137.035999084;
export const R = 8.314462618; // J/(mol·K)

/** Dirac relativistic factor γ(Z) = 1 / sqrt(1 − (Zα)²). */
export function diracGamma(Z) {
  const za = Math.min(0.95, Z * FINE_STRUCTURE);
  return 1 / Math.sqrt(1 - za * za);
}

/** Relativistic contraction fraction R(Z) = 1 − 1/γ. */
export function relativisticContraction(Z) {
  return 1 - 1 / diracGamma(Z);
}

/** Orbital energy shift (kJ/mol) for the ns orbital of a heavy atom. */
export function relativisticOrbitalShift(tensor) {
  const r = relativisticContraction(tensor.Z);
  const i1 = ionizationEnergy(tensor, 1);
  return { s: -0.18 * r * i1, d: +0.12 * r * i1 };
}

/**
 * Valence promotion energy penalty for accessing the maximum group oxidation
 * state in heavy p-block elements (the inert-pair effect). Returns kJ/mol;
 * positive means the higher oxidation state is penalized.
 */
export function inertPairPenalty(tensor, q, ligand = null, T = 298.15) {
  if (tensor.block !== 'p' || tensor.period < 5) return 0;
  const maxQ = tensor.group - 10; // p-block: group 13→3 ... group 17→7
  if (q < maxQ) return 0;
  const r = relativisticContraction(tensor.Z);
  const promo = 120 + 0.35 * r * ionizationEnergy(tensor, 2);
  let dAvg = 200;
  if (ligand) {
    const dAA = tensor.homonuclearBondEnergy || 200;
    const dBB = ligand.homonuclearBondEnergy || 200;
    dAvg = (dAA + dBB) / 2 + 96.485 * (tensor.chiAllen - ligand.chiAllen) ** 2;
  }
  return promo - 2 * dAvg;
}

/** Ionic potential Φ = q / r_ion (Å⁻¹) — charge density. */
export function ionicPotential(tensor, q) {
  const r = ionicRadius(tensor, q);
  return r > 0 ? q / r : 0;
}

/** Polarizing power P_pol = q / r² (Å⁻²) — Fajans' polarization. */
export function polarizingPower(tensor, q) {
  const r = ionicRadius(tensor, q);
  return r > 0 ? q / (r * r) : 0;
}

/** Effective electronegativity (Allen preferred, Pauling fallback). */
export function effectiveEN(tensor) {
  if (tensor.chiAllen > 0.05) return tensor.chiAllen;
  if (tensor.chiPauling != null) return tensor.chiPauling;
  return 0;
}

/**
 * Relativistic optical absorption edge (eV) — the interband d→s transition.
 * Feeds the PBR optical material engine (gold's yellow, copper's red, silver).
 */
export function opticalAbsorptionEdge(tensor) {
  const r = relativisticContraction(tensor.Z);
  const edge = 3.7 - 7.0 * r;
  return Math.max(1.4, Math.min(4.2, edge));
}

/** Metallic luster / plasma color hint (hex) derived from the optical edge. */
export function opticalColor(tensor) {
  if (!isMetal(tensor)) return tensor.color;
  const edge = opticalAbsorptionEdge(tensor);
  // Map absorption edge to a transmitted hue: high edge = silver, low = warm.
  const hue = Math.max(18, Math.min(215, (edge - 1.8) / (3.8 - 1.8) * 197 + 18));
  return hslToHex(hue, 65, 62);
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Saturation vapour pressure proxy (atm) — used for phase telemetry. */
export function phaseAt(tensor, T) {
  const mp = tensor.meltingPointK;
  if (mp == null) return tensor.stpPhase;
  if (T < mp) return 'solid';
  return tensor.stpPhase === 'gas' ? 'gas' : 'liquid';
}
