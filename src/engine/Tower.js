import { Turret } from "./Turret.js";

export class Tower {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        const {
            towerKey = "tower",
            fireRateMs = 150,
            turretConfigs = [
                // Пример:
                // { offsetX: 0, offsetY: -10, rotationOffset: 0 }
            ],
        } = options;

        // Башня как "тело" для размещения турелей.
        // Пока без коллизий, но можно будет подключить позже.
        this.sprite = scene.physics.add.sprite(x, y, towerKey);
        this.sprite.setImmovable(true);
        this.sprite.setDepth(1);

        // Турели
        this.turrets = turretConfigs.map(cfg => {
            const offsetX = cfg.offsetX ?? 0;
            const offsetY = cfg.offsetY ?? -10;
            const rotationOffset = cfg.rotationOffset ?? 0;

            const turret = new Turret(
                scene,
                this.sprite.x + offsetX,
                this.sprite.y + offsetY,
                cfg.turretKey ?? "turret",
                rotationOffset
            );

            // Поддержка будущих апгрейдов через параметры выстрела.
            if (typeof cfg.muzzleOffset === "number") turret.muzzleOffset = cfg.muzzleOffset;
            if (typeof cfg.spread === "number") turret.spread = cfg.spread;
            if (typeof cfg.bulletSpeed === "number") turret.bulletSpeed = cfg.bulletSpeed;
            if (typeof cfg.bulletWidth === "number") turret.bulletWidth = cfg.bulletWidth;
            if (typeof cfg.bulletHeight === "number") turret.bulletHeight = cfg.bulletHeight;

            return turret;
        });

        // Апгрейды будут менять это значение, а сцена будет читать его для таймера.
        this.fireRateMs = fireRateMs;
    }

    update(pointer) {
        this.turrets.forEach(turret => turret.update(pointer));
    }

    shootAll(bulletManager) {
        this.turrets.forEach(turret => turret.shoot(bulletManager));
    }

    // upgrade может быть объектом с полями:
    // - fireRateMs
    // - bulletSpeed, spread, muzzleOffset, bulletWidth, bulletHeight (применяются ко всем турелям)
    applyUpgrade(upgrade = {}) {
        if (typeof upgrade.fireRateMs === "number") {
            this.fireRateMs = upgrade.fireRateMs;
        }

        const turretFields = [
            "bulletSpeed",
            "spread",
            "muzzleOffset",
            "bulletWidth",
            "bulletHeight",
        ];

        this.turrets.forEach(turret => {
            turretFields.forEach(field => {
                if (typeof upgrade[field] === "number") {
                    turret[field] = upgrade[field];
                }
            });
        });
    }
}

