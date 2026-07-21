import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../utils/constants';

/**
 * Building Factory Module
 *
 * Generates the neon-lit cyberpunk cityscape buildings arranged
 * in a ring around the center of the play area. Each building has
 * a lit-window facade texture, glowing neon edges, rooftop details
 * (beacons, antennas, vents) and shares the perimeter spotlights.
 */

const windowTextureCache = new Map();

/**
 * Build (and cache) a window-grid facade texture for a given neon color.
 * Dark facade with a grid of randomly lit windows — some in the neon
 * accent color, some cool white, most dark.
 */
function getWindowTexture(colorHex) {
  if (windowTextureCache.has(colorHex)) return windowTextureCache.get(colorHex);

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, 64, 128);

  const accent = '#' + colorHex.toString(16).padStart(6, '0');
  const cols = 4;
  const rows = 10;
  const cellW = 64 / cols;
  const cellH = 128 / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const roll = Math.random();
      if (roll < 0.45) continue; // dark window

      if (roll < 0.7) {
        ctx.fillStyle = 'rgba(110,135,190,0.55)'; // cool white interior
      } else if (roll < 0.9) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = accent; // neon accent
      } else {
        ctx.fillStyle = 'rgba(200,150,90,0.55)'; // warm interior
      }
      ctx.fillRect(
        col * cellW + 2.5,
        row * cellH + 3,
        cellW - 5,
        cellH - 6
      );
      ctx.globalAlpha = 1;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  windowTextureCache.set(colorHex, texture);
  return texture;
}

/**
 * Create a single building with a window facade, neon edges,
 * and rooftop details
 */
function createBuilding(scene, x, z, w, h, d, color) {
  const geometry = new THREE.BoxGeometry(w, h, d);

  // Window texture repeated to keep window density consistent per size
  const facade = getWindowTexture(color).clone();
  facade.needsUpdate = true;
  facade.repeat.set(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 10)));
  facade.offset.set(Math.random(), Math.random());

  const sideMaterial = new THREE.MeshBasicMaterial({ map: facade });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a18,
    metalness: 0.6,
    roughness: 0.5
  });
  // Box face order: +x, -x, +y, -y, +z, -z
  const building = new THREE.Mesh(geometry, [
    sideMaterial, sideMaterial, roofMaterial, roofMaterial, sideMaterial, sideMaterial
  ]);
  building.position.set(x, h / 2, z);
  scene.add(building);

  // Neon edges
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8
  });
  building.add(new THREE.LineSegments(edges, lineMaterial));

  // Glow effect (slightly larger duplicate edges)
  const glowMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.LineSegments(edges, glowMaterial);
  glow.scale.setScalar(1.02);
  building.add(glow);

  // Rooftop beacon (blink animated in VisualEffects)
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff2244,
      transparent: true,
      opacity: 0.9
    })
  );
  beacon.position.y = h / 2 + 0.4;
  building.add(beacon);
  building.userData.beacon = beacon;
  building.userData.beaconPhase = Math.random() * Math.PI * 2;

  // Antenna mast on tall buildings
  if (h > 22) {
    const mastHeight = 3 + Math.random() * 5;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.12, mastHeight, 6),
      new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.9, roughness: 0.4 })
    );
    mast.position.y = h / 2 + mastHeight / 2;
    building.add(mast);
    beacon.position.y = h / 2 + mastHeight + 0.3;
  }

  // Rooftop clutter: a couple of dark vent boxes
  const clutterMaterial = new THREE.MeshStandardMaterial({
    color: 0x101020,
    metalness: 0.5,
    roughness: 0.7
  });
  const clutterCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < clutterCount; i++) {
    const size = 0.6 + Math.random() * 1.2;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(size, size * 0.6, size),
      clutterMaterial
    );
    box.position.set(
      (Math.random() - 0.5) * w * 0.5,
      h / 2 + size * 0.3,
      (Math.random() - 0.5) * d * 0.5
    );
    building.add(box);
  }

  return building;
}

/**
 * Generate all buildings in a ring around the play area
 * Returns an array of building meshes for later animation
 */
export function createBuildings(scene) {
  const buildings = [];

  for (let i = 0; i < GAME_CONFIG.BUILDING_COUNT; i++) {
    const w = 3 + Math.random() * 8;
    const h = 5 + Math.random() * 35;
    const d = 3 + Math.random() * 8;

    const angle = Math.random() * Math.PI * 2;
    const radius = GAME_CONFIG.BUILDING_MIN_RADIUS +
      Math.random() * (GAME_CONFIG.BUILDING_MAX_RADIUS - GAME_CONFIG.BUILDING_MIN_RADIUS);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const color = COLORS.NEON[Math.floor(Math.random() * COLORS.NEON.length)];
    const building = createBuilding(scene, x, z, w, h, d, color);
    buildings.push(building);
  }

  // Perimeter spotlights aimed at the center
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spot = new THREE.SpotLight(
      COLORS.NEON[i % COLORS.NEON.length],
      2,
      100,
      Math.PI / 6,
      0.5
    );
    spot.position.set(Math.cos(angle) * 50, 0, Math.sin(angle) * 50);
    spot.target.position.set(0, 30, 0);
    scene.add(spot);
    scene.add(spot.target);
  }

  return buildings;
}
