export function createBulletTexture(scene, key, width, height, color) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, 3);

    const rt = scene.make.renderTexture({ width, height }, false);
    rt.draw(g, width / 2, height / 2);
    rt.saveTexture(key);
    g.destroy();
}