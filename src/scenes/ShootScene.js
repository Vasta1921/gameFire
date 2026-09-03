import { createGameTextures } from "../game/utils/createGameTextures.js";
import { ProjectileSystem } from "../game/bullets/ProjectileSystem.js";
import { EnemyManager } from "../game/enemies/EnemyManager.js";
import { Tower } from "../game/towers/Tower.js";
import { Base } from "../game/base/Base.js";
import { AutoFireController } from "../game/combat/AutoFireController.js";
import {
    setupBulletEnemyCollision,
    setupBulletBaseCollision,
} from "../game/combat/setupBulletEnemyCollision.js";
import { Hud } from "../game/ui/Hud.js";
import { ExplosionFx } from "../game/fx/ExplosionFx.js";
import { SpaceBackdrop } from "../game/fx/SpaceBackdrop.js";
import { getSoundFx } from "../game/audio/SoundFx.js";

/** Главная сцена: крепость, стена, враги и HUD. */
export class ShootScene extends Phaser.Scene {
    constructor() {
        super("ShootScene");
    }

    preload() {
        // Текстуры рисуются в create() через Graphics — PNG больше не грузим.
    }

    create() {
        this.isGameOver = false;
        this.isRestarting = false;
        this.skipRestart = false;
        this.sfx = getSoundFx(this.game);
        createGameTextures(this);

        this.backdrop = new SpaceBackdrop(this);

        this.playerShots = new ProjectileSystem(this, {
            textureKey: "redBullet",
            maxSize: 5000,
        });

        this.enemyShots = new ProjectileSystem(this, {
            textureKey: "greenBullet",
            maxSize: 800,
            trailTint: [0x22ff55, 0x88ffaa, 0xddffee],
        });

        this.explosions = new ExplosionFx(this);

        this.base = new Base(this, { maxHp: 15, depth: 1 });

        this.enemyManager = new EnemyManager(this, {
            spawnDelayMs: 1000,
            projectiles: this.enemyShots,
            base: this.base,
        });

        this.tower = new Tower(this, this.cameras.main.centerX, this.base.platformY, {
            key: "tower",
            depth: 2,
            fireRateMs: 150,
            displayWidth: 90,
            displayHeight: 48,
            turretConfigs: [
                {
                    offsetX: 0,
                    offsetY: -28,
                    key: "turret",
                    depth: 3,
                    spread: 8,
                    muzzleOffset: 14,
                    displayWidth: 24,
                    displayHeight: 48,
                    bulletSpeed: 1000,
                    damageMin: 1,
                    damageMax: 3,
                },
            ],
        });

        this.hud = new Hud(this);
        this.hud.setBaseHp(this.base.hp, this.base.maxHp);

        setupBulletEnemyCollision(
            this,
            this.playerShots,
            this.enemyManager,
            this.handleBulletEnemyHit
        );
        setupBulletBaseCollision(
            this,
            this.enemyShots,
            this.base,
            this.handleEnemyBulletBaseHit
        );
        this.physics.add.overlap(
            this.enemyShots.group,
            this.tower.sprite,
            this.handleEnemyBulletBaseHit,
            undefined,
            this
        );

        this.autoFire = new AutoFireController(this, {
            getDelay: () => this.tower.fireRateMs,
            onShoot: this.shootFromTower.bind(this),
        });

        this.input.on("pointerdown", () => {
            this.sfx.unlock();
            if (this.isGameOver) return;
            this.autoFire.start();
        });
        this.input.on("pointerup", () => {
            this.autoFire.stop();
            this.tryRestart();
        });
        this.input.on("pointerout", () => this.autoFire.stop());
    }

    update(time, delta) {
        this.backdrop.update(time, delta);
        if (this.isGameOver) return;

        const pointer = this.input.activePointer;
        this.tower.update(pointer);
        this.playerShots.update(this.cameras.main);
        this.enemyShots.update(this.cameras.main);
        this.enemyManager.update(time);
    }

    shootFromTower() {
        if (this.isGameOver) return;
        const pointer = this.input.activePointer;
        this.tower.shootAll(this.playerShots, pointer);
        this.sfx.shoot();
    }

    /** Попадание игрока: пуля 1–3 урона, враг падает при hp ≤ 0. */
    handleBulletEnemyHit(bullet, enemy) {
        if (this.isGameOver || !bullet.active || !enemy.active) return;
        if (bullet.team === "enemy") return;

        const damage = bullet.damage ?? 1;
        const hitX = bullet.x;
        const hitY = bullet.y;
        const kind = enemy.enemyType?.id === "orb" ? "red" : "green";

        this.playerShots.recycle(bullet);
        this.playerShots.sparkBurst(hitX, hitY, 6);

        enemy.hp = (enemy.hp ?? 5) - damage;
        if (enemy.hp <= 0) {
            this.explosions.burst(hitX, hitY, kind);
            this.sfx.explode(kind);
            this.hud.addScore(enemy.scoreValue ?? 10);
            enemy.destroy();
            return;
        }

        this.enemyManager.applyHpTint(enemy);
    }

    /** Вражеская пуля бьёт по стене или корпусу крепости. */
    handleEnemyBulletBaseHit(objA, objB) {
        if (this.isGameOver) return;

        const bullet = objA.team === "enemy" ? objA : objB;
        if (!bullet?.active) return;

        const damage = bullet.damage ?? 1;
        this.enemyShots.recycle(bullet);
        this.enemyShots.sparkBurst(this.base.getAimPoint().x, this.base.wallTop);

        this.base.takeDamage(damage);
        this.hud.setBaseHp(this.base.hp, this.base.maxHp);

        if (this.base.isDestroyed()) {
            this.endGame();
        }
    }

    endGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.autoFire.stop();
        this.enemyManager.pause();
        this.physics.pause();
        this.hud.showGameOver(
            () => this.tryRestart(),
            () => this.goToMenu()
        );
    }

    tryRestart() {
        if (!this.isGameOver || this.isRestarting || this.skipRestart) return;
        this.isRestarting = true;
        this.physics.resume();
        this.scene.restart();
    }

    goToMenu() {
        if (this.isRestarting) return;
        this.isRestarting = true;
        this.physics.resume();
        this.scene.start("MenuScene");
    }
}
