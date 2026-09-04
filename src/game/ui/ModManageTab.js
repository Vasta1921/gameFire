import { addFichcoinBadge } from "./FichcoinBadge.js";
import {
    addModifierTrait,
    formatCoins,
    loadProgress,
    sellModifier,
    tuneModifier,
} from "../progress/Progress.js";
import {
    RARITY_META,
    TUNE_MAX,
    extraCapFor,
    extraKeysOf,
    extraTraitCost,
    getModifier,
    modifierStatLines,
    pickableExtras,
    tuneCost,
    sellRefund,
} from "../progress/Modifiers.js";

/** Экран: продать, подкрутить или добавить характеристику. */
export function addModManageTab(scene, options = {}) {
    const { width } = scene.cameras.main;
    const cx = width / 2;
    const progress = loadProgress();
    const owned = progress.ownedMods.map((id) => getModifier(id)).filter(Boolean);
    const selectedId = options.selectedId && progress.ownedMods.includes(options.selectedId)
        ? options.selectedId
        : owned[0]?.id ?? null;
    const nodes = [];
    const add = (...items) => {
        nodes.push(...items);
        return items;
    };

    add(...makeBar(scene, options));
    add(scene.add.text(cx, 100, "Управление модулями", {
        fontSize: "28px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5));

    if (!owned.length) {
        add(scene.add.text(cx, 520, "Нет купленных модулей", {
            fontSize: "24px",
            fill: "#a78a7a",
        }).setOrigin(0.5));
        return nodes;
    }

    owned.forEach((mod, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 160 + col * 200;
        const y = 180 + row * 110;
        add(...makeOwnedCard(scene, x, y, mod, selectedId, progress, options));
    });

    if (selectedId) {
        add(...makeManageDetail(scene, cx, 430, selectedId, progress, options));
    }

    return nodes;
}

function makeBar(scene, options) {
    const hit = scene.add.rectangle(56, 48, 88, 64, 0x161210, 0.01);
    hit.setInteractive({ useHandCursor: true });
    const arrow = scene.add.text(56, 48, "←", {
        fontSize: "48px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5);
    hit.on("pointerup", () => options.onBack?.());

    const coins = addFichcoinBadge(scene, scene.cameras.main.width - 160, 48, loadProgress().coins, {
        scale: 0.5,
        fontSize: "26px",
        depth: 12,
    });
    return [hit, arrow, coins.icon, coins.text];
}

function makeOwnedCard(scene, x, y, mod, selectedId, progress, options) {
    const selected = selectedId === mod.id;
    const meta = RARITY_META[mod.rarity];
    const box = scene.add.rectangle(x, y, 180, 92, 0x161210, 0.95);
    box.setStrokeStyle(3, selected ? 0xffe08a : meta.color, 1);
    box.setInteractive({ useHandCursor: true });
    const gem = scene.add.rectangle(x - 58, y, 28, 28, mod.color, 1);
    const name = scene.add.text(x + 16, y - 14, mod.title, {
        fontSize: "18px",
        fill: "#ffe8d6",
        wordWrap: { width: 110 },
    }).setOrigin(0.5, 0);
    const cap = extraCapFor(mod.rarity);
    const used = extraKeysOf(progress.modRolls?.[mod.id]).length;
    const metaText = scene.add.text(x + 16, y + 22, `${meta.title} · ${used}/${cap}`, {
        fontSize: "14px",
        fill: meta.fill,
    }).setOrigin(0.5, 0);
    box.on("pointerup", () => options.onSelect?.({ selectedId: mod.id }));
    return [box, gem, name, metaText];
}

function makeManageDetail(scene, cx, y, selectedId, progress, options) {
    const mod = getModifier(selectedId);
    const roll = progress.modRolls?.[mod.id];
    const meta = RARITY_META[mod.rarity];
    const cap = extraCapFor(mod.rarity);
    const used = extraKeysOf(roll).length;
    const tuneLevel = roll?.tuneLevel || 0;
    const lines = modifierStatLines(mod, roll);
    const refund = sellRefund(mod, roll);
    const tCost = tuneCost(mod, roll);
    const eCost = extraTraitCost(mod, roll);
    const canTune = tuneLevel < TUNE_MAX;
    const canExtra = used < cap && pickableExtras(mod, roll).length > 0;

    const panel = scene.add.rectangle(cx, y + 210, 660, 560, 0x161210, 0.94);
    panel.setStrokeStyle(2, meta.color, 0.9);

    const title = scene.add.text(cx, y, mod.title, {
        fontSize: "30px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5);

    const sub = scene.add.text(cx, y + 34, `${meta.title} · улучш. ${tuneLevel}/${TUNE_MAX} · хар-ки ${used}/${cap}`, {
        fontSize: "18px",
        fill: meta.fill,
    }).setOrigin(0.5);

    const stats = scene.add.text(cx, y + 90, lines.join("\n"), {
        fontSize: "20px",
        fill: "#c4b5a5",
        align: "center",
        lineSpacing: 6,
    }).setOrigin(0.5, 0);

    const nodes = [panel, title, sub, stats];
    nodes.push(...actionBtn(scene, cx, y + 280, 0xff6b4a, canTune && progress.coins >= tCost, canTune ? `Улучшить  ${formatCoins(tCost)}` : "Улучшение макс.", () => {
        const result = tuneModifier(mod.id);
        if (result.ok) options.onChange?.({ selectedId: mod.id });
    }));
    nodes.push(...actionBtn(scene, cx, y + 342, 0xfbbf24, canExtra && progress.coins >= eCost, canExtra ? `Добавить хар-ку  ${formatCoins(eCost)}` : "Макс характеристик", () => {
        const result = addModifierTrait(mod.id);
        if (result.ok) options.onChange?.({ selectedId: mod.id });
    }));
    nodes.push(...actionBtn(scene, cx, y + 404, 0x52525b, true, `Продать  +${formatCoins(refund)}`, () => {
        const result = sellModifier(mod.id);
        if (result.ok) options.onChange?.({ selectedId: null });
    }));

    return nodes;
}

function actionBtn(scene, x, y, color, enabled, label, onClick) {
    const fill = enabled ? color : 0x3f3f46;
    const box = scene.add.rectangle(x, y, 420, 50, fill, 1);
    const text = scene.add.text(x, y, label, {
        fontSize: "20px",
        fill: enabled ? "#111111" : "#888888",
        fontStyle: "bold",
    }).setOrigin(0.5);
    if (enabled) {
        box.setInteractive({ useHandCursor: true });
        box.on("pointerup", onClick);
    }
    return [box, text];
}
