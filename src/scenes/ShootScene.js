
import { createBulletTexture } from "../game/utils/createBulletTexture.js";
import { ProjectileSystem } from "../game/bullets/ProjectileSystem.js";
import { EnemyManager } from "../game/enemies/EnemyManager.js";
import { Tower } from "../game/towers/Tower.js";
import { AutoFireController } from "../game/combat/AutoFireController.js";
import { setupBulletEnemyCollision } from "../game/combat/setupBulletEnemyCollision.js";
import { Hud } from "../game/ui/Hud.js";

export class ShootScene extends Phaser.Scene {
    constructor() {
        super("ShootScene");
    }

    preload() {
        this.load.image("tower", "assets/tower.png");
        this.load.image("turret", "assets/turret.png");
         this.load.image("enemy", "assets/enemy/enemy.png");
        // this.load.image("enemy1", "assets/enemy/enemy1.png");
        // this.load.image("enemy2", "assets/enemy/enemy2.png");
        // this.load.image("enemy3", "assets/enemy/enemy3.png");
        // this.load.image("enemy4", "assets/enemy/enemy4.png");
        // this.load.image("enemy5", "assets/enemy/enemy5.png");
        this.load.image("background", "assets/back_ground.png");
    }

    create() {
        this.add.tileSprite(360, 640, 720, 1280, "background");

        createBulletTexture(this, "redBullet", 80, 200, 0xff3333);

        this.projectiles = new ProjectileSystem(this, {
            textureKey: "redBullet",
            maxSize: 5000,
        });

        this.enemyManager = new EnemyManager(this, {
            //enemyKeys: ["enemy1", "enemy2", "enemy3", "enemy4", "enemy5"],
            enemyKeys: ["enemy"],
            spawnDelayMs: 1000,
            speedY: 100,
        });

        this.tower = new Tower(this, this.cameras.main.centerX, this.cameras.main.height - 50, {
            key: "tower",
            depth: 1,
            fireRateMs: 150,
            turretConfigs: [
                {
                    offsetX: 0,
                    offsetY: -10,
                    key: "turret",
                    depth: 2,
                    spread: 6,
                    muzzleOffset: 6,
                    bulletSpeed: 1000,
                },
            ],
        });

        this.hud = new Hud(this);

        setupBulletEnemyCollision(
            this,
            this.projectiles,
            this.enemyManager,
            this.handleBulletEnemyHit
        );

        this.autoFire = new AutoFireController(this, {
            getDelay: () => this.tower.fireRateMs,
            onShoot: this.shootFromTower.bind(this),
        });

        this.input.on("pointerdown", () => this.autoFire.start());
        this.input.on("pointerup", () => this.autoFire.stop());
        this.input.on("pointerout", () => this.autoFire.stop());
    }

    update() {
        const pointer = this.input.activePointer;
        this.tower.update(pointer);
        this.projectiles.update(this.cameras.main);
    }

    shootFromTower() {
        const pointer = this.input.activePointer;
        this.tower.shootAll(this.projectiles, pointer);
    }

    handleBulletEnemyHit(bullet, enemy) {
        bullet.disableBody(true, true);
        enemy.destroy();
        this.hud.addScore(10);
    }
}