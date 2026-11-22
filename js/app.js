// Main Application Logic
// Orchestrates Periodic Table Grid, Element Details Modal, 3D Visualizer, and Multi-Element Crucible

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Engines
  const reactionEngine = new ReactionEngine(ELEMENTS_DATA, CURATED_REACTIONS);
  let elementVisualizer = null;
  let reactionVisualizer = null;

  // Sound synthesizer for reactions using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'react') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'inert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // State
  let currentTemperature = 293.15; // 20°C in Kelvin
  let selectedElement = null;
  let crucibleElements = []; // List of symbols in the crucible, e.g. ['Ti', 'N']

  // Category labels
  const categoryNames = {
    'alkali-metal': 'Alkali Metal',
    'alkaline-earth': 'Alkaline Earth',
    'transition-metal': 'Transition Metal',
    'post-transition-metal': 'Post-Transition Metal',
    'metalloid': 'Metalloid',
    'reactive-nonmetal': 'Reactive Nonmetal',
    'halogen': 'Halogen',
    'noble-gas': 'Noble Gas',
    'lanthanide': 'Lanthanide',
    'actinide': 'Actinide'
  };

  // DOM Elements
  const periodicGrid = document.getElementById('periodic-grid');
  const lanthanideRow = document.getElementById('lanthanides-grid');
  const actinideRow = document.getElementById('actinides-grid');
  const searchInput = document.getElementById('search-input');
  const categoryFilters = document.getElementById('category-filters');
  const tempSlider = document.getElementById('temp-slider');
  const tempDisplay = document.getElementById('temp-display');
  const thermalPhaseIndicator = document.getElementById('thermal-phase-indicator');

  // Modal DOM
  const elementModal = document.getElementById('element-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalSymbol = document.getElementById('modal-symbol');
  const modalNumber = document.getElementById('modal-number');
  const modalName = document.getElementById('modal-name');
  const modalMass = document.getElementById('modal-mass');
  const modalCategoryBadge = document.getElementById('modal-category-badge');
  const modalStateBadge = document.getElementById('modal-state-badge');
  const modalSummary = document.getElementById('modal-summary');
  const modalPropertiesList = document.getElementById('modal-properties-list');
  const sendToLabBtn = document.getElementById('send-to-lab-btn');

  // 3D Canvas Tabs in Modal
  const tabBohr = document.getElementById('tab-bohr');
  const tabAllotrope = document.getElementById('tab-allotrope');
  const toggleSpaceFillingModal = document.getElementById('toggle-spacefilling-modal');
  const reset3DModal = document.getElementById('reset-3d-modal');

  // Multi-Element Crucible DOM
  const crucibleList = document.getElementById('crucible-elements-list');
  const crucibleCountLabel = document.getElementById('crucible-count-label');
  const clearCrucibleBtn = document.getElementById('clear-crucible-btn');
  const reactBtn = document.getElementById('synthesize-btn');

  // Reaction Result DOM
  const reactionResultCard = document.getElementById('reaction-result-card');
  const reactionEquation = document.getElementById('reaction-equation');
  const reactionBondBadge = document.getElementById('reaction-bond-badge');
  const reactionDeltaEn = document.getElementById('reaction-delta-en');
  const reactionEnthalpy = document.getElementById('reaction-enthalpy');
  const reactionGeometry = document.getElementById('reaction-geometry');
  const reactionTitleHeading = document.getElementById('reaction-title-heading');
  const reactionDescription = document.getElementById('reaction-description');
  const reactionMechanism = document.getElementById('reaction-mechanism');
  const toggleSpaceFillingLab = document.getElementById('toggle-spacefilling-lab');
  const reset3DLab = document.getElementById('reset-3d-lab');
  const presetButtons = document.querySelectorAll('.bench-pill[data-elements], .preset-btn[data-elements]');

  // 2. Render Periodic Table Grid
  function renderPeriodicTable() {
    periodicGrid.innerHTML = '';
    lanthanideRow.innerHTML = '';
    actinideRow.innerHTML = '';

    const gridMatrix = Array(7).fill(null).map(() => Array(18).fill(null));
    const lanthanides = [];
    const actinides = [];

    ELEMENTS_DATA.forEach(el => {
      if (el.number >= 57 && el.number <= 71) {
        lanthanides.push(el);
        return;
      }
      if (el.number >= 89 && el.number <= 103) {
        actinides.push(el);
        return;
      }
      const row = el.period - 1;
      const col = el.group - 1;
      if (row >= 0 && row < 7 && col >= 0 && col < 18) {
        gridMatrix[row][col] = el;
      }
    });

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 18; c++) {
        if (r === 5 && c === 2) {
          const placeholder = document.createElement('div');
          placeholder.className = 'element-cell placeholder-cell lanthanide-placeholder';
          placeholder.innerHTML = `<span class="symbol">57-71</span><span class="name">La-Lu</span>`;
          placeholder.title = 'Lanthanide Series';
          periodicGrid.appendChild(placeholder);
          continue;
        }
        if (r === 6 && c === 2) {
          const placeholder = document.createElement('div');
          placeholder.className = 'element-cell placeholder-cell actinide-placeholder';
          placeholder.innerHTML = `<span class="symbol">89-103</span><span class="name">Ac-Lr</span>`;
          placeholder.title = 'Actinide Series';
          periodicGrid.appendChild(placeholder);
          continue;
        }

        const el = gridMatrix[r][c];
        if (el) {
          const cell = createElementCell(el);
          periodicGrid.appendChild(cell);
        } else {
          const empty = document.createElement('div');
          empty.className = 'empty-cell';
          periodicGrid.appendChild(empty);
        }
      }
    }

    lanthanides.forEach(el => lanthanideRow.appendChild(createElementCell(el)));
    actinides.forEach(el => actinideRow.appendChild(createElementCell(el)));
  }

  function createElementCell(el) {
    const cell = document.createElement('div');
    cell.className = `element-cell ${el.category}`;
    cell.dataset.symbol = el.symbol;
    cell.dataset.number = el.number;
    cell.dataset.name = el.name.toLowerCase();
    cell.dataset.category = el.category;

    const state = computeStateAtTemp(el, currentTemperature);
    cell.dataset.state = state;

    cell.innerHTML = `
      <div class="cell-header">
        <span class="atomic-num">${el.number}</span>
        <span class="state-dot ${state.toLowerCase()}" title="${state} at ${currentTemperature}K"></span>
      </div>
      <div class="symbol">${el.symbol}</div>
      <div class="name">${el.name}</div>
      <div class="mass">${typeof el.mass === 'number' ? el.mass.toFixed(2) : el.mass}</div>
    `;

    cell.addEventListener('click', () => {
      playSound('click');
      openElementModal(el);
    });

    cell.setAttribute('draggable', 'true');
    cell.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', el.symbol);
      e.dataTransfer.effectAllowed = 'copy';
    });

    return cell;
  }

  function computeStateAtTemp(el, tempK) {
    if (el.melting_point === null || el.boiling_point === null) {
      return el.state || 'Solid';
    }
    const mpK = el.melting_point + 273.15;
    const bpK = el.boiling_point + 273.15;
    if (tempK < mpK) return 'Solid';
    if (tempK >= mpK && tempK < bpK) return 'Liquid';
    return 'Gas';
  }

  // 3. Search and Category Filtering
  function filterElements() {
    const query = searchInput.value.trim().toLowerCase();
    const activeCategory = document.querySelector('.cat-tab.active')?.dataset.category || 'all';

    document.querySelectorAll('.element-cell:not(.placeholder-cell)').forEach(cell => {
      const sym = cell.dataset.symbol.toLowerCase();
      const name = cell.dataset.name.toLowerCase();
      const num = cell.dataset.number;
      const cat = cell.dataset.category;

      const matchesQuery = !query || sym.includes(query) || name.includes(query) || num === query;
      const matchesCategory = activeCategory === 'all' || cat === activeCategory;

      if (matchesQuery && matchesCategory) {
        cell.classList.remove('dimmed');
      } else {
        cell.classList.add('dimmed');
      }
    });
  }

  searchInput.addEventListener('input', filterElements);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      filterElements();
      searchInput.blur();
    }
  });

  categoryFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-tab');
    if (!pill) return;
    document.querySelectorAll('.cat-tab').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    filterElements();
  });

  function getThermalRegimeText(tempK) {
    if (tempK <= 50) return 'CRYOGENIC CONDENSED';
    if (tempK < 273.15) return 'SUB-FREEZING SOLID';
    if (tempK >= 273.15 && tempK <= 373.15) return 'STANDARD AMBIENT (STP)';
    if (tempK > 373.15 && tempK <= 1500) return 'THERMAL LIQUEFACTION';
    if (tempK > 1500 && tempK <= 3500) return 'HIGH REFRACTORY FLUID';
    return 'VAPOR / ATOMIC GAS';
  }

  tempSlider.addEventListener('input', (e) => {
    currentTemperature = Number(e.target.value);
    const tempC = (currentTemperature - 273.15).toFixed(1);
    tempDisplay.textContent = `${currentTemperature} K · ${tempC} °C`;
    if (thermalPhaseIndicator) {
      thermalPhaseIndicator.textContent = getThermalRegimeText(currentTemperature);
    }

    document.querySelectorAll('.element-cell:not(.placeholder-cell)').forEach(cell => {
      const sym = cell.dataset.symbol;
      const el = reactionEngine.getElement(sym);
      if (el) {
        const state = computeStateAtTemp(el, currentTemperature);
        cell.dataset.state = state;
        const dot = cell.querySelector('.state-dot');
        if (dot) {
          dot.className = `state-dot ${state.toLowerCase()}`;
          dot.title = `${state} at ${currentTemperature}K`;
        }
      }
    });
  });

  // 4. Element Details Modal & 3D Visualization
  function openElementModal(el) {
    selectedElement = el;

    modalSymbol.textContent = el.symbol;
    modalNumber.textContent = `Z = ${el.number}`;
    modalName.textContent = el.name;
    modalMass.textContent = `${el.mass} u`;

    modalCategoryBadge.textContent = categoryNames[el.category] || el.category;
    modalCategoryBadge.className = `glass-badge ${el.category}`;

    const state = computeStateAtTemp(el, currentTemperature);
    modalStateBadge.textContent = `${state} at ${currentTemperature}K`;
    modalStateBadge.className = `glass-badge state-${state.toLowerCase()}`;

    modalSummary.textContent = el.summary || '';

    const props = [
      { label: 'Electron Configuration', val: el.electron_config || el.config_condensed },
      { label: 'Valence Shells (e⁻)', val: el.shells.join(' - ') },
      { label: 'Electronegativity (Pauling)', val: el.electronegativity ?? 'Inert / N/A' },
      { label: 'Atomic Radius', val: el.atomic_radius ? `${el.atomic_radius} pm` : 'N/A' },
      { label: 'Common Oxidation States', val: el.oxidation_states || 'N/A' },
      { label: 'Melting Point', val: el.melting_point !== null ? `${el.melting_point} °C (${(el.melting_point + 273.15).toFixed(1)} K)` : 'N/A' },
      { label: 'Boiling Point', val: el.boiling_point !== null ? `${el.boiling_point} °C (${(el.boiling_point + 273.15).toFixed(1)} K)` : 'N/A' },
      { label: 'Density', val: el.density ? `${el.density} g/cm³` : 'N/A' },
      { label: 'Block', val: `${el.block}-block` },
      { label: 'Group / Period', val: `Group ${el.group}, Period ${el.period}` },
      { label: 'Standard Elemental State', val: el.allotrope_form || el.state },
      { label: 'Discovery', val: `${el.discovered} by ${el.discoverer}` }
    ];

    modalPropertiesList.innerHTML = props.map(p => `
      <div class="prop-item">
        <span class="prop-label">${p.label}</span>
        <span class="prop-val">${p.val}</span>
      </div>
    `).join('');

    if (!elementVisualizer) {
      elementVisualizer = new Visualizer3D('element-3d-canvas');
    }

    setActiveModal3DTab('bohr');
    elementVisualizer.renderBohrAtom(el);
    elementModal.classList.remove('hidden');
  }

  function closeModal() {
    elementModal.classList.add('hidden');
  }

  closeModalBtn.addEventListener('click', closeModal);
  elementModal.addEventListener('click', (e) => {
    if (e.target === elementModal) closeModal();
  });

  function setActiveModal3DTab(mode) {
    if (mode === 'bohr') {
      tabBohr.classList.add('active');
      tabAllotrope.classList.remove('active');
      if (elementVisualizer && selectedElement) {
        elementVisualizer.renderBohrAtom(selectedElement);
      }
    } else {
      tabAllotrope.classList.add('active');
      tabBohr.classList.remove('active');
      if (elementVisualizer && selectedElement) {
        const homo = reactionEngine.handleHomonuclear(selectedElement);
        elementVisualizer.renderMolecule(homo.model);
      }
    }
  }

  tabBohr.addEventListener('click', () => setActiveModal3DTab('bohr'));
  tabAllotrope.addEventListener('click', () => setActiveModal3DTab('allotrope'));

  toggleSpaceFillingModal.addEventListener('click', () => {
    if (elementVisualizer) {
      const isSpace = elementVisualizer.toggleSpaceFilling();
      toggleSpaceFillingModal.classList.toggle('active', isSpace);
      if (tabAllotrope.classList.contains('active')) {
        const homo = reactionEngine.handleHomonuclear(selectedElement);
        elementVisualizer.renderMolecule(homo.model);
      }
    }
  });

  reset3DModal.addEventListener('click', () => {
    if (elementVisualizer) elementVisualizer.resetView();
  });

  sendToLabBtn.addEventListener('click', () => {
    if (!selectedElement) return;
    addCrucibleElement(selectedElement.symbol);
    closeModal();
    document.getElementById('reaction-lab-section').scrollIntoView({ behavior: 'smooth' });
  });

  // 5. Multi-Element Reaction Crucible Logic
  function renderCrucible() {
    crucibleList.innerHTML = '';
    crucibleCountLabel.textContent = `(${crucibleElements.length} element${crucibleElements.length === 1 ? '' : 's'} staged)`;

    if (crucibleElements.length === 0) {
      crucibleList.innerHTML = `
        <div class="crucible-empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10 2v7.5L4.5 19.5A2 2 0 006.3 22h11.4a2 2 0 001.8-2.5L14 9.5V2"/>
            <path d="M8.5 2h7"/>
            <path d="M7 16h10"/>
          </svg>
          <div style="font-weight: 700; color: #f1f5f9;">Crucible is Empty</div>
          <div style="font-size: 0.8rem;">Click any element on the periodic table above, or drag and drop elements here</div>
        </div>
      `;
      reactBtn.setAttribute('disabled', 'true');
      return;
    }

    reactBtn.removeAttribute('disabled');

    crucibleElements.forEach((sym, idx) => {
      const el = reactionEngine.getElement(sym);
      if (!el) return;

      const chip = document.createElement('div');
      chip.className = `crucible-element-chip ${el.category}`;
      chip.innerHTML = `
        <div class="chip-symbol">${el.symbol}</div>
        <div class="chip-details">
          <div class="chip-name">${el.name}</div>
          <div class="chip-meta">Z=${el.number} · EN: ${el.electronegativity ?? 'N/A'}</div>
        </div>
        <button class="chip-remove-btn" title="Remove element" aria-label="Remove element">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      `;

      chip.querySelector('.chip-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCrucibleElement(idx);
      });

      crucibleList.appendChild(chip);
    });
  }

  function addCrucibleElement(sym) {
    playSound('click');
    crucibleElements.push(sym);
    renderCrucible();
  }

  function removeCrucibleElement(idx) {
    crucibleElements.splice(idx, 1);
    renderCrucible();
  }

  clearCrucibleBtn.addEventListener('click', () => {
    crucibleElements = [];
    renderCrucible();
    reactionResultCard.classList.add('hidden');
  });

  // Drag-and-drop into Crucible
  crucibleList.addEventListener('dragover', (e) => {
    e.preventDefault();
    crucibleList.classList.add('drag-over');
  });
  crucibleList.addEventListener('dragleave', () => {
    crucibleList.classList.remove('drag-over');
  });
  crucibleList.addEventListener('drop', (e) => {
    e.preventDefault();
    crucibleList.classList.remove('drag-over');
    const sym = e.dataTransfer.getData('text/plain');
    if (sym && reactionEngine.getElement(sym)) {
      addCrucibleElement(sym);
    }
  });

  // Synthesize Mixture Button
  reactBtn.addEventListener('click', () => {
    if (crucibleElements.length === 0) return;

    const result = reactionEngine.reactMixture(crucibleElements);
    if (result.isInert) {
      playSound('inert');
    } else {
      playSound('react');
    }

    displayReactionResult(result);
  });

  function displayReactionResult(res) {
    reactionResultCard.classList.remove('hidden');

    reactionEquation.textContent = res.equation || res.formula;
    reactionBondBadge.textContent = res.bond_type || 'Chemical Compound';
    reactionBondBadge.className = `glass-badge ${res.isInert ? 'badge-inert' : 'badge-bond'}`;

    reactionDeltaEn.textContent = res.delta_en !== null ? `ΔEN = ${res.delta_en}` : 'ΔEN: N/A';
    reactionEnthalpy.textContent = res.enthalpy || 'N/A';
    reactionGeometry.textContent = res.geometry || 'Coordination Geometry';

    reactionTitleHeading.textContent = `${res.name || res.formula}`;
    reactionDescription.textContent = res.description || 'Compound synthesized according to electronic rules.';
    reactionMechanism.textContent = res.mechanism || 'Valence electron exchange and orbital hybridization.';

    if (!reactionVisualizer) {
      reactionVisualizer = new Visualizer3D('reaction-3d-canvas');
    }

    if (res.model) {
      reactionVisualizer.renderMolecule(res.model);
    }

    reactionResultCard.scrollIntoView({ behavior: 'smooth' });
  }

  toggleSpaceFillingLab.addEventListener('click', () => {
    if (reactionVisualizer) {
      const isSpace = reactionVisualizer.toggleSpaceFilling();
      toggleSpaceFillingLab.classList.toggle('active', isSpace);
      if (crucibleElements.length > 0) {
        const res = reactionEngine.reactMixture(crucibleElements);
        if (res.model) reactionVisualizer.renderMolecule(res.model);
      }
    }
  });

  reset3DLab.addEventListener('click', () => {
    if (reactionVisualizer) reactionVisualizer.resetView();
  });

  // Preset Buttons (supports multi-element, e.g. "Ti,N", "C,H,O", "Fe,Cr,Ni,C")
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const elements = btn.dataset.elements.split(',').map(s => s.trim());
      crucibleElements = elements;
      renderCrucible();
      reactBtn.click();
    });
  });

  // Initial Setup: default to Titanium + Nitrogen
  renderPeriodicTable();
  crucibleElements = ['Ti', 'N'];
  renderCrucible();
  reactBtn.click();
});
