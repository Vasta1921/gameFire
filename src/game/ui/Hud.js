import { loadProgress } from "../progress/Progress.js";
import { STAT_SCALE } from "../progress/scaling.js";
import { addFichcoinBadge } from "./FichcoinBadge.js";

/** Экранный интерфейс: счёт, фичкоины, волна, здоровье базы. */
export class Hud {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.onPause = options.onPause ?? (() => {});
        this.score = 0;
        this.coins = loadProgress().coins;
        this.wave = 1;
        this.pauseItems = null;

        this.scoreText = scene.add.text(16, 16, "Score: 0", {
            fontSize: "32px",
            fill: "#fff",
        });
        this.scoreText.setDepth(10);

        this.coinBadge = addFichcoinBadge(scene, 16, 58, this.coins, {
            scale: 0.5,
            fontSize: "26px",
        });

        this.waveText = scene.add.text(16, 96, "Волна 1  (1–10)", {
            fontSize: "24px",
            fill: "#93c5fd",
        });
        this.waveText.setDepth(10);

        this.baseText = scene.add.text(16, 128, "База: 15/15", {
            fontSize: "26px",
            fill: "#ffb4a8",
        });
        this.baseText.setDepth(10);

        const { width } = scene.cameras.main;
        this.pauseBtn = scene.add.text(width - 16, 16, "Пауза", {
            fontSize: "26px",
            fill: "#ffe8d6",
            backgroundColor: "#2a1c18",
            padding: { x: 16, y: 8 },
        });
        this.pauseBtn.setOrigin(1, 0);
        this.pauseBtn.setDepth(40);
        this.pauseBtn.setInteractive({ useHandCursor: true });
        this.pauseBtn.on("pointerdown", (pointer, _x, _y, event) => {
            event?.stopPropagation?.();
            pointer.event?.stopPropagation?.();
        });
        this.pauseBtn.on("pointerup", (pointer, _x, _y, event) => {
            event?.stopPropagation?.();
            this.onPause();
        });
    }

    setPauseVisible(visible) {
        this.pauseBtn.setVisible(visible);
    }

    announceWaveClear(wave) {
        const { width, height } = this.scene.cameras.main;
        const label = this.scene.add.text(width / 2, height * 0.38, `Волна ${wave} пройдена!`, {
            fontSize: "48px",
            fill: "#fbbf24",
            fontStyle: "bold",
            stroke: "#111111",
            strokeThickness: 8,
            align: "center",
        });
        label.setOrigin(0.5);
        label.setDepth(25);
        label.setScale(0.6);
        label.setAlpha(0);

        this.scene.tweens.add({
            targets: label,
            alpha: 1,
            scale: 1,
            duration: 280,
            ease: "Back.easeOut",
        });
        this.scene.tweens.add({
            targets: label,
            alpha: 0,
            y: height * 0.32,
            delay: 1100,
            duration: 420,
            onComplete: () => label.destroy(),
        });
    }

    flyCoins(x, y, amount) {
        const n = Math.max(1, Math.min(6, Math.floor(amount)));
        for (let i = 0; i < n; i += 1) {
            const coin = this.scene.add.image(x, y, "fichcoin");
            coin.setScale(0.22);
            coin.setDepth(14);
            const dx = Phaser.Math.Between(-34, 34);
            const dy = Phaser.Math.Between(-70, -36);
            this.scene.tweens.add({
                targets: coin,
                x: x + dx,
                y: y + dy,
                alpha: 0,
                scale: 0.12,
                duration: 480 + i * 40,
                ease: "Cubic.easeOut",
                onComplete: () => coin.destroy(),
            });
        }
    }

    showPause(onResume, onMenu) {
        if (this.pauseItems) return;
        this.pauseBtn.disableInteractive();
        this.setPauseVisible(false);
        this.scene.input.setTopOnly(true);

        const { width, height } = this.scene.cameras.main;
        const dim = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58);
        dim.setDepth(50);
        dim.setInteractive();

        const title = this.scene.add.text(width / 2, height / 2 - 120, "Пауза", {
            fontSize: "48px",
            fill: "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(51);

        const resumeBox = this.scene.add.rectangle(width / 2, height / 2 + 10, 360, 72, 0xff6b4a, 1);
        resumeBox.setDepth(52);
        resumeBox.setInteractive({ useHandCursor: true });
        const resumeText = this.scene.add.text(width / 2, height / 2 + 10, "Продолжить", {
            fontSize: "32px",
            fill: "#111111",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(53);

        const menuBox = this.scene.add.rectangle(width / 2, height / 2 + 110, 360, 72, 0x52525b, 1);
        menuBox.setDepth(52);
        menuBox.setInteractive({ useHandCursor: true });
        const menuText = this.scene.add.text(width / 2, height / 2 + 110, "В меню", {
            fontSize: "32px",
            fill: "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(53);

        const runLater = (fn) => {
            this.scene.time.delayedCall(0, fn);
        };

        resumeBox.on("pointerdown", (_pointer, _x, _y, event) => {
            event?.stopPropagation?.();
            runLater(onResume);
        });
        menuBox.on("pointerdown", (_pointer, _x, _y, event) => {
            event?.stopPropagation?.();
            runLater(onMenu);
        });

        this.pauseItems = [dim, title, resumeBox, resumeText, menuBox, menuText];
    }

    hidePause() {
        if (this.pauseItems) {
            this.pauseItems.forEach((item) => item.destroy());
            this.pauseItems = null;
        }
        this.pauseBtn.setInteractive({ useHandCursor: true });
        this.setPauseVisible(true);
    }

    addScore(value) {
        this.score += value;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    setCoins(total) {
        this.coins = total;
        this.coinBadge.setAmount(total);
    }

    setWave(wave) {
        this.wave = wave;
        const end = Math.ceil(wave / 10) * 10;
        const start = end - 9;
        this.waveText.setText(`Волна ${wave}  (${start}–${end})`);
    }

    popup(x, y, text, color = "#fbbf24") {
        const label = this.scene.add.text(x, y, text, {
            fontSize: "22px",
            fill: color,
            fontStyle: "bold",
        });
        label.setOrigin(0.5);
        label.setDepth(12);
        this.scene.tweens.add({
            targets: label,
            y: y - 40,
            alpha: 0,
            duration: 700,
            onComplete: () => label.destroy(),
        });
    }

    setBaseHp(hp, maxHp) {
        this.baseText.setText(`База: ${hp}/${maxHp}`);
        this.baseText.setColor(hp <= 5 * STAT_SCALE ? "#ff6b6b" : "#ffb4a8");
    }

    showGameOver(onPlayAgain, onMenu, run = {}) {
        const { width, height } = this.scene.cameras.main;

        const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
        overlay.setDepth(20);
        overlay.setInteractive();

        const title = this.scene.add.text(width / 2, 280, "База уничтожена", {
            fontSize: "48px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        });
        title.setOrigin(0.5);
        title.setDepth(21);

        const lines = [
            `Счёт: ${this.score}`,
            `Убито: ${run.kills ?? 0}`,
            `Боссов: ${run.bosses ?? 0}`,
            `Монет за забег: ${run.coins ?? 0}`,
            `Волн пройдено: ${run.wavesCleared ?? 0}`,
            `Выстрелов: ${run.shots ?? 0}`,
            `Волна: ${this.wave}`,
        ];
        const stats = this.scene.add.text(width / 2, 520, lines.join("\n"), {
            fontSize: "28px",
            fill: "#ffe8d6",
            align: "center",
            lineSpacing: 8,
        });
        stats.setOrigin(0.5);
        stats.setDepth(21);

        const button = this.scene.add.rectangle(width / 2, 900, 400, 72, 0xff6b4a, 1);
        button.setDepth(22);
        button.setInteractive({ useHandCursor: true });
        this.scene.add.text(width / 2, 900, "Сыграть снова", {
            fontSize: "32px",
            fill: "#111111",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(23);
        button.on("pointerdown", () => {
            this.scene.time.delayedCall(0, onPlayAgain);
        });

        if (onMenu) {
            const menuBtn = this.scene.add.rectangle(width / 2, 990, 400, 64, 0x52525b, 1);
            menuBtn.setDepth(22);
            menuBtn.setInteractive({ useHandCursor: true });
            this.scene.add.text(width / 2, 990, "В меню", {
                fontSize: "28px",
                fill: "#ffe8d6",
                fontStyle: "bold",
            }).setOrigin(0.5).setDepth(23);
            menuBtn.on("pointerdown", () => {
                this.scene.time.delayedCall(0, onMenu);
            });
        }
    }
}
