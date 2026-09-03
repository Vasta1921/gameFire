import { createTexture } from "./createTexture.js";
import { createBulletTexture, createSparkTexture } from "./createBulletTexture.js";

/** Все игровые текстуры вместо PNG. Крупный холст + маленький display = глаже край. */
export function createGameTextures(scene) {
    createBackgroundTexture(scene);
    createTowerTexture(scene);
    createTurretTexture(scene);
    createWallTexture(scene);
    createWalkerTexture(scene);
    createOrbTexture(scene);
    createBulletTexture(scene, "redBullet", 64, 128);
    createBulletTexture(scene, "greenBullet", 64, 128, {
        glow: 0x1aff44,
        outer: 0x12a832,
        body: 0x33dd55,
        inner: 0x88ff99,
        core: 0xeaffea,
    });
    createSparkTexture(scene, "spark");
    createSparkTexture(scene, "sparkRed");
    createSparkTexture(scene, "sparkGreen", {
        glow: 0x16a34a,
        mid: 0x4ade80,
        core: 0xecfccb,
    });
}

function createBackgroundTexture(scene) {
    const width = 720;
    const height = 1280;

    createTexture(scene, "background", width, height, (g) => {
        g.fillStyle(0x08081a, 1);
        g.fillRect(0, 0, width, height);

        g.fillStyle(0x1a0a25, 0.35);
        g.fillEllipse(120, 980, 420, 260, 48);
        g.fillEllipse(560, 420, 380, 240, 48);
        g.fillStyle(0x0c1230, 0.4);
        g.fillEllipse(360, 200, 500, 180, 48);

        const random = mulberry32(20260903);

        for (let i = 0; i < 420; i += 1) {
            const x = Math.floor(random() * width);
            const y = Math.floor(random() * height);
            const shade = random();
            const color = shade > 0.7 ? 0xc8d8ff : shade > 0.35 ? 0xffffff : 0x8a9bb8;
            g.fillStyle(color, 0.55 + shade * 0.45);
            g.fillRect(x, y, 1, 1);
        }

        for (let i = 0; i < 28; i += 1) {
            const x = Math.floor(random() * (width - 4)) + 2;
            const y = Math.floor(random() * (height - 4)) + 2;
            g.fillStyle(0xf4f7ff, 0.95);
            g.fillRect(x, y, 1, 1);
            g.fillRect(x - 1, y, 1, 1);
            g.fillRect(x + 1, y, 1, 1);
            g.fillRect(x, y - 1, 1, 1);
            g.fillRect(x, y + 1, 1, 1);
        }
    });
}

/** Гарнизон: полукруг на заборе (низ текстуры обрезает круг — получается купол). */
function createTowerTexture(scene) {
    const w = 270;
    const h = 144;
    const cx = w / 2;
    const cy = h;
    const r = w / 2 - 4;

    createTexture(scene, "tower", w, h, (g) => {
        g.fillStyle(0x070707, 1);
        g.fillCircle(cx, cy, r);
        g.fillStyle(0x1c1410, 1);
        g.fillCircle(cx, cy, r - 10);
        g.fillStyle(0x2e1c16, 1);
        g.fillCircle(cx, cy, r - 24);

        g.fillStyle(0x5a1408, 1);
        g.fillRect(18, h - 16, w - 36, 16);
        g.fillStyle(0xff3a12, 0.95);
        g.fillRect(22, h - 12, w - 44, 7);
        g.fillStyle(0xffc266, 0.7);
        g.fillRect(40, h - 10, w - 80, 3);

        g.fillStyle(0xff2200, 0.95);
        g.fillRoundedRect(cx - 8, 28, 16, 78, 6);
        g.fillRoundedRect(cx - 8, 70, 64, 14, 5);
        g.fillStyle(0xff7a22, 1);
        g.fillRect(cx - 4, 36, 8, 62);
        g.fillStyle(0xffe08a, 0.85);
        g.fillRect(cx - 2, 40, 4, 22);
    });
}

