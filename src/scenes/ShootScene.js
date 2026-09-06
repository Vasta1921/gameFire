import { createGameTextures } from "../game/utils/createGameTextures.js";
import { ProjectileSystem } from "../game/bullets/ProjectileSystem.js";
import { EnemyManager, introForWave } from "../game/enemies/EnemyManager.js";
import { Tower } from "../game/towers/Tower.js";
import { Base } from "../game/base/Base.js";
import { AutoFireController } from "../game/combat/AutoFireController.js";
import {
    setupBulletEnemyCollision,
    setupBulletBaseCollision,
    setupOverlap,
} from "../game/combat/setupBulletEnemyCollision.js";
import { Hud } from "../game/ui/Hud.js";
import { WorkshopOverlay } from "../game/ui/WorkshopOverlay.js";
import { WavePickOverlay } from "../game/ui/WavePickOverlay.js";
import { EnemyIntroOverlay } from "../game/ui/EnemyIntroOverlay.js";
import { ExplosionFx } from "../game/fx/ExplosionFx.js";
import { SpaceBackdrop } from "../game/fx/SpaceBackdrop.js";
import { getSoundFx } from "../game/audio/SoundFx.js";
import { addCoins, getCombatStats, getBaseMaxHp, loadProgress, getUnlockedStartWave, recordWaveCleared, isBossWave, bumpCareerStats, finishRunRecord, resumeIdleClock, hasSeenEnemyIntro, markEnemyIntroSeen, isSniperUnlocked, wavesClearedCount } from "../game/progress/Progress.js";
import { STAT_SCALE } from "../game/progress/scaling.js";
import { createRunMods, mergeCombatStats, pickThreeUpgrades } from "../game/progress/WavePicks.js";

const SNIPER_AMMO = 10;
const SNIPER_TARGETS = 10;
const SNIPER_REWARD_MIN = 7;
const SNIPER_REWARD_CAP = 700;
const SNIPER_REWARD_SHARE = {
    7: 250 / 700,
    8: 400 / 700,
    9: 550 / 700,
    10: 1,
};

function sniperRewardFor(kills) {
    const share = SNIPER_REWARD_SHARE[kills];
    if (!share) return 0;
    const max = Math.min(SNIPER_REWARD_CAP, 70 * Math.max(1, wavesClearedCount()));
    return Math.round(max * share);
}

/** Главная сцена: крепость, стена, враги и HUD. */
export class ShootScene extends Phaser.Scene {
    constructor() {
        super("ShootScene");
    }

    init(data) {
        this.menuStartWave = data?.startWave ?? getUnlockedStartWave();
        this.gameMode = data?.mode === "sniper" ? "sniper" : "campaign";
        this.sniperMode = this.gameMode === "sniper";
        this.sniperAmmo = SNIPER_AMMO;
        this.sniperDebug = Boolean(data?.debugSniper);
    }

    preload() {
        // Текстуры рисуются в create() через Graphics — PNG больше не грузим.
    }

