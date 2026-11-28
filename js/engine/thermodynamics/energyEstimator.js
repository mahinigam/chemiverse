// engine/thermodynamics/energyEstimator.js
// ============================================================================
// Subsystem B — thermochemistry from first principles.
//
//   • Covalent molecules: bond-enthalpy summation (tabulated single/multiple
//     bond energies, Pauling fallback for exotic pairs).
//   • Ionic solids: Born–Haber cycle with Slater-derived ionization energies,
//     electron affinities and a Kapustinskii lattice enthalpy.
//   • Metals/alloys: regular-solution mixing enthalpy with elastic strain.
//   • Entropy: standard molar entropies where known, statistical estimates
//     otherwise.
//
// Every result carries `estimated: true` when a fallback was used, so the UI
// can be honest about data provenance.
// ============================================================================

import { ELEMENTS_TENSOR, TENSOR_BY_SYMBOL } from '../../../data/elements_tensor.js';
import { formationData } from '../../../data/thermo.js';
import { ionizationEnergy, ionicRadius, isMetal } from '../physics/electronicConfig.js';
import { POLYATOMIC_RADII } from '../species.js';

export const R = 8.314462618; // J/(mol·K)
export const FARADAY = 96485.33212; // C/mol

// Standard single-bond enthalpies (kJ/mol). Multiple-bond entries keyed with
// the bond order suffix. Values are conventional thermochemical data.
const BOND = {
  'H-H': 436, 'C-C': 348, 'C-H': 413, 'C-O': 358, 'C-N': 293, 'N-N': 163,
  'N-O': 201, 'N-H': 391, 'O-O': 146, 'O-H': 463, 'F-F': 158, 'H-F': 567,
  'Cl-Cl': 242, 'H-Cl': 431, 'Br-Br': 193, 'H-Br': 366, 'I-I': 151, 'H-I': 299,
  'S-S': 226, 'S-H': 339, 'S-O': 265, 'P-P': 201, 'P-H': 322, 'P-O': 335,
  'Si-O': 452, 'Si-H': 318, 'Si-Si': 222, 'C-Cl': 328, 'C-F': 485,
  'C-Br': 276, 'C-I': 240, 'B-H': 389, 'B-O': 536, 'Se-Se': 172, 'Se-H': 276,
  'Te-Te': 138, 'As-H': 245, 'Sb-H': 257, 'Ge-H': 288, 'Sn-H': 251,
  // multiple bonds
  'C=O': 799, 'C=C': 614, 'C=N': 615, 'C≡N': 891, 'C≡C': 839,
  'N=N': 418, 'N≡N': 945, 'N=O': 607, 'O=O': 498, 'S=O': 523, 'P=O': 544,
  'S=S': 425, 'P=P': 490, 'Si=O': 640,
};

// Second electron affinities (kJ/mol; negative = endothermic), needed for
// multiply-charged anions (O²⁻, S²⁻, N³⁻).
const SECOND_EA = { 8: -780, 16: -590, 34: -540, 52: -500, 7: -880, 6: -900, 15: -760 };

const SYM = Object.fromEntries(ELEMENTS_TENSOR.map(t => [t.Z, t.symbol]));

function bondKey(a, b, order = 1) {
  const sa = SYM[a], sb = SYM[b];
  if (!sa || !sb) return null;
  const [x, y] = sa < sb ? [sa, sb] : [sb, sa];
  const prefix = order === 3 ? '≡' : order === 2 ? '=' : '-';
  return BOND[`${x}${prefix}${y}`] ?? BOND[`${y}${prefix}${x}`]
    ?? BOND[`${x}-${y}`] ?? BOND[`${y}-${x}`] ?? null;
}

/** Single-bond enthalpy, Pauling fallback. */
export function singleBondEnergy(a, b) {
  const key = bondKey(a, b, 1);
  if (key) return key;
  const ta = ELEMENTS_TENSOR[a - 1], tb = ELEMENTS_TENSOR[b - 1];
  const da = homonuclearEnergy(ta);
  const db = homonuclearEnergy(tb);
  const chi = Math.abs((ta?.chiAllen || 0) - (tb?.chiAllen || 0));
  return Math.sqrt(Math.max(1, da) * Math.max(1, db)) + 96.485 * chi * chi;
}

