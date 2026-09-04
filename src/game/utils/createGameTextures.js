import { createTexture, replaceTexture } from "./createTexture.js";
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
    createSparkTexture(scene, "sparkStar", {
        glow: 0x93c5fd,
        mid: 0xe0f2fe,
        core: 0xffffff,
    });
    createMeteorTexture(scene);
    createBlackHoleTexture(scene);
    createFichcoinTexture(scene);
    createBossTexture(scene);
}

function createBackgroundTexture(scene) {
    const width = 720;
    const height = 1280;

    replaceTexture(scene, "background", () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#06060f";
        ctx.fillRect(0, 0, width, height);

        const random = mulberry32(20260903);

        const nebulae = [
            { x: 180, y: 240, r: 260, rgb: "92, 48, 160", a: 0.28 },
            { x: 520, y: 380, r: 300, rgb: "30, 70, 140", a: 0.26 },
            { x: 300, y: 720, r: 280, rgb: "110, 30, 90", a: 0.22 },
            { x: 560, y: 980, r: 240, rgb: "24, 50, 110", a: 0.24 },
            { x: 120, y: 1100, r: 220, rgb: "70, 40, 130", a: 0.2 },
        ];

        nebulae.forEach((n) => {
            for (let i = 0; i < 7; i += 1) {
                const x = n.x + (random() - 0.5) * n.r * 0.7;
                const y = n.y + (random() - 0.5) * n.r * 0.55;
                const radius = n.r * (0.35 + random() * 0.55);
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                const a0 = n.a * (0.45 + random() * 0.55);
                gradient.addColorStop(0, `rgba(${n.rgb},${a0})`);
                gradient.addColorStop(0.45, `rgba(${n.rgb},${a0 * 0.35})`);
                gradient.addColorStop(1, `rgba(${n.rgb},0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        for (let i = 0; i < 620; i += 1) {
            const x = random() * width;
            const y = random() * height;
            const shade = random();
            const a = 0.75 + shade * 0.25;
            if (shade > 0.62) ctx.fillStyle = `rgba(255,255,255,${a})`;
            else if (shade > 0.32) ctx.fillStyle = `rgba(219,234,254,${a})`;
            else ctx.fillStyle = `rgba(147,197,253,${a})`;
            const size = shade > 0.9 ? 2.2 : shade > 0.7 ? 1.4 : 1;
            ctx.fillRect(x, y, size, size);
        }

        for (let i = 0; i < 36; i += 1) {
            const x = 4 + random() * (width - 8);
            const y = 4 + random() * (height - 8);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fillRect(x, y, 2, 2);
            ctx.fillStyle = "rgba(191,219,254,0.7)";
            ctx.fillRect(x - 2, y, 6, 1);
            ctx.fillRect(x, y - 2, 1, 6);
        }

        scene.textures.addCanvas("background", canvas);
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
        g.fillRoundedRect(8, 36, 80, 150, 18);
        g.fillStyle(0x241814, 1);
        g.fillRoundedRect(16, 48, 64, 128, 16);
        g.fillStyle(0x3a2218, 1);
        g.fillRoundedRect(24, 64, 48, 96, 12);

        g.fillStyle(0x7a1208, 1);
        g.fillRoundedRect(14, 12, 68, 56, 16);
        g.fillStyle(0xff2a00, 1);
        g.fillRoundedRect(20, 0, 56, 52, 14);
        g.fillStyle(0xff7a22, 1);
        g.fillRoundedRect(28, 0, 40, 28, 12);
        g.fillStyle(0xffe08a, 1);
        g.fillRoundedRect(36, 0, 24, 12, 6);

        g.fillStyle(0x111111, 1);
        g.fillRoundedRect(6, 156, 84, 36, 12);
        g.fillStyle(0xff3300, 0.75);
        g.fillRoundedRect(22, 168, 52, 12, 4);
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
    replaceTexture(scene, "enemyWalker", () => {
        createTexture(scene, "enemyWalker", 72, 128, (g) => {
            g.fillStyle(0x14532d, 1);
            g.fillTriangle(4, 48, 36, 22, 36, 78);
            g.fillTriangle(68, 48, 36, 22, 36, 78);

            g.fillStyle(0x166534, 1);
            g.fillRoundedRect(22, 10, 28, 88, 12);
            g.fillStyle(0x22c55e, 1);
            g.fillRoundedRect(25, 16, 22, 78, 10);
            g.fillStyle(0x4ade80, 1);
            g.fillEllipse(36, 52, 16, 48, 32);

            g.fillStyle(0xbbf7d0, 1);
            g.fillEllipse(36, 46, 10, 18, 28);

            g.fillStyle(0x052e16, 1);
            g.fillCircle(28, 16, 6);
            g.fillCircle(44, 16, 6);
            g.fillStyle(0x86efac, 0.95);
            g.fillCircle(28, 14, 3);
            g.fillCircle(44, 14, 3);

            g.fillStyle(0x14532d, 1);
            g.fillTriangle(22, 92, 50, 92, 36, 124);
            g.fillStyle(0x86efac, 1);
            g.fillTriangle(30, 96, 42, 96, 36, 118);
        });
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

function createMeteorTexture(scene) {
    createTexture(scene, "meteor", 64, 28, (g) => {
        g.fillStyle(0xff6a1a, 0.35);
        g.fillEllipse(32, 14, 64, 22, 32);
        g.fillStyle(0x7c2d12, 1);
        g.fillEllipse(38, 14, 28, 16, 32);
        g.fillStyle(0xa16207, 1);
        g.fillEllipse(40, 14, 18, 12, 32);
        g.fillStyle(0xffedd5, 0.9);
        g.fillEllipse(44, 12, 8, 5, 24);
        g.fillStyle(0xff7a22, 0.7);
        g.fillEllipse(18, 14, 24, 8, 24);
    });
}

function createBlackHoleTexture(scene) {
    createTexture(scene, "blackHole", 128, 128, (g) => {
        g.fillStyle(0x3b0764, 0.35);
        g.fillCircle(64, 64, 60);
        g.fillStyle(0x6b21a8, 0.45);
        g.fillEllipse(64, 64, 118, 42, 40);
        g.fillStyle(0xfb923c, 0.75);
        g.fillEllipse(64, 64, 96, 26, 40);
        g.fillStyle(0xfde68a, 0.55);
        g.fillEllipse(64, 64, 78, 14, 40);
        g.fillStyle(0x0a0010, 1);
        g.fillCircle(64, 64, 26);
        g.fillStyle(0x000000, 1);
        g.fillCircle(64, 64, 18);
    });
}

function createFichcoinTexture(scene) {
    replaceTexture(scene, "fichcoin", () => {
        createTexture(scene, "fichcoin", 64, 64, (g) => {
            g.fillStyle(0xb45309, 1);
            g.fillCircle(32, 32, 31);
            g.fillStyle(0xf59e0b, 1);
            g.fillCircle(32, 32, 27);
            g.fillStyle(0xfde68a, 1);
            g.fillCircle(32, 32, 22);
            g.fillStyle(0xfbbf24, 1);
            g.fillCircle(32, 32, 20);

            g.fillStyle(0x1c1917, 1);
            g.fillTriangle(18, 22, 24, 10, 30, 22);
            g.fillTriangle(34, 22, 40, 10, 46, 22);

            g.fillStyle(0x44403c, 1);
            g.fillCircle(32, 36, 14);
            g.fillStyle(0x292524, 1);
            g.fillCircle(32, 38, 12);

            g.fillStyle(0xfacc15, 1);
            g.fillCircle(27, 34, 3);
            g.fillCircle(37, 34, 3);
            g.fillStyle(0x111111, 1);
            g.fillCircle(27, 35, 2);
            g.fillCircle(37, 35, 2);

            g.fillStyle(0x1c1917, 1);
            g.fillTriangle(32, 38, 29, 42, 35, 42);
        });
    });
}

function createBossTexture(scene) {
    replaceTexture(scene, "enemyBoss", () => {
        createTexture(scene, "enemyBoss", 96, 96, (g) => {
            g.fillStyle(0x1e3a8a, 1);
            g.fillTriangle(48, 90, 6, 14, 90, 14);
            g.fillStyle(0x3b82f6, 1);
            g.fillTriangle(48, 78, 18, 22, 78, 22);
            g.fillStyle(0x93c5fd, 1);
            g.fillTriangle(48, 64, 30, 30, 66, 30);
            g.fillStyle(0x1e3a8a, 1);
            g.fillCircle(48, 38, 8);
            g.fillStyle(0xdbeafe, 1);
            g.fillCircle(48, 36, 4);
            g.fillStyle(0x60a5fa, 1);
            g.fillRect(45, 64, 6, 22);
        });
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
