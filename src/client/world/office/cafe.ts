import * as THREE from 'three';
import { STREET_Y } from '../../../shared/layout';
import type { Collider, Interactable } from '../types';
import type { Pos } from '../../sound/places';
import type { Fixture, StreetSite } from './fixture';
import { canvasTexture } from '../texture';
import { mergeByMaterial, mesh, textPlane, toon, toonUnique } from '../toon';
import { seatable } from './seats';
import { Worker } from '../character';

// The Lobby Café downstairs on the ground floor (STREET_Y), by the elevator walkway:
// a wooden counter, espresso machine, coffee grinder, pastry display case, back-bar wall
// with shelves of coffee bags, bean jars, syrup bottles, mounted chalkboard menu, bistro tables,
// interactive café seating stools, and an animated Barista doll.

const G = STREET_Y; // -3.6m

export const CAFE_INTERACTABLE: Interactable = { kind: 'cafe', x: 12.3, y: G, z: -5.7, radius: 2.6 };
export const CAFE_COUNTER_POS: Pos = { x: 12.8, y: G + 1.1, z: -5.7 };

const WOOD = '#6b4428';
const WOOD_DARK = '#3c2415';
const WOOD_LIGHT = '#8a5a34';
const COUNTER_TOP = '#f4f1ea';
const DARK_STEEL = '#2b2d42';
const CHROME = '#ced4da';
const BRASS = '#e9b949';
const GLASS = new THREE.MeshBasicMaterial({ color: '#d6f1ff', transparent: true, opacity: 0.22, depthWrite: false });

/** Creates chalkboard texture with the café menu header and drinks list. */
function cafeMenuBoardTexture(): THREE.CanvasTexture {
  const S = 512;
  return canvasTexture(S, S, (g) => {
    g.fillStyle = '#26332d';
    g.fillRect(0, 0, S, S);
    const font = (px: number) => `800 ${px}px "Chalkboard SE", "Comic Sans MS", Nunito, ui-rounded, sans-serif`;
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.fillStyle = '#f1f1ea';
    g.font = font(38);
    g.fillText('☕ LOBBY CAFÉ', S / 2, 46);
    g.fillRect(30, 78, S - 60, 3);

    const items = [
      ['Espresso', 'Double shot · intense'],
      ['Americano', 'Clean & crisp'],
      ['Latte', 'Steamed milk over espresso'],
      ['Cappuccino', 'Rich velvety foam'],
      ['Mocha', 'Dark chocolate & espresso'],
      ['Cold Brew', '18h steep · maximum kick'],
      ['Decaf', 'All flavor · zero jitter'],
    ];

    let y = 118;
    for (const [name, desc] of items) {
      g.textAlign = 'left';
      g.fillStyle = '#ffcf8a';
      g.font = font(26);
      g.fillText(name, 40, y);
      g.textAlign = 'right';
      g.fillStyle = '#f1f1ea';
      g.font = font(20);
      g.fillText(desc, S - 40, y);
      y += 48;
    }

    g.fillStyle = '#8a5a34';
    g.fillRect(30, S - 44, S - 60, 2);
    g.textAlign = 'center';
    g.fillStyle = '#f1f1ea';
    g.font = font(22);
    g.fillText('Freshly roasted daily', S / 2, S - 22);
  });
}

