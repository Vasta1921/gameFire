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

const FILL_NEUTRAL = "#ffe8d6";
const FILL_UP = "#4ade80";
const FILL_DOWN = "#f87171";

export function combatStatRows(stats, compareFrom) {
    const rows = [
        { key: "damage", label: "Урон", value: `${stats.damageMin}–${stats.damageMax}` },
        { key: "fire", label: "Выстрелов/с", value: formatShotsPerSec(stats.fireRateMs) },
        { key: "spread", label: "Разброс", value: formatSpreadPct(stats.spread) },
        { key: "hp", label: "Здоровье", value: String(stats.maxHp ?? 15) },
        { key: "regen", label: "Ремонт", value: `${(stats.regenPerSec || 0).toFixed(1)} HP/с` },
        { key: "double", label: "Двойной выстрел", value: formatChance(stats.doubleChance) },
        { key: "multi", label: "Мультистрел", value: formatChance(stats.multiChance) },
        { key: "triple", label: "Тройной залп", value: (stats.pelletCount || 1) >= 3 ? "да" : "нет" },
        { key: "twin", label: "Всегда двойной", value: stats.noCrit || (stats.pelletCount || 1) === 2 ? "да" : "нет" },
        { key: "homing", label: "Наведение", value: stats.homing ? "да" : "нет" },
        { key: "explode", label: "Взрывной выстрел", value: formatChance(stats.explodeChance) },
        { key: "pierce", label: "Пробитие", value: formatChance(stats.pierceChance) },
        { key: "crit", label: "Крит", value: stats.noCrit ? "выкл" : `${formatChance(stats.critChance)} ×${(stats.critMult || 1.5).toFixed(1)}` },
        { key: "straight", label: "Прямой выстрел", value: formatChance(stats.straightChance) },
        { key: "waveHeal", label: "После волны", value: `+${stats.waveHeal || 0} HP` },
    ];
    if (!compareFrom) return rows;
    return rows.map((row) => ({
        ...row,
        fill: statDiffFill(row.key, compareFrom, stats),
    }));
}

function statMetric(key, stats) {
    switch (key) {
        case "damage": return (stats.damageMin || 0) * 1000 + (stats.damageMax || 0);
        case "fire": return shotsPerSec(stats.fireRateMs);
        case "spread": return -(stats.spread || 0);
        case "hp": return stats.maxHp || 0;
        case "regen": return stats.regenPerSec || 0;
        case "double": return stats.doubleChance || 0;
        case "multi": return stats.multiChance || 0;
        case "triple": return (stats.pelletCount || 1) >= 3 ? 1 : 0;
        case "twin": return stats.noCrit || (stats.pelletCount || 1) === 2 ? 1 : 0;
        case "homing": return stats.homing ? 1 : 0;
        case "explode": return stats.explodeChance || 0;
        case "pierce": return (stats.pierceChance || 0) + (stats.pierce || 0);
        case "crit": return stats.noCrit ? -1 : (stats.critChance || 0) * 10 + (stats.critMult || 0);
        case "straight": return stats.straightChance || 0;
        case "waveHeal": return stats.waveHeal || 0;
        default: return 0;
    }
}

function statDiffFill(key, from, to) {
    const a = statMetric(key, from);
    const b = statMetric(key, to);
    if (Math.abs(a - b) < 1e-9) return FILL_NEUTRAL;
    return b > a ? FILL_UP : FILL_DOWN;
}
