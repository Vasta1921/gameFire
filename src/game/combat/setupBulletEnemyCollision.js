/** Регистрирует overlap пуль и врагов; при касании вызывается onHit. */
export function setupBulletEnemyCollision(scene, projectileSystem, enemyManager, onHit) {
    scene.physics.add.overlap(
        projectileSystem.group,
        enemyManager.group,
        onHit,
        undefined,
        scene
    );
}
