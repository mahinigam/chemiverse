// engine/bonding/nobleGasBarrier.js
// ============================================================================
// Kinetic barrier for noble-gas chemistry. The barrier falls as the noble gas
// ionization energy falls down the group and as the partner's electron
// affinity rises — which is why XeF2 forms, KrF2 is hard, and ArF2 does not.
// ============================================================================

import { ionizationEnergy } from '../physics/electronicConfig.js';

const XE_I1 = 1170.4; // kJ/mol

/**
 * @returns {{Ea:number, thresholdT:number, accessible:boolean, reason:string}}
 */
export function nobleGasBarrier(noble, partner, T = 298.15) {
  const ie = ionizationEnergy(noble, 1);
  const ea = Math.max(0, partner.electronAffinity || 0);
  // Empirical barrier shape calibrated on Xe/F2 (~400–500 °C onset).
  const Ea = Math.max(0, (ie - XE_I1) + 120 - 0.30 * ea);
  const thresholdT = Ea * 25;
  const accessible = T >= thresholdT;
  return {
    Ea,
    thresholdT,
    accessible,
    reason: accessible
      ? `Thermal energy at ${Math.round(T)} K clears the ${Ea.toFixed(0)} kJ/mol barrier.`
      : `Barrier ${Ea.toFixed(0)} kJ/mol requires ≈${Math.round(thresholdT)} K; staged at ${Math.round(T)} K.`,
  };
}
