# Chemiverse — Periodic System & Universal Reaction Instrument

A first-principles chemistry engine and instrument UI. Stage any combination of
elements, and the reactor derives products from element property tensors,
minimises Gibbs energy under exact atom conservation, balances the equation with
rational arithmetic, and renders the resulting molecule or crystal in 3D.

No reaction lookup table decides the products. Reference formation data is used
where it exists; everything else is computed from electronic structure and bond
models and is labelled **estimated**.

---

## What it does

### 1. The periodic system
- All 118 elements from a curated tensor: configuration, Slater effective
  nuclear charge, Allen and Pauling electronegativity, ionization energies,
  electron affinity, radii, oxidation states, phase data.
- Live thermal regime from 1 K to 6000 K, with state dots updating from melting
  and boiling points.
- Search by name, symbol, or atomic number; filter by category.
- Element inspector with an animated Bohr shell model and the elemental
  standard-state crystal/molecule, plus 21 physical properties.

### 2. The reaction crucible
- Stage one or more elements with real molar amounts.
- Temperature (1–6000 K), pressure (log scale), and supercell size controls.
- Produces a conventional balanced equation, products with phases and
  provenance, Gibbs/enthalpy/entropy state, equilibrium constant, bonding
  regime, VSEPR or lattice geometry, candidate ranking, kinetic exclusions, and
  quantum telemetry.
- Excess elemental reactant is reported as **leftover** and is not written into
  the equation as a spectator.
- Runs in a module worker with a synchronous fallback, so a worker failure does
  not break the result.

### 3. The 3D viewport
- VSEPR molecules from a Thomson-point domain solver, with lone-pair
  compression to the target angle.
- Crystal supercells: BCC, FCC, HCP, B2 (CsCl-type), diamond cubic, zincblende,
  rock salt, CsCl, fluorite, and perovskite.
- Ball-and-stick and space-filling modes, orbit/zoom, auto-rotation, camera
  reset. A WebGL failure shows a fallback without invalidating the chemistry.

---

## Engine architecture

| Subsystem | Responsibility | Main modules |
|---|---|---|
| **A — Element tensors** | Immutable, derived element properties | `data/elements_tensor.js`, `js/engine/physics/electronicConfig.js` |
| **E — Quantum nuance** | Relativistic contraction, inert-pair penalty, optical edge, ionic potential, polarizing power | `js/engine/physics/quantumNuance.js` |
| **C — Bonding continuum** | van Arkel–Ketelaar ionic/covalent/metallic fractions, Hume-Rothery alloys, noble-gas barriers | `js/engine/bonding/` |
| **B — Thermodynamics** | Candidate enumeration, constrained Gibbs minimisation, exact rational balancing | `js/engine/thermodynamics/`, `js/engine/formula.js` |
| **D — Geometry** | Thomson/VSEPR molecules and crystal lattice builders | `js/engine/geometry/` |
| **Orchestration** | Public `react()` API and result shape | `js/engine/reactor.js` |
| **Worker** | Off-main-thread computation | `js/engine/worker.js` |

### How a reaction is computed

1. **Normalise the inventory.** Element symbols become standard-state species
   (H₂, N₂, O₂, F₂, Cl₂, P₄, S₈, or the metallic solid/liquid). Formula inputs
   are parsed into exact atom counts.
2. **Derive tensors.** Each element is expanded into the full property tensor
   used by the rest of the engine.
3. **Enumerate candidates.** Binary charge combinations come from allowed
   oxidation states, filtered so a cation is not more electronegative than its
   anion. Polyatomic ions (OH⁻, CO₃²⁻, NO₃⁻, SO₄²⁻, PO₄³⁻, …) are built from
   composition and charge balancing. Metal mixtures produce solid-solution and
   intermetallic candidates. Noble-gas compounds face a kinetic barrier.
4. **Minimise Gibbs energy.** A dense simplex solves the constrained linear
   program: minimise Σ nᵢ·ΔG_f,i subject to atom conservation. Unreacted
   element channels are included as candidates, so the solver decides the
   extent of reaction rather than a rule.
5. **Balance exactly.** Product and leftover amounts are converted to exact
   rationals, scaled by the LCM of denominators, and reduced by their GCD.
   The displayed equation uses only the consumed reactants.
6. **Assign bonding and geometry.** The primary product gets a
   van Arkel–Ketelaar bond character, then either a VSEPR solve or a crystal
   lattice built from ionic/metallic radii and the predicted structure type.
7. **Report provenance.** Reference formation data is used where available;
   model output is flagged `estimated`. Kinetically excluded species are listed
   with their barrier and onset temperature.

---

## Benchmarks

These are actual outputs from the regression suite:

