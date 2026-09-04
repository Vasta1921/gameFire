export function createRunMods() {
    return {
        damage: 0,
        fireRate: 0,
        doubleChance: 0,
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
        hint: "Стреляет чаще",
        apply(run) {
            run.fireRate += 1;
        },
    },
    {
        id: "doubleChance",
        title: "Двойной выстрел",
        hint: "Шанс двойного выстрела",
        apply(run) {
            run.doubleChance = Math.min(0.75, run.doubleChance + 0.25);
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
        fireRateMs: Math.max(45, shopStats.fireRateMs - run.fireRate * 18),
        damageMin: shopStats.damageMin + run.damage,
        damageMax: shopStats.damageMax + run.damage,
        spread: shopStats.spread,
        pelletCount: shopStats.pelletCount,
        doubleChance: run.doubleChance,
        pierce: run.pierce,
        explodeChance: run.explodeChance,
    };
}
