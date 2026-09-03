/** Декор сцены: медленный дрейф неба, редкие звёзды, метеоры и чёрная дыра. */
export class SpaceBackdrop {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.cameras.main;

        this.bg = scene.add.image(width / 2, height / 2, "background");
        this.bg.setDisplaySize(width, height);
        this.bg.setDepth(-5);

        this.blackHole = scene.add.image(560, 250, "blackHole");
        this.blackHole.setDisplaySize(78, 78);
        this.blackHole.setDepth(-4);
        this.blackHole.setAlpha(0.92);

        scene.tweens.add({
            targets: this.blackHole,
            scale: { from: 0.58, to: 0.66 },
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.stars = scene.add.particles(0, 0, "sparkStar", {
            lifespan: { min: 900, max: 1800 },
            speed: { min: 140, max: 460 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.45, end: 0.05 },
            alpha: { start: 1, end: 0 },
            tint: [0xffffff, 0xdbeafe, 0xfef08a],
            blendMode: "ADD",
            emitting: false,
        });
        this.stars.setDepth(-3);

        this.meteorTrail = scene.add.particles(0, 0, "sparkRed", {
            lifespan: 320,
            speed: { min: 10, max: 40 },
            scale: { start: 0.35, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0xff7a22, 0xffcc66, 0xffffff],
            blendMode: "ADD",
            emitting: false,
        });
        this.meteorTrail.setDepth(-3);

        this.starTimer = scene.time.addEvent({
            delay: 1800,
            loop: true,
            callback: this.spawnShootingStar,
            callbackScope: this,
        });

        this.scheduleMeteor();
    }

    /** Случайный пролёт по небу, не врезаясь в зону базы внизу. */
    randomSkyPath() {
        const { width, height } = this.scene.cameras.main;
        const skyLimit = height * 0.7;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(width, height) * 0.85;
        const cx = Phaser.Math.Between(40, width - 40);
        const cy = Phaser.Math.Between(50, skyLimit - 40);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        let startX = cx - dx * dist * 0.45;
        let startY = cy - dy * dist * 0.45;
        let endX = cx + dx * dist * 0.55;
        let endY = cy + dy * dist * 0.55;

        if (startY > skyLimit) startY = skyLimit;
        if (endY > skyLimit) {
            const span = endY - startY;
            if (Math.abs(span) > 1) {
                const t = (skyLimit - startY) / span;
                if (t > 0 && t < 1) {
                    endX = startX + (endX - startX) * t;
                    endY = skyLimit;
                } else {
                    endY = skyLimit;
                }
            } else {
                endY = skyLimit;
            }
        }

        return { startX, startY, endX, endY, angle };
    }

    spawnShootingStar() {
        const path = this.randomSkyPath();
        this.stars.particleAngle = Phaser.Math.RadToDeg(path.angle);
        this.stars.emitParticleAt(path.startX, path.startY, Math.random() < 0.3 ? 2 : 1);
        this.starTimer.delay = Phaser.Math.Between(1100, 3200);
    }

    scheduleMeteor() {
        this.scene.time.delayedCall(Phaser.Math.Between(5000, 12000), () => {
            this.spawnMeteor();
            this.scheduleMeteor();
        });
    }

    spawnMeteor() {
        const path = this.randomSkyPath();
        const meteor = this.scene.add.image(path.startX, path.startY, "meteor");
        meteor.setDepth(-2);
        meteor.setDisplaySize(36, 14);
        meteor.setRotation(path.angle);

        this.scene.tweens.add({
            targets: meteor,
            x: path.endX,
            y: path.endY,
            duration: Phaser.Math.Between(1800, 3200),
            ease: "Linear",
            onUpdate: () => {
                this.meteorTrail.emitParticleAt(meteor.x, meteor.y, 1);
            },
            onComplete: () => meteor.destroy(),
        });
    }

    update(_time, delta) {
        this.blackHole.rotation += 0.00035 * delta;
    }
}
