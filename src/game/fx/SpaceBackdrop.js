/** Декор сцены: пыль, падающие звёзды, метеоры и чёрная дыра. */
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

        this.dust = scene.add.particles(0, 0, "sparkStar", {
            x: { min: 0, max: width },
            y: { min: 0, max: height * 0.72 },
            lifespan: { min: 2200, max: 4800 },
            speed: { min: 6, max: 22 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.16, end: 0 },
            alpha: { start: 0.55, end: 0 },
            tint: [0xffffff, 0x93c5fd, 0xc4b5fd],
            blendMode: "ADD",
            frequency: 70,
            quantity: 1,
        });
        this.dust.setDepth(-4);

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

        this.meteorGroup = scene.physics.add.group();
        this.spawnsPaused = false;

        this.starTimer = scene.time.addEvent({
            delay: 1400,
            loop: true,
            callback: this.spawnShootingStar,
            callbackScope: this,
        });

        this.scheduleMeteor();
    }

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
        if (!this.isGameplayActive()) return;
        const path = this.randomSkyPath();
        this.stars.particleAngle = Phaser.Math.RadToDeg(path.angle);
        this.stars.emitParticleAt(path.startX, path.startY, Math.random() < 0.3 ? 2 : 1);
        this.starTimer.delay = Phaser.Math.Between(800, 2400);
    }

    scheduleMeteor() {
        this.scene.time.delayedCall(Phaser.Math.Between(4000, 9000), () => {
            if (this.isGameplayActive()) this.spawnMeteor();
            this.scheduleMeteor();
        });
    }

    isGameplayActive() {
        const scene = this.scene;
        return !this.spawnsPaused
            && !scene.isGameOver
            && !scene.isPaused
            && !scene.betweenWaves;
    }

    setSpawnsPaused(paused) {
        this.spawnsPaused = paused;
        if (paused) this.clearMeteors();
    }

    clearMeteors() {
        this.meteorGroup.getChildren().slice().forEach((meteor) => {
            if (meteor?.destroy) meteor.destroy();
        });
    }

    spawnMeteor() {
        if (!this.isGameplayActive()) return;
        const path = this.randomSkyPath();
        const meteor = this.meteorGroup.create(path.startX, path.startY, "meteor");
        meteor.setDepth(-2);
        meteor.setDisplaySize(40, 16);
        meteor.setRotation(path.angle);
        meteor.prizeCoins = Phaser.Math.Between(18, 28);
        meteor.prizeScore = 25;

        if (meteor.body) {
            meteor.body.allowGravity = false;
            meteor.body.setSize(meteor.frame.width * 0.7, meteor.frame.height * 0.7, true);
        }

        const speed = Phaser.Math.Between(170, 280);
        meteor.setVelocity(
            Math.cos(path.angle) * speed,
            Math.sin(path.angle) * speed
        );
    }

    update(_time, delta) {
        this.blackHole.rotation += 0.00035 * delta;
        if (!this.isGameplayActive()) return;

        const { width, height } = this.scene.cameras.main;

        this.meteorGroup.children.iterate((meteor) => {
            if (!meteor || !meteor.active) return;
            this.meteorTrail.emitParticleAt(meteor.x, meteor.y, 1);
            if (
                meteor.x < -80 || meteor.x > width + 80 ||
                meteor.y < -80 || meteor.y > height + 80
            ) {
                meteor.destroy();
            }
        });
    }
}
