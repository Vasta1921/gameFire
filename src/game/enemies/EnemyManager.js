import { STAT_SCALE, WAVE_DMG_GROWTH, WAVE_HP_GROWTH, WAVE_REWARD_GROWTH, scaleByWave, wavePower } from "../progress/scaling.js";

const WALKER = {
    id: "walker",
    key: "enemyWalker",
    weight: 3,
    hp: 5,
    speedY: 95,
    fireDelay: 1050,
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
    speedY: 48,
    fireDelay: 1350,
    damageMin: 1,
    damageMax: 1,
    bulletSpeed: 280,
    bulletKey: "redBullet",
    score: 15,
    coins: 5,
};

const DART = {
    id: "dart",
    key: "enemyDart",
    weight: 2,
    hp: 2,
    speedY: 168,
    fireDelay: 1050,
    damageMin: 1,
    damageMax: 2,
    bulletSpeed: 340,
    bulletKey: "blueBullet",
    score: 12,
    coins: 4,
};

const SIZES = {
    walker: [26, 46],
    orb: [32, 36],
    dart: [22, 50],
};

const BOSS_SCALE = 2.6;
const BOSS_HP = 8;
const BOSS_DAMAGE = 2;
const BOSS_REWARD = 8;
const BOSS_SCORE = 6;
const BOSS_SPEED = 0.72;
const BOSS_FIRE = 0.68;

/** Волны блоками по 10: больше и крепче враги, каждый 10-й — босс. */
export class EnemyManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.types = options.types ?? [WALKER, ORB, DART];
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
        this.toSpawn = Math.min(48, 6 + (wave - 1) * 2);
        this.bossPending = wave % 10 === 0;
        const delay = Math.max(280, Math.round(920 * Math.pow(0.97, wave - 1)));

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

    spawnEnemy(type, options = {}) {
        const isBoss = Boolean(options.boss);
        const cameraWidth = this.scene.cameras.main.width;
        const x = Phaser.Math.Between(isBoss ? 80 : 28, cameraWidth - (isBoss ? 80 : 28));
        const enemy = this.group.create(x, isBoss ? -70 : -20, type.key);
        const hp = Math.round(type.hp * STAT_SCALE * wavePower(this.wave, WAVE_HP_GROWTH) * (isBoss ? BOSS_HP : 1));

        enemy.enemyType = type;
        enemy.isBoss = isBoss;
        enemy.maxHp = hp;
        enemy.hp = hp;
        enemy.scoreValue = scaleByWave(type.score * (isBoss ? BOSS_SCORE : 1), this.wave, WAVE_REWARD_GROWTH);
        enemy.coinValue = scaleByWave(type.coins * (isBoss ? BOSS_REWARD : 1), this.wave, WAVE_REWARD_GROWTH);
        enemy.nextFireAt = 0;
        enemy.stopY = type.id === "orb"
            ? this.scene.cameras.main.centerY
            : this.base.siegeY;
        enemy.clearTint();

        const [dw, dh] = SIZES[type.id] || [32, 36];
        const sizeK = isBoss ? BOSS_SCALE : 1;
        enemy.setDisplaySize(Math.round(dw * sizeK), Math.round(dh * sizeK));

        const speed = Math.round(type.speedY * Math.min(2.5, wavePower(this.wave, 1.025)) * (isBoss ? BOSS_SPEED : 1));
        enemy.setVelocity(0, speed);
        enemy.swayPhase = Math.random() * Math.PI * 2;
        return enemy;
    }

    spawnBoss() {
        const pool = [WALKER, ORB, DART];
        const type = pool[Math.floor(Math.random() * pool.length)];
        this.spawnEnemy(type, { boss: true });
    }

    pickType() {
        const orbWeight = Math.min(4, 1 + Math.floor((this.wave - 1) / 3));
        const dartWeight = Math.min(3, 1 + Math.floor((this.wave - 1) / 4));
        const types = [
            { ...WALKER, weight: 3 },
            { ...ORB, weight: orbWeight },
            { ...DART, weight: dartWeight },
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

            if (enemy.enemyType?.id === "dart" && enemy.y < enemy.stopY) {
                const { width } = this.scene.cameras.main;
                const margin = enemy.isBoss ? 64 : 28;
                const sway = enemy.isBoss ? 24 : 42;
                let vx = Math.sin(time / 240 + (enemy.swayPhase || 0)) * sway;
                if (enemy.x <= margin + 12) vx = Math.abs(vx);
                if (enemy.x >= width - margin - 12) vx = -Math.abs(vx);
                enemy.setVelocityX(vx);
                enemy.x = Phaser.Math.Clamp(enemy.x, margin, width - margin);
            }

            if (enemy.y >= enemy.stopY) {
                enemy.setVelocity(0, 0);
                enemy.y = enemy.stopY;
                enemy.x = Phaser.Math.Clamp(
                    enemy.x,
                    28,
                    this.scene.cameras.main.width - 28
                );

                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, aim.x, aim.y);
                enemy.setRotation(angle - Math.PI / 2);

                if (time >= enemy.nextFireAt) {
                    this.shootAtBase(enemy, aim, angle);
                    const delay = enemy.isBoss
                        ? Math.round(enemy.enemyType.fireDelay * BOSS_FIRE)
                        : enemy.enemyType.fireDelay;
                    enemy.nextFireAt = time + delay;
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
        const isBoss = Boolean(enemy.isBoss);
        const muzzle = isBoss ? 36 : 18;
        const startX = enemy.x + Math.cos(angle) * muzzle;
        const startY = enemy.y + Math.sin(angle) * muzzle;
        const dmgK = isBoss ? BOSS_DAMAGE : 1;

        this.projectiles.shoot(startX, startY, angle, {
            team: "enemy",
            textureKey: type.bulletKey,
            speed: type.bulletSpeed,
            width: isBoss ? 14 : 8,
            height: isBoss ? 26 : 16,
            depth: 2,
            damageMin: scaleByWave(type.damageMin, this.wave, WAVE_DMG_GROWTH) * STAT_SCALE * dmgK,
            damageMax: scaleByWave(type.damageMax, this.wave, WAVE_DMG_GROWTH) * STAT_SCALE * dmgK,
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
        if (enemy.enemyType?.id === "dart") {
            enemy.setTint(
                Phaser.Display.Color.GetColor(
                    Math.round(30 + 40 * ratio),
                    Math.round(70 + 90 * ratio),
                    Math.round(140 + 110 * ratio)
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
