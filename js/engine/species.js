// engine/species.js
// ============================================================================
// Species model. A species is a composition plus the physical metadata the
// thermodynamic and geometric solvers need. Nothing here is a reaction rule:
// formulas are built from oxidation states, valences and ionic radii.
// ============================================================================

import { TENSOR_BY_SYMBOL, ELEMENTS_TENSOR } from '../../data/elements_tensor.js';
import { formatFormula, molarMass } from './formula.js';
import { ionicRadius, isMetal, isNobleGas } from './physics/electronicConfig.js';

export const DIATOMIC = new Set([1, 7, 8, 9, 17, 35, 53]);
export const NOBLE = new Set([2, 10, 18, 36, 54, 86, 118]);

// Thermochemical radii (Å) for common polyatomic ions (Y. Marcus scale).
export const POLYATOMIC_RADII = {
  'OH': 1.37, 'NH4': 1.48, 'CN': 1.82, 'CO3': 1.78, 'NO3': 1.79,
  'SO4': 2.30, 'PO4': 2.38, 'ClO3': 2.00, 'ClO4': 2.41, 'MnO4': 2.40,
  'CrO4': 2.40, 'Cr2O7': 2.95, 'HCO3': 2.07, 'HSO4': 2.30,
};

export function phaseAt(tensor, T) {
  const mp = tensor.meltingPointK;
  const bp = tensor.boilingPointK;
  if (mp == null) return tensor.stpPhase || 'solid';
  if (T < mp) return 'solid';
  if (bp != null && T >= bp) return 'gas';
  if (tensor.stpPhase === 'gas' && bp == null) return 'gas';
  return 'liquid';
}

export function speciesColor(tensor) {
  return tensor?.color || '#c7d2fe';
}

/** Standard-state elemental species for one element at temperature T. */
export function elementSpecies(tensor, T = 298.15) {
  const Z = tensor.Z;
  let n = 1;
  let formula = tensor.symbol;
  if (DIATOMIC.has(Z)) { n = 2; formula = `${tensor.symbol}2`; }
  else if (Z === 15) { n = 4; formula = 'P4'; }
  else if (Z === 16) { n = 8; formula = 'S8'; }
  const phase = phaseAt(tensor, T);
  return {
    id: `el:${Z}`,
    formula,
    name: tensor.name,
    atomCounts: { [Z]: n },
    charge: 0,
    kind: 'element',
    phase,
    lattice: tensor.nativeLattice,
    tensors: [tensor],
    atoms: Array.from({ length: n }, () => Z),
    bonds: [],
    color: speciesColor(tensor),
    meltingPointK: tensor.meltingPointK,
    boilingPointK: tensor.boilingPointK,
  };
}

/** Build a neutral binary compound A_x B_y from formal charges qA, qB. */
export function binarySpecies(A, B, qA, qB, T = 298.15, kindHint = null) {
  const g = gcd(Math.abs(qA), Math.abs(qB));
  const x = Math.abs(qB) / g;
  const y = Math.abs(qA) / g;
  const atomCounts = { [A.Z]: x, [B.Z]: y };
  const formula = formatFormula(atomCounts);
  const en = (t) => (t.chiPauling ?? t.chiAllen ?? 0);
  const dEN = Math.abs(en(A) - en(B));
  const noble = isNobleGas(A) || isNobleGas(B);
  const metalA = isMetal(A), metalB = isMetal(B);
  const hydrideWithMetal = (A.Z === 1 || B.Z === 1) && (metalA || metalB);
  // Ionic bonding requires a metal–nonmetal pair (or a saline hydride).
  // Two nonmetals stay molecular even when Δχ is large — HF and HCl are
  // polar covalent gases, not ionic lattices.
  let kind = kindHint || (noble
    ? 'covalent'
    : hydrideWithMetal
      ? 'ionic'
      : (metalA !== metalB && dEN > 1.5)
        ? 'ionic'
        : 'covalent');
  if (!kindHint && kind === 'covalent' && x === 1 && y === 1) {
    const atom = (t) => t.atomizationEnthalpy || 0.22 * (t.boilingPointK || 0);
    if (atom(A) > 250 && atom(B) > 250 && dEN < 1.6 &&
        !(DIATOMIC.has(A.Z) && DIATOMIC.has(B.Z))) {
      kind = 'network';
    }
  }
  const phase = (kind === 'ionic' || kind === 'network')
    ? 'solid'
    : estimateMolecularPhase([A, B], x + y, T);
  return {
    id: `${A.symbol}${x}${B.symbol}${y}`,
    formula,
    name: `${A.name} ${B.name}`,
    atomCounts,
    charge: 0,
    kind,
    phase,
    lattice: kind === 'ionic' ? guessIonicLattice(A, B, qA, qB) : null,
    ions: kind === 'ionic'
      ? [{ Z: A.Z, q: qA, n: x }, { Z: B.Z, q: qB, n: y }]
      : [],
    tensors: [A, B],
    atoms: [...Array(x).fill(A.Z), ...Array(y).fill(B.Z)],
    bonds: [],
    chargePair: [qA, qB],
    color: speciesColor(A),
  };
}

