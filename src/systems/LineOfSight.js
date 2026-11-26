import { BALANCE } from '../config/balance.js';

/**
 * Liang-Barsky parametric segment-vs-AABB intersection test.
 * Rectangles are shrunk inward by shrinkPx so grazing corners never cause false blocks.
 */
export function segmentIntersectsRect(x1, y1, x2, y2, rect, shrinkPx = BALANCE.LOS.RECT_SHRINK_PX) {
  const left = rect.left + shrinkPx;
  const right = rect.right - shrinkPx;
  const top = rect.top + shrinkPx;
  const bottom = rect.bottom - shrinkPx;

  if (right <= left || bottom <= top) {
    return false;
  }

  // Fast AABB reject
  if (
    (x1 < left && x2 < left) ||
    (x1 > right && x2 > right) ||
    (y1 < top && y2 < top) ||
    (y1 > bottom && y2 > bottom)
  ) {
    return false;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;

  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) < 1e-8) {
    if (x1 < left || x1 > right) {
      return false;
    }
  } else {
    const invDx = 1 / dx;
    let t1 = (left - x1) * invDx;
    let t2 = (right - x1) * invDx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) {
      return false;
    }
  }

  if (Math.abs(dy) < 1e-8) {
    if (y1 < top || y1 > bottom) {
      return false;
    }
  } else {
    const invDy = 1 / dy;
    let t1 = (top - y1) * invDy;
    let t2 = (bottom - y1) * invDy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) {
      return false;
    }
  }

  return tMin <= tMax;
}

/**
 * Returns true if the segment (x1, y1) -> (x2, y2) is unobstructed by all room obstacles.
 */
export function hasLineOfSight(
  x1,
  y1,
  x2,
  y2,
  obstacles,
  shrinkPx = BALANCE.LOS.RECT_SHRINK_PX
) {
  if (!obstacles || obstacles.length === 0) {
    return true;
  }

  for (let i = 0; i < obstacles.length; i++) {
    if (segmentIntersectsRect(x1, y1, x2, y2, obstacles[i], shrinkPx)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks 3 rays from (originX, originY) to target's center, upper third, and lower third.
 * Target counts as visible if at least one of the 3 rays is clear.
 */
export function isTargetVisible(originX, originY, target, obstacles) {
  if (!target) {
    return false;
  }

  const targetH = target.body ? target.body.height : target.height || 32;
  const offset = targetH * BALANCE.LOS.RAY_OFFSET_RATIO;
  const tx = target.x;
  const ty = target.y;

  // 1. Center
  if (hasLineOfSight(originX, originY, tx, ty, obstacles)) {
    return true;
  }
  // 2. Upper third
  if (hasLineOfSight(originX, originY, tx, ty - offset, obstacles)) {
    return true;
  }
  // 3. Lower third
  if (hasLineOfSight(originX, originY, tx, ty + offset, obstacles)) {
    return true;
  }

  return false;
}

/**
 * Returns detailed ray results for debug visualization (?debug=1 L key).
 */
export function getVisibilityRays(originX, originY, target, obstacles) {
  const targetH = target.body ? target.body.height : target.height || 32;
  const offset = targetH * BALANCE.LOS.RAY_OFFSET_RATIO;
  const tx = target.x;
  const ty = target.y;

  const yPoints = [ty - offset, ty, ty + offset];
  const rays = [];
  for (let i = 0; i < yPoints.length; i++) {
    const ry = yPoints[i];
    rays.push({
      x1: originX,
      y1: originY,
      x2: tx,
      y2: ry,
      clear: hasLineOfSight(originX, originY, tx, ry, obstacles)
    });
  }
  return rays;
}
