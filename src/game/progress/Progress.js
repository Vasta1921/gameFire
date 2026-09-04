const STORAGE_KEY = "overlord_rising_progress";

const DEFAULT = {
    coins: 0,
    upgrades: {
        damage: 0,
        fireRate: 0,
        spread: 0,
        doubleShot: false,
    },
};

export const SHOP_ITEMS = [
    {
        id: "damage",
        title: "Урон",
        hint: "+1 к мин. и макс. урону пули",
        max: 5,
        costs: [12, 20, 32, 50, 75],
    },
    {
        id: "fireRate",
        title: "Скорострельность",
        hint: "Короче пауза между выстрелами",
        max: 5,
        costs: [12, 20, 32, 50, 75],
    },
    {
        id: "spread",
        title: "Кучность",
        hint: "Меньше разброс пуль",
        max: 5,
        costs: [10, 16, 26, 40, 60],
    },
    {
        id: "doubleShot",
        title: "Двойной выстрел",
        hint: "Две пули за один залп",
        once: true,
        cost: 150,
    },
];

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
        const data = JSON.parse(raw);
        return {
            coins: Math.max(0, Number(data.coins) || 0),
            upgrades: {
                damage: clampLevel(data.upgrades?.damage, 5),
                fireRate: clampLevel(data.upgrades?.fireRate, 5),
                spread: clampLevel(data.upgrades?.spread, 5),
                doubleShot: Boolean(data.upgrades?.doubleShot),
            },
        };
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

export function loadProgress() {
    return read();
}

export function addCoins(amount) {
    const data = read();
    data.coins += Math.max(0, Math.floor(amount));
    write(data);
    return data.coins;
}

export function getUpgradeCost(item, upgrades) {
    if (item.once) {
        return upgrades.doubleShot ? null : item.cost;
    }
    const level = upgrades[item.id] ?? 0;
    if (level >= item.max) return null;
    return item.costs[level];
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
        data.upgrades.doubleShot = true;
    } else {
        data.upgrades[item.id] += 1;
    }
    write(data);
    return { ok: true, coins: data.coins, upgrades: data.upgrades };
}

/** Боевые параметры из купленных уровней. */
export function getCombatStats() {
    const { upgrades } = read();
    const damage = upgrades.damage;
    const fireRate = upgrades.fireRate;
    const spread = upgrades.spread;

    return {
        fireRateMs: Math.max(55, 150 - fireRate * 18),
        damageMin: 1 + damage,
        damageMax: 3 + damage,
        spread: Math.max(1, 8 - spread),
        pelletCount: upgrades.doubleShot ? 2 : 1,
    };
}
