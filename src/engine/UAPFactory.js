import * as THREE from 'three';
import { COLORS } from '../utils/constants';

/**
 * UAP Factory Module
 *
 * Creates the player's UAP (Unidentified Aerial Phenomenon) craft.
 * The UAP is a multi-layered glowing sphere with spinning rings
 * and a point light for scene illumination.
 */

/**
 * Create and return the UAP group with all visual layers
 *
 * Structure:
 * - core: Bright inner sphere
 * - glow0-3: Increasingly large, transparent outer spheres
 * - ring1, ring2: Spinning torus rings
 * - light: Point light for illumination
 */
export function createUAP(scene) {
  const uap = new THREE.Group();

  // Core (brightest center)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 32, 32),
    new THREE.MeshBasicMaterial({
      color: COLORS.UAP_CORE,
      transparent: true,
      opacity: 1
    })
  );
  uap.add(core);
  uap.core = core;

  // Multiple glow layers for ultra-glow effect
  const glowLayers = [
    { size: 0.8, opacity: 0.6, color: COLORS.UAP_CORE },
    { size: 1.1, opacity: 0.4, color: COLORS.UAP_GLOW },
    { size: 1.5, opacity: 0.2, color: 0x0044ff },
    { size: 2.5, opacity: 0.08, color: 0x00d4ff }
  ];

  glowLayers.forEach((layer, index) => {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(layer.size, 32, 32),
      new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide
      })
    );
    uap.add(glow);
    uap[`glow${index}`] = glow;
  });

  // Spinning rings
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.05, 8, 32),
    new THREE.MeshBasicMaterial({
      color: COLORS.UAP_CORE,
      transparent: true,
      opacity: 0.8
    })
  );
  ring1.rotation.x = Math.PI / 2;
  uap.add(ring1);
  uap.ring1 = ring1;

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.03, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.5
    })
  );
  ring2.rotation.x = Math.PI / 3;
  uap.add(ring2);
  uap.ring2 = ring2;

  // Point light
  const light = new THREE.PointLight(COLORS.UAP_CORE, 4, 40);
  uap.add(light);
  uap.light = light;

  uap.position.set(0, 10, 0);
  scene.add(uap);

  return uap;
}
