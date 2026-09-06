/** Боевые числа ×10; апгрейды, волны и враги растут экспонентой. */
export const STAT_SCALE = 10;

export const UPGRADE_GROWTH = 1.12;
export const DAMAGE_STEP = 7;
export const DAMAGE_GROWTH = 1.06;
export const FIRE_RATE_STEP = 5;
export const FIRE_RATE_GROWTH = 1.08;
export const BASE_FIRE_MS = 280;
export const MIN_FIRE_MS = 120;
export const BASE_SPREAD_RAD = 0.16;
export const MIN_SPREAD_RAD = 0.04;
export const SPREAD_PER_LEVEL = 0.0035;
export const WAVE_HP_GROWTH = 1.09;
export const WAVE_DMG_GROWTH = 1.065;
export const WAVE_REWARD_GROWTH = 1.07;
export const WAVE_HEAL_GROWTH = 1.06;

export function wavePower(wave, growth) {
    return Math.pow(growth, Math.max(0, (Number(wave) || 1) - 1));
}

/** Сумма геометрической прогрессии: каждый уровень сильнее предыдущего. */
export function upgradeStack(step, level, growth = UPGRADE_GROWTH) {
    const n = Math.max(0, Math.floor(Number(level) || 0));
    if (n <= 0 || step === 0) return 0;
    return Math.round(step * (Math.pow(growth, n) - 1) / (growth - 1));
}

export function fireRateMsForLevel(level) {
    return Math.max(MIN_FIRE_MS, BASE_FIRE_MS - upgradeStack(FIRE_RATE_STEP, level, FIRE_RATE_GROWTH));
}

export function damageRangeForLevel(level) {
    const stack = upgradeStack(DAMAGE_STEP, level, DAMAGE_GROWTH);
    return {
        min: STAT_SCALE + stack,
        max: STAT_SCALE * 3 + stack,
    };
}

export function spreadRadForLevel(level) {
    const n = Math.max(0, Math.floor(Number(level) || 0));
    return Math.max(MIN_SPREAD_RAD, BASE_SPREAD_RAD - n * SPREAD_PER_LEVEL);
}

/** Доля стартового конуса: 100% — широкий, меньше — кучнее. */
export function spreadPercent(spreadRad) {
    return Math.max(1, Math.round((spreadRad / BASE_SPREAD_RAD) * 100));
}

export function spreadDeltaPercent(deg) {
    const baseDeg = BASE_SPREAD_RAD * 180 / Math.PI;
    return Math.round((deg / baseDeg) * 100);
}

export function regenPerSecForLevel(level) {
    const n = Math.max(0, Math.floor(Number(level) || 0));
    if (n <= 0) return 0;
    return Math.round(n * 0.25 * 10) / 10;
}

export function waveHealForLevel(level) {
    return upgradeStack(8, level);
}

export function critMultForLevel(level) {
    return Math.round((1.5 + Math.max(0, Math.floor(Number(level) || 0)) * 0.1) * 10) / 10;
}

export function scaleByWave(base, wave, growth) {
    return Math.max(1, Math.round(base * wavePower(wave, growth)));
}
