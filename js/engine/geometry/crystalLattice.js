// engine/geometry/crystalLattice.js
// ============================================================================
// Subsystem D2 — crystal lattice generators.
//
// Builds fractional-coordinate bases for the common inorganic structure types,
// derives the lattice constant from ionic/metallic radii, and emits a
// supercell with nearest-neighbour bonds for the 3D viewport.
// ============================================================================

import { ELEMENTS_TENSOR } from '../../../data/elements_tensor.js';
import { ionicRadius, isMetal } from '../physics/electronicConfig.js';
import { predictAlloyStructure } from '../bonding/humeRothery.js';

const BASES = {
  SC: [[0, 0, 0]],
  BCC: [[0, 0, 0], [0.5, 0.5, 0.5]],
  FCC: [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]],
  HCP: [[0, 0, 0], [2 / 3, 1 / 3, 0.5]],
  DC: [
    [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0],
    [0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25],
  ],
};

const PACKING = { SC: 0.52, BCC: 0.68, B2: 0.68, FCC: 0.74, HCP: 0.74, DC: 0.34, zincblende: 0.34, rockSalt: 0.67, NaCl: 0.67, CsCl: 0.73, fluorite: 0.62, perovskite: 0.72 };
const COORD = { SC: 6, BCC: 8, B2: 8, FCC: 12, HCP: 12, DC: 4, zincblende: 4, rockSalt: 6, NaCl: 6, CsCl: 8, fluorite: 8, perovskite: 6 };

