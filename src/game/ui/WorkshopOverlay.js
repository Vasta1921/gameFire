import { loadProgress } from "../progress/Progress.js";
import { addFichcoinBadge } from "./FichcoinBadge.js";
import { addShopPanel } from "./upgradeRows.js";

/** Мастерская поверх боя — без отдельной Phaser-сцены, чтобы не зависать. */
export class WorkshopOverlay {
    constructor(scene, options) {
        this.scene = scene;
        this.blockClear = Boolean(options.blockClear);
        this.clearedWave = options.clearedWave ?? 1;
        this.onContinue = options.onContinue;
        this.onMenu = options.onMenu;
        this.root = scene.add.container(0, 0);
        this.root.setDepth(30);

        const { width, height } = scene.cameras.main;
        const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x050508, 0.82);
        dim.setInteractive();
        this.root.add(dim);

        const title = scene.add.text(width / 2, 70, "Мастерская", {
            fontSize: "42px",
            fill: this.blockClear ? "#fbbf24" : "#ff6b4a",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const nextBlock = this.clearedWave + 1;
        const sub = scene.add.text(width / 2, 118, this.blockClear
            ? `Босс волны ${this.clearedWave} повержен. Дальше — с ${nextBlock}`
            : `Волна ${this.clearedWave} пройдена`, {
            fontSize: "22px",
            fill: "#c4b5a5",
            align: "center",
            wordWrap: { width: 640 },
        }).setOrigin(0.5);

        this.root.add([title, sub]);

        this.coinBadge = addFichcoinBadge(scene, width / 2 - 40, 165, loadProgress().coins, {
            scale: 0.55,
            fontSize: "28px",
            depth: 31,
        });
        this.root.add([this.coinBadge.icon, this.coinBadge.text]);

        this.shopGroup = "shoot";
        this.listRoot = scene.add.container(0, 0);
        this.root.add(this.listRoot);
        this.rebuildList();

        if (this.blockClear) {
            this.addButton(width / 2, height - 150, 420, 64, 0xff6b4a, "#111111", "Дальше (усиления с собой)", () => {
                this.root.destroy(true);
                this.onContinue();
            });
            this.addButton(width / 2, height - 70, 420, 56, 0x52525b, "#ffe8d6", "В меню (без усилений)", () => {
                this.root.destroy(true);
                this.onMenu();
            });
        } else {
            this.addButton(width / 2, height - 80, 280, 64, 0xff6b4a, "#111111", "Дальше", () => {
                this.root.destroy(true);
                this.onContinue();
            });
        }
    }

    addButton(x, y, w, h, fill, textColor, label, onClick) {
        const box = this.scene.add.rectangle(x, y, w, h, fill, 1);
        box.setInteractive({ useHandCursor: true });
        const text = this.scene.add.text(x, y, label, {
            fontSize: "24px",
            fill: textColor,
            fontStyle: "bold",
        }).setOrigin(0.5);
        box.on("pointerup", onClick);
        this.root.add([box, text]);
    }

    rebuildList() {
        this.listRoot.removeAll(true);
        this.coinBadge.setAmount(loadProgress().coins);
        const nodes = addShopPanel(this.scene, {
            x: this.scene.cameras.main.width / 2,
            tabY: 218,
            listY: 300,
            groupId: this.shopGroup,
            progress: loadProgress(),
            onBought: () => this.rebuildList(),
            onGroupChange: (id) => {
                this.shopGroup = id;
                this.rebuildList();
            },
        });
        this.listRoot.add(nodes);
    }
}