/** Bond enthalpy for a given bond order (order 1, 2 or 3). */
export function bondEnergy(a, b, order = 1) {
  const direct = bondKey(a, b, order);
  if (direct) return direct;
  const base = singleBondEnergy(a, b);
  if (order === 1) return base;
  if (order === 2) return base * 1.9;
  return base * 2.7;
}

function homonuclearEnergy(t) {
  if (!t) return 200;
  if (t.homonuclearBondEnergy > 0) return t.homonuclearBondEnergy;
  const atom = atomization(t);
  if ([1, 7, 8, 9, 17, 35, 53].includes(t.Z)) return 2 * atom;
  return Math.max(80, 0.55 * atom);
}

function atomization(t) {
  if (!t) return 0;
  if (t.atomizationEnthalpy > 0) return t.atomizationEnthalpy;
  if (t.boilingPointK) return 0.22 * t.boilingPointK;
  if (t.meltingPointK) return 0.30 * t.meltingPointK;
  return 120;
}

function standardEntropy(t) {
  if (!t) return 50;
  if (t.standardEntropy > 0) return t.standardEntropy;
  const m = t.mass || 40;
  if (t.stpPhase === 'gas') return 150 + 20 * Math.log(m);
  if (t.stpPhase === 'liquid') return 80 + 10 * Math.log(m);
  return 30 + 12 * Math.log(m);
}

// The tabulated standard entropy is per mole of the conventional standard-state
// unit (H₂, N₂, O₂, P₄, S, C, metal). Converting to per-mole-of-atoms makes the
// formation-entropy bookkeeping exact for every element.
const REFERENCE_ATOMS = { 1: 2, 7: 2, 8: 2, 9: 2, 17: 2, 35: 2, 53: 2, 15: 4 };

export function referenceAtomCount(z) {
  return REFERENCE_ATOMS[z] || 1;
}

export function standardEntropyPerAtom(t) {
  return standardEntropy(t) / referenceAtomCount(t?.Z);
}

/** Absolute molar Gibbs energy of an element (kJ/mol of atoms). Display only. */
export function elementGibbs(t, T = 298.15) {
  const S = standardEntropyPerAtom(t);
  return -S * (T - 298.15) / 1000;
}

/** Infer bonds for a small covalent molecule from octet/valence rules. */
export function inferBonds(atomCounts, tensorsByZ) {
  const atoms = [];
  for (const [z, n] of Object.entries(atomCounts)) {
    for (let i = 0; i < n; i++) atoms.push(Number(z));
  }
  if (atoms.length === 1) return { atoms, bonds: [] };
  if (atoms.length === 2) {
    const a = atoms[0], b = atoms[1];
    const order = bondOrderFor(a, b, tensorsByZ);
    return { atoms, bonds: [{ a: 0, b: 1, order }] };
  }
  // Central atom: lowest Allen EN among non-H, else highest valence.
  const nonH = atoms.map((z, i) => ({ z, i })).filter(x => x.z !== 1);
  const pool = nonH.length ? nonH : atoms.map((z, i) => ({ z, i }));
  pool.sort((p, q) => (tensorsByZ[p.z]?.chiAllen || 0) - (tensorsByZ[q.z]?.chiAllen || 0));

  // Oxyacids (H₂SO₄, HNO₃, H₂CO₃, HClO₄, H₃PO₄): hydrogen binds to oxygen,
  // the central atom carries the remaining oxo groups with multiple bonds.
  const oxy = oxyacidBonds(atoms, tensorsByZ);
  if (oxy) return { atoms, bonds: oxy };

  const center = pool[0].i;
  const cz = atoms[center];
  const cVal = valenceCapacity(cz, tensorsByZ);
  const ligands = atoms.map((z, i) => ({ z, i })).filter(x => x.i !== center);
  const bonds = [];
  let remaining = cVal;
  // First pass: multiple bonds to O/N (the usual multiple-bond formers).
  for (const l of ligands) {
    const cap = valenceCapacity(l.z, tensorsByZ);
    let order = 1;
    if ((l.z === 8 || l.z === 16) && remaining >= 2) order = 2;
    if (l.z === 7 && remaining >= 3) order = 3;
    order = Math.max(1, Math.min(order, Math.floor(remaining / 1), cap));
    bonds.push({ a: center, b: l.i, order });
    remaining -= order;
  }
  // Second pass: distribute remaining valence as extra bond order.
  let guard = 0;
  while (remaining > 0 && guard++ < 64) {
    let changed = false;
    for (const bd of bonds) {
      const lz = atoms[bd.b];
      const cap = valenceCapacity(lz, tensorsByZ);
      if (bd.order < cap) { bd.order += 1; remaining -= 1; changed = true; }
      if (remaining <= 0) break;
    }
    if (!changed) break;
  }
  return { atoms, bonds };
}

