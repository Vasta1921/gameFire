const WALKER = {
    id: "walker",
    key: "enemyWalker",
    weight: 3,
    hp: 5,
    speedY: 95,
    fireDelay: 850,
    damageMin: 1,
    damageMax: 2,
    bulletSpeed: 320,
    bulletKey: "greenBullet",
    score: 10,
};

const ORB = {
    id: "orb",
    key: "enemyOrb",
    weight: 1,
    hp: 5,
    speedY: 70,
    fireDelay: 1100,
    damageMin: 1,
    damageMax: 1,
    bulletSpeed: 280,
    bulletKey: "redBullet",
    score: 15,
};

/** Спавн и осада: пехота к стене, орбы зависают в середине и стреляют. */
export class EnemyManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.types = options.types ?? [WALKER, ORB];
        this.spawnDelayMs = options.spawnDelayMs ?? 1000;
        this.group = scene.physics.add.group();
        this.projectiles = options.projectiles;
        this.base = options.base;
        this.paused = false;

        this.spawnTimer = scene.time.addEvent({
            delay: this.spawnDelayMs,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });
    }

    spawnEnemy() {
        if (this.paused) return;

        const cameraWidth = this.scene.cameras.main.width;
        const type = this.pickType();
        const x = Phaser.Math.Between(28, cameraWidth - 28);
        const enemy = this.group.create(x, -20, type.key);

        enemy.enemyType = type;
        enemy.maxHp = type.hp;
        enemy.hp = type.hp;
        enemy.scoreValue = type.score;
        enemy.nextFireAt = 0;
        enemy.stopY = type.id === "orb"
            ? this.scene.cameras.main.centerY
            : this.base.siegeY;
        enemy.clearTint();
        enemy.setVelocity(0, type.speedY);
    }

    pickType() {
        const total = this.types.reduce((sum, type) => sum + type.weight, 0);
        let roll = Math.random() * total;
        for (const type of this.types) {
            roll -= type.weight;
            if (roll <= 0) return type;
        }
        return this.types[0];
    }

    update(time) {
        if (this.paused || !this.base || !this.projectiles) return;

        const aim = this.base.getAimPoint();

        this.group.children.iterate((enemy) => {
            if (!enemy || !enemy.active) return;

            if (enemy.y >= enemy.stopY) {
                enemy.setVelocity(0, 0);
                enemy.y = enemy.stopY;

                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, aim.x, aim.y);
                // Пушка в текстуре смотрит вниз.
                enemy.setRotation(angle - Math.PI / 2);

                if (time >= enemy.nextFireAt) {
                    this.shootAtBase(enemy, aim, angle);
                    enemy.nextFireAt = time + enemy.enemyType.fireDelay;
                }
            }
        });
    }

    shootAtBase(enemy, aim, angle) {
        const type = enemy.enemyType;
        const muzzle = 18;
        const startX = enemy.x + Math.cos(angle) * muzzle;
        const startY = enemy.y + Math.sin(angle) * muzzle;

        this.projectiles.shoot(startX, startY, angle, {
            team: "enemy",
            textureKey: type.bulletKey,
            speed: type.bulletSpeed,
            width: 8,
            height: 16,
            depth: 2,
            damageMin: type.damageMin,
            damageMax: type.damageMax,
        });
    }

    applyHpTint(enemy) {
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        if (enemy.enemyType?.id === "orb") {
            enemy.setTint(
                Phaser.Display.Color.GetColor(
                    Math.round(80 + 150 * ratio),
                    Math.round(20 + 40 * ratio),
                    Math.round(20 + 40 * ratio)
                )
            );
            return;
        }

        enemy.setTint(
            Phaser.Display.Color.GetColor(
                Math.round(20 + 40 * ratio),
                Math.round(70 + 150 * ratio),
                Math.round(20 + 40 * ratio)
            )
        );
    }

    pause() {
        this.paused = true;
        this.spawnTimer.paused = true;
        this.group.children.iterate((enemy) => {
            if (enemy?.body) enemy.setVelocity(0, 0);
        });
    }
}
