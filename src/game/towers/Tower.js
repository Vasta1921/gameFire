import { Turret } from "./Turret.js";

export class Tower {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;

        const {
            key = "tower",
            depth = 1,
            fireRateMs = 150,
            turretConfigs = [{ offsetX: 0, offsetY: -10 }],
        } = options;

        this.sprite = scene.physics.add.sprite(x, y, key);
        this.sprite.setImmovable(true);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(depth);

        this.fireRateMs = fireRateMs;

        this.turrets = turretConfigs.map((cfg) => {
            const turretX = this.sprite.x + (cfg.offsetX ?? 0);
            const turretY = this.sprite.y + (cfg.offsetY ?? -10);
            return new Turret(scene, turretX, turretY, cfg);
        });
    }

    update(pointer) {
        this.turrets.forEach((turret) => turret.update(pointer));
    }

    shootAll(projectileSystem, pointer) {
        this.turrets.forEach((turret) => turret.shoot(projectileSystem, pointer));
    }

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

