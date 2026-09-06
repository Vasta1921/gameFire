import { CHANCE_MAX } from "./combatFormat.js";
import { STAT_SCALE, upgradeStack, fireRateMsForLevel, damageRangeForLevel, regenPerSecForLevel, spreadRadForLevel, waveHealForLevel, critMultForLevel } from "./scaling.js";
import {
    IDLE_RATE_MAX,
    IDLE_CAP_MAX,
    computeIdleGain,
    idleRateCost,
    idleCapCost,
} from "./Idle.js";
import {
    applyModifiersToStats,
    emptyLoadout,
    sanitizeLoadout,
    getModifier,
    firstFreeSlot,
    slotRarity,
    rollModifierStats,
    extraCapFor,
    extraKeysOf,
    extraTraitCost,
    tuneCost,
    sellRefund,
    applyTuneToRoll,
    applyExtraTrait,
    pickableExtras,
    TUNE_MAX,
} from "./Modifiers.js";

const STORAGE_KEY = "overlord_rising_progress";

export const STAT_MAX = 33;
export const CHANCE_LEVEL_MAX = 50;
export const CHANCE_PER_LEVEL = 0.01;
export const BASE_HP = 15 * STAT_SCALE;
export const HP_PER_LEVEL = STAT_SCALE;
const WAVE_BLOCK = 10;

const DEFAULT = {
    coins: 0,
    unlockedStartWave: 1,
    upgrades: {
        damage: 0,
        fireRate: 0,
        spread: 0,
        health: 0,
        repair: 0,
        waveHeal: 0,
        doubleShot: 0,
        multiShot: 0,
        explodeShot: 0,
        pierceShot: 0,
        critChance: 0,
        critMult: 0,
        straightShot: 0,
    },
    ownedMods: [],
    equippedMods: emptyLoadout(),
    modRolls: {},
    chanceScale: 1,
    statScale: STAT_SCALE,
    soundEnabled: true,
    stats: {
        kills: 0,
        bosses: 0,
        coinsEarned: 0,
        wavesCleared: 0,
        shots: 0,
        runs: 0,
        bestScore: 0,
        bestWave: 0,
    },
    idle: {
        rate: 0,
        cap: 0,
        lastAt: 0,
    },
};

export const SHOP_GROUPS = [
    { id: "shoot", title: "Стрельба" },
    { id: "fortress", title: "Крепость" },
    { id: "special", title: "Особые" },
];

