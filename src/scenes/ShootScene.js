import { BulletManager } from "../engine/BulletManager.js";
import { EnemySpawner } from "../engine/EnemySpawner.js";
import { createBulletTexture } from "../engine/createBulletTexture.js";
import { Tower } from "../engine/Tower.js";

export class ShootScene extends Phaser.Scene {

    constructor() {
        super("ShootScene");
    }

    preload() {
        this.load.image("tower", "assets/tower.png");
        this.load.image("turret", "assets/turret.png");
        this.load.image("enemy1", "assets/enemy/enemy1.png");
        this.load.image("enemy2", "assets/enemy/enemy2.png");
        this.load.image("enemy3", "assets/enemy/enemy3.png");
        this.load.image("enemy4", "assets/enemy/enemy4.png");
        this.load.image("enemy5", "assets/enemy/enemy5.png");
        this.load.image("background", "assets/back_ground.png");
    }

    create() {
        // Задаём фон
        this.add.tileSprite(360, 640, 720, 1280, "background");

        // Создаём пули
        createBulletTexture(this, "redBullet", 80, 200, 0xff3333);

        // Создаём менеджер пуль
        this.weapon = new BulletManager(this);
        this.enemySpawner = new EnemySpawner(this);

        // Создаём башню и турели (одна турель по центру)
        this.tower = new Tower(this, this.cameras.main.centerX, this.cameras.main.height - 50, {
            turretConfigs: [
                {
                    offsetX: 0,
                    offsetY: -10,
                    rotationOffset: 0,
                }
            ]
        });

        // Коллизии: пули должны пересекаться с врагами и уничтожать их.
        this.physics.add.overlap(
            this.weapon.bullets,
            this.enemySpawner.enemies,
            (bullet, enemy) => this.hitEnemy(bullet, enemy),
            undefined,
            this
        );

        // Обработчики для стрельбы
        this.input.on("pointerdown", () => this.startShooting(), this);
        this.input.on("pointerup", this.stopShooting, this);
        this.input.on("pointerout", this.stopShooting, this);
    }

    startShooting() {
        if (!this.isShooting) {
            console.log("Starting auto-fire");
            this.isShooting = true;

            // Стрельба со всех турелей башни
            this.tower.shootAll(this.weapon);

            // Запускаем таймер для автострельбы с заданной частотой
            this.shootTimer = this.time.addEvent({
                delay: this.tower.fireRateMs, // Частота стрельбы (апгрейды смогут менять)
                callback: this.shootBullet,
                callbackScope: this,
                loop: true
            });
        }
    }

    stopShooting() {
        if (this.isShooting) {
            console.log("Stopping auto-fire");
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

        // Стрельба со всех турелей башни
        this.tower.shootAll(this.weapon);
    }

    update() {
        const pointer = this.input.activePointer;

        // Обновляем турели башни
        this.tower.update(pointer);

        // Обновляем пули: деактивируем, когда они выходят за пределы экрана.
        this.weapon.update(this.cameras.main);
    }

    hitEnemy(bullet, enemy) {
        bullet.disableBody(true, true);
        enemy.destroy();
    }
}