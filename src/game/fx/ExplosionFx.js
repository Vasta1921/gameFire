/** Взрывы при гибели и фейерверк после волны. */
export class ExplosionFx {
    constructor(scene) {
        this.scene = scene;
        this.green = scene.add.particles(0, 0, "sparkGreen", {
            lifespan: { min: 280, max: 520 },
            speed: { min: 60, max: 220 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x22c55e, 0x86efac, 0xdcfce7],
            blendMode: "ADD",
            emitting: false,
            gravityY: 40,
        });
        this.green.setDepth(8);

        this.red = scene.add.particles(0, 0, "sparkRed", {
            lifespan: { min: 280, max: 520 },
            speed: { min: 60, max: 220 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff2200, 0xff6611, 0xffcc66],
            blendMode: "ADD",
            emitting: false,
            gravityY: 40,
        });
        this.red.setDepth(8);
        this.blue = scene.add.particles(0, 0, "sparkStar", {
            lifespan: { min: 320, max: 580 },
            speed: { min: 70, max: 240 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x2563eb, 0x60a5fa, 0xdbeafe],
            blendMode: "ADD",
            emitting: false,
            gravityY: 20,
        });
        this.blue.setDepth(8);

        this.blast = scene.add.particles(0, 0, "sparkRed", {
            lifespan: { min: 260, max: 480 },
            speed: { min: 90, max: 280 },
            scale: { start: 1.15, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff6b00, 0xfbbf24, 0xffedd5],
            blendMode: "ADD",
            emitting: false,
            gravityY: -30,
        });
        this.blast.setDepth(9);
    }

    burst(x, y, color = "red") {
        const emitter = color === "green"
            ? this.green
            : color === "blue"
                ? this.blue
                : this.red;
        emitter.emitParticleAt(x, y, color === "blue" ? 32 : 22);
    }

    boom(x, y) {
        this.blast.emitParticleAt(x, y, 26);
        const ring = this.scene.add.circle(x, y, 16, 0xfbbf24, 0.4);
        ring.setStrokeStyle(3, 0xff7a1a, 0.9);
        ring.setDepth(9);
        this.scene.tweens.add({
            targets: ring,
            scale: 4.2,
            alpha: 0,
            duration: 260,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
        });
    }

    fireworks() {
        const { width, height } = this.scene.cameras.main;
        const colors = ["red", "green", "blue"];
        for (let i = 0; i < 9; i += 1) {
            this.scene.time.delayedCall(i * 110, () => {
                const x = Phaser.Math.Between(70, width - 70);
                const y = Phaser.Math.Between(160, Math.floor(height * 0.48));
                this.burst(x, y, colors[i % 3]);
            });
        }
    }
}