export const SHOP_ITEMS = [
    {
        id: "damage",
        group: "shoot",
        title: "Урон",
        hint: "Каждый уровень чуть сильнее прошлого",
        max: STAT_MAX,
    },
    {
        id: "fireRate",
        group: "shoot",
        title: "Скорострельность",
        hint: "Больше выстрелов в секунду",
        max: STAT_MAX,
    },
    {
        id: "spread",
        group: "shoot",
        title: "Кучность",
        hint: "100% — широкий конус, меньше % — кучнее",
        max: STAT_MAX,
    },
    {
        id: "critChance",
        group: "shoot",
        title: "Шанс крита",
        hint: "Шанс зелёного снаряда с множителем, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "critMult",
        group: "shoot",
        title: "Множитель крита",
        hint: "Насколько сильнее крит. Старт ×1.5",
        max: STAT_MAX,
        critMult: true,
    },
    {
        id: "straightShot",
        group: "shoot",
        title: "Прямой выстрел",
        hint: "Шанс без разброса, строго в прицел, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "health",
        group: "fortress",
        title: "Здоровье",
        hint: "+10 HP и больше с каждым уровнем",
        max: STAT_MAX,
        hpPerLevel: HP_PER_LEVEL,
        baseHp: BASE_HP,
    },
    {
        id: "repair",
        group: "fortress",
        title: "Ремонт",
        hint: "Понемногу чинит крепость во время боя",
        max: STAT_MAX,
    },
    {
        id: "waveHeal",
        group: "fortress",
        title: "После волны",
        hint: "Восстанавливает HP крепости после каждой волны",
        max: STAT_MAX,
        waveHeal: true,
    },
    {
        id: "doubleShot",
        group: "special",
        title: "Двойной выстрел",
        hint: "Шанс двух пуль за залп, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "multiShot",
        group: "special",
        title: "Мультистрел",
        hint: "Шанс доп. снаряда за залп, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "explodeShot",
        group: "special",
        title: "Взрывной выстрел",
        hint: "Шанс урона врагам рядом, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "pierceShot",
        group: "special",
        title: "Пробивной выстрел",
        hint: "Шанс пройти сквозь врага, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
];

/** Цена уровня: быстро растёт, последние уровни очень дорогие. */
export function upgradeCostForLevel(level) {
    return Math.round(28 * Math.pow(1.28, level));
}

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
        const data = JSON.parse(raw);
        const mods = sanitizeLoadout(data.ownedMods, data.equippedMods, data.modRolls);
        let doubleShot = clampLevel(readChanceLevel(data.upgrades?.doubleShot), CHANCE_LEVEL_MAX);
        let multiShot = clampLevel(data.upgrades?.multiShot, CHANCE_LEVEL_MAX);
        let explodeShot = clampLevel(data.upgrades?.explodeShot, CHANCE_LEVEL_MAX);
        let pierceShot = clampLevel(data.upgrades?.pierceShot, CHANCE_LEVEL_MAX);
        let critChance = clampLevel(data.upgrades?.critChance, CHANCE_LEVEL_MAX);
        let straightShot = clampLevel(data.upgrades?.straightShot, CHANCE_LEVEL_MAX);
        const scaled = data.chanceScale === 1;
        if (!scaled) {
            doubleShot = Math.min(CHANCE_LEVEL_MAX, Math.round(doubleShot * 2.5));
            multiShot = Math.min(CHANCE_LEVEL_MAX, Math.round(multiShot * 2.5));
        }
        const statScaled = data.statScale === STAT_SCALE;
        const modRolls = statScaled ? mods.modRolls : scaleStoredDamageRolls(mods.modRolls);
        const parsed = {
            coins: Math.max(0, Number(data.coins) || 0),
            unlockedStartWave: Math.max(1, Number(data.unlockedStartWave) || 1),
            upgrades: {
                damage: clampLevel(data.upgrades?.damage, STAT_MAX),
                fireRate: clampLevel(data.upgrades?.fireRate, STAT_MAX),
                spread: clampLevel(data.upgrades?.spread, STAT_MAX),
                health: clampLevel(data.upgrades?.health, STAT_MAX),
                repair: clampLevel(data.upgrades?.repair, STAT_MAX),
                waveHeal: clampLevel(data.upgrades?.waveHeal, STAT_MAX),
                doubleShot,
                multiShot,
                explodeShot,
                pierceShot,
                critChance,
                critMult: clampLevel(data.upgrades?.critMult, STAT_MAX),
                straightShot,
            },
            ownedMods: mods.ownedMods,
            equippedMods: mods.equippedMods,
            modRolls,
            chanceScale: 1,
            statScale: STAT_SCALE,
            soundEnabled: data.soundEnabled !== false,
            stats: readCareerStats(data.stats),
            idle: readIdle(data.idle),
        };
        if (!scaled || !statScaled || rollsNeedPersist(data.modRolls, modRolls)) write(parsed);
        return parsed;
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT));
    }
}

function rollsNeedPersist(rawRolls, repaired) {
    return Object.keys(repaired || {}).some((id) => {
        const mod = getModifier(id);
        const raw = rawRolls?.[id];
        if (!mod) return false;
        if (typeof mod.spreadDegAdd === "number" && typeof raw?.spreadDegAdd !== "number") return true;
        if (typeof raw?.spreadDegAdd === "number" && raw.spreadDegAdd < -3) return true;
        if (typeof raw?.spreadDegAdd === "number" && typeof mod.spreadDegAdd !== "number"
            && !(raw?.extraKeys || []).includes("spread")) return true;
        if (typeof mod.damageAdd === "number" && mod.damageAdd > 0
            && (raw?.damageAdd ?? 0) > mod.damageAdd + (mod.damageVar ?? 0) + 40) return true;
        if (typeof mod.damageAdd === "number" && mod.damageAdd < 0) {
            const extraCap = (raw?.extraKeys || []).includes("damage") ? STAT_SCALE * 2 : 0;
            if ((raw?.damageAdd ?? 0) > extraCap) return true;
        }
        return false;
    });
}

function scaleStoredDamageRolls(rolls) {
    const next = {};
    Object.entries(rolls || {}).forEach(([id, roll]) => {
        if (!roll || typeof roll !== "object") {
            next[id] = roll;
            return;
        }
        const copy = { ...roll };
        if (typeof copy.damageAdd === "number") copy.damageAdd *= STAT_SCALE;
        next[id] = copy;
    });
    return next;
}