    create() {
        if (this.sniperMode && !this.sniperDebug && !isSniperUnlocked()) {
            this.scene.start("MenuScene");
            return;
        }
        this.isGameOver = false;
        this.isRestarting = false;
        this.isPaused = false;
        this.betweenWaves = false;
        this.workshop = null;
        this.wavePick = null;
        this.enemyIntro = null;
        this.currentWave = this.menuStartWave || 1;
        this.runMods = createRunMods();
        this.runFinished = false;
        this.runLog = {
            kills: 0,
            bosses: 0,
            coins: 0,
            wavesCleared: 0,
            shots: 0,
        };
        this.sfx = getSoundFx(this.game);
        createGameTextures(this);

        this.backdrop = new SpaceBackdrop(this);

        this.playerShots = new ProjectileSystem(this, {
            textureKey: "redBullet",
            maxSize: 80,
        });

        this.enemyShots = new ProjectileSystem(this, {
            textureKey: "greenBullet",
            maxSize: 120,
            trailTint: [0x22ff55, 0x88ffaa, 0xddffee],
        });

        this.explosions = new ExplosionFx(this);

        this.base = new Base(this, { maxHp: getBaseMaxHp(), depth: 1 });

        this.enemyManager = new EnemyManager(this, {
            projectiles: this.enemyShots,
            base: this.base,
            onWaveClear: (wave) => this.handleWaveClear(wave),
        });

        this.tower = new Tower(this, this.cameras.main.centerX, this.base.platformY, {
            key: "tower",
            depth: 2,
            fireRateMs: 280,
            displayWidth: 90,
            displayHeight: 48,
            turretConfigs: this.sniperMode
                ? [{
                    offsetX: 0,
                    offsetY: -28,
                    key: "sniperTurret",
                    depth: 3,
                    spread: 8,
                    muzzleOffset: 118,
                    displayWidth: 28,
                    displayHeight: 122,
                    bulletSpeed: 1200,
                    damageMin: STAT_SCALE,
                    damageMax: STAT_SCALE * 3,
                }]
                : [{
                    offsetX: 0,
                    offsetY: -28,
                    key: "turret",
                    depth: 3,
                    spread: 8,
                    muzzleOffset: 50,
                    displayWidth: 36,
                    displayHeight: 52,
                    bulletSpeed: 1000,
                    damageMin: STAT_SCALE,
                    damageMax: STAT_SCALE * 3,
                }],
        });
        this.applyRunStats();

        this.hud = new Hud(this, { onPause: () => this.togglePause() });
        this.hud.setBaseHp(this.base.hp, this.base.maxHp);
        if (this.sniperMode) {
            this.backdrop.setSpawnsPaused(true);
            this.refreshSniperHud();
            this.enemyManager.startSniperRound(SNIPER_TARGETS);
        } else {
            this.hud.setWave(this.currentWave);
            this.maybeEnemyIntro(this.currentWave, () => {
                this.physics.resume();
                this.betweenWaves = false;
                this.hud.setPauseVisible(true);
                this.enemyManager.startWave(this.currentWave);
            });
        }

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
        setupOverlap(
            this,
            this.playerShots.group,
            this.backdrop.meteorGroup,
            this.handleBulletMeteorHit
        );

        this.autoFire = new AutoFireController(this, {
            getDelay: () => this.tower.fireRateMs,
            onShoot: this.shootFromTower.bind(this),
        });

        this.input.on("pointerdown", (pointer, currentlyOver) => {
            this.sfx.unlock();
            if (currentlyOver?.some((obj) => obj === this.hud.pauseBtn)) return;
            if (this.isGameOver || this.betweenWaves || this.isPaused || this.enemyIntro) return;
            if (this.sniperMode) {
                this.shootFromTower();
                return;
            }
            this.autoFire.start();
        });
        this.input.on("pointerup", () => this.autoFire.stop());
        this.input.on("pointerout", () => this.autoFire.stop());
    }

    update(time, delta) {
        this.backdrop.update(time, delta);
        if (this.isGameOver || this.betweenWaves || this.isPaused) return;

        const pointer = this.input.activePointer;
        this.tower.update(pointer);
        this.playerShots.update(this.cameras.main, this.enemyManager.group);
        this.enemyShots.update(this.cameras.main);
        this.enemyManager.update(time);
        this.tickRepair(delta);
        this.checkSniperFail();
    }

    tickRepair(delta) {
        const rate = this.regenPerSec || 0;
        if (rate <= 0 || !this.base || this.base.hp <= 0) return;
        if (this.base.hp >= this.base.maxHp) {
            this.regenAcc = 0;
            return;
        }
        this.regenAcc = (this.regenAcc || 0) + rate * (delta / 1000);
        if (this.regenAcc < 1) return;
        const healed = Math.floor(this.regenAcc);
        this.regenAcc -= healed;
        const before = this.base.hp;
        this.base.repair(healed);
        if (this.base.hp !== before) {
            this.hud.setBaseHp(this.base.hp, this.base.maxHp);
        }
    }

    shootFromTower() {
        if (this.isGameOver || this.betweenWaves || this.isPaused) return;
        if (this.sniperMode && this.sniperAmmo <= 0) return;
        const pointer = this.input.activePointer;
        this.tower.shootAll(this.playerShots, pointer);
        this.sfx.shoot();
        this.runLog.shots += 1;
        if (this.sniperMode) {
            this.sniperAmmo -= 1;
            this.refreshSniperHud();
        }
    }

