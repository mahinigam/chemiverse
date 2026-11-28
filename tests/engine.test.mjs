// Regression suite for the first-principles reactor.
// Run with: node tests/engine.test.mjs
//
// The suite checks three things that must never regress:
//   1. Known benchmark products and geometries.
//   2. Exact atom conservation in every displayed equation.
//   3. Stability across all 118 elements and a broad binary sweep.

import { react } from '../js/engine/reactor.js';
import { parseFormula } from '../js/engine/formula.js';
import { ELEMENTS_TENSOR } from '../data/elements_tensor.js';

let passed = 0;
const failures = [];

function check(label, fn) {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance, label) {
  assert(Number.isFinite(actual), `${label} is not finite (${actual})`);
  assert(Math.abs(actual - expected) <= tolerance,
    `${label} expected ${expected} ± ${tolerance}, got ${actual}`);
}

function run(elements, T = 298) {
  return react({ elements, T });
}

function product(result, formula) {
  return result.products.find(p => p.formula === formula && !p.leftover);
}

/** Count atoms on each side of a plain-text equation. */
function sideAtoms(side) {
  const counts = {};
  for (const term of side.split(' + ')) {
    const match = term.match(/^(\d*)(.+)$/);
    const coeff = match[1] ? parseInt(match[1], 10) : 1;
    const parsed = parseFormula(match[2]);
    for (const [z, n] of Object.entries(parsed.atomCounts)) {
      counts[z] = (counts[z] || 0) + coeff * n;
    }
  }
  return counts;
}