function readIdle(raw) {
    const idle = raw && typeof raw === "object" ? raw : {};
    return {
        rate: clampLevel(idle.rate, IDLE_RATE_MAX),
        cap: clampLevel(idle.cap, IDLE_CAP_MAX),
        lastAt: Math.max(0, Number(idle.lastAt) || 0),
    };
}

function readCareerStats(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    return {
        kills: Math.max(0, Math.floor(Number(s.kills) || 0)),
        bosses: Math.max(0, Math.floor(Number(s.bosses) || 0)),
        coinsEarned: Math.max(0, Math.floor(Number(s.coinsEarned) || 0)),
        wavesCleared: Math.max(0, Math.floor(Number(s.wavesCleared) || 0)),
        shots: Math.max(0, Math.floor(Number(s.shots) || 0)),
        runs: Math.max(0, Math.floor(Number(s.runs) || 0)),
        bestScore: Math.max(0, Math.floor(Number(s.bestScore) || 0)),
        bestWave: Math.max(0, Math.floor(Number(s.bestWave) || 0)),
    };
}

function write(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clampLevel(value, max) {
    const n = Number(value) || 0;
    return Math.max(0, Math.min(max, Math.floor(n)));
}

/** Старый сейв: doubleShot был «всегда». Переносим в уровни шанса. */
function readChanceLevel(value) {
    if (value === true) return CHANCE_LEVEL_MAX;
    return clampLevel(value, CHANCE_LEVEL_MAX);
}

export function loadProgress() {
    return read();
}

export function isSoundEnabled() {
    return read().soundEnabled !== false;
}

export function setSoundEnabled(enabled) {
    const data = read();
    data.soundEnabled = Boolean(enabled);
    write(data);
    return data.soundEnabled;
}

export function addCoins(amount) {
    const data = read();
    data.coins += Math.max(0, Math.floor(amount));
    write(data);
    return data.coins;
}

export function collectIdleIncome(now = Date.now()) {
    const data = read();
    const idle = readIdle(data.idle);
    const gain = computeIdleGain(idle, now);
    if (gain.coins > 0) {
        data.coins += gain.coins;
        data.stats = {
            ...data.stats,
            coinsEarned: data.stats.coinsEarned + gain.coins,
        };
    }
    data.idle = { ...idle, lastAt: now };
    write(data);
    return { coins: gain.coins, idle: data.idle, totalCoins: data.coins, usedMs: gain.usedMs, capMs: gain.capMs, rate: gain.rate };
}

export function resumeIdleClock(now = Date.now()) {
    const data = read();
    data.idle = { ...readIdle(data.idle), lastAt: now };
    write(data);
    return data.idle;
}

export function buyIdleUpgrade(kind) {
    const data = read();
    const idle = readIdle(data.idle);
    if (kind === "rate") {
        if (idle.rate >= IDLE_RATE_MAX) return { ok: false, reason: "max" };
        const cost = idleRateCost(idle.rate);
        if (data.coins < cost) return { ok: false, reason: "coins", cost };
        data.coins -= cost;
        idle.rate += 1;
    } else if (kind === "cap") {
        if (idle.cap >= IDLE_CAP_MAX) return { ok: false, reason: "max" };
        const cost = idleCapCost(idle.cap);
        if (data.coins < cost) return { ok: false, reason: "coins", cost };
        data.coins -= cost;
        idle.cap += 1;
    } else {
        return { ok: false, reason: "unknown" };
    }
    data.idle = idle;
    write(data);
    return { ok: true, coins: data.coins, idle };
}

export function getIdleView(now = Date.now()) {
    const data = read();
    const idle = readIdle(data.idle);
    const gain = computeIdleGain(idle, now);
    return {
        idle,
        wallet: data.coins,
        pending: gain.coins,
        usedMs: gain.usedMs,
        capMs: gain.capMs,
        rate: gain.rate,
    };
}

export function getCareerStats() {
    return read().stats;
}

export function bumpCareerStats(delta) {
    const data = read();
    const stats = { ...data.stats };
    Object.keys(delta || {}).forEach((key) => {
        if (typeof stats[key] !== "number") return;
        stats[key] += Math.max(0, Math.floor(Number(delta[key]) || 0));
    });
    data.stats = stats;
    write(data);
    return stats;
}

export function finishRunRecord(run) {
    const data = read();
    const stats = { ...data.stats };
    stats.runs += 1;
    stats.shots += Math.max(0, Math.floor(Number(run.shots) || 0));
    stats.bestScore = Math.max(stats.bestScore, Math.floor(Number(run.score) || 0));
    stats.bestWave = Math.max(stats.bestWave, Math.floor(Number(run.wave) || 0));
    data.stats = stats;
    write(data);
    return stats;
}

export function careerStatRows(stats) {
    const s = stats ?? getCareerStats();
    return [
        { label: "Убито", value: String(s.kills) },
        { label: "Боссов", value: String(s.bosses) },
        { label: "Монет заработано", value: formatCoins(s.coinsEarned) },
        { label: "Волн пройдено", value: String(s.wavesCleared) },
        { label: "Выстрелов", value: String(s.shots) },
        { label: "Забегов", value: String(s.runs) },
        { label: "Рекорд счёта", value: String(s.bestScore) },
        { label: "Рекорд волны", value: String(s.bestWave || "—") },
    ];
}

/** Временный чит для проверки механик. */
export function resetProgress() {
    const soundEnabled = read().soundEnabled !== false;
    const next = JSON.parse(JSON.stringify(DEFAULT));
    next.soundEnabled = soundEnabled;
    write(next);
    return next;
}

export function getUnlockedStartWave() {
    return read().unlockedStartWave;
}

/** После босса каждых 10 волн открывается следующий блок. */
export function recordWaveCleared(wave) {
    const data = read();
    if (wave > 0 && wave % WAVE_BLOCK === 0) {
        data.unlockedStartWave = Math.max(data.unlockedStartWave, wave + 1);
        write(data);
    }
    return data.unlockedStartWave;
}

export function waveBlockRange(wave) {
    const block = Math.ceil(wave / WAVE_BLOCK) || 1;
    const start = (block - 1) * WAVE_BLOCK + 1;
    return { start, end: start + WAVE_BLOCK - 1, block };
}

export function isBossWave(wave) {
    return wave > 0 && wave % WAVE_BLOCK === 0;
}

export function getUpgradeCost(item, upgrades) {
    if (item.once) {
        return upgrades[item.id] ? null : item.cost;
    }
    const level = upgrades[item.id] ?? 0;
    if (level >= item.max) return null;
    return upgradeCostForLevel(level);
}

export function buyUpgrade(itemId) {
    const data = read();
    const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, reason: "unknown" };

    const cost = getUpgradeCost(item, data.upgrades);
    if (cost == null) return { ok: false, reason: "max" };
    if (data.coins < cost) return { ok: false, reason: "coins", cost };

    data.coins -= cost;
    if (item.once) {
        data.upgrades[item.id] = true;
    } else {
        data.upgrades[item.id] = (Number(data.upgrades[item.id]) || 0) + 1;
    }
    write(data);
    return { ok: true, coins: data.coins, upgrades: data.upgrades };
}

