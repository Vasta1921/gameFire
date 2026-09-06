/** Вкладка настроек: звук и прочие переключатели. */
export function addSettingsTab(scene, { soundEnabled, onToggleSound, onAddCoins, onResetProgress, onOpenSniper }) {
    const { width } = scene.cameras.main;
    const nodes = [];
    nodes.push(...makeRow(scene, width / 2, 430, {
        title: "Все звуки",
        hint: "Выстрелы, взрывы и эффекты",
        label: soundEnabled ? "Вкл" : "Выкл",
        color: soundEnabled ? 0xff6b4a : 0x3f3f46,
        textFill: soundEnabled ? "#111111" : "#888888",
        onClick: onToggleSound,
    }));
    nodes.push(...makeRow(scene, width / 2, 578, {
        title: "+1000 монет",
        hint: "Временно, для проверки механик",
        label: "Добавить",
        color: 0xfbbf24,
        textFill: "#111111",
        onClick: onAddCoins,
    }));
    nodes.push(...makeRow(scene, width / 2, 726, {
        title: "Снайпер (отладка)",
        hint: "Временно: вход без 25 волн",
        label: "Открыть",
        color: 0x22d3ee,
        textFill: "#111111",
        onClick: onOpenSniper,
    }));
    nodes.push(...makeRow(scene, width / 2, 874, {
        title: "Сброс прогресса",
        hint: "Временно: монеты, апгрейды, моды, волны",
        label: "Сбросить",
        color: 0xef4444,
        textFill: "#111111",
        onClick: onResetProgress,
    }));
    return nodes;
}

function makeRow(scene, x, y, { title, hint, label, color, textFill, onClick }) {
    const box = scene.add.rectangle(x, y, 620, 140, 0x161210, 0.94);
    box.setStrokeStyle(2, 0xff3300, 0.8);

    const titleText = scene.add.text(x - 280, y - 28, title, {
        fontSize: "28px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    });

    const hintText = scene.add.text(x - 280, y + 12, hint, {
        fontSize: "16px",
        fill: "#a78a7a",
        wordWrap: { width: 330 },
    });

    const btn = scene.add.rectangle(x + 190, y, 220, 48, color, 1);
    const btnText = scene.add.text(x + 190, y, label, {
        fontSize: "22px",
        fill: textFill,
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerup", onClick);

    return [box, titleText, hintText, btn, btnText];
}
