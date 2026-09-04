/** Фичкоин: золотая монета с котом + число. */
export function addFichcoinBadge(scene, x, y, amount, options = {}) {
    const scale = options.scale ?? 0.55;
    const originX = options.originX ?? 0;
    const depth = options.depth ?? 10;
    const fontSize = options.fontSize ?? "26px";

    const icon = scene.add.image(x, y, "fichcoin");
    icon.setScale(scale);
    icon.setOrigin(originX, 0.5);
    icon.setDepth(depth);

    const textX = originX === 0.5
        ? x + 28 * (scale / 0.55)
        : x + 38 * (scale / 0.55);
    let text = scene.add.text(textX, y, String(amount), {
        fontSize,
        fill: "#fbbf24",
        fontStyle: "bold",
    });
    text.setOrigin(originX === 0.5 ? 0 : 0, 0.5);
    text.setDepth(depth);

    return {
        icon,
        text,
        setAmount(value) {
            const next = String(value);
            if (text.text === next) return;
            const x = text.x;
            const y = text.y;
            const ox = text.originX;
            const oy = text.originY;
            text.destroy();
            text = scene.add.text(x, y, next, {
                fontSize,
                fill: "#fbbf24",
                fontStyle: "bold",
            });
            text.setOrigin(ox, oy);
            text.setDepth(depth);
            this.text = text;
        },
        setVisible(visible) {
            icon.setVisible(visible);
            text.setVisible(visible);
        },
    };
}
