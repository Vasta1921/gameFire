import { SHOP_ITEMS, buyUpgrade, getUpgradeCost, formatCoins } from "../progress/Progress.js";

/** Строки улучшений для меню и мастерской. */
export function addUpgradeRows(scene, x, startY, progress, onBought) {
    const nodes = [];
    let y = startY;

    SHOP_ITEMS.forEach((item) => {
        nodes.push(...makeRow(scene, x, y, item, progress, onBought));
        y += 132;
    });

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
    } else if (item.hpPerLevel) {
        const hp = (item.baseHp || 0) + (progress.upgrades[item.id] || 0) * item.hpPerLevel;
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
