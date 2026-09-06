import { SHOP_ITEMS, SHOP_GROUPS, buyUpgrade, getUpgradeCost, formatCoins, BASE_HP, HP_PER_LEVEL } from "../progress/Progress.js";
import { upgradeStack, fireRateMsForLevel, damageRangeForLevel, regenPerSecForLevel, spreadRadForLevel, spreadPercent, waveHealForLevel, critMultForLevel } from "../progress/scaling.js";
import { formatShotsPerSec } from "../progress/combatFormat.js";

/** Строки улучшений для меню и мастерской. */
export function addUpgradeRows(scene, x, startY, progress, onBought, groupId = null) {
    const items = groupId
        ? SHOP_ITEMS.filter((item) => item.group === groupId)
        : SHOP_ITEMS;
    const nodes = [];
    let y = startY;

    items.forEach((item) => {
        nodes.push(...makeRow(scene, x, y, item, progress, onBought));
        y += 132;
    });

    return nodes;
}

export function addShopPanel(scene, options) {
    const {
        x,
        tabY,
        listY,
        groupId,
        progress,
        onBought,
        onGroupChange,
    } = options;
    const nodes = [];
    const tabW = 198;
    const gap = 10;
    const total = SHOP_GROUPS.length * tabW + (SHOP_GROUPS.length - 1) * gap;
    let gx = x - total / 2 + tabW / 2;

    SHOP_GROUPS.forEach((group) => {
        const active = group.id === groupId;
        const bg = scene.add.rectangle(gx, tabY, tabW, 46, active ? 0xff6b4a : 0x2a1c18, 1);
        const label = scene.add.text(gx, tabY, group.title, {
            fontSize: "20px",
            fill: "#ffe8d6",
        }).setOrigin(0.5);
        if (active) label.setTint(0x111111);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerup", () => {
            if (group.id === groupId) return;
            scene.time.delayedCall(0, () => onGroupChange(group.id));
        });
        nodes.push(bg, label);
        gx += tabW + gap;
    });

    nodes.push(...addUpgradeRows(scene, x, listY, progress, onBought, groupId));
    return nodes;
}

function makeRow(scene, x, y, item, progress, onBought) {
    const box = scene.add.rectangle(x, y, 620, 128, 0x161210, 0.94);
    box.setStrokeStyle(2, item.once ? 0xfbbf24 : 0xff3300, 0.8);

    const title = scene.add.text(x - 280, y - 36, item.title, {
        fontSize: "28px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    });

    const hint = scene.add.text(x - 280, y - 4, item.hint, {
        fontSize: "16px",
        fill: "#a78a7a",
        wordWrap: { width: 330 },
    });

    const cost = getUpgradeCost(item, progress.upgrades);
    let status;
    if (item.once) {
        status = progress.upgrades[item.id] ? "Куплено" : "Ур. 0/1";
    } else if (item.chancePerLevel) {
        const chance = Math.round((progress.upgrades[item.id] || 0) * item.chancePerLevel * 100);
        status = `Ур. ${progress.upgrades[item.id]}/${item.max} · ${chance}%`;
    } else if (item.id === "damage") {
        const level = progress.upgrades[item.id] || 0;
        const dmg = damageRangeForLevel(level);
        status = `Ур. ${level}/${item.max} · ${dmg.min}–${dmg.max}`;
    } else if (item.id === "fireRate") {
        const level = progress.upgrades[item.id] || 0;
        const sps = formatShotsPerSec(fireRateMsForLevel(level));
        status = `Ур. ${level}/${item.max} · ${sps} выстр/с`;
    } else if (item.id === "repair") {
        const level = progress.upgrades[item.id] || 0;
        const regen = regenPerSecForLevel(level);
        status = `Ур. ${level}/${item.max} · ${regen.toFixed(1)} HP/с`;
    } else if (item.waveHeal) {
        const level = progress.upgrades[item.id] || 0;
        status = `Ур. ${level}/${item.max} · +${waveHealForLevel(level)} HP`;
    } else if (item.critMult) {
        const level = progress.upgrades[item.id] || 0;
        status = `Ур. ${level}/${item.max} · ×${critMultForLevel(level).toFixed(1)}`;
    } else if (item.id === "spread") {
        const level = progress.upgrades[item.id] || 0;
        const pct = spreadPercent(spreadRadForLevel(level));
        status = `Ур. ${level}/${item.max} · разброс ${pct}%`;
    } else if (item.hpPerLevel) {
        const hp = (item.baseHp || BASE_HP) + upgradeStack(item.hpPerLevel || HP_PER_LEVEL, progress.upgrades[item.id] || 0);
        status = `Ур. ${progress.upgrades[item.id]}/${item.max} · ${hp} HP`;
    } else {
        status = `Ур. ${progress.upgrades[item.id]}/${item.max}`;
    }

    const meta = scene.add.text(x - 280, y + 32, status, {
        fontSize: "20px",
        fill: "#c4b5a5",
    });

    const label = cost == null ? "Макс." : `Купить  ${formatCoins(cost)}`;
    const canBuy = cost != null && progress.coins >= cost;
    const btnColor = canBuy ? (item.once ? 0xfbbf24 : 0xff6b4a) : 0x3f3f46;
    const btn = scene.add.rectangle(x + 190, y, 220, 48, btnColor, 1);
    const btnText = scene.add.text(x + 190, y, label, {
        fontSize: "22px",
        fill: canBuy ? "#111111" : "#888888",
    }).setOrigin(0.5);

    if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerup", () => {
            const result = buyUpgrade(item.id);
            if (result.ok) onBought();
        });
    }

    return [box, title, hint, meta, btn, btnText];
}
