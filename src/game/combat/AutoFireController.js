/**
 * Автоогонь по удержанию: первый выстрел сразу,
 * дальше — по таймеру с задержкой getDelay().
 */
export class AutoFireController {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.timer = null;
        this.isFiring = false;

        this.onShoot = options.onShoot ?? (() => {});
        this.getDelay = options.getDelay ?? (() => 150);
    }

    start() {
        if (this.isFiring) return;

        this.isFiring = true;
        this.onShoot();

        this.timer = this.scene.time.addEvent({
            delay: this.getDelay(),
            callback: this.onShoot,
            callbackScope: this.scene,
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

    /** Перезапускает таймер, если во время стрельбы сменилась скорострельность. */
    refreshRate() {
        if (!this.isFiring) return;
        this.stop();
        this.start();
    }
}
