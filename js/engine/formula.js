// engine/formula.js
// ============================================================================
// Formula parsing and composition arithmetic. Turns "Ca(OH)2", "Fe2O3" or
// "CuSO4·5H2O" into exact element counts keyed by atomic number.
// ============================================================================

import { TENSOR_BY_SYMBOL } from '../../data/elements_tensor.js';

const TOKEN = /([A-Z][a-z]?)|(\d+)|([()\[\]])|(·|\.)/g;

function symbolToZ(sym) {
  const t = TENSOR_BY_SYMBOL[sym];
  if (!t) throw new Error(`Unknown element symbol: ${sym}`);
  return t.Z;
}

/**
 * Parse a chemical formula.
 * @param {string} formula e.g. "Ca(OH)2", "[Fe(CN)6]4-", "CuSO4·5H2O"
 * @returns {{formula:string, atomCounts:Record<number,number>, charge:number, elements:number[]}}
 */
export function parseFormula(formula, charge = 0) {
  if (!formula || typeof formula !== 'string') throw new Error('Formula must be a non-empty string.');
  let src = formula.trim().replace(/\s+/g, '');

  // Trailing charge: "SO4^2-", "Fe3+", "[Fe(CN)6]4-"
  const chargeMatch = src.match(/\^?(\d*)([+-])$/);
  if (chargeMatch) {
    const magnitude = chargeMatch[1] === '' ? 1 : parseInt(chargeMatch[1], 10);
    charge += (chargeMatch[2] === '-' ? -1 : 1) * magnitude;
    src = src.slice(0, chargeMatch.index);
  }

  const stack = [{}];
  let i = 0;
  let lastWasGroup = false;
  while (i < src.length) {
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(src);
    if (!m || m.index !== i) throw new Error(`Cannot parse formula near "${src.slice(i)}"`);
    i = TOKEN.lastIndex;

    if (m[1]) {
      const z = symbolToZ(m[1]);
      // Look ahead for a count.
      let count = 1;
      const numMatch = src.slice(i).match(/^\d+/);
      if (numMatch) { count = parseInt(numMatch[0], 10); i += numMatch[0].length; }
      const cur = stack[stack.length - 1];
      cur[z] = (cur[z] || 0) + count;
      lastWasGroup = false;
    } else if (m[2]) {
      // A bare number is only valid after a group; handled by look-ahead above.
      throw new Error(`Unexpected number in formula: ${m[2]}`);
    } else if (m[3] === '(' || m[3] === '[') {
      stack.push({});
      lastWasGroup = true;
    } else if (m[3] === ')' || m[3] === ']') {
      if (stack.length < 2) throw new Error('Unbalanced parentheses in formula.');
      const group = stack.pop();
      let mult = 1;
      const numMatch = src.slice(i).match(/^\d+/);
      if (numMatch) { mult = parseInt(numMatch[0], 10); i += numMatch[0].length; }
      const cur = stack[stack.length - 1];
      for (const [z, n] of Object.entries(group)) cur[z] = (cur[z] || 0) + n * mult;
      lastWasGroup = true;
    } else if (m[4]) {
      // Hydrate separator: multiply everything to its right by the next count.
      const rest = src.slice(i);
      const hm = rest.match(/^(\d+)(.*)$/);
      if (!hm) throw new Error('Hydrate separator must be followed by a count.');
      const mult = parseInt(hm[1], 10);
      const inner = parseFormula(hm[2]);
      const cur = stack[stack.length - 1];
      for (const [z, n] of Object.entries(inner.atomCounts)) cur[z] = (cur[z] || 0) + n * mult;
      i = src.length;
    } else {
      throw new Error(`Unexpected token "${m[0]}" in formula.`);
    }
    void lastWasGroup;
  }
  if (stack.length !== 1) throw new Error('Unbalanced parentheses in formula.');

  const atomCounts = stack[0];
  if (!Object.keys(atomCounts).length) throw new Error('Formula contains no atoms.');
  return {
    formula: formatFormula(atomCounts, charge),
    atomCounts,
    charge,
    elements: Object.keys(atomCounts).map(Number).sort((a, b) => a - b),
  };
}

/** Render atom counts back into a canonical formula string. */
export function formatFormula(atomCounts, charge = 0) {
  const entries = Object.entries(atomCounts)
    .map(([z, n]) => [Number(z), n]);
  const hasC = entries.some(([z]) => z === 6);
  const hasO = entries.some(([z]) => z === 8);
  const hasHydrideFormer = entries.some(([z]) => [7, 15, 33, 51, 83].includes(z));
  const hasMetalOrMetalloid = entries.some(([z]) => {
    const c = TENSOR_BY_SYMBOL[zSym(z)]?.category || '';
    return ['alkali-metal', 'alkaline-earth', 'transition-metal', 'post-transition-metal',
      'lanthanide', 'actinide', 'metalloid'].includes(c);
  });
  const rank = (z) => {
    if (z === 6) return 0;
    if (z === 1) {
      if (hasC) return 1;
      // Oxyacids keep H first (HNO3, H3PO4); saline hydrides and main-group
      // hydrides put H last (NaH, CaH2, B2H6, SiH4, PH3, NH3).
      if (hasO && hasHydrideFormer) return 1;
      if (hasHydrideFormer || hasMetalOrMetalloid) return 4;
      return 1;
    }
    const t = TENSOR_BY_SYMBOL[zSym(z)];
    const c = t?.category || '';
    if (['alkali-metal', 'alkaline-earth', 'transition-metal', 'post-transition-metal', 'lanthanide', 'actinide'].includes(c)) return 2;
    return 3;
  };
  entries.sort((a, b) => {
    const ra = rank(a[0]), rb = rank(b[0]);
    if (ra !== rb) return ra - rb;
    const ea = TENSOR_BY_SYMBOL[zSym(a[0])]?.chiPauling ?? 0;
    const eb = TENSOR_BY_SYMBOL[zSym(b[0])]?.chiPauling ?? 0;
    if (ea !== eb) return ea - eb;
    return zSym(a[0]).localeCompare(zSym(b[0]));
  });
  let out = entries.map(([z, n]) => `${zSym(z)}${n === 1 ? '' : n}`).join('');
  if (charge) out += charge > 0 ? `^${charge === 1 ? '' : charge}+` : `^${Math.abs(charge) === 1 ? '' : Math.abs(charge)}-`;
  return out;
}

function zSym(z) {
  // Reverse lookup built once.
  if (!zSym.cache) {
    zSym.cache = {};
    for (const [sym, t] of Object.entries(TENSOR_BY_SYMBOL)) zSym.cache[t.Z] = sym;
  }
  return zSym.cache[z];
}

export function addCompositions(...comps) {
  const out = {};
  for (const c of comps) for (const [z, n] of Object.entries(c)) out[z] = (out[z] || 0) + n;
  return out;
}

export function scaleComposition(comp, k) {
  const out = {};
  for (const [z, n] of Object.entries(comp)) out[z] = n * k;
  return out;
}

/** Molar mass (g/mol) of a composition. */
export function molarMass(atomCounts) {
  let m = 0;
  for (const [z, n] of Object.entries(atomCounts)) {
    const t = TENSOR_BY_SYMBOL[zSym(Number(z))];
    m += (t?.mass || 0) * n;
  }
  return m;
}
