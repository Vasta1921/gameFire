import { CHANCE_MAX } from "./combatFormat.js";

export function createRunMods() {
    return {
        damage: 0,
        fireRate: 0,
        doubleChance: 0,
        multiChance: 0,
        pierce: 0,
        explodeChance: 0,
    };
}

export const WAVE_PICKS = [
    {
        id: "heal",
        title: "Ремонт",
        hint: "+6 HP крепости",
        apply(_run, scene) {
            scene.base.heal(6);
            scene.hud.setBaseHp(scene.base.hp, scene.base.maxHp);
        },
    },
    {
        id: "damage",
        title: "Урон",
        hint: "+1 к урону",
        apply(run) {
            run.damage += 1;
        },
    },
    {
        id: "fireRate",
        title: "Скорострельность",
        hint: "Больше выстрелов в секунду",
        apply(run) {
            run.fireRate += 1;
        },
    },
    {
        id: "doubleChance",
        title: "Двойной выстрел",
        hint: "Шанс двух пуль за залп",
        apply(run) {
            run.doubleChance = Math.min(CHANCE_MAX, run.doubleChance + 0.14);
        },
    },
    {
        id: "multiChance",
        title: "Мультистрел",
        hint: "Шанс доп. снаряда за залп",
        apply(run) {
            run.multiChance = Math.min(CHANCE_MAX, (run.multiChance || 0) + 0.14);
        },
    },
    {
        id: "pierce",
        title: "Пробитие",
        hint: "Пробивает одного врага",
        apply(run) {
            run.pierce += 1;
        },
    },
    {
        id: "explodeChance",
        title: "Взрывной выстрел",
        hint: "Шанс урона врагам рядом",
        apply(run) {
            run.explodeChance = Math.min(0.6, run.explodeChance + 0.2);
        },
    },
];

export function pickThreeUpgrades() {
    const pool = [...WAVE_PICKS];
    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
}

export function mergeCombatStats(shopStats, run) {
    return {
        fireRateMs: Math.max(120, shopStats.fireRateMs - run.fireRate * 12),
        damageMin: shopStats.damageMin + run.damage,
        damageMax: shopStats.damageMax + run.damage,
        spread: shopStats.spread,
        pelletCount: shopStats.pelletCount || 1,
        doubleChance: Math.min(CHANCE_MAX, (shopStats.doubleChance || 0) + run.doubleChance),
        multiChance: Math.min(CHANCE_MAX, (shopStats.multiChance || 0) + (run.multiChance || 0)),
        pierce: (shopStats.pierce || 0) + run.pierce,
        explodeChance: Math.min(0.8, (shopStats.explodeChance || 0) + run.explodeChance),
        homing: Boolean(shopStats.homing),
    };
}