function assertBalanced(equation, label) {
  assert(equation.includes(' → '), `${label} has no arrow: ${equation}`);
  const [left, right] = equation.split(' → ');
  assert(!right.includes('no reaction'), `${label} unexpectedly inert: ${equation}`);
  const l = sideAtoms(left);
  const r = sideAtoms(right);
  const keys = new Set([...Object.keys(l), ...Object.keys(r)]);
  for (const z of keys) {
    assert((l[z] || 0) === (r[z] || 0),
      `${label} is not balanced for Z=${z}: ${l[z] || 0} vs ${r[z] || 0} in "${equation}"`);
  }
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------
{
  const r = run([{ symbol: 'H', moles: 2 }, { symbol: 'O', moles: 1 }]);
  check('water', () => {
    assert(r.equation === '2H2 + O2 → 2H2O', `equation was ${r.equation}`);
    assertBalanced(r.equation, 'water');
    const w = product(r, 'H2O');
    assert(w, 'water product missing');
    assert(w.kind === 'covalent', `water kind was ${w.kind}`);
    close(r.thermodynamics.deltaH, -571.6, 8, 'water ΔH');
    assert(r.thermodynamics.deltaG < 0, 'water should be spontaneous');
    assert(r.primary.geometry.shape === 'Bent', `water geometry ${r.primary.geometry.shape}`);
    close(r.primary.geometry.averageAngle, 104.5, 1.5, 'water angle');
    assert(/Polar covalent/.test(r.primary.bonding.label), `water bond ${r.primary.bonding.label}`);
  });
}

{
  const r = run([{ symbol: 'Na', moles: 1 }, { symbol: 'Cl', moles: 1 }]);
  check('sodium chloride', () => {
    assert(r.equation === '2Na + Cl2 → 2NaCl', `equation was ${r.equation}`);
    assertBalanced(r.equation, 'NaCl');
    const salt = product(r, 'NaCl');
    assert(salt && salt.kind === 'ionic', 'NaCl ionic product missing');
    assert(r.primary.geometry.lattice === 'NaCl', `NaCl lattice ${r.primary.geometry.lattice}`);
    assert(r.products.some(p => p.formula === 'Cl2' && p.leftover), 'excess Cl2 not reported as leftover');
  });
}

{
  const r = run([{ symbol: 'Ti', moles: 1 }, { symbol: 'O', moles: 1 }]);
  check('titania', () => {
    assert(product(r, 'TiO2'), 'TiO2 missing');
    assertBalanced(r.equation, 'TiO2');
  });
}

{
  const r = run([{ symbol: 'Fe', moles: 2 }, { symbol: 'O', moles: 1.5 }]);
  check('hematite', () => {
    assert(product(r, 'Fe2O3'), 'Fe2O3 missing');
    assertBalanced(r.equation, 'Fe2O3');
  });
}

{
  const r = run([{ symbol: 'Ca', moles: 1 }, { symbol: 'C', moles: 1 }, { symbol: 'O', moles: 1.5 }]);
  check('calcite', () => {
    const salt = product(r, 'CaCO3');
    assert(salt, 'CaCO3 missing');
    assert(salt.kind === 'ionic-polyatomic', `CaCO3 kind ${salt.kind}`);
    assertBalanced(r.equation, 'CaCO3');
  });
}

{
  const r = run([{ symbol: 'H', moles: 1 }, { symbol: 'S', moles: 0.125 }, { symbol: 'O', moles: 2 }]);
  check('sulfuric acid', () => {
    assert(product(r, 'H2SO4'), 'H2SO4 missing');
    assert(r.primary.geometry.mode === 'molecule', `H2SO4 mode ${r.primary.geometry.mode}`);
    assertBalanced(r.equation, 'H2SO4');
  });
}

{
  const r = run([{ symbol: 'N', moles: 0.5 }, { symbol: 'H', moles: 1.5 }]);
  check('ammonia', () => {
    assert(product(r, 'NH3'), 'NH3 missing');
    assert(r.primary.geometry.shape === 'Trigonal pyramidal', `NH3 geometry ${r.primary.geometry.shape}`);
    close(r.primary.geometry.averageAngle, 107, 1.5, 'NH3 angle');
    assertBalanced(r.equation, 'NH3');
  });
}

{
  const r = run([{ symbol: 'C', moles: 1 }, { symbol: 'H', moles: 2 }]);
  check('methane', () => {
    assert(product(r, 'CH4'), 'CH4 missing');
    assert(r.primary.geometry.shape === 'Tetrahedral', `CH4 geometry ${r.primary.geometry.shape}`);
    close(r.primary.geometry.averageAngle, 109.47, 1.2, 'CH4 angle');
    assertBalanced(r.equation, 'CH4');
  });
}

{
  const r = run([{ symbol: 'C', moles: 1 }, { symbol: 'O', moles: 1 }]);
  check('carbon dioxide', () => {
    assert(product(r, 'CO2'), 'CO2 missing');
    assert(r.primary.geometry.shape === 'Linear', `CO2 geometry ${r.primary.geometry.shape}`);
    close(r.primary.geometry.averageAngle, 180, 1, 'CO2 angle');
    assertBalanced(r.equation, 'CO2');
  });
}

{
  const r = run([{ symbol: 'Xe', moles: 1 }, { symbol: 'F', moles: 1 }], 298);
  check('xenon inert at 298 K', () => {
    assert(r.inert, 'Xe/F2 should be inert at 298 K');
    assert(r.equation.includes('no reaction'), `equation was ${r.equation}`);
    assert(!product(r, 'XeF2'), 'XeF2 should be kinetically excluded at 298 K');
    assert(r.excluded.some(e => e.formula === 'XeF2'), 'XeF2 exclusion not reported');
  });
}

{
  const r = run([{ symbol: 'Xe', moles: 1 }, { symbol: 'F', moles: 1 }], 700);
  check('xenon difluoride at 700 K', () => {
    const xe = product(r, 'XeF2');
    assert(xe, 'XeF2 missing at 700 K');
    assert(r.primary.geometry.shape === 'Linear', `XeF2 geometry ${r.primary.geometry.shape}`);
    assert(/Polar covalent/.test(r.primary.bonding.label), `XeF2 bond ${r.primary.bonding.label}`);
    close(r.primary.geometry.averageAngle, 180, 1, 'XeF2 angle');
    assertBalanced(r.equation, 'XeF2');
  });
}

{
  const r = run([{ symbol: 'Ar', moles: 1 }, { symbol: 'F', moles: 1 }], 298);
  check('argon inert', () => {
    assert(r.inert, 'Ar/F2 should be inert');
    assert(r.equation === 'Ar + F2 → no reaction', `equation was ${r.equation}`);
  });
}

{
  const r = run(['Co', 'Cr', 'Fe', 'Mn', 'Ni']);
  check('Cantor alloy', () => {
    assert(r.primary.kind === 'alloy', `Cantor kind ${r.primary.kind}`);
    assert(r.primary.geometry.mode === 'crystal', `Cantor mode ${r.primary.geometry.mode}`);
    assertBalanced(r.equation, 'Cantor');
  });
}

{
  const r = run([{ symbol: 'Fe', moles: 1 }, { symbol: 'Cr', moles: 1 }, { symbol: 'Ni', moles: 1 }, { symbol: 'C', moles: 0.1 }]);
  check('stainless steel', () => {
    assert(r.primary.kind === 'alloy', `steel kind ${r.primary.kind}`);
    assertBalanced(r.equation, 'steel');
  });
}

{
  const r = run([{ symbol: 'Ga', moles: 1 }, { symbol: 'As', moles: 1 }]);
  check('gallium arsenide', () => {
    const gaas = product(r, 'GaAs');
    assert(gaas && gaas.kind === 'network', 'GaAs network product missing');
    assert(r.primary.geometry.lattice === 'zincblende', `GaAs lattice ${r.primary.geometry.lattice}`);
    assert(r.primary.geometry.coordination === 4, `GaAs coordination ${r.primary.geometry.coordination}`);
    assertBalanced(r.equation, 'GaAs');
  });
}

{
  const r = run([{ symbol: 'Ni', moles: 1 }, { symbol: 'Ti', moles: 1 }]);
  check('nitinol', () => {
    assert(r.primary.kind === 'alloy', `NiTi kind ${r.primary.kind}`);
    assert(r.primary.geometry.lattice === 'B2', `NiTi lattice ${r.primary.geometry.lattice}`);
    assert(r.equation === 'Ni + Ti → NiTi', `equation was ${r.equation}`);
  });
}

{
  const r = run(['Na']);
  check('sodium metal', () => {
    assert(r.primary.geometry.lattice === 'BCC', `Na lattice ${r.primary.geometry.lattice}`);
  });
}

{
  const r = run([{ symbol: 'H', moles: 1 }, { symbol: 'Cl', moles: 1 }]);
  check('hydrogen chloride', () => {
    assert(product(r, 'HCl'), 'HCl missing');
    assert(r.primary.kind === 'covalent', `HCl kind ${r.primary.kind}`);
    assertBalanced(r.equation, 'HCl');
  });
}

{
  const r = run([{ symbol: 'H', moles: 4 }, { symbol: 'O', moles: 1 }]);
  check('excess reactant equation', () => {
    assert(r.equation === '2H2 + O2 → 2H2O', `excess equation was ${r.equation}`);
    assert(r.products.some(p => p.formula === 'H2' && p.leftover), 'excess H2 not reported');
    assertBalanced(r.equation, 'excess H2O');
  });
}

// ---------------------------------------------------------------------------
// Conservation sweep: every element alone, plus a deterministic binary sample.
// ---------------------------------------------------------------------------
const symbols = ELEMENTS_TENSOR.map(t => t.symbol);

check('all 118 elements in isolation', () => {
  for (const symbol of symbols) {
    for (const T of [298, 1800]) {
      const r = react({ elements: [{ symbol, moles: 1 }], T });
      assert(r.ok && typeof r.equation === 'string' && r.equation.length > 0, `${symbol}@${T} returned no equation`);
      assert(Number.isFinite(r.thermodynamics.deltaH), `${symbol}@${T} has non-finite ΔH`);
      assert(Number.isFinite(r.thermodynamics.deltaG), `${symbol}@${T} has non-finite ΔG`);
      if (!r.inert) assertBalanced(r.equation, `${symbol}@${T}`);
    }
  }
});

check('binary conservation sweep', () => {
  let seed = 0x9e3779b9;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const pairs = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) pairs.push([symbols[i], symbols[j]]);
  }
  // Deterministic shuffle, then a representative 600-pair sample.
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  for (const [a, b] of pairs.slice(0, 600)) {
    const r = react({ elements: [{ symbol: a, moles: 1 }, { symbol: b, moles: 1 }], T: 298 });
    assert(r.ok, `${a}+${b} failed`);
    assert(Number.isFinite(r.thermodynamics.deltaG), `${a}+${b} has non-finite ΔG`);
    if (!r.inert) assertBalanced(r.equation, `${a}+${b}`);
  }
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (failures.length) {
  console.error(`\n${failures.length} test(s) failed:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n${passed} check(s) passed.`);
  process.exit(1);
}

console.log(`\n✓ ${passed} checks passed. All equations conserve atoms.`);
