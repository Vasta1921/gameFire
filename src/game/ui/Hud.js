export class Hud {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;

        this.scoreText = scene.add.text(16, 16, "Score: 0", {
            fontSize: "32px",
            fill: "#fff",
        });
        this.scoreText.setDepth(10);
    }

    addScore(value) {
        this.score += value;
        this.scoreText.setText(`Score: ${this.score}`);
    }
}

