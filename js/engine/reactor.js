// engine/reactor.js
// ============================================================================
// The reactor: the public entry point that ties every subsystem together.
//
//   elements → derived quantum tensors (A/E)
//            → candidate species (C)
//            → constrained Gibbs minimisation (B)
//            → balanced equation (B2)
//            → molecular / crystal geometry (D)
//            → telemetry for the instrument UI
// ============================================================================

import { ELEMENTS_TENSOR, TENSOR_BY_SYMBOL } from '../../data/elements_tensor.js';
import { deriveTensor, isMetal } from './physics/electronicConfig.js';
import {
  relativisticContraction, opticalAbsorptionEdge, inertPairPenalty,
  ionicPotential, polarizingPower, phaseAt,
} from './physics/quantumNuance.js';
import { elementSpecies, finalizeSpecies, speciesColor } from './species.js';
import { parseFormula } from './formula.js';
import { generateCandidates } from './thermodynamics/candidateGenerator.js';
import { minimizeProducts, integerize, toRational } from './thermodynamics/gibbsMinimizer.js';
import { estimateSpeciesThermo, R } from './thermodynamics/energyEstimator.js';
import { speciesBondCharacter, bondCharacter } from './bonding/vanArkelKetelaar.js';
import { alloyReport, solidSolubility } from './bonding/humeRothery.js';
import { solveGeometry } from './geometry/thomsonVsepr.js';
import { crystalFor } from './geometry/crystalLattice.js';

const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
export function sub(text) { return String(text).replace(/\d/g, d => SUB[d] || d); }

const ANION_NAMES = {
  1: 'hydride', 5: 'boride', 6: 'carbide', 7: 'nitride', 8: 'oxide', 9: 'fluoride',
  14: 'silicide', 15: 'phosphide', 16: 'sulfide', 17: 'chloride', 33: 'arsenide',
  34: 'selenide', 35: 'bromide', 52: 'telluride', 53: 'iodide',
};

const COMMON_NAMES = {
  H2O: 'water', H2O2: 'hydrogen peroxide', NH3: 'ammonia', N2H4: 'hydrazine',
  CH4: 'methane', C2H6: 'ethane', C2H4: 'ethene', C2H2: 'ethyne', C2H5OH: 'ethanol',
  CH3OH: 'methanol', CO: 'carbon monoxide', CO2: 'carbon dioxide',
  SO2: 'sulfur dioxide', SO3: 'sulfur trioxide', H2S: 'hydrogen sulfide',
  H2SO4: 'sulfuric acid', HNO3: 'nitric acid', H2CO3: 'carbonic acid',
  HCl: 'hydrochloric acid', HF: 'hydrofluoric acid', HBr: 'hydrobromic acid',
  HI: 'hydroiodic acid', HClO4: 'perchloric acid', H3PO4: 'phosphoric acid',
  NaOH: 'sodium hydroxide', KOH: 'potassium hydroxide', 'Ca(OH)2': 'calcium hydroxide',
  CaCO3: 'calcium carbonate', Na2CO3: 'sodium carbonate', NaHCO3: 'sodium bicarbonate',
  NaCl: 'sodium chloride (halite)', KCl: 'potassium chloride', TiO2: 'titanium dioxide',
  Fe2O3: 'iron(III) oxide', Fe3O4: 'magnetite', FeO: 'iron(II) oxide',
  SiO2: 'silica', Al2O3: 'alumina', MgO: 'magnesium oxide', CaO: 'quicklime',
  GaAs: 'gallium arsenide', SiC: 'silicon carbide', BN: 'boron nitride',
  XeF2: 'xenon difluoride', XeF4: 'xenon tetrafluoride', XeF6: 'xenon hexafluoride',
  SF6: 'sulfur hexafluoride', UF6: 'uranium hexafluoride', WF6: 'tungsten hexafluoride',
  KMnO4: 'potassium permanganate', K2Cr2O7: 'potassium dichromate',
  CuSO4: 'copper(II) sulfate', AgNO3: 'silver nitrate', NH4NO3: 'ammonium nitrate',
  '(NH4)2SO4': 'ammonium sulfate', CH3COOH: 'acetic acid',
};

