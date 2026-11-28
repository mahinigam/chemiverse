// engine/thermodynamics/candidateGenerator.js
// ============================================================================
// Enumerates chemically plausible product species from the staged elements.
// Candidates come from oxidation-state combinatorics, polyatomic-ion charge
// balancing and metallic solid-solution rules — never from a reaction lookup
// table.
// ============================================================================

import { ELEMENTS_TENSOR } from '../../../data/elements_tensor.js';
import { isMetal, isNobleGas } from '../physics/electronicConfig.js';
import {
  elementSpecies, binarySpecies, polyatomicSpecies, finalizeSpecies,
  POLYATOMIC_ANIONS, POLYATOMIC_CATIONS,
} from '../species.js';
import { estimateSpeciesThermo } from './energyEstimator.js';
import { nobleGasBarrier } from '../bonding/nobleGasBarrier.js';

function positiveStates(t) {
  const s = (t.allowedOxStates || []).filter(q => q > 0);
  if (s.length) return [...new Set(s)].sort((a, b) => a - b);
  if (isMetal(t)) return [Math.min(4, Math.max(1, t.group || 2))];
  return [];
}

function negativeStates(t) {
  return [...new Set((t.allowedOxStates || []).filter(q => q < 0))].sort((a, b) => b - a);
}

function enOf(t) {
  return t.chiAllen > 0.05 ? t.chiAllen : (t.chiPauling ?? 0);
}

/**
 * A cation must not be substantially more electronegative than its anion.
 * This blocks combinatorial nonsense such as H₃Cl (Cl(+3) with H(−1)) while
 * preserving real species like HCl, NaH, NH₃ and CH₄.
 */
function cationFits(cation, anion) {
  return enOf(cation) <= enOf(anion) + 0.25;
}

function addCandidate(map, sp, T, P, context) {
  if (map.has(sp.id)) return;
  if (!sp.atomCounts || !Object.keys(sp.atomCounts).length) return;
  // Noble-gas compounds face a kinetic barrier.
  if (context.noble && context.partner) {
    const barrier = nobleGasBarrier(context.noble, context.partner, T);
    if (!barrier.accessible) {
      sp.kineticBarrier = barrier;
      sp.excluded = true;
      map.set(sp.id, sp);
      return;
    }
    sp.kineticBarrier = barrier;
  }
  const thermo = estimateSpeciesThermo(sp, T, P);
  sp.thermo = thermo;
  if (sp.kind !== 'element') sp.estimated = thermo.estimated;
  // Kinetically accessible noble-gas compounds are metastable: they can be
  // trapped even when ΔG_f > 0. Give them a small effective stabilisation so
  // the minimiser can select them, and mark the result honestly.
  if (sp.kineticBarrier?.accessible && thermo.deltaG > 0) {
    sp.metastable = true;
    thermo.deltaG = -5;
  }
  map.set(sp.id, sp);
}

/**
 * @param {object[]} tensors staged element tensors
 * @param {{T:number,P:number}} conditions
 */
