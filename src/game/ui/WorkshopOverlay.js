import { loadProgress } from "../progress/Progress.js";
import { addFichcoinBadge } from "./FichcoinBadge.js";
import { addUpgradeRows } from "./upgradeRows.js";

/** Мастерская поверх боя — без отдельной Phaser-сцены, чтобы не зависать. */
export class WorkshopOverlay {
    constructor(scene, options) {
        this.scene = scene;
        this.victory = Boolean(options.victory);
        this.clearedWave = options.clearedWave ?? 1;
        this.onContinue = options.onContinue;
        this.onMenu = options.onMenu;
        this.root = scene.add.container(0, 0);
        this.root.setDepth(30);

        const { width, height } = scene.cameras.main;
        const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x050508, 0.82);
        dim.setInteractive();
        this.root.add(dim);

        const heading = "Мастерская";
        const title = scene.add.text(width / 2, 90, heading, {
            fontSize: "46px",
            fill: this.victory ? "#fbbf24" : "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const sub = scene.add.text(width / 2, 145, this.victory
            ? "Босс повержен. Можно улучшить оружие"
            : `Волна ${this.clearedWave} пройдена`, {
            fontSize: "24px",
            fill: "#c4b5a5",
        }).setOrigin(0.5);

        this.root.add([title, sub]);

        this.coinBadge = addFichcoinBadge(scene, width / 2 - 40, 200, loadProgress().coins, {
            scale: 0.6,
            fontSize: "30px",
            depth: 31,
        });
        this.root.add([this.coinBadge.icon, this.coinBadge.text]);

        this.listRoot = scene.add.container(0, 0);
        this.root.add(this.listRoot);
        this.rebuildList();

        const next = scene.add.text(width / 2, height - 90, this.victory ? "В меню" : "Дальше", {
            fontSize: "34px",
            fill: "#111111",
            backgroundColor: "#ff6b4a",
            padding: { x: 32, y: 14 },
        }).setOrigin(0.5);
        next.setInteractive({ useHandCursor: true });
        next.on("pointerup", () => this.close());
        next.on("pointerover", () => next.setStyle({ backgroundColor: "#ff8a6a" }));
        next.on("pointerout", () => next.setStyle({ backgroundColor: "#ff6b4a" }));
        this.root.add(next);
    }

    rebuildList() {
        this.listRoot.removeAll(true);
        this.coinBadge.setAmount(loadProgress().coins);
        const nodes = addUpgradeRows(
            this.scene,
            this.scene.cameras.main.width / 2,
            320,
            loadProgress(),
            () => this.rebuildList()
        );
        this.listRoot.add(nodes);
    }

    close() {
        this.root.destroy(true);
        if (this.victory) {
            this.onMenu();
            return;
        }
        this.onContinue();
    }
}
