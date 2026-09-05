import { CHANCE_MAX } from "./combatFormat.js";
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
const WAVE_BLOCK = 10;

const DEFAULT = {
    coins: 0,
    unlockedStartWave: 1,
    upgrades: {
        damage: 0,
        fireRate: 0,
        spread: 0,
        doubleShot: 0,
        multiShot: 0,
    },
    ownedMods: [],
    equippedMods: emptyLoadout(),
    modRolls: {},
    chanceScale: 1,
    soundEnabled: true,
};

export const SHOP_ITEMS = [
    {
        id: "damage",
        title: "Урон",
        hint: "+1 к мин. и макс. урону пули",
        max: STAT_MAX,
    },
    {
        id: "fireRate",
        title: "Скорострельность",
        hint: "Больше выстрелов в секунду",
        max: STAT_MAX,
    },
    {
        id: "spread",
        title: "Кучность",
        hint: "Меньше разброс пуль",
        max: STAT_MAX,
    },
    {
        id: "doubleShot",
        title: "Двойной выстрел",
        hint: "Шанс двух пуль за залп, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
    {
        id: "multiShot",
        title: "Мультистрел",
        hint: "Шанс доп. снаряда за залп, +1% за уровень",
        max: CHANCE_LEVEL_MAX,
        chancePerLevel: CHANCE_PER_LEVEL,
    },
];

/** Цена уровня: быстро растёт, последние уровни очень дорогие. */
export function upgradeCostForLevel(level) {
    return Math.round(28 * Math.pow(1.24, level));
}

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
        const data = JSON.parse(raw);
        const mods = sanitizeLoadout(data.ownedMods, data.equippedMods, data.modRolls);
        let doubleShot = clampLevel(readChanceLevel(data.upgrades?.doubleShot), CHANCE_LEVEL_MAX);
        let multiShot = clampLevel(data.upgrades?.multiShot, CHANCE_LEVEL_MAX);
        const scaled = data.chanceScale === 1;
        if (!scaled) {
            doubleShot = Math.min(CHANCE_LEVEL_MAX, Math.round(doubleShot * 2.5));
            multiShot = Math.min(CHANCE_LEVEL_MAX, Math.round(multiShot * 2.5));
        }
        const parsed = {
            coins: Math.max(0, Number(data.coins) || 0),
            unlockedStartWave: Math.max(1, Number(data.unlockedStartWave) || 1),
            upgrades: {
                damage: clampLevel(data.upgrades?.damage, STAT_MAX),
                fireRate: clampLevel(data.upgrades?.fireRate, STAT_MAX),
                spread: clampLevel(data.upgrades?.spread, STAT_MAX),
                doubleShot,
                multiShot,
            },
            ownedMods: mods.ownedMods,
            equippedMods: mods.equippedMods,
            modRolls: mods.modRolls,
            chanceScale: 1,
            soundEnabled: data.soundEnabled !== false,
        };
        if (!scaled) write(parsed);
        return parsed;
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT));
    }
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
        data.upgrades[item.id] += 1;
    }
    write(data);
    return { ok: true, coins: data.coins, upgrades: data.upgrades };
}

export function formatCoins(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Боевые параметры из купленных уровней. */
export function getCombatStats() {
    const data = read();
    const { upgrades } = data;
    const damage = upgrades.damage;
    const fireRate = upgrades.fireRate;
    const spread = upgrades.spread;

    const base = {
        fireRateMs: Math.max(140, 280 - fireRate * 4),
        damageMin: 1 + damage,
        damageMax: 3 + damage,
        spread: Math.max(0.04, 0.16 - spread * 0.0035),
        pelletCount: 1,
        doubleChance: Math.min(CHANCE_MAX, upgrades.doubleShot * CHANCE_PER_LEVEL),
        multiChance: Math.min(CHANCE_MAX, upgrades.multiShot * CHANCE_PER_LEVEL),
        pierce: 0,
        explodeChance: 0,
        homing: false,
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
