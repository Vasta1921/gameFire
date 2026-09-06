/** Разовый попап про нового врага. */
export class EnemyIntroOverlay {
    constructor(scene, options) {
        this.scene = scene;
        this.type = options.type;
        this.onClose = options.onClose;
        this.closed = false;
        this.armed = false;

        this.root = scene.add.container(0, 0);
        this.root.setDepth(32);

        const { width, height } = scene.cameras.main;
        const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x050508, 0.78);
        dim.setInteractive();
        this.root.add(dim);

        const card = scene.add.rectangle(width / 2, height / 2 - 20, 600, 620, 0x161210, 0.96);
        card.setStrokeStyle(3, 0xfbbf24, 0.95);

        const kicker = scene.add.text(width / 2, height / 2 - 280, "Новый боец", {
            fontSize: "26px",
            fill: "#fbbf24",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const portrait = scene.add.image(width / 2, height / 2 - 140, this.type.key);
        portrait.setDisplaySize(this.type.id === "dart" ? 72 : 110, this.type.id === "dart" ? 150 : 110);

        const title = scene.add.text(width / 2, height / 2 - 20, this.type.title, {
            fontSize: "36px",
            fill: "#ffe8d6",
            fontStyle: "bold",
            align: "center",
            wordWrap: { width: 520 },
        }).setOrigin(0.5);

        const wave = scene.add.text(width / 2, height / 2 + 28, `С волны ${this.type.unlockWave}`, {
            fontSize: "20px",
            fill: "#a78a7a",
        }).setOrigin(0.5);

        const blurb = scene.add.text(width / 2, height / 2 + 78, this.type.blurb, {
            fontSize: "22px",
            fill: "#c4b5a5",
            align: "center",
            wordWrap: { width: 520 },
        }).setOrigin(0.5);

        const trait = scene.add.text(width / 2, height / 2 + 150, this.type.trait, {
            fontSize: "22px",
            fill: "#86efac",
            align: "center",
            wordWrap: { width: 520 },
        }).setOrigin(0.5);

        const btn = scene.add.rectangle(width / 2, height / 2 + 240, 280, 64, 0xff6b4a, 1);
        const btnText = scene.add.text(width / 2, height / 2 + 240, "Понятно", {
            fontSize: "28px",
            fill: "#111111",
            fontStyle: "bold",
        }).setOrigin(0.5);
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerup", () => this.close());

        this.root.add([card, kicker, portrait, title, wave, blurb, trait, btn, btnText]);

        scene.time.delayedCall(280, () => {
            this.armed = true;
        });
    }

    close() {
        if (this.closed || !this.armed) return;
        this.closed = true;
        this.root.destroy(true);
        this.onClose();
    }
}
