// engine/nullSpaceBalancer.js
// ============================================================================
// Subsystem B2 — exact rational Gauss–Jordan RREF null-space balancer.
// Balances arbitrary reaction networks with rigorous mass + charge conservation.
// ============================================================================

import { Rational } from './rational.js';

export { Rational };

/**
 * Balance a reaction exactly.
 * @param {Array<{formula:string, atomCounts:Record<number,number>, charge:number, side:'reactant'|'product'}>} species
 * @returns {bigint[]} minimal positive integer coefficients, aligned with species.
 */
export function balanceReactionNullSpace(species) {
  if (!species || species.length === 0) throw new Error('No species supplied to balancer.');

  const uniqueZ = Array.from(new Set(
    species.flatMap(s => Object.keys(s.atomCounts).map(Number))
  )).sort((a, b) => a - b);
  const rows = uniqueZ.length + 1; // elements + charge
  const cols = species.length;

  const M = Array.from({ length: rows }, () => new Array(cols).fill(null).map(() => new Rational(0n)));
  species.forEach((sp, col) => {
    const sign = sp.side === 'reactant' ? 1n : -1n;
    uniqueZ.forEach((z, row) => {
      const count = sp.atomCounts[z] ?? 0;
      M[row][col] = new Rational(BigInt(count) * sign);
    });
    M[rows - 1][col] = new Rational(BigInt(Math.round(sp.charge || 0)) * sign);
  });

  // Gauss-Jordan → reduced row echelon form.
  const pivotCols = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let pivotRow = r;
    while (pivotRow < rows && M[pivotRow][c].isZero()) pivotRow++;
    if (pivotRow === rows) continue;

    [M[r], M[pivotRow]] = [M[pivotRow], M[r]];
    const pivotVal = M[r][c];
    for (let j = c; j < cols; j++) M[r][j] = M[r][j].div(pivotVal);

    for (let i = 0; i < rows; i++) {
      if (i !== r && !M[i][c].isZero()) {
        const factor = M[i][c];
        for (let j = c; j < cols; j++) {
          M[i][j] = M[i][j].sub(factor.mul(M[r][j]));
        }
      }
    }
    pivotCols.push(c);
    r++;
  }

  const pivotSet = new Set(pivotCols);
  const freeCols = [];
  for (let c = 0; c < cols; c++) if (!pivotSet.has(c)) freeCols.push(c);
  if (freeCols.length === 0) throw new Error('Mass/charge conservation impossible for chosen species.');

  // Single independent reaction (nullity = 1; LP/selection guarantees one basis).
  const freeCol = freeCols[0];
  const nullVec = new Array(cols).fill(null).map(() => new Rational(0n));
  nullVec[freeCol] = new Rational(1n);
  pivotCols.forEach((pCol, rowIdx) => {
    nullVec[pCol] = M[rowIdx][freeCol].neg();
  });

  // Scale by the LCM of denominators → minimal integers.
  let commonDen = 1n;
  for (const val of nullVec) commonDen = Rational.lcm(commonDen, val.den);
  let coeffs = nullVec.map(v => v.num * (commonDen / v.den));

  if (coeffs.some(c => c <= 0n)) {
    if (coeffs.every(c => c < 0n)) coeffs = coeffs.map(c => -c);
    else throw new Error('Non-physical negative stoichiometric coefficient detected.');
  }

  const finalGcd = coeffs.reduce((a, b) => Rational.gcd(a, b));
  return coeffs.map(c => c / finalGcd);
}

/** Convenience wrapper: balance a list of reactant/product formula descriptors. */
export function balanceEquation(reactants, products) {
  const species = [
    ...reactants.map(s => ({ ...s, side: 'reactant' })),
    ...products.map(s => ({ ...s, side: 'product' })),
  ];
  return balanceReactionNullSpace(species);
}
