import { upgradeStack } from "./scaling.js";

export const IDLE_RATE_MAX = 20;
export const IDLE_CAP_MAX = 10;
export const IDLE_BASE_HOURS = 2;
export const IDLE_BASE_PER_HOUR = 10;

export function idleCoinsPerHour(rateLevel) {
    return IDLE_BASE_PER_HOUR + upgradeStack(8, rateLevel, 1.12);
}

export function idleCapHours(capLevel) {
    return IDLE_BASE_HOURS + Math.max(0, Math.floor(Number(capLevel) || 0));
}

export function idleCapMs(capLevel) {
    return idleCapHours(capLevel) * 60 * 60 * 1000;
}

export function idleRateCost(level) {
    return Math.round(36 * Math.pow(1.3, level));
}

export function idleCapCost(level) {
    return Math.round(180 * Math.pow(1.5, level));
}

export function computeIdleGain(idle, now = Date.now()) {
    const lastAt = Math.max(0, Number(idle?.lastAt) || 0);
    const rate = idleCoinsPerHour(idle?.rate || 0);
    const capMs = idleCapMs(idle?.cap || 0);
    if (!lastAt) {
        return { coins: 0, usedMs: 0, capMs, rate, pending: false };
    }
    const elapsed = Math.max(0, now - lastAt);
    const usedMs = Math.min(elapsed, capMs);
    const coins = Math.floor(rate * (usedMs / (60 * 60 * 1000)));
    return { coins, usedMs, capMs, rate, pending: coins > 0 };
}

export function formatIdleDuration(ms) {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hours <= 0) return `${mins} мин`;
    if (mins <= 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
}