/** Ствол 3×, на экране уменьшаем. */
function createTurretTexture(scene) {
    const w = 96;
    const h = 192;
    createTexture(scene, "turret", w, h, (g) => {
        g.fillStyle(0x0a0a0a, 1);
        g.fillRoundedRect(18, 36, 60, 150, 16);
        g.fillStyle(0x241814, 1);
        g.fillRoundedRect(24, 48, 48, 128, 14);
        g.fillStyle(0x3a2218, 1);
        g.fillRoundedRect(32, 64, 32, 96, 10);

        g.fillStyle(0x7a1208, 1);
        g.fillRoundedRect(22, 12, 52, 56, 14);
        g.fillStyle(0xff2a00, 1);
        g.fillRoundedRect(28, 0, 40, 52, 12);
        g.fillStyle(0xff7a22, 1);
        g.fillRoundedRect(34, 0, 28, 28, 10);
        g.fillStyle(0xffe08a, 1);
        g.fillRoundedRect(40, 0, 16, 12, 6);

        g.fillStyle(0x111111, 1);
        g.fillRoundedRect(12, 156, 72, 36, 10);
        g.fillStyle(0xff3300, 0.75);
        g.fillRoundedRect(28, 168, 40, 12, 4);
    });
}

/** Забор 2× по разрешению, на экране 720×72. */
function createWallTexture(scene) {
    const width = 1440;
    const height = 144;

    createTexture(scene, "wall", width, height, (g) => {
        g.fillStyle(0x070707, 1);
        g.fillRect(0, 36, width, 108);
        g.fillStyle(0x1c1612, 1);
        g.fillRect(0, 48, width, 88);
        g.fillStyle(0x3a1810, 1);
        g.fillRect(0, 40, width, 14);
        g.fillStyle(0xff2a00, 0.9);
        g.fillRect(0, 44, width, 5);
        g.fillStyle(0xffcc66, 0.45);
        g.fillRect(0, 45, width, 2);

        for (let i = -12; i <= 12; i += 1) {
            const postW = 44;
            const step = 120;
            const x = width / 2 - postW / 2 + i * step;
            if (x < -postW || x > width) continue;

            g.fillStyle(0x0d0c0b, 1);
            g.fillRoundedRect(x, 0, postW, 64, 8);
            g.fillStyle(0x2a1c18, 1);
            g.fillRoundedRect(x + 6, 6, 32, 50, 6);
            g.fillStyle(0xff3300, 1);
            g.fillRoundedRect(x + 16, 14, 12, 34, 4);
            g.fillStyle(0xffcc66, 0.9);
            g.fillRect(x + 19, 18, 6, 14);
        }

        g.fillStyle(0x050505, 1);
        g.fillRect(0, 128, width, 16);
    });
}

function createWalkerTexture(scene) {
    createTexture(scene, "enemyWalker", 96, 108, (g) => {
        g.fillStyle(0x0f3d18, 1);
        g.fillRoundedRect(6, 0, 84, 72, 18);
        g.fillStyle(0x22c55e, 1);
        g.fillRoundedRect(12, 6, 72, 60, 16);
        g.fillStyle(0x166534, 1);
        g.fillCircle(48, 36, 20);
        g.fillStyle(0x4ade80, 1);
        g.fillCircle(48, 32, 12);

        g.fillStyle(0x052e16, 1);
        g.fillRoundedRect(36, 54, 24, 16, 6);
        g.fillStyle(0x14532d, 1);
        g.fillRoundedRect(40, 62, 16, 42, 6);
        g.fillStyle(0x86efac, 1);
        g.fillRoundedRect(43, 68, 10, 34, 4);
        g.fillStyle(0xecfccb, 1);
        g.fillRoundedRect(46, 94, 6, 12, 3);
    });
}

function createOrbTexture(scene) {
    createTexture(scene, "enemyOrb", 96, 108, (g) => {
        g.fillStyle(0x7f1d1d, 1);
        g.fillCircle(48, 42, 42);
        g.fillStyle(0xdc2626, 1);
        g.fillCircle(48, 42, 32);
        g.fillStyle(0xf87171, 1);
        g.fillCircle(36, 30, 14);

        g.fillStyle(0x450a0a, 1);
        g.fillRoundedRect(36, 66, 24, 14, 6);
        g.fillStyle(0x7f1d1d, 1);
        g.fillRoundedRect(40, 72, 16, 30, 6);
        g.fillStyle(0xfca5a5, 1);
        g.fillRoundedRect(43, 78, 10, 24, 4);
        g.fillStyle(0xffe4e6, 1);
        g.fillRoundedRect(46, 96, 6, 10, 3);
    });
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a += 0x6d2b79f5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