export function crystalFor(sp, tensors, supercell = 2) {
  const type = pickStructure(sp, tensors);
  if (!type) return null;
  const built = buildBasis(type, sp, tensors);
  if (!built) return null;
  const { basis, a, c, cutoff } = built;

  const atoms = [];
  const n = Math.max(1, Math.min(3, supercell));
  const seen = new Set();
  for (let ix = 0; ix < n; ix++) {
    for (let iy = 0; iy < n; iy++) {
      for (let iz = 0; iz < n; iz++) {
        for (const b of basis) {
          const key = `${b.Z}:${ix + b.f[0]}:${iy + b.f[1]}:${iz + b.f[2]}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const t = ELEMENTS_TENSOR[b.Z - 1];
          atoms.push({
            Z: b.Z,
            symbol: t.symbol,
            color: t.color,
            x: (ix + b.f[0]) * a,
            y: (iy + b.f[1]) * a,
            z: (iz + b.f[2]) * (c || a),
            radius: (b.radius || t.radii?.metallic || 1.2) * 0.42,
            frac: b.f,
          });
        }
      }
    }
  }

  // Center the supercell.
  const cx = (n - 1) * a / 2, cy = (n - 1) * a / 2, cz = (n - 1) * (c || a) / 2;
  for (const at of atoms) { at.x -= cx; at.y -= cy; at.z -= cz; }

  // Nearest-neighbour bonds.
  const bonds = [];
  const maxBonds = 700;
  for (let i = 0; i < atoms.length && bonds.length < maxBonds; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const d = Math.hypot(dx, dy, dz);
      if (d > 0.05 && d <= cutoff) {
        bonds.push([i, j, 1]);
        if (bonds.length >= maxBonds) break;
      }
    }
  }

  return {
    mode: 'crystal',
    formula: sp.formula,
    name: sp.name,
    lattice: type,
    latticeConstant: a,
    cAxis: c || null,
    coordination: COORD[type] || null,
    packingFraction: PACKING[type] || null,
    atoms,
    bonds,
    supercell: n,
    description: describe(type, a, sp, tensors),
  };
}

function pickStructure(sp, tensors) {
  if (sp.kind === 'alloy') return predictAlloyStructure(tensors).lattice;
  if (sp.kind === 'network') {
    const en = (t) => t?.chiPauling ?? t?.chiAllen ?? 0;
    const dEN = tensors.length > 1 ? Math.abs(en(tensors[0]) - en(tensors[1])) : 0;
    return dEN > 1.05 ? 'rockSalt' : 'zincblende';
  }
  if (sp.kind === 'ionic' || sp.kind === 'ionic-polyatomic') return sp.lattice === 'CsCl' ? 'CsCl' : sp.lattice === 'fluorite' ? 'fluorite' : 'NaCl';
  if (sp.kind === 'element') {
    const t = tensors[0];
    if (t?.nativeLattice) return t.nativeLattice;
    if (t && isMetal(t)) return 'FCC';
    if ([6, 14, 32].includes(t?.Z)) return 'DC';
    return null;
  }
  return null;
}

function buildBasis(type, sp, tensors) {
  if (type === 'NaCl' || type === 'CsCl') {
    const ions = sp.ions || [];
    const cat = ions.find(i => i.q > 0);
    const an = ions.find(i => i.q < 0);
    if (!cat || !an) return null;
    const catT = ELEMENTS_TENSOR[cat.Z - 1];
    const anT = an.poly ? null : ELEMENTS_TENSOR[an.Z - 1];
    const anZ = an.poly ? Number(Object.keys(sp.polyatomic.atomCounts)[0]) : an.Z;
    const rPlus = ionicRadius(catT, cat.q);
    const rMinus = an.poly ? 1.8 : ionicRadius(anT, an.q);
    if (type === 'CsCl') {
      const a = 2 * (rPlus + rMinus) / Math.sqrt(3);
      return {
        a,
        cutoff: a * 0.9,
        basis: [
          { Z: cat.Z, f: [0, 0, 0], radius: rPlus },
          { Z: anZ, f: [0.5, 0.5, 0.5], radius: rMinus },
        ],
      };
    }
    const a = 2 * (rPlus + rMinus);
    const basis = [];
    for (const f of BASES.FCC) basis.push({ Z: anZ, f, radius: rMinus });
    for (const f of [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5], [0.5, 0.5, 0.5]]) {
      basis.push({ Z: cat.Z, f, radius: rPlus });
    }
    return { a, cutoff: a * 0.62, basis };
  }
  if (type === 'fluorite') {
    const ions = sp.ions || [];
    const cat = ions.find(i => i.q > 0);
    const an = ions.find(i => i.q < 0);
    if (!cat || !an) return null;
    const anZ = an.poly ? Number(Object.keys(sp.polyatomic.atomCounts)[0]) : an.Z;
    const rPlus = ionicRadius(ELEMENTS_TENSOR[cat.Z - 1], cat.q);
    const rMinus = an.poly ? 1.8 : ionicRadius(ELEMENTS_TENSOR[an.Z - 1], an.q);
    const a = 4 * (rPlus + rMinus) / Math.sqrt(3);
    const basis = [];
    for (const f of BASES.FCC) basis.push({ Z: cat.Z, f, radius: rPlus });
    for (const f of [[0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75],
      [0.75, 0.75, 0.75], [0.25, 0.25, 0.75], [0.25, 0.75, 0.25], [0.75, 0.25, 0.25]]) {
      basis.push({ Z: anZ, f, radius: rMinus });
    }
    return { a, cutoff: a * 0.45, basis };
  }

  if (type === 'rockSalt') {
    const A = tensors[0], B = tensors[1] || tensors[0];
    const rA = A.radii?.covalentSingle || 1.2;
    const rB = B.radii?.covalentSingle || 1.2;
    const a = 2 * (rA + rB);
    const basis = [];
    for (const f of BASES.FCC) basis.push({ Z: A.Z, f, radius: rA });
    for (const f of [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5], [0.5, 0.5, 0.5]]) {
      basis.push({ Z: B.Z, f, radius: rB });
    }
    return { a, cutoff: a * 0.62, basis };
  }

  if (type === 'zincblende') {
    const A = tensors[0], B = tensors[1] || tensors[0];
    const rA = A.radii?.covalentSingle || 1.2;
    const rB = B.radii?.covalentSingle || 1.2;
    const a = 4 * (rA + rB) / Math.sqrt(3);
    const basis = [];
    for (const f of BASES.FCC) basis.push({ Z: A.Z, f, radius: rA });
    for (const f of [[0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25]]) {
      basis.push({ Z: B.Z, f, radius: rB });
    }
    return { a, cutoff: a * 0.45, basis };
  }

  // Ordered B2 (CsCl-type) alloy — NiTi, TiFe, etc.
  if (type === 'B2') {
    const A = tensors[0], B = tensors[1] || tensors[0];
    const rA = A.radii?.metallic || A.radii?.covalentSingle || 1.2;
    const rB = B.radii?.metallic || B.radii?.covalentSingle || 1.2;
    const a = 2 * (rA + rB) / Math.sqrt(3);
    return {
      a,
      cutoff: a * 0.9,
      basis: [
        { Z: A.Z, f: [0, 0, 0], radius: rA },
        { Z: B.Z, f: [0.5, 0.5, 0.5], radius: rB },
      ],
    };
  }

  // Metals and covalent networks. Alloys distribute species over the basis.
  const t = tensors[0];
  const r = t?.radii?.metallic || t?.radii?.covalentSingle || 1.3;
  const speciesFor = (i) => {
    if (sp.kind === 'alloy' && tensors.length > 1) return tensors[i % tensors.length];
    return t;
  };
  if (type === 'FCC') {
    const a = 2 * Math.SQRT2 * r;
    return { a, cutoff: a * 0.72, basis: BASES.FCC.map((f, i) => { const s = speciesFor(i); return { Z: s.Z, f, radius: s.radii?.metallic || r }; }) };
  }
  if (type === 'BCC') {
    const a = 4 * r / Math.sqrt(3);
    return { a, cutoff: a * 0.88, basis: BASES.BCC.map((f, i) => { const s = speciesFor(i); return { Z: s.Z, f, radius: s.radii?.metallic || r }; }) };
  }
  if (type === 'HCP') {
    const a = 2 * r, c = 1.633 * a;
    return { a, c, cutoff: a * 0.72, basis: BASES.HCP.map((f, i) => { const s = speciesFor(i); return { Z: s.Z, f, radius: s.radii?.metallic || r }; }) };
  }
  if (type === 'DC') {
    const a = 8 * r / Math.sqrt(3);
    return { a, cutoff: a * 0.45, basis: BASES.DC.map(f => ({ Z: t.Z, f, radius: r })) };
  }
  if (type === 'SC') {
    const a = 2 * r;
    return { a, cutoff: a * 1.05, basis: BASES.SC.map(f => ({ Z: t.Z, f, radius: r })) };
  }
  return null;
}

function describe(type, a, sp, tensors) {
  const names = {
    FCC: 'face-centred cubic', BCC: 'body-centred cubic', B2: 'ordered B2 (CsCl-type)', HCP: 'hexagonal close-packed',
    SC: 'simple cubic', DC: 'diamond cubic', zincblende: 'zinc-blende (ZnS-type)', rockSalt: 'rock-salt (TiN-type)', NaCl: 'rock-salt (NaCl-type)',
    CsCl: 'caesium-chloride (CsCl-type)', fluorite: 'fluorite (CaF₂-type)',
  };
  const t = tensors[0];
  return `${sp.formula} crystallises as ${names[type] || type}; a = ${a.toFixed(3)} Å, coordination ${COORD[type] || '—'}.${t?.nativeLattice ? ` Native ${t.symbol} lattice: ${t.nativeLattice}.` : ''}`;
}
