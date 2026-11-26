import { BALANCE } from '../config/balance.js';

/**
 * Stub AudioManager for M2 SFX hooks.
 * Full WebAudio / asset playback and mute toggle arrive in M6.
 */
export class AudioManager {
  constructor() {
    this.muted = true;
    this.lastCoinPickupTime = 0;
    this.coinComboStep = 0;
  }

  playCoinPickup(nowMs = performance.now()) {
    const g = BALANCE.GOLD;
    if (nowMs - this.lastCoinPickupTime <= g.COMBO_WINDOW_MS) {
      this.coinComboStep = Math.min(g.COMBO_MAX_STEPS, this.coinComboStep + 1);
    } else {
      this.coinComboStep = 0;
    }
    this.lastCoinPickupTime = nowMs;

    const pitch = 1 + this.coinComboStep * g.COMBO_PITCH_STEP;
    this._triggerHook('coin_pickup', { pitch });
  }

  playSwing() {
    this._triggerHook('weapon_swing');
  }

  playRangedShot() {
    this._triggerHook('weapon_ranged_shot');
  }

  playWeaponEquip() {
    this._triggerHook('weapon_equip');
  }

  playChestShake() {
    this._triggerHook('chest_shake');
  }

  playChestOpen() {
    this._triggerHook('chest_open');
  }

  playCantAfford() {
    this._triggerHook('chest_cant_afford');
  }

  playItemPickup() {
    this._triggerHook('item_pickup');
  }

  playDoubleJump() {
    this._triggerHook('double_jump');
  }

  playDoorOpen() {
    this._triggerHook('door_open');
  }

  playRoomTransition() {
    this._triggerHook('room_transition');
  }

  playEnemyHit() {
    this._triggerHook('enemy_hit');
  }

  playEnemyDeath() {
    this._triggerHook('enemy_death');
  }

  playPlayerHit() {
    this._triggerHook('player_hit');
  }

  playPlayerDeath() {
    this._triggerHook('player_death');
  }

  _triggerHook(_soundKey, _options = {}) {
    // Intentional no-op stub for M2
  }
}
