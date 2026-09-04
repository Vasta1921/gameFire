/**
 * Рисует в Graphics и сохраняет как текстуру Phaser.
 * Если ключ уже есть — ничего не делает.
 */
export function createTexture(scene, key, width, height, draw) {
    if (scene.textures.exists(key)) return;

    const graphics = scene.make.graphics({ add: false });
    draw(graphics, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
}

export function replaceTexture(scene, key, createFn) {
    // Не удаляем существующую текстуру: textures.remove ломает WebGL
    // (Text.updateText → glTexture null) при возврате в меню.
    if (scene.textures.exists(key)) return;
    createFn();
}
