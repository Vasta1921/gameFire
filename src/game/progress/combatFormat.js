/** Частота огня: миллисекунды задержки → выстрелы в секунду. */
export const CHANCE_MAX = 0.5;

export function shotsPerSec(fireRateMs) {
    return 1000 / Math.max(1, fireRateMs);
}

export function formatShotsPerSec(fireRateMs) {
    return shotsPerSec(fireRateMs).toFixed(1);
}

export function formatSpreadDeg(spreadRad) {
    return `±${Math.round((spreadRad ?? 0) * 180 / Math.PI)}°`;
}

export function formatSpreadDeltaDeg(deg) {
    if (!deg) return "0°";
    const sign = deg > 0 ? "+" : "−";
    return `${sign}${Math.abs(deg)}°`;
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
        { label: "Разброс", value: formatSpreadDeg(stats.spread) },
        { label: "Здоровье", value: String(stats.maxHp ?? 15) },
        { label: "Двойной выстрел", value: formatChance(stats.doubleChance) },
        { label: "Мультистрел", value: formatChance(stats.multiChance) },
        { label: "Тройной залп", value: (stats.pelletCount || 1) >= 3 ? "да" : "нет" },
        { label: "Наведение", value: stats.homing ? "да" : "нет" },
    ];
}
