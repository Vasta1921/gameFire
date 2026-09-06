import {
    buyIdleUpgrade,
    collectIdleIncome,
    formatCoins,
    getIdleView,
} from "../progress/Progress.js";
import {
    IDLE_CAP_MAX,
    IDLE_RATE_MAX,
    formatIdleDuration,
    idleCapCost,
    idleCapHours,
    idleCoinsPerHour,
    idleRateCost,
} from "../progress/Idle.js";

/** Вкладка пассивного заработка вне боя. */
export function addIdleTab(scene, { collected = 0, onChange }) {
    const { width } = scene.cameras.main;
    const x = width / 2;
    const view = getIdleView();
    const nodes = [];

    const card = scene.add.rectangle(x, 440, 620, 200, 0x161210, 0.94);
    card.setStrokeStyle(2, 0xff3300, 0.8);
    nodes.push(card);

    const pending = view.pending;
    const status = collected > 0
        ? `Собрано ${formatCoins(collected)}`
        : pending > 0
            ? `Готово ${formatCoins(pending)}`
            : "Копилка пуста";
    const statusText = scene.add.text(x, 372, status, {
        fontSize: "26px",
        fill: collected > 0 ? "#86efac" : "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5);
    nodes.push(statusText);

    const rate = idleCoinsPerHour(view.idle.rate);
    const capH = idleCapHours(view.idle.cap);
    const filled = `${formatIdleDuration(view.usedMs)} из ${formatIdleDuration(view.capMs)}`;
    const info = scene.add.text(x, 430, `${formatCoins(rate)} / час · лимит ${capH} ч\nЗаполнено: ${filled}`, {
        fontSize: "18px",
        fill: "#a78a7a",
        align: "center",
        lineSpacing: 6,
    }).setOrigin(0.5);
    nodes.push(info);

    const hint = scene.add.text(x, 500, "Монеты копятся, пока вы не в бою, до лимита времени.", {
        fontSize: "15px",
        fill: "#7a6a60",
        wordWrap: { width: 560 },
        align: "center",
    }).setOrigin(0.5);
    nodes.push(hint);

    nodes.push(...makeUpgradeRow(scene, x, 640, {
        title: "Больше монет",
        hint: `+ доход в час. Сейчас ${formatCoins(rate)}/ч → ${formatCoins(idleCoinsPerHour(view.idle.rate + 1))}/ч`,
        level: view.idle.rate,
        max: IDLE_RATE_MAX,
        cost: idleRateCost(view.idle.rate),
        coins: view.wallet,
        kind: "rate",
        onChange,
    }));

    nodes.push(...makeUpgradeRow(scene, x, 790, {
        title: "Дольше копится",
        hint: `Лимит ${capH} ч → ${idleCapHours(view.idle.cap + 1)} ч. Дороже, чем доход.`,
        level: view.idle.cap,
        max: IDLE_CAP_MAX,
        cost: idleCapCost(view.idle.cap),
        coins: view.wallet,
        kind: "cap",
        expensive: true,
        onChange,
    }));

    return nodes;
}

function makeUpgradeRow(scene, x, y, { title, hint, level, max, cost, coins, kind, expensive, onChange }) {
    const atMax = level >= max;
    const box = scene.add.rectangle(x, y, 620, 140, 0x161210, 0.94);
    box.setStrokeStyle(2, expensive ? 0xfbbf24 : 0xff3300, 0.8);

    const titleText = scene.add.text(x - 280, y - 36, title, {
        fontSize: "28px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    });

    const hintText = scene.add.text(x - 280, y + 4, atMax ? "Максимум" : hint, {
        fontSize: "16px",
        fill: "#a78a7a",
        wordWrap: { width: 330 },
    });

    const status = scene.add.text(x - 280, y + 48, `Ур. ${level}/${max}`, {
        fontSize: "16px",
        fill: "#c4b5a5",
    });

    const canBuy = !atMax && coins >= cost;
    const btn = scene.add.rectangle(x + 190, y, 220, 52, atMax ? 0x3f3f46 : canBuy ? (expensive ? 0xfbbf24 : 0xff6b4a) : 0x3f3f46, 1);
    const btnText = scene.add.text(x + 190, y, atMax ? "Макс" : formatCoins(cost), {
        fontSize: "22px",
        fill: atMax || !canBuy ? "#888888" : "#111111",
    }).setOrigin(0.5);

    if (!atMax) {
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerup", () => {
            collectIdleIncome();
            const result = buyIdleUpgrade(kind);
            if (result.ok) onChange();
        });
    }

    return [box, titleText, hintText, status, btn, btnText];
}
