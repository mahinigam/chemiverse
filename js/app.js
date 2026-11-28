// app.js
// ============================================================================
// Instrument controller.
//
//   • renders the 118-element periodic table from the immutable tensor set
//   • element inspection modal (Bohr shells + elemental state)
//   • mole-aware reaction crucible with T / P / supercell controls
//   • runs the first-principles reactor in a module worker (with a synchronous
//     fallback), then renders thermodynamics, bonding, geometry and telemetry
//   • drives the Three.js viewport for molecules and crystal supercells
// ============================================================================

import { ELEMENTS_TENSOR, TENSOR_BY_SYMBOL } from '../data/elements_tensor.js';
import { deriveTensor } from './engine/physics/electronicConfig.js';
import { react } from './engine/reactor.js';
import { Visualizer3D } from './molecule3d.js';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

const fmt = (value, digits = 1) => {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e5 || abs < 1e-3)) return value.toExponential(2);
  return Number(value).toFixed(digits).replace(/\.0$/, '');
};

const fmtSci = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1e5 || abs < 1e-2) return value.toExponential(2);
  return fmt(value, abs < 1 ? 4 : 2);
};

const titleCase = (s) => String(s || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const PHASE_LABEL = { solid: 'Solid', liquid: 'Liquid', gas: 'Gas', aqueous: 'Aqueous' };

function elementPhaseAt(tensor, T) {
  const mp = tensor.meltingPointK;
  const bp = tensor.boilingPointK;
  if (mp != null && T < mp) return 'solid';
  if (bp != null && T >= bp) return 'gas';
  if (mp != null && T >= mp) return 'liquid';
  return tensor.stpPhase || 'solid';
}

// ---------------------------------------------------------------------------
// Application state
// ---------------------------------------------------------------------------
const state = {
  T: 298,
  logP: 0,
  supercell: 2,
  staged: new Map(), // symbol -> moles
  selected: null,
  search: '',
  category: 'all',
  busy: false,
  lastResult: null,
  requestId: 0,
  workerReady: false,
  modalTab: 'bohr',
};

const derivedCache = new Map();
function derived(symbol) {
  if (!derivedCache.has(symbol)) derivedCache.set(symbol, deriveTensor(TENSOR_BY_SYMBOL[symbol]));
  return derivedCache.get(symbol);
}

const visualizers = { element: null, reaction: null };

// ---------------------------------------------------------------------------
// Worker plumbing
// ---------------------------------------------------------------------------
let worker = null;
let pending = new Map();

function startWorker() {
  try {
    worker = new Worker(new URL('./engine/worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const { id, ok, result, error, stack } = event.data || {};
      const job = pending.get(id);
      if (!job) return;
      pending.delete(id);
      if (ok) job.resolve(result);
      else job.reject(Object.assign(new Error(error || 'Reactor failed'), { stack }));
    };
    worker.onerror = () => {
      // A worker that cannot load (e.g. file:// preview) falls back silently.
      state.workerReady = false;
      worker = null;
      for (const [, job] of pending) job.reject(new Error('Worker unavailable'));
      pending.clear();
      setEngineStatus();
    };
    state.workerReady = true;
  } catch {
    worker = null;
    state.workerReady = false;
  }
  setEngineStatus();
}

function runReaction(input) {
  const id = ++state.requestId;
  if (worker) {
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, input });
      setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(new Error('Reactor timed out'));
      }, 12000);
    }).catch(() => {
      // Module workers are unavailable in some preview contexts (file://).
      // Fall back to the same reactor on the main thread.
      worker = null;
      state.workerReady = false;
      setEngineStatus();
      return react(input);
    });
  }
  return Promise.resolve().then(() => react(input));
}

function setEngineStatus(text) {
  const el = $('#engine-status');
  if (!el) return;
  el.textContent = text || `Engine ready · 118 element tensors · ${state.workerReady ? 'worker online' : 'synchronous fallback'}`;
}

