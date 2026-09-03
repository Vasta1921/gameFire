/** Стена-крепость внизу экрана: в неё стреляют враги. */
export class Base {
    constructor(scene, options = {}) {
        this.scene = scene;

        const {
            maxHp = 15,
            depth = 1,
        } = options;

        this.maxHp = maxHp;
        this.hp = maxHp;

        const { width, height } = scene.cameras.main;
        const wallHeight = 72;

        this.sprite = scene.physics.add.sprite(width / 2, height - wallHeight / 2, "wall");
        this.sprite.setDisplaySize(width, wallHeight);
        this.sprite.setImmovable(true);
        this.sprite.setDepth(depth);

        if (this.sprite.body) {
            this.sprite.body.allowGravity = false;
            this.sprite.body.setSize(this.sprite.frame.width, this.sprite.frame.height, true);
        }

        this.wallTop = this.sprite.y - wallHeight / 2;
        this.siegeY = this.wallTop - 48;
        // Верх перекладины забора (линия лавы в текстуре стены, 44/144).
        const railFromTop = wallHeight * (44 / 144);
        // Диаметр полукруга чуть врезается в забор — без щели.
        this.platformY = this.wallTop + railFromTop + 8;
    }

    getAimPoint() {
        return {
            x: this.sprite.x,
            y: this.wallTop + 8,
        };
    }

    takeDamage(amount) {
        if (this.hp <= 0) return 0;

        this.hp = Math.max(0, this.hp - amount);
        return this.hp;
    }

    isDestroyed() {
        return this.hp <= 0;
    }
}
