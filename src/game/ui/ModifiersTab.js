import { addFichcoinBadge } from "./FichcoinBadge.js";
import { addTowerStatsPanel } from "./TowerStatsPanel.js";
import {
    buyModifier,
    equipModifier,
    formatCoins,
    getCombatStats,
    loadProgress,
    unequipModifier,
} from "../progress/Progress.js";
import { combatStatRows } from "../progress/combatFormat.js";
import {
    MODIFIERS,
    MOD_SLOT_COUNT,
    RARITY,
    RARITY_META,
    firstFreeSlot,
    getModifier,
    modifiersOf,
    previewEquippedLoadout,
    slotRarity,
    snapshotModifierBase,
} from "../progress/Modifiers.js";

const SLOT_LAYOUT = [
    { x: 0, y: 0 },
    { x: -80, y: 78 },
    { x: 80, y: 78 },
    { x: -108, y: 156 },
    { x: 0, y: 156 },
    { x: 108, y: 156 },
];

/** Вкладка меню: башня, слоты по редкости и каталог. */
export function addModifiersTab(scene, options = {}) {
    const { width } = scene.cameras.main;
    const cx = width / 2;
    const progress = loadProgress();
    const selectedId = options.selectedId ?? MODIFIERS[0].id;
    const selectedSlot = options.selectedSlot ?? null;
    const nodes = [];

    const add = (...items) => {
        nodes.push(...items);
        return items;
    };

    add(...makeTopBar(scene, options));

    const originX = 190;
    const originY = 128;
    for (let i = 0; i < MOD_SLOT_COUNT; i += 1) {
        const pos = SLOT_LAYOUT[i];
        add(...makeSlot(
            scene,
            originX + pos.x,
            originY + pos.y,
            i,
            progress.equippedMods[i],
            selectedId,
            selectedSlot,
            options
        ));
    }

    const currentStats = getCombatStats();
    const previewId = selectedId;
    const previewing = previewId && !progress.equippedMods.includes(previewId);
    const previewMod = previewing ? getModifier(previewId) : null;
    const previewStats = previewMod
        ? getCombatStats({
            equippedMods: previewEquippedLoadout(progress.equippedMods, previewId, selectedSlot),
            modRolls: {
                ...(progress.modRolls || {}),
                [previewId]: progress.modRolls?.[previewId] ?? snapshotModifierBase(previewMod),
            },
        })
        : currentStats;
    const stats = addTowerStatsPanel(scene, 545, 230, {
        compact: true,
        width: 300,
        cols: 1,
        stats: previewStats,
        rows: combatStatRows(previewStats, previewing ? currentStats : null),
    });
    add(...stats.nodes);

    const statsBottom = 230 + stats.height / 2;
    const slotsBottom = originY + 156 + 40;
    const catalogY = Math.max(statsBottom, slotsBottom) + 58;
    add(...makeCatalog(scene, cx, catalogY, selectedId, progress, options));
    add(...makeDetail(scene, cx, catalogY + 310, selectedId, selectedSlot, progress, options));

    return nodes;
}

