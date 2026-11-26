import { BALANCE } from '../config/balance.js';

/**
 * 10 hand-authored room layouts (1280x720).
 * Full-width ground (top = 656) is always added by RoomManager.
 * All platforms stay within x in [160, 1120], vertical steps <= 90px (<= 95px rule),
 * horizontal gaps <= 140px (<= 150px rule), and clear >= 70px above ground.
 */
export const ROOM_TEMPLATES = [
  {
    id: 'ascending_arch',
    name: 'Ascending Arch',
    platforms: [
      { x: 265, y: 576, width: 210, height: 20 },
      { x: 530, y: 490, width: 200, height: 20 },
      { x: 790, y: 404, width: 200, height: 20 },
      { x: 1030, y: 576, width: 180, height: 20 }
    ]
  },

  {
    id: 'twin_bridges',
    name: 'Twin Bridges',
    platforms: [
      { x: 270, y: 576, width: 220, height: 20 },
      { x: 640, y: 490, width: 300, height: 20 },
      { x: 1010, y: 576, width: 220, height: 20 }
    ]
  },

  {
    id: 'valley_arena',
    name: 'Valley Arena',
    platforms: [
      { x: 640, y: 576, width: 260, height: 20 },
      { x: 330, y: 490, width: 220, height: 20 },
      { x: 950, y: 490, width: 220, height: 20 }
    ]
  },

  {
    id: 'sky_citadel',
    name: 'Sky Citadel',
    platforms: [
      { x: 255, y: 576, width: 190, height: 20 },
      { x: 495, y: 490, width: 180, height: 20 },
      { x: 740, y: 404, width: 190, height: 20 },
      { x: 995, y: 320, width: 210, height: 20 }
    ]
  },

  {
    id: 'diamond_court',
    name: 'Diamond Court',
    platforms: [
      { x: 250, y: 576, width: 180, height: 20 },
      { x: 460, y: 490, width: 160, height: 20 },
      { x: 640, y: 404, width: 160, height: 20 },
      { x: 820, y: 490, width: 160, height: 20 },
      { x: 1030, y: 576, width: 180, height: 20 }
    ]
  },

  {
    id: 'long_catwalk',
    name: 'Long Catwalk',
    platforms: [
      { x: 260, y: 576, width: 200, height: 20 },
      { x: 640, y: 490, width: 420, height: 20 },
      { x: 1020, y: 576, width: 200, height: 20 }
    ]
  },

  {
    id: 'descending_steps',
    name: 'Descending Steps',
    platforms: [
      { x: 245, y: 576, width: 170, height: 20 },
      { x: 485, y: 404, width: 200, height: 20 },
      { x: 750, y: 490, width: 200, height: 20 },
      { x: 1015, y: 576, width: 210, height: 20 }
    ]
  },

  {
    id: 'triple_pillars',
    name: 'Triple Pillars',
    platforms: [
      { x: 250, y: 576, width: 180, height: 20 },
      { x: 440, y: 488, width: 160, height: 20 },
      { x: 640, y: 576, width: 200, height: 20 },
      { x: 840, y: 488, width: 160, height: 20 },
      { x: 1030, y: 576, width: 180, height: 20 }
    ]
  },

  {
    id: 'twin_towers',
    name: 'Twin Towers',
    platforms: [
      { x: 255, y: 490, width: 190, height: 20 },
      { x: 470, y: 576, width: 200, height: 20 },
      { x: 810, y: 576, width: 200, height: 20 },
      { x: 1025, y: 490, width: 190, height: 20 }
    ]
  },

  {
    id: 'colosseum',
    name: 'Colosseum',
    platforms: [
      { x: 340, y: 576, width: 280, height: 20 },
      { x: 640, y: 490, width: 220, height: 20 },
      { x: 940, y: 576, width: 280, height: 20 }
    ]
  }
];

export function validateRoomTemplates() {
  const rCfg = BALANCE.ROOMS;
  const v = rCfg.VALIDATION;
  const groundTop = rCfg.GROUND.y - rCfg.GROUND.height / 2;
  const doorKeepOutTopY = groundTop - v.DOOR_KEEP_OUT_HEIGHT_ABOVE_GROUND;

  let warningCount = 0;

  for (const tpl of ROOM_TEMPLATES) {
    const rects = tpl.platforms.map((p, index) => ({
      index,
      left: p.x - p.width / 2,
      right: p.x + p.width / 2,
      top: p.y - p.height / 2,
      bottom: p.y + p.height / 2
    }));

    for (const r of rects) {
      // 1. Door area keep-out check
      if (r.bottom > doorKeepOutTopY) {
        if (r.left < v.LEFT_DOOR_KEEP_OUT_X) {
          warningCount++;
          console.warn(
            `[RoomTemplates] "${tpl.id}" platform #${r.index} intrudes left door zone (left=${r.left} < ${v.LEFT_DOOR_KEEP_OUT_X})`
          );
        }
        if (r.right > v.RIGHT_DOOR_KEEP_OUT_X) {
          warningCount++;
          console.warn(
            `[RoomTemplates] "${tpl.id}" platform #${r.index} intrudes right door zone (right=${r.right} > ${v.RIGHT_DOOR_KEEP_OUT_X})`
          );
        }
      }

      // 2. Ground path left-to-right clearance check
      if (groundTop - r.bottom < v.MIN_GROUND_HEADROOM) {
        warningCount++;
        console.warn(
          `[RoomTemplates] "${tpl.id}" platform #${r.index} blocks ground path between doors (headroom=${groundTop - r.bottom}px)`
        );
      }
    }

    // 3. Single-jump reachability BFS from ground (vertical step <= 95px, horizontal gap <= 150px)
    const groundNode = {
      left: 0,
      right: BALANCE.GAME.WIDTH,
      top: groundTop,
      bottom: BALANCE.GAME.HEIGHT
    };

    const reached = new Array(rects.length).fill(false);
    const queue = [groundNode];

    while (queue.length > 0) {
      const curr = queue.shift();
      for (let i = 0; i < rects.length; i++) {
        if (reached[i]) {
          continue;
        }
        const target = rects[i];
        const verticalStepUp = curr.top - target.top;
        const horizontalGap = Math.max(
          0,
          target.left - curr.right,
          curr.left - target.right
        );

        const fromGround = curr === groundNode;
        const gapOk = fromGround || horizontalGap <= v.MAX_HORIZONTAL_GAP;

        if (verticalStepUp <= v.MAX_VERTICAL_STEP && gapOk) {
          reached[i] = true;
          queue.push(target);
        }
      }
    }

    for (let i = 0; i < rects.length; i++) {
      if (!reached[i]) {
        warningCount++;
        console.warn(
          `[RoomTemplates] "${tpl.id}" platform #${i} is unreachable within <=${v.MAX_VERTICAL_STEP}px vertical step and <=${v.MAX_HORIZONTAL_GAP}px horizontal gap`
        );
      }
    }
  }

  return warningCount;
}
