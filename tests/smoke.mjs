import { balanceEquation } from '../js/engine/nullSpaceBalancer.js';
import { TENSOR_BY_SYMBOL } from '../data/elements_tensor.js';
import { deriveTensor, generateElectronConfiguration, configurationString } from '../js/engine/physics/electronicConfig.js';

const sp = (formula, atomCounts, charge=0) => ({ formula, atomCounts, charge });
console.log('H2+O2->H2O', balanceEquation(
  [sp('H2', {1:2}), sp('O2', {8:2})],
  [sp('H2O', {1:2, 8:1})]
).map(String));
console.log('Na+Cl2->NaCl', balanceEquation(
  [sp('Na', {11:1}), sp('Cl2', {17:2})],
  [sp('NaCl', {11:1, 17:1})]
).map(String));
console.log('Fe+O2->Fe2O3', balanceEquation(
  [sp('Fe', {26:1}), sp('O2', {8:2})],
  [sp('Fe2O3', {26:2, 8:3})]
).map(String));
console.log('CH4+O2->CO2+H2O', balanceEquation(
  [sp('CH4', {6:1,1:4}), sp('O2', {8:2})],
  [sp('CO2', {6:1,8:2}), sp('H2O', {1:2,8:1})]
).map(String));

for (const z of [1,6,24,29,47,79,92]) {
  const cfg = generateElectronConfiguration(z);
  console.log(z, configurationString(cfg));
}
const au = deriveTensor(TENSOR_BY_SYMBOL.Au);
console.log('Au valence', au.valenceElectrons, 'vec', au.vec, 'zEff', au.zEff.toFixed(2), 'cfg', au.configuration);
const fe = deriveTensor(TENSOR_BY_SYMBOL.Fe);
console.log('Fe valence', fe.valenceElectrons, 'vec', fe.vec, 'zEff', fe.zEff.toFixed(2));
