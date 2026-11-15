import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import {
  ACCESS_POINT,
  ASSEMBLY,
  CORE,
  EXPLODE_GAP,
  FLOOR_H,
  LIFT,
  PLATE_D,
  PLATE_W,
  ROAD_MID,
  ROAD_START,
  route,
  STAIR_A,
  STAIR_B,
  WAIT_B,
} from '@/lib/command/building3d/geometry';
import { FLOOR_COLOR, FLOOR_LABEL, occColor, VIZ, type FloorSummary } from '@/lib/command/building3d/status';
import type { BPos, Freshness, Layers, OccupantView, Selection, Snapshot, TeamView } from '@/lib/command/building3d/types';

export interface SceneView {
  floors: number;
  snapshot: Snapshot;
  summaries: Map<number, FloorSummary>;
  layers: Layers;
  selection: Selection | null;
  floor: number | null;
  exploded: boolean;
  isolate: boolean;
  /** Ids allowed by the active search or filter. Null means everything. */
  visibleIds: Set<string> | null;
}

export interface HoverInfo {
  kind: 'occupant' | 'team' | 'floor' | 'waiting';
  id: string;
  x: number;
  y: number;
}

interface Callbacks {
  onSelect: (s: Selection | null) => void;
  onHover: (h: HoverInfo | null) => void;
}

interface FloorObj {
  n: number;
  slab: THREE.Mesh;
  slabMat: THREE.MeshBasicMaterial;
  edges: THREE.LineSegments;
  edgeMat: THREE.LineBasicMaterial;
  wait: THREE.Mesh;
  waitMat: THREE.MeshBasicMaterial;
  label: CSS2DObject;
  labelKey: string;
  clearSince: number | null;
  wasClear: boolean;
}

interface Marker {
  kind: 'occupant' | 'team';
  id: string;
  group: THREE.Group;
  body: THREE.Mesh;
  ring: THREE.Mesh | null;
  proxy: THREE.Mesh;
  badge: CSS2DObject | null;
  badgeKey: string;
  styleKey: string;
  cur: BPos;
  target: BPos;
  queue: BPos[];
  fadeIn: number;
  freshness: Freshness | null;
  trail: { p: BPos; at: number }[];
  trailLine: THREE.Line;
  visible: boolean;
}

const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const SPHERE = new THREE.SphereGeometry(0.2, 16, 12);
const SMALL = new THREE.SphereGeometry(0.15, 12, 10);
const DIAMOND = new THREE.OctahedronGeometry(0.28);
const HOLLOW = new THREE.SphereGeometry(0.24, 10, 8);
const RING = new THREE.TorusGeometry(0.42, 0.045, 8, 32);
const HEX = new THREE.CylinderGeometry(0.34, 0.34, 0.55, 6);
const PROXY = new THREE.SphereGeometry(0.5, 8, 6);
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_EDGES = new THREE.EdgesGeometry(UNIT_BOX);
const PROXY_MAT = new THREE.MeshBasicMaterial({ visible: false });

const WHEEL_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="4" r="1.8"/><path d="M11 7v6h5l2.5 5"/><path d="M8 10.5a5.5 5.5 0 1 0 7 7.4"/></svg>';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

function basic(color: string, opacity = 1, extra: THREE.MeshBasicMaterialParameters = {}) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, ...extra });
}