function makeTopBar(scene, options) {
    const hit = scene.add.rectangle(56, 48, 88, 64, 0x161210, 0.01);
    hit.setInteractive({ useHandCursor: true });
    const arrow = scene.add.text(56, 48, "←", {
        fontSize: "48px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5);
    hit.on("pointerup", () => options.onBack?.());

    const extras = [];
    if (options.onManage) {
        const mx = scene.cameras.main.width / 2;
        const box = scene.add.rectangle(mx, 48, 200, 44, 0x2a1c18, 1);
        box.setInteractive({ useHandCursor: true });
        const label = scene.add.text(mx, 48, "Управление", {
            fontSize: "20px",
            fill: "#ffe8d6",
        }).setOrigin(0.5);
        box.on("pointerup", () => options.onManage());
        extras.push(box, label);
    }

    const coins = addFichcoinBadge(scene, scene.cameras.main.width - 160, 48, loadProgress().coins, {
        scale: 0.5,
        fontSize: "26px",
        depth: 12,
    });

    return [hit, arrow, ...extras, coins.icon, coins.text];
}

function makeSlot(scene, x, y, index, equippedId, selectedId, selectedSlot, options) {
    const rarity = slotRarity(index);
    const meta = RARITY_META[rarity];
    const mod = equippedId ? getModifier(equippedId) : null;
    const chosen = selectedSlot === index;
    const box = scene.add.rectangle(x, y, 72, 72, 0x161210, 0.94);
    box.setStrokeStyle(3, chosen ? 0xffe08a : meta.color, 1);
    box.setInteractive({ useHandCursor: true });

    const nodes = [box];
    if (mod) {
        const gem = scene.add.rectangle(x, y - 6, 28, 28, mod.color, 1);
        nodes.push(gem);
    } else {
        const plus = scene.add.text(x, y - 6, "+", {
            fontSize: "28px",
            fill: meta.fill,
        }).setOrigin(0.5);
        nodes.push(plus);
    }

    const mark = scene.add.text(x, y + 24, rarityMark(rarity), {
        fontSize: "13px",
        fill: meta.fill,
    }).setOrigin(0.5);
    nodes.push(mark);

    box.on("pointerup", () => {
        if (equippedId) {
            unequipModifier(index);
            options.onChange?.({ selectedId, selectedSlot: index });
            return;
        }
        const selected = selectedId ? getModifier(selectedId) : null;
        const owned = selectedId && loadProgress().ownedMods.includes(selectedId);
        if (selected && owned && selected.rarity === rarity) {
            equipModifier(selectedId, index);
            options.onChange?.({ selectedId, selectedSlot: index });
            return;
        }
        options.onSelect?.({ selectedId, selectedSlot: index });
    });

    return nodes;
}

function rarityMark(rarity) {
    if (rarity === RARITY.legendary) return "особ.";
    if (rarity === RARITY.rare) return "редк.";
    return "обыч.";
}

function makeDetail(scene, cx, y, selectedId, selectedSlot, progress, options) {
    const mod = getModifier(selectedId);
    const panel = scene.add.rectangle(cx, y + 118, 660, 292, 0x161210, 0.94);
    panel.setStrokeStyle(2, mod ? RARITY_META[mod.rarity].color : 0xff3300, 0.9);

    if (!mod) {
        const empty = scene.add.text(cx, y + 118, "Выберите модуль внизу", {
            fontSize: "22px",
            fill: "#a78a7a",
        }).setOrigin(0.5);
        return [panel, empty];
    }

    const owned = progress.ownedMods.includes(mod.id);
    const equipped = progress.equippedMods.includes(mod.id);
    const rarity = RARITY_META[mod.rarity];

    const title = scene.add.text(cx, y - 8, mod.title, {
        fontSize: "30px",
        fill: "#ffe8d6",
        fontStyle: "bold",
    }).setOrigin(0.5);

    const classLabel = scene.add.text(cx, y + 24, rarity.title, {
        fontSize: "18px",
        fill: rarity.fill,
    }).setOrigin(0.5);

    const hint = scene.add.text(cx, y + 64, mod.hint, {
        fontSize: "22px",
        fill: "#c4b5a5",
        align: "center",
        wordWrap: { width: 600 },
    }).setOrigin(0.5);

    const nodes = [panel, title, classLabel, hint];
    nodes.push(...makeActionButton(scene, cx, y + 200, mod, owned, equipped, selectedSlot, progress, options));
    return nodes;
}

function makeActionButton(scene, cx, y, mod, owned, equipped, selectedSlot, progress, options) {
    let label;
    let color = 0x3f3f46;
    let canClick = false;
    let action = null;
    const meta = RARITY_META[mod.rarity];

    if (equipped) {
        label = "Снять";
        color = 0x52525b;
        canClick = true;
        action = () => {
            unequipModifier(mod.id);
            options.onChange?.({ selectedId: mod.id, selectedSlot });
        };
    } else if (owned) {
        const free = firstFreeSlot(progress.equippedMods, mod.rarity, selectedSlot);
        label = free < 0 ? `Нет слота (${meta.title.toLowerCase()})` : "Надеть";
        color = free < 0 ? 0x3f3f46 : 0xff6b4a;
        canClick = free >= 0;
        action = () => {
            equipModifier(mod.id, selectedSlot);
            options.onChange?.({ selectedId: mod.id, selectedSlot });
        };
    } else if (progress.coins >= mod.cost) {
        label = `Купить  ${formatCoins(mod.cost)}`;
        color = 0xfbbf24;
        canClick = true;
        action = () => {
            const result = buyModifier(mod.id);
            if (result.ok) options.onChange?.({ selectedId: mod.id, selectedSlot });
        };
    } else {
        label = `Купить  ${formatCoins(mod.cost)}`;
        color = 0x3f3f46;
    }

    const btn = scene.add.rectangle(cx, y, 380, 48, color, 1);
    const text = scene.add.text(cx, y, label, {
        fontSize: "20px",
        fill: canClick ? "#111111" : "#888888",
        fontStyle: "bold",
    }).setOrigin(0.5);

    if (canClick) {
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerup", action);
    }

    return [btn, text];
}

function makeCatalog(scene, cx, y, selectedId, progress, options) {
    const nodes = [];
    const rows = [RARITY.legendary, RARITY.rare, RARITY.common];
    rows.forEach((rarity, row) => {
        const rowY = y + row * 108;
        const meta = RARITY_META[rarity];
        const list = modifiersOf(rarity);
        nodes.push(scene.add.text(cx, rowY - 50, meta.title, {
            fontSize: "16px",
            fill: meta.fill,
        }).setOrigin(0.5));

        const gap = 140;
        const startX = cx - ((list.length - 1) * gap) / 2;
        list.forEach((mod, i) => {
            const x = startX + i * gap;
            nodes.push(...makeCatalogCard(scene, x, rowY, mod, selectedId, progress, options));
        });
    });
    return nodes;
}

function makeCatalogCard(scene, x, y, mod, selectedId, progress, options) {
    const owned = progress.ownedMods.includes(mod.id);
    const equipped = progress.equippedMods.includes(mod.id);
    const selected = selectedId === mod.id;
    const rarity = RARITY_META[mod.rarity];

    const box = scene.add.rectangle(x, y, 128, 96, 0x161210, 0.95);
    box.setStrokeStyle(3, selected ? 0xffe08a : rarity.color, selected ? 1 : 0.75);
    box.setInteractive({ useHandCursor: true });

    const gem = scene.add.rectangle(x, y - 28, 18, 18, mod.color, owned ? 1 : 0.35);
    const name = scene.add.text(x, y - 10, mod.title, {
        fontSize: "15px",
        fill: "#ffe8d6",
        align: "center",
        wordWrap: { width: 114 },
    }).setOrigin(0.5, 0);
    const caption = scene.add.text(x, y + 30, equipped ? "надет" : (owned ? "куплен" : "—"), {
        fontSize: "14px",
        fill: equipped ? "#fbbf24" : "#a78a7a",
    }).setOrigin(0.5, 0);

    box.on("pointerup", () => {
        options.onSelect?.({ selectedId: mod.id, selectedSlot: options.selectedSlot ?? null });
    });

    return [box, gem, name, caption];
}
