import { COLORS } from '../utils/constants';

/**
 * Visual Effects Module
 *
 * Handles all per-frame visual updates that are independent of game logic:
 * - UAP glow pulsing and ring rotation
 * - Boost color changes
 * - Building light flickering
 */

/**
 * Update all visual effects for the current frame
 *
 * @param {THREE.Group} uap - The UAP group object
 * @param {Array} buildings - Array of building meshes
 * @param {boolean} isBoosting - Whether the boost is active
 * @param {number} time - Elapsed time from the clock
 */
export function updateVisuals(uap, buildings, isBoosting, time) {
  if (!uap) return;

  // UAP pulsing (slow pulse + fast shimmer)
  const pulse = 1 + Math.sin(time * 4) * 0.1;
  const fastPulse = 1 + Math.sin(time * 12) * 0.05;

  if (uap.glow0) uap.glow0.scale.setScalar(pulse * 1.1);
  if (uap.glow1) uap.glow1.scale.setScalar(pulse * 1.05);
  if (uap.glow2) uap.glow2.scale.setScalar(fastPulse);
  if (uap.glow3) uap.glow3.scale.setScalar(pulse * 1.2);

  // Ring rotation
  uap.ring1.rotation.z = time * 3;
  uap.ring2.rotation.z = -time * 2;
  uap.ring2.rotation.x = Math.PI / 3 + Math.sin(time) * 0.2;

  // Light intensity variation
  uap.light.intensity = 3 + Math.sin(time * 5);

  // Color based on boost state
  if (isBoosting) {
    uap.core.material.color.setHex(COLORS.UAP_BOOST);
    uap.glow0.material.color.setHex(0xff8800);
    uap.light.color.setHex(0xff8800);
  } else {
    uap.core.material.color.setHex(COLORS.UAP_CORE);
    uap.glow0.material.color.setHex(COLORS.UAP_CORE);
    uap.light.color.setHex(COLORS.UAP_CORE);
  }

  // Building lights flicker animation
  buildings.forEach((building, i) => {
    const pointLight = building.children.find(c => c.isPointLight);
    if (pointLight) {
      pointLight.intensity = 0.3 + Math.sin(time * 2 + i) * 0.2;
    }
  });
}
