export class BulletManager {
    constructor(scene) {
        this.scene = scene;

        this.scene.createBulletTexture(scene, 'redBullet', 80, 200, 0xff3333);

        this.bullets = scene.physics.add.group({
            defaultKey: 'redBullet',
            maxSize: 50000
        });
    }

    shoot(x, y, angle) {
        const bullet = this.bullets.get(x, y);

        if (!bullet) return;

        const speed = 500;

        bullet.setActive(true);
        bullet.setRotation(angle + Math.PI / 2);
        bullet.setDisplaySize(8, 20);

        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    update() {
        const camera = this.scene.cameras.main;

        this.bullets.getChildren().forEach(bullet => {
            if (
                bullet.x < 0 ||
                bullet.x > camera.width ||
                bullet.y < 0 ||
                bullet.y > camera.height
            ) {
                bullet.destroy();
            }
        });
    }
}