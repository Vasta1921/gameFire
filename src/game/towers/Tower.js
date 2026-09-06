import { Turret } from "./Turret.js";

/** Башня внизу экрана и набор турелей на ней. */
export class Tower {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "tower",
            depth = 1,
            fireRateMs = 280,
            displayWidth = 90,
            displayHeight = 48,
            originX = 0.5,
            originY = 1,
            turretConfigs = [{ offsetX: 0, offsetY: -28 }],
        } = options;

        this.sprite = scene.physics.add.sprite(x, y, key);
        this.sprite.setOrigin(originX, originY);
        this.sprite.setDisplaySize(displayWidth, displayHeight);
        this.sprite.setImmovable(true);
        this.sprite.setDepth(depth);

        this.fireRateMs = fireRateMs;

        this.turrets = turretConfigs.map((cfg) => {
            const turretX = this.sprite.x + (cfg.offsetX ?? 0);
            const turretY = this.sprite.y + (cfg.offsetY ?? -displayHeight + 6);
            return new Turret(scene, turretX, turretY, cfg);
        });
    }

    update(pointer) {
        this.turrets.forEach((turret) => turret.update(pointer));
    }

    shootAll(projectileSystem, pointer) {
        this.turrets.forEach((turret) => turret.fireVolley(projectileSystem, pointer));
    }

    applyCombatStats(stats) {
        this.fireRateMs = stats.fireRateMs;
        this.turrets.forEach((turret) => {
            turret.damageMin = stats.damageMin;
            turret.damageMax = stats.damageMax;
            turret.spread = stats.spread;
            turret.pelletCount = stats.pelletCount || 1;
            turret.doubleChance = stats.doubleChance ?? 0;
            turret.multiChance = stats.multiChance ?? 0;
            turret.pierce = stats.pierce ?? 0;
            turret.pierceChance = stats.pierceChance ?? 0;
            turret.explodeChance = stats.explodeChance ?? 0;
            turret.homing = Boolean(stats.homing);
            turret.noCrit = Boolean(stats.noCrit);
            turret.critChance = stats.critChance ?? 0;
            turret.critMult = stats.critMult || 1.5;
            turret.straightChance = stats.straightChance ?? 0;
        });
    }

    /** Применяет апгрейд: скорострельность башни и параметры всех турелей. */
    applyUpgrade(upgrade = {}) {
        if (typeof upgrade.fireRateMs === "number") {
            this.fireRateMs = Math.max(120, upgrade.fireRateMs);
        }

        const turretFields = [
            "bulletSpeed",
            "spread",
            "muzzleOffset",
            "bulletWidth",
            "bulletHeight",
            "damageMin",
            "damageMax",
            "pelletCount",
        ];

        this.turrets.forEach((turret) => {
            turretFields.forEach((field) => {
                if (typeof upgrade[field] === "number") {
                    turret[field] = upgrade[field];
                }
            });
        });
    }
}