const EXPANDED_VALENCE = { 5: 3, 6: 4, 7: 5, 14: 4, 15: 5, 16: 6, 17: 7, 33: 5, 34: 6, 35: 7, 52: 6, 53: 7 };

/** Connectivity for an oxyacid H_a X O_b with a single central atom X. */
function oxyacidBonds(atoms, tensorsByZ) {
  const hIdx = [], oIdx = [], other = [];
  atoms.forEach((z, i) => {
    if (z === 1) hIdx.push(i);
    else if (z === 8) oIdx.push(i);
    else other.push(i);
  });
  if (!hIdx.length || !oIdx.length || other.length !== 1) return null;
  const xIdx = other[0];
  const cap = EXPANDED_VALENCE[atoms[xIdx]];
  if (!cap) return null;
  const oh = hIdx.length;
  if (oh > oIdx.length) return null;
  const terminal = oIdx.length - oh;
  if (cap < oh + terminal) return null;

  const bonds = [];
  for (let k = 0; k < oh; k++) {
    bonds.push({ a: xIdx, b: oIdx[k], order: 1 });
    bonds.push({ a: oIdx[k], b: hIdx[k], order: 1 });
  }
  let spare = cap - oh - terminal;
  for (let k = oh; k < oIdx.length; k++) {
    const order = spare > 0 ? 2 : 1;
    if (spare > 0) spare--;
    bonds.push({ a: xIdx, b: oIdx[k], order });
  }
  return bonds;
}

function valenceCapacity(z, tensorsByZ) {  const t = tensorsByZ[z];
  if (!t) return 1;
  if (z === 1) return 1;
  if (z === 8) return 2;
  if (z === 7) return 3;
  if (z === 6) return 4;
  if ([9, 17, 35, 53].includes(z)) return 1;
  if (z === 16) return 6;
  if (z === 15) return 5;
  if (z === 5) return 3;
  if (z === 14) return 4;
  return Math.max(1, Math.min(6, t.valenceElectrons || t.group || 2));
}

function bondOrderFor(a, b, tensorsByZ) {
  const va = valenceCapacity(a, tensorsByZ);
  const vb = valenceCapacity(b, tensorsByZ);
  const order = Math.min(va, vb, 3);
  return Math.max(1, order === 4 ? 2 : order === 5 ? 2 : order);
}

/** Kapustinskii lattice enthalpy (kJ/mol). */
export function kapustinskii(nu, zPlus, zMinus, rPlus, rMinus, polyatomic = false) {
  const r = Math.max(1.2, rPlus + rMinus);
  const U = 1200.5 * (nu * Math.abs(zPlus * zMinus)) / r * (1 - 0.345 / r);
  return polyatomic ? U * 1.06 : U;
}

function anionRadius(sp) {
  if (sp.polyatomic) {
    const key = Object.keys(POLYATOMIC_RADII).find(k => sp.polyatomic.formula.startsWith(k));
    return POLYATOMIC_RADII[key] || 2.0;
  }
  const ion = sp.ions?.find(i => i.q < 0);
  if (!ion) return 1.4;
  const t = ELEMENTS_TENSOR[ion.Z - 1];
  return ionicRadius(t, ion.q);
}

