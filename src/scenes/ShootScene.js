export class ShootScene extends Phaser.Scene {
    constructor() {
        super('ShootScene');
    }

    preload() {
        // Загрузка новых изображений
        this.load.image('tower', 'assets/tower.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('turret', 'assets/turret.png'); // Новый спрайт для дула
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('background', 'assets/back_ground.png');
    }

    create() {

        // Фон
        this.background = this.add.tileSprite(360, 640, 720, 1280, 'background');

        // Получаем размер окна от Telegram Web App
        //const telegramData = window.Telegram.WebApp;
        // if (telegramData) {
        //     const { width, height } = telegramData.viewportStableHeight
        //         ? { width: telegramData.viewportStableWidth, height: telegramData.viewportStableHeight }
        //         : { width: window.innerWidth, height: window.innerHeight };
        //     this.cameras.main.setViewport(0, 0, width, height);
        //     this.cameras.main.setZoom(Math.min(width / 360, height / 640)); // Адаптация под базовое разрешение 360x640
        // } else {
        //     // Фallback для тестирования вне Telegram
        //     this.cameras.main.setViewport(0, 0, 360, 640);
        // }

        // Создаем башню (космический модуль) внизу экрана
        this.tower = this.physics.add.sprite(this.cameras.main.centerX,
            this.cameras.main.height - 50, 'tower');
        this.tower.setCollideWorldBounds(true);
        this.tower.setImmovable(true);
        //this.tower.setScale(2) // размер увеличил в два раза
        //this.tower.setSize(64, 64); // Установить ширину 40px и высоту 60px
        //this.tower.setDisplaySize(64, 64); // Установить видимый размер (если отличается от физического)

        // Создаем дуло (турель), которое будет вращаться
        this.turret = this.add.sprite(this.tower.x, this.tower.y - 10, 'turret'); // Позиция относительно башни
        this.turret.setOrigin(0.5, 1.0); // Устанавливаем точку вращения в нижнюю часть

        this.turret.setDepth(2); // Дуло выше
        this.tower.setDepth(1); // Башня ниже дула

        // Создаем группу врагов
        this.enemies = this.physics.add.group();
        // Создаем группу пуль
        this.bullets = this.physics.add.group();

        // Создаем текст для счета
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        // Коллизия между пулями и врагами
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);

        // Спавн врагов каждые 2 секунды
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Автострельба по удержанию
        this.isShooting = false; // Флаг состояния стрельбы
        this.shootTimer = null; // Таймер для автострельбы

        // Стрельба по касанию/нажатию
        this.input.on('pointerdown', this.startShooting, this);
        //this.input.on('pointerdown', this.shootBullet, this);
        // Остановка стрельбы при отпускании
        this.input.on('pointerup', this.stopShooting, this);
        // Остановка стрельбы при выходе курсора за пределы экрана
        this.input.on('pointerout', this.stopShooting, this);
    }

    update() {
        // Прицеливание башни на указатель мыши/палец
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.tower.x, this.tower.y, pointer.x, pointer.y);
        this.turret.setRotation(angle + Math.PI / 2);

        // Проверка и удаление пуль, вышедших за экран
        this.bullets.getChildren().forEach(bullet => {
            if (
                bullet.x < 0 ||
                bullet.x > this.cameras.main.width ||
                bullet.y < 0 ||
                bullet.y > this.cameras.main.height
            ) {
                bullet.destroy();
            }
        });
    }

    spawnEnemy() {
        // Создаем врага (летающую тарелку) в случайной позиции сверху
        const x = Phaser.Math.Between(10, 350);
        const enemy = this.enemies.create(x, 0, 'enemy');
        enemy.setVelocityY(100);
    }

    startShooting() {
        if (!this.isShooting) {
            console.log('Starting auto-fire');
            this.isShooting = true;

            // Первый выстрел сразу
            this.shootBullet();

            // Запускаем таймер для автострельбы каждый 0.2 секунды
            this.shootTimer = this.time.addEvent({
                delay: 200, // Частота стрельбы
                callback: this.shootBullet,
                callbackScope: this,
                loop: true
            });
        }
    }

    /** Остановка непрерывной стрельбы */
    stopShooting() {
        if (this.isShooting) {
            console.log('Stopping auto-fire');
            this.isShooting = false;

            // Останавливаем таймер
            if (this.shootTimer) {
                this.shootTimer.remove();
                this.shootTimer = null;
            }
        }
    }

    shootBullet() {
        if (!this.isShooting) return;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, pointer.x, pointer.y);

        // Создание пули
        const xOffset = Phaser.Math.FloatBetween(-5, 5);
        const bullet = this.bullets.create(this.turret.x + xOffset, this.turret.y, 'bullet');
        if (bullet) {
            const speed = 400;
            bullet.setRotation(angle + Math.PI / 2);
            bullet.setSize(8,20);
            bullet.setDisplaySize(8,20);
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    hitEnemy(bullet, enemy) {
        // Уничтожаем врага и пулю при столкновении
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
}