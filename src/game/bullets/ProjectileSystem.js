/** Пул пуль: берём из группы, летим, за экраном — возвращаем обратно. */
export class ProjectileSystem {
    constructor(scene, options = {}) {
        this.scene = scene;

        const {
            textureKey = "redBullet",
            sparkKey = "spark",
            maxSize = 80,
            trailTint = [0xff2200, 0xff6611, 0xffaa44],
        } = options;

        this.defaultTextureKey = textureKey;
        this.trailSkip = 0;

        this.group = scene.physics.add.group({
            defaultKey: textureKey,
            maxSize,
        });

        this.trail = scene.add.particles(0, 0, sparkKey, {
            lifespan: 140,
            speed: { min: 4, max: 18 },
            scale: { start: 0.32, end: 0 },
            alpha: { start: 0.7, end: 0 },
            tint: trailTint,
            blendMode: "ADD",
            emitting: false,
            gravityY: 0,
            maxParticles: 180,
        });
        this.trail.setDepth(1);

        this.burst = scene.add.particles(0, 0, sparkKey, {
            lifespan: 200,
            speed: { min: 30, max: 90 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff1100, 0xff7722, 0xffee88],
            blendMode: "ADD",
            emitting: false,
            maxParticles: 80,
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
        bullet.homing = Boolean(options.homing);
        bullet.homingSpeed = speed;

        bullet.setTexture(textureKey);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.clearTint();
        bullet.setPosition(x, y);
        bullet.setDepth(depth);
        bullet.setDisplaySize(width, height);
        bullet.setRotation(angle + Math.PI / 2);
        if (bullet.explodes) bullet.setTint(0xffaa66);
        else if (bullet.homing) bullet.setTint(0x66d9ff);

        if (bullet.body) {
            bullet.body.enable = true;
            bullet.body.reset(x, y);
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

    sparkBurst(x, y, count = 6) {
        this.burst.emitParticleAt(x, y, count);
    }

    recycle(bullet) {
        bullet.team = null;
        bullet.pierce = 0;
        bullet.explodes = false;
        bullet.didSplash = false;
        bullet.lastHit = null;
        bullet.hitList = [];
        bullet.homing = false;
        bullet.clearTint();
        bullet.disableBody(true, true);
    }

    recycleAll() {
        this.group.children.each((bullet) => {
            if (bullet?.active) this.recycle(bullet);
        });
    }

    update(camera, enemyGroup) {
        const view = camera.worldView;
        this.trailSkip += 1;
        const drawTrail = this.trailSkip % 2 === 0;

        this.group.children.iterate((bullet) => {
            if (!bullet?.active) return;

            if (bullet.homing && enemyGroup) {
                steerHoming(bullet, enemyGroup);
            }

            if (drawTrail) {
                this.trail.emitParticleAt(bullet.x, bullet.y, 1);
            }

            if (
                bullet.x < view.x - 8 ||
                bullet.x > view.x + view.width + 8 ||
                bullet.y < view.y - 8 ||
                bullet.y > view.y + view.height + 8
            ) {
                this.recycle(bullet);
            }
        });
    }
}

function steerHoming(bullet, enemyGroup) {
    let nearest = null;
    let best = Infinity;
    enemyGroup.children.iterate((enemy) => {
        if (!enemy?.active) return;
        const dx = enemy.x - bullet.x;
        const dy = enemy.y - bullet.y;
        const dist = dx * dx + dy * dy;
        if (dist < best) {
            best = dist;
            nearest = enemy;
        }
    });
    if (!nearest) return;

    const desired = Math.atan2(nearest.y - bullet.y, nearest.x - bullet.x);
    const vx = bullet.body?.velocity?.x ?? 0;
    const vy = bullet.body?.velocity?.y ?? 0;
    const current = Math.atan2(vy, vx);
    const next = Phaser.Math.Angle.RotateTo(current, desired, 0.1);
    const speed = bullet.homingSpeed || 500;
    bullet.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
    bullet.setRotation(next + Math.PI / 2);
}