function commonName(formula) {
  return COMMON_NAMES[formula] || null;
}

/**
 * @param {{elements?:Array<string|{symbol:string,moles?:number}|{formula:string,moles?:number}>, T?:number, P?:number, supercell?:number}} input
 */
export function react(input = {}) {
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const T = input.T ?? 298.15;
  const P = input.P ?? 1;
  const raw = input.elements || input.symbols || [];
  const entries = raw.map(normalizeEntry).filter(Boolean);
  if (!entries.length) throw new Error('Stage at least one element or compound.');

  // ---- 1. Derived tensors -------------------------------------------------
  const reactantSpecies = [];
  const tensorMap = new Map();
  for (const e of entries) {
    if (e.symbol) {
      const base = TENSOR_BY_SYMBOL[e.symbol];
      if (!base) throw new Error(`Unknown element: ${e.symbol}`);
      const t = deriveTensor(base);
      tensorMap.set(t.Z, t);
      reactantSpecies.push({ species: finalizeSpecies(elementSpecies(t, T)), moles: e.moles });
    } else {
      const parsed = parseFormula(e.formula);
      const zs = Object.keys(parsed.atomCounts).map(Number);
      for (const z of zs) {
        if (!tensorMap.has(z)) tensorMap.set(z, deriveTensor(ELEMENTS_TENSOR[z - 1]));
      }
      const sp = finalizeSpecies({
        id: `input:${parsed.formula}`,
        formula: parsed.formula,
        name: parsed.formula,
        atomCounts: parsed.atomCounts,
        charge: parsed.charge,
        kind: zs.length === 1 ? 'element' : 'compound',
        phase: 'solid',
        tensors: zs.map(z => tensorMap.get(z)),
        atoms: [],
        bonds: [],
        color: speciesColor(tensorMap.get(zs[0])),
      });
      sp.thermo = estimateSpeciesThermo(sp, T, P);
      reactantSpecies.push({ species: sp, moles: e.moles });
    }
  }
  const tensors = [...tensorMap.values()];

  // ---- 2. Reactant atom inventory ----------------------------------------
  const reactantAtoms = {};
  for (const { species, moles } of reactantSpecies) {
    for (const [z, n] of Object.entries(species.atomCounts)) {
      reactantAtoms[z] = (reactantAtoms[z] || 0) + n * moles;
    }
  }

  // ---- 3. Candidate generation + Gibbs minimisation -----------------------
  const { candidates, excluded } = generateCandidates(tensors, { T, P });
  const lp = minimizeProducts(reactantAtoms, candidates, T);

  const productAmounts = [];
  lp.vars.forEach((sp, i) => {
    const amt = lp.amounts[i];
    if (amt > 1e-6) productAmounts.push({ sp, moles: amt });
  });

  // Leftover elemental standard states.
  const leftoverAmounts = [];
  for (const [z, atoms] of Object.entries(lp.leftover)) {
    if (atoms <= 1e-6) continue;
    const t = tensorMap.get(Number(z));
    if (!t) continue;
    const el = finalizeSpecies(elementSpecies(t, T));
    const per = Object.values(el.atomCounts)[0];
    leftoverAmounts.push({ sp: el, moles: atoms / per, leftover: true });
  }

  const products = [...productAmounts, ...leftoverAmounts];

  // ---- 4. Balanced equation ----------------------------------------------
  const allAmounts = [
    ...reactantSpecies.map(r => r.moles),
    ...productAmounts.map(p => p.moles),
    ...leftoverAmounts.map(p => p.moles),
  ];
  const ints = integerize(allAmounts);
  const reactantCoeffs = ints.slice(0, reactantSpecies.length).map(Number);
  const firstAmount = reactantSpecies[0]?.moles || 1;
  const scale = reactantCoeffs[0] > 0 ? reactantCoeffs[0] / firstAmount : 1;

  // The conventional equation shows only the portion actually consumed.
  // Excess elemental reactant is reported in the product list as "leftover"
  // rather than being written into the equation as a spectator.
  const consumedReactants = reactantSpecies.map((r) => {
    let consumed = r.moles;
    if (r.species.kind === 'element') {
      const z = Number(Object.keys(r.species.atomCounts)[0]);
      const leftAtoms = lp.leftover[z] || 0;
      const per = r.species.atomCounts[z] || 1;
      consumed = Math.max(0, consumed - leftAtoms / per);
    }
    return consumed;
  });
  const displayInts = integerize([
    ...consumedReactants,
    ...productAmounts.map(p => p.moles),
  ]).map(Number);
  const displayReactantCoeffs = displayInts.slice(0, reactantSpecies.length);
  const displayProductCoeffs = displayInts.slice(reactantSpecies.length);

  const equationParts = [];
  reactantSpecies.forEach((r, i) => {
    if (displayReactantCoeffs[i] <= 0) return;
    equationParts.push({ side: 'reactant', sp: r.species, coeff: displayReactantCoeffs[i], phase: r.species.phase, formula: r.species.formula, name: r.species.name });
  });
  productAmounts.forEach((p, i) => {
    if (displayProductCoeffs[i] <= 0) return;
    equationParts.push({ side: 'product', sp: p.sp, coeff: displayProductCoeffs[i], phase: p.sp.phase, formula: p.sp.formula, name: compoundName(p.sp) });
  });

  const equation = formatEquation(equationParts);
  const equationHTML = formatEquation(equationParts, true);

  // ---- 5. Thermochemistry -------------------------------------------------
  let deltaH = 0, deltaS = 0, deltaG = 0;
  for (const { sp, moles } of productAmounts) {
    const th = sp.thermo || estimateSpeciesThermo(sp, T, P);
    deltaH += moles * th.deltaH;
    deltaS += moles * th.deltaS;
    deltaG += moles * th.deltaG;
  }
  for (const { sp, moles } of leftoverAmounts) {
    const th = sp.thermo || estimateSpeciesThermo(sp, T, P);
    deltaH += moles * th.deltaH;
    deltaS += moles * th.deltaS;
    deltaG += moles * th.deltaG;
  }
  for (const { species, moles } of reactantSpecies) {
    const th = species.thermo || { deltaH: 0, deltaS: 0, deltaG: 0 };
    deltaH -= moles * th.deltaH;
    deltaS -= moles * th.deltaS;
    deltaG -= moles * th.deltaG;
  }
  deltaH *= scale; deltaS *= scale; deltaG *= scale;
  const K = deltaG === 0 ? 1 : Math.exp(-deltaG * 1000 / (R * T));

  // ---- 6. Primary product & bonding --------------------------------------
  const ranked = productAmounts
    .map(p => ({ ...p, score: p.moles * Object.values(p.sp.atomCounts).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.score - a.score);
  const singleElement = reactantSpecies.length === 1 && reactantSpecies[0].species.kind === 'element';
  const primary = ranked[0]?.sp || (singleElement ? reactantSpecies[0].species : null);

  let bonding = null;
  if (primary) {
    const tmap = {};
    for (const z of Object.keys(primary.atomCounts).map(Number)) tmap[z] = tensorMap.get(z);
    bonding = speciesBondCharacter(primary, tmap);
    if (primary.chargePair) {
      const [qA, qB] = primary.chargePair;
      const cat = primary.tensors.find(t => t.allowedOxStates?.includes(qA)) || primary.tensors[0];
      const an = primary.tensors.find(t => t !== cat) || primary.tensors[1];
      if (cat && an) bonding.ionicCharacter = 100 * (1 - Math.exp(-0.25 * ((cat.chiAllen || 0) - (an.chiAllen || 0)) ** 2));
    }
  }

  // ---- 7. Geometry --------------------------------------------------------
  for (const p of products) {
    p.geometry = geometryFor(p.sp, p.sp.tensors || [], input.supercell ?? 2);
  }

  // ---- 8. Telemetry -------------------------------------------------------
  const heaviest = tensors.reduce((a, b) => (b.Z > a.Z ? b : a), tensors[0]);
  const telemetry = {
    heaviest: heaviest.symbol,
    Z: heaviest.Z,
    relativisticContraction: relativisticContraction(heaviest.Z),
    opticalEdge: opticalAbsorptionEdge(heaviest),
    phaseAtT: phaseAt(heaviest, T),
    temperature: T,
    pressure: P,
    candidatesEvaluated: candidates.length,
    excludedByKinetics: excluded.map(sp => ({
      formula: sp.formula,
      barrier: sp.kineticBarrier,
    })),
    inertPair: inertPairPenalty(heaviest, Math.max(0, ...(heaviest.allowedOxStates || [0]))),
    ionicPotential: ionicPotential(heaviest, Math.max(1, Math.min(4, heaviest.group || 1))),
    polarizingPower: polarizingPower(heaviest, Math.max(1, Math.min(4, heaviest.group || 1))),
    valence: {
      electrons: heaviest.valenceElectrons,
      vec: heaviest.vec,
      zEff: heaviest.zEff,
      configuration: heaviest.configuration,
    },
  };

  if (primary?.kind === 'alloy') {
    telemetry.alloy = alloyReport(primary.tensors, Object.values(primary.atomCounts).map(n => n / Object.values(primary.atomCounts).reduce((a, b) => a + b, 0)));
  }

  const inert = productAmounts.length === 0;
  const inertInts = integerize(reactantSpecies.map(r => r.moles)).map(Number);
  const displayEquation = inert
    ? `${reactantSpecies.map((r, i) => `${inertInts[i] === 1 ? '' : inertInts[i]}${r.species.formula}`).join(' + ')} → no reaction`
    : equation;
  const primaryGeometry = primary
    ? (products.find(p => p.sp === primary || p.sp.id === primary.id)?.geometry
      || geometryFor(primary, primary.tensors || [], input.supercell ?? 2))
    : null;
  const computeMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;

  return {
    ok: true,
    inert,
    equation: displayEquation,
    equationHTML: inert ? displayEquation : equationHTML,
    equationParts,
    reactants: reactantSpecies.map(r => ({ formula: r.species.formula, name: r.species.name, moles: r.moles, phase: r.species.phase })),
    products: products.map(p => ({
      formula: p.sp.formula,
      name: compoundName(p.sp),
      moles: p.moles,
      phase: p.sp.phase,
      kind: p.sp.kind,
      lattice: p.sp.lattice,
      deltaH: p.sp.thermo?.deltaH ?? null,
      deltaG: p.sp.thermo?.deltaG ?? null,
      estimated: p.sp.thermo?.estimated ?? false,
      metastable: !!p.sp.metastable,
      leftover: !!p.leftover,
      geometry: p.geometry,
      bonding: p.sp.kind === 'element' ? null : speciesBondCharacter(p.sp, Object.fromEntries(
        Object.keys(p.sp.atomCounts).map(z => [Number(z), tensorMap.get(Number(z))])
      )),
    })),
    primary: primary ? {
      formula: primary.formula,
      name: compoundName(primary),
      kind: primary.kind,
      phase: primary.phase,
      lattice: primary.lattice,
      deltaH: primary.thermo?.deltaH ?? null,
      deltaG: primary.thermo?.deltaG ?? null,
      bonding,
      geometry: primaryGeometry,
      estimated: primary.thermo?.estimated ?? false,
      metastable: !!primary.metastable,
    } : null,
    thermodynamics: {
      deltaH,
      deltaS,
      deltaG,
      spontaneous: deltaG < 0,
      equilibriumConstant: K,
      temperature: T,
      pressure: P,
      regime: deltaG < -50 ? 'strongly exergonic' : deltaG < 0 ? 'exergonic' : deltaG < 50 ? 'near equilibrium' : 'endergonic',
    },
    telemetry,
    excluded: excluded.map(sp => ({
      formula: sp.formula,
      kind: sp.kind,
      barrier: sp.kineticBarrier,
    })),
    candidates: candidates
      .filter(c => c.kind !== 'element')
      .sort((a, b) => (a.thermo?.deltaG ?? 0) - (b.thermo?.deltaG ?? 0))
      .map(c => ({
        formula: c.formula,
        kind: c.kind,
        phase: c.phase,
        deltaG: c.thermo?.deltaG ?? null,
        estimated: c.thermo?.estimated ?? false,
        metastable: !!c.metastable,
      })),
    computeMs,
  };
}

function normalizeEntry(e) {
  if (typeof e === 'string') {
    if (TENSOR_BY_SYMBOL[e]) return { symbol: e, moles: 1 };
    return { formula: e, moles: 1 };
  }
  if (!e) return null;
  if (e.symbol) return { symbol: e.symbol, moles: e.moles ?? 1 };
  if (e.formula) return { formula: e.formula, moles: e.moles ?? 1 };
  return null;
}

function formatEquation(parts, html = false) {
  const side = (s) => parts.filter(p => p.side === s)
    .map(p => {
      const coeff = p.coeff === 1 ? '' : p.coeff;
      const f = html ? sub(p.sp.formula) : p.sp.formula;
      return `${coeff}${f}`;
    }).join(html ? ' + ' : ' + ');
  return `${side('reactant')} → ${side('product')}`;
}

function geometryFor(sp, tensors, supercell) {
  try {
    if (sp.kind === 'element') {
      const cr = crystalFor(sp, tensors, supercell);
      if (cr) return cr;
      // Molecular elements (H₂, N₂, O₂, halogens, P₄…) have no lattice.
      return solveGeometry(sp);
    }
    if (sp.kind === 'alloy' || sp.kind === 'ionic' || sp.kind === 'ionic-polyatomic' || sp.kind === 'network') {
      const cr = crystalFor(sp, tensors, supercell);
      if (cr) return cr;
    }
    return solveGeometry(sp);
  } catch (err) {
    return { mode: 'none', error: err.message };
  }
}

function compoundName(sp) {
  if (!sp) return '';
  const cn = commonName(sp.formula);
  if (cn) return cn;
  if (sp.kind === 'alloy') return sp.name || `${sp.formula} alloy`;
  if (sp.kind === 'ionic' && sp.ions) {
    const cat = sp.ions.find(i => i.q > 0);
    const an = sp.ions.find(i => i.q < 0);
    if (cat && an) {
      const catT = ELEMENTS_TENSOR[cat.Z - 1];
      if (an.poly) return `${catT.name} ${sp.polyatomic?.name || 'salt'}`;
      const anName = ANION_NAMES[an.Z] || ELEMENTS_TENSOR[an.Z - 1]?.name || 'anion';
      return `${catT.name} ${anName}`;
    }
  }
  if (sp.kind === 'ionic-polyatomic' && sp.ions) {
    const cat = sp.ions.find(i => i.q > 0);
    const an = sp.ions.find(i => i.q < 0);
    const catT = ELEMENTS_TENSOR[cat?.Z - 1];
    return `${catT?.name || ''} ${an?.poly ? sp.polyatomic?.name || 'salt' : ''}`.trim();
  }
  if (sp.kind === 'element') return ELEMENTS_TENSOR[Number(Object.keys(sp.atomCounts)[0]) - 1]?.name || sp.formula;
  return sp.formula;
}

export { toRational };
