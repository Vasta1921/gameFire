export class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        this.sprite = scene.physics.add.sprite(x, y, "tower");
        this.sprite.setImmovable(true);
        this.sprite.setCollideWorldBounds(true);

        this.turret = scene.add.sprite(x, y - 10, "turret");
        this.turret.setOrigin(0.5, 1);
    }

    update(pointer) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            pointer.x,
            pointer.y
        );
        this.turret.setRotation(angle + Math.PI / 2);
    }
}