    /** Попадание игрока: урон с башни, враг падает при hp ≤ 0. */
    handleBulletEnemyHit(bullet, enemy) {
        if (this.isGameOver || this.betweenWaves || !bullet.active || !enemy.active) return;
        if (bullet.team === "enemy") return;
        if (bullet.hitList?.includes(enemy)) return;

        if (!bullet.hitList) bullet.hitList = [];
        bullet.hitList.push(enemy);
        bullet.lastHit = enemy;

        const damage = bullet.damage ?? 1;
        const hitX = bullet.x;
        const hitY = bullet.y;

        this.playerShots.sparkBurst(hitX, hitY, 3);
        this.damageEnemy(enemy, damage, hitX, hitY);

        if (bullet.explodes && !bullet.didSplash) {
            bullet.didSplash = true;
            this.explosions.boom(hitX, hitY);
            this.splashNearby(enemy, hitX, hitY, Math.max(1, Math.round(damage * 0.4)));
        }

        if ((bullet.pierce ?? 0) > 0) {
            bullet.pierce -= 1;
            return;
        }

        this.playerShots.recycle(bullet);
    }

    enemyBurstKind(enemy) {
        if (enemy.enemyType?.id === "orb") return "red";
        if (enemy.enemyType?.id === "dart") return "blue";
        if (enemy.enemyType?.id === "pentagon") return "blue";
        return "green";
    }

    damageEnemy(enemy, damage, x, y, options = {}) {
        if (!enemy?.active) return;
        const dealt = this.enemyManager.armorMitigate(enemy, damage);
        enemy.hp = (enemy.hp ?? 5) - dealt;
        if (enemy.hp > 0) {
            this.enemyManager.applyHpTint(enemy);
            return;
        }

        const kind = this.enemyBurstKind(enemy);
        if (!options.quiet) {
            this.explosions.burst(x ?? enemy.x, y ?? enemy.y, kind);
            this.sfx.explode(kind);
        }
        this.hud.addScore(enemy.scoreValue ?? 10);
        if (!this.sniperMode) {
            this.grantCoins(enemy.coinValue ?? enemy.enemyType?.coins ?? 3, enemy.x, enemy.y);
        }
        this.runLog.kills += 1;
        if (this.sniperMode) this.refreshSniperHud();
        bumpCareerStats({ kills: 1 });
        if (enemy.isBoss) {
            this.runLog.bosses += 1;
            bumpCareerStats({ bosses: 1 });
        }
        this.enemyManager.clearAura(enemy);
        enemy.destroy();
    }

    splashNearby(fromEnemy, x, y, splashDamage) {
        const radiusSq = 88 * 88;
        const victims = [];
        const list = this.enemyManager.group.getChildren();
        for (let i = 0; i < list.length; i += 1) {
            const enemy = list[i];
            if (!enemy?.active || enemy === fromEnemy) continue;
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            if (dx * dx + dy * dy <= radiusSq) {
                victims.push(enemy);
                if (victims.length >= 8) break;
            }
        }
        for (let i = 0; i < victims.length; i += 1) {
            this.damageEnemy(victims[i], splashDamage, victims[i].x, victims[i].y, { quiet: true });
        }
    }

    applyRunStats() {
        const stats = mergeCombatStats(getCombatStats(), this.runMods);
        if (this.sniperMode) {
            stats.pelletCount = 1;
            stats.doubleChance = 0;
            stats.multiChance = 0;
            stats.pierce = 0;
            stats.pierceChance = 0;
            stats.explodeChance = 0;
            stats.homing = false;
            stats.spread = 0;
            stats.damageMin = Math.max(stats.damageMin, 4);
            stats.damageMax = Math.max(stats.damageMax, 4);
        }
        this.tower.applyCombatStats(stats);
        this.regenPerSec = this.sniperMode ? 0 : stats.regenPerSec || 0;
        this.waveHeal = stats.waveHeal || 0;
    }

