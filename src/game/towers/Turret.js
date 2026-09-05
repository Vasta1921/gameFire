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
            explodeChance = 0,
            homing = false,
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
        this.explodeChance = explodeChance;
        this.homing = homing;
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

    aimAngle(pointer) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
        const jitter = Phaser.Math.FloatBetween(-this.spread, this.spread);
        return angle + this.rotationOffset + jitter;
    }

    shoot(projectileSystem, pointer, extraSpread = 0, angleOffset = 0, baseAngle = null) {
        const shootAngle = (baseAngle ?? this.aimAngle(pointer)) + angleOffset;

        const dirX = Math.cos(shootAngle);
        const dirY = Math.sin(shootAngle);
        const perpX = -dirY;
        const perpY = dirX;

        const startX = this.sprite.x + dirX * this.muzzleOffset + perpX * extraSpread;
        const startY = this.sprite.y + dirY * this.muzzleOffset + perpY * extraSpread;

        projectileSystem.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight,
            depth: 2,
            damageMin: this.damageMin,
            damageMax: this.damageMax,
            pierce: this.pierce,
            explodes: this.explodeChance > 0 && Math.random() < this.explodeChance,
            homing: this.homing,
        });
    }

    fireVolley(projectileSystem, pointer) {
        let pellets = 1;
        if (this.doubleChance > 0 && Math.random() < Math.min(0.5, this.doubleChance)) {
            pellets = 2;
        }
        if (this.multiChance > 0 && Math.random() < Math.min(0.5, this.multiChance)) {
            pellets += 1;
        }
        const base = this.aimAngle(pointer);
        if (pellets <= 1) {
            this.shoot(projectileSystem, pointer, 0, 0, base);
            return;
        }
        if (pellets === 2) {
            this.shoot(projectileSystem, pointer, -8, 0, base);
            this.shoot(projectileSystem, pointer, 8, 0, base);
            return;
        }
        this.shoot(projectileSystem, pointer, -10, -0.04, base);
        this.shoot(projectileSystem, pointer, 0, 0, base);
        this.shoot(projectileSystem, pointer, 10, 0.04, base);
    }
}
