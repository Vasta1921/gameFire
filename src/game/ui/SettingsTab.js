/** Вкладка настроек: звук и прочие переключатели. */
export function addSettingsTab(scene, { soundEnabled, onToggleSound }) {
    const { width } = scene.cameras.main;
    const y = 430;
    const box = scene.add.rectangle(width / 2, y, 620, 140, 0x161210, 0.94);
    box.setStrokeStyle(2, 0xff3300, 0.8);

    const title = scene.add.text(width / 2 - 280, y - 28, "Все звуки", {
        fontSize: "28px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    });

    const hint = scene.add.text(width / 2 - 280, y + 12, "Выстрелы, взрывы и эффекты", {
        fontSize: "16px",
        fill: "#a78a7a",
        wordWrap: { width: 330 },
    });

    const on = Boolean(soundEnabled);
    const btn = scene.add.rectangle(width / 2 + 190, y, 220, 48, on ? 0xff6b4a : 0x3f3f46, 1);
    const btnText = scene.add.text(width / 2 + 190, y, on ? "Вкл" : "Выкл", {
        fontSize: "22px",
        fill: on ? "#111111" : "#888888",
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerup", onToggleSound);

    return [box, title, hint, btn, btnText];
}
