import { STAT_SCALE, WAVE_DMG_GROWTH, WAVE_DMG_GROWTH_LATE, WAVE_HP_GROWTH, WAVE_HP_GROWTH_LATE, WAVE_REWARD_GROWTH, scaleByWave, waveEnemyPower } from "../progress/scaling.js";

const WALKER = {
    id: "walker",
    key: "enemyWalker",
    unlockWave: 1,
    title: "Зелёный разведчик",
    blurb: "Основной пехотинец осады.",
    trait: "Подходит к крепости и ведёт огонь.",
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
    unlockWave: 6,
    title: "Красный орб",
    blurb: "Держит дистанцию и бьёт издалека.",
    trait: "Останавливается в центре экрана.",
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
    unlockWave: 11,
    title: "Синий клин",
    blurb: "Быстрый и хрупкий перехватчик.",
    trait: "Скорость и виляние. Урон как у зелёных.",
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

const PENTAGON = {
    id: "pentagon",
    key: "enemyPentagon",
    unlockWave: 21,
    title: "Пятиугольник",
    blurb: "Медленный танк с щитом для всех своих.",
    trait: "Много HP. Аура брони снижает урон рядом.",
    weight: 1,
    hp: 14,
    speedY: 36,
    fireDelay: 1400,
    damageMin: 1,
    damageMax: 2,
    bulletSpeed: 260,
    bulletKey: "greenBullet",
    score: 22,
    coins: 8,
    armorAura: true,
    auraRadius: 128,
    auraColor: 0xcbd5e1,
};

const SQUARE = {
    id: "square",
    key: "enemySquare",
    unlockWave: 16,
    title: "Квадрат-медик",
    blurb: "Поддерживает строй лечением.",
    trait: "Аура лечения союзников рядом.",
    weight: 1,
    hp: 7,
    speedY: 52,
    fireDelay: 1250,
    damageMin: 1,
    damageMax: 1,
    bulletSpeed: 270,
    bulletKey: "greenBullet",
    score: 18,
    coins: 7,
    healAura: true,
    auraRadius: 118,
    auraColor: 0x4ade80,
};

export const ENEMY_ROSTER = [WALKER, ORB, DART, SQUARE, PENTAGON];

export function typesUnlockedAt(wave) {
    return ENEMY_ROSTER.filter((type) => wave >= (type.unlockWave || 1));
}

export function introForWave(wave) {
    return ENEMY_ROSTER.find((type) => type.unlockWave === wave) || null;
}

const SIZES = {
    walker: [26, 46],
    orb: [32, 36],
    dart: [22, 50],
    pentagon: [46, 46],
    square: [40, 40],
};

const ARMOR_RESIST = 0.45;

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
        this.types = options.types ?? ENEMY_ROSTER;
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
        const hp = Math.round(type.hp * STAT_SCALE * waveEnemyPower(this.wave, WAVE_HP_GROWTH, WAVE_HP_GROWTH_LATE) * (isBoss ? BOSS_HP : 1));

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

        const speed = Math.round(type.speedY * Math.min(2.5, waveEnemyPower(this.wave, 1.025, 1.035)) * (isBoss ? BOSS_SPEED : 1));
        enemy.setVelocity(0, speed);
        enemy.swayPhase = Math.random() * Math.PI * 2;
        enemy.nextHealAt = 0;
        this.attachAura(enemy);
        return enemy;
    }

    spawnBoss() {
        const pool = typesUnlockedAt(this.wave);
        const type = pool[Math.floor(Math.random() * pool.length)] || WALKER;
        this.spawnEnemy(type, { boss: true });
    }

    pickType() {
        const types = typesUnlockedAt(this.wave);
        const total = types.reduce((sum, type) => sum + type.weight, 0);
        let roll = Math.random() * total;
        for (const type of types) {
            roll -= type.weight;
            if (roll <= 0) return type;
        }
        return types[0] || WALKER;
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
                if (enemy.enemyType?.id !== "pentagon" && enemy.enemyType?.id !== "square") {
                    enemy.setRotation(angle - Math.PI / 2);
                }

                if (time >= enemy.nextFireAt) {
                    this.shootAtBase(enemy, aim, angle);
                    const delay = enemy.isBoss
                        ? Math.round(enemy.enemyType.fireDelay * BOSS_FIRE)
                        : enemy.enemyType.fireDelay;
                    enemy.nextFireAt = time + delay;
                }
            }

            this.updateAura(enemy, time);
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

        const dmgScale = waveEnemyPower(this.wave, WAVE_DMG_GROWTH, WAVE_DMG_GROWTH_LATE) * STAT_SCALE * dmgK;
        this.projectiles.shoot(startX, startY, angle, {
            team: "enemy",
            textureKey: type.bulletKey,
            speed: type.bulletSpeed,
            width: isBoss ? 14 : 8,
            height: isBoss ? 26 : 16,
            depth: 2,
            damageMin: Math.max(1, Math.round(type.damageMin * dmgScale)),
            damageMax: Math.max(1, Math.round(type.damageMax * dmgScale)),
        });
    }

    auraRadiusOf(enemy) {
        const r = enemy.enemyType?.auraRadius || 0;
        return enemy.isBoss ? Math.round(r * 1.65) : r;
    }

    attachAura(enemy) {
        const type = enemy.enemyType;
        if (!type?.armorAura && !type?.healAura) return;
        const color = type.auraColor || 0xffffff;
        const ring = this.scene.add.circle(enemy.x, enemy.y, this.auraRadiusOf(enemy), color, 0.1);
        ring.setStrokeStyle(2, color, 0.6);
        ring.setDepth(1.4);
        enemy.aura = ring;
    }

    updateAura(enemy, time) {
        if (enemy.aura?.active) {
            enemy.aura.setPosition(enemy.x, enemy.y);
            enemy.aura.setScale(1 + Math.sin(time / 280) * 0.05);
        }
        if (enemy.enemyType?.healAura && time >= (enemy.nextHealAt || 0)) {
            this.applyHealAura(enemy);
            enemy.nextHealAt = time + 480;
        }
    }

    clearAura(enemy) {
        if (enemy?.aura) {
            enemy.aura.destroy();
            enemy.aura = null;
        }
    }

    inArmorAura(target) {
        let armored = false;
        this.group.children.iterate((enemy) => {
            if (armored || !enemy?.active || !enemy.enemyType?.armorAura) return;
            const r = this.auraRadiusOf(enemy);
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            if (dx * dx + dy * dy <= r * r) armored = true;
        });
        return armored;
    }

    applyHealAura(healer) {
        const r = this.auraRadiusOf(healer);
        const r2 = r * r;
        this.group.children.iterate((enemy) => {
            if (!enemy?.active) return;
            const dx = enemy.x - healer.x;
            const dy = enemy.y - healer.y;
            if (dx * dx + dy * dy > r2) return;
            if (enemy.hp >= enemy.maxHp) return;
            const amount = Math.max(2, Math.round(enemy.maxHp * 0.016));
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + amount);
            this.applyHpTint(enemy);
        });
    }

    armorMitigate(enemy, damage) {
        if (!this.inArmorAura(enemy)) return damage;
        return Math.max(1, Math.round(damage * (1 - ARMOR_RESIST)));
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
        if (enemy.enemyType?.id === "pentagon") {
            enemy.setTint(
                Phaser.Display.Color.GetColor(
                    Math.round(70 + 80 * ratio),
                    Math.round(80 + 90 * ratio),
                    Math.round(100 + 80 * ratio)
                )
            );
            return;
        }
        if (enemy.enemyType?.id === "square") {
            enemy.setTint(
                Phaser.Display.Color.GetColor(
                    Math.round(20 + 40 * ratio),
                    Math.round(90 + 140 * ratio),
                    Math.round(40 + 60 * ratio)
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
