export class EnemySpawner {

    constructor(scene) {
        this.scene = scene;
        this.enemyKeys = [
            "enemy1",
            "enemy2",
            "enemy3",
            "enemy4",
            "enemy5"
        ];
        this.enemies = scene.physics.add.group();

        scene.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(20, 700);
        const key = Phaser.Utils.Array.GetRandom(this.enemyKeys);
        const enemy = this.enemies.create(x, 0, key);
        enemy.setVelocityY(100);
    }
}