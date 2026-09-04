import { createGameTextures } from "../game/utils/createGameTextures.js";
import { getSoundFx } from "../game/audio/SoundFx.js";
import { loadProgress } from "../game/progress/Progress.js";
import { addFichcoinBadge } from "../game/ui/FichcoinBadge.js";
import { addUpgradeRows } from "../game/ui/upgradeRows.js";

/** Стартовое меню: уровни и мастерская. */
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

        const { width, height } = this.cameras.main;
        this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height);

        this.add.text(width / 2, 120, "OVERLORD RISING", {
            fontSize: "48px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.add.text(width / 2, 175, "Оборона космической крепости", {
            fontSize: "20px",
            fill: "#c4b5a5",
        }).setOrigin(0.5);

        this.coinBadge = addFichcoinBadge(this, width / 2 - 36, 220, loadProgress().coins, {
            scale: 0.58,
            fontSize: "28px",
        });

        this.makeTab(width / 2 - 130, 280, "Уровни", "levels");
        this.makeTab(width / 2 + 130, 280, "Мастерская", "shop");

        this.contentRoot = this.add.container(0, 0);
        this.highlightTabs();
        this.buildLevels();
    }

    makeTab(x, y, title, id) {
        const bg = this.add.rectangle(x, y, 220, 52, 0x2a1c18, 1);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerup", () => this.showTab(id));

        const label = this.add.text(x, y, title, {
            fontSize: "28px",
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

    showTab(id) {
        this.tab = id;
        this.highlightTabs();
        this.contentRoot.removeAll(true);
        if (id === "shop") {
            this.buildShop();
        } else {
            this.buildLevels();
        }
    }

    buildLevels() {
        const { width } = this.cameras.main;
        this.createLevelCard(width / 2, 520, "1. Забор", "10 волн · усиления · босс", () => {
            this.sfx.unlock();
            this.scene.start("ShootScene");
        });
    }

    createLevelCard(x, y, title, subtitle, onPlay) {
        const card = this.add.rectangle(x, y, 520, 160, 0x161210, 0.92);
        card.setStrokeStyle(3, 0xff3300, 0.85);
        card.setInteractive({ useHandCursor: true });

        const t1 = this.add.text(x, y - 28, title, {
            fontSize: "36px",
            fill: "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const t2 = this.add.text(x, y + 18, subtitle, {
            fontSize: "20px",
            fill: "#a78a7a",
        }).setOrigin(0.5);

        const playBg = this.add.rectangle(x, y + 58, 160, 44, 0xff6b4a, 1);
        const play = this.add.text(x, y + 58, "Играть", {
            fontSize: "24px",
            fill: "#111111",
        }).setOrigin(0.5);

        const start = () => {
            this.sfx.unlock();
            onPlay();
        };
        card.on("pointerup", start);
        playBg.setInteractive({ useHandCursor: true });
        playBg.on("pointerup", start);
        card.on("pointerover", () => card.setStrokeStyle(3, 0xffcc66, 1));
        card.on("pointerout", () => card.setStrokeStyle(3, 0xff3300, 0.85));

        this.contentRoot.add([card, t1, t2, playBg, play]);
    }

    buildShop() {
        const { width } = this.cameras.main;
        const nodes = addUpgradeRows(this, width / 2, 360, loadProgress(), () => {
            this.sfx.unlock();
            this.refreshCoinLabel();
            this.showTab("shop");
        });
        this.contentRoot.add(nodes);
    }
}
