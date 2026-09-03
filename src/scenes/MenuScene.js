import { createGameTextures } from "../game/utils/createGameTextures.js";
import { getSoundFx } from "../game/audio/SoundFx.js";

/** Стартовое меню: выбор уровня и запуск боя. */
export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        createGameTextures(this);
        this.sfx = getSoundFx(this.game);

        const { width, height } = this.cameras.main;
        this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height);

        this.add.text(width / 2, 180, "OVERLORD RISING", {
            fontSize: "52px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.add.text(width / 2, 250, "Оборона космической крепости", {
            fontSize: "22px",
            fill: "#c4b5a5",
        }).setOrigin(0.5);

        this.add.text(width / 2, 430, "Уровни", {
            fontSize: "28px",
            fill: "#ffffff",
        }).setOrigin(0.5);

        this.createLevelCard(width / 2, 560, "1. Забор", "Удерживай линию обороны", () => {
            this.sfx.unlock();
            this.scene.start("ShootScene");
        });
    }

    createLevelCard(x, y, title, subtitle, onPlay) {
        const card = this.add.rectangle(x, y, 520, 160, 0x161210, 0.92);
        card.setStrokeStyle(3, 0xff3300, 0.85);
        card.setInteractive({ useHandCursor: true });

        this.add.text(x, y - 28, title, {
            fontSize: "36px",
            fill: "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.add.text(x, y + 18, subtitle, {
            fontSize: "20px",
            fill: "#a78a7a",
        }).setOrigin(0.5);

        const play = this.add.text(x, y + 58, "Играть", {
            fontSize: "24px",
            fill: "#111111",
            backgroundColor: "#ff6b4a",
            padding: { x: 22, y: 8 },
        }).setOrigin(0.5);

        const start = () => {
            this.sfx.unlock();
            onPlay();
        };
        card.on("pointerup", start);
        play.setInteractive({ useHandCursor: true });
        play.on("pointerup", start);
        card.on("pointerover", () => card.setStrokeStyle(3, 0xffcc66, 1));
        card.on("pointerout", () => card.setStrokeStyle(3, 0xff3300, 0.85));
    }
}
