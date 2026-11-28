// engine/bonding/vanArkelKetelaar.js
// ============================================================================
// Bonding continuum: the van Arkel–Ketelaar triangle. Bond character is a
// continuous field of ionic / covalent / metallic fractions, not a label.
// ============================================================================

import { isMetal } from '../physics/electronicConfig.js';

export function effectiveEN(t) {
  if (t?.chiAllen > 0.05) return t.chiAllen;
  if (t?.chiPauling != null) return t.chiPauling;
  return 0;
}

/** Fractional bond character between two element tensors. */
export function bondCharacter(A, B) {
  const chiA = effectiveEN(A), chiB = effectiveEN(B);
  const dChi = Math.abs(chiA - chiB);
  const avg = (chiA + chiB) / 2;
  const ionic = 1 - Math.exp(-0.25 * dChi * dChi);
  let metallic = 0;
  if (isMetal(A) && isMetal(B)) {
    metallic = Math.max(0, 1 - Math.abs(avg - 1.65) / 1.25) * (1 - ionic);
  }
  const covalent = Math.max(0, 1 - ionic - metallic);
  const label = classify(ionic, covalent, metallic);
  return {
    ionic, covalent, metallic,
    deltaChi: dChi,
    avgEN: avg,
    label,
    vanArkel: { ionic: +ionic.toFixed(3), covalent: +covalent.toFixed(3), metallic: +metallic.toFixed(3) },
  };
}

function classify(ionic, covalent, metallic) {
  if (metallic > 0.5) return 'Metallic';
  if (ionic > 0.55) return 'Ionic';
  if (ionic > 0.28) return 'Polar covalent (ionic character)';
  if (covalent > 0.7) return 'Non-polar covalent';
  return 'Mixed metallic–covalent';
}

/** Bond character for a whole species (weighted average over pairs). */
export function speciesBondCharacter(sp, tensorsByZ) {
  const zs = Object.keys(sp.atomCounts).map(Number);
  if (zs.length === 1) {
    const t = tensorsByZ[zs[0]];
    return { ionic: 0, covalent: 0, metallic: 1, deltaChi: 0, avgEN: effectiveEN(t), label: 'Metallic', vanArkel: { ionic: 0, covalent: 0, metallic: 1 } };
  }
  let wsum = 0;
  const acc = { ionic: 0, covalent: 0, metallic: 0, deltaChi: 0, avgEN: 0 };
  for (let i = 0; i < zs.length; i++) {
    for (let j = i + 1; j < zs.length; j++) {
      const w = sp.atomCounts[zs[i]] * sp.atomCounts[zs[j]];
      const bc = bondCharacter(tensorsByZ[zs[i]], tensorsByZ[zs[j]]);
      acc.ionic += bc.ionic * w;
      acc.covalent += bc.covalent * w;
      acc.metallic += bc.metallic * w;
      acc.deltaChi = Math.max(acc.deltaChi, bc.deltaChi);
      acc.avgEN += bc.avgEN * w;
      wsum += w;
    }
  }
  if (!wsum) return { ionic: 0, covalent: 0, metallic: 0, deltaChi: 0, avgEN: 0, label: 'Unknown' };
  acc.ionic /= wsum; acc.covalent /= wsum; acc.metallic /= wsum; acc.avgEN /= wsum;
  acc.label = classify(acc.ionic, acc.covalent, acc.metallic);

  // Molecular species stay molecular: high Pauling ionic character makes the
  // bond polar, not an ionic lattice. Extended ionic/network solids keep the
  // lattice classification.
  if (sp.kind === 'covalent') {
    acc.label = acc.deltaChi > 1.5
      ? 'Polar covalent (high ionic character)'
      : acc.deltaChi > 0.4 ? 'Polar covalent' : 'Non-polar covalent';
  } else if (sp.kind === 'network') {
    acc.label = 'Polar covalent network';
  } else if (sp.kind === 'ionic' || sp.kind === 'ionic-polyatomic') {
    acc.label = 'Ionic';
  }
  acc.vanArkel = {
    ionic: +acc.ionic.toFixed(3),
    covalent: +acc.covalent.toFixed(3),
    metallic: +acc.metallic.toFixed(3),
  };
  acc.ionicCharacter = +(acc.ionic * 100).toFixed(1);
  return acc;
}

/** Pauling ionic-character estimate (%). */
export function ionicCharacterPercent(A, B) {
  return (1 - Math.exp(-0.25 * (effectiveEN(A) - effectiveEN(B)) ** 2)) * 100;
}
