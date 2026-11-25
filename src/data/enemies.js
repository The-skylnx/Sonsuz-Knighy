export const ENEMIES = {
  slime: {
    id: 'slime',
    name: 'Slime',
    behavior: 'patrol',
    hp: 20,
    contactDamage: 8,
    goldMin: 3,
    goldMax: 5,
    moveSpeed: 75,
    width: 36,
    height: 28,
    color: 0x52b788,
    borderColor: 0x95d5b2,
    borderWidth: 2,
    eyeColor: 0x161622,
    edgeProbeOffsetX: 4,
    edgeProbeOffsetY: 6
  },

  bat: {
    id: 'bat',
    name: 'Bat',
    behavior: 'sine_fly',
    hp: 12,
    contactDamage: 6,
    goldMin: 4,
    goldMax: 6,
    moveSpeed: 95,
    waveFrequency: 0.006,
    waveSpeed: 110,
    width: 36,
    height: 24,
    color: 0x9d4edd,
    borderColor: 0xc77dff,
    borderWidth: 2,
    eyeColor: 0xffd166
  }
};