/** Estimate ΔH_f, ΔS_f, ΔG_f (kJ/mol, J/mol·K) for a species at T. */
export function estimateSpeciesThermo(sp, T = 298.15, P = 1) {
  let dH = 0, dS = 0, lattice = 0, bondSum = 0;
  let estimated = false;

  // Reference formation data takes precedence when available.
  const fd = formationData(sp.formula, sp.phase);
  if (fd) {
    let sElements = 0;
    for (const [z, n] of Object.entries(sp.atomCounts)) {
      sElements += n * standardEntropyPerAtom(ELEMENTS_TENSOR[Number(z) - 1]);
    }
    dS = fd.s - sElements;
    dH = fd.h;
    return {
      deltaH: dH, deltaS: dS, deltaG: dH - T * dS / 1000,
      lattice: 0, bondEnergy: 0, estimated: false,
      source: 'standard formation data',
    };
  }

  if (sp.kind === 'element') {
    const z = Number(Object.keys(sp.atomCounts)[0]);
    const t = ELEMENTS_TENSOR[z - 1];
    const n = sp.atomCounts[z] || 1;
    // Formation convention: the elemental standard state is the zero of
    // enthalpy, entropy and Gibbs energy at every temperature.
    return {
      deltaH: 0,
      deltaS: 0,
      deltaG: 0,
      absoluteEntropy: n * standardEntropyPerAtom(t),
      lattice: 0,
      bondEnergy: 0,
      estimated: false,
    };
  }

  if (sp.kind === 'alloy') {
    return estimateAlloyThermo(sp, T);
  }

  if (sp.kind === 'network') {
    let atomSum = 0;
    for (const [z, n] of Object.entries(sp.atomCounts)) {
      atomSum += n * atomization(ELEMENTS_TENSOR[Number(z) - 1]);
    }
    // Cohesive-energy model for tetrahedral/polar network solids.
    dH = -0.12 * atomSum;
    dS = compoundEntropy(sp, 'solid') - elementEntropySum(sp);
    return {
      deltaH: dH, deltaS: dS, deltaG: dH - T * dS / 1000,
      lattice: 0, bondEnergy: 0.12 * atomSum, estimated: true,
    };
  }

  if (sp.kind === 'ionic' || sp.kind === 'ionic-polyatomic') {
    const cat = sp.ions.find(i => i.q > 0);
    const an = sp.ions.find(i => i.q < 0);
    if (!cat || !an) return fallbackCovalent(sp, T);
    const ct = ELEMENTS_TENSOR[cat.Z - 1];
    dH += cat.n * atomization(ct);
    for (let m = 1; m <= cat.q; m++) dH += cat.n * ionizationEnergy(ct, m);

    if (an.poly) {
      const poly = sp.polyatomic;
      for (const [z, n] of Object.entries(poly.atomCounts)) {
        dH += an.n * n * atomization(ELEMENTS_TENSOR[Number(z) - 1]);
      }
      const pb = inferBonds(poly.atomCounts, TENSOR_BY_SYMBOL);
      for (const bd of pb.bonds) {
        const e = bondEnergy(pb.atoms[bd.a], pb.atoms[bd.b], bd.order);
        dH -= an.n * e;
        bondSum += an.n * e;
      }
      // Formal charge electron affinity of the polyatomic ion.
      const nEl = Math.abs(an.q);
      const firstZ = Number(Object.keys(poly.atomCounts)[0]);
      const ft = ELEMENTS_TENSOR[firstZ - 1];
      dH -= an.n * nEl * (ft.electronAffinity || 0);
    } else {
      const at = ELEMENTS_TENSOR[an.Z - 1];
      const n = Math.abs(an.q);
      dH += an.n * n * atomization(at);
      dH -= an.n * n * (at.electronAffinity || 0);
      if (n > 1) dH -= an.n * (n - 1) * (SECOND_EA[at.Z] ?? -600);
    }

    const catT = ELEMENTS_TENSOR[cat.Z - 1];
    const rPlus = ionicRadius(catT, cat.q);
    const rMinus = anionRadius(sp);
    const nu = cat.n + an.n;
    lattice = kapustinskii(nu, cat.q, Math.abs(an.q), rPlus, rMinus, !!an.poly);
    dH -= lattice;
    dS = compoundEntropy(sp, 'solid') - elementEntropySum(sp);
    estimated = true;
  } else {
    return fallbackCovalent(sp, T);
  }

  const dG = dH - T * dS / 1000;
  return { deltaH: dH, deltaS: dS, deltaG: dG, lattice, bondEnergy: bondSum, estimated };
}