export function generateCandidates(tensors, { T = 298.15, P = 1 } = {}) {
  const map = new Map();
  const unique = [];
  const seenZ = new Set();
  for (const t of tensors) if (!seenZ.has(t.Z)) { seenZ.add(t.Z); unique.push(t); }

  // 1. Elemental standard states (leftover / unreacted channel).
  for (const t of unique) addCandidate(map, finalizeSpecies(elementSpecies(t, T)), T, P, {});

  // 2. Binary compounds from charge combinatorics.
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const A = unique[i], B = unique[j];
      const posA = positiveStates(A), negA = negativeStates(A);
      const posB = positiveStates(B), negB = negativeStates(B);
      const metalCount = unique.filter(isMetal).length;
      const metalCarbide = (A.Z === 6 && isMetal(B)) || (B.Z === 6 && isMetal(A));
      if (metalCount >= 3 && metalCarbide) continue;

      for (const qA of posA) {
        for (const qB of negB) {
          if (Math.abs(qA) > 4 || Math.abs(qB) > 4) continue;
          if (!cationFits(A, B)) continue;
          const noble = isNobleGas(A) ? A : isNobleGas(B) ? B : null;
          const partner = noble === A ? B : noble === B ? A : null;
          addCandidate(map, finalizeSpecies(binarySpecies(A, B, qA, qB, T)),
            T, P, { noble, partner });
        }
      }
      for (const qB of posB) {
        for (const qA of negA) {
          if (Math.abs(qB) > 4 || Math.abs(qA) > 4) continue;
          if (!cationFits(B, A)) continue;
          const noble = isNobleGas(A) ? A : isNobleGas(B) ? B : null;
          const partner = noble === A ? B : noble === B ? A : null;
          addCandidate(map, finalizeSpecies(binarySpecies(B, A, qB, qA, T)),
            T, P, { noble, partner });
        }
      }

      // 3. Metallic solid solutions / intermetallics. With three or more
      // metals we keep only the single-phase multi-component solution; binary
      // intermetallics would otherwise fragment the alloy.
      if (isMetal(A) && isMetal(B) && unique.filter(isMetal).length < 3) {
        for (const [xA, xB] of [[1, 1], [1, 3], [3, 1], [1, 2], [2, 1]]) {
          addCandidate(map, finalizeSpecies({
            id: `alloy:${A.symbol}${xA}${B.symbol}${xB}`,
            formula: `${A.symbol}${xA === 1 ? '' : xA}${B.symbol}${xB === 1 ? '' : xB}`,
            name: `${A.name}–${B.name} alloy`,
            atomCounts: { [A.Z]: xA, [B.Z]: xB },
            charge: 0,
            kind: 'alloy',
            phase: 'solid',
            lattice: 'FCC',
            tensors: [A, B],
            atoms: [...Array(xA).fill(A.Z), ...Array(xB).fill(B.Z)],
            bonds: [],
            color: A.color,
          }), T, P, {});
        }
      }
    }
  }

  // 4. Polyatomic ionic compounds (acids, hydroxides, carbonates, nitrates…).
  const present = new Set(unique.map(t => t.Z));
  for (const anion of POLYATOMIC_ANIONS) {
    const anionZ = Object.keys(anion.atomCounts).map(Number);
    if (!anionZ.every(z => present.has(z))) continue;
    for (const cation of unique) {
      if (isNobleGas(cation)) continue;
      for (const q of positiveStates(cation)) {
        if (q > 4) continue;
        addCandidate(map, finalizeSpecies(polyatomicSpecies(cation, q, anion, T)), T, P, {});
      }
    }
    // Ammonium salts.
    if (present.has(1) && present.has(7)) {
      for (const cat of POLYATOMIC_CATIONS) {
        const catZ = Object.keys(cat.atomCounts).map(Number);
        if (!catZ.every(z => present.has(z))) continue;
        const sp = finalizeSpecies(polyatomicSpecies(
          ELEMENTS_TENSOR[6], 1, anion, T));
        // Replace the placeholder cation composition with NH4+.
        const counts = {};
        for (const [z, n] of Object.entries(cat.atomCounts)) counts[z] = (counts[z] || 0) + n;
        const g = gcd(Math.abs(cat.charge), Math.abs(anion.charge));
        const nCat = Math.abs(anion.charge) / g;
        for (const [z, n] of Object.entries(counts)) counts[z] = n * nCat;
        sp.atomCounts = counts;
        sp.formula = `${cat.formula}${nCat === 1 ? '' : nCat}${anion.formula}`;
        sp.name = `Ammonium ${anion.name}`;
        sp.ions = [{ Z: 7, q: +1, n: nCat, poly: 'NH4' }, { poly: anion.formula, q: anion.charge, n: 1 }];
        sp.polyatomic = cat;
        sp.thermo = estimateSpeciesThermo(sp, T, P);
        sp.estimated = true;
        map.set(sp.id, sp);
      }
    }
  }

  // 5. Multi-metal solid solution (e.g. stainless steel, Cantor alloy).
  const metals = unique.filter(isMetal);
  if (metals.length >= 3) {
    const atomCounts = {};
    for (const m of metals) atomCounts[m.Z] = 1;
    addCandidate(map, finalizeSpecies({
      id: `alloy:${metals.map(m => m.symbol).join('')}`,
      formula: metals.map(m => m.symbol).join(''),
      name: `${metals.map(m => m.name).join('–')} solid solution`,
      atomCounts,
      charge: 0,
      kind: 'alloy',
      phase: 'solid',
      lattice: 'FCC',
      tensors: metals,
      atoms: metals.map(m => m.Z),
      bonds: [],
      color: metals[0].color,
    }), T, P, {});
  }

  const candidates = [...map.values()].filter(sp => !sp.excluded);
  const excluded = [...map.values()].filter(sp => sp.excluded);
  return { candidates, excluded, T, P };
}

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a || 1; }
