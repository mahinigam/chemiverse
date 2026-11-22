// Interactive 3D Molecular and Atomic Visualizer powered by Three.js
class Visualizer3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;
    this.currentMode = null; // 'bohr', 'molecule'
    this.isSpaceFilling = false;

    // Animation objects
    this.electrons = [];
    this.orbitGroup = null;
    this.moleculeGroup = null;
    this.autoRotate = true;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 350;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 7);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous canvas if any
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.4);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    // 5. Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.minDistance = 2;
      this.controls.maxDistance = 25;
      this.controls.addEventListener('start', () => { this.autoRotate = false; });
      this.controls.addEventListener('end', () => {
        setTimeout(() => { this.autoRotate = true; }, 3000);
      });
    }

    // 6. Handle resize
    window.addEventListener('resize', () => this.onWindowResize());

    // 7. Start render loop
    this.animate();
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  clearScene() {
    if (this.orbitGroup) {
      this.scene.remove(this.orbitGroup);
      this.orbitGroup = null;
    }
    if (this.moleculeGroup) {
      this.scene.remove(this.moleculeGroup);
      this.moleculeGroup = null;
    }
    this.electrons = [];
  }

  // --- MODE 1: Render 3D Bohr Atom with Animated Orbiting Electrons ---
  renderBohrAtom(element) {
    this.clearScene();
    this.currentMode = 'bohr';
    this.orbitGroup = new THREE.Group();
    this.scene.add(this.orbitGroup);

    this.camera.position.set(0, 0, Math.max(6, (element.shells.length) * 1.5 + 2));
    if (this.controls) this.controls.target.set(0, 0, 0);

    // 1. Central Nucleus Cluster (Protons & Neutrons)
    const nucleusGroup = new THREE.Group();
    const protonCount = Math.min(element.number, 18); // representative particles
    const neutronCount = Math.min(Math.round(element.mass - element.number), 18);
    const particleRadius = 0.12;

    const protonMat = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      shininess: 90
    });
    const neutronMat = new THREE.MeshPhongMaterial({
      color: 0x94a3b8,
      emissive: 0x475569,
      shininess: 90
    });

    const sphereGeom = new THREE.SphereGeometry(particleRadius, 16, 16);

    for (let i = 0; i < protonCount + neutronCount; i++) {
      const isProton = i < protonCount;
      const mesh = new THREE.Mesh(sphereGeom, isProton ? protonMat : neutronMat);
      // Random cluster inside core sphere
      const r = 0.35 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      nucleusGroup.add(mesh);
    }

    // Glowing halo for nucleus
    const glowGeom = new THREE.SphereGeometry(0.55, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.18,
      wireframe: true
    });
    nucleusGroup.add(new THREE.Mesh(glowGeom, glowMat));

    this.orbitGroup.add(nucleusGroup);

    // 2. Electron Shells & Orbiting Electrons
    const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
    const electronGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const electronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    element.shells.forEach((electronCount, shellIdx) => {
      const radius = 1.0 + shellIdx * 0.75;
      const tiltX = (shellIdx * 0.38) + 0.2;
      const tiltY = (shellIdx * 0.52);

      // Orbital Track Ring
      const ringGeom = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.set(tiltX, tiltY, 0);
      this.orbitGroup.add(ringMesh);

      // Add Orbiting Electrons for this shell
      for (let e = 0; e < electronCount; e++) {
        const baseAngle = (e / electronCount) * Math.PI * 2;
        const eMesh = new THREE.Mesh(electronGeom, electronMat);

        this.electrons.push({
          mesh: eMesh,
          radius: radius,
          tiltX: tiltX,
          tiltY: tiltY,
          baseAngle: baseAngle,
          speed: (1.5 / Math.sqrt(radius)) * 0.03
        });

        this.orbitGroup.add(eMesh);
      }
    });
  }

  // --- MODE 2: Render 3D Molecule or Elemental Structure (Ball & Stick / Space Filling) ---
  renderMolecule(modelData, options = {}) {
    this.clearScene();
    this.currentMode = 'molecule';
    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);

    if (!modelData || !modelData.atoms || modelData.atoms.length === 0) return;

    const atoms = modelData.atoms;
    const bonds = modelData.bonds || [];

    // Calculate center of mass to center the molecule
    let cx = 0, cy = 0, cz = 0;
    atoms.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
    cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;

    // 1. Render Atoms
    const atomMeshes = [];
    atoms.forEach((atom, idx) => {
      const rad = this.isSpaceFilling ? (atom.radius * 2.2) : (atom.radius || 0.42);
      const geom = new THREE.SphereGeometry(rad, 32, 32);
      const hexColor = parseInt((atom.color || '#cccccc').replace('#', '0x'), 16);

      const mat = new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.25,
        metalness: 0.15,
        emissive: 0x111111
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(atom.x - cx, atom.y - cy, atom.z - cz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Add atom symbol billboard label
      const sprite = this.createLabelSprite(atom.symbol);
      sprite.position.set(0, rad + 0.2, 0);
      mesh.add(sprite);

      this.moleculeGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    // 2. Render Bonds (if not space filling)
    if (!this.isSpaceFilling) {
      bonds.forEach(([idx1, idx2, order]) => {
        if (!atomMeshes[idx1] || !atomMeshes[idx2]) return;
        const pos1 = atomMeshes[idx1].position;
        const pos2 = atomMeshes[idx2].position;
        this.createBondsBetween(pos1, pos2, order || 1);
      });
    }

    // Set camera distance based on molecule bounding radius
    let maxDist = 0;
    atomMeshes.forEach(m => {
      const d = m.position.length();
      if (d > maxDist) maxDist = d;
    });
    this.camera.position.set(0, 0, Math.max(4.5, maxDist * 2.6));
    if (this.controls) this.controls.target.set(0, 0, 0);
  }

  createBondsBetween(p1, p2, order) {
    const v = new THREE.Vector3().subVectors(p2, p1);
    const length = v.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.4,
      metalness: 0.2
    });

    const bondRadius = 0.08;

    if (order === 1) {
      const geom = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 16);
      const cyl = new THREE.Mesh(geom, bondMat);
      cyl.position.copy(mid);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      this.moleculeGroup.add(cyl);
    } else if (order === 2) {
      // Double bond: two parallel cylinders
      const offsetDist = 0.12;
      const normal = new THREE.Vector3(0, 0, 1).cross(v).normalize().multiplyScalar(offsetDist);
      if (normal.length() === 0) normal.set(offsetDist, 0, 0);

      [-1, 1].forEach(sign => {
        const offset = normal.clone().multiplyScalar(sign);
        const geom = new THREE.CylinderGeometry(bondRadius * 0.8, bondRadius * 0.8, length, 16);
        const cyl = new THREE.Mesh(geom, bondMat);
        cyl.position.copy(mid).add(offset);
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
        this.moleculeGroup.add(cyl);
      });
    } else if (order === 3) {
      // Triple bond: center + two offsets
      const offsetDist = 0.16;
      const normal = new THREE.Vector3(0, 0, 1).cross(v).normalize().multiplyScalar(offsetDist);
      if (normal.length() === 0) normal.set(offsetDist, 0, 0);

      [-1, 0, 1].forEach(sign => {
        const offset = normal.clone().multiplyScalar(sign);
        const geom = new THREE.CylinderGeometry(bondRadius * 0.7, bondRadius * 0.7, length, 16);
        const cyl = new THREE.Mesh(geom, bondMat);
        cyl.position.copy(mid).add(offset);
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
        this.moleculeGroup.add(cyl);
      });
    }
  }

  createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.roundRect ? ctx.roundRect(14, 10, 100, 44, 12) : ctx.rect(14, 10, 100, 44);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'Bold 28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.65, 0.32, 1);
    return sprite;
  }

  toggleSpaceFilling() {
    this.isSpaceFilling = !this.isSpaceFilling;
    return this.isSpaceFilling;
  }

  resetView() {
    this.camera.position.set(0, 0, 7);
    if (this.controls) this.controls.target.set(0, 0, 0);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // 1. Bohr Model electron orbit animation
    if (this.currentMode === 'bohr') {
      this.electrons.forEach(e => {
        e.baseAngle += e.speed;
        // Compute circular position on inclined ring
        const x = Math.cos(e.baseAngle) * e.radius;
        const y = Math.sin(e.baseAngle) * e.radius;
        const z = 0;

        // Apply same Euler tilt as the ring
        const pos = new THREE.Vector3(x, y, z);
        pos.applyEuler(new THREE.Euler(e.tiltX, e.tiltY, 0));
        e.mesh.position.copy(pos);
      });

      if (this.autoRotate && this.orbitGroup) {
        this.orbitGroup.rotation.y += 0.003;
      }
    }

    // 2. Molecule continuous gentle rotation
    if (this.currentMode === 'molecule' && this.autoRotate && this.moleculeGroup) {
      this.moleculeGroup.rotation.y += 0.005;
      this.moleculeGroup.rotation.x += 0.002;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Visualizer3D };
}
