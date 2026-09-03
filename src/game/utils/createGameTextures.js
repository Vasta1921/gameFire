import { createTexture } from "./createTexture.js";
import { createBulletTexture, createSparkTexture } from "./createBulletTexture.js";

/** Все игровые текстуры вместо PNG. */
export function createGameTextures(scene) {
    createBackgroundTexture(scene);
    createTowerTexture(scene);
    createTurretTexture(scene);
    createWallTexture(scene);
    createWalkerTexture(scene);
    createOrbTexture(scene);
    createBulletTexture(scene, "redBullet", 32, 64);
    createBulletTexture(scene, "greenBullet", 32, 64, {
        glow: 0x1aff44,
        outer: 0x12a832,
        body: 0x33dd55,
        inner: 0x88ff99,
        core: 0xeaffea,
    });
    createSparkTexture(scene, "spark");
}

/** Тёмный звёздный фон под размер экрана 720×1280. */
function createBackgroundTexture(scene) {
    const width = 720;
    const height = 1280;

    createTexture(scene, "background", width, height, (g) => {
        g.fillStyle(0x08081a, 1);
        g.fillRect(0, 0, width, height);

        g.fillStyle(0x1a0a25, 0.35);
        g.fillEllipse(120, 980, 420, 260);
        g.fillEllipse(560, 420, 380, 240);
        g.fillStyle(0x0c1230, 0.4);
        g.fillEllipse(360, 200, 500, 180);

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

/** Крепость 128×128: чёрный камень и трещины лавы. */
function createTowerTexture(scene) {
    createTexture(scene, "tower", 128, 128, (g) => {
        g.fillStyle(0x070707, 1);
        g.fillRoundedRect(0, 16, 128, 112, 16);
        g.fillStyle(0x161210, 1);
        g.fillRoundedRect(4, 8, 120, 112, 16);
        g.fillStyle(0x2a1c18, 1);
        g.fillRoundedRect(12, 24, 104, 88, 12);

        g.fillStyle(0x5a1408, 1);
        g.fillRect(8, 20, 112, 12);

        g.fillStyle(0xff2200, 1);
        g.fillRect(36, 32, 8, 72);
        g.fillRect(36, 64, 48, 8);
        g.fillRect(80, 48, 8, 40);
        g.fillStyle(0xff6a1a, 1);
        g.fillRect(40, 40, 4, 48);
        g.fillRect(40, 64, 32, 4);
        g.fillStyle(0xffcc66, 1);
        g.fillRect(40, 44, 4, 16);

        g.fillStyle(0x0a0a0a, 1);
        g.fillCircle(32, 96, 8);
        g.fillCircle(96, 96, 8);
        g.fillStyle(0xff3300, 0.85);
        g.fillCircle(32, 96, 4);
        g.fillCircle(96, 96, 4);
    });
}

/** Ствол 64×128: тёмный металл, раскалённое дуло. */
function createTurretTexture(scene) {
    createTexture(scene, "turret", 64, 128, (g) => {
        g.fillStyle(0x0a0a0a, 1);
        g.fillRoundedRect(8, 24, 48, 104, 8);
        g.fillStyle(0x1c1412, 1);
        g.fillRoundedRect(12, 32, 40, 88, 8);
        g.fillStyle(0x2c1a16, 1);
        g.fillRect(20, 40, 24, 64);

        g.fillStyle(0x7a1208, 1);
        g.fillRect(12, 8, 40, 40);
        g.fillStyle(0xff2a00, 1);
        g.fillRect(16, 0, 32, 36);
        g.fillStyle(0xff7a22, 1);
        g.fillRect(20, 0, 24, 20);
        g.fillStyle(0xffe08a, 1);
        g.fillRect(24, 0, 16, 8);

        g.fillStyle(0x111111, 1);
        g.fillRect(4, 104, 56, 24);
        g.fillStyle(0xff3300, 0.7);
        g.fillRect(16, 112, 32, 8);
    });
}

/** Стена-забор на всю ширину экрана. */
function createWallTexture(scene) {
    const width = 720;
    const height = 80;

    createTexture(scene, "wall", width, height, (g) => {
        g.fillStyle(0x070707, 1);
        g.fillRect(0, 18, width, 62);
        g.fillStyle(0x1a1412, 1);
        g.fillRect(0, 24, width, 50);
        g.fillStyle(0x3a1810, 1);
        g.fillRect(0, 20, width, 8);
        g.fillStyle(0xff2a00, 0.85);
        g.fillRect(0, 22, width, 3);

        for (let x = 0; x < width; x += 60) {
            g.fillStyle(0x0d0c0b, 1);
            g.fillRect(x + 8, 0, 22, 36);
            g.fillStyle(0x2a1c18, 1);
            g.fillRect(x + 11, 3, 16, 28);
            g.fillStyle(0xff3300, 1);
            g.fillRect(x + 16, 8, 6, 18);
            g.fillStyle(0xffcc66, 0.9);
            g.fillRect(x + 17, 10, 3, 8);
        }

        g.fillStyle(0x050505, 1);
        g.fillRect(0, 70, width, 10);
    });
}

/** Зелёный корпус с короткой космической пушкой вниз. */
function createWalkerTexture(scene) {
    createTexture(scene, "enemyWalker", 32, 36, (g) => {
        g.fillStyle(0x0f3d18, 1);
        g.fillRoundedRect(1, 0, 30, 24, 6);
        g.fillStyle(0x22c55e, 1);
        g.fillRoundedRect(3, 2, 26, 20, 5);
        g.fillStyle(0x166534, 1);
        g.fillCircle(16, 12, 7);
        g.fillStyle(0x4ade80, 1);
        g.fillCircle(16, 11, 4);

        g.fillStyle(0x052e16, 1);
        g.fillRect(12, 18, 8, 6);
        g.fillStyle(0x14532d, 1);
        g.fillRect(13, 20, 6, 15);
        g.fillStyle(0x86efac, 1);
        g.fillRect(14, 22, 4, 12);
        g.fillStyle(0xecfccb, 1);
        g.fillRect(15, 32, 2, 4);
    });
}

/** Красный шар с пушкой, стреляет с середины карты. */
function createOrbTexture(scene) {
    createTexture(scene, "enemyOrb", 32, 36, (g) => {
        g.fillStyle(0x7f1d1d, 1);
        g.fillCircle(16, 14, 14);
        g.fillStyle(0xdc2626, 1);
        g.fillCircle(16, 14, 11);
        g.fillStyle(0xf87171, 1);
        g.fillCircle(12, 10, 5);

        g.fillStyle(0x450a0a, 1);
        g.fillRect(12, 22, 8, 5);
        g.fillStyle(0x7f1d1d, 1);
        g.fillRect(13, 24, 6, 11);
        g.fillStyle(0xfca5a5, 1);
        g.fillRect(14, 26, 4, 9);
        g.fillStyle(0xffe4e6, 1);
        g.fillRect(15, 33, 2, 3);
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
