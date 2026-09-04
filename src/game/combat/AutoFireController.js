/**
 * Автоогонь по удержанию. Не чаще getDelay() мс,
 * даже если жать кнопку вспышками.
 */
export class AutoFireController {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.timer = null;
        this.isFiring = false;
        this.lastShotAt = -Infinity;

        this.onShoot = options.onShoot ?? (() => {});
        this.getDelay = options.getDelay ?? (() => 280);
    }

    tryShoot() {
        const now = this.scene.time.now;
        if (now - this.lastShotAt < this.getDelay()) return;
        this.lastShotAt = now;
        this.onShoot();
    }

    start() {
        if (this.isFiring) return;

        this.isFiring = true;
        this.tryShoot();

        this.timer = this.scene.time.addEvent({
            delay: 16,
            callback: this.tryShoot,
            callbackScope: this,
            loop: true,
        });
    }

    stop() {
        if (!this.isFiring) return;
        this.isFiring = false;

        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
    }

    refreshRate() {
        if (!this.isFiring) return;
        this.stop();
        this.start();
    }
}
