import { CHANCE_MAX, formatSpsDelta, formatSpreadDeltaDeg } from "./combatFormat.js";

export const RARITY = {
    common: "common",
    rare: "rare",
    legendary: "legendary",
};

export const RARITY_META = {
    common: { title: "Обычный", color: 0x94a3b8, fill: "#94a3b8" },
    rare: { title: "Редкий", color: 0xa78bfa, fill: "#c4b5ff" },
    legendary: { title: "Легендарный", color: 0xfbbf24, fill: "#fbbf24" },
};

/** 1 легендарный, 2 редких, 3 обычных. */
export const MOD_SLOTS = [
    { rarity: RARITY.legendary },
    { rarity: RARITY.rare },
    { rarity: RARITY.rare },
    { rarity: RARITY.common },
    { rarity: RARITY.common },
    { rarity: RARITY.common },
];

export const MOD_SLOT_COUNT = MOD_SLOTS.length;

export const EXTRA_TRAIT_CAP = {
    common: 1,
    rare: 2,
    legendary: 3,
};

export const TUNE_MAX = 5;

export const EXTRA_TRAITS = [
    { id: "damage", label: "+урон" },
    { id: "spread", label: "кучность" },
    { id: "fire", label: "скорострельность" },
    { id: "double", label: "двойной выстрел" },
    { id: "multi", label: "мультистрел" },
    { id: "pierce", label: "пробитие" },
    { id: "explode", label: "взрыв" },
    { id: "homing", label: "наведение", legendaryOnly: true },
];

/** Каталог: базовые значения, при покупке крутится ±var. */
export const MODIFIERS = [
    {
        id: "stabilizer",
        title: "Стабилизатор",
        hint: "Сужаем конус огня, но пули бьют слабее.",
        rarity: RARITY.common,
        cost: 420,
        color: 0x38bdf8,
        spreadDegAdd: -5,
        spreadDegVar: 2,
        damageAdd: -2,
        damageVar: 1,
    },
    {
        id: "overclock",
        title: "Разгон",
        hint: "Стреляет чаще, но разброс растёт.",
        rarity: RARITY.common,
        cost: 640,
        color: 0xfb7185,
        fireRateMsAdd: -55,
        fireRateMsVar: 22,
        spreadDegAdd: 5,
        spreadDegVar: 2,
    },
    {
        id: "hollow",
        title: "Бронебой",
        hint: "Больше урона ценой широкого конуса.",
        rarity: RARITY.common,
        cost: 720,
        color: 0x4ade80,
        damageAdd: 3,
        damageVar: 1,
        spreadDegAdd: 4,
        spreadDegVar: 2,
    },
    {
        id: "heavyBarrel",
        title: "Тяжёлый ствол",
        hint: "Кучность выше, зато залпы реже.",
        rarity: RARITY.rare,
        cost: 1480,
        color: 0xa78bfa,
        spreadDegAdd: -4,
        spreadDegVar: 2,
        fireRateMsAdd: 75,
        fireRateMsVar: 25,
    },
    {
        id: "pulse",
        title: "Импульс",
        hint: "Чаще стреляет, но каждый снаряд слабее.",
        rarity: RARITY.rare,
        cost: 1680,
        color: 0xf472b6,
        fireRateMsAdd: -70,
        fireRateMsVar: 24,
        damageAdd: -2,
        damageVar: 1,
    },
    {
        id: "seeker",
        title: "Наведение",
        hint: "Снаряды догоняют цель. Реже и слабее выстрелы.",
        rarity: RARITY.legendary,
        cost: 5200,
        color: 0xfbbf24,
        homing: true,
        fireRateMsAdd: 110,
        fireRateMsVar: 30,
        damageAdd: -2,
        damageVar: 1,
    },
];

const BY_ID = new Map(MODIFIERS.map((mod) => [mod.id, mod]));

export function getModifier(id) {
    return BY_ID.get(id) ?? null;
}