function line(color: string, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function label(html: string, className: string): CSS2DObject {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return new CSS2DObject(el);
}

export class BuildingScene {
  private container: HTMLElement;
  private cb: Callbacks;
  private renderer: THREE.WebGLRenderer;
  private labels: CSS2DRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private building = new THREE.Group();
  private hazards = new THREE.Group();
  private markersGroup = new THREE.Group();
  private links = new THREE.Group();
  private shafts: { mesh: THREE.Object3D; layer: 'stairwells' | 'lifts' | null }[] = [];
  private floorObjs: FloorObj[] = [];
  private markers = new Map<string, Marker>();
  private view: SceneView | null = null;
  private floorsBuilt = 0;
  private hazardKey = '';
  private explode = 0;
  private explodeFloor = 1;
  private raf = 0;
  private lastFrame = performance.now();
  private elapsed = 0;
  private tween: { from: [THREE.Vector3, THREE.Vector3]; to: [THREE.Vector3, THREE.Vector3]; t: number } | null = null;
  private ro: ResizeObserver;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downAt: { x: number; y: number } | null = null;
  private lastHover = '';
  private hoverPending: PointerEvent | null = null;

  constructor(container: HTMLElement, cb: Callbacks) {
    this.container = container;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(VIZ.bg, 1);
    this.renderer.domElement.className = 'b3d-gl';
    container.appendChild(this.renderer.domElement);

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'b3d-labels';
    container.appendChild(this.labels.domElement);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 800);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 170;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.addEventListener('change', () => this.clampTarget());

    this.scene.add(new THREE.AmbientLight('#ffffff', 0.8));
    const sun = new THREE.DirectionalLight('#cfe0ff', 0.9);
    sun.position.set(30, 60, 40);
    this.scene.add(sun);
    this.scene.fog = new THREE.Fog(VIZ.bg, 140, 320);
    this.scene.add(this.building, this.hazards, this.markersGroup, this.links);
    this.buildGround();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerleave', this.onLeave);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    this.loop();
  }

  // ---------- public API ----------

  update(view: SceneView) {
    const first = !this.view;
    if (view.floors !== this.floorsBuilt) this.buildTower(view.floors);
    this.view = view;
    if (view.floor !== null) this.explodeFloor = view.floor;
    this.syncHazards(view);
    this.syncFloors(view);
    this.syncMarkers(view);
    if (first) this.resetCamera(true);
  }

  resetCamera(instant = false) {
    const h = this.towerHeight();
    // Far enough back to see the whole tower plus the assembly point in front of it.
    this.moveCamera(new THREE.Vector3(0, h * 0.4, 4), new THREE.Vector3(h * 1.3, h * 0.75, h * 1.75), instant);
  }

  focusFloor(f: number) {
    const y = this.floorY(f, true);
    const target = new THREE.Vector3(0, y, 0);
    const dir = this.camera.position.clone().sub(this.controls.target).setY(0).normalize();
    if (dir.lengthSq() < 0.01) dir.set(0.6, 0, 0.8);
    this.moveCamera(target, target.clone().add(dir.multiplyScalar(22)).add(new THREE.Vector3(0, 13, 0)));
  }

  focusEntity(id: string) {
    const m = this.markers.get(id);
    if (!m) return;
    const p = this.world(m.cur);
    const dir = this.camera.position.clone().sub(this.controls.target).setY(0).normalize();
    if (dir.lengthSq() < 0.01) dir.set(0.6, 0, 0.8);
    this.moveCamera(p, p.clone().add(dir.multiplyScalar(13)).add(new THREE.Vector3(0, 8, 0)));
  }

  /** Jump markers straight to their targets (after a simulation reset). */
  snap() {
    for (const m of this.markers.values()) {
      m.cur = { ...m.target };
      m.queue = [];
      m.trail = [];
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('pointerleave', this.onLeave);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry && !this.isShared(mesh.geometry)) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat && mat !== PROXY_MAT) mat.dispose();
    });
    this.renderer.dispose();
    el.remove();
    this.labels.domElement.remove();
  }

  // ---------- geometry helpers ----------

  private isShared(g: THREE.BufferGeometry) {
    return [SPHERE, SMALL, DIAMOND, HOLLOW, RING, HEX, PROXY, UNIT_BOX, UNIT_EDGES].includes(g as THREE.SphereGeometry);
  }

  private towerHeight() {
    return Math.max(1, this.floorsBuilt) * FLOOR_H;
  }

  private offset(n: number) {
    if (this.explode < 0.001) return 0;
    const s = this.explodeFloor;
    return this.explode * ((n >= s ? EXPLODE_GAP : 0) + (n > s ? EXPLODE_GAP : 0));
  }

  /** World y of a (possibly fractional) floor's slab. `targetState` uses the exploded state being animated to. */
  private floorY(f: number, targetState = false): number {
    const lo = Math.floor(f);
    const hi = Math.ceil(f);
    const u = f - lo;
    const off = (n: number) => {
      if (!targetState) return this.offset(n);
      const e = this.view?.exploded && this.view.floor !== null ? 1 : 0;
      const s = this.view?.floor ?? 1;
      return e * ((n >= s ? EXPLODE_GAP : 0) + (n > s ? EXPLODE_GAP : 0));
    };
    const y = (n: number) => (n - 1) * FLOOR_H + off(n);
    return y(lo) + (y(hi) - y(lo)) * u;
  }

  private world(p: BPos): THREE.Vector3 {
    const outside = Math.abs(p.x) > PLATE_W / 2 + 0.2 || Math.abs(p.z) > PLATE_D / 2 + 0.2;
    const y = outside && p.f <= 1.01 ? 0 : this.floorY(p.f);
    return new THREE.Vector3(p.x, y + 0.34, p.z);
  }

  // ---------- static scene ----------

  private buildGround() {
    const grid = new THREE.GridHelper(140, 70, '#1d2b45', '#14203a');
    grid.position.y = -0.03;
    this.scene.add(grid);

    const road = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([ROAD_START, ROAD_MID, ACCESS_POINT].map((p) => new THREE.Vector3(p.x, 0.01, p.z))),
      line('#3a5170', 0.9),
    );
    this.scene.add(road);

    const asmDisc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), basic(VIZ.safe, 0.1));
    asmDisc.rotation.x = -Math.PI / 2;
    asmDisc.position.set(ASSEMBLY.x, 0.02, ASSEMBLY.z);
    const asmRing = new THREE.Mesh(new THREE.RingGeometry(4.1, 4.3, 48), basic(VIZ.safe, 0.7, { side: THREE.DoubleSide }));
    asmRing.rotation.x = -Math.PI / 2;
    asmRing.position.set(ASSEMBLY.x, 0.03, ASSEMBLY.z);
    const asmLabel = label('Assembly point A <span>outside the building</span>', 'b3d-tag b3d-tag-safe');
    asmLabel.position.set(ASSEMBLY.x, 0.2, ASSEMBLY.z + 4.8);
    this.scene.add(asmDisc, asmRing, asmLabel);

    const access = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 6), basic(VIZ.team, 0.8, { side: THREE.DoubleSide }));
    access.rotation.x = -Math.PI / 2;
    access.position.set(ACCESS_POINT.x, 0.03, ACCESS_POINT.z);
    const accessLabel = label('Bomba access point', 'b3d-tag b3d-tag-team');
    accessLabel.position.set(ACCESS_POINT.x + 3.2, 0.2, ACCESS_POINT.z + 0.8);
    this.scene.add(access, accessLabel);
  }

  private clearGroup(g: THREE.Group) {
    for (const child of [...g.children]) {
      child.traverse((o) => {
        if (o instanceof CSS2DObject) o.element.remove();
        const mesh = o as THREE.Mesh;
        if (mesh.geometry && !this.isShared(mesh.geometry)) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | undefined;
        if (mat && !Array.isArray(mat) && mat !== PROXY_MAT) mat.dispose();
      });
      g.remove(child);
    }
  }

  private buildTower(floors: number) {
    this.clearGroup(this.building);
    this.floorObjs = [];
    this.shafts = [];
    this.floorsBuilt = floors;
    this.hazardKey = '';

    const add = (o: THREE.Object3D, layer: 'stairwells' | 'lifts' | null = null) => {
      this.building.add(o);
      this.shafts.push({ mesh: o, layer });
    };

    // Glass shell, unit-height so it can stretch with the exploded view.
    const shell = new THREE.Mesh(
      UNIT_BOX,
      new THREE.MeshStandardMaterial({ color: VIZ.glass, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, roughness: 0.2, metalness: 0.1 }),
    );
    shell.scale.set(PLATE_W + 0.3, 1, PLATE_D + 0.3);
    add(shell);
    const shellEdges = new THREE.LineSegments(UNIT_EDGES, line('#5d8fd6', 0.75));
    shellEdges.scale.copy(shell.scale);
    add(shellEdges);

    // Mullions on the facade.
    const pts: number[] = [];
    for (let x = -PLATE_W / 2; x <= PLATE_W / 2 + 0.01; x += 2) {
      for (const z of [-PLATE_D / 2 - 0.15, PLATE_D / 2 + 0.15]) pts.push(x, -0.5, z, x, 0.5, z);
    }
    for (let z = -PLATE_D / 2 + 1.8; z < PLATE_D / 2; z += 1.8) {
      for (const x of [-PLATE_W / 2 - 0.15, PLATE_W / 2 + 0.15]) pts.push(x, -0.5, z, x, 0.5, z);
    }
    const mullGeo = new THREE.BufferGeometry();
    mullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    add(new THREE.LineSegments(mullGeo, line('#2f4f80', 0.45)));

    const core = new THREE.Mesh(UNIT_BOX, basic('#26385a', 0.25));
    core.scale.set(CORE.w, 1, CORE.d);
    core.position.set(CORE.x, 0, CORE.z);
    add(core);

    const shaft = (p: { x: number; z: number }, color: string, layer: 'stairwells' | 'lifts', text: string) => {
      const m = new THREE.Mesh(UNIT_BOX, basic(color, 0.16));
      m.scale.set(1.3, 1, 1.3);
      m.position.set(p.x, 0, p.z);
      add(m, layer);
      const e = new THREE.LineSegments(UNIT_EDGES, line(color, 0.7));
      e.scale.copy(m.scale);
      e.position.copy(m.position);
      add(e, layer);
      const l = label(esc(text), 'b3d-tag b3d-tag-infra');
      l.userData.top = true;
      l.position.set(p.x, 0, p.z);
      add(l, layer);
    };
    shaft(STAIR_A, VIZ.stair, 'stairwells', 'Stairwell A');
    shaft(STAIR_B, VIZ.stair, 'stairwells', 'Stairwell B');
    shaft(LIFT, VIZ.lift, 'lifts', 'Bomba lift');

    for (const [x, z] of [
      [-PLATE_W / 2, -PLATE_D / 2],
      [PLATE_W / 2, -PLATE_D / 2],
      [-PLATE_W / 2, PLATE_D / 2],
      [PLATE_W / 2, PLATE_D / 2],
      [0, -PLATE_D / 2],
      [0, PLATE_D / 2],
    ]) {
      const c = new THREE.Mesh(UNIT_BOX, basic('#3c5a88', 0.35));
      c.scale.set(0.22, 1, 0.22);
      c.position.set(x, 0, z);
      add(c);
    }

    const slabGeo = new THREE.BoxGeometry(PLATE_W, 0.06, PLATE_D);
    const slabEdgeGeo = new THREE.EdgesGeometry(slabGeo);
    const waitGeo = new THREE.CircleGeometry(0.6, 24);
    for (let n = 1; n <= floors; n += 1) {
      const slabMat = basic(VIZ.slab, 0.05);
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.userData = { kind: 'floor', floor: n };
      const edgeMat = line(VIZ.edge, 0.35);
      const edges = new THREE.LineSegments(slabEdgeGeo, edgeMat);
      const waitMat = basic(VIZ.waiting, 0.18, { side: THREE.DoubleSide });
      const wait = new THREE.Mesh(waitGeo, waitMat);
      wait.rotation.x = -Math.PI / 2;
      wait.userData = { kind: 'waiting', floor: n };
      const lbl = label('', 'b3d-flabel');
      lbl.element.addEventListener('click', () => this.cb.onSelect({ kind: 'floor', floor: n }));
      this.building.add(slab, edges, wait, lbl);
      this.floorObjs.push({ n, slab, slabMat, edges, edgeMat, wait, waitMat, label: lbl, labelKey: '', clearSince: null, wasClear: false });
    }
    this.layoutTower();
  }

  /** Positions every floor-dependent object for the current explode amount. */
  private layoutTower() {
    const top = this.floorY(this.floorsBuilt) + FLOOR_H;
    for (const s of this.shafts) {
      const o = s.mesh;
      if (o instanceof CSS2DObject) {
        o.position.y = -0.7;
        continue;
      }
      o.scale.y = top;
      o.position.y = top / 2 - 0.05;
    }
    for (const f of this.floorObjs) {
      const y = this.floorY(f.n);
      f.slab.position.y = y;
      f.edges.position.y = y;
      f.wait.position.set(WAIT_B.x, y + 0.05, WAIT_B.z);
      f.label.position.set(PLATE_W / 2 + 1.4, y + 0.35, PLATE_D / 2);
    }
    for (const h of this.hazards.children) {
      const n = h.userData.floor as number;
      h.position.y = this.floorY(n) + FLOOR_H / 2;
    }
  }

  // ---------- data sync ----------

  private syncHazards(v: SceneView) {
    const inc = v.snapshot.incident;
    const key = inc && v.layers.hazards ? `${inc.kind}:${inc.affectedFloors.join(',')}:${this.floorsBuilt}` : '';
    if (key === this.hazardKey) return;
    this.hazardKey = key;
    this.clearGroup(this.hazards);
    if (!inc || !v.layers.hazards) return;
    const color =
      inc.kind === 'fire' ? VIZ.hazardFire : inc.kind === 'earthquake' ? VIZ.hazardQuake : inc.kind === 'outage' ? VIZ.hazardOutage : VIZ.hazardSecurity;
    const text = { fire: 'Fire floor', earthquake: 'Structural warning', outage: 'Power out', security: 'Restricted zone' }[inc.kind];
    for (const n of inc.affectedFloors) {
      if (n > this.floorsBuilt) continue;
      const g = new THREE.Group();
      g.userData = { floor: n, pulse: inc.kind !== 'outage' };
      const vol = new THREE.Mesh(UNIT_BOX, basic(color, inc.kind === 'outage' ? 0.55 : 0.16));
      vol.scale.set(PLATE_W - 0.1, FLOOR_H - 0.12, PLATE_D - 0.1);
      const edges = new THREE.LineSegments(UNIT_EDGES, line(color, 0.95));
      edges.scale.set(PLATE_W + 0.5, FLOOR_H, PLATE_D + 0.5);
      const tag = label(`${esc(text)}, L${n}`, 'b3d-tag b3d-tag-hazard');
      tag.position.set(-PLATE_W / 2 - 2.4, 0, -PLATE_D / 2);
      g.add(vol, edges, tag);
      this.hazards.add(g);
    }
    this.layoutTower();
  }

  private syncFloors(v: SceneView) {
    const sel = v.selection?.kind === 'floor' || v.selection?.kind === 'waiting' ? v.selection.floor : v.floor;
    const inc = v.snapshot.incident;
    for (const f of this.floorObjs) {
      const s = v.summaries.get(f.n);
      const state = s?.state ?? 'empty';
      const color = v.layers.floorStatus ? FLOOR_COLOR[state] : VIZ.slab;
      const selected = sel === f.n;
      const notable = state !== 'empty' && state !== 'normal';
      const dimmed = v.isolate && sel !== null && !selected;
      const clear = state === 'clear';
      if (clear && !f.wasClear) f.clearSince = this.elapsed;
      f.wasClear = clear;

      f.slabMat.color.set(color);
      f.slabMat.userData.base = dimmed ? 0.015 : selected ? 0.32 : clear && v.layers.floorStatus ? 0.24 : notable && v.layers.floorStatus ? 0.15 : 0.045;
      f.edgeMat.color.set(selected ? '#ffffff' : color);
      f.edgeMat.opacity = dimmed ? 0.06 : selected ? 1 : notable ? 0.8 : 0.3;

      const waiting = s?.waiting ?? 0;
      f.wait.visible = v.layers.waiting && !dimmed && (waiting > 0 || selected || (!!inc && inc.affectedFloors.includes(f.n)));
      f.waitMat.opacity = waiting ? 0.75 : 0.25;

      const show =
        !dimmed &&
        (selected ||
          f.n === 1 ||
          f.n === this.floorsBuilt ||
          f.n % 10 === 0 ||
          !!s?.hazard ||
          !!s?.staging ||
          (notable && v.layers.floorStatus));
      const parts = [`<b>L${f.n}</b>`];
      if (s?.hazard) parts.push('<span class="hz">Fire</span>');
      if (s?.staging) parts.push('<span class="st">Staging</span>');
      if (v.layers.floorStatus && notable) {
        parts.push(
          selected
            ? `<span class="fs fs-${state}">${esc(FLOOR_LABEL[state])}</span>`
            : `<span class="dot fs-${state}" aria-hidden="true"></span>`,
        );
      }
      const key = `${show}|${selected}|${parts.join('')}`;
      if (key !== f.labelKey) {
        f.labelKey = key;
        f.label.element.innerHTML = parts.join('');
        f.label.element.classList.toggle('sel', selected);
        f.label.element.title = `Level ${f.n}: ${FLOOR_LABEL[state]}`;
      }
      f.label.visible = show;
    }
    for (const s of this.shafts) {
      s.mesh.visible = s.layer === null || v.layers[s.layer];
    }
  }

  private occupantVisible(o: OccupantView, v: SceneView): boolean {
    if (v.visibleIds && !v.visibleIds.has(o.id)) return false;
    if (!v.layers.occupants) return false;
    if (!v.layers.assistance && (o.status === 'waiting' || o.status === 'assist')) return false;
    if (!v.layers.unaccounted && o.status === 'unacc') return false;
    if (v.isolate && v.floor !== null && !o.outside && Math.round(o.pos.f) !== v.floor) return false;
    return true;
  }

  private syncMarkers(v: SceneView) {
    const seen = new Set<string>();
    const snap = v.snapshot;
    for (const o of snap.occupants) {
      if (o.towerId !== snap.towerId) continue;
      seen.add(o.id);
      this.syncMarker('occupant', o.id, o.pos, this.occupantVisible(o, v), o, null, v);
    }
    for (const t of snap.teams) {
      seen.add(t.id);
      const vis = v.layers.teams && (!v.visibleIds || v.visibleIds.has(t.id));
      this.syncMarker('team', t.id, t.pos, vis, null, t, v);
    }
    for (const [id, m] of this.markers) {
      if (seen.has(id)) continue;
      if (m.badge) m.badge.element.remove();
      this.markersGroup.remove(m.group, m.trailLine);
      m.trailLine.geometry.dispose();
      this.markers.delete(id);
    }
    this.syncLinks(v);
  }

  private syncMarker(kind: Marker['kind'], id: string, pos: BPos, visible: boolean, o: OccupantView | null, t: TeamView | null, v: SceneView) {
    let m = this.markers.get(id);
    if (!m) {
      const group = new THREE.Group();
      const proxy = new THREE.Mesh(PROXY, PROXY_MAT);
      proxy.userData = { kind, id };
      group.add(proxy);
      const trailLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
      trailLine.frustumCulled = false;
      m = {
        kind,
        id,
        group,
        body: new THREE.Mesh(SPHERE, basic(VIZ.active)),
        ring: null,
        proxy,
        badge: null,
        badgeKey: '',
        styleKey: '',
        cur: { ...pos },
        target: { ...pos },
        queue: [],
        fadeIn: 1,
        freshness: o?.freshness ?? null,
        trail: [],
        trailLine,
        visible,
      };
      group.add(m.body);
      this.markersGroup.add(group, trailLine);
      this.markers.set(id, m);
    }

    // Target and movement.
    const moved = Math.abs(pos.f - m.target.f) > 0.001 || Math.hypot(pos.x - m.target.x, pos.z - m.target.z) > 0.001;
    if (moved) {
      if (v.snapshot.mode === 'live') {
        const wasStale = m.freshness === 'stale' || m.freshness === 'unknown';
        if (wasStale && kind === 'occupant') {
          m.cur = { ...pos };
          m.queue = [];
          m.fadeIn = 0;
        } else {
          m.queue = route(m.cur, pos);
        }
      }
      m.target = { ...pos };
    }
    m.freshness = o?.freshness ?? null;

    // Style: shape, colour, ring and badge depend on status.
    const color = o ? occColor(o) : VIZ.team;
    const styleKey = o ? `${o.status}|${color}|${o.freshness}` : `team|${t?.category}`;
    if (styleKey !== m.styleKey) {
      m.styleKey = styleKey;
      m.group.remove(m.body);
      (m.body.material as THREE.Material).dispose();
      if (m.ring) {
        m.group.remove(m.ring);
        (m.ring.material as THREE.Material).dispose();
        m.ring = null;
      }
      const stale = o && (o.freshness === 'stale' || o.freshness === 'unknown');
      let geo: THREE.BufferGeometry = SPHERE;
      let mat = basic(color, stale ? 0.75 : 1);
      if (t) geo = HEX;
      else if (o?.status === 'assist') geo = DIAMOND;
      else if (o?.status === 'safe') geo = SMALL;
      else if (o?.status === 'unacc') {
        geo = HOLLOW;
        mat = basic(color, 0.95, { wireframe: true });
      }
      m.body = new THREE.Mesh(geo, mat);
      m.body.renderOrder = 3;
      m.group.add(m.body);
      if (o?.status === 'waiting' || o?.status === 'unacc') {
        m.ring = new THREE.Mesh(RING, basic(color, o.status === 'unacc' ? 0.55 : 0.9));
        m.ring.rotation.x = -Math.PI / 2;
        m.ring.userData.pulse = o.status === 'waiting';
        m.ring.renderOrder = 3;
        m.group.add(m.ring);
      }
      m.trailLine.userData.color = new THREE.Color(color);
    }

    // Badge (HTML): only for the people and teams that need to stand out.
    let html = '';
    let cls = '';
    if (o?.status === 'waiting' && o.help) {
      const mins = Math.max(0, Math.floor((v.snapshot.nowSec - o.help.atSec) / 60));
      cls = o.help.ackBy ? 'b3d-badge b3d-badge-wait' : 'b3d-badge b3d-badge-urgent';
      html = `${WHEEL_SVG}<span>${o.help.ackBy ? 'Waiting' : 'Not acknowledged'}, ${mins} min</span>`;
    } else if (o?.status === 'assist') {
      cls = 'b3d-badge b3d-badge-assist';
      html = WHEEL_SVG;
    } else if (o && o.freshness === 'unknown' && o.status !== 'safe') {
      cls = 'b3d-badge b3d-badge-unknown';
      html = '<span>? Location unknown</span>';
    } else if (t) {
      cls = `b3d-badge b3d-badge-team cat-${t.category}`;
      html = `<i>${esc(t.category === 'emrs' ? '+' : t.category === 'ert' ? 'ERT' : t.category === 'specialist' ? 'SR' : t.category === 'police' ? 'P' : 'B')}</i><span>${esc(t.short)}</span>`;
    }
    const sel = v.selection && (v.selection.kind === 'occupant' || v.selection.kind === 'team') && v.selection.id === id;
    const badgeKey = `${cls}|${html}|${sel}`;
    if (badgeKey !== m.badgeKey) {
      m.badgeKey = badgeKey;
      if (!html && m.badge) {
        m.badge.element.remove();
        m.group.remove(m.badge);
        m.badge = null;
      } else if (html) {
        if (!m.badge) {
          m.badge = label('', '');
          m.badge.position.set(0, 0.62, 0);
          const ident = { kind, id };
          m.badge.element.addEventListener('click', () =>
            this.cb.onSelect(ident.kind === 'team' ? { kind: 'team', id: ident.id } : { kind: 'occupant', id: ident.id }),
          );
          m.group.add(m.badge);
        }
        m.badge.element.className = `${cls}${sel ? ' sel' : ''}`;
        m.badge.element.innerHTML = html;
      }
    }
    m.body.scale.setScalar(sel ? 1.6 : 1);
    m.visible = visible;
    m.group.visible = visible;
    if (m.badge) m.badge.visible = visible;
  }

  private syncLinks(v: SceneView) {
    this.clearGroup(this.links);
    if (!v.layers.teams) return;
    for (const t of v.snapshot.teams) {
      if (!t.targetId || !['on-floor', 'person-reached'].includes(t.status)) continue;
      const tm = this.markers.get(t.id);
      const om = this.markers.get(t.targetId);
      if (!tm || !om || !tm.visible || !om.visible) continue;
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), line(VIZ.team, 0.9));
      l.userData = { a: t.id, b: t.targetId };
      l.frustumCulled = false;
      this.links.add(l);
    }
  }

  // ---------- camera ----------

  private moveCamera(target: THREE.Vector3, pos: THREE.Vector3, instant = false) {
    if (instant || reduceMotion) {
      this.controls.target.copy(target);
      this.camera.position.copy(pos);
      this.tween = null;
      this.controls.update();
      return;
    }
    this.tween = { from: [this.controls.target.clone(), this.camera.position.clone()], to: [target, pos], t: 0 };
  }

  private clampTarget() {
    const t = this.controls.target;
    const h = this.towerHeight() + EXPLODE_GAP * 2;
    t.x = THREE.MathUtils.clamp(t.x, -30, 30);
    t.z = THREE.MathUtils.clamp(t.z, -30, 30);
    t.y = THREE.MathUtils.clamp(t.y, 0, h + 4);
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------- picking ----------

  private pick(e: PointerEvent): { kind: string; id?: string; floor?: number } | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const proxies: THREE.Object3D[] = [];
    for (const m of this.markers.values()) if (m.visible) proxies.push(m.proxy);
    const hitM = this.raycaster.intersectObjects(proxies, false)[0];
    if (hitM) return hitM.object.userData as { kind: string; id: string };
    const others: THREE.Object3D[] = [];
    for (const f of this.floorObjs) {
      if (f.wait.visible) others.push(f.wait);
      if (f.slabMat.userData.base > 0.02) others.push(f.slab);
    }
    const hit = this.raycaster.intersectObjects(others, false)[0];
    return hit ? (hit.object.userData as { kind: string; floor: number }) : null;
  }

  private onDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
  };

  private onUp = (e: PointerEvent) => {
    if (!this.downAt || Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 6) return;
    this.downAt = null;
    const p = this.pick(e);
    if (!p) return this.cb.onSelect(null);
    if (p.kind === 'occupant' && p.id) this.cb.onSelect({ kind: 'occupant', id: p.id });
    else if (p.kind === 'team' && p.id) this.cb.onSelect({ kind: 'team', id: p.id });
    else if (p.kind === 'waiting' && p.floor) this.cb.onSelect({ kind: 'waiting', floor: p.floor });
    else if (p.kind === 'floor' && p.floor) this.cb.onSelect({ kind: 'floor', floor: p.floor });
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    this.hoverPending = e;
  };

  private onLeave = () => {
    this.hoverPending = null;
    if (this.lastHover) {
      this.lastHover = '';
      this.cb.onHover(null);
    }
  };

  private processHover() {
    const e = this.hoverPending;
    if (!e) return;
    this.hoverPending = null;
    if (e.buttons) return;
    const p = this.pick(e);
    const r = this.renderer.domElement.getBoundingClientRect();
    const id = p ? (p.id ?? String(p.floor)) : '';
    const key = p ? `${p.kind}:${id}` : '';
    this.renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
    if (!p) {
      if (this.lastHover) this.cb.onHover(null);
      this.lastHover = '';
      return;
    }
    this.lastHover = key;
    this.cb.onHover({ kind: p.kind as HoverInfo['kind'], id, x: e.clientX - r.left, y: e.clientY - r.top });
  }

  // ---------- frame loop ----------

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const nowMs = performance.now();
    const dt = Math.min(0.1, (nowMs - this.lastFrame) / 1000);
    this.lastFrame = nowMs;
    this.elapsed += dt;
    const v = this.view;

    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + dt / 0.8);
      const k = 1 - Math.pow(1 - this.tween.t, 3);
      this.controls.target.lerpVectors(this.tween.from[0], this.tween.to[0], k);
      this.camera.position.lerpVectors(this.tween.from[1], this.tween.to[1], k);
      if (this.tween.t >= 1) this.tween = null;
    }

    const wantExplode = v?.exploded && v.floor !== null ? 1 : 0;
    if (Math.abs(this.explode - wantExplode) > 0.001) {
      this.explode = reduceMotion ? wantExplode : this.explode + (wantExplode - this.explode) * Math.min(1, dt * 6);
      this.layoutTower();
    }

    const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(this.elapsed * 4);
    for (const f of this.floorObjs) {
      let o = (f.slabMat.userData.base as number) ?? 0.05;
      if (f.clearSince !== null && this.elapsed - f.clearSince < 2.5 && !reduceMotion) {
        o += 0.4 * (1 - (this.elapsed - f.clearSince) / 2.5);
      }
      f.slabMat.opacity = o;
    }
    for (const h of this.hazards.children) {
      if (!h.userData.pulse) continue;
      const vol = h.children[0] as THREE.Mesh;
      (vol.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.12 * pulse;
    }

    for (const m of this.markers.values()) this.stepMarker(m, dt, pulse);

    for (const l of this.links.children as THREE.Line[]) {
      const a = this.markers.get(l.userData.a);
      const b = this.markers.get(l.userData.b);
      if (!a || !b) continue;
      const pa = a.group.position;
      const pb = b.group.position;
      const attr = l.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.setXYZ(0, pa.x, pa.y, pa.z);
      attr.setXYZ(1, pb.x, pb.y, pb.z);
      attr.needsUpdate = true;
    }

    this.processHover();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  };

  private stepMarker(m: Marker, dt: number, pulse: number) {
    // Walk a queued route at a steady pace (live mode), otherwise ease towards the target (simulation).
    if (m.queue.length) {
      const next = m.queue[0];
      const dx = next.x - m.cur.x;
      const dz = next.z - m.cur.z;
      const df = next.f - m.cur.f;
      const dist = Math.hypot(dx, dz) + Math.abs(df) * 2;
      const step = dt * (reduceMotion ? 1000 : 9);
      if (dist <= step) {
        m.cur = { ...next };
        m.queue.shift();
      } else {
        const u = step / dist;
        m.cur = { f: m.cur.f + df * u, x: m.cur.x + dx * u, z: m.cur.z + dz * u };
      }
    } else {
      const k = 1 - Math.exp(-dt * 10);
      m.cur = {
        f: m.cur.f + (m.target.f - m.cur.f) * k,
        x: m.cur.x + (m.target.x - m.cur.x) * k,
        z: m.cur.z + (m.target.z - m.cur.z) * k,
      };
    }
    const p = this.world(m.cur);
    const prev = m.group.position;
    const movedBy = p.distanceTo(prev);
    m.group.position.copy(p);

    if (m.fadeIn < 1) {
      m.fadeIn = Math.min(1, m.fadeIn + dt * 1.5);
      m.group.scale.setScalar(0.2 + 0.8 * m.fadeIn);
    }
    if (m.ring) {
      if (m.ring.userData.pulse) {
        m.ring.scale.setScalar(1 + 0.45 * pulse);
        (m.ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.6 * (1 - pulse);
      }
    }
    if (m.kind === 'team') m.body.rotation.y += dt * 0.6;

    // Trails: fading line of recent positions, recomputed in world space so the exploded view stays correct.
    const showTrail = !!this.view?.layers.trails && m.visible;
    if (showTrail && movedBy > 0.02 && movedBy < 5) {
      const last = m.trail[m.trail.length - 1];
      if (!last || this.elapsed - last.at > 0.12) m.trail.push({ p: { ...m.cur }, at: this.elapsed });
    }
    while (m.trail.length && this.elapsed - m.trail[0].at > 7) m.trail.shift();
    if (!showTrail || m.trail.length < 2) {
      m.trailLine.visible = false;
      return;
    }
    m.trailLine.visible = true;
    const c = (m.trailLine.userData.color as THREE.Color | undefined) ?? new THREE.Color(VIZ.active);
    const pos: number[] = [];
    const col: number[] = [];
    for (const pt of m.trail) {
      const w = this.world(pt.p);
      pos.push(w.x, w.y, w.z);
      col.push(c.r, c.g, c.b, Math.max(0, 1 - (this.elapsed - pt.at) / 7) * 0.8);
    }
    pos.push(p.x, p.y, p.z);
    col.push(c.r, c.g, c.b, 0.8);
    const g = m.trailLine.geometry;
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    g.computeBoundingSphere();
  }
}
