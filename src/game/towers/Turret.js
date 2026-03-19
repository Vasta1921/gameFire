export class Turret {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "turret",
            rotationOffset = 0,
            depth = 2,
            muzzleOffset = 6,
            spread = 3,
            bulletSpeed = 500,
            bulletWidth = 8,
            bulletHeight = 20,
        } = options;

        this.sprite = scene.add.sprite(x, y, key);
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setDepth(depth);

        this.rotationOffset = rotationOffset;
        this.muzzleOffset = muzzleOffset;
        this.spread = spread;
        this.bulletSpeed = bulletSpeed;
        this.bulletWidth = bulletWidth;
        this.bulletHeight = bulletHeight;
    }

    update(pointer) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
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
        const perpX = -dirY;
        const perpY = dirX;

        const spreadOffset = Phaser.Math.FloatBetween(-this.spread, this.spread);
        const bulletCenterAlongDir = this.muzzleOffset - this.bulletHeight / 2;

        const startX = this.sprite.x + dirX * bulletCenterAlongDir + perpX * spreadOffset;
        const startY = this.sprite.y + dirY * bulletCenterAlongDir + perpY * spreadOffset;

        projectileSystem.shoot(startX, startY, shootAngle, {
            speed: this.bulletSpeed,
            width: this.bulletWidth,
            height: this.bulletHeight,
            depth: 0,
        });
    }
}

