import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

/**
 * Autopilot Controller Module
 *
 * Implements the threat-avoidance algorithm that drives the UAP's
 * autonomous flight. Calculates a safe target position by:
 *
 * 1. Detecting nearby lasers and fleeing away from them (primary threat)
 * 2. Detecting nearby aliens and keeping distance (secondary threat)
 * 3. Staying within world boundaries
 * 4. Patrolling in a figure-8 pattern when no threats are nearby
 *
 * The target position is then fed into PID controllers (one per axis)
 * which produce smooth, damped movement toward safety.
 */

/**
 * Calculate a safe evasion target for the autopilot
 *
 * @param {THREE.Vector3} uapPosition - Current UAP position
 * @param {Array} lasers - Active laser projectiles
 * @param {Array} aliens - Alien entities
 * @param {number} survivalTime - Elapsed time (used for patrol pattern)
 * @returns {THREE.Vector3} - Target position to fly toward
 */
export function calculateEvadeTarget(uapPosition, lasers, aliens, survivalTime) {
  const dangerDirection = new THREE.Vector3();

  // Avoid lasers (primary threat)
  // Closer lasers produce stronger repulsion
  lasers.forEach(laser => {
    const toUAP = new THREE.Vector3().subVectors(uapPosition, laser.mesh.position);
    const distance = toUAP.length();
    if (distance < 20) {
      toUAP.normalize().multiplyScalar(20 / (distance + 1));
      dangerDirection.add(toUAP);
    }
  });

  // Avoid aliens (secondary threat)
  aliens.forEach(alien => {
    if (!alien.userData.alive) return;
    const toUAP = new THREE.Vector3().subVectors(uapPosition, alien.position);
    const distance = toUAP.length();
    if (distance < 15) {
      toUAP.normalize().multiplyScalar(10 / (distance + 1));
      dangerDirection.add(toUAP);
    }
  });

  // Calculate target by moving away from danger
  const target = uapPosition.clone().add(dangerDirection.multiplyScalar(2));

  // Keep in bounds and at a good altitude
  const bounds = GAME_CONFIG.WORLD_BOUNDS;
  target.y = Math.max(5, Math.min(25, target.y + (15 - uapPosition.y) * 0.1));
  target.x = Math.max(-bounds.x * 0.7, Math.min(bounds.x * 0.7, target.x));
  target.z = Math.max(-bounds.z * 0.7, Math.min(bounds.z * 0.7, target.z));

  // Patrol in a figure-8 pattern when safe
  if (dangerDirection.length() < 1) {
    target.x += Math.sin(survivalTime * 0.5) * 10;
    target.z += Math.cos(survivalTime * 0.7) * 10;
    target.y = 10 + Math.sin(survivalTime * 0.3) * 5;
  }

  return target;
}
