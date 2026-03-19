export class ProjectileSystem {
    constructor(scene, options = {}) {
        this.scene = scene;

        const {
            textureKey = "redBullet",
            maxSize = 2000,
        } = options;

        this.group = scene.physics.add.group({
            defaultKey: textureKey,
            maxSize,
        });
    }

    shoot(x, y, angle, options = {}) {
        const bullet = this.group.get(x, y);
        if (!bullet) return;

        const {
            speed = 500,
            width = 8,
            height = 20,
            depth = 0,
        } = options;

        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setPosition(x, y);
        bullet.setDepth(depth);
        bullet.setDisplaySize(width, height);
        bullet.setRotation(angle + Math.PI / 2);

        if (bullet.body) {
            bullet.body.enable = true;
            bullet.body.reset(x, y);
            bullet.body.setSize(width, height, true);
            bullet.body.updateFromGameObject();
        }

        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    update(camera) {
        const view = camera.worldView;
        this.group.children.each((bullet) => {
            if (!bullet.active) return;

            if (
                bullet.x < view.x ||
                bullet.x > view.x + view.width ||
                bullet.y < view.y ||
                bullet.y > view.y + view.height
            ) {
                bullet.disableBody(true, true);
            }
        });
    }
}