export function formatCoins(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function getBaseMaxHp() {
    return getCombatStats().maxHp;
}

/** Боевые параметры из купленных уровней. */
export function getCombatStats() {
    const data = read();
    const { upgrades } = data;
    const fireRate = upgrades.fireRate;
    const spread = upgrades.spread;

    const dmg = damageRangeForLevel(upgrades.damage);
    const hpStack = upgradeStack(HP_PER_LEVEL, upgrades.health || 0);

    const base = {
        fireRateMs: fireRateMsForLevel(fireRate),
        damageMin: dmg.min,
        damageMax: dmg.max,
        spread: spreadRadForLevel(spread),
        maxHp: BASE_HP + hpStack,
        regenPerSec: regenPerSecForLevel(upgrades.repair || 0),
        pelletCount: 1,
        doubleChance: Math.min(CHANCE_MAX, upgrades.doubleShot * CHANCE_PER_LEVEL),
        multiChance: Math.min(CHANCE_MAX, upgrades.multiShot * CHANCE_PER_LEVEL),
        critChance: Math.min(CHANCE_MAX, (upgrades.critChance || 0) * CHANCE_PER_LEVEL),
        critMult: critMultForLevel(upgrades.critMult || 0),
        straightChance: Math.min(CHANCE_MAX, (upgrades.straightShot || 0) * CHANCE_PER_LEVEL),
        pierce: 0,
        pierceChance: Math.min(CHANCE_MAX, (upgrades.pierceShot || 0) * CHANCE_PER_LEVEL),
        explodeChance: Math.min(CHANCE_MAX, (upgrades.explodeShot || 0) * CHANCE_PER_LEVEL),
        homing: false,
        waveHeal: waveHealForLevel(upgrades.waveHeal || 0),
    };
    return applyModifiersToStats(base, data.equippedMods, data.modRolls);
}

export function buyModifier(modId) {
    const mod = getModifier(modId);
    if (!mod) return { ok: false, reason: "unknown" };

    const data = read();
    if (data.ownedMods.includes(modId)) return { ok: false, reason: "owned" };
    if (data.coins < mod.cost) return { ok: false, reason: "coins", cost: mod.cost };

    data.coins -= mod.cost;
    data.ownedMods.push(modId);
    data.modRolls = { ...(data.modRolls || {}), [modId]: rollModifierStats(mod) };
    write(data);
    return { ok: true, coins: data.coins, roll: data.modRolls[modId] };
}

export function equipModifier(modId, slotIndex) {
    const mod = getModifier(modId);
    if (!mod) return { ok: false, reason: "unknown" };

    const data = read();
    if (!data.ownedMods.includes(modId)) return { ok: false, reason: "locked" };

    const slots = [...data.equippedMods];
    const already = slots.indexOf(modId);
    if (already >= 0) slots[already] = null;

    let index = slotIndex;
    const slotFits = typeof index === "number"
        && slotRarity(index) === mod.rarity
        && !slots[index];
    if (!slotFits) {
        index = firstFreeSlot(slots, mod.rarity, index);
    }
    if (index < 0) return { ok: false, reason: "full" };

    slots[index] = modId;
    data.equippedMods = slots;
    write(data);
    return { ok: true, equippedMods: slots };
}

export function unequipModifier(modIdOrSlot) {
    const data = read();
    const slots = [...data.equippedMods];
    if (typeof modIdOrSlot === "number") {
        if (modIdOrSlot < 0 || modIdOrSlot >= slots.length) return { ok: false, reason: "slot" };
        slots[modIdOrSlot] = null;
    } else {
        const index = slots.indexOf(modIdOrSlot);
        if (index < 0) return { ok: false, reason: "empty" };
        slots[index] = null;
    }
    data.equippedMods = slots;
    write(data);
    return { ok: true, equippedMods: slots };
}

export function sellModifier(modId) {
    const mod = getModifier(modId);
    if (!mod) return { ok: false, reason: "unknown" };
    const data = read();
    if (!data.ownedMods.includes(modId)) return { ok: false, reason: "locked" };

    const roll = data.modRolls?.[modId];
    const refund = sellRefund(mod, roll);
    data.ownedMods = data.ownedMods.filter((id) => id !== modId);
    data.equippedMods = data.equippedMods.map((id) => (id === modId ? null : id));
    const rolls = { ...(data.modRolls || {}) };
    delete rolls[modId];
    data.modRolls = rolls;
    data.coins += refund;
    write(data);
    return { ok: true, coins: data.coins, refund };
}

export function tuneModifier(modId) {
    const mod = getModifier(modId);
    if (!mod) return { ok: false, reason: "unknown" };
    const data = read();
    if (!data.ownedMods.includes(modId)) return { ok: false, reason: "locked" };
    const roll = data.modRolls?.[modId] ?? rollModifierStats(mod);
    if ((roll.tuneLevel || 0) >= TUNE_MAX) return { ok: false, reason: "max" };
    const cost = tuneCost(mod, roll);
    if (data.coins < cost) return { ok: false, reason: "coins", cost };
    data.coins -= cost;
    data.modRolls = { ...(data.modRolls || {}), [modId]: applyTuneToRoll(mod, roll) };
    write(data);
    return { ok: true, coins: data.coins, roll: data.modRolls[modId] };
}

export function addModifierTrait(modId) {
    const mod = getModifier(modId);
    if (!mod) return { ok: false, reason: "unknown" };
    const data = read();
    if (!data.ownedMods.includes(modId)) return { ok: false, reason: "locked" };
    const roll = data.modRolls?.[modId] ?? rollModifierStats(mod);
    const cap = extraCapFor(mod.rarity);
    if (extraKeysOf(roll).length >= cap) return { ok: false, reason: "full" };
    const pool = pickableExtras(mod, roll);
    if (!pool.length) return { ok: false, reason: "none" };
    const cost = extraTraitCost(mod, roll);
    if (data.coins < cost) return { ok: false, reason: "coins", cost };
    const trait = pool[Math.floor(Math.random() * pool.length)];
    const next = applyExtraTrait(mod, roll, trait.id);
    if (!next) return { ok: false, reason: "none" };
    data.coins -= cost;
    data.modRolls = { ...(data.modRolls || {}), [modId]: next };
    write(data);
    return { ok: true, coins: data.coins, trait: trait.label, roll: next };
}