| Loading | Result | ΔG (kJ) | Geometry |
|---|---|---|---|
| 2 H₂ + O₂ | 2 H₂O | −474.2 | Bent, 104.5° |
| 2 Na + Cl₂ | 2 NaCl | −768.4 | Rock salt, coord. 6 |
| Ti + ½ O₂ | TiO₂ | −890.5 | Rock salt |
| 2 Fe + 1.5 O₂ | Fe₂O₃ | −1471.7 | Rock salt |
| Ca + C + 1.5 O₂ | CaCO₃ | −2267.0 | Rock salt (polyatomic) |
| H₂ + ⅛ S₈ + 2 O₂ | H₂SO₄ | −5519.5 | Tetrahedral molecule |
| ½ N₂ + 1.5 H₂ | NH₃ | −32.8 | Trigonal pyramidal, 107° |
| C + 2 H₂ | CH₄ | −50.7 | Tetrahedral, 109.5° |
| C + O₂ | CO₂ | −394.4 | Linear, 180° |
| Xe + F₂ at 700 K | XeF₂ | −5.0 | Linear, metastable |
| Xe + F₂ at 298 K | no reaction | — | kinetic exclusion |
| Ar + F₂ | no reaction | — | inert |
| Ni + Ti | NiTi | −1.7 | Ordered B2, coord. 8 |
| Co + Cr + Fe + Mn + Ni | CoCrFeMnNi | −4.0 | FCC solid solution |
| Ga + As | GaAs | −76.5 | Zincblende, coord. 4 |
| Na | Na | — | BCC metal |

---

## Data provenance and honesty

- **Reference data** lives in `data/thermo.js` (standard formation enthalpy and
  entropy). When a species has a reference entry, it is used directly.
- **Estimated data** comes from bond-enthalpy summation, Born–Haber cycles with
  Kapustinskii lattice enthalpy, or regular-solution alloy models. Every
  estimated species is marked in the UI.
- **Noble gases** are not blanket-inert. A kinetic barrier is computed from
  ionization energy and partner electron affinity; XeF₂ becomes accessible
  around 540 K, while ArF₂ remains excluded at ordinary temperatures.
- **Inert results** mean no candidate lowers the Gibbs energy at the staged
  conditions. The element inventory is preserved and shown as leftover.

### Known limitations

- Ternary and quaternary oxides are not predicted as single phases. A Y–Ba–Cu–O
  loading produces the separate binary oxides, not YBCO. This is a deliberate
  consequence of the candidate model, not a hidden lookup.
- Intermetallics whose regular-solution mixing enthalpy is positive may be
  missed. For example, U–Fe is reported as inert at 298 K even though UFe₂
  exists; the model does not include a full Miedema compound-formation term.
- Reaction rates, solvents, electrochemistry, pH, and solid-state diffusion
  kinetics are outside the current model.
- Crystal structures are heuristic predictions from radius ratios, VEC, and
  bonding character — not refined crystallographic data.
- The UI supports click-to-stage and search-to-stage; it does not implement
  drag-and-drop.

---

## Run it

The app is plain ES modules with no build step. It must be served over HTTP
because it uses a module worker.

```bash
# from the repository root
python3 -m http.server 8123
# then open http://localhost:8123
```

Any static server works (`npx serve`, `caddy file-server`, etc.).

### Tests

```bash
node tests/engine.test.mjs
```

The suite checks benchmark products and geometries, verifies atom conservation
in every displayed equation, runs all 118 elements at two temperatures, and
performs a deterministic 600-pair binary conservation sweep.

---

## Design

- Obsidian base with translucent glass panels, specular edges, and restrained
  spectral accents.
- Plus Jakarta Sans for the interface and JetBrains Mono for data.
- Element colours come from the tensor palette and are reused in the 3D
  viewport legend.
- Responsive down to phone width; the periodic table scrolls horizontally
  inside its stage, while the rest of the layout stacks.
- Reduced-motion preference disables animation.

---

## Repository layout

```
index.html                  instrument markup
css/style.css               design system and engine UI
js/app.js                   UI state, rendering, worker calls
js/molecule3d.js            Three.js Bohr/molecule/crystal renderer
js/engine/reactor.js        public react() orchestration
js/engine/worker.js         module worker entry
js/engine/physics/          element derivation and quantum nuance
js/engine/bonding/          bond character, Hume-Rothery, noble-gas barrier
js/engine/thermodynamics/   candidates, Gibbs LP, exact balancing, energy model
js/engine/geometry/         VSEPR/Thomson and crystal lattices
js/engine/species.js        composition and species construction
js/engine/formula.js        formula parsing and composition arithmetic
data/elements.js            curated element records
data/elements_tensor.js     118-element immutable tensor
data/thermo.js              reference formation data
tests/engine.test.mjs       regression and conservation suite
```

Legacy files `data/reactions.js` and `js/reaction-engine.js` are retained from
the initial release but are not imported by the current module app.
