// molecule3d.js
// ============================================================================
// Three.js renderer for the engine's geometry output. It draws both molecular
// VSEPR topologies and crystal supercells from the same atom/bond schema:
//   { atoms: [{ Z, symbol, color, x, y, z, radius }], bonds: [[i, j, order]] }
// It also renders the animated Bohr shell model for the element inspector.
// ============================================================================

const THREE = window.THREE;

const CATEGORY_METAL = new Set([
  'alkali-metal', 'alkaline-earth', 'transition-metal',
  'post-transition-metal', 'lanthanide', 'actinide',
]);

export class Visualizer3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;
    this.currentMode = null;
    this.currentGeometry = null;
    this.currentOptions = {};
    this.isSpaceFilling = false;
    this.autoRotate = true;
    this.idleTimer = null;
    this.electrons = [];
    this.root = null;
    this._disposables = [];
    this._resizeObserver = null;
    this.disabled = false;

    if (this.container) this.init();
  }

  init() {
    if (!THREE) {
      this.disabled = true;
      this.container.innerHTML = '<div class="viewport-fallback">3D engine unavailable. Check the Three.js CDN connection.</div>';
      return;
    }

    const width = Math.max(1, this.container.clientWidth || 480);
    const height = Math.max(1, this.container.clientHeight || 380);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070a11, 0.015);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 500);
    this.camera.position.set(0, 1.6, 9);

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      this.disabled = true;
      this.scene = null;
      this.camera = null;
      this.container.innerHTML = '<div class="viewport-fallback">WebGL context unavailable. The reaction results remain fully computed.</div>';
      return;
    }
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.26));
    const hemi = new THREE.HemisphereLight(0x9ecbff, 0x0a0d16, 0.32);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(6, 9, 8);
    this.scene.add(key);

    const rim = new THREE.PointLight(0x38bdf8, 0.75, 40);
    rim.position.set(-7, -3, 5);
    this.scene.add(rim);

    const warm = new THREE.PointLight(0xf472b6, 0.3, 36);
    warm.position.set(5, -5, -6);
    this.scene.add(warm);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.2);
    fill.position.set(-4, -6, -5);
    this.scene.add(fill);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.075;
      this.controls.rotateSpeed = 0.85;
      this.controls.zoomSpeed = 0.9;
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 60;
      this.controls.addEventListener('start', () => {
        this.autoRotate = false;
        clearTimeout(this.idleTimer);
      });
      this.controls.addEventListener('end', () => {
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => { this.autoRotate = true; }, 4200);
      });
    }

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(this.container);
    window.addEventListener('resize', () => this.resize());

    this.animate();
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _track(object) {
    this._disposables.push(object);
    return object;
  }

  _clear() {
    if (!this.scene) return;
    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const m of mats) {
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      });
    }
    this.root = null;
    this.currentGeometry = null;
    this.currentMode = null;
    this.electrons = [];
    this._disposables = [];
  }

  // -------------------------------------------------------------------------
  // Bohr atom
  // -------------------------------------------------------------------------
  renderBohrAtom(tensor) {
    if (!this.scene) return;
    this._clear();
    this.currentMode = 'bohr';
    this.currentGeometry = null;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    const shells = Array.isArray(tensor.shells) ? tensor.shells : [];
    const shellCount = Math.max(1, shells.length);
    const nucleusR = 0.32 + Math.min(0.24, tensor.Z * 0.0018);

    const nucleus = new THREE.Group();
    const protons = Math.min(20, Math.max(1, Math.round(tensor.Z / 3)));
    const neutrons = Math.min(20, Math.max(1, Math.round((tensor.mass || tensor.Z * 2) / 3) - protons));
    const particleGeom = this._track(new THREE.SphereGeometry(0.1, 12, 12));
    const protonMat = this._track(new THREE.MeshStandardMaterial({
      color: 0xff5d73, emissive: 0x6b1020, roughness: 0.3, metalness: 0.2,
    }));
    const neutronMat = this._track(new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, emissive: 0x1e293b, roughness: 0.42, metalness: 0.25,
    }));

    for (let i = 0; i < protons + neutrons; i++) {
      const mesh = new THREE.Mesh(particleGeom, i < protons ? protonMat : neutronMat);
      const r = nucleusR * 0.72 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      nucleus.add(mesh);
    }

    const halo = this._track(new THREE.Mesh(
      this._track(new THREE.SphereGeometry(nucleusR * 1.5, 20, 20)),
      this._track(new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08, wireframe: true })),
    ));
    nucleus.add(halo);
    this.root.add(nucleus);

    const electronGeom = this._track(new THREE.SphereGeometry(0.075, 12, 12));
    const electronMat = this._track(new THREE.MeshStandardMaterial({
      color: 0x7dd3fc, emissive: 0x0369a1, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.1,
    }));

    shells.forEach((count, shellIdx) => {
      const radius = 1.05 + shellIdx * 0.66;
      const tiltX = 0.22 + shellIdx * 0.31;
      const tiltY = shellIdx * 0.47;

      const ring = this._track(new THREE.Mesh(
        this._track(new THREE.RingGeometry(radius - 0.012, radius + 0.012, 96)),
        this._track(new THREE.MeshBasicMaterial({
          color: shellIdx === shells.length - 1 ? 0x38bdf8 : 0x64748b,
          transparent: true,
          opacity: shellIdx === shells.length - 1 ? 0.55 : 0.25,
          side: THREE.DoubleSide,
        })),
      ));
      ring.rotation.set(tiltX, tiltY, 0);
      this.root.add(ring);

      const shown = Math.min(count, 32);
      for (let e = 0; e < shown; e++) {
        const mesh = new THREE.Mesh(electronGeom, electronMat);
        this.electrons.push({
          mesh,
          radius,
          tiltX,
          tiltY,
          baseAngle: (e / shown) * Math.PI * 2,
          speed: (0.9 + 0.35 / (shellIdx + 1)) * 0.0075,
        });
        this.root.add(mesh);
      }
    });

    this._frameCamera(1.05 + (shellCount - 1) * 0.66 + 0.7);
    if (this.controls) this.controls.target.set(0, 0, 0);
    this.autoRotate = true;
  }

  // -------------------------------------------------------------------------
  // Molecule / crystal geometry
  // -------------------------------------------------------------------------
  renderGeometry(geometry, options = {}) {
    if (!this.scene) return;
    this._clear();
    this.currentGeometry = geometry;
    this.currentOptions = options;
    this.currentMode = geometry?.mode === 'crystal' ? 'crystal' : 'molecule';
    this.root = new THREE.Group();
    this.scene.add(this.root);

    const atoms = Array.isArray(geometry?.atoms) ? geometry.atoms : [];
    if (!atoms.length) {
      this._renderEmpty();
      return;
    }

    let cx = 0, cy = 0, cz = 0;
    for (const a of atoms) { cx += a.x; cy += a.y; cz += a.z; }
    cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;

    const isCrystal = this.currentMode === 'crystal';
    const meshes = [];
    const labelAtoms = atoms.length <= 26;

    atoms.forEach((atom, idx) => {
      const rawRadius = Math.max(0.12, atom.radius || 0.38);
      const radius = this.isSpaceFilling
        ? (isCrystal ? rawRadius : rawRadius * 2.15)
        : (isCrystal ? rawRadius * 0.58 : rawRadius);
      const geom = this._track(new THREE.SphereGeometry(radius, isCrystal ? 18 : 28, isCrystal ? 18 : 28));
      const color = new THREE.Color(atom.color || '#9ca3af').offsetHSL(0, 0.2, 0);
      const metal = CATEGORY_METAL.has(atom.category) || atom.metalness === true;
      const mat = this._track(new THREE.MeshStandardMaterial({
        color,
        roughness: metal ? 0.42 : 0.55,
        metalness: metal ? 0.08 : 0.02,
        emissive: color.clone().multiplyScalar(0.14),
        emissiveIntensity: 0.9,
      }));
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(atom.x - cx, atom.y - cy, atom.z - cz);
      this.root.add(mesh);
      meshes.push(mesh);

      if (!isCrystal && labelAtoms && !this.isSpaceFilling) {
        const sprite = this._makeLabel(atom.symbol, atom.color || '#9ca3af');
        sprite.position.set(0, radius + 0.2, 0);
        mesh.add(sprite);
      }
    });

    const bonds = Array.isArray(geometry?.bonds) ? geometry.bonds : [];
    if (!this.isSpaceFilling && bonds.length) {
      if (isCrystal) {
        this._drawCrystalBonds(bonds, meshes);
      } else {
        for (const [i, j, order] of bonds) {
          if (!meshes[i] || !meshes[j]) continue;
          this._drawBond(meshes[i].position, meshes[j].position, order || 1);
        }
      }
    }

    let maxR = 0;
    for (const m of meshes) maxR = Math.max(maxR, m.position.length() + m.geometry.parameters.radius);
    this._frameCamera(Math.max(2.0, maxR));
    if (this.controls) this.controls.target.set(0, 0, 0);
    this.autoRotate = true;
  }

  _renderEmpty() {
    const geom = this._track(new THREE.SphereGeometry(0.4, 20, 20));
    const mat = this._track(new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true }));
    const mesh = new THREE.Mesh(geom, mat);
    this.root.add(mesh);
    this._frameCamera(3);
  }

  _drawBond(p1, p2, order) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const length = dir.length();
    if (length < 0.001) return;
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const baseRadius = 0.045;

    const offsets = order === 3 ? [-1, 0, 1] : order === 2 ? [-1, 1] : [0];
    const normal = new THREE.Vector3(0, 0, 1).cross(dir).normalize();
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0);
    const spread = order === 3 ? 0.1 : 0.075;

    for (const sign of offsets) {
      const geom = this._track(new THREE.CylinderGeometry(
        baseRadius * (order > 1 ? 0.72 : 1),
        baseRadius * (order > 1 ? 0.72 : 1),
        length, 10,
      ));
      const mat = this._track(new THREE.MeshStandardMaterial({
        color: 0x9fb3cc, roughness: 0.48, metalness: 0.12,
      }));
      const cyl = new THREE.Mesh(geom, mat);
      cyl.position.copy(mid).addScaledVector(normal, sign * spread);
      cyl.quaternion.copy(quat);
      this.root.add(cyl);
    }
  }

  _drawCrystalBonds(bonds, meshes) {
    const positions = [];
    for (const [i, j] of bonds) {
      if (!meshes[i] || !meshes[j]) continue;
      positions.push(
        meshes[i].position.x, meshes[i].position.y, meshes[i].position.z,
        meshes[j].position.x, meshes[j].position.y, meshes[j].position.z,
      );
    }
    if (!positions.length) return;
    const geom = this._track(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = this._track(new THREE.LineBasicMaterial({
      color: 0x7dd3fc, transparent: true, opacity: 0.34,
    }));
    this.root.add(new THREE.LineSegments(geom, mat));
  }

  _makeLabel(text, color = '#e2e8f0') {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 160, 80);
    ctx.fillStyle = 'rgba(7, 10, 17, 0.82)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const x = 18, y = 16, w = 124, h = 48, r = 14;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 80, 41);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.44, 0.22, 1);
    this._track(material);
    this._track(texture);
    return sprite;
  }

  _frameCamera(radius) {
    if (!this.camera) return;
    const r = Math.max(1.2, radius);
    // Fit the bounding sphere to the narrower of the vertical/horizontal FOV,
    // so tall portrait viewports do not clip the crystal.
    const vFov = (this.camera.fov * Math.PI) / 180;
    const aspect = Math.max(0.25, this.camera.aspect || 1);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const fit = (r / Math.sin(Math.min(vFov, hFov) / 2)) * 1.0;
    const dir = new THREE.Vector3(0.62, 0.34, 2.2).normalize();
    this.camera.position.copy(dir.multiplyScalar(fit));
    this.camera.near = Math.max(0.02, fit * 0.01);
    this.camera.far = fit * 20;
    this.camera.updateProjectionMatrix();
  }

  setSpaceFilling(value) {
    this.isSpaceFilling = value == null ? !this.isSpaceFilling : !!value;
    if (this.currentGeometry) this.renderGeometry(this.currentGeometry, this.currentOptions);
    return this.isSpaceFilling;
  }

  resetView() {
    if (this.currentMode === 'bohr') {
      this._frameCamera(4.5);
    } else if (this.currentGeometry) {
      this.renderGeometry(this.currentGeometry, this.currentOptions);
    } else {
      this.camera.position.set(0, 1.6, 9);
      if (this.controls) this.controls.target.set(0, 0, 0);
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.currentMode === 'bohr') {
      for (const e of this.electrons) {
        e.baseAngle += e.speed;
        const pos = new THREE.Vector3(
          Math.cos(e.baseAngle) * e.radius,
          Math.sin(e.baseAngle) * e.radius,
          0,
        );
        pos.applyEuler(new THREE.Euler(e.tiltX, e.tiltY, 0));
        e.mesh.position.copy(pos);
      }
    }

    if (this.autoRotate && this.root) {
      const speed = this.currentMode === 'crystal' ? 0.0022 : 0.0038;
      this.root.rotation.y += speed;
      if (this.currentMode === 'molecule') this.root.rotation.x += speed * 0.22;
    }

    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.idleTimer);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._clear();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