/** Builds the Lobby Café 3D group, colliders, and interactables. */
export function buildCafe(): {
  group: THREE.Group;
  colliders: Collider[];
  interactables: Interactable[];
  counterCenter: THREE.Vector3;
  update(t: number, dt: number): void;
} {
  const group = new THREE.Group();
  const parts = new THREE.Group();
  const colliders: Collider[] = [];
  const interactables: Interactable[] = [CAFE_INTERACTABLE];

  const wood = toon(WOOD);
  const woodDark = toon(WOOD_DARK);
  const woodLight = toon(WOOD_LIGHT);
  const topMat = toon(COUNTER_TOP);
  const dark = toon(DARK_STEEL);
  const chrome = toon(CHROME);
  const brass = toon(BRASS);

  // ---- Main Front Counter ----------------------------------------------------------------------------
  // Counter position: x = 13.2, z = -5.7, facing west toward the elevator walkway
  const counterX = 13.2;
  const counterZ = -5.7;
  const counterW = 0.95;
  const counterL = 3.2;
  const counterH = 1.05;

  const counterBody = mesh(new THREE.BoxGeometry(counterW, counterH, counterL), wood, counterX, G + counterH / 2, counterZ);
  counterBody.userData.interact = CAFE_INTERACTABLE;
  parts.add(counterBody);

  for (let z = counterZ - counterL / 2 + 0.25; z < counterZ + counterL / 2; z += 0.45) {
    parts.add(mesh(new THREE.BoxGeometry(0.04, counterH - 0.15, 0.08), woodLight, counterX - counterW / 2 - 0.015, G + counterH / 2, z, false));
  }
  // Counter top (stone slab with overhang)
  const counterTopMesh = mesh(new THREE.BoxGeometry(counterW + 0.16, 0.06, counterL + 0.16), topMat, counterX, G + counterH + 0.03, counterZ);
  counterTopMesh.userData.interact = CAFE_INTERACTABLE;
  parts.add(counterTopMesh);

  // Invisible pick box over counter so crosshair easily detects cafe interaction
  const counterPick = new THREE.Mesh(new THREE.BoxGeometry(counterW + 0.2, counterH + 0.4, counterL + 0.2), new THREE.MeshBasicMaterial({ visible: false }));
  counterPick.position.set(counterX, G + counterH / 2 + 0.1, counterZ);
  counterPick.userData.interact = CAFE_INTERACTABLE;
  group.add(counterPick);

  // Brass foot rail on customer side
  const rail = mesh(new THREE.CylinderGeometry(0.025, 0.025, counterL - 0.2, 8), brass, counterX - counterW / 2 - 0.15, G + 0.18, counterZ, false);
  rail.rotation.x = Math.PI / 2;
  parts.add(rail);

  colliders.push({
    minX: counterX - counterW / 2 - 0.1,
    maxX: counterX + counterW / 2 + 0.1,
    minZ: counterZ - counterL / 2 - 0.1,
    maxZ: counterZ + counterL / 2 + 0.1,
    bottom: G,
    top: G + counterH + 0.1,
  });

  // ---- Commercial Espresso Machine ------------------------------------------------------------------
  const machX = counterX;
  const machZ = counterZ - 0.7;
  const machY = G + counterH + 0.06;
  const bodyW = 0.55;
  const bodyH = 0.42;
  const bodyL = 0.72;

  const machBody = mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), dark, machX, machY + bodyH / 2, machZ);
  machBody.userData.interact = CAFE_INTERACTABLE;
  parts.add(machBody);
  parts.add(mesh(new THREE.BoxGeometry(0.02, bodyH - 0.08, bodyL - 0.08), chrome, machX - bodyW / 2 - 0.01, machY + bodyH / 2, machZ, false));
  parts.add(mesh(new THREE.BoxGeometry(bodyW - 0.06, 0.03, bodyL - 0.06), chrome, machX, machY + bodyH + 0.015, machZ, false));
  for (const dz of [-0.18, 0.18]) {
    const head = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), chrome, machX - bodyW / 2 - 0.04, machY + bodyH * 0.45, machZ + dz, false);
    parts.add(head);
    const handle = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), dark, machX - bodyW / 2 - 0.14, machY + bodyH * 0.38, machZ + dz + 0.02, false);
    handle.rotation.z = Math.PI / 2;
    parts.add(handle);
  }
  const cupColors = ['#f8f9fa', '#e63946', '#457b9d'];
  for (let i = 0; i < 3; i++) {
    const cup = mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.065, 8), toon(cupColors[i]), machX + (i - 1) * 0.1, machY + bodyH + 0.06, machZ + (i % 2 === 0 ? 0.08 : -0.08), false);
    parts.add(cup);
  }

  // ---- Coffee Grinder -------------------------------------------------------------------------------
  const grindX = counterX + 0.05;
  const grindZ = counterZ - 1.25;
  parts.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.36, 12), dark, grindX, machY + 0.18, grindZ, false));
  const hopper = mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.22, 12), toonUnique('#c49a6c'), grindX, machY + 0.44, grindZ, false);
  parts.add(hopper);

  // ---- Pastry Display Case --------------------------------------------------------------------------
  const caseX = counterX;
  const caseZ = counterZ + 0.85;
  const caseW = 0.55;
  const caseH = 0.45;
  const caseL = 0.85;
  parts.add(mesh(new THREE.BoxGeometry(caseW, 0.05, caseL), wood, caseX, machY + 0.025, caseZ));
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(caseW - 0.04, caseH, caseL - 0.04), GLASS);
  caseGlass.position.set(caseX, machY + caseH / 2 + 0.05, caseZ);
  group.add(caseGlass);
  for (const dz of [-0.22, 0, 0.22]) {
    const pastry = mesh(new THREE.SphereGeometry(0.055, 8, 6), toon('#d4a373'), caseX, machY + 0.1, caseZ + dz, false);
    pastry.scale.set(1.4, 0.7, 0.9);
    parts.add(pastry);
  }

  // ---- Back Bar Wall & Credenza ---------------------------------------------------------------------
  // Solid wood wall behind barista, running from floor (G) to ceiling (-0.3)
  const ceilingY = -0.3;
  const wallH = ceilingY - G; // 3.3m
  const backWallX = 15.35;
  const backWallZ = counterZ;
  const backWallL = 4.2;
  const backWallW = 0.22;

  // Rich timber back wall panels
  parts.add(mesh(new THREE.BoxGeometry(backWallW, wallH, backWallL), woodDark, backWallX, G + wallH / 2, backWallZ));
  // Warm vertical decorative slats on back wall
  for (let z = backWallZ - backWallL / 2 + 0.2; z <= backWallZ + backWallL / 2; z += 0.35) {
    parts.add(mesh(new THREE.BoxGeometry(0.03, wallH, 0.06), woodLight, backWallX - backWallW / 2 - 0.012, G + wallH / 2, z, false));
  }
  // Back wall collider
  colliders.push({
    minX: backWallX - backWallW / 2 - 0.05,
    maxX: backWallX + backWallW / 2 + 0.05,
    minZ: backWallZ - backWallL / 2 - 0.1,
    maxZ: backWallZ + backWallL / 2 + 0.1,
    bottom: G,
    top: ceilingY,
  });

  // Back counter base / storage cabinets
  const backCounterX = 14.9;
  const backCounterH = 0.9;
  const backCounterW = 0.52;
  const backCounterL = 3.8;
  parts.add(mesh(new THREE.BoxGeometry(backCounterW, backCounterH, backCounterL), wood, backCounterX, G + backCounterH / 2, backWallZ));
  parts.add(mesh(new THREE.BoxGeometry(backCounterW + 0.06, 0.05, backCounterL + 0.06), topMat, backCounterX, G + backCounterH + 0.025, backWallZ));
  colliders.push({
    minX: backCounterX - backCounterW / 2 - 0.05,
    maxX: backCounterX + backCounterW / 2 + 0.05,
    minZ: backWallZ - backCounterL / 2 - 0.05,
    maxZ: backWallZ + backCounterL / 2 + 0.05,
    bottom: G,
    top: G + backCounterH + 0.1,
  });

  // ---- Mounted Chalkboard Menu Board (Flushed onto Back Wall) ----------------------------------------
  const boardX = backWallX - backWallW / 2 - 0.02;
  const boardZ = counterZ;
  const boardY = G + 1.82;
  const boardH = 1.1;
  const boardL = 1.25;
  const boardTex = cafeMenuBoardTexture();
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  boardMat.userData.outlineParameters = { visible: false };
  const boardPlane = mesh(new THREE.PlaneGeometry(boardL, boardH), boardMat, boardX - 0.015, boardY, boardZ, false);
  boardPlane.rotation.y = -Math.PI / 2;
  group.add(boardPlane);
  // Heavy wooden frame flush to wall
  parts.add(mesh(new THREE.BoxGeometry(0.04, boardH + 0.08, boardL + 0.08), woodLight, boardX, boardY, boardZ));

  // ---- Back Bar Shelves & Coffee Props --------------------------------------------------------------
  // Shelves flanking the chalkboard menu
  const shelfX = backWallX - backWallW / 2 - 0.14;
  const shelfDepth = 0.28;
  const shelfLen = 0.95;
  const shelfYLevels = [G + 1.25, G + 1.8];
  const shelfZOffsets = [counterZ - 1.35, counterZ + 1.35];

  for (const sz of shelfZOffsets) {
    for (const sy of shelfYLevels) {
      parts.add(mesh(new THREE.BoxGeometry(shelfDepth, 0.035, shelfLen), woodLight, shelfX, sy, sz, false));

      // Coffee bean bags on shelf (kraft brown, terracotta, burgundy)
      const bagColors = ['#d4a373', '#b08968', '#cb997e', '#936639'];
      for (let bi = -1; bi <= 1; bi++) {
        const bagX = shelfX;
        const bagZ = sz + bi * 0.26;
        parts.add(mesh(new THREE.BoxGeometry(0.14, 0.2, 0.18), toon(bagColors[(Math.abs(bi) + (sy > G + 1.5 ? 2 : 0)) % 4]), bagX, sy + 0.11, bagZ, false));
        parts.add(mesh(new THREE.PlaneGeometry(0.1, 0.08).rotateY(-Math.PI / 2), toon('#fdf0d5'), bagX - 0.075, sy + 0.11, bagZ, false));
      }
    }
  }

  // Top long shelf above the menu board
  const topShelfY = G + 2.45;
  parts.add(mesh(new THREE.BoxGeometry(shelfDepth, 0.035, backCounterL), woodLight, shelfX, topShelfY, backWallZ, false));

  // Glass jars with roasted beans and ceramic mugs on top shelf
  for (let zi = -1.5; zi <= 1.5; zi += 0.5) {
    const pz = backWallZ + zi;
    if (Math.abs(zi) < 0.6) {
      const mugCol = ['#ff6b1a', '#4cc9f0', '#ef476f', '#ffffff'][Math.round(Math.abs(zi) * 4) % 4];
      parts.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.08, 10), toon(mugCol), shelfX, topShelfY + 0.05, pz, false));
    } else {
      parts.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 12), toon('#3d2314'), shelfX, topShelfY + 0.09, pz, false));
      parts.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), woodLight, shelfX, topShelfY + 0.18, pz, false));
    }
  }

  // Overhead Café Plaque over counter
  const plaque = textPlane('☕ CAFÉ', { bg: '#2b2d42', color: '#ffcf8a', size: 64, border: '#ffcf8a' });
  plaque.scale.multiplyScalar(0.7);
  plaque.position.set(counterX - 0.1, G + 2.7, counterZ);
  plaque.rotation.y = -Math.PI / 2;
  group.add(plaque);

  // ---- Barista High Chair & Doll (Behind Counter) ---------------------------------------------------
  // Elevated swivel barista high chair centered behind counter serving station (counter top G + 1.08)
  const chairX = 14.05;
  const chairZ = counterZ;
  const seatH = 0.82;

  // Swivel barista high chair: dark round base, tall chrome pedestal, footrest ring with spokes, wooden seat, and backrest
  parts.add(mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.04, 16), dark, chairX, G + 0.02, chairZ, false));
  const pedH = seatH - 0.08;
  parts.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, pedH, 8), chrome, chairX, G + 0.04 + pedH / 2, chairZ, false));
  const footRingY = G + 0.32;
  const footRing = mesh(new THREE.TorusGeometry(0.18, 0.016, 6, 16), chrome, chairX, footRingY, chairZ, false);
  footRing.rotation.x = Math.PI / 2;
  parts.add(footRing);
  for (const rot of [0, Math.PI / 2]) {
    const spoke = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), chrome, chairX, footRingY, chairZ, false);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = rot;
    parts.add(spoke);
  }
  parts.add(mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.08, 16), woodLight, chairX, G + seatH, chairZ));
  // Backrest support post (chrome) and curved backrest pad (facing west toward front counter, so back is at +x)
  parts.add(mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), chrome, chairX + 0.22, G + seatH + 0.17, chairZ, false));
  parts.add(mesh(new THREE.BoxGeometry(0.04, 0.18, 0.38), woodLight, chairX + 0.24, G + seatH + 0.27, chairZ));

  colliders.push({
    minX: chairX - 0.26,
    maxX: chairX + 0.26,
    minZ: chairZ - 0.26,
    maxZ: chairZ + 0.26,
    bottom: G,
    top: G + seatH + 0.38,
  });

  // Service mat and ceramic coffee cup on counter directly in front of barista
  parts.add(mesh(new THREE.BoxGeometry(0.36, 0.015, 0.44), dark, counterX - 0.05, machY + 0.008, counterZ, false));
  parts.add(mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.075, 10), toon('#fffaf3'), counterX - 0.05, machY + 0.05, counterZ, false));
  parts.add(mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.005, 10), toon('#4a2810'), counterX - 0.05, machY + 0.082, counterZ, false));

  const barista = new Worker('Barista', '#e07a5f');
  barista.setStatus('idle', false);
  barista.setTask({ name: '☕ Barista', summary: "What'll it be? E at the counter" });
  barista.root.position.set(chairX, G + seatH - 0.08, chairZ);
  barista.root.rotation.y = -Math.PI / 2;
  barista.root.userData.interact = CAFE_INTERACTABLE;
  group.add(barista.root);

  // ---- Bistro Tables & Interactive Stools ------------------------------------------------------------
  const tableCenters = [
    { x: 13.8, z: -2.5 },
    { x: 13.8, z: 0.5 },
  ];

  let stoolNum = 1;
  for (const { x, z } of tableCenters) {
    parts.add(mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.04, 16), dark, x, G + 0.02, z, false));
    parts.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), dark, x, G + 0.38, z, false));
    parts.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), wood, x, G + 0.75, z));

    colliders.push({
      minX: x - 0.45,
      maxX: x + 0.45,
      minZ: z - 0.45,
      maxZ: z + 0.45,
      bottom: G,
      top: G + 0.8,
    });

    // 2 Seatable Stools per table
    for (const sx of [-0.75, 0.75]) {
      const stX = x + sx;
      const stoolId = `cafe-stool-${stoolNum++}`;

      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(stX, G, z);

      stoolGroup.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 14), dark, 0, 0.02, 0, false));
      stoolGroup.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.46, 8), chrome, 0, 0.24, 0, false));
      const seatTop = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), woodLight, 0, 0.48, 0);
      stoolGroup.add(seatTop);

      // Generous invisible pick cylinder so looking anywhere at/above the stool aims at it
      const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.set(0, 0.4, 0);
      stoolGroup.add(pick);

      seatable(stoolGroup, stoolId, 2.0, interactables);
      seatTop.userData.interact = stoolGroup.userData.interact;
      pick.userData.interact = stoolGroup.userData.interact;
      group.add(stoolGroup);

      colliders.push({
        minX: stX - 0.22,
        maxX: stX + 0.22,
        minZ: z - 0.22,
        maxZ: z + 0.22,
        bottom: G,
        top: G + 0.52,
      });
    }
  }

  // Pendant lights hanging from garage ceiling
  for (const z of [counterZ - 0.8, counterZ + 0.8, -2.5, 0.5]) {
    const lx = z < -3 ? counterX : 13.8;
    const cordH = ceilingY - (G + 2.3);
    parts.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, cordH, 4), dark, lx, G + 2.3 + cordH / 2, z, false));
    parts.add(mesh(new THREE.ConeGeometry(0.14, 0.12, 10), brass, lx, G + 2.26, z, false));
    parts.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), toon('#fff4d6', { emissive: '#ffd89a' }), lx, G + 2.18, z, false));
  }

  group.add(mergeByMaterial(parts));

  return {
    group,
    colliders,
    interactables,
    counterCenter: new THREE.Vector3(counterX - counterW / 2 - 0.6, G, counterZ),
    update(t: number, dt: number) {
      barista.update(dt, t);
    },
  };
}

/** The Lobby Café fixture downstairs on the ground floor. */
export const cafe: Fixture<never, StreetSite> = (site) => {
  const built = buildCafe();
  site.ground.add(built.group);
  site.groundColliders.push(...built.colliders);
  site.interactables.push(...built.interactables);
  return { update: (t, dt) => built.update(t, dt), interactables: built.interactables };
};
