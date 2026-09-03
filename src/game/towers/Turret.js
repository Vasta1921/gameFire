/** Турель: поворачивается к курсору и стреляет с небольшим боковым разбросом. */
export class Turret {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "turret",
            rotationOffset = 0,
            depth = 2,
            muzzleOffset = 32,
            spread = 6,
            bulletSpeed = 500,
            bulletWidth = 10,
            bulletHeight = 22,
            damageMin = 1,
            damageMax = 3,
        } = options;

        this.sprite = scene.add.sprite(x, y, key);
        // Точка вращения — низ ствола, чтобы дуло качалось вокруг основания.
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setDepth(depth);

        this.rotationOffset = rotationOffset;
        this.muzzleOffset = muzzleOffset;
        this.spread = spread;
        this.bulletSpeed = bulletSpeed;
        this.bulletWidth = bulletWidth;
        this.bulletHeight = bulletHeight;
        this.damageMin = damageMin;
        this.damageMax = damageMax;
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

    shoot(projectileSystem, pointer) {
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

        const spreadOffset = Phaser.Math.FloatBetween(-this.spread, this.spread);
        // Старт пули чуть впереди дула, центр спрайта по длине пули.
        const bulletCenterAlongDir = this.muzzleOffset - this.bulletHeight / 2;

        const startX = this.sprite.x + dirX * bulletCenterAlongDir + perpX * spreadOffset;
        const startY = this.sprite.y + dirY * bulletCenterAlongDir + perpY * spreadOffset;

        projectileSystem.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight,
            depth: 2,
            damageMin: this.damageMin,
            damageMax: this.damageMax,
        });
    }
}
