import { ELEMENTS_TENSOR, TENSOR_BY_SYMBOL } from '../data/elements_tensor.js';
import { deriveTensor } from '../js/engine/physics/electronicConfig.js';
import { generateCandidates } from '../js/engine/thermodynamics/candidateGenerator.js';

function show(symbols) {
  const tensors = symbols.map(s => deriveTensor(TENSOR_BY_SYMBOL[s]));
  const { candidates } = generateCandidates(tensors, { T: 298.15, P: 1 });
  console.log('\n###', symbols.join('-'));
  for (const c of candidates) {
    if (c.kind === 'element') continue;
    const zs = Object.keys(c.atomCounts).join(',');
    console.log(c.formula.padEnd(12), c.kind.padEnd(14), 'dH', (c.thermo?.deltaH ?? 0).toFixed(1).padStart(10), 'dG', (c.thermo?.deltaG ?? 0).toFixed(1).padStart(10), 'phase', c.phase, 'atoms', zs);
  }
}
show(['H', 'O']);
show(['Fe', 'O']);
show(['Ca', 'C', 'O']);
show(['H', 'S', 'O']);
show(['N', 'H']);
