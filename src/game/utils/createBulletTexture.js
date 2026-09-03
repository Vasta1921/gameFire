import { createTexture } from "./createTexture.js";

/**
 * Гладкая капсула: внешнее свечение, тело, светлая сердцевина.
 */
export function createBulletTexture(scene, key, width, height, palette = {}) {
    const {
        glow = 0xff1a00,
        outer = 0xe01010,
        body = 0xff3b2e,
        inner = 0xff8a5c,
        core = 0xfff3e0,
    } = palette;

    createTexture(scene, key, width, height, (graphics) => {
        const cx = width / 2;
        const cy = height / 2;

        graphics.fillStyle(glow, 0.28);
        graphics.fillEllipse(cx, cy, width, height, 48);
        graphics.fillStyle(outer, 0.9);
        graphics.fillEllipse(cx, cy, width * 0.72, height * 0.84, 48);
        graphics.fillStyle(body, 1);
        graphics.fillEllipse(cx, cy, width * 0.5, height * 0.7, 48);
        graphics.fillStyle(inner, 1);
        graphics.fillEllipse(cx, cy, width * 0.3, height * 0.48, 48);
        graphics.fillStyle(core, 1);
        graphics.fillEllipse(cx, cy - height * 0.14, width * 0.16, height * 0.2, 48);
    });
}

/** Мягкая искра; рисуем крупно, на экране уменьшаем — меньше пикселей. */
export function createSparkTexture(scene, key, palette = {}) {
    const {
        glow = 0xff3300,
        mid = 0xff7722,
        core = 0xffe8c4,
    } = palette;

    createTexture(scene, key, 32, 32, (graphics) => {
        graphics.fillStyle(glow, 0.18);
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(mid, 0.5);
        graphics.fillCircle(16, 16, 10);
        graphics.fillStyle(core, 1);
        graphics.fillCircle(16, 16, 4);
    });
}
