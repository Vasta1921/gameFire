import { Turret } from "./Turret.js";

/** Башня внизу экрана и набор турелей на ней. */
export class Tower {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "tower",
            depth = 1,
            fireRateMs = 150,
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
        this.turrets.forEach((turret) => turret.shoot(projectileSystem, pointer));
    }

    /** Применяет апгрейд: скорострельность башни и параметры всех турелей. */
    applyUpgrade(upgrade = {}) {
        if (typeof upgrade.fireRateMs === "number") {
            this.fireRateMs = Math.max(30, upgrade.fireRateMs);
        }

        const turretFields = [
            "bulletSpeed",
            "spread",
            "muzzleOffset",
            "bulletWidth",
            "bulletHeight",
            "damageMin",
            "damageMax",
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
