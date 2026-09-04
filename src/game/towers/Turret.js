/** Турель: поворачивается к курсору и стреляет с небольшим боковым разбросом. */
export class Turret {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "turret",
            rotationOffset = 0,
            depth = 2,
            muzzleOffset = 14,
            spread = 6,
            bulletSpeed = 500,
            bulletWidth = 10,
            bulletHeight = 22,
            damageMin = 1,
            damageMax = 3,
            displayWidth = 24,
            displayHeight = 48,
            pelletCount = 1,
            doubleChance = 0,
            pierce = 0,
            explodeChance = 0,
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
        this.pierce = pierce;
        this.explodeChance = explodeChance;
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

    shoot(projectileSystem, pointer, extraSpread = 0) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
        const shootAngle = angle + this.rotationOffset;

        const dirX = Math.cos(shootAngle);
        const dirY = Math.sin(shootAngle);
        // Перпендикуляр к направлению выстрела — для смещения влево/вправо.
        const perpX = -dirY;
        const perpY = dirX;

        const spreadOffset = Phaser.Math.FloatBetween(-this.spread * 0.15, this.spread * 0.15) + extraSpread * 0.25;
        const bulletCenterAlongDir = this.muzzleOffset;

        const startX = this.sprite.x + dirX * bulletCenterAlongDir + perpX * spreadOffset;
        const startY = this.sprite.y + dirY * bulletCenterAlongDir + perpY * spreadOffset;

        projectileSystem.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight,
            depth: 2,
            damageMin: this.damageMin,
            damageMax: this.damageMax,
            pierce: this.pierce,
            explodes: this.explodeChance > 0 && Math.random() < this.explodeChance,
        });
    }

    fireVolley(projectileSystem, pointer) {
        let pellets = this.pelletCount ?? 1;
        if (this.doubleChance > 0 && Math.random() < this.doubleChance) {
            pellets += 1;
        }
        const offsets = pellets === 1 ? [0] : pellets === 2 ? [-6, 6] : [-8, 0, 8];
        for (let i = 0; i < pellets; i += 1) {
            this.shoot(projectileSystem, pointer, offsets[i] ?? 0);
        }
    }
}