    /** Особый приз: попадание в метеорит. */
    handleBulletMeteorHit(bullet, meteor) {
        if (this.isGameOver || this.betweenWaves || !bullet.active || !meteor.active) return;
        if (bullet.team === "enemy") return;

        const hitX = meteor.x;
        const hitY = meteor.y;
        this.playerShots.recycle(bullet);
        this.explosions.burst(hitX, hitY, "red");
        this.sfx.explode("red");
        this.hud.addScore(meteor.prizeScore ?? 25);
        this.grantCoins(meteor.prizeCoins ?? 20, hitX, hitY);
        meteor.destroy();
    }

    grantCoins(amount, x, y) {
        const gained = Math.max(0, Math.floor(amount));
        const total = addCoins(gained);
        this.runLog.coins += gained;
        if (gained > 0) bumpCareerStats({ coinsEarned: gained });
        this.hud.setCoins(total);
        this.hud.flyCoins(x, y, amount);
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

    refreshSniperHud() {
        this.hud.setSniperStatus(this.sniperAmmo, this.runLog.kills, SNIPER_TARGETS);
    }

    checkSniperFail() {
        if (!this.sniperMode || this.isGameOver || this.betweenWaves) return;
        if (this.sniperAmmo > 0) return;
        if (this.playerShots.group.countActive(true) > 0) return;
        if (this.runLog.kills >= SNIPER_REWARD_MIN) {
            this.finishSniperWin();
            return;
        }
        this.endGame({
            title: "Промах",
            titleColor: "#ff6b4a",
            subtitle: `${this.runLog.kills} из ${SNIPER_TARGETS} · награда с ${SNIPER_REWARD_MIN} попаданий`,
        });
    }

    finishSniperWin() {
        this.betweenWaves = true;
        this.autoFire.stop();
        this.hud.setPauseVisible(false);
        const kills = this.runLog.kills;
        const reward = sniperRewardFor(kills);
        const { width, height } = this.cameras.main;
        if (reward > 0) this.grantCoins(reward, width / 2, height * 0.42);
        const headline = kills >= SNIPER_TARGETS ? "Все 10 в цель!" : `${kills} из ${SNIPER_TARGETS}`;
        this.hud.announceWaveClear(headline);
        this.explosions.fireworks();
        this.sfx.explode("red");
        this.time.delayedCall(180, () => this.sfx.explode("green"));
        this.time.delayedCall(360, () => this.sfx.explode("blue"));
        this.time.delayedCall(1700, () => {
            if (this.isGameOver) return;
            this.endGame({
                title: "Снайпер",
                titleColor: "#4ade80",
                subtitle: `Награда ${reward} · ${kills} из ${SNIPER_TARGETS}`,
            });
        });
    }

    handleWaveClear(wave) {
        if (this.isGameOver || this.betweenWaves) return;
        if (this.sniperMode) {
            if (this.runLog.kills >= SNIPER_REWARD_MIN) this.finishSniperWin();
            else {
                this.endGame({
                    title: "Промах",
                    titleColor: "#ff6b4a",
                    subtitle: `${this.runLog.kills} из ${SNIPER_TARGETS} · награда с ${SNIPER_REWARD_MIN} попаданий`,
                });
            }
            return;
        }

        this.betweenWaves = true;
        this.autoFire.stop();
        this.nextWave = wave + 1;
        this.hud.setPauseVisible(false);
        recordWaveCleared(wave);
        this.runLog.wavesCleared += 1;
        bumpCareerStats({ wavesCleared: 1 });
        if ((this.waveHeal || 0) > 0 && this.base && !this.base.isDestroyed()) {
            this.base.repair(this.waveHeal);
            this.hud.setBaseHp(this.base.hp, this.base.maxHp);
        }
        if (this.isPaused) {
            this.hud.hidePause();
            this.isPaused = false;
        }

        this.time.delayedCall(0, () => {
            if (this.isGameOver) return;
            this.playerShots.recycleAll();
            this.enemyShots.recycleAll();
            this.backdrop.setSpawnsPaused(true);
            this.celebrateWave(wave);
            this.time.delayedCall(1700, () => {
                if (this.isGameOver) return;
                this.openAfterWave(wave);
            });
        });
    }

    celebrateWave(wave) {
        this.hud.announceWaveClear(wave);
        this.explosions.fireworks();
        this.sfx.explode("red");
        this.time.delayedCall(180, () => this.sfx.explode("green"));
        this.time.delayedCall(360, () => this.sfx.explode("blue"));
    }

    openAfterWave(wave) {
        if (this.workshop || this.wavePick) return;
        if (isBossWave(wave)) {
            this.physics.pause();
            this.workshop = new WorkshopOverlay(this, {
                clearedWave: wave,
                blockClear: true,
                onContinue: () => this.continueFromWorkshop(),
                onMenu: () => this.goToMenu(),
            });
            return;
        }
        if (wave % 2 === 1) {
            this.wavePick = new WavePickOverlay(this, {
                clearedWave: wave,
                picks: pickThreeUpgrades(),
                onPick: (pick) => this.takeWavePick(pick),
            });
            return;
        }
        this.beginNextWave();
    }

    togglePause() {
        if (this.isGameOver || this.betweenWaves || this.workshop || this.wavePick || this.enemyIntro) return;
        if (this.isPaused) {
            this.resumeFromPause();
            return;
        }
        this.isPaused = true;
        this.autoFire.stop();
        this.physics.pause();
        this.backdrop.setSpawnsPaused(true);
        this.hud.showPause(
            () => this.resumeFromPause(),
            () => this.goToMenu()
        );
    }

    resumeFromPause() {
        if (!this.isPaused || this.isGameOver) return;
        this.isPaused = false;
        this.hud.hidePause();
        this.physics.resume();
        this.backdrop.setSpawnsPaused(this.sniperMode);
    }

    takeWavePick(pick) {
        if (this.isGameOver) return;
        this.wavePick = null;
        pick.apply(this.runMods, this);
        this.applyRunStats();
        this.beginNextWave();
    }

    maybeEnemyIntro(wave, onDone) {
        const type = introForWave(wave);
        if (!type || hasSeenEnemyIntro(type.id)) {
            onDone();
            return;
        }
        this.betweenWaves = true;
        this.autoFire?.stop();
        this.physics.pause();
        this.hud?.setPauseVisible(false);
        this.enemyIntro = new EnemyIntroOverlay(this, {
            type,
            onClose: () => {
                markEnemyIntroSeen(type.id);
                this.enemyIntro = null;
                onDone();
            },
        });
    }

    beginNextWave() {
        this.maybeEnemyIntro(this.nextWave, () => {
            this.backdrop.setSpawnsPaused(false);
            this.physics.resume();
            this.betweenWaves = false;
            this.currentWave = this.nextWave;
            this.hud.setWave(this.currentWave);
            this.hud.setPauseVisible(true);
            this.enemyManager.startWave(this.currentWave);
        });
    }

    continueFromWorkshop() {
        if (this.isGameOver) return;

        this.workshop = null;
        this.applyRunStats();
        this.hud.setCoins(loadProgress().coins);
        this.beginNextWave();
    }

    endGame(options = {}) {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.autoFire.stop();
        this.enemyManager.pause();
        this.physics.pause();
        this.backdrop.setSpawnsPaused(true);
        this.hud.setPauseVisible(false);
        this.hud.hidePause();
        this.finishRunOnce();
        this.hud.showGameOver(
            () => this.tryRestart(),
            () => this.goToMenu(),
            this.runLog,
            options
        );
    }

    finishRunOnce() {
        if (this.runFinished) return;
        this.runFinished = true;
        finishRunRecord({
            score: this.hud.score,
            wave: this.currentWave,
            shots: this.runLog.shots,
        });
    }

    tryRestart() {
        if (!this.isGameOver || this.isRestarting) return;
        this.isRestarting = true;
        this.physics.resume();
        this.scene.restart({
            startWave: this.menuStartWave,
            mode: this.gameMode,
            debugSniper: this.sniperDebug,
        });
    }

    goToMenu() {
        if (this.isRestarting) return;
        this.isRestarting = true;
        this.finishRunOnce();
        this.isPaused = false;
        this.autoFire.stop();
        this.physics.resume();
        resumeIdleClock();
        this.scene.start("MenuScene");
    }
}
