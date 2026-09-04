/** Пул пуль: берём из группы, летим, за экраном — возвращаем обратно. */
export class ProjectileSystem {
    constructor(scene, options = {}) {
        this.scene = scene;

        const {
            textureKey = "redBullet",
            sparkKey = "spark",
            maxSize = 2000,
            trailTint = [0xff2200, 0xff6611, 0xffaa44],
        } = options;

        this.defaultTextureKey = textureKey;

        this.group = scene.physics.add.group({
            defaultKey: textureKey,
            maxSize,
        });

        // След за пулей: вручную emitParticleAt в update.
        this.trail = scene.add.particles(0, 0, sparkKey, {
            lifespan: 220,
            speed: { min: 8, max: 36 },
            scale: { start: 0.45, end: 0 },
            alpha: { start: 0.85, end: 0 },
            tint: trailTint,
            blendMode: "ADD",
            emitting: false,
            gravityY: 0,
        });
        this.trail.setDepth(1);

        this.burst = scene.add.particles(0, 0, sparkKey, {
            lifespan: 280,
            speed: { min: 40, max: 120 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff1100, 0xff7722, 0xffee88],
            blendMode: "ADD",
            emitting: false,
        });
        this.burst.setDepth(3);
    }

    /**
     * Выпускает пулю из точки (x, y) под углом angle (радианы).
     * Урон случайный в диапазоне damageMin…damageMax.
     * Если пул исчерпан, выстрел игнорируется.
     */
    shoot(x, y, angle, options = {}) {
        const bullet = this.group.get(x, y);
        if (!bullet) return;

        const {
            speed = 500,
            width = 10,
            height = 22,
            depth = 2,
            damageMin = 1,
            damageMax = 3,
            team = "player",
            textureKey = this.defaultTextureKey,
        } = options;

        bullet.damage = Phaser.Math.Between(damageMin, damageMax);
        bullet.team = team;
        bullet.pierce = options.pierce ?? 0;
        bullet.explodes = Boolean(options.explodes);
        bullet.didSplash = false;
        bullet.lastHit = null;
        bullet.hitList = [];

        bullet.setTexture(textureKey);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.clearTint();
        bullet.setPosition(x, y);
        bullet.setDepth(depth);
        bullet.setDisplaySize(width, height);
        // Текстура «стоит» вертикально, поэтому +90°, чтобы совпасть с направлением полёта.
        bullet.setRotation(angle + Math.PI / 2);
        if (bullet.explodes) bullet.setTint(0xffaa66);

        if (bullet.body) {
            bullet.body.enable = true;
            bullet.body.reset(x, y);
            // Размер тела в пикселях кадра, не displaySize.
            const frameW = bullet.frame.width;
            const frameH = bullet.frame.height;
            bullet.body.setSize(frameW * 0.55, frameH * 0.55, true);
            bullet.body.updateFromGameObject();
        }

        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    sparkBurst(x, y, count = 10) {
        this.burst.emitParticleAt(x, y, count);
    }

    recycle(bullet) {
        bullet.team = null;
        bullet.pierce = 0;
        bullet.explodes = false;
        bullet.didSplash = false;
        bullet.lastHit = null;
        bullet.hitList = [];
        bullet.clearTint();
        bullet.disableBody(true, true);
    }

    recycleAll() {
        this.group.children.each((bullet) => {
            if (bullet?.active) this.recycle(bullet);
        });
    }

    /** Выключает пули, улетевшие за видимую область камеры. */
    update(camera) {
        const view = camera.worldView;
        this.group.children.each((bullet) => {
            if (!bullet.active) return;

            this.trail.emitParticleAt(bullet.x, bullet.y, 1);

            if (
                bullet.x < view.x ||
                bullet.x > view.x + view.width ||
                bullet.y < view.y ||
                bullet.y > view.y + view.height
            ) {
                this.recycle(bullet);
            }
        });
    }
}
