// Universal Chemical Reaction Engine (Multi-Element & High-Entropy Synthesis)
// Supports arbitrary N-element mixtures (1, 2, 3, 4, 5+ elements), polyatomics, alloys, and organics

class ReactionEngine {
  constructor(elementsData, curatedReactions) {
    this.elements = {};
    elementsData.forEach(el => {
      this.elements[el.symbol] = el;
    });
    this.curated = Object.assign({}, curatedReactions || {});
    this.customReactions = {};
  }

  getElement(symbol) {
    return this.elements[symbol];
  }

  // Register user or AI Studio imported reactions
  addCustomReaction(key, data) {
    this.customReactions[key] = data;
    this.curated[key] = data;
  }

  // Helper to calculate Greatest Common Divisor
  gcd(a, b) {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // Multi-element synthesis entry point
  reactMixture(elementList) {
    if (!elementList || elementList.length === 0) {
      return { success: false, error: "Crucible is empty. Add elements to react." };
    }

    // Normalize input list: can be strings ['H', 'O'] or objects [{symbol: 'H', count: 2}, ...]
    const items = elementList.map(item => {
      if (typeof item === 'string') return { symbol: item, count: 1 };
      return { symbol: item.symbol, count: item.count || 1 };
    });

    const uniqueSymbols = Array.from(new Set(items.map(i => i.symbol))).sort();

    // 1. Single element
    if (uniqueSymbols.length === 1) {
      const el = this.elements[uniqueSymbols[0]];
      return this.handleHomonuclear(el);
    }

    // 2. Check Curated & Custom Database (exact match on sorted key)
    const exactKey = uniqueSymbols.join("-");
    if (this.curated[exactKey]) {
      const cur = this.curated[exactKey];
      return {
        success: true,
        isCurated: true,
        ...cur,
        elementsInvolved: uniqueSymbols.map(s => this.elements[s])
      };
    }

    // 3. Binary Reaction (N = 2)
    if (uniqueSymbols.length === 2) {
      return this.reactBinary(uniqueSymbols[0], uniqueSymbols[1]);
    }

    // 4. Multi-Element Complex Synthesis (N >= 3)
    return this.reactMultiComplex(uniqueSymbols, items);
  }

  // Legacy/Binary wrapper
  react(sym1, sym2) {
    return this.reactMixture([sym1, sym2]);
  }

  reactBinary(sym1, sym2) {
    const el1 = this.elements[sym1];
    const el2 = this.elements[sym2];

    if (!el1 || !el2) return { success: false, error: "Invalid element symbol" };

    // Check Noble Gases
    const isNoble1 = el1.category === "noble-gas";
    const isNoble2 = el2.category === "noble-gas";

    if (isNoble1 || isNoble2) {
      const noble = isNoble1 ? el1 : el2;
      const other = isNoble1 ? el2 : el1;
      return this.handleNobleGas(noble, other);
    }

    const en1 = el1.electronegativity || 1.5;
    const en2 = el2.electronegativity || 1.5;
    const deltaEN = Math.abs(en1 - en2);

    const isMetal1 = this.isMetal(el1);
    const isMetal2 = this.isMetal(el2);

    // Metal + Metal
    if (isMetal1 && isMetal2) {
      return this.handleAlloy(el1, el2, deltaEN);
    }

    // Metal + Non-metal
    if ((isMetal1 && !isMetal2) || (!isMetal1 && isMetal2)) {
      const metal = isMetal1 ? el1 : el2;
      const nonmetal = isMetal1 ? el2 : el1;
      return this.handleIonic(metal, nonmetal, deltaEN);
    }

    // Non-metal + Non-metal
    return this.handleCovalent(el1, el2, deltaEN);
  }

  // Multi-Element Complex Handler (N >= 3)
  reactMultiComplex(symbols, items) {
    const elementObjects = symbols.map(s => this.elements[s]);
    const nobles = elementObjects.filter(el => el.category === "noble-gas");
    const reactives = elementObjects.filter(el => el.category !== "noble-gas");

    // Noble gas spectator condition
    if (nobles.length > 0 && reactives.length === 0) {
      return {
        success: false,
        isInert: true,
        formula: "Unreacted Noble Gas Mixture",
        name: `Inert Mixture of ${nobles.map(n => n.name).join(", ")}`,
        equation: `${nobles.map(n => n.symbol).join(" + ")} ↛ No Chemical Reaction`,
        bond_type: "Inert (Zero Valence Bonding)",
        delta_en: 0.0,
        enthalpy: "ΔG > 0 (Thermodynamically Barred)",
        geometry: "Unbound Gas Collision State",
        state: "Gas Mixture at STP",
        description: "All selected components are noble gases with completely filled valence subshells. Collisions result solely in elastic scattering without electron exchange or chemical bonding.",
        mechanism: "Closed shell configurations preclude covalent hybridization or ionic electron transfer under all standard conditions.",
        model: this.generateMultiCluster(nobles, false),
        elementsInvolved: elementObjects
      };
    }

    const metals = reactives.filter(el => this.isMetal(el));
    const nonmetals = reactives.filter(el => !this.isMetal(el));

    // Case A: All Metals -> High-Entropy Alloy / Multi-Component Intermetallic
    if (nonmetals.length === 0 && metals.length >= 3) {
      const formula = metals.map(m => m.symbol).join("");
      const names = metals.map(m => m.name).join("-");
      return {
        success: true,
        isAlloy: true,
        formula: `${formula} (HEA Matrix)`,
        name: `${names} Multi-Component High-Entropy Alloy (HEA)`,
        equation: `${metals.map(m => m.symbol + "(l)").join(" + ")} → ${formula}(s)`,
        bond_type: "Multi-Component Metallic Bonding (Delocalized Electron Sea)",
        delta_en: 0.25,
        enthalpy: "High Mixing Entropy ΔS_mix (Thermodynamically Stabilized Solid Solution)",
        geometry: "Close-Packed Multi-Element Solid Solution (BCC/FCC disordered matrix)",
        state: "Superhard / Corrosion-Resistant Metallic Solid",
        description: `High-Entropy Alloy (HEA) comprising ${metals.length} metallic constituents in near-equiatomic proportions. High configurational entropy (ΔS_mix ≥ 1.5R) stabilizes a single solid-solution crystal phase over brittle intermetallics, yielding extreme strength, thermal stability, and wear resistance.`,
        mechanism: `Atoms of varying radii (${metals.map(m => `${m.symbol}: ${m.atomic_radius || 140}pm`).join(", ")}) create substantial severe lattice distortion. This atomic roughness severely pins dislocation motion, vastly elevating yield stress while retaining ductility through multi-element conduction band hybridization.`,
        model: this.generateMultiCluster(metals, true),
        elementsInvolved: elementObjects
      };
    }

    // Case B: Metals + Nonmetals -> Ternary/Quaternary Oxy-salt / Complex Mineral
    if (metals.length >= 1 && nonmetals.length >= 2) {
      const metalNames = metals.map(m => m.name).join(" ");
      const nonmetalNames = nonmetals.map(m => m.name).join(" ");
      const hasOxygen = nonmetals.some(n => n.symbol === "O");
      const hasHydrogen = nonmetals.some(n => n.symbol === "H");

      let categoryType = "Coordination Complex / Multi-Anion Solid";
      if (hasOxygen && hasHydrogen) categoryType = "Hydrated Oxy-Salt / Hydroxy-Mineral";
      else if (hasOxygen) categoryType = "Complex Metal Oxide / Perovskite Ceramic";

      const formula = metals.map(m => m.symbol).join("") + nonmetals.map(n => n.symbol).join("");

      return {
        success: true,
        formula: `${formula} complex`,
        name: `${metalNames} ${nonmetalNames} ${categoryType}`,
        equation: `${metals.map(m => m.symbol).join(" + ")} + ${nonmetals.map(m => m.symbol).join(" + ")} → Multi-Element Solid Solution`,
        bond_type: "Mixed Ionic-Covalent Polyatomic Network",
        delta_en: 1.8,
        enthalpy: "Negative ΔH (Strongly Exothermic Lattice Formation)",
        geometry: "Extended Coordination Polyhedra (Tetrahedral & Octahedral units)",
        state: "Crystalline Solid at STP",
        description: `Complex multi-element system containing ${metals.length} electropositive cation(s) coordinated with ${nonmetals.length} electronegative covalent/oxyanion network(s). Examples of this class include geological rock-forming silicates, perovskite electroceramics, and synthetic gemstones.`,
        mechanism: `Electrons are transferred from the electropositive metals (${metals.map(m => m.symbol).join(", ")}) to the electronegative nonmetals, which form covalently bound, resonance-stabilized coordination polyhedra with internal polar covalent bonds and external ionic lattice attractions.`,
        model: this.generateMultiCluster([...metals, ...nonmetals], true),
        elementsInvolved: elementObjects
      };
    }

    // Case C: Nonmetals only -> Organic / Polyatomic Macromolecular Network
    if (metals.length === 0 && nonmetals.length >= 3) {
      const formula = nonmetals.map(n => n.symbol).join("");
      return {
        success: true,
        formula: `${formula} (Polyatomic Macromolecule)`,
        name: `${nonmetals.map(n => n.name).join("-")} Covalent Framework`,
        equation: `${nonmetals.map(n => n.symbol).join(" + ")} → ${formula} Macromolecule`,
        bond_type: "Polar Covalent Organic / Inorganic Network",
        delta_en: 0.7,
        enthalpy: "Exothermic Covalent Bond Enthalpy",
        geometry: "Catenated Polyhedral / Branched Framework",
        state: "Organic/Polymer Condensed Phase",
        description: `Multi-element nonmetallic system where atoms satisfy their octets through catenation and localized covalent electron sharing. This stoichiometry represents polymers, amino acids, biomolecules, and covalent organic frameworks (COFs).`,
        mechanism: `Atoms undergo sp, sp², and sp³ hybridizations. Directional σ bonds provide the structural framework, while π systems and electronegativity disparities create localized dipoles and hydrogen-bonding networks.`,
        model: this.generateMultiCluster(nonmetals, true),
        elementsInvolved: elementObjects
      };
    }

    // Fallback
    return {
      success: true,
      formula: symbols.join(""),
      name: `${symbols.join("-")} Multi-Element Compound`,
      equation: `${symbols.join(" + ")} → Multi-Component Product`,
      bond_type: "Mixed Covalent-Ionic",
      delta_en: 1.0,
      enthalpy: "Negative ΔH",
      geometry: "Coordination Matrix",
      state: "Solid/Liquid at STP",
      description: `Multi-element mixture incorporating ${symbols.join(", ")}.`,
      mechanism: "Chemical combination satisfying valence and thermodynamic driving forces.",
      model: this.generateMultiCluster(elementObjects, true),
      elementsInvolved: elementObjects
    };
  }

  isMetal(el) {
    const cats = ["alkali-metal", "alkaline-earth", "transition-metal", "post-transition-metal", "lanthanide", "actinide"];
    return cats.includes(el.category);
  }

  handleHomonuclear(el) {
    const diatomics = ["H", "N", "O", "F", "Cl", "Br", "I"];
    if (diatomics.includes(el.symbol)) {
      const bondOrder = el.symbol === "N" ? 3 : (el.symbol === "O" ? 2 : 1);
      const bondStr = bondOrder === 3 ? "≡" : (bondOrder === 2 ? "=" : "-");
      return {
        success: true,
        formula: `${el.symbol}₂`,
        name: `Diatomic ${el.name} (${el.symbol}${bondStr}${el.symbol})`,
        equation: `2${el.symbol} → ${el.symbol}₂`,
        bond_type: "Non-polar Covalent (Pure Covalent)",
        delta_en: 0.0,
        enthalpy: "0.0 kJ/mol (Standard Reference State)",
        geometry: "Linear Diatomic",
        state: el.state + " at STP",
        description: `Natural elemental form of ${el.name}. Two identical atoms share valence electrons with zero electronegativity difference, forming a pure non-polar covalent bond.`,
        mechanism: `Both ${el.name} atoms have identical electronegativity (${el.electronegativity}). They share ${bondOrder} electron pair(s) equally, achieving closed-shell valence stability without any permanent dipole.`,
        model: {
          atoms: [
            { symbol: el.symbol, x: -0.6, y: 0, z: 0, color: el.color, radius: 0.45 },
            { symbol: el.symbol, x: 0.6, y: 0, z: 0, color: el.color, radius: 0.45 }
          ],
          bonds: [[0, 1, bondOrder]]
        },
        elementsInvolved: [el]
      };
    }

    if (el.category === "noble-gas") {
      return {
        success: true,
        formula: el.symbol,
        name: `Monoatomic ${el.name}`,
        equation: `${el.symbol} (Remains Unbonded)`,
        bond_type: "Monoatomic (Van der Waals interactions only)",
        delta_en: 0.0,
        enthalpy: "0.0 kJ/mol",
        geometry: "Spherical Monoatomic",
        state: "Gas at STP",
        description: `${el.name} possesses a full valence shell. Atoms remain as isolated monoatomic gas particles with only dispersion forces.`,
        mechanism: `With a complete octet/duet, ${el.name} does not form covalent or ionic bonds with itself under standard temperature and pressure.`,
        model: {
          atoms: [
            { symbol: el.symbol, x: 0, y: 0, z: 0, color: el.color, radius: 0.55 }
          ],
          bonds: []
        },
        elementsInvolved: [el]
      };
    }

    return {
      success: true,
      formula: `${el.symbol} (Elemental)`,
      name: `Elemental ${el.name} Lattice`,
      equation: `n${el.symbol} → ${el.symbol}ₙ (Crystal/Allotrope)`,
      bond_type: this.isMetal(el) ? "Metallic Bonding" : "Network Covalent / Polyatomic",
      delta_en: 0.0,
      enthalpy: "0.0 kJ/mol (Standard State)",
      geometry: el.allotrope_form || "Crystal Matrix",
      state: el.state + " at STP",
      description: `Solid elemental state of ${el.name}. Atoms arrange in regular crystal lattice planes.`,
      mechanism: this.isMetal(el) ?
        `Delocalized sea of valence electrons permeates a 3D matrix of ${el.name} cations, providing metallic luster and high electrical conductivity.` :
        `Atoms form directional covalent bonds to create extended allotropic macromolecular structures.`,
      model: this.generateMultiCluster([el, el, el, el, el, el, el], true),
      elementsInvolved: [el]
    };
  }

  handleNobleGas(noble, other) {
    if ((noble.symbol === "Xe" || noble.symbol === "Kr") && (other.symbol === "F" || other.symbol === "O")) {
      return {
        success: true,
        formula: `${noble.symbol}${other.symbol}₂`,
        name: `${noble.name} ${other.name === 'Fluorine' ? 'Difluoride' : 'Dioxide'}`,
        equation: `${noble.symbol}(g) + ${other.symbol}₂(g) → ${noble.symbol}${other.symbol}₂(s) (Under High Energy / UV)`,
        bond_type: "Polar Covalent (Hypervalent 3-center 4-electron)",
        delta_en: Math.abs((other.electronegativity || 3.5) - (noble.electronegativity || 2.6)),
        enthalpy: "-108 kJ/mol (Under extreme synthetic conditions)",
        geometry: "Linear with 3 Equatorial Lone Pairs",
        state: "Solid/Gas under laboratory excitation",
        description: `While ${noble.name} is a noble gas, its valence electrons are far from the nucleus in the ${noble.period}th shell. Strongly oxidizing ${other.name} can overcome the ionization barrier to form a hypervalent compound under controlled laboratory conditions.`,
        mechanism: `Three-center four-electron (3c-4e) molecular orbital bonding. The large radius of ${noble.symbol} allows expansion into empty d-orbitals to coordinate with ${other.symbol}.`,
        model: {
          atoms: [
            { symbol: noble.symbol, x: 0, y: 0, z: 0, color: noble.color, radius: 0.52 },
            { symbol: other.symbol, x: -1.1, y: 0, z: 0, color: other.color, radius: 0.4 },
            { symbol: other.symbol, x: 1.1, y: 0, z: 0, color: other.color, radius: 0.4 }
          ],
          bonds: [[0, 1, 1], [0, 2, 1]]
        },
        elementsInvolved: [noble, other]
      };
    }

    return {
      success: false,
      isInert: true,
      formula: "No Chemical Reaction",
      name: `Inert Mixture of ${noble.name} and ${other.name}`,
      equation: `${noble.symbol} + ${other.symbol} ↛ No Reaction (Thermodynamically Barred)`,
      bond_type: "Non-reactive (Sterically & Electronically Inert)",
      delta_en: null,
      enthalpy: "ΔG > 0 (Endergonic / Highly Unfavorable)",
      geometry: "No Bound Molecular Geometry",
      state: "Unreacted physical mixture",
      description: `${noble.name} is a chemically inert Noble Gas with a completely satisfied valence shell (${noble.electron_config}). It has an exceptionally high ionization energy and zero electron affinity, creating an insurmountable thermodynamic activation barrier.`,
      mechanism: `According to the Lewis Octet Rule and quantum molecular orbital theory, ${noble.name}'s highest occupied molecular orbital (HOMO) is completely full, and its lowest unoccupied molecular orbital (LUMO) lies at an energy level too high for electron donation or acceptance. Consequently, collisions result only in elastic scattering.`,
      model: {
        atoms: [
          { symbol: noble.symbol, x: -1.2, y: 0, z: 0, color: noble.color, radius: 0.5 },
          { symbol: other.symbol, x: 1.2, y: 0, z: 0, color: other.color, radius: 0.45 }
        ],
        bonds: []
      },
      elementsInvolved: [noble, other]
    };
  }

  handleAlloy(m1, m2, deltaEN) {
    const name = `${m1.name}-${m2.name} Metallic Alloy / Intermetallic`;
    const formula = `${m1.symbol}${m2.symbol}`;
    const equation = `${m1.symbol}(l) + ${m2.symbol}(l) → ${m1.symbol}${m2.symbol}(s)`;
    const r1 = m1.atomic_radius || 150;
    const r2 = m2.atomic_radius || 150;
    const sizeDiff = Math.abs(r1 - r2) / Math.max(r1, r2) * 100;
    const alloyType = sizeDiff < 15 ? "Substitutional Solid Solution" : "Interstitial / Intermetallic Phase";

    return {
      success: true,
      isAlloy: true,
      formula: formula,
      name: name,
      equation: equation,
      bond_type: "Metallic Bond (Delocalized Electron Sea)",
      delta_en: Number(deltaEN.toFixed(2)),
      enthalpy: "Negative ΔH_mix (Exothermic solid solution)",
      geometry: `Metallic Matrix (${alloyType})`,
      state: "Solid Metallic Alloy at STP",
      description: `When ${m1.name} and ${m2.name} are combined, their valence electrons delocalize into a shared conduction band, creating a sturdy metallic alloy.`,
      mechanism: `Electrons move freely throughout the collective matrix of ${m1.symbol} and ${m2.symbol} cations. Atomic size disparity (${sizeDiff.toFixed(1)}%) increases lattice strain, impeding dislocation glide and strengthening the alloy.`,
      model: {
        atoms: [
          { symbol: m1.symbol, x: -0.7, y: 0, z: 0, color: m1.color, radius: 0.45 },
          { symbol: m2.symbol, x: 0.7, y: 0, z: 0, color: m2.color, radius: 0.45 },
          { symbol: m1.symbol, x: 0, y: 0.8, z: 0, color: m1.color, radius: 0.45 },
          { symbol: m2.symbol, x: 0, y: -0.8, z: 0, color: m2.color, radius: 0.45 }
        ],
        bonds: [[0, 1, 1], [0, 2, 1], [1, 2, 1], [0, 3, 1], [1, 3, 1]]
      },
      elementsInvolved: [m1, m2]
    };
  }

  handleIonic(metal, nonmetal, deltaEN) {
    const metalVal = this.getPrimaryCationValence(metal);
    const nonmetalVal = this.getPrimaryAnionValence(nonmetal);

    const divisor = this.gcd(metalVal, nonmetalVal);
    const mCount = nonmetalVal / divisor;
    const nmCount = metalVal / divisor;

    const subM = mCount > 1 ? this.toSubscript(mCount) : "";
    const subNM = nmCount > 1 ? this.toSubscript(nmCount) : "";
    const formula = `${metal.symbol}${subM}${nonmetal.symbol}${subNM}`;

    const nmSuffix = this.getAnionSuffix(nonmetal.name);
    const romanNumeral = ["", "(I)", "(II)", "(III)", "(IV)", "(V)", "(VI)"][metalVal] || "";
    const compoundName = `${metal.name} ${romanNumeral} ${nmSuffix}`.replace("  ", " ");
    const bondType = deltaEN >= 2.0 ? "Ionic" : "Polar Ionic (Mixed Covalent Character)";

    return {
      success: true,
      formula: formula,
      name: compoundName,
      equation: `${mCount}${metal.symbol}(s) + ${this.formatReactant(nonmetal, nmCount)} → ${formula}(s)`,
      bond_type: bondType,
      delta_en: Number(deltaEN.toFixed(2)),
      enthalpy: "High Lattice Enthalpy (Strongly Exothermic)",
      geometry: "3D Extended Ionic Crystal Lattice",
      state: "Crystalline Solid at STP",
      description: `${metal.name} electrostatically binds with ${nonmetal.name}. ${metal.name} transfers ${metalVal} electron(s) per atom to ${nonmetal.name}, producing an alternating crystalline salt array with a high melting point.`,
      mechanism: `${metal.name} oxidizes to ${metal.symbol}${metalVal > 1 ? metalVal + '+' : '+'}. ${nonmetal.name} reduces to ${nonmetal.symbol}${nonmetalVal > 1 ? nonmetalVal + '-' : '-'}. Strong Coulombic attraction (F = k·q₁q₂/r²) forms an enduring 3D ionic lattice.`,
      model: this.generateIonicModel(metal, nonmetal),
      elementsInvolved: [metal, nonmetal]
    };
  }

  handleCovalent(el1, el2, deltaEN) {
    const center = (el1.electronegativity || 2.5) <= (el2.electronegativity || 2.5) ? el1 : el2;
    const ligand = center === el1 ? el2 : el1;

    const cVal = this.getCovalentValence(center);
    const lVal = this.getCovalentValence(ligand);

    const div = this.gcd(cVal, lVal);
    const cCount = lVal / div;
    const lCount = cVal / div;

    const subC = cCount > 1 ? this.toSubscript(cCount) : "";
    const subL = lCount > 1 ? this.toSubscript(lCount) : "";
    const formula = `${center.symbol}${subC}${ligand.symbol}${subL}`;

    const bondType = deltaEN < 0.4 ? "Non-polar Covalent" : "Polar Covalent";
    const geometry = this.predictVSEPR(cCount, lCount, center);

    return {
      success: true,
      formula: formula,
      name: `${center.name} ${ligand.name} compound (${formula})`,
      equation: `${cCount}${center.symbol} + ${lCount}${ligand.symbol} → ${formula}`,
      bond_type: bondType,
      delta_en: Number(deltaEN.toFixed(2)),
      enthalpy: "Negative ΔH (Exothermic covalent bond formation)",
      geometry: geometry.name,
      state: "Molecule at STP",
      description: `${center.name} and ${ligand.name} combine by sharing valence electrons to complete their respective valence octets.`,
      mechanism: `Electronegativity difference ΔEN = ${deltaEN.toFixed(2)}. ${deltaEN < 0.4 ? 'Electrons are shared symmetrically without net dipole.' : 'Electrons are polarized toward the more electronegative atom.'} Geometry governed by VSEPR repulsion (${geometry.name}).`,
      model: geometry.modelGenerator(center, ligand, lCount),
      elementsInvolved: [center, ligand]
    };
  }

  getPrimaryCationValence(metal) {
    if (metal.group === 1) return 1;
    if (metal.group === 2) return 2;
    if (metal.group === 13) return 3;
    if (metal.symbol === "Ag") return 1;
    if (metal.symbol === "Zn" || metal.symbol === "Cd") return 2;
    if (metal.symbol === "Sc" || metal.symbol === "Y" || metal.category === "lanthanide") return 3;
    if (metal.symbol === "Ti" || metal.symbol === "Zr") return 4;
    return 2;
  }

  getPrimaryAnionValence(nonmetal) {
    if (nonmetal.category === "halogen" || nonmetal.group === 17) return 1;
    if (nonmetal.group === 16) return 2;
    if (nonmetal.group === 15) return 3;
    if (nonmetal.group === 14) return 4;
    if (nonmetal.symbol === "H") return 1;
    return 1;
  }

  getCovalentValence(el) {
    if (el.symbol === "H") return 1;
    if (el.group === 17) return 1;
    if (el.group === 16) return 2;
    if (el.group === 15) return 3;
    if (el.group === 14) return 4;
    if (el.group === 13) return 3;
    return 1;
  }

  toSubscript(num) {
    const subs = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
    return String(num).split('').map(c => subs[c] || c).join('');
  }

  getAnionSuffix(name) {
    const mapping = {
      "Oxygen": "Oxide", "Fluorine": "Fluoride", "Chlorine": "Chloride", "Bromine": "Bromide",
      "Iodine": "Iodide", "Sulfur": "Sulfide", "Nitrogen": "Nitride", "Phosphorus": "Phosphide",
      "Carbon": "Carbide", "Silicon": "Silicide", "Hydrogen": "Hydride", "Selenium": "Selenide"
    };
    return mapping[name] || name + "ide";
  }

  formatReactant(el, count) {
    const diatomics = ["H", "N", "O", "F", "Cl", "Br", "I"];
    if (diatomics.includes(el.symbol)) {
      if (count % 2 === 0) {
        const coef = count / 2;
        return coef === 1 ? `${el.symbol}₂` : `${coef}${el.symbol}₂`;
      } else {
        return `${count}/2 ${el.symbol}₂`;
      }
    }
    return count > 1 ? `${count}${el.symbol}` : el.symbol;
  }

  predictVSEPR(cCount, lCount, center) {
    if (lCount === 1) {
      return {
        name: "Linear Diatomic",
        modelGenerator: (c, l) => ({
          atoms: [
            { symbol: c.symbol, x: -0.6, y: 0, z: 0, color: c.color, radius: 0.44 },
            { symbol: l.symbol, x: 0.6, y: 0, z: 0, color: l.color, radius: 0.4 }
          ],
          bonds: [[0, 1, 1]]
        })
      };
    }
    if (lCount === 2) {
      const isBent = center.group === 16;
      return {
        name: isBent ? "Bent (~105°)" : "Linear (180°)",
        modelGenerator: (c, l) => isBent ? {
          atoms: [
            { symbol: c.symbol, x: 0, y: 0, z: 0, color: c.color, radius: 0.44 },
            { symbol: l.symbol, x: -0.75, y: 0.58, z: 0, color: l.color, radius: 0.38 },
            { symbol: l.symbol, x: 0.75, y: 0.58, z: 0, color: l.color, radius: 0.38 }
          ],
          bonds: [[0, 1, 1], [0, 2, 1]]
        } : {
          atoms: [
            { symbol: c.symbol, x: 0, y: 0, z: 0, color: c.color, radius: 0.44 },
            { symbol: l.symbol, x: -1.1, y: 0, z: 0, color: l.color, radius: 0.38 },
            { symbol: l.symbol, x: 1.1, y: 0, z: 0, color: l.color, radius: 0.38 }
          ],
          bonds: [[0, 1, 1], [0, 2, 1]]
        }
      };
    }
    if (lCount === 3) {
      const isPyramidal = center.group === 15;
      return {
        name: isPyramidal ? "Trigonal Pyramidal (~107°)" : "Trigonal Planar (120°)",
        modelGenerator: (c, l) => ({
          atoms: [
            { symbol: c.symbol, x: 0, y: isPyramidal ? 0.3 : 0, z: 0, color: c.color, radius: 0.44 },
            { symbol: l.symbol, x: 0, y: isPyramidal ? -0.25 : 1.0, z: 0.94, color: l.color, radius: 0.36 },
            { symbol: l.symbol, x: 0.81, y: isPyramidal ? -0.25 : -0.5, z: -0.47, color: l.color, radius: 0.36 },
            { symbol: l.symbol, x: -0.81, y: isPyramidal ? -0.25 : -0.5, z: -0.47, color: l.color, radius: 0.36 }
          ],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]]
        })
      };
    }
    if (lCount === 4) {
      return {
        name: "Tetrahedral (109.5°)",
        modelGenerator: (c, l) => ({
          atoms: [
            { symbol: c.symbol, x: 0, y: 0, z: 0, color: c.color, radius: 0.44 },
            { symbol: l.symbol, x: 0, y: 1.05, z: 0, color: l.color, radius: 0.36 },
            { symbol: l.symbol, x: 0.99, y: -0.35, z: 0, color: l.color, radius: 0.36 },
            { symbol: l.symbol, x: -0.49, y: -0.35, z: 0.86, color: l.color, radius: 0.36 },
            { symbol: l.symbol, x: -0.49, y: -0.35, z: -0.86, color: l.color, radius: 0.36 }
          ],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]
        })
      };
    }
    return {
      name: `Symmetric Coordination (${lCount}-coordinate)`,
      modelGenerator: (c, l) => ({
        atoms: [
          { symbol: c.symbol, x: 0, y: 0, z: 0, color: c.color, radius: 0.44 },
          ...Array.from({ length: lCount }).map((_, i) => {
            const angle = (i / lCount) * Math.PI * 2;
            return { symbol: l.symbol, x: Math.cos(angle) * 1.0, y: Math.sin(angle) * 1.0, z: 0, color: l.color, radius: 0.35 };
          })
        ],
        bonds: Array.from({ length: lCount }).map((_, i) => [0, i + 1, 1])
      })
    };
  }

  generateIonicModel(metal, nonmetal) {
    const atoms = [];
    const bonds = [];
    const coords = [
      [-0.6, -0.6, -0.6], [0.6, -0.6, -0.6], [-0.6, 0.6, -0.6], [0.6, 0.6, -0.6],
      [-0.6, -0.6, 0.6], [0.6, -0.6, 0.6], [-0.6, 0.6, 0.6], [0.6, 0.6, 0.6]
    ];
    coords.forEach((coord, i) => {
      const isM = i % 2 === 0;
      const el = isM ? metal : nonmetal;
      atoms.push({
        symbol: el.symbol,
        x: coord[0],
        y: coord[1],
        z: coord[2],
        color: el.color,
        radius: isM ? 0.36 : 0.44
      });
    });
    bonds.push([0, 1, 1], [0, 2, 1], [0, 4, 1], [3, 1, 1], [3, 2, 1], [3, 7, 1]);
    bonds.push([5, 1, 1], [5, 4, 1], [5, 7, 1], [6, 2, 1], [6, 4, 1], [6, 7, 1]);
    return { atoms, bonds };
  }

  generateMultiCluster(elements, connectBonds = true) {
    const atoms = [];
    const bonds = [];
    const n = elements.length;

    // Distribute elements spherically or in symmetric 3D cage
    elements.forEach((el, i) => {
      if (i === 0) {
        atoms.push({ symbol: el.symbol, x: 0, y: 0, z: 0, color: el.color, radius: 0.46 });
        return;
      }
      const phi = Math.acos(-1 + (2 * i) / n);
      const theta = Math.sqrt(n * Math.PI) * phi;
      const dist = 1.1;
      const x = dist * Math.cos(theta) * Math.sin(phi);
      const y = dist * Math.sin(theta) * Math.sin(phi);
      const z = dist * Math.cos(phi);

      atoms.push({ symbol: el.symbol, x, y, z, color: el.color, radius: 0.42 });
      if (connectBonds) {
        bonds.push([0, i, 1]);
      }
    });

    return { atoms, bonds };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReactionEngine };
}
