// data/thermo.js
// ============================================================================
// Standard thermodynamic formation data (298.15 K, 1 bar).
//
// h = ΔH_f° in kJ/mol, s = S° in J/(mol·K). This is reference data, not a
// reaction table: the reactor still enumerates and balances products itself.
// Species absent here are computed from bond enthalpies / Born–Haber cycles.
// ============================================================================

export const THERMO_FORMATION = {
  // Simple molecules
  'H2O(g)': { h: -241.8, s: 188.8 },
  'H2O(l)': { h: -285.8, s: 69.9 },
  'H2O2(l)': { h: -187.8, s: 109.6 },
  'CO(g)': { h: -110.5, s: 197.7 },
  'CO2(g)': { h: -393.5, s: 213.8 },
  'CH4(g)': { h: -74.8, s: 186.3 },
  'C2H6(g)': { h: -84.7, s: 229.6 },
  'C2H4(g)': { h: 52.5, s: 219.6 },
  'C2H2(g)': { h: 226.7, s: 200.9 },
  'C2H5OH(l)': { h: -277.7, s: 160.7 },
  'CH3OH(l)': { h: -238.7, s: 126.8 },
  'CH3COOH(l)': { h: -484.5, s: 159.8 },
  'NH3(g)': { h: -45.9, s: 192.8 },
  'N2H4(l)': { h: 50.6, s: 121.2 },
  'NO(g)': { h: 90.3, s: 210.8 },
  'NO2(g)': { h: 33.2, s: 240.1 },
  'N2O(g)': { h: 82.1, s: 219.9 },
  'HNO3(l)': { h: -174.1, s: 155.6 },
  'SO2(g)': { h: -296.8, s: 248.2 },
  'SO3(g)': { h: -395.7, s: 256.8 },
  'H2S(g)': { h: -20.6, s: 205.8 },
  'H2SO4(l)': { h: -814.0, s: 156.9 },
  'HCl(g)': { h: -92.3, s: 186.9 },
  'HF(g)': { h: -271.1, s: 173.8 },
  'HBr(g)': { h: -36.3, s: 198.7 },
  'HI(g)': { h: 26.5, s: 206.6 },
  'H3PO4(s)': { h: -1284.4, s: 110.5 },
  'H2CO3(aq)': { h: -699.7, s: 187.4 },
  'HClO4(l)': { h: -40.6, s: 158.0 },
  // Ionic solids
  'NaCl(s)': { h: -411.2, s: 72.1 },
  'KCl(s)': { h: -436.7, s: 82.6 },
  'NaBr(s)': { h: -361.1, s: 86.8 },
  'NaI(s)': { h: -287.8, s: 98.5 },
  'KBr(s)': { h: -393.8, s: 96.4 },
  'KI(s)': { h: -327.9, s: 106.3 },
  'NaOH(s)': { h: -425.9, s: 64.5 },
  'KOH(s)': { h: -424.8, s: 78.9 },
  'Ca(OH)2(s)': { h: -986.1, s: 83.4 },
  'Mg(OH)2(s)': { h: -924.5, s: 63.2 },
  'CaO(s)': { h: -635.1, s: 39.8 },
  'MgO(s)': { h: -601.7, s: 26.9 },
  'Na2O(s)': { h: -414.2, s: 75.1 },
  'K2O(s)': { h: -361.5, s: 94.1 },
  'Al2O3(s)': { h: -1675.7, s: 50.9 },
  'TiO2(s)': { h: -944.7, s: 50.6 },
  'FeO(s)': { h: -272.0, s: 60.8 },
  'Fe2O3(s)': { h: -824.2, s: 87.4 },
  'Fe3O4(s)': { h: -1118.4, s: 146.4 },
  'ZnO(s)': { h: -350.5, s: 43.6 },
  'CuO(s)': { h: -157.3, s: 42.6 },
  'Cu2O(s)': { h: -168.6, s: 93.1 },
  'CaCO3(s)': { h: -1206.9, s: 92.9 },
  'MgCO3(s)': { h: -1095.8, s: 65.7 },
  'Na2CO3(s)': { h: -1130.7, s: 135.0 },
  'NaHCO3(s)': { h: -950.8, s: 102.1 },
  'K2CO3(s)': { h: -1151.0, s: 155.5 },
  'NH4NO3(s)': { h: -365.6, s: 151.1 },
  '(NH4)2SO4(s)': { h: -1180.9, s: 220.1 },
  'CuSO4(s)': { h: -771.4, s: 109.2 },
  'AgNO3(s)': { h: -124.4, s: 140.9 },
  'KMnO4(s)': { h: -837.2, s: 171.7 },
  'K2Cr2O7(s)': { h: -2033.0, s: 291.2 },
  'SiO2(s)': { h: -910.9, s: 41.5 },
  'SiC(s)': { h: -65.0, s: 16.6 },
  'BN(s)': { h: -254.4, s: 14.8 },
  'GaAs(s)': { h: -71.0, s: 64.2 },
  'GaN(s)': { h: -110.0, s: 29.0 },
  'InP(s)': { h: -88.7, s: 63.6 },
  'CdTe(s)': { h: -92.5, s: 95.0 },
  'ZnS(s)': { h: -206.0, s: 57.7 },
  'XeF2(s)': { h: -108.0, s: 113.0 },
  'XeF4(s)': { h: -251.0, s: 146.0 },
  'XeF6(s)': { h: -294.0, s: 155.0 },
  'KrF2(s)': { h: -60.0, s: 105.0 },
  'SF6(g)': { h: -1209.0, s: 291.6 },
  'UF6(s)': { h: -2197.0, s: 227.6 },
  'WF6(g)': { h: -1721.7, s: 295.0 },
  'TiN(s)': { h: -337.9, s: 30.1 },
  'TiC(s)': { h: -184.5, s: 24.3 },
  'WC(s)': { h: -40.0, s: 32.6 },
  'Si3N4(s)': { h: -744.8, s: 101.0 },
  'AlN(s)': { h: -318.0, s: 20.2 },
  'Ca3N2(s)': { h: -431.0, s: 105.0 },
  'Mg3N2(s)': { h: -461.1, s: 87.9 },
  'Li3N(s)': { h: -164.9, s: 62.3 },
  'NaH(s)': { h: -56.3, s: 40.0 },
  'LiH(s)': { h: -90.5, s: 20.0 },
  'CaH2(s)': { h: -181.5, s: 41.4 },
  'NaClO3(s)': { h: -365.8, s: 142.3 },
  'KClO3(s)': { h: -397.7, s: 143.1 },
  'KClO4(s)': { h: -432.8, s: 151.0 },
};

/** Look up formation data for a formula, preferring the phase-specific key. */
export function formationData(formula, phase) {
  const phaseKey = phase ? `${formula}(${phase === 'solid' ? 's' : phase === 'liquid' ? 'l' : phase === 'gas' ? 'g' : 'aq'})` : null;
  if (phaseKey && THERMO_FORMATION[phaseKey]) return THERMO_FORMATION[phaseKey];
  if (THERMO_FORMATION[formula]) return THERMO_FORMATION[formula];
  const prefix = `${formula}(`;
  for (const key of Object.keys(THERMO_FORMATION)) {
    if (key.startsWith(prefix)) return THERMO_FORMATION[key];
  }
  return null;
}