export function modifiersOf(rarity) {
    return MODIFIERS.filter((mod) => mod.rarity === rarity);
}

export function slotRarity(index) {
    return MOD_SLOTS[index]?.rarity ?? null;
}

export function emptyLoadout() {
    return Array.from({ length: MOD_SLOT_COUNT }, () => null);
}

export function firstFreeSlot(slots, rarity, preferred) {
    if (
        typeof preferred === "number"
        && slotRarity(preferred) === rarity
        && !slots[preferred]
    ) {
        return preferred;
    }
    return slots.findIndex((id, i) => !id && slotRarity(i) === rarity);
}

function rollAround(base, spread) {
    const lo = base - spread;
    const hi = base + spread;
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function snapshotModifierBase(mod) {
    const roll = {};
    if (typeof mod.spreadDegAdd === "number") roll.spreadDegAdd = mod.spreadDegAdd;
    if (typeof mod.damageAdd === "number") roll.damageAdd = mod.damageAdd;
    if (typeof mod.fireRateMsAdd === "number") roll.fireRateMsAdd = mod.fireRateMsAdd;
    if (mod.homing) roll.homing = true;
    roll.tuneLevel = 0;
    roll.extraKeys = [];
    return roll;
}

export function rollModifierStats(mod) {
    const roll = {};
    if (typeof mod.spreadDegAdd === "number") {
        roll.spreadDegAdd = rollAround(mod.spreadDegAdd, mod.spreadDegVar ?? 2);
    }
    if (typeof mod.damageAdd === "number") {
        roll.damageAdd = rollAround(mod.damageAdd, mod.damageVar ?? 1);
    }
    if (typeof mod.fireRateMsAdd === "number") {
        roll.fireRateMsAdd = rollAround(mod.fireRateMsAdd, mod.fireRateMsVar ?? 20);
    }
    if (mod.homing) roll.homing = true;
    roll.tuneLevel = 0;
    roll.extraKeys = [];
    return roll;
}

export function resolveModifierRoll(id, rolls) {
    const mod = getModifier(id);
    if (!mod) return null;
    return { ...snapshotModifierBase(mod), ...(rolls?.[id] ?? {}) };
}

export function sanitizeLoadout(owned, equipped, rolls) {
    const ownedSet = new Set((owned ?? []).filter((id) => BY_ID.has(id)));
    const slots = emptyLoadout();
    const seen = new Set();
    const source = Array.isArray(equipped) ? equipped : [];

    for (let i = 0; i < MOD_SLOT_COUNT; i += 1) {
        const id = source[i];
        const mod = getModifier(id);
        if (!mod || !ownedSet.has(id) || seen.has(id)) continue;
        if (mod.rarity !== slotRarity(i)) continue;
        slots[i] = id;
        seen.add(id);
    }

    source.forEach((id) => {
        if (!id || seen.has(id) || !ownedSet.has(id)) return;
        const mod = getModifier(id);
        if (!mod) return;
        const index = firstFreeSlot(slots, mod.rarity);
        if (index < 0) return;
        slots[index] = id;
        seen.add(id);
    });

    const modRolls = {};
    const rawRolls = rolls && typeof rolls === "object" ? rolls : {};
    ownedSet.forEach((id) => {
        const mod = getModifier(id);
        if (!mod) return;
        const saved = rawRolls[id];
        modRolls[id] = saved && typeof saved === "object"
            ? { ...snapshotModifierBase(mod), ...saved }
            : snapshotModifierBase(mod);
    });

    return {
        ownedMods: [...ownedSet],
        equippedMods: slots,
        modRolls,
    };
}

export function applyModifiersToStats(stats, equippedIds, rolls) {
    const next = {
        ...stats,
        homing: Boolean(stats.homing),
    };

    (equippedIds ?? []).forEach((id) => {
        const rolled = resolveModifierRoll(id, rolls);
        if (!rolled) return;
        if (typeof rolled.spreadDegAdd === "number") {
            next.spread = Math.max(0.02, next.spread + rolled.spreadDegAdd * Math.PI / 180);
        }
        if (typeof rolled.fireRateMsAdd === "number") {
            next.fireRateMs += rolled.fireRateMsAdd;
        }
        if (typeof rolled.damageAdd === "number") {
            next.damageMin = Math.max(1, next.damageMin + rolled.damageAdd);
            next.damageMax = Math.max(next.damageMin, next.damageMax + rolled.damageAdd);
        }
        if (rolled.homing) next.homing = true;
        if (typeof rolled.doubleChanceAdd === "number") {
            next.doubleChance = Math.min(CHANCE_MAX, (next.doubleChance || 0) + rolled.doubleChanceAdd);
        }
        if (typeof rolled.multiChanceAdd === "number") {
            next.multiChance = Math.min(CHANCE_MAX, (next.multiChance || 0) + rolled.multiChanceAdd);
        }
        if (typeof rolled.pierceAdd === "number") {
            next.pierce = (next.pierce || 0) + rolled.pierceAdd;
        }
        if (typeof rolled.explodeChanceAdd === "number") {
            next.explodeChance = Math.min(0.8, (next.explodeChance || 0) + rolled.explodeChanceAdd);
        }
    });

    next.fireRateMs = Math.max(120, Math.min(520, next.fireRateMs));
    return next;
}

export function modifierStatLines(mod, roll) {
    const preview = !roll;
    const lines = [];

    if (preview) {
        if (typeof mod.spreadDegAdd === "number") {
            const v = mod.spreadDegVar ?? 2;
            lines.push(`разброс ${formatSpreadDeltaDeg(mod.spreadDegAdd - v)}…${formatSpreadDeltaDeg(mod.spreadDegAdd + v)}`);
        }
        if (typeof mod.fireRateMsAdd === "number") {
            const v = mod.fireRateMsVar ?? 20;
            lines.push(`${formatSpsDelta(mod.fireRateMsAdd - v)}…${formatSpsDelta(mod.fireRateMsAdd + v)}`);
        }
        if (typeof mod.damageAdd === "number") {
            const v = mod.damageVar ?? 1;
            lines.push(`урон ${fmtSigned(mod.damageAdd - v)}…${fmtSigned(mod.damageAdd + v)}`);
        }
    } else {
        if (typeof roll.spreadDegAdd === "number") {
            lines.push(`разброс ${formatSpreadDeltaDeg(roll.spreadDegAdd)}`);
        }
        if (typeof roll.fireRateMsAdd === "number") {
            lines.push(formatSpsDelta(roll.fireRateMsAdd));
        }
        if (typeof roll.damageAdd === "number") {
            lines.push(`${fmtSigned(roll.damageAdd)} урон`);
        }
    }
    if (mod.homing || roll?.homing) lines.push("Самонаводящиеся снаряды");
    if (roll && typeof roll.doubleChanceAdd === "number") {
        lines.push(`двойной выстрел +${Math.round(roll.doubleChanceAdd * 100)}%`);
    }
    if (roll && typeof roll.multiChanceAdd === "number") {
        lines.push(`мультистрел +${Math.round(roll.multiChanceAdd * 100)}%`);
    }
    if (roll && typeof roll.pierceAdd === "number") {
        lines.push(`пробитие +${roll.pierceAdd}`);
    }
    if (roll && typeof roll.explodeChanceAdd === "number") {
        lines.push(`взрыв +${Math.round(roll.explodeChanceAdd * 100)}%`);
    }
    return lines;
}

export function extraCapFor(rarity) {
    return EXTRA_TRAIT_CAP[rarity] ?? 1;
}

export function extraKeysOf(roll) {
    return Array.isArray(roll?.extraKeys) ? [...roll.extraKeys] : [];
}

export function nativeTraitIds(mod) {
    const keys = [];
    if (typeof mod.spreadDegAdd === "number") keys.push("spread");
    if (typeof mod.damageAdd === "number") keys.push("damage");
    if (typeof mod.fireRateMsAdd === "number") keys.push("fire");
    if (mod.homing) keys.push("homing");
    return keys;
}

export function pickableExtras(mod, roll) {
    const taken = new Set([...nativeTraitIds(mod), ...extraKeysOf(roll)]);
    return EXTRA_TRAITS.filter((trait) => {
        if (trait.legendaryOnly && mod.rarity !== RARITY.legendary) return false;
        return !taken.has(trait.id);
    });
}

export function extraTraitCost(mod, roll) {
    const used = extraKeysOf(roll).length;
    const base = mod.rarity === RARITY.legendary ? 2200 : mod.rarity === RARITY.rare ? 960 : 420;
    return Math.round(base * Math.pow(1.4, used));
}

export function tuneCost(mod, roll) {
    const level = roll?.tuneLevel || 0;
    const mult = mod.rarity === RARITY.legendary ? 2.1 : mod.rarity === RARITY.rare ? 1.45 : 1;
    return Math.round(70 * Math.pow(1.32, level) * mult);
}

export function sellRefund(mod, roll) {
    const extras = extraKeysOf(roll).length;
    const tunes = roll?.tuneLevel || 0;
    return Math.max(1, Math.floor(mod.cost * 0.45 + tunes * 40 + extras * 180));
}

export function applyTuneToRoll(mod, roll) {
    const next = { ...roll };
    next.tuneLevel = (next.tuneLevel || 0) + 1;
    if (typeof next.damageAdd === "number") next.damageAdd += 1;
    if (typeof next.spreadDegAdd === "number") next.spreadDegAdd -= 1;
    if (typeof next.fireRateMsAdd === "number") next.fireRateMsAdd -= 12;
    if (typeof next.doubleChanceAdd === "number") {
        next.doubleChanceAdd = Math.min(0.45, next.doubleChanceAdd + 0.03);
    }
    if (typeof next.multiChanceAdd === "number") {
        next.multiChanceAdd = Math.min(0.4, next.multiChanceAdd + 0.025);
    }
    if (typeof next.pierceAdd === "number") next.pierceAdd += 1;
    if (typeof next.explodeChanceAdd === "number") {
        next.explodeChanceAdd = Math.min(0.55, next.explodeChanceAdd + 0.05);
    }
    return next;
}

export function applyExtraTrait(mod, roll, traitId) {
    const trait = EXTRA_TRAITS.find((entry) => entry.id === traitId);
    if (!trait) return null;
    const next = { ...roll, extraKeys: extraKeysOf(roll) };
    if (next.extraKeys.includes(traitId)) return null;
    next.extraKeys = [...next.extraKeys, traitId];

    if (traitId === "damage") next.damageAdd = (next.damageAdd || 0) + 1 + Math.floor(Math.random() * 2);
    if (traitId === "spread") next.spreadDegAdd = (next.spreadDegAdd || 0) - (2 + Math.floor(Math.random() * 2));
    if (traitId === "fire") next.fireRateMsAdd = (next.fireRateMsAdd || 0) - (22 + Math.floor(Math.random() * 18));
    if (traitId === "double") next.doubleChanceAdd = (next.doubleChanceAdd || 0) + 0.07 + Math.floor(Math.random() * 4) * 0.01;
    if (traitId === "multi") next.multiChanceAdd = (next.multiChanceAdd || 0) + 0.05 + Math.floor(Math.random() * 4) * 0.01;
    if (traitId === "pierce") next.pierceAdd = (next.pierceAdd || 0) + 1;
    if (traitId === "explode") next.explodeChanceAdd = (next.explodeChanceAdd || 0) + 0.12 + Math.floor(Math.random() * 3) * 0.03;
    if (traitId === "homing") next.homing = true;
    return next;
}

function fmtSigned(n) {
    if (n > 0) return `+${n}`;
    if (n < 0) return `−${Math.abs(n)}`;
    return "0";
}
