/** Overlap двух физических групп. */
export function setupOverlap(scene, groupA, groupB, onHit) {
    scene.physics.add.overlap(groupA, groupB, onHit, undefined, scene);
}

export function setupBulletEnemyCollision(scene, projectileSystem, enemyManager, onHit) {
    setupOverlap(scene, projectileSystem.group, enemyManager.group, onHit);
}

export function setupBulletBaseCollision(scene, projectileSystem, base, onHit) {
    setupOverlap(scene, projectileSystem.group, base.sprite, onHit);
}
