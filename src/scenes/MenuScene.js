import { createGameTextures } from "../game/utils/createGameTextures.js";
import { getSoundFx } from "../game/audio/SoundFx.js";
import { loadProgress, getUnlockedStartWave, waveBlockRange, getCombatStats, isSoundEnabled, setSoundEnabled, addCoins, resetProgress, careerStatRows, collectIdleIncome, isSniperUnlocked, SNIPER_UNLOCK_WAVES } from "../game/progress/Progress.js";
import { addFichcoinBadge } from "../game/ui/FichcoinBadge.js";
import { addShopPanel } from "../game/ui/upgradeRows.js";
import { addModifiersTab } from "../game/ui/ModifiersTab.js";
import { addModManageTab } from "../game/ui/ModManageTab.js";
import { addTowerStatsPanel, addInfoPanel } from "../game/ui/TowerStatsPanel.js";
import { addSettingsTab } from "../game/ui/SettingsTab.js";
import { addIdleTab } from "../game/ui/IdleTab.js";
import { MODIFIERS } from "../game/progress/Modifiers.js";

/** Стартовое меню: уровни, мастерская и модификаторы. */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        if (!this.textures.exists("background")) {
            createGameTextures(this);
        }
        this.sfx = getSoundFx(this.game);
        this.tab = "levels";
        this.tabs = [];
        this.modSelectedId = MODIFIERS[0].id;
        this.modSelectedSlot = null;
        this.modScreen = "loadout";
        this.shopGroup = "shoot";
        this.idlePayout = collectIdleIncome().coins;

        const { width, height } = this.cameras.main;
        this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height);

        this.menuTitle = this.add.text(width / 2, 120, "OVERLORD RISING", {
            fontSize: "48px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.menuSub = this.add.text(width / 2, 175, "Оборона космической крепости", {
            fontSize: "20px",
            fill: "#c4b5a5",
        }).setOrigin(0.5);

        this.coinBadge = addFichcoinBadge(this, width / 2 - 36, 220, loadProgress().coins, {
            scale: 0.58,
            fontSize: "28px",
        });

        this.makeTab(72, 280, "Уровни", "levels", 128);
        this.makeTab(216, 280, "Мастерская", "shop", 128);
        this.makeTab(360, 280, "Моды", "mods", 128);
        this.makeTab(504, 280, "Заработок", "idle", 128);
        this.makeTab(648, 280, "Настройки", "settings", 128);

        this.contentRoot = this.add.container(0, 0);
        this.highlightTabs();
        this.buildLevels();
    }

    makeTab(x, y, title, id, tabWidth = 220) {
        const bg = this.add.rectangle(x, y, tabWidth, 52, 0x2a1c18, 1);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerup", () => this.showTab(id));

        const label = this.add.text(x, y, title, {
            fontSize: tabWidth <= 128 ? (title.length > 6 ? "16px" : "18px") : (title.length > 10 ? "20px" : "24px"),
            fill: "#ffe8d6",
        }).setOrigin(0.5);

        this.tabs.push({ id, bg, label });
    }

    highlightTabs() {
        this.tabs.forEach((tab) => {
            const active = tab.id === this.tab;
            tab.bg.setFillStyle(active ? 0xff6b4a : 0x2a1c18, 1);
            tab.label.setTint(active ? 0x111111 : 0xffe8d6);
        });
    }

    refreshCoinLabel() {
        this.coinBadge.setAmount(loadProgress().coins);
    }

    setMenuChromeVisible(visible) {
        this.menuTitle.setVisible(visible);
        this.menuSub.setVisible(visible);
        this.coinBadge.setVisible(visible);
        this.tabs.forEach((tab) => {
            tab.bg.setVisible(visible);
            tab.label.setVisible(visible);
            if (tab.bg.input) tab.bg.input.enabled = visible;
        });
    }

    showTab(id) {
        this.tab = id;
        this.highlightTabs();
        this.setMenuChromeVisible(id !== "mods");
        this.contentRoot.removeAll(true);
        if (id === "shop") {
            this.buildShop();
        } else if (id === "mods") {
            if (this.modScreen === "manage") this.buildModManage();
            else this.buildMods();
        } else if (id === "idle") {
            this.modScreen = "loadout";
            this.idlePayout += collectIdleIncome().coins;
            this.buildIdle();
        } else if (id === "settings") {
            this.modScreen = "loadout";
            this.buildSettings();
        } else {
            this.modScreen = "loadout";
            this.buildLevels();
        }
    }

    buildLevels() {
        const { width } = this.cameras.main;
        const start = getUnlockedStartWave();
        const { end } = waveBlockRange(start);
        const title = start === 1 ? "1. Забор" : `Блок волн ${start}–${end}`;
        const subtitle = start === 1
            ? "10 волн · усиления · босс"
            : `Старт с волны ${start}, без усилений забега`;
        this.createLevelCard(width / 2, 400, title, subtitle, () => {
            this.sfx.unlock();
            collectIdleIncome();
            this.scene.start("ShootScene", { startWave: start });
        }, { height: 124 });
        const sniperOpen = isSniperUnlocked();
        this.createLevelCard(width / 2, 540, "2. Снайпер", sniperOpen
            ? "10 врагов · 10 пуль · награда с 7 попаданий"
            : `Откроется после ${SNIPER_UNLOCK_WAVES} волн`, () => {
            if (!isSniperUnlocked()) return;
            this.sfx.unlock();
            collectIdleIncome();
            this.scene.start("ShootScene", { mode: "sniper" });
        }, { height: 124, locked: !sniperOpen });
        const stats = addTowerStatsPanel(this, width / 2, 805, {
            stats: getCombatStats(),
            compact: true,
            cols: 2,
            width: 620,
        });
        this.contentRoot.add(stats.nodes);
        const career = addInfoPanel(this, width / 2, 1110, {
            title: "Статистика",
            rows: careerStatRows(),
            compact: true,
            cols: 2,
            width: 620,
        });
        this.contentRoot.add(career.nodes);
    }

    createLevelCard(x, y, title, subtitle, onPlay, options = {}) {
        const height = options.height ?? 160;
        const locked = Boolean(options.locked);
        const card = this.add.rectangle(x, y, 520, height, 0x161210, locked ? 0.72 : 0.92);
        card.setStrokeStyle(3, locked ? 0x5a4a44 : 0xff3300, locked ? 0.55 : 0.85);
        if (!locked) card.setInteractive({ useHandCursor: true });

        const t1 = this.add.text(x, y - height * 0.22, title, {
            fontSize: "32px",
            fill: locked ? "#8a7a72" : "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const t2 = this.add.text(x, y + 10, subtitle, {
            fontSize: "18px",
            fill: locked ? "#6b5b53" : "#a78a7a",
            align: "center",
            wordWrap: { width: 480 },
        }).setOrigin(0.5);

        const playY = y + height * 0.34;
        const playBg = this.add.rectangle(x, playY, 160, 40, locked ? 0x3f3f46 : 0xff6b4a, 1);
        const play = this.add.text(x, playY, locked ? "Закрыто" : "Играть", {
            fontSize: "22px",
            fill: locked ? "#a1a1aa" : "#111111",
        }).setOrigin(0.5);

        if (!locked) {
            const start = () => {
                this.sfx.unlock();
                onPlay();
            };
            card.on("pointerup", start);
            playBg.setInteractive({ useHandCursor: true });
            playBg.on("pointerup", start);
            card.on("pointerover", () => card.setStrokeStyle(3, 0xffcc66, 1));
            card.on("pointerout", () => card.setStrokeStyle(3, 0xff3300, 0.85));
        }

        this.contentRoot.add([card, t1, t2, playBg, play]);
    }

    buildIdle() {
        const nodes = addIdleTab(this, {
            collected: this.idlePayout,
            onChange: () => {
                this.sfx.unlock();
                this.refreshCoinLabel();
                this.time.delayedCall(0, () => this.showTab("idle"));
            },
        });
        this.contentRoot.add(nodes);
    }

    buildSettings() {
        const nodes = addSettingsTab(this, {
            soundEnabled: isSoundEnabled(),
            onToggleSound: () => {
                const next = !isSoundEnabled();
                setSoundEnabled(next);
                this.sfx.setEnabled(next);
                if (next) this.sfx.unlock();
                this.time.delayedCall(0, () => this.showTab("settings"));
            },
            onAddCoins: () => {
                addCoins(1000);
                this.refreshCoinLabel();
            },
            onOpenSniper: () => {
                this.sfx.unlock();
                collectIdleIncome();
                this.scene.start("ShootScene", { mode: "sniper", debugSniper: true });
            },
            onResetProgress: () => {
                resetProgress();
                this.sfx.setEnabled(isSoundEnabled());
                this.refreshCoinLabel();
                this.time.delayedCall(0, () => this.showTab("settings"));
            },
        });
        this.contentRoot.add(nodes);
    }

    buildShop() {
        const { width } = this.cameras.main;
        const nodes = addShopPanel(this, {
            x: width / 2,
            tabY: 348,
            listY: 430,
            groupId: this.shopGroup || "shoot",
            progress: loadProgress(),
            onBought: () => {
                this.sfx.unlock();
                this.refreshCoinLabel();
                this.showTab("shop");
            },
            onGroupChange: (id) => {
                this.shopGroup = id;
                this.sfx.unlock();
                this.showTab("shop");
            },
        });
        this.contentRoot.add(nodes);
    }

    buildMods() {
        const nodes = addModifiersTab(this, {
            selectedId: this.modSelectedId,
            selectedSlot: this.modSelectedSlot,
            onBack: () => {
                this.sfx.unlock();
                this.time.delayedCall(0, () => this.showTab("levels"));
            },
            onManage: () => {
                this.sfx.unlock();
                this.modScreen = "manage";
                this.time.delayedCall(0, () => this.showTab("mods"));
            },
            onSelect: (state) => {
                this.modSelectedId = state.selectedId;
                this.modSelectedSlot = state.selectedSlot ?? this.modSelectedSlot;
                this.sfx.unlock();
                this.showTab("mods");
            },
            onChange: (state) => {
                this.modSelectedId = state.selectedId;
                this.modSelectedSlot = state.selectedSlot ?? this.modSelectedSlot;
                this.sfx.unlock();
                this.refreshCoinLabel();
                this.showTab("mods");
            },
        });
        this.contentRoot.add(nodes);
    }

    buildModManage() {
        const nodes = addModManageTab(this, {
            selectedId: this.modSelectedId,
            onBack: () => {
                this.sfx.unlock();
                this.modScreen = "loadout";
                this.time.delayedCall(0, () => this.showTab("mods"));
            },
            onSelect: (state) => {
                this.modSelectedId = state.selectedId;
                this.sfx.unlock();
                this.showTab("mods");
            },
            onChange: (state) => {
                this.modSelectedId = state.selectedId;
                this.sfx.unlock();
                this.refreshCoinLabel();
                this.showTab("mods");
            },
        });
        this.contentRoot.add(nodes);
    }
}
