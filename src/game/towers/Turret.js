/** Турель: поворачивается к курсору и стреляет с небольшим боковым разбросом. */
export class Turret {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "turret",
            rotationOffset = 0,
            depth = 2,
            muzzleOffset = 14,
            spread = 0.16,
            bulletSpeed = 500,
            bulletWidth = 10,
            bulletHeight = 22,
            damageMin = 1,
            damageMax = 3,
            displayWidth = 24,
            displayHeight = 48,
            pelletCount = 1,
            doubleChance = 0,
            multiChance = 0,
            pierce = 0,
            pierceChance = 0,
            explodeChance = 0,
            homing = false,
            noCrit = false,
            critChance = 0,
            critMult = 1.5,
            straightChance = 0,
        } = options;

        this.sprite = scene.add.sprite(x, y, key);
        // Точка вращения — низ ствола, чтобы дуло качалось вокруг основания.
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setDisplaySize(displayWidth, displayHeight);
        this.sprite.setDepth(depth);

        this.rotationOffset = rotationOffset;
        this.muzzleOffset = muzzleOffset;
        this.spread = spread;
        this.bulletSpeed = bulletSpeed;
        this.bulletWidth = bulletWidth;
        this.bulletHeight = bulletHeight;
        this.damageMin = damageMin;
        this.damageMax = damageMax;
        this.pelletCount = pelletCount;
        this.doubleChance = doubleChance;
        this.multiChance = multiChance;
        this.pierce = pierce;
        this.pierceChance = pierceChance;
        this.explodeChance = explodeChance;
        this.homing = homing;
        this.noCrit = noCrit;
        this.critChance = critChance;
        this.critMult = critMult;
        this.straightChance = straightChance;
    }

    update(pointer) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
        // Спрайт смотрит вверх, Phaser считает 0 вправо — сдвигаем на 90°.
        this.sprite.setRotation(angle + this.rotationOffset + Math.PI / 2);
    }

    trueAngle(pointer) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
        return angle + this.rotationOffset;
    }

    aimAngle(pointer) {
        const jitter = Phaser.Math.FloatBetween(-this.spread, this.spread);
        return this.trueAngle(pointer) + jitter;
    }

    shoot(projectileSystem, pointer, extraSpread = 0, angleOffset = 0, baseAngle = null) {
        const shootAngle = (baseAngle ?? this.aimAngle(pointer)) + angleOffset;

        const dirX = Math.cos(shootAngle);
        const dirY = Math.sin(shootAngle);
        const perpX = -dirY;
        const perpY = dirX;

        const startX = this.sprite.x + dirX * this.muzzleOffset + perpX * extraSpread;
        const startY = this.sprite.y + dirY * this.muzzleOffset + perpY * extraSpread;

        const crit = !this.noCrit && this.critChance > 0 && Math.random() < Math.min(0.5, this.critChance);
        const mult = crit ? (this.critMult || 1.5) : 1;
        let pierce = this.pierce || 0;
        if (this.pierceChance > 0 && Math.random() < Math.min(0.5, this.pierceChance)) {
            pierce += 1;
        }

        projectileSystem.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight,
            depth: 2,
            damageMin: Math.max(1, Math.round(this.damageMin * mult)),
            damageMax: Math.max(1, Math.round(this.damageMax * mult)),
            pierce,
            explodes: this.explodeChance > 0 && Math.random() < this.explodeChance,
            homing: this.homing,
            crit,
            textureKey: crit ? "greenBullet" : undefined,
        });
    }

    fireParallel(projectileSystem, pointer, pellets, baseAngle) {
        if (pellets <= 1) {
            this.shoot(projectileSystem, pointer, 0, 0, baseAngle);
            return;
        }
        const spacing = pellets >= 3 ? 10 : 8;
        const start = -((pellets - 1) / 2) * spacing;
        for (let i = 0; i < pellets; i += 1) {
            this.shoot(projectileSystem, pointer, start + i * spacing, 0, baseAngle);
        }
    }

    fireVolley(projectileSystem, pointer) {
        let pellets = Math.max(1, this.pelletCount || 1);
        if (this.doubleChance > 0 && Math.random() < Math.min(0.5, this.doubleChance)) {
            pellets += 1;
        }
        const burst = this.multiChance > 0 && Math.random() < Math.min(0.5, this.multiChance);
        const straight = this.straightChance > 0 && Math.random() < Math.min(0.5, this.straightChance);
        const base = straight ? this.trueAngle(pointer) : this.aimAngle(pointer);
        this.fireParallel(projectileSystem, pointer, pellets, base);
        if (!burst) return;

        this.scene.time.delayedCall(56, () => {
            if (!this.sprite?.active) return;
            if (this.scene.isGameOver || this.scene.betweenWaves) return;
            this.fireParallel(projectileSystem, pointer, pellets, base);
        });
    }
}
