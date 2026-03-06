import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../utils/constants';

/**
 * Building Factory Module
 *
 * Generates the neon-lit cyberpunk cityscape buildings arranged
 * in a ring around the center of the play area. Each building has
 * glowing edges, windows, rooftop lights, and spotlights.
 */

/**
 * Create a single building with neon edges, windows, and lights
 */
function createBuilding(scene, x, z, w, h, d, color) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshBasicMaterial({
    color: 0x050510,
    transparent: true,
    opacity: 0.9
  });
  const building = new THREE.Mesh(geometry, material);
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

  // Windows along the front face
  const windowCount = Math.floor(h / 3);
  for (let j = 0; j < windowCount; j++) {
    if (Math.random() > 0.4) {
      const winGeometry = new THREE.PlaneGeometry(w * 0.6, 1);
      const winMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? color : 0x00ffff,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.4,
        side: THREE.DoubleSide
      });
      const win = new THREE.Mesh(winGeometry, winMaterial);
      win.position.set(0, -h / 2 + 2 + j * 3, d / 2 + 0.1);
      building.add(win);
    }
  }

  // Rooftop light sphere
  const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8
  });
  const roofLight = new THREE.Mesh(lightGeometry, lightMaterial);
  roofLight.position.y = h / 2 + 0.5;
  building.add(roofLight);

  // Point light for local illumination
  const pointLight = new THREE.PointLight(color, 0.5, 15);
  pointLight.position.y = h / 2;
  building.add(pointLight);

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