/** Build an ionic species from a cation tensor and a polyatomic anion. */
export function polyatomicSpecies(cation, qCat, anion, T = 298.15) {
  const qAn = anion.charge;
  const g = gcd(Math.abs(qCat), Math.abs(qAn));
  const nCat = Math.abs(qAn) / g;
  const nAn = Math.abs(qCat) / g;
  const atomCounts = {};
  for (const [z, n] of Object.entries(anion.atomCounts)) {
    atomCounts[z] = (atomCounts[z] || 0) + n * nAn;
  }
  atomCounts[cation.Z] = (atomCounts[cation.Z] || 0) + nCat;
  const isAcid = cation.Z === 1;
  const formula = isAcid
    ? acidFormula(atomCounts)
    : `${cation.symbol}${nCat === 1 ? '' : nCat}${nAn === 1 ? anion.formula : `(${anion.formula})${nAn}`}`;
  return {
    id: `${cation.symbol}${nCat}${anion.formula}${nAn}`,
    formula,
    name: `${cation.name} ${anion.name}`,
    atomCounts,
    charge: 0,
    kind: isAcid ? 'covalent' : 'ionic-polyatomic',
    phase: isAcid ? 'liquid' : 'solid',
    lattice: isAcid ? null : 'ionic',
    ions: [{ Z: cation.Z, q: qCat, n: nCat }, { poly: anion.formula, q: qAn, n: nAn }],
    tensors: [cation],
    atoms: [],
    bonds: [],
    polyatomic: anion,
    chargePair: [qCat, qAn],
    color: speciesColor(cation),
  };
}

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a || 1; }

// Oxyacid convention: hydrogen first, central atom next, oxygen last
// (H₂SO₄, HNO₃, H₃PO₄, HClO₄).
function acidFormula(atomCounts) {
  const h = atomCounts[1] || 0;
  const o = atomCounts[8] || 0;
  const rest = Object.entries(atomCounts)
    .map(([z, n]) => [Number(z), n])
    .filter(([z]) => z !== 1 && z !== 8)
    .sort((a, b) => (ELEMENTS_TENSOR[a[0] - 1]?.chiPauling ?? 0) - (ELEMENTS_TENSOR[b[0] - 1]?.chiPauling ?? 0));
  let out = h ? `H${h === 1 ? '' : h}` : '';
  for (const [z, n] of rest) out += `${ELEMENTS_TENSOR[z - 1].symbol}${n === 1 ? '' : n}`;
  if (o) out += `O${o === 1 ? '' : o}`;
  return out || 'H2O';
}

function estimateMolecularPhase(tensors, nAtoms, T) {
  // Small covalent molecules are gases or liquids at ambient conditions.
  const mp = Math.max(...tensors.map(t => t.meltingPointK ?? 0));
  if (mp && T < mp) return 'solid';
  if (nAtoms <= 3) return 'gas';
  return T < 273.15 ? 'liquid' : 'gas';
}

function guessIonicLattice(A, B, qA, qB) {
  const rA = ionicRadius(A, qA);
  const rB = ionicRadius(B, qB);
  const ratio = Math.min(rA, rB) / Math.max(rA, rB);
  if (Math.abs(qA) === Math.abs(qB) && Math.abs(qA) === 1) {
    return ratio > 0.73 ? 'CsCl' : 'NaCl';
  }
  if (Math.abs(qA) === 2 && Math.abs(qB) === 2) return 'fluorite';
  if (Math.abs(qA) === 1 && Math.abs(qB) === 2) return 'fluorite';
  return 'NaCl';
}

/** A polyatomic anion template. */
export function polyatomicAnion(formula, name, charge) {
  const parts = parseLocal(formula);
  return { formula, name, charge, atomCounts: parts, kind: 'polyatomic-ion' };
}

function parseLocal(formula) {
  // Local minimal parser avoids a circular import with formula.js.
  const out = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let m;
  while ((m = re.exec(formula))) {
    const t = TENSOR_BY_SYMBOL[m[1]];
    if (!t) continue;
    out[t.Z] = (out[t.Z] || 0) + (m[2] ? parseInt(m[2], 10) : 1);
  }
  return out;
}

/** Common polyatomic ions — chemical constants, not reaction rules. */
export const POLYATOMIC_ANIONS = [
  polyatomicAnion('OH', 'hydroxide', -1),
  polyatomicAnion('CO3', 'carbonate', -2),
  polyatomicAnion('NO3', 'nitrate', -1),
  polyatomicAnion('SO4', 'sulfate', -2),
  polyatomicAnion('PO4', 'phosphate', -3),
  polyatomicAnion('ClO3', 'chlorate', -1),
  polyatomicAnion('ClO4', 'perchlorate', -1),
  polyatomicAnion('MnO4', 'permanganate', -1),
  polyatomicAnion('CrO4', 'chromate', -2),
  polyatomicAnion('Cr2O7', 'dichromate', -2),
  polyatomicAnion('CN', 'cyanide', -1),
  polyatomicAnion('HCO3', 'bicarbonate', -1),
];

export const POLYATOMIC_CATIONS = [
  polyatomicAnion('NH4', 'ammonium', +1),
];

/** Enrich a species with molar mass. */
export function finalizeSpecies(sp) {
  return { ...sp, molarMass: molarMass(sp.atomCounts) };
}

/** Look up tensors for the elements of a species. */
export function tensorsOf(sp) {
  return Object.keys(sp.atomCounts).map(z => ELEMENTS_TENSOR[Number(z) - 1]);
}

export function speciesIsMetal(sp) {
  const ts = tensorsOf(sp);
  return ts.length > 0 && ts.every(isMetal);
}

export function speciesHasNoble(sp) {
  return Object.keys(sp.atomCounts).some(z => NOBLE.has(Number(z)));
}
