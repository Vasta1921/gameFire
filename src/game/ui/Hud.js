/** Экранный интерфейс: счёт, здоровье базы, экран поражения. */
export class Hud {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;

        this.scoreText = scene.add.text(16, 16, "Score: 0", {
            fontSize: "32px",
            fill: "#fff",
        });
        this.scoreText.setDepth(10);

        this.baseText = scene.add.text(16, 56, "База: 15/15", {
            fontSize: "28px",
            fill: "#ffb4a8",
        });
        this.baseText.setDepth(10);
    }

    addScore(value) {
        this.score += value;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    setBaseHp(hp, maxHp) {
        this.baseText.setText(`База: ${hp}/${maxHp}`);
        this.baseText.setColor(hp <= 5 ? "#ff6b6b" : "#ffb4a8");
    }

    showGameOver(onPlayAgain) {
        const { width, height } = this.scene.cameras.main;

        const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
        overlay.setDepth(20);
        overlay.setInteractive();
        overlay.on("pointerup", onPlayAgain);

        const title = this.scene.add.text(width / 2, height / 2 - 80, "База уничтожена", {
            fontSize: "48px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        });
        title.setOrigin(0.5);
        title.setDepth(21);

        const scoreLine = this.scene.add.text(width / 2, height / 2 - 20, `Счёт: ${this.score}`, {
            fontSize: "32px",
            fill: "#ffffff",
        });
        scoreLine.setOrigin(0.5);
        scoreLine.setDepth(21);

        const button = this.scene.add.text(width / 2, height / 2 + 70, "Сыграть снова", {
            fontSize: "36px",
            fill: "#111111",
            backgroundColor: "#ff6b4a",
            padding: { x: 28, y: 14 },
        });
        button.setOrigin(0.5);
        button.setDepth(21);
        button.setInteractive({ useHandCursor: true });
        button.on("pointerup", onPlayAgain);
        button.on("pointerover", () => button.setStyle({ backgroundColor: "#ff8a6a" }));
        button.on("pointerout", () => button.setStyle({ backgroundColor: "#ff6b4a" }));
    }
}