// ---------------------------------------------------------------------------
// Periodic table
// ---------------------------------------------------------------------------
const MAIN_TABLE = ELEMENTS_TENSOR.filter((el) => el.category !== 'lanthanide' && el.category !== 'actinide');
const LANTHANIDES = ELEMENTS_TENSOR.filter((el) => el.category === 'lanthanide');
const ACTINIDES = ELEMENTS_TENSOR.filter((el) => el.category === 'actinide');

function elementCellHTML(el, placed = true) {
  const phase = el.stpPhase || 'solid';
  const position = placed ? ` style="grid-column:${el.group};grid-row:${el.period}"` : '';
  return `
    <button class="element-cell ${esc(el.category)}" data-symbol="${esc(el.symbol)}"${position} aria-label="${esc(el.name)}, atomic number ${el.Z}">
      <span class="cell-header">
        <span class="atomic-num">${el.Z}</span>
        <span class="state-dot ${esc(phase)}"></span>
      </span>
      <span class="symbol">${esc(el.symbol)}</span>
      <span class="name">${esc(el.name)}</span>
      <span class="mass">${fmt(el.mass, 3)}</span>
    </button>`;
}

function buildPeriodicTable() {
  const grid = $('#periodic-grid');
  if (!grid) return;
  grid.innerHTML = MAIN_TABLE.map(elementCellHTML).join('') + `
    <button class="element-cell placeholder-cell" data-placeholder="lanthanide" style="grid-column:3;grid-row:6" aria-label="Lanthanide series">
      <span class="symbol">57–71</span><span class="name">La–Lu</span>
    </button>
    <button class="element-cell placeholder-cell" data-placeholder="actinide" style="grid-column:3;grid-row:7" aria-label="Actinide series">
      <span class="symbol">89–103</span><span class="name">Ac–Lr</span>
    </button>`;

  $('#lanthanides-grid').innerHTML = LANTHANIDES.map((el) => elementCellHTML(el, false)).join('');
  $('#actinides-grid').innerHTML = ACTINIDES.map((el) => elementCellHTML(el, false)).join('');

  document.addEventListener('click', (event) => {
    const cell = event.target.closest('.element-cell');
    if (!cell) return;
    if (cell.dataset.placeholder) {
      const target = cell.dataset.placeholder === 'lanthanide' ? $('#lanthanides-grid') : $('#actinides-grid');
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (cell.dataset.symbol) openModal(cell.dataset.symbol);
  });
}

function applyFilter() {
  const q = state.search.trim().toLowerCase();
  const cat = state.category;
  for (const cell of $$('.element-cell[data-symbol]')) {
    const el = TENSOR_BY_SYMBOL[cell.dataset.symbol];
    if (!el) continue;
    const matchesQuery = !q
      || el.name.toLowerCase().includes(q)
      || el.symbol.toLowerCase() === q
      || el.symbol.toLowerCase().startsWith(q)
      || String(el.Z) === q;
    const matchesCat = cat === 'all' || el.category === cat;
    cell.classList.toggle('dimmed', !(matchesQuery && matchesCat));
    cell.classList.toggle('staged', state.staged.has(el.symbol));
  }
  for (const cell of $$('.placeholder-cell')) {
    cell.classList.toggle('dimmed', !!q || cat !== 'all');
  }
}

// ---------------------------------------------------------------------------
// Element inspector
// ---------------------------------------------------------------------------
function openModal(symbol) {
  const tensor = TENSOR_BY_SYMBOL[symbol];
  if (!tensor) return;
  state.selected = symbol;
  const t = derived(symbol);
  const phase = elementPhaseAt(tensor, state.T);

  $('#modal-symbol').textContent = tensor.symbol;
  $('#modal-symbol').style.color = tensor.color || '#38bdf8';
  $('#modal-name').textContent = tensor.name;
  $('#modal-number').textContent = `Z = ${tensor.Z}`;
  $('#modal-category-badge').textContent = titleCase(tensor.category);
  $('#modal-state-badge').textContent = `${PHASE_LABEL[phase] || phase} at ${Math.round(state.T)} K`;
  $('#modal-mass').textContent = `${fmt(tensor.mass, 4)} u`;
  $('#modal-summary').textContent = tensor.summary || '';

  const ie = tensor.ionizationEnergies || [];
  const radii = tensor.radii || {};
  const props = [
    ['Group · Period · Block', `${tensor.group} · ${tensor.period} · ${tensor.block}`],
    ['Electron configuration', tensor.electronConfigString || t.configuration],
    ['Shell occupancy', (tensor.shells || []).join(' · ')],
    ['Valence electrons', `${t.valenceElectrons} (VEC ${t.vec})`],
    ['Slater Z<sub>eff</sub>', fmt(t.zEff, 2)],
    ['Pauling electronegativity', tensor.chiPauling == null ? '—' : fmt(tensor.chiPauling, 2)],
    ['Allen electronegativity', fmt(tensor.chiAllen, 3)],
    ['First ionization energy', ie[1] ? `${fmt(ie[1], 1)} kJ/mol` : '—'],
    ['Second ionization energy', ie[2] ? `${fmt(ie[2], 1)} kJ/mol` : '—'],
    ['Electron affinity', `${fmt(tensor.electronAffinity, 1)} kJ/mol`],
    ['Atomization enthalpy', `${fmt(tensor.atomizationEnthalpy, 1)} kJ/mol`],
    ['Covalent radius', `${fmt(radii.covalentSingle, 2)} Å`],
    ['Metallic radius', `${fmt(radii.metallic, 2)} Å`],
    ['van der Waals radius', `${fmt(radii.vdw, 2)} Å`],
    ['Oxidation states', (tensor.allowedOxStates || []).join(', ') || '—'],
    ['Melting point', tensor.meltingPointK ? `${fmt(tensor.meltingPointK, 1)} K` : '—'],
    ['Boiling point', tensor.boilingPointK ? `${fmt(tensor.boilingPointK, 1)} K` : '—'],
    ['Density', tensor.density != null ? `${fmtSci(tensor.density)} g/cm³` : '—'],
    ['Standard entropy S°', tensor.standardEntropy ? `${fmt(tensor.standardEntropy, 1)} J/mol·K` : '—'],
    ['Native lattice', titleCase(tensor.nativeLattice || '—')],
    ['Elemental form', tensor.allotropeForm || '—'],
  ];

  $('#modal-properties-list').innerHTML = props.map(([label, value]) => `
    <div class="prop-item">
      <span class="prop-label">${label}</span>
      <span class="prop-val">${esc(value)}</span>
    </div>`).join('');

  $('#element-modal').classList.remove('hidden');
  document.body.classList.add('modal-open');
  setModalTab(state.modalTab, true);
}

function closeModal() {
  $('#element-modal').classList.add('hidden');
  document.body.classList.remove('modal-open');
  state.selected = null;
}

function setModalTab(tab, force = false) {
  if (!state.selected) return;
  if (!force && state.modalTab === tab) return;
  state.modalTab = tab;
  $('#tab-bohr')?.classList.toggle('active', tab === 'bohr');
  $('#tab-allotrope')?.classList.toggle('active', tab === 'allotrope');

  const tensor = derived(state.selected);
  if (!visualizers.element) visualizers.element = new Visualizer3D('element-3d-canvas');

  if (tab === 'bohr') {
    visualizers.element.renderBohrAtom(tensor);
    return;
  }

  // Elemental state: ask the reactor for the standard-state allotrope.
  try {
    const result = react({ elements: [{ symbol: state.selected, moles: 1 }], T: state.T, supercell: state.supercell });
    const geometry = result.primary?.geometry;
    if (geometry?.atoms?.length) visualizers.element.renderGeometry(geometry);
    else visualizers.element.renderBohrAtom(tensor);
  } catch {
    visualizers.element.renderBohrAtom(tensor);
  }
}

// ---------------------------------------------------------------------------
// Crucible
// ---------------------------------------------------------------------------
function addElement(symbol, moles = 1) {
  if (!TENSOR_BY_SYMBOL[symbol]) return;
  if (!state.staged.has(symbol)) state.staged.set(symbol, moles);
  renderCrucible();
  applyFilter();
  pulseStageButton();
}

function removeElement(symbol) {
  state.staged.delete(symbol);
  renderCrucible();
  applyFilter();
}

function clearCrucible() {
  state.staged.clear();
  renderCrucible();
  applyFilter();
  $('#reaction-result-card')?.classList.add('hidden');
}

function renderCrucible() {
  const list = $('#crucible-elements-list');
  if (!list) return;
  const count = state.staged.size;
  $('#crucible-count-label').textContent = `(${count} element${count === 1 ? '' : 's'} staged)`;

  if (!count) {
    list.innerHTML = `
      <div class="crucible-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M10 2v7.5L4.5 19.5A2 2 0 006.3 22h11.4a2 2 0 001.8-2.5L14 9.5V2"/>
          <path d="M8.5 2h7"/><path d="M7 16h10"/>
        </svg>
        <p>Stage elements from the table above, or load a reference composition.</p>
      </div>`;
    return;
  }

  list.innerHTML = [...state.staged.entries()].map(([symbol, moles]) => {
    const t = TENSOR_BY_SYMBOL[symbol];
    return `
      <div class="crucible-element-chip" data-symbol="${esc(symbol)}" style="--chip-color:${esc(t.color || '#38bdf8')}">
        <span class="chip-symbol">${esc(symbol)}</span>
        <span class="chip-meta">
          <span class="chip-name">${esc(t.name)}</span>
          <span class="chip-z mono">Z ${t.Z} · ${titleCase(t.category)}</span>
        </span>
        <span class="chip-moles-field">
          <input class="chip-moles" type="number" min="0.01" step="0.1" value="${moles}" aria-label="Moles of ${esc(t.name)}" data-moles="${esc(symbol)}">
          <span class="chip-unit">mol</span>
        </span>
        <button class="chip-remove" data-remove="${esc(symbol)}" aria-label="Remove ${esc(t.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>`;
  }).join('');
}

function bindCrucibleEvents() {
  const list = $('#crucible-elements-list');
  list.addEventListener('input', (event) => {
    const input = event.target.closest('[data-moles]');
    if (!input) return;
    const symbol = input.dataset.moles;
    const value = Math.max(0.01, Number(input.value) || 0.01);
    state.staged.set(symbol, value);
    updateConditionReadout();
  });
  list.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-remove]');
    if (btn) removeElement(btn.dataset.remove);
  });
  $('#clear-crucible-btn').addEventListener('click', clearCrucible);
}

