import { getCombatStats } from "../progress/Progress.js";
import { combatStatRows } from "../progress/combatFormat.js";

/** Панель текущих параметров башни (мастерская + модули). */
export function addTowerStatsPanel(scene, x, y, options = {}) {
    const stats = options.stats ?? getCombatStats();
    return addInfoPanel(scene, x, y, {
        ...options,
        title: options.title ?? "Башня",
        rows: options.rows ?? combatStatRows(stats),
    });
}

export function addInfoPanel(scene, x, y, options = {}) {
    const compact = Boolean(options.compact);
    const rows = options.rows ?? [];
    const cols = options.cols ?? (compact ? 2 : 1);
    const width = options.width ?? (compact ? 640 : 520);
    const rowH = compact ? 36 : 40;
    const pad = compact ? 20 : 28;
    const titleH = compact ? 32 : 40;
    const rowCount = Math.ceil(rows.length / cols);
    const height = pad * 2 + titleH + rowCount * rowH;
    const nodes = [];

    const box = scene.add.rectangle(x, y, width, height, 0x161210, 0.94);
    box.setStrokeStyle(2, 0xff3300, 0.75);
    nodes.push(box);

    const title = scene.add.text(x, y - height / 2 + pad, options.title ?? "Башня", {
        fontSize: compact ? "22px" : "26px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5, 0);
    nodes.push(title);

    const colW = width / cols;
    rows.forEach((row, i) => {
        const col = i % cols;
        const r = Math.floor(i / cols);
        const colCx = x - width / 2 + colW * col + colW / 2;
        const rowY = y - height / 2 + pad + titleH + r * rowH + rowH / 2;
        const label = scene.add.text(colCx - colW / 2 + 18, rowY, row.label, {
            fontSize: compact ? "16px" : "20px",
            fill: "#a78a7a",
        }).setOrigin(0, 0.5);
        const value = scene.add.text(colCx + colW / 2 - 18, rowY, row.value, {
            fontSize: compact ? "18px" : "22px",
            fill: row.fill ?? "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(1, 0.5);
        nodes.push(label, value);
    });

    return { nodes, height };
}
