export class BulletManager {

    constructor(scene) {
        this.scene = scene;

        // Группа пуль
        this.bullets = scene.physics.add.group({
            maxSize: 200,
            defaultKey: "redBullet" // Спрайт пули
        });
    }

    // Стрельба
    // Управляет пулей полностью: включение, reset тела, скорость/размер.
    shoot(x, y, angle, options = {}) {
        const bullet = this.bullets.get(x, y); // Получаем пулю

        if (!bullet) return;

        const {
            speed = 500,
            width = 8,
            height = 20,
        } = options;

        // Активируем пулю
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDepth(0);

        // Включаем физику для пули и гарантируем корректный reset.
        // Это убирает эффекты "залипания" при повторном использовании из пула.
        if (bullet.body) {
            bullet.body.enable = true;
            bullet.body.reset(x, y);
            // Центруем тело пули относительно позиции спрайта,
            // чтобы не было постоянного смещения (особенно при reuse из пула).
            bullet.body.setSize(width, height, true); // Устанавливаем размер пули + центр
            bullet.body.updateFromGameObject();
        }

        // Синхронизируем визуальный размер с физическим.
        bullet.setDisplaySize(width, height);

        // Устанавливаем угол пули
        bullet.setRotation(angle + Math.PI / 2);

        // Устанавливаем скорость пули
        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    // Обновляем пули (удаляем, если вышли за пределы экрана)
    update(camera) {
        const view = camera.worldView;
        this.bullets.children.each(bullet => {
            if (!bullet.active) return; // Если пуля не активна, пропускаем

            // Проверяем, если пуля выходит за пределы экрана, то деактивируем её
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