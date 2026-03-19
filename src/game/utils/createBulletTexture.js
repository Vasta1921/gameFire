export function createBulletTexture(scene, key, width, height, color) {
    if (scene.textures.exists(key)) return;

    const graphics = scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 3);

    const rt = scene.make.renderTexture({ width, height }, false);
    rt.draw(graphics, width / 2, height / 2);
    rt.saveTexture(key);

    graphics.destroy();
    rt.destroy();
}