function pulseStageButton() {
  const btn = $('#synthesize-btn');
  if (!btn) return;
  btn.classList.remove('pulse');
  void btn.offsetWidth;
  btn.classList.add('pulse');
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------
function updateConditionReadout() {
  const P = Math.pow(10, state.logP);
  const readout = $('#condition-readout');
  if (readout) readout.textContent = `${Math.round(state.T)} K · ${fmtSci(P)} bar`;
  const pressureDisplay = $('#pressure-display');
  if (pressureDisplay) pressureDisplay.textContent = `${fmtSci(P)} bar`;
  const tempDisplay = $('#temp-display');
  if (tempDisplay) tempDisplay.textContent = `${Math.round(state.T)} K · ${fmt(state.T - 273.15, 1)} °C`;
  const phaseBadge = $('#thermal-phase-indicator');
  if (phaseBadge) {
    const label = state.T < 200 ? 'CRYOGENIC'
      : state.T < 373 ? 'STANDARD AMBIENT'
      : state.T < 1000 ? 'INCANDESCENT'
      : state.T < 3000 ? 'HIGH-TEMPERATURE'
      : 'STELLAR REGIME';
    phaseBadge.textContent = label;
  }
}

// ---------------------------------------------------------------------------
// Compute + render
// ---------------------------------------------------------------------------
async function compute() {
  if (state.busy) return;
  if (!state.staged.size) {
    showStatus('Stage at least one element before computing.', 'warn');
    return;
  }
  state.busy = true;
  const btn = $('#synthesize-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  const input = {
    elements: [...state.staged.entries()].map(([symbol, moles]) => ({ symbol, moles })),
    T: state.T,
    P: Math.pow(10, state.logP),
    supercell: state.supercell,
  };

  try {
    const result = await runReaction(input);
    state.lastResult = result;
    renderResult(result, input);
  } catch (error) {
    showStatus(`Reaction failed: ${error.message}`, 'error');
  } finally {
    state.busy = false;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function showStatus(message, tone = 'info') {
  const banner = $('#reaction-status');
  if (!banner) return;
  banner.className = `status-banner ${tone}`;
  banner.textContent = message;
  banner.classList.remove('hidden');
  $('#reaction-result-card')?.classList.remove('hidden');
}

function renderResult(result, input) {
  const card = $('#reaction-result-card');
  card.classList.remove('hidden');

  $('#reaction-equation').textContent = result.equationHTML || result.equation;
  $('#reaction-equation-note').textContent = result.inert
    ? 'No product survives the Gibbs minimisation at this state; reactants remain as elements.'
    : `${result.products.length} product species · ${result.candidates.length} candidate species evaluated`;

  const th = result.thermodynamics;
  const primary = result.primary;

  // Status banner
  const status = $('#reaction-status');
  status.classList.remove('hidden');
  if (result.inert) {
    status.className = 'status-banner inert';
    status.textContent = 'Kinetically / thermodynamically inert: no accessible product at this temperature and pressure.';
  } else if (th.spontaneous) {
    status.className = 'status-banner success';
    status.textContent = `Spontaneous at ${Math.round(th.temperature)} K · ΔG = ${fmt(th.deltaG, 1)} kJ per stoichiometric unit · K ≈ ${fmtSci(th.equilibriumConstant)}`;
  } else {
    status.className = 'status-banner warn';
    status.textContent = `Not spontaneous at ${Math.round(th.temperature)} K · ΔG = ${fmt(th.deltaG, 1)} kJ · the reverse direction is favoured.`;
  }

  // Headline metrics
  const bondLabel = primary?.bonding
    ? `${primary.bonding.label}${primary.bonding.ionicCharacter != null ? ` · ${Math.round(primary.bonding.ionicCharacter)}% ionic` : ''}`
    : result.inert ? 'Inert' : '—';
  setText('#reaction-bond-badge', bondLabel);
  setText('#reaction-delta-en', primary?.bonding ? fmt(primary.bonding.deltaChi, 2) : '—');
  setText('#reaction-enthalpy', `${fmt(th.deltaH, 1)} kJ`);
  setText('#reaction-gibbs', `${fmt(th.deltaG, 1)} kJ`);
  setText('#reaction-geometry', primary?.geometry
    ? (primary.geometry.mode === 'crystal'
      ? titleCase(primary.geometry.lattice || 'crystal')
      : primary.geometry.shape || 'molecule')
    : '—');
  setText('#reaction-coordination', primary?.geometry?.coordination != null
    ? `${primary.geometry.coordination}`
    : primary?.geometry?.domains != null ? `${primary.geometry.domains} domains` : '—');

  // Narrative
  const title = primary
    ? `${primary.name || primary.formula}${primary.formula !== primary.name ? ` · ${primary.formula}` : ''}`
    : 'No product';
  setText('#reaction-title-heading', title);
  const descBits = [];
  if (primary) {
    descBits.push(`${titleCase(primary.kind)} species in the ${primary.phase} phase.`);
    if (primary.metastable) descBits.push('Metastable: kinetically trapped but thermally accessible at this temperature.');
    if (primary.estimated) descBits.push('Thermochemistry is estimated from first-principles bond / Born–Haber models.');
    if (primary.geometry?.description) descBits.push(primary.geometry.description);
  } else {
    descBits.push('The element inventory is preserved, but no compound lowers the Gibbs energy at this state.');
  }
  setText('#reaction-description', descBits.join(' '));

  // Mechanism
  const mech = [];
  if (primary?.bonding) {
    const b = primary.bonding;
    mech.push(`Bond polarity (van Arkel–Ketelaar): ${Math.round((b.ionic || 0) * 100)}% ionic character · ${Math.round((b.covalent || 0) * 100)}% covalent · ${Math.round((b.metallic || 0) * 100)}% metallic (Δχ = ${fmt(b.deltaChi, 2)}).`);
  }
  if (primary?.geometry?.mode === 'molecule') {
    mech.push(`${primary.geometry.domains} VSEPR domains with ${primary.geometry.lonePairs} lone pair${primary.geometry.lonePairs === 1 ? '' : 's'} on ${primary.geometry.centralAtom}; ${primary.geometry.hybridization} hybridisation, average angle ${fmt(primary.geometry.averageAngle, 1)}°.`);
  } else if (primary?.geometry?.mode === 'crystal') {
    mech.push(`${primary.geometry.description} Coordination number ${primary.geometry.coordination}, packing fraction ${fmt(primary.geometry.packingFraction, 2)}.`);
  }
  if (result.telemetry?.alloy) {
    const a = result.telemetry.alloy;
    const verdict = a.singlePhase ? 'single-phase solid solution' : 'multi-phase / limited solubility';
    mech.push(`Hume–Rothery solid-solution analysis: worst Δr = ${fmt((a.worstSizeMismatch || 0) * 100, 1)}%, Δχ = ${fmt(a.worstDeltaChi, 2)}, VEC = ${fmt(a.vec, 2)} → ${verdict}.`);
  }
  if (result.excluded?.length) {
    mech.push(`Kinetic exclusions: ${result.excluded.map((e) => `${e.formula} (Ea ${fmt(e.barrier?.Ea, 0)} kJ/mol, onset ${fmt(e.barrier?.thresholdT, 0)} K)`).join('; ')}.`);
  }
  setText('#reaction-mechanism', mech.join(' ') || 'No bonding mechanism: the staged inventory is already at its standard-state minimum.');

  // Thermodynamic state list
  $('#reaction-thermo').innerHTML = [
    ['Enthalpy ΔH', `${fmt(th.deltaH, 1)} kJ`],
    ['Entropy ΔS', `${fmt(th.deltaS, 2)} J/K`],
    ['Gibbs ΔG', `${fmt(th.deltaG, 1)} kJ`],
    ['Equilibrium K', fmtSci(th.equilibriumConstant)],
    ['Regime', titleCase(th.regime)],
    ['Temperature', `${Math.round(th.temperature)} K`],
    ['Pressure', `${fmtSci(th.pressure)} bar`],
    ['Compute time', `${fmt(result.computeMs, 1)} ms`],
  ].map(([k, v]) => `<div class="data-row"><span>${esc(k)}</span><span class="mono">${esc(v)}</span></div>`).join('');

  // Products
  $('#reaction-products').innerHTML = result.products.map((p) => `
    <div class="product-row ${p.leftover ? 'leftover' : ''}">
      <span class="product-formula">${esc(p.formula)}</span>
      <span class="product-meta">
        <span>${fmt(p.moles, 3)} mol</span>
        <span class="phase-chip ${esc(p.phase)}">${esc(PHASE_LABEL[p.phase] || p.phase)}</span>
        <span class="kind-chip">${esc(titleCase(p.kind))}</span>
        ${p.metastable ? '<span class="kind-chip meta">metastable</span>' : ''}
        ${p.estimated ? '<span class="kind-chip est">estimated</span>' : ''}
        ${p.leftover ? '<span class="kind-chip left">unreacted</span>' : ''}
      </span>
      <span class="product-g mono">${p.deltaG == null ? '—' : `${fmt(p.deltaG, 1)} kJ/mol`}</span>
    </div>`).join('') || '<div class="empty-note">No products formed.</div>';

  // Telemetry
  const t = result.telemetry || {};
  const telemetryItems = [
    ['Heaviest element', `${t.heaviest} (Z ${t.Z})`],
    ['Relativistic contraction', `${fmt((t.relativisticContraction || 0) * 100, 2)} %`],
    ['Optical edge', `${fmt(t.opticalEdge, 2)} eV`],
    ['Phase at T', titleCase(t.phaseAtT || '—')],
    ['Valence electrons', t.valence?.electrons ?? '—'],
    ['VEC', t.valence?.vec ?? '—'],
    ['Slater Z_eff', fmt(t.valence?.zEff, 2)],
    ['Ionic potential', fmt(t.ionicPotential, 2)],
    ['Polarizing power', fmt(t.polarizingPower, 2)],
    ['Inert-pair penalty', `${fmt(t.inertPair, 1)} kJ/mol`],
    ['Candidates evaluated', t.candidatesEvaluated ?? '—'],
    ['Kinetic exclusions', t.excludedByKinetics?.length ?? 0],
  ];
  $('#reaction-telemetry').innerHTML = telemetryItems.map(([k, v]) => `
    <div class="telemetry-cell">
      <span class="telemetry-label">${esc(k)}</span>
      <span class="telemetry-value mono">${esc(v)}</span>
    </div>`).join('');

  // Candidates
  const candidates = result.candidates || [];
  const maxAbs = Math.max(1, ...candidates.map((c) => Math.abs(c.deltaG || 0)));
  $('#reaction-candidates').innerHTML = candidates.length ? candidates.slice(0, 12).map((c) => {
    const pct = Math.min(100, (Math.abs(c.deltaG || 0) / maxAbs) * 100);
    const negative = (c.deltaG || 0) < 0;
    return `
      <div class="candidate-row">
        <span class="candidate-formula">${esc(c.formula)}</span>
        <span class="candidate-kind">${esc(titleCase(c.kind))} · ${esc(PHASE_LABEL[c.phase] || c.phase)}</span>
        <span class="candidate-bar"><span style="width:${pct}%;background:${negative ? 'var(--accent-cyan)' : 'var(--accent-rose)'}"></span></span>
        <span class="candidate-g mono">${c.deltaG == null ? '—' : `${fmt(c.deltaG, 1)} kJ`}</span>
        ${c.estimated ? '<span class="kind-chip est">est</span>' : ''}
      </div>`;
  }).join('') : '<div class="empty-note">No compound candidates at this composition.</div>';

  $('#reaction-excluded').innerHTML = result.excluded?.length
    ? `<div class="excluded-head">Excluded by kinetic barrier</div>` + result.excluded.map((e) => `
      <div class="excluded-row"><span class="mono">${esc(e.formula)}</span><span>${esc(e.barrier?.reason || 'barrier')}</span></div>`).join('')
    : '';

  // 3D viewport — a WebGL failure must never invalidate the chemistry result.
  try {
    renderReactionViewport(result);
  } catch (error) {
    const caption = $('#reaction-viewport-caption');
    if (caption) caption.textContent = '3D VIEWPORT UNAVAILABLE';
    const pane = $('#reaction-3d-canvas');
    if (pane) pane.innerHTML = `<div class="viewport-fallback">WebGL context unavailable: ${esc(error.message)}. Thermodynamic and bonding results remain valid.</div>`;
  }
}

function setText(selector, text) {
  const el = $(selector);
  if (el) el.textContent = text;
}

function renderReactionViewport(result) {
  const pane = $('#reaction-3d-canvas');
  if (!pane) return;
  if (!visualizers.reaction) visualizers.reaction = new Visualizer3D('reaction-3d-canvas');

  const primary = result.primary;
  const geometry = primary?.geometry;
  const caption = $('#reaction-viewport-caption');
  const legend = $('#reaction-legend');

  if (geometry?.atoms?.length) {
    visualizers.reaction.renderGeometry(geometry);
    if (caption) {
      caption.textContent = geometry.mode === 'crystal'
        ? `CRYSTAL · ${titleCase(geometry.lattice)} · ${geometry.supercell}× supercell`
        : `MOLECULE · ${geometry.shape}`;
    }
    const seen = new Map();
    for (const atom of geometry.atoms) {
      if (!seen.has(atom.symbol)) seen.set(atom.symbol, atom.color);
    }
    if (legend) {
      legend.innerHTML = [...seen.entries()].map(([symbol, color]) => `
        <span class="legend-item"><span class="legend-dot" style="background:${esc(color)}"></span>${esc(symbol)}</span>`).join('');
    }
  } else {
    visualizers.reaction._clear?.();
    if (caption) caption.textContent = 'NO PRODUCT GEOMETRY';
    if (legend) legend.innerHTML = '';
  }
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------
function parseMix(mix) {
  const out = [];
  for (const part of String(mix).split(',')) {
    const [symbol, moles] = part.split(':');
    if (symbol && TENSOR_BY_SYMBOL[symbol.trim()]) out.push([symbol.trim(), Number(moles) || 1]);
  }
  return out;
}

function bindBenchmarks() {
  $('#benchmark-strip')?.addEventListener('click', (event) => {
    const pill = event.target.closest('.bench-pill');
    if (!pill) return;
    const mix = parseMix(pill.dataset.mix || '');
    state.staged.clear();
    for (const [symbol, moles] of mix) state.staged.set(symbol, moles);
    if (pill.dataset.temp) {
      state.T = Number(pill.dataset.temp);
      const slider = $('#temp-slider');
      if (slider) slider.value = state.T;
    }
    renderCrucible();
    applyFilter();
    updateConditionReadout();
    compute();
  });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
function bindControls() {
  $('#search-input')?.addEventListener('input', (event) => {
    state.search = event.target.value;
    applyFilter();
  });

  $('#category-filters')?.addEventListener('click', (event) => {
    const tab = event.target.closest('.cat-tab');
    if (!tab) return;
    state.category = tab.dataset.category;
    $$('.cat-tab').forEach((t) => t.classList.toggle('active', t === tab));
    applyFilter();
  });

  $('#temp-slider')?.addEventListener('input', (event) => {
    state.T = Number(event.target.value);
    updateConditionReadout();
    applyFilter();
  });

  $('#pressure-slider')?.addEventListener('input', (event) => {
    state.logP = Number(event.target.value);
    updateConditionReadout();
  });

  $('#supercell-select')?.addEventListener('change', (event) => {
    state.supercell = Number(event.target.value);
  });

  $('#synthesize-btn')?.addEventListener('click', compute);

  $('#close-modal-btn')?.addEventListener('click', closeModal);
  $('#element-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'element-modal') closeModal();
  });
  $('#tab-bohr')?.addEventListener('click', () => setModalTab('bohr'));
  $('#tab-allotrope')?.addEventListener('click', () => setModalTab('allotrope'));

  $('#send-to-lab-btn')?.addEventListener('click', () => {
    if (!state.selected) return;
    addElement(state.selected);
    closeModal();
    $('#reaction-lab-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#toggle-spacefilling-modal')?.addEventListener('click', (event) => {
    const on = visualizers.element?.setSpaceFilling();
    event.currentTarget.classList.toggle('active', !!on);
  });
  $('#reset-3d-modal')?.addEventListener('click', () => visualizers.element?.resetView());
  $('#toggle-spacefilling-lab')?.addEventListener('click', (event) => {
    const on = visualizers.reaction?.setSpaceFilling();
    event.currentTarget.classList.toggle('active', !!on);
  });
  $('#reset-3d-lab')?.addEventListener('click', () => visualizers.reaction?.resetView());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!$('#element-modal')?.classList.contains('hidden')) closeModal();
      else if (state.search) {
        state.search = '';
        const input = $('#search-input');
        if (input) input.value = '';
        applyFilter();
      }
    }
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      event.preventDefault();
      $('#search-input')?.focus();
    }
    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.id === 'temp-slider') {
      event.preventDefault();
      compute();
    }
  });

  // Keep the inert "ESC" badge honest.
  const searchKey = $('.search-key-badge');
  if (searchKey) searchKey.textContent = 'ESC';
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function boot() {
  buildPeriodicTable();
  bindCrucibleEvents();
  bindBenchmarks();
  bindControls();
  updateConditionReadout();
  renderCrucible();
  applyFilter();
  startWorker();

  // Hydrate a demonstrative first loading (water) so the instrument is alive.
  state.staged.set('H', 2);
  state.staged.set('O', 1);
  renderCrucible();
  applyFilter();
  compute();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
