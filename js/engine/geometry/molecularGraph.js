// engine/geometry/molecularGraph.js
// ============================================================================
// Molecular graph builder. Determines the central atom, bond orders, lone-pair
// count and the VSEPR domain count from valence-electron bookkeeping.
// ============================================================================

import { ELEMENTS_TENSOR, TENSOR_BY_SYMBOL } from '../../../data/elements_tensor.js';
import { inferBonds } from '../thermodynamics/energyEstimator.js';

const VALENCE = { 1: 1, 5: 3, 6: 4, 7: 3, 8: 2, 9: 1, 14: 4, 15: 3, 16: 2, 17: 1, 35: 1, 53: 1 };

export function valenceCapacity(z) {
  if (VALENCE[z]) return VALENCE[z];
  const t = ELEMENTS_TENSOR[z - 1];
  if (!t) return 1;
  if (t.block === 'd') return Math.min(6, Math.max(2, t.group));
  return Math.max(1, Math.min(6, t.valenceElectrons || t.group || 1));
}

export function buildMolecularGraph(sp) {
  const tmap = {};
  for (const z of Object.keys(sp.atomCounts).map(Number)) tmap[z] = ELEMENTS_TENSOR[z - 1];
  let atoms, bonds;
  if (sp.thermo?.atoms && sp.thermo.atoms.length) {
    atoms = sp.thermo.atoms.slice();
    bonds = (sp.thermo.bonds || []).map(b => ({ ...b }));
  } else {
    ({ atoms, bonds } = inferBonds(sp.atomCounts, tmap));
  }
  if (!bonds.length && atoms.length === 2) {
    bonds = [{ a: 0, b: 1, order: 1 }];
  }

  // Central atom = highest degree, then lowest EN.
  const degree = new Array(atoms.length).fill(0);
  for (const b of bonds) { degree[b.a]++; degree[b.b]++; }
  let center = 0;
  for (let i = 1; i < atoms.length; i++) {
    if (degree[i] > degree[center]) center = i;
    else if (degree[i] === degree[center]) {
      const enI = tmap[atoms[i]]?.chiAllen || 0;
      const enC = tmap[atoms[center]]?.chiAllen || 0;
      if (enI < enC) center = i;
    }
  }

  const bondSum = bonds.filter(b => b.a === center || b.b === center)
    .reduce((a, b) => a + b.order, 0);
  const centerTensor = tmap[atoms[center]];
  const g = centerTensor?.group || 0;
  const block = centerTensor?.block;
  const valenceElectrons = block === 'p' ? Math.max(0, g - 10)
    : block === 's' ? (atoms[center] === 2 ? 2 : g)
    : (centerTensor?.valenceElectrons || g);
  const lonePairs = Math.max(0, Math.floor((valenceElectrons - bondSum) / 2));
  const domains = bonds.filter(b => b.a === center || b.b === center).length + lonePairs;

  return {
    atoms,
    bonds,
    center,
    centralZ: atoms[center],
    lonePairs,
    domains: Math.max(1, domains),
    bondSum,
    shape: vseprShape(domains, lonePairs),
  };
}

export function vseprShape(domains, lonePairs) {
  const key = `${domains}/${lonePairs}`;
  const table = {
    '1/0': 'Linear', '2/0': 'Linear', '2/1': 'Bent',
    '3/0': 'Trigonal planar', '3/1': 'Bent (trigonal)', '3/2': 'Linear',
    '4/0': 'Tetrahedral', '4/1': 'Trigonal pyramidal', '4/2': 'Bent',
    '5/0': 'Trigonal bipyramidal', '5/1': 'Seesaw', '5/2': 'T-shaped', '5/3': 'Linear',
    '6/0': 'Octahedral', '6/1': 'Square pyramidal', '6/2': 'Square planar',
    '7/0': 'Pentagonal bipyramidal',
  };
  return table[key] || `${domains}-domain`;
}

export function idealAngle(domains) {
  if (domains <= 2) return 180;
  if (domains === 3) return 120;
  if (domains === 4) return 109.47;
  if (domains === 5) return 90;
  if (domains === 6) return 90;
  return 72;
}
