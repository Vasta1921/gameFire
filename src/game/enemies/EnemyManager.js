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
    coins: 3,
};

const ORB = {
    id: "orb",
    key: "enemyOrb",
    weight: 1,
    hp: 2,
    speedY: 70,
    fireDelay: 1100,
    damageMin: 1,
    damageMax: 1,
    bulletSpeed: 280,
    bulletKey: "redBullet",
    score: 15,
    coins: 5,
};

const BOSS = {
    id: "boss",
    key: "enemyBoss",
    hp: 48,
    speedY: 52,
    fireDelay: 520,
    damageMin: 2,
    damageMax: 3,
    bulletSpeed: 360,
    bulletKey: "redBullet",
    score: 80,
    coins: 40,
};

/** Волны 1–10: больше и крепче враги, на 10-й волне синий босс. */
export class EnemyManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.types = options.types ?? [WALKER, ORB];
        this.group = scene.physics.add.group();
        this.projectiles = options.projectiles;
        this.base = options.base;
        this.onWaveClear = options.onWaveClear ?? (() => {});
        this.paused = true;
        this.wave = 1;
        this.toSpawn = 0;
        this.bossPending = false;
        this.waitingClear = false;
        this.spawnTimer = null;
    }

    startWave(wave) {
        this.wave = wave;
        this.paused = false;
        this.waitingClear = true;
        this.toSpawn = 6 + (wave - 1) * 2;
        this.bossPending = wave === 10;
        this.hpBonus = wave - 1;
        const delay = Math.max(480, 1000 - (wave - 1) * 45);

        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }
        this.spawnTimer = this.scene.time.addEvent({
            delay,
            callback: this.spawnNext,
            callbackScope: this,
            loop: true,
        });
        this.spawnNext();
    }

    spawnNext() {
        if (this.paused || this.toSpawn <= 0) {
            if (this.spawnTimer) this.spawnTimer.paused = true;
            return;
        }
        this.toSpawn -= 1;
        this.spawnEnemy(this.pickType());
    }

    spawnEnemy(type) {
        const cameraWidth = this.scene.cameras.main.width;
        const x = Phaser.Math.Between(28, cameraWidth - 28);
        const enemy = this.group.create(x, -20, type.key);
        const hp = type.hp + this.hpBonus + (type.id === "boss" ? this.hpBonus * 2 : 0);

        enemy.enemyType = type;
        enemy.maxHp = hp;
        enemy.hp = hp;
        enemy.scoreValue = type.score;
        enemy.nextFireAt = 0;
        enemy.stopY = type.id === "orb"
            ? this.scene.cameras.main.centerY
            : this.base.siegeY;
        enemy.clearTint();

        if (type.id === "walker") {
            enemy.setDisplaySize(26, 46);
        } else if (type.id === "boss") {
            enemy.setDisplaySize(72, 72);
        } else {
            enemy.setDisplaySize(32, 36);
        }

        const speed = type.speedY + (this.wave - 1) * 4;
        enemy.setVelocity(0, speed);
        return enemy;
    }

    spawnBoss() {
        this.spawnEnemy(BOSS);
    }

    pickType() {
        const orbWeight = Math.min(4, 1 + Math.floor((this.wave - 1) / 3));
        const types = [
            { ...WALKER, weight: 3 },
            { ...ORB, weight: orbWeight },
        ];
        const total = types.reduce((sum, type) => sum + type.weight, 0);
        let roll = Math.random() * total;
        for (const type of types) {
            roll -= type.weight;
            if (roll <= 0) return type;
        }
        return types[0];
    }

    aliveCount() {
        return this.group.countActive(true);
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
                enemy.setRotation(angle - Math.PI / 2);

                if (time >= enemy.nextFireAt) {
                    this.shootAtBase(enemy, aim, angle);
                    enemy.nextFireAt = time + enemy.enemyType.fireDelay;
                }
            }
        });

        this.checkWaveClear();
    }

    checkWaveClear() {
        if (!this.waitingClear || this.toSpawn > 0) return;
        if (this.aliveCount() > 0) return;

        if (this.bossPending) {
            this.bossPending = false;
            this.spawnBoss();
            return;
        }

        this.waitingClear = false;
        this.paused = true;
        if (this.spawnTimer) this.spawnTimer.paused = true;
        this.onWaveClear(this.wave);
    }

    shootAtBase(enemy, aim, angle) {
        const type = enemy.enemyType;
        const muzzle = type.id === "boss" ? 28 : 18;
        const startX = enemy.x + Math.cos(angle) * muzzle;
        const startY = enemy.y + Math.sin(angle) * muzzle;

        this.projectiles.shoot(startX, startY, angle, {
            team: "enemy",
            textureKey: type.bulletKey,
            speed: type.bulletSpeed,
            width: type.id === "boss" ? 12 : 8,
            height: type.id === "boss" ? 22 : 16,
            depth: 2,
            damageMin: type.damageMin,
            damageMax: type.damageMax,
        });
    }

    applyHpTint(enemy) {
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        if (enemy.enemyType?.id === "boss") {
            enemy.setTint(
                Phaser.Display.Color.GetColor(
                    Math.round(30 + 40 * ratio),
                    Math.round(60 + 80 * ratio),
                    Math.round(140 + 100 * ratio)
                )
            );
            return;
        }
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
        this.waitingClear = false;
        if (this.spawnTimer) this.spawnTimer.paused = true;
        this.group.children.iterate((enemy) => {
            if (enemy?.body) enemy.setVelocity(0, 0);
        });
    }
}
