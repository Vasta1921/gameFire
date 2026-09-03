import { createTexture } from "./createTexture.js";

/**
 * Гладкая капсула: внешнее свечение, красное тело, светлая сердцевина.
 */
export function createBulletTexture(scene, key, width, height) {
    createTexture(scene, key, width, height, (graphics) => {
        const cx = width / 2;
        const cy = height / 2;

        graphics.fillStyle(0xff1a00, 0.28);
        graphics.fillEllipse(cx, cy, width, height);
        graphics.fillStyle(0xe01010, 0.9);
        graphics.fillEllipse(cx, cy, width * 0.72, height * 0.84);
        graphics.fillStyle(0xff3b2e, 1);
        graphics.fillEllipse(cx, cy, width * 0.5, height * 0.7);
        graphics.fillStyle(0xff8a5c, 1);
        graphics.fillEllipse(cx, cy, width * 0.3, height * 0.48);
        graphics.fillStyle(0xfff3e0, 1);
        graphics.fillEllipse(cx, cy - height * 0.14, width * 0.16, height * 0.2);
    });
}

/** Мягкая искра для следа и вспышки попадания. */
export function createSparkTexture(scene, key = "spark") {
    createTexture(scene, key, 16, 16, (graphics) => {
        graphics.fillStyle(0xff3300, 0.2);
        graphics.fillCircle(8, 8, 8);
        graphics.fillStyle(0xff7722, 0.55);
        graphics.fillCircle(8, 8, 5);
        graphics.fillStyle(0xffe8c4, 1);
        graphics.fillCircle(8, 8, 2);
    });
}
