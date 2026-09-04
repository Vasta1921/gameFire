/** Три карточки усиления после волны. */
export class WavePickOverlay {
    constructor(scene, options) {
        this.scene = scene;
        this.picks = options.picks;
        this.onPick = options.onPick;
        this.clearedWave = options.clearedWave ?? 1;
        this.closed = false;
        this.armed = false;

        this.root = scene.add.container(0, 0);
        this.root.setDepth(30);

        const { width, height } = scene.cameras.main;
        const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x050508, 0.72);
        dim.setInteractive();
        this.root.add(dim);

        const title = scene.add.text(width / 2, 180, "Выбери усиление", {
            fontSize: "36px",
            fill: "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const sub = scene.add.text(width / 2, 230, "Одно на выбор", {
            fontSize: "22px",
            fill: "#c4b5a5",
        }).setOrigin(0.5);

        this.root.add([title, sub]);

        this.picks.forEach((pick, index) => {
            this.root.add(this.makeCard(width / 2, 360 + index * 170, pick));
        });

        this.armAfterRelease();
    }

    armAfterRelease() {
        const arm = () => {
            this.scene.time.delayedCall(280, () => {
                this.armed = true;
            });
        };
        this.scene.time.delayedCall(350, () => {
            if (this.scene.input.activePointer.isDown) {
                this.scene.input.once("pointerup", arm);
            } else {
                arm();
            }
        });
    }

    makeCard(x, y, pick) {
        const box = this.scene.add.rectangle(x, y, 560, 148, 0x161210, 0.96);
        box.setStrokeStyle(3, 0xff3300, 0.9);
        box.setInteractive({ useHandCursor: true });

        const title = this.scene.add.text(x, y - 28, pick.title, {
            fontSize: "30px",
            fill: "#ffe8d6",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const hint = this.scene.add.text(x, y + 22, pick.hint, {
            fontSize: "22px",
            fill: "#a78a7a",
        }).setOrigin(0.5);

        const choose = () => this.select(pick);
        box.on("pointerup", choose);
        box.on("pointerover", () => box.setStrokeStyle(3, 0xfbbf24, 1));
        box.on("pointerout", () => box.setStrokeStyle(3, 0xff3300, 0.9));

        return [box, title, hint];
    }

    select(pick) {
        if (this.closed || !this.armed) return;
        this.closed = true;
        this.root.destroy(true);
        this.onPick(pick);
    }
}
