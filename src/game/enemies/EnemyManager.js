export class EnemyManager {
    constructor(scene, options = {}) {
        this.scene = scene;

        const {
            //enemyKeys = ["enemy1", "enemy2", "enemy3", "enemy4", "enemy5"],
            enemyKeys = ["enemy"],
            spawnDelayMs = 1000,
            speedY = 100,
        } = options;

        this.enemyKeys = enemyKeys;
        this.spawnDelayMs = spawnDelayMs;
        this.speedY = speedY;
        this.group = scene.physics.add.group();

        this.spawnTimer = scene.time.addEvent({
            delay: this.spawnDelayMs,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });
    }

    spawnEnemy() {
        const cameraWidth = this.scene.cameras.main.width;
        const x = Phaser.Math.Between(20, cameraWidth - 20);
        const key = Phaser.Utils.Array.GetRandom(this.enemyKeys);
        const enemy = this.group.create(x, 0, key);
        enemy.setVelocityY(this.speedY);
    }
}

