// Comprehensive Chemical Universe Knowledgebase
// Includes binary, ternary, quaternary, organic, alloy, and superconductor reactions
const CURATED_REACTIONS = {
  "H-O": {
    "formula": "H\u2082O",
    "name": "Water (Dihydrogen monoxide)",
    "alt_formula": "H\u2082O\u2082 (Hydrogen Peroxide)",
    "equation": "2H\u2082(g) + O\u2082(g) \u2192 2H\u2082O(l)",
    "bond_type": "Polar Covalent",
    "delta_en": 1.24,
    "enthalpy": "-285.8 kJ/mol (Exothermic)",
    "geometry": "Bent (~104.5\u00b0)",
    "state": "Liquid at STP",
    "description": "The universal solvent of life. Oxygen's high electronegativity (3.44) pulls electron density away from hydrogens, creating a strong permanent dipole and hydrogen bonding network.",
    "mechanism": "Oxygen has 6 valence electrons (2s\u00b2 2p\u2074) and shares 1 electron with each of two Hydrogen atoms (1s\u00b9). Two lone pairs on Oxygen exert stronger repulsion than bond pairs, bending the H-O-H angle from tetrahedral 109.5\u00b0 down to 104.5\u00b0.",
    "model": {
      "atoms": [
        {
          "symbol": "O",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "H",
          "x": -0.76,
          "y": 0.58,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": 0.76,
          "y": 0.58,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ]
      ]
    }
  },
  "Cl-Na": {
    "formula": "NaCl",
    "name": "Sodium Chloride (Table Salt / Halite)",
    "equation": "2Na(s) + Cl\u2082(g) \u2192 2NaCl(s)",
    "bond_type": "Ionic",
    "delta_en": 2.23,
    "enthalpy": "-411.2 kJ/mol (Strongly Exothermic)",
    "geometry": "Face-Centered Cubic (Rock Salt Lattice)",
    "state": "Crystalline Solid at STP",
    "description": "Prototypical ionic crystal. Sodium vigorously surrenders its lone 3s valence electron to chlorine, emitting a bright yellow flame to form a stable 3D ionic lattice.",
    "mechanism": "Na ([Ne] 3s\u00b9) transfers 1 electron to Cl ([Ne] 3s\u00b2 3p\u2075), yielding Na\u207a and Cl\u207b with closed-shell neon and argon noble gas configurations. The electrostatic Coulombic lattice energy (+787 kJ/mol) drives crystal stability.",
    "model": {
      "atoms": [
        {
          "symbol": "Na",
          "x": -0.8,
          "y": -0.8,
          "z": -0.8,
          "color": "#AB5CF2",
          "radius": 0.38
        },
        {
          "symbol": "Cl",
          "x": 0.8,
          "y": -0.8,
          "z": -0.8,
          "color": "#1FF01F",
          "radius": 0.5
        },
        {
          "symbol": "Cl",
          "x": -0.8,
          "y": 0.8,
          "z": -0.8,
          "color": "#1FF01F",
          "radius": 0.5
        },
        {
          "symbol": "Na",
          "x": 0.8,
          "y": 0.8,
          "z": -0.8,
          "color": "#AB5CF2",
          "radius": 0.38
        },
        {
          "symbol": "Cl",
          "x": -0.8,
          "y": -0.8,
          "z": 0.8,
          "color": "#1FF01F",
          "radius": 0.5
        },
        {
          "symbol": "Na",
          "x": 0.8,
          "y": -0.8,
          "z": 0.8,
          "color": "#AB5CF2",
          "radius": 0.38
        },
        {
          "symbol": "Na",
          "x": -0.8,
          "y": 0.8,
          "z": 0.8,
          "color": "#AB5CF2",
          "radius": 0.38
        },
        {
          "symbol": "Cl",
          "x": 0.8,
          "y": 0.8,
          "z": 0.8,
          "color": "#1FF01F",
          "radius": 0.5
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          3,
          1,
          1
        ],
        [
          3,
          2,
          1
        ],
        [
          3,
          7,
          1
        ],
        [
          5,
          1,
          1
        ],
        [
          5,
          4,
          1
        ],
        [
          5,
          7,
          1
        ],
        [
          6,
          2,
          1
        ],
        [
          6,
          4,
          1
        ],
        [
          6,
          7,
          1
        ]
      ]
    }
  },
  "C-O": {
    "formula": "CO\u2082",
    "name": "Carbon Dioxide",
    "alt_formula": "CO (Carbon Monoxide)",
    "equation": "C(s) + O\u2082(g) \u2192 CO\u2082(g)",
    "bond_type": "Polar Covalent (Non-polar Molecule)",
    "delta_en": 0.89,
    "enthalpy": "-393.5 kJ/mol (Exothermic)",
    "geometry": "Linear (180\u00b0)",
    "state": "Gas at STP",
    "description": "Essential atmospheric greenhouse gas and substrate for photosynthesis. Carbon forms two double bonds (O=C=O) with oxygen atoms in a straight line.",
    "mechanism": "Carbon undergoes sp hybridization. Two sp hybrid orbitals form \u03c3 bonds with oxygen 2p orbitals, while unhybridized p orbitals form two orthogonal \u03c0 bonds. Because the two polar C=O dipoles are equal and opposite (180\u00b0), the net dipole moment is zero.",
    "model": {
      "atoms": [
        {
          "symbol": "C",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": -1.2,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "O",
          "x": 1.2,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.45
        }
      ],
      "bonds": [
        [
          0,
          1,
          2
        ],
        [
          0,
          2,
          2
        ]
      ]
    }
  },
  "C-H": {
    "formula": "CH\u2084",
    "name": "Methane (Natural Gas)",
    "equation": "C(s) + 2H\u2082(g) \u2192 CH\u2084(g)",
    "bond_type": "Non-polar Covalent",
    "delta_en": 0.35,
    "enthalpy": "-74.8 kJ/mol (Exothermic)",
    "geometry": "Tetrahedral (109.5\u00b0)",
    "state": "Colorless Gas at STP",
    "description": "The simplest alkane and primary component of natural gas. Highly symmetric tetrahedral geometry with four equal C-H single bonds.",
    "mechanism": "Carbon promotes a 2s electron to 2p and hybridizes into four equivalent sp\u00b3 orbitals directed towards the corners of a regular tetrahedron, each overlapping with a spherical Hydrogen 1s orbital.",
    "model": {
      "atoms": [
        {
          "symbol": "C",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "H",
          "x": 0.0,
          "y": 1.1,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": 1.03,
          "y": -0.37,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -0.52,
          "y": -0.37,
          "z": 0.89,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -0.52,
          "y": -0.37,
          "z": -0.89,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ]
      ]
    }
  },
  "H-N": {
    "formula": "NH\u2083",
    "name": "Ammonia",
    "equation": "N\u2082(g) + 3H\u2082(g) \u21cc 2NH\u2083(g) (Haber Process)",
    "bond_type": "Polar Covalent",
    "delta_en": 0.84,
    "enthalpy": "-45.9 kJ/mol (Exothermic)",
    "geometry": "Trigonal Pyramidal (~107.8\u00b0)",
    "state": "Pungent Gas at STP",
    "description": "Crucial precursor for fertilizers, plastics, and explosives. Synthesized globally via the Nobel Prize-winning Haber-Bosch catalytic process.",
    "mechanism": "Nitrogen is sp\u00b3 hybridized with 5 valence electrons. Three sp\u00b3 orbitals form \u03c3 bonds with Hydrogen atoms, while the fourth orbital accommodates a stereochemically active lone pair, which compresses H-N-H angles to 107.8\u00b0.",
    "model": {
      "atoms": [
        {
          "symbol": "N",
          "x": 0.0,
          "y": 0.35,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.44
        },
        {
          "symbol": "H",
          "x": 0.0,
          "y": -0.25,
          "z": 0.94,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": 0.81,
          "y": -0.25,
          "z": -0.47,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -0.81,
          "y": -0.25,
          "z": -0.47,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ]
      ]
    }
  },
  "Cl-H": {
    "formula": "HCl",
    "name": "Hydrogen Chloride (Hydrochloric Acid in water)",
    "equation": "H\u2082(g) + Cl\u2082(g) \u2192 2HCl(g)",
    "bond_type": "Polar Covalent",
    "delta_en": 0.96,
    "enthalpy": "-92.3 kJ/mol (Exothermic)",
    "geometry": "Linear",
    "state": "Gas at STP (Fuming acid in solution)",
    "description": "Diatomic gas that dissolves readily in water to produce gastric stomach acid. Strong Br\u00f8nsted-Lowry acid that fully dissociates in water into H\u207a and Cl\u207b.",
    "mechanism": "Hydrogen shares its 1s electron with Chlorine's 3p orbital. The substantial electronegativity difference (3.16 vs 2.20) creates a polar covalent bond with partial negative charge on chlorine (\u03b4\u207b).",
    "model": {
      "atoms": [
        {
          "symbol": "Cl",
          "x": -0.4,
          "y": 0.0,
          "z": 0.0,
          "color": "#1FF01F",
          "radius": 0.5
        },
        {
          "symbol": "H",
          "x": 0.85,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ]
      ]
    }
  },
  "F-S": {
    "formula": "SF\u2086",
    "name": "Sulfur Hexafluoride",
    "equation": "S(s) + 3F\u2082(g) \u2192 SF\u2086(g)",
    "bond_type": "Polar Covalent (Hypervalent Octahedral)",
    "delta_en": 1.4,
    "enthalpy": "-1220.5 kJ/mol (Extremely Exothermic)",
    "geometry": "Octahedral (90\u00b0)",
    "state": "Dense Gas at STP (5x heavier than air)",
    "description": "Extremely inert dielectric insulating gas used in high-voltage switchgear. Non-toxic and so heavy that boats made of aluminium foil can float on it.",
    "mechanism": "Sulfur undergoes expanded octet sp\u00b3d\u00b2 hybridization to accommodate 6 bonds with electronegative fluorine atoms. The high symmetry of the six S-F bonds cancels all dipole moments.",
    "model": {
      "atoms": [
        {
          "symbol": "S",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFFF30",
          "radius": 0.45
        },
        {
          "symbol": "F",
          "x": 1.2,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": -1.2,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": 1.2,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": -1.2,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": 0.0,
          "z": 1.2,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": 0.0,
          "z": -1.2,
          "color": "#90E050",
          "radius": 0.38
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ],
        [
          0,
          6,
          1
        ]
      ]
    }
  },
  "Mg-O": {
    "formula": "MgO",
    "name": "Magnesium Oxide (Magnesia)",
    "equation": "2Mg(s) + O\u2082(g) \u2192 2MgO(s)",
    "bond_type": "Ionic",
    "delta_en": 2.13,
    "enthalpy": "-601.6 kJ/mol (Blinding Exothermic)",
    "geometry": "Face-Centered Cubic (Rock Salt)",
    "state": "White Refractory Powder at STP",
    "description": "Burns with an intense, blinding white luminescence in air. Possesses an extraordinary melting point of 2852\u00b0C, making it an ideal refractory furnace lining.",
    "mechanism": "Mg ([Ne] 3s\u00b2) transfers both valence electrons to Oxygen (2s\u00b2 2p\u2074) yielding divalent Mg\u00b2\u207a and O\u00b2\u207b ions. The 4x increase in Coulombic force (2+ \u00d7 2-) compared to NaCl yields massive lattice energy (-3795 kJ/mol).",
    "model": {
      "atoms": [
        {
          "symbol": "Mg",
          "x": -0.7,
          "y": -0.7,
          "z": -0.7,
          "color": "#8AFF00",
          "radius": 0.38
        },
        {
          "symbol": "O",
          "x": 0.7,
          "y": -0.7,
          "z": -0.7,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "O",
          "x": -0.7,
          "y": 0.7,
          "z": -0.7,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "Mg",
          "x": 0.7,
          "y": 0.7,
          "z": -0.7,
          "color": "#8AFF00",
          "radius": 0.38
        },
        {
          "symbol": "O",
          "x": -0.7,
          "y": -0.7,
          "z": 0.7,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "Mg",
          "x": 0.7,
          "y": -0.7,
          "z": 0.7,
          "color": "#8AFF00",
          "radius": 0.38
        },
        {
          "symbol": "Mg",
          "x": -0.7,
          "y": 0.7,
          "z": 0.7,
          "color": "#8AFF00",
          "radius": 0.38
        },
        {
          "symbol": "O",
          "x": 0.7,
          "y": 0.7,
          "z": 0.7,
          "color": "#FF0D0D",
          "radius": 0.45
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          3,
          1,
          1
        ],
        [
          3,
          2,
          1
        ],
        [
          3,
          7,
          1
        ],
        [
          5,
          1,
          1
        ],
        [
          5,
          4,
          1
        ],
        [
          5,
          7,
          1
        ],
        [
          6,
          2,
          1
        ],
        [
          6,
          4,
          1
        ],
        [
          6,
          7,
          1
        ]
      ]
    }
  },
  "Fe-O": {
    "formula": "Fe\u2082O\u2083",
    "name": "Iron(III) Oxide (Rust / Hematite)",
    "alt_formula": "Fe\u2083O\u2084 (Magnetite), FeO (W\u00fcstite)",
    "equation": "4Fe(s) + 3O\u2082(g) \u2192 2Fe\u2082O\u2083(s)",
    "bond_type": "Polar Ionic / Mixed Covalent",
    "delta_en": 1.61,
    "enthalpy": "-824.2 kJ/mol (Exothermic)",
    "geometry": "Corundum Crystal Structure",
    "state": "Reddish-Brown Solid at STP",
    "description": "The principal ore of iron and common rust. Naturally occurs as the mineral hematite, giving Martian soil its characteristic red color.",
    "mechanism": "Iron oxidizes from oxidation state 0 to +3 (losing two 4s electrons and one 3d electron to reach stable half-filled 3d\u2075 subshell). Oxygen gains two electrons to form O\u00b2\u207b (2p\u2076 octet).",
    "model": {
      "atoms": [
        {
          "symbol": "Fe",
          "x": -0.8,
          "y": 0.0,
          "z": 0.0,
          "color": "#E06633",
          "radius": 0.45
        },
        {
          "symbol": "Fe",
          "x": 0.8,
          "y": 0.0,
          "z": 0.0,
          "color": "#E06633",
          "radius": 0.45
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": 0.9,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": -0.6,
          "z": 0.7,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": -0.6,
          "z": -0.7,
          "color": "#FF0D0D",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          1,
          3,
          1
        ],
        [
          1,
          4,
          1
        ]
      ]
    }
  },
  "Al-O": {
    "formula": "Al\u2082O\u2083",
    "name": "Aluminium Oxide (Corundum / Sapphire / Ruby)",
    "equation": "4Al(s) + 3O\u2082(g) \u2192 2Al\u2082O\u2083(s)",
    "bond_type": "Ionic with Strong Covalent Character",
    "delta_en": 1.83,
    "enthalpy": "-1675.7 kJ/mol (Extremely Exothermic)",
    "geometry": "Trigonal Corundum Lattice",
    "state": "Extremely Hard Ceramic (Mohs 9)",
    "description": "Forms a microscopic 4nm self-passivating protective skin on aluminium metal preventing further corrosion. Gemstone varieties include Ruby (with Cr traces) and Sapphire (with Fe/Ti).",
    "mechanism": "Two Al atoms lose 3 valence electrons each (3s\u00b2 3p\u00b9) to form Al\u00b3\u207a ([Ne]). Three Oxygen atoms gain 2 electrons each to form O\u00b2\u207b ([Ne]). The compact high charge density creates an ultra-rigid lattice.",
    "model": {
      "atoms": [
        {
          "symbol": "Al",
          "x": -0.75,
          "y": 0.0,
          "z": 0.0,
          "color": "#BFA6A6",
          "radius": 0.42
        },
        {
          "symbol": "Al",
          "x": 0.75,
          "y": 0.0,
          "z": 0.0,
          "color": "#BFA6A6",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": 0.85,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": -0.55,
          "z": 0.65,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": -0.55,
          "z": -0.65,
          "color": "#FF0D0D",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          1,
          3,
          1
        ],
        [
          1,
          4,
          1
        ]
      ]
    }
  },
  "O-Si": {
    "formula": "SiO\u2082",
    "name": "Silicon Dioxide (Silica / Quartz)",
    "equation": "Si(s) + O\u2082(g) \u2192 SiO\u2082(s)",
    "bond_type": "Network Covalent",
    "delta_en": 1.54,
    "enthalpy": "-910.7 kJ/mol (Exothermic)",
    "geometry": "Tetrahedral Network [SiO\u2084]",
    "state": "Hard Crystalline Solid at STP",
    "description": "Makes up 59% of Earth's crust as quartz, sand, and flint; raw material for glass, aerogels, and optical fibers. Forms an endless 3D macromolecular covalent network.",
    "mechanism": "Unlike carbon which readily forms double bonds (O=C=O) due to strong 2p-2p \u03c0 overlap, silicon's larger 3p orbitals overlap poorly with oxygen 2p. Consequently, silicon forms four single \u03c3 bonds with bridged oxygen atoms.",
    "model": {
      "atoms": [
        {
          "symbol": "Si",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#F0C8A0",
          "radius": 0.48
        },
        {
          "symbol": "O",
          "x": 0.8,
          "y": 0.8,
          "z": 0.8,
          "color": "#FF0D0D",
          "radius": 0.4
        },
        {
          "symbol": "O",
          "x": -0.8,
          "y": -0.8,
          "z": 0.8,
          "color": "#FF0D0D",
          "radius": 0.4
        },
        {
          "symbol": "O",
          "x": -0.8,
          "y": 0.8,
          "z": -0.8,
          "color": "#FF0D0D",
          "radius": 0.4
        },
        {
          "symbol": "O",
          "x": 0.8,
          "y": -0.8,
          "z": -0.8,
          "color": "#FF0D0D",
          "radius": 0.4
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ]
      ]
    }
  },
  "C-Si": {
    "formula": "SiC",
    "name": "Silicon Carbide (Carborundum)",
    "equation": "SiO\u2082 + 3C \u2192 SiC + 2CO (at 2000\u00b0C)",
    "bond_type": "Network Covalent",
    "delta_en": 0.65,
    "enthalpy": "-124.9 kJ/mol",
    "geometry": "Zinc-Blende / Diamond Tetrahedral Network",
    "state": "Extremely Hard Black/Green Ceramic",
    "description": "Nearly as hard as diamond (Mohs 9.5), used in bulletproof body armor vests, high-power silicon carbide power electronics, and high-performance brake discs.",
    "mechanism": "Both Si and C are Group 14 elements with 4 valence electrons. Each atom is sp\u00b3 hybridized and tetrahedrally bonded to four neighboring atoms of the other type, forming an ultra-strong interconnected covalent network.",
    "model": {
      "atoms": [
        {
          "symbol": "Si",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#F0C8A0",
          "radius": 0.48
        },
        {
          "symbol": "C",
          "x": 0.8,
          "y": 0.8,
          "z": 0.8,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "C",
          "x": -0.8,
          "y": -0.8,
          "z": 0.8,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "C",
          "x": -0.8,
          "y": 0.8,
          "z": -0.8,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "C",
          "x": 0.8,
          "y": -0.8,
          "z": -0.8,
          "color": "#909090",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ]
      ]
    }
  },
  "Cu-Sn": {
    "formula": "Cu\u2089Sn",
    "name": "Bronze (Copper-Tin Alloy)",
    "equation": "9Cu(l) + Sn(l) \u2192 Cu\u2089Sn(s)",
    "bond_type": "Metallic Alloy (Intermetallic)",
    "delta_en": 0.06,
    "enthalpy": "-18.5 kJ/mol",
    "geometry": "Close-Packed Metallic Matrix with Substitutional Solute",
    "state": "Lustrous Golden-Brown Metal",
    "description": "Historical alloy that defined an entire era of human civilization. Tin atoms disrupt copper's crystal planes, preventing dislocation slip and drastically increasing hardness.",
    "mechanism": "Tin atoms substitute into the copper face-centered cubic lattice. Delocalized valence electrons move freely across a 'sea of electrons' surrounding positively charged metallic cations, imparting high electrical and thermal conductivity.",
    "model": {
      "atoms": [
        {
          "symbol": "Sn",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#668080",
          "radius": 0.52
        },
        {
          "symbol": "Cu",
          "x": 1.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": -1.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": 0.0,
          "y": 1.0,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": 0.0,
          "y": -1.0,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": 0.0,
          "y": 0.0,
          "z": 1.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": 0.0,
          "y": 0.0,
          "z": -1.0,
          "color": "#C88033",
          "radius": 0.44
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ],
        [
          0,
          6,
          1
        ]
      ]
    }
  },
  "Cu-Zn": {
    "formula": "CuZn",
    "name": "Brass (Copper-Zinc Alloy)",
    "equation": "Cu(l) + Zn(l) \u2192 CuZn(s)",
    "bond_type": "Metallic Alloy",
    "delta_en": 0.25,
    "enthalpy": "-12.0 kJ/mol",
    "geometry": "Body-Centered Cubic / FCC Substitutional Matrix",
    "state": "Bright Gold-like Metal",
    "description": "Acoustically superior alloy prized for musical instruments, low-friction plumbing valves, and decorative hardware.",
    "mechanism": "Zinc dissolves in molten copper to form an \u03b1-brass solid solution. Zinc donates extra valence electrons to the conduction band, increasing strength without sacrificing malleability.",
    "model": {
      "atoms": [
        {
          "symbol": "Cu",
          "x": -0.6,
          "y": 0.0,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Zn",
          "x": 0.6,
          "y": 0.0,
          "z": 0.0,
          "color": "#7D80B0",
          "radius": 0.44
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ]
      ]
    }
  },
  "F-Xe": {
    "formula": "XeF\u2084",
    "name": "Xenon Tetrafluoride",
    "alt_formula": "XeF\u2082 (Difluoride), XeF\u2086 (Hexafluoride)",
    "equation": "Xe(g) + 2F\u2082(g) \u2192 XeF\u2084(s) (at 400\u00b0C, 6 atm)",
    "bond_type": "Polar Covalent (Noble Gas Hypervalent)",
    "delta_en": 1.38,
    "enthalpy": "-261.5 kJ/mol",
    "geometry": "Square Planar (90\u00b0)",
    "state": "White Crystalline Solid at STP",
    "description": "Historic compound discovered in 1962 that shattered the dogma that noble gases could never form chemical bonds.",
    "mechanism": "Xenon has 8 valence electrons. With strongly electronegative fluorine, xenon promotes electrons into 5d orbitals to adopt sp\u00b3d\u00b2 hybridization. Four equatorial fluorine bonds with two axial lone pairs yield a square planar geometry.",
    "model": {
      "atoms": [
        {
          "symbol": "Xe",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#429EB0",
          "radius": 0.52
        },
        {
          "symbol": "F",
          "x": 1.15,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": -1.15,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": 1.15,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        },
        {
          "symbol": "F",
          "x": 0.0,
          "y": -1.15,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.38
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ]
      ]
    }
  },
  "B-N": {
    "formula": "BN",
    "name": "Boron Nitride ('Inorganic Graphite / Diamond')",
    "equation": "B\u2082O\u2083 + 2NH\u2083 \u2192 2BN + 3H\u2082O",
    "bond_type": "Polar Covalent Network",
    "delta_en": 1.0,
    "enthalpy": "-254.4 kJ/mol",
    "geometry": "Hexagonal (h-BN) or Cubic (c-BN)",
    "state": "White Ceramic Powder / Ultra-hard Crystal",
    "description": "Isoelectronic with carbon. Hexagonal BN acts as a white, high-temperature lubricant, while cubic BN (c-BN) is second only to diamond in hardness.",
    "mechanism": "Boron (3 valence e\u207b) and Nitrogen (5 valence e\u207b) average 4 valence electrons per atom, exactly mimicking Carbon. Boron's empty p orbital accepts partial \u03c0 back-donation from nitrogen's lone pair.",
    "model": {
      "atoms": [
        {
          "symbol": "B",
          "x": -0.65,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFB5B5",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": 0.65,
          "y": 0.0,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.44
        }
      ],
      "bonds": [
        [
          0,
          1,
          2
        ]
      ]
    }
  },
  "C-Ca": {
    "formula": "CaC\u2082",
    "name": "Calcium Carbide",
    "equation": "CaO + 3C \u2192 CaC\u2082 + CO (at 2200\u00b0C)",
    "bond_type": "Ionic with Acetylide Anion",
    "delta_en": 1.55,
    "enthalpy": "-59.8 kJ/mol",
    "geometry": "Tetragonal Salt Lattice with [C\u2261C]\u00b2\u207b Dimer",
    "state": "Grey-Black Solid",
    "description": "Famous chemical used in miner carbide lamps; reacts vigorously with water to produce flammable acetylene gas (C\u2082H\u2082).",
    "mechanism": "Ca\u00b2\u207a cation electrostatically bonds with the diatomic acetylide dianion [C\u2261C]\u00b2\u207b, which features a strong carbon-carbon triple bond.",
    "model": {
      "atoms": [
        {
          "symbol": "Ca",
          "x": 0.0,
          "y": 1.1,
          "z": 0.0,
          "color": "#3DFF00",
          "radius": 0.48
        },
        {
          "symbol": "C",
          "x": -0.6,
          "y": -0.6,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "C",
          "x": 0.6,
          "y": -0.6,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          1,
          2,
          3
        ],
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ]
      ]
    }
  },
  "Cl-P": {
    "formula": "PCl\u2085",
    "name": "Phosphorus Pentachloride",
    "alt_formula": "PCl\u2083 (Phosphorus Trichloride)",
    "equation": "P\u2084 + 10Cl\u2082 \u2192 4PCl\u2085",
    "bond_type": "Polar Covalent (Hypervalent)",
    "delta_en": 0.97,
    "enthalpy": "-443.5 kJ/mol",
    "geometry": "Trigonal Bipyramidal (90\u00b0 & 120\u00b0)",
    "state": "Pale Yellow-Green Solid",
    "description": "Classic textbook example of hypervalency and sp\u00b3d hybridization with distinct axial and equatorial bond lengths.",
    "mechanism": "Phosphorus expands its valence shell to 10 electrons via sp\u00b3d hybridization. Three chlorine atoms occupy equatorial positions at 120\u00b0, and two occupy axial positions at 180\u00b0.",
    "model": {
      "atoms": [
        {
          "symbol": "P",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF8000",
          "radius": 0.45
        },
        {
          "symbol": "Cl",
          "x": 0.0,
          "y": 1.3,
          "z": 0.0,
          "color": "#1FF01F",
          "radius": 0.48
        },
        {
          "symbol": "Cl",
          "x": 0.0,
          "y": -1.3,
          "z": 0.0,
          "color": "#1FF01F",
          "radius": 0.48
        },
        {
          "symbol": "Cl",
          "x": 1.2,
          "y": 0.0,
          "z": 0.0,
          "color": "#1FF01F",
          "radius": 0.48
        },
        {
          "symbol": "Cl",
          "x": -0.6,
          "y": 0.0,
          "z": 1.04,
          "color": "#1FF01F",
          "radius": 0.48
        },
        {
          "symbol": "Cl",
          "x": -0.6,
          "y": 0.0,
          "z": -1.04,
          "color": "#1FF01F",
          "radius": 0.48
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ]
      ]
    }
  },
  "F-H": {
    "formula": "HF",
    "name": "Hydrogen Fluoride (Hydrofluoric Acid in water)",
    "equation": "H\u2082(g) + F\u2082(g) \u2192 2HF(g) (Explosive even in dark)",
    "bond_type": "Extremely Polar Covalent",
    "delta_en": 1.78,
    "enthalpy": "-273.3 kJ/mol (Exothermic)",
    "geometry": "Linear Diatomic",
    "state": "Colorless Gas / Fuming Liquid (bp 19.5\u00b0C)",
    "description": "Notoriously corrosive acid capable of dissolving glass (SiO\u2082); penetrates skin to precipitate calcium in bones.",
    "mechanism": "Fluorine's extreme electronegativity (3.98) polarizes the H-F single bond to the brink of ionic character (43% ionic character), resulting in intense intermolecular hydrogen bonding.",
    "model": {
      "atoms": [
        {
          "symbol": "F",
          "x": -0.35,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.42
        },
        {
          "symbol": "H",
          "x": 0.65,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ]
      ]
    }
  },
  "F-Li": {
    "formula": "LiF",
    "name": "Lithium Fluoride",
    "equation": "2Li(s) + F\u2082(g) \u2192 2LiF(s)",
    "bond_type": "Ionic (Most Ionic Single Bond)",
    "delta_en": 3.0,
    "enthalpy": "-616.0 kJ/mol",
    "geometry": "Cubic Rock Salt Lattice",
    "state": "White Crystalline Solid",
    "description": "Has the highest electronegativity difference (3.0) and one of the highest lattice energies among alkali halides.",
    "mechanism": "Li ([He] 2s\u00b9) surrenders its electron to F ([He] 2s\u00b2 2p\u2075), forming tiny Li\u207a (76 pm) and F\u207b (133 pm) ions that pack tightly into an exceptionally stable ionic crystal.",
    "model": {
      "atoms": [
        {
          "symbol": "Li",
          "x": -0.6,
          "y": 0.0,
          "z": 0.0,
          "color": "#CC80FF",
          "radius": 0.36
        },
        {
          "symbol": "F",
          "x": 0.6,
          "y": 0.0,
          "z": 0.0,
          "color": "#90E050",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ]
      ]
    }
  },
  "Au-Hg": {
    "formula": "AuHg\u2082",
    "name": "Gold Amalgam",
    "equation": "Au(s) + 2Hg(l) \u2192 AuHg\u2082(s)",
    "bond_type": "Metallic Alloy (Amalgam)",
    "delta_en": 0.54,
    "enthalpy": "-14.2 kJ/mol",
    "geometry": "Intermetallic Amalgam Matrix",
    "state": "Silvery Paste / Solid",
    "description": "Liquid mercury easily wets and dissolves elemental gold without heating, a phenomenon utilized since antiquity for gold extraction.",
    "mechanism": "Mercury atoms diffuse into the gold crystal lattice, forming metallic bonds facilitated by relativistic stabilization of 6s electrons in both heavy elements.",
    "model": {
      "atoms": [
        {
          "symbol": "Au",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFD123",
          "radius": 0.48
        },
        {
          "symbol": "Hg",
          "x": -0.85,
          "y": 0.0,
          "z": 0.0,
          "color": "#B8B8D0",
          "radius": 0.48
        },
        {
          "symbol": "Hg",
          "x": 0.85,
          "y": 0.0,
          "z": 0.0,
          "color": "#B8B8D0",
          "radius": 0.48
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ]
      ]
    }
  },
  "N-Ti": {
    "formula": "TiN",
    "name": "Titanium(III) Nitride (Osbornite)",
    "equation": "2Ti(s) + N\u2082(g) \u2192 2TiN(s)",
    "bond_type": "Mixed Covalent, Ionic, and Metallic (Refractory Interstitial Nitride)",
    "delta_en": 1.5,
    "enthalpy": "-337.7 kJ/mol (Exothermic)",
    "geometry": "Octahedral (6-coordinate, Fm-3m Rock-Salt Lattice)",
    "state": "Metallic gold-colored refractory ceramic solid (mp: 3203 K, hardness: 21 GPa)",
    "description": "Extremely hard, wear-resistant refractory ceramic with a brilliant gold color used for drill bit coatings, medical implants, and microelectronic diffusion barriers.",
    "mechanism": "In the bulk rock-salt lattice, strong directional covalent bonding arises from \u03c3 and \u03c0 p-d hybridization between Nitrogen 2p orbitals and Titanium 3d (eg and t2g) orbitals. Formal transfer of 3 electrons satisfies the octet on the nitride center ([He] 2s\u00b2 2p\u2076), while remaining delocalized d-electrons populate conduction bands, imparting metallic electrical conductivity.",
    "model": {
      "atoms": [
        {
          "symbol": "Ti",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#BFC2C7",
          "radius": 0.48
        },
        {
          "symbol": "N",
          "x": 1.25,
          "y": 0.0,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": -1.25,
          "y": 0.0,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": 0.0,
          "y": 1.25,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": 0.0,
          "y": -1.25,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": 0.0,
          "y": 0.0,
          "z": 1.25,
          "color": "#3050F8",
          "radius": 0.42
        },
        {
          "symbol": "N",
          "x": 0.0,
          "y": 0.0,
          "z": -1.25,
          "color": "#3050F8",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ],
        [
          0,
          6,
          1
        ]
      ]
    }
  },
  "C-H-O": {
    "formula": "C\u2082H\u2085OH / CH\u2083COOH",
    "name": "Ethanol / Acetic Acid Organic Oxygenates",
    "alt_formula": "H\u2082CO\u2083 (Carbonic Acid), CH\u2083OH (Methanol), C\u2086H\u2081\u2082O\u2086 (Glucose)",
    "equation": "2C(s) + 3H\u2082(g) + \u00bdO\u2082(g) \u2192 C\u2082H\u2085OH(l)",
    "bond_type": "Polar Covalent Organic Macromolecule",
    "delta_en": 0.89,
    "enthalpy": "-277.6 kJ/mol (Ethanol)",
    "geometry": "sp\u00b3 Tetrahedral Carbons + Bent Hydroxyl (-OH)",
    "state": "Volatile Liquid at STP",
    "description": "Cornerstone triad of organic chemistry and biochemistry. Carbon forms the structural catenated backbone, hydrogen terminates bonds, and oxygen introduces polar reactive functional groups (alcohols, carboxylic acids, esters, carbohydrates).",
    "mechanism": "Carbon atoms undergo sp\u00b3 hybridization forming sturdy C-C and C-H \u03c3 bonds. Oxygen incorporates into the framework via bent C-O-H single bonds (104.5\u00b0) or planar C=O carbonyl double bonds (120\u00b0), introducing strong hydrogen-bonding capabilities.",
    "model": {
      "atoms": [
        {
          "symbol": "C",
          "x": -0.7,
          "y": 0.0,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "C",
          "x": 0.7,
          "y": 0.0,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 1.4,
          "y": 0.9,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.45
        },
        {
          "symbol": "H",
          "x": 2.2,
          "y": 0.6,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -1.2,
          "y": 0.9,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -1.2,
          "y": -0.6,
          "z": 0.7,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -1.2,
          "y": -0.6,
          "z": -0.7,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": 0.7,
          "y": -0.9,
          "z": 0.5,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": 0.7,
          "y": -0.9,
          "z": -0.5,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          2,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ],
        [
          0,
          6,
          1
        ],
        [
          1,
          7,
          1
        ],
        [
          1,
          8,
          1
        ]
      ]
    }
  },
  "H-O-S": {
    "formula": "H\u2082SO\u2084",
    "name": "Sulfuric Acid ('Oil of Vitriol / King of Chemicals')",
    "alt_formula": "H\u2082SO\u2083 (Sulfurous Acid)",
    "equation": "SO\u2083(g) + H\u2082O(l) \u2192 H\u2082SO\u2084(l)",
    "bond_type": "Polar Covalent Oxyacid (Resonance-Stabilized)",
    "delta_en": 0.86,
    "enthalpy": "-814.0 kJ/mol (Exothermic)",
    "geometry": "Tetrahedral Sulfate Core [SO\u2084]\u00b2\u207b with Two Terminal -OH",
    "state": "Dense, Oily Corrosive Liquid at STP",
    "description": "The most widely produced industrial chemical in the world; indicator of industrial strength. Extremely strong diprotic acid and powerful dehydrating agent.",
    "mechanism": "Sulfur is hypervalent (sp\u00b3 hybridization) coordinated to four oxygens. Two S=O double bonds involve 3d-2p \u03c0 back-donation, while two S-O-H single bonds can dissociate in aqueous solution to yield two hydronium ions (H\u2083O\u207a) and the highly resonance-stabilized sulfate dianion [SO\u2084]\u00b2\u207b.",
    "model": {
      "atoms": [
        {
          "symbol": "S",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFFF30",
          "radius": 0.48
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": 1.25,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": -1.25,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 1.15,
          "y": 0.0,
          "z": 0.5,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": -1.15,
          "y": 0.0,
          "z": -0.5,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "H",
          "x": 1.8,
          "y": 0.0,
          "z": 1.0,
          "color": "#FFFFFF",
          "radius": 0.3
        },
        {
          "symbol": "H",
          "x": -1.8,
          "y": 0.0,
          "z": -1.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          2
        ],
        [
          0,
          2,
          2
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          3,
          5,
          1
        ],
        [
          4,
          6,
          1
        ]
      ]
    }
  },
  "H-N-O": {
    "formula": "HNO\u2083",
    "name": "Nitric Acid ('Aqua Fortis')",
    "alt_formula": "NH\u2084NO\u2083 (Ammonium Nitrate)",
    "equation": "3NO\u2082(g) + H\u2082O(l) \u2192 2HNO\u2083(aq) + NO(g) (Ostwald Process)",
    "bond_type": "Polar Covalent Oxyacid with Resonance",
    "delta_en": 0.84,
    "enthalpy": "-174.1 kJ/mol",
    "geometry": "Planar Nitrate Group [NO\u2083]\u207b",
    "state": "Fuming Colorless to Yellow Liquid",
    "description": "Primary precursor for agricultural fertilizers and energetic materials. When mixed with HCl (1:3), forms Aqua Regia, capable of dissolving noble metals like gold and platinum.",
    "mechanism": "Nitrogen is sp\u00b2 hybridized in a trigonal planar geometry. A delocalized \u03c0 molecular orbital extends across the three nitrogen-oxygen bonds, conferring exceptional resonance stability to the nitrate anion [NO\u2083]\u207b.",
    "model": {
      "atoms": [
        {
          "symbol": "N",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#3050F8",
          "radius": 0.44
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": 1.18,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": -1.05,
          "y": -0.55,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 1.05,
          "y": -0.55,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "H",
          "x": 1.7,
          "y": 0.1,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          2
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          3,
          4,
          1
        ]
      ]
    }
  },
  "C-Ca-O": {
    "formula": "CaCO\u2083",
    "name": "Calcium Carbonate (Calcite / Limestone / Marble)",
    "equation": "CaO(s) + CO\u2082(g) \u2192 CaCO\u2083(s)",
    "bond_type": "Ionic Crystal with Polyatomic Planar Anion",
    "delta_en": 2.44,
    "enthalpy": "-1207.6 kJ/mol (Exothermic)",
    "geometry": "Trigonal Calcite / Aragonite Crystal Lattice",
    "state": "White Crystalline Solid at STP (Mohs 3)",
    "description": "Major component of marine organism shells, pearls, chalk, limestone, and marble. Over 4% of Earth's crust is composed of calcium carbonate.",
    "mechanism": "Consists of Ca\u00b2\u207a cations bound electrostatically to planar trigonal carbonate anions [CO\u2083]\u00b2\u207b. In [CO\u2083]\u00b2\u207b, carbon is sp\u00b2 hybridized with three equivalent C-O bonds (bond order 1.33) due to resonance delocalization.",
    "model": {
      "atoms": [
        {
          "symbol": "Ca",
          "x": 0.0,
          "y": 1.25,
          "z": 0.0,
          "color": "#3DFF00",
          "radius": 0.48
        },
        {
          "symbol": "C",
          "x": 0.0,
          "y": -0.7,
          "z": 0.0,
          "color": "#909090",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.0,
          "y": 0.35,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": 0.95,
          "y": -1.25,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "O",
          "x": -0.95,
          "y": -1.25,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        }
      ],
      "bonds": [
        [
          0,
          2,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          1,
          3,
          1
        ],
        [
          1,
          4,
          1
        ]
      ]
    }
  },
  "H-Na-O": {
    "formula": "NaOH",
    "name": "Sodium Hydroxide (Caustic Soda / Lye)",
    "equation": "2Na(s) + 2H\u2082O(l) \u2192 2NaOH(aq) + H\u2082(g)",
    "bond_type": "Ionic with Covalent Hydroxide Radical",
    "delta_en": 2.51,
    "enthalpy": "-425.6 kJ/mol",
    "geometry": "Orthorhombic Ionic Crystal with Linear [OH]\u207b",
    "state": "White Hygroscopic Flakes/Pellets (Highly Corrosive)",
    "description": "archetypal strong Arrhenius and Br\u00f8nsted-Lowry base. Dissociates 100% in water, generating tremendous hydration heat; widely used in soapmaking (saponification) and papermaking.",
    "mechanism": "Na completely transfers its single 3s valence electron to the hydroxyl radical (OH\u2022), yielding Na\u207a ([Ne]) and the closed-octet hydroxide anion [OH]\u207b ([Ne]). Omnidirectional Coulombic attractions create an ionic lattice.",
    "model": {
      "atoms": [
        {
          "symbol": "Na",
          "x": -0.85,
          "y": 0.0,
          "z": 0.0,
          "color": "#AB5CF2",
          "radius": 0.45
        },
        {
          "symbol": "O",
          "x": 0.5,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.42
        },
        {
          "symbol": "H",
          "x": 1.35,
          "y": 0.0,
          "z": 0.0,
          "color": "#FFFFFF",
          "radius": 0.3
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          1,
          2,
          1
        ]
      ]
    }
  },
  "C-Cr-Fe-Ni": {
    "formula": "Fe_bal Cr\u2081\u2088Ni\u2088C\u2080.\u2080\u2088",
    "name": "Austenitic Stainless Steel (AISI 304 / 316)",
    "equation": "Fe(l) + Cr(l) + Ni(l) + C(s) \u2192 Stainless Steel Matrix(s)",
    "bond_type": "Multi-Component Metallic Alloy (Austenite FCC Matrix)",
    "delta_en": 0.17,
    "enthalpy": "-24.5 kJ/mol (Solid Solution)",
    "geometry": "Face-Centered Cubic (FCC) Austenitic Crystal Lattice",
    "state": "Lustrous, Corrosion-Resistant Solid Metal",
    "description": "The quintessential corrosion-resistant alloy. Chromium (>10.5%) forms a microscopic, self-repairing Cr\u2082O\u2083 passive oxide film that prevents rust, while Nickel stabilizes the tough, ductile FCC austenite phase.",
    "mechanism": "Chromium and nickel dissolve substitutionally into the iron lattice, while small carbon atoms occupy interstitial octahedral voids, impeding dislocation glide to dramatically elevate yield strength.",
    "model": {
      "atoms": [
        {
          "symbol": "Fe",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#E06633",
          "radius": 0.45
        },
        {
          "symbol": "Cr",
          "x": 1.1,
          "y": 0.0,
          "z": 0.0,
          "color": "#8A99C7",
          "radius": 0.45
        },
        {
          "symbol": "Ni",
          "x": -1.1,
          "y": 0.0,
          "z": 0.0,
          "color": "#50D050",
          "radius": 0.45
        },
        {
          "symbol": "Fe",
          "x": 0.0,
          "y": 1.1,
          "z": 0.0,
          "color": "#E06633",
          "radius": 0.45
        },
        {
          "symbol": "Fe",
          "x": 0.0,
          "y": -1.1,
          "z": 0.0,
          "color": "#E06633",
          "radius": 0.45
        },
        {
          "symbol": "C",
          "x": 0.5,
          "y": 0.5,
          "z": 0.5,
          "color": "#909090",
          "radius": 0.32
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          0,
          5,
          1
        ],
        [
          1,
          3,
          1
        ]
      ]
    }
  },
  "Ba-Cu-O-Y": {
    "formula": "YBa\u2082Cu\u2083O\u2087\u208b\u03b4",
    "name": "YBCO (Yttrium Barium Copper Oxide Superconductor)",
    "equation": "\u00bdY\u2082O\u2083 + 2BaCO\u2083 + 3CuO \u2192 YBa\u2082Cu\u2083O\u2087 + 2CO\u2082",
    "bond_type": "Perovskite-Derived Mixed Cuprate-Oxide Superconducting Lattice",
    "delta_en": 2.55,
    "enthalpy": "-2720 kJ/mol",
    "geometry": "Orthorhombic Triple-Perovskite with CuO\u2082 Conducting Planes",
    "state": "Black Superconducting Ceramic Solid (Tc = 93 K)",
    "description": "Historic landmark material discovered in 1987. First material shown to exhibit zero electrical resistance above the boiling point of liquid nitrogen (77 K), allowing magnetic levitation via the Meissner effect.",
    "mechanism": "Superconductivity arises in planar two-dimensional CuO\u2082 layers. Hole doping produces Cooper electron pairs via strong antiferromagnetic spin fluctuations, condensing into a macroscopic quantum coherent state.",
    "model": {
      "atoms": [
        {
          "symbol": "Y",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#94FFFF",
          "radius": 0.48
        },
        {
          "symbol": "Ba",
          "x": 0.0,
          "y": 1.3,
          "z": 0.0,
          "color": "#00C900",
          "radius": 0.52
        },
        {
          "symbol": "Ba",
          "x": 0.0,
          "y": -1.3,
          "z": 0.0,
          "color": "#00C900",
          "radius": 0.52
        },
        {
          "symbol": "Cu",
          "x": 1.0,
          "y": 0.65,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "Cu",
          "x": -1.0,
          "y": 0.65,
          "z": 0.0,
          "color": "#C88033",
          "radius": 0.44
        },
        {
          "symbol": "O",
          "x": 1.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.38
        },
        {
          "symbol": "O",
          "x": -1.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#FF0D0D",
          "radius": 0.38
        }
      ],
      "bonds": [
        [
          0,
          5,
          1
        ],
        [
          0,
          6,
          1
        ],
        [
          3,
          5,
          1
        ],
        [
          4,
          6,
          1
        ],
        [
          1,
          3,
          1
        ],
        [
          1,
          4,
          1
        ],
        [
          2,
          3,
          1
        ],
        [
          2,
          4,
          1
        ]
      ]
    }
  },
  "Ni-Ti": {
    "formula": "NiTi",
    "name": "Nitinol (Nickel-Titanium Shape Memory Alloy)",
    "equation": "Ni(l) + Ti(l) \u2192 NiTi(s)",
    "bond_type": "Intermetallic Shape-Memory Alloy",
    "delta_en": 0.37,
    "enthalpy": "-67.8 kJ/mol",
    "geometry": "Austenite (B2 Cubic) \u21cc Martensite (B19' Monoclinic)",
    "state": "Superelastic Silvery Metallic Solid",
    "description": "Remarkable smart alloy that can be severely deformed and returns to its original shape upon gentle heating. Used in coronary stents, orthodontic archwires, and robotic actuators.",
    "mechanism": "Undergoes a diffusionless thermoelastic martensitic phase transformation. Stress or thermal triggers cause coordinated lattice shearing without breaking interatomic bonds.",
    "model": {
      "atoms": [
        {
          "symbol": "Ti",
          "x": -0.65,
          "y": 0.0,
          "z": 0.0,
          "color": "#BFC2C7",
          "radius": 0.48
        },
        {
          "symbol": "Ni",
          "x": 0.65,
          "y": 0.0,
          "z": 0.0,
          "color": "#50D050",
          "radius": 0.44
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ]
      ]
    }
  },
  "As-Ga": {
    "formula": "GaAs",
    "name": "Gallium Arsenide III-V Semiconductor",
    "equation": "Ga(l) + As(s) \u2192 GaAs(s)",
    "bond_type": "Polar Covalent Semiconductor (Zinc-Blende)",
    "delta_en": 0.37,
    "enthalpy": "-74.1 kJ/mol",
    "geometry": "Zinc-Blende (Sphalerite) Tetrahedral Network",
    "state": "Dark Gray Crystalline Solid (Bandgap: 1.424 eV)",
    "description": "Premier III-V semiconductor with direct bandgap and higher electron mobility than silicon; powers high-efficiency solar cells on Mars rovers, laser diodes, and 5G RF amplifiers.",
    "mechanism": "Ga (4s\u00b2 4p\u00b9) and As (4s\u00b2 4p\u00b3) average 4 valence electrons per atom. sp\u00b3 hybridization yields a tetrahedral zinc-blende lattice with high optical emission efficiency.",
    "model": {
      "atoms": [
        {
          "symbol": "Ga",
          "x": 0.0,
          "y": 0.0,
          "z": 0.0,
          "color": "#C28F8F",
          "radius": 0.46
        },
        {
          "symbol": "As",
          "x": 0.85,
          "y": 0.85,
          "z": 0.85,
          "color": "#BD80E3",
          "radius": 0.44
        },
        {
          "symbol": "As",
          "x": -0.85,
          "y": -0.85,
          "z": 0.85,
          "color": "#BD80E3",
          "radius": 0.44
        },
        {
          "symbol": "As",
          "x": -0.85,
          "y": 0.85,
          "z": -0.85,
          "color": "#BD80E3",
          "radius": 0.44
        },
        {
          "symbol": "As",
          "x": 0.85,
          "y": -0.85,
          "z": -0.85,
          "color": "#BD80E3",
          "radius": 0.44
        }
      ],
      "bonds": [
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ]
      ]
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CURATED_REACTIONS };
}
