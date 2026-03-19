export class Turret {

    constructor(scene, x, y, turretKey = "turret", rotationOffset = 0) {
        this.scene = scene;

        // Спрайт турели
        this.sprite = scene.add.sprite(x, y, turretKey);
        this.sprite.setOrigin(0.5, 1); // Центр в нижней части
        this.sprite.setDepth(2);

        // Дополнительный угол поворота (если нужно смещать ось турели)
        this.rotationOffset = rotationOffset;

        // Настройки выстрела (позже их можно будет менять апгрейдами)
        // Это "глубина" до условного конца ствола (tip) вдоль направления выстрела.
        // Т.к. пуля рисуется/имеет центр в середине, мы вычитаем half-height при расчете центра пули.
        this.muzzleOffset = 6;
        this.spread = 3; // разброс пуль перпендикулярно направлению
        this.bulletSpeed = 500;
        this.bulletWidth = 8;
        this.bulletHeight = 20;
    }

    update(pointer) {
        // Поворот турели в сторону указателя
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, pointer.x, pointer.y);
        this.sprite.setRotation(angle + this.rotationOffset + Math.PI / 2); // Учитываем смещение для поворота
    }

    shoot(bulletManager) {
        const pointer = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, pointer.x, pointer.y);
        const shootAngle = angle + this.rotationOffset;

        // Направление выстрела и перпендикуляр для "мuzzle spread".
        const dirX = Math.cos(shootAngle);
        const dirY = Math.sin(shootAngle);
        const perpX = -dirY;
        const perpY = dirX;

        const spreadOffset = Phaser.Math.FloatBetween(-this.spread, this.spread);

        // Точка появления: сдвигаем центр пули относительно "конца ствола",
        // чтобы пуля визуально стартовала из турели, а не "сверху".
        const bulletCenterAlongDir = this.muzzleOffset - this.bulletHeight / 2;

        const startX = this.sprite.x + dirX * bulletCenterAlongDir + perpX * spreadOffset;
        const startY = this.sprite.y + dirY * bulletCenterAlongDir + perpY * spreadOffset;

        bulletManager.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight
        });
    }
}