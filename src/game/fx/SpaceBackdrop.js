/** Декор сцены: медленный дрейф неба, редкие звёзды, метеоры и чёрная дыра. */
export class SpaceBackdrop {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.cameras.main;

        this.bg = scene.add.tileSprite(width / 2, height / 2, width, height, "background");
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
            lifespan: { min: 900, max: 1600 },
            speed: { min: 160, max: 380 },
            angle: { min: -12, max: 12 },
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

        this.meteors = [];

        this.starTimer = scene.time.addEvent({
            delay: 2200,
            loop: true,
            callback: this.spawnShootingStar,
            callbackScope: this,
        });

        this.scheduleMeteor();
    }

    spawnShootingStar() {
        const { width, height } = this.scene.cameras.main;
        const toRight = Math.random() < 0.5;
        const x = toRight ? Phaser.Math.Between(-20, 60) : Phaser.Math.Between(width - 60, width + 20);
        const y = Phaser.Math.Between(80, height * 0.55);
        this.stars.particleAngle = toRight
            ? { min: -10, max: 10 }
            : { min: 170, max: 190 };
        this.stars.emitParticleAt(x, y, Math.random() < 0.25 ? 2 : 1);
        this.starTimer.delay = Phaser.Math.Between(1400, 3800);
    }

    scheduleMeteor() {
        this.scene.time.delayedCall(Phaser.Math.Between(6000, 14000), () => {
            this.spawnMeteor();
            this.scheduleMeteor();
        });
    }

    spawnMeteor() {
        const { width, height } = this.scene.cameras.main;
        const fromLeft = Math.random() < 0.5;
        const y = Phaser.Math.Between(120, Math.floor(height * 0.52));
        const startX = fromLeft ? -50 : width + 50;
        const endX = fromLeft ? width + 50 : -50;
        const meteor = this.scene.add.image(startX, y, "meteor");
        meteor.setDepth(-2);
        meteor.setDisplaySize(36, 14);
        meteor.setRotation(fromLeft ? 0 : Math.PI);

        this.scene.tweens.add({
            targets: meteor,
            x: endX,
            duration: Phaser.Math.Between(2200, 3400),
            ease: "Linear",
            onUpdate: () => {
                this.meteorTrail.emitParticleAt(meteor.x, meteor.y, 1);
            },
            onComplete: () => meteor.destroy(),
        });
    }

    update(_time, delta) {
        this.bg.tilePositionY -= 0.12 * (delta / 16.67);
        this.bg.tilePositionX += 0.03 * (delta / 16.67);
        this.blackHole.rotation += 0.00035 * delta;
    }
}