function fallbackCovalent(sp, T) {
  const tmap = {};
  for (const z of Object.keys(sp.atomCounts).map(Number)) tmap[z] = ELEMENTS_TENSOR[z - 1];
  const { atoms, bonds } = inferBonds(sp.atomCounts, tmap);
  let atomSum = 0;
  for (const z of atoms) atomSum += atomization(ELEMENTS_TENSOR[z - 1]);
  let bondSum = 0;
  for (const bd of bonds) bondSum += bondEnergy(atoms[bd.a], atoms[bd.b], bd.order);
  let dH = atomSum - bondSum;
  let dS = compoundEntropy(sp, sp.phase) - elementEntropySum(sp);
  // Diatomic elements are the reference state.
  if (atoms.length === 2 && atoms[0] === atoms[1] && [1, 7, 8, 9, 17, 35, 53].includes(atoms[0])) {
    dH = 0;
  }
  return {
    deltaH: dH,
    deltaS: dS,
    deltaG: dH - T * dS / 1000,
    lattice: 0,
    bondEnergy: bondSum,
    estimated: true,
    atoms,
    bonds,
  };
}

function elementEntropySum(sp) {
  let s = 0;
  for (const [z, n] of Object.entries(sp.atomCounts)) {
    s += n * standardEntropyPerAtom(ELEMENTS_TENSOR[Number(z) - 1]);
  }
  return s;
}

function compoundEntropy(sp, phase) {
  const nAtoms = Object.values(sp.atomCounts).reduce((a, b) => a + b, 0);
  const m = sp.molarMass || 40;
  if (phase === 'gas') return 130 + 25 * Math.log(m) + 12 * (nAtoms - 1);
  if (phase === 'liquid') return 90 + 15 * Math.log(m) + 8 * (nAtoms - 1);
  return 45 + 22 * (nAtoms - 1) + 6 * Math.log(m);
}

/** Regular-solution + elastic-strain model for a metallic alloy. */
export function estimateAlloyThermo(sp, T = 298.15) {
  const entries = Object.entries(sp.atomCounts).map(([z, n]) => ({
    t: ELEMENTS_TENSOR[Number(z) - 1], x: n,
  }));
  const total = entries.reduce((a, e) => a + e.x, 0);
  entries.forEach(e => { e.x /= total; });
  let dH = 0;
  let sizeMismatch = 0;
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const A = entries[i].t, B = entries[j].t;
      const dChi = Math.abs((A.chiAllen || 0) - (B.chiAllen || 0));
      const rA = A.radii?.metallic || 1.3, rB = B.radii?.metallic || 1.3;
      const dr = Math.abs(rA - rB) / ((rA + rB) / 2);
      sizeMismatch = Math.max(sizeMismatch, dr);
      // Metallic cohesion offsets the positive regular-solution term; this is
      // the Miedema-style negative contribution for near-zero Δχ pairs.
      const omega = Math.max(0, 96.485 * dChi * dChi + 120 * dr * dr - 20);
      dH += entries[i].x * entries[j].x * omega * 4;
    }
  }
  let dS = 0;
  for (const e of entries) if (e.x > 0) dS -= R * e.x * Math.log(e.x);
  return {
    deltaH: dH,
    deltaS: dS,
    deltaG: dH - T * dS / 1000,
    lattice: 0,
    bondEnergy: 0,
    estimated: true,
    sizeMismatch,
  };
}

/** ΔG_f for an aqueous ion from its standard reduction potential. */
export function ionGibbsFromPotential(t, q) {
  const E = t.oxStatePotentials?.[q];
  if (E == null) return null;
  // ΔG° = -nFE°, in kJ/mol.
  return -Math.abs(q) * FARADAY * E / 1000;
}

export { atomization, standardEntropy };
