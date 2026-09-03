/** Взрывы при гибели: зелёные / красные частицы. */
export class ExplosionFx {
    constructor(scene) {
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
    }

    burst(x, y, color = "red") {
        const emitter = color === "green" ? this.green : this.red;
        emitter.emitParticleAt(x, y, 22);
    }
}
