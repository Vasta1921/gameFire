import { createTexture } from "./createTexture.js";
import { createBulletTexture, createSparkTexture } from "./createBulletTexture.js";

/** Все игровые текстуры вместо PNG: фон, башня, турель, враг, пуля. */
export function createGameTextures(scene) {
    createBackgroundTexture(scene);
    createTowerTexture(scene);
    createTurretTexture(scene);
    createEnemyTexture(scene);
    createBulletTexture(scene, "redBullet", 32, 64);
    createSparkTexture(scene, "spark");
}

/** Тёмный звёздный фон под размер экрана 720×1280. */
function createBackgroundTexture(scene) {
    const width = 720;
    const height = 1280;

    createTexture(scene, "background", width, height, (g) => {
        g.fillStyle(0x08081a, 1);
        g.fillRect(0, 0, width, height);

        // Лёгкая «туманность»: крупные полупрозрачные пятна.
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

/** База 32×32: чёрный камень и красные трещины лавы. */
function createTowerTexture(scene) {
    createTexture(scene, "tower", 32, 32, (g) => {
        g.fillStyle(0x070707, 1);
        g.fillRoundedRect(0, 4, 32, 28, 4);
        g.fillStyle(0x161210, 1);
        g.fillRoundedRect(1, 2, 30, 28, 4);
        g.fillStyle(0x2a1c18, 1);
        g.fillRoundedRect(3, 6, 26, 22, 3);

        g.fillStyle(0x5a1408, 1);
        g.fillRect(2, 5, 28, 3);

        g.fillStyle(0xff2200, 1);
        g.fillRect(9, 8, 2, 18);
        g.fillRect(9, 16, 12, 2);
        g.fillRect(20, 12, 2, 10);
        g.fillStyle(0xff6a1a, 1);
        g.fillRect(10, 10, 1, 12);
        g.fillRect(10, 16, 8, 1);
        g.fillStyle(0xffcc66, 1);
        g.fillRect(10, 11, 1, 4);

        g.fillStyle(0x0a0a0a, 1);
        g.fillCircle(8, 24, 2);
        g.fillCircle(24, 24, 2);
        g.fillStyle(0xff3300, 0.85);
        g.fillCircle(8, 24, 1);
        g.fillCircle(24, 24, 1);
    });
}

/** Ствол 16×32: тёмный металл, раскалённое дуло. */
function createTurretTexture(scene) {
    createTexture(scene, "turret", 16, 32, (g) => {
        g.fillStyle(0x0a0a0a, 1);
        g.fillRoundedRect(2, 6, 12, 26, 2);
        g.fillStyle(0x1c1412, 1);
        g.fillRoundedRect(3, 8, 10, 22, 2);
        g.fillStyle(0x2c1a16, 1);
        g.fillRect(5, 10, 6, 16);

        g.fillStyle(0x7a1208, 1);
        g.fillRect(3, 2, 10, 10);
        g.fillStyle(0xff2a00, 1);
        g.fillRect(4, 0, 8, 9);
        g.fillStyle(0xff7a22, 1);
        g.fillRect(5, 0, 6, 5);
        g.fillStyle(0xffe08a, 1);
        g.fillRect(6, 0, 4, 2);

        g.fillStyle(0x111111, 1);
        g.fillRect(1, 26, 14, 6);
        g.fillStyle(0xff3300, 0.7);
        g.fillRect(4, 28, 8, 2);
    });
}

/** Враг 32×32: только зелёные оттенки. */
function createEnemyTexture(scene) {
    createTexture(scene, "enemy", 32, 32, (g) => {
        g.fillStyle(0x0f3d18, 1);
        g.fillRoundedRect(0, 0, 32, 32, 6);
        g.fillStyle(0x22c55e, 1);
        g.fillRoundedRect(2, 2, 28, 28, 5);
        g.fillStyle(0x4ade80, 1);
        g.fillRoundedRect(6, 6, 20, 20, 4);
        g.fillStyle(0x14532d, 1);
        g.fillRect(9, 11, 4, 9);
        g.fillRect(19, 11, 4, 9);
    });
}

/** Детерминированный random, чтобы звёзды не прыгали при каждом запуске. */
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
