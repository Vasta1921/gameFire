import { createGameTextures } from "../game/utils/createGameTextures.js";
import { ProjectileSystem } from "../game/bullets/ProjectileSystem.js";
import { EnemyManager } from "../game/enemies/EnemyManager.js";
import { Tower } from "../game/towers/Tower.js";
import { AutoFireController } from "../game/combat/AutoFireController.js";
import { setupBulletEnemyCollision } from "../game/combat/setupBulletEnemyCollision.js";
import { Hud } from "../game/ui/Hud.js";

/** Главная сцена: башня, враги, стрельба и HUD. */
export class ShootScene extends Phaser.Scene {
    constructor() {
        super("ShootScene");
    }

    preload() {
        // Текстуры рисуются в create() через Graphics — PNG больше не грузим.
    }

    create() {
        createGameTextures(this);

        this.add.tileSprite(360, 640, 720, 1280, "background");

        this.projectiles = new ProjectileSystem(this, {
            textureKey: "redBullet",
            maxSize: 5000,
        });

        this.enemyManager = new EnemyManager(this, {
            //enemyKeys: ["enemy1", "enemy2", "enemy3", "enemy4", "enemy5"],
            enemyKeys: ["enemy"],
            spawnDelayMs: 1000,
            speedY: 100,
            maxHp: 5,
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
                    muzzleOffset: 8,
                    bulletSpeed: 1000,
                    damageMin: 1,
                    damageMax: 3,
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

        // Удерживаем кнопку — идёт автоогонь, отпустили или ушли курсором — стоп.
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

    /** Попадание: пуля наносит 1–3 урона; враг падает при hp ≤ 0. */
    handleBulletEnemyHit(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;

        const damage = bullet.damage ?? 1;
        const hitX = bullet.x;
        const hitY = bullet.y;

        this.projectiles.recycle(bullet);
        this.projectiles.sparkBurst(hitX, hitY);

        enemy.hp = (enemy.hp ?? 5) - damage;
        if (enemy.hp <= 0) {
            enemy.destroy();
            this.hud.addScore(10);
            return;
        }

        const ratio = enemy.hp / (enemy.maxHp || 5);
        enemy.setTint(
            Phaser.Display.Color.GetColor(
                Math.round(20 + 40 * ratio),
                Math.round(70 + 150 * ratio),
                Math.round(20 + 40 * ratio)
            )
        );
    }
}
