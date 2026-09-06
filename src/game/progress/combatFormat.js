import { spreadPercent, spreadDeltaPercent } from "./scaling.js";

/** Частота огня: миллисекунды задержки → выстрелы в секунду. */
export const CHANCE_MAX = 0.5;

export function shotsPerSec(fireRateMs) {
    return 1000 / Math.max(1, fireRateMs);
}

export function formatShotsPerSec(fireRateMs) {
    return shotsPerSec(fireRateMs).toFixed(1);
}

export function formatSpreadPct(spreadRad) {
    return `${spreadPercent(spreadRad)}%`;
}

export function formatSpreadDeltaPct(deg) {
    const pct = spreadDeltaPercent(deg);
    if (!pct) return "0%";
    const sign = pct > 0 ? "+" : "−";
    return `${sign}${Math.abs(pct)}%`;
}

export function formatSpsDelta(fireRateMsAdd, baseMs = 280) {
    const before = shotsPerSec(baseMs);
    const after = shotsPerSec(Math.max(120, Math.min(520, baseMs + fireRateMsAdd)));
    const delta = after - before;
    const sign = delta > 0 ? "+" : "−";
    return `${sign}${Math.abs(delta).toFixed(1)} выстр/с`;
}

export function formatChance(value) {
    return `${Math.round((value || 0) * 100)}%`;
}

export function combatStatRows(stats) {
    return [
        { label: "Урон", value: `${stats.damageMin}–${stats.damageMax}` },
        { label: "Выстрелов/с", value: formatShotsPerSec(stats.fireRateMs) },
        { label: "Разброс", value: formatSpreadPct(stats.spread) },
        { label: "Здоровье", value: String(stats.maxHp ?? 15) },
        { label: "Ремонт", value: `${(stats.regenPerSec || 0).toFixed(1)} HP/с` },
        { label: "Двойной выстрел", value: formatChance(stats.doubleChance) },
        { label: "Мультистрел", value: formatChance(stats.multiChance) },
        { label: "Тройной залп", value: (stats.pelletCount || 1) >= 3 ? "да" : "нет" },
        { label: "Наведение", value: stats.homing ? "да" : "нет" },
    ];
}
