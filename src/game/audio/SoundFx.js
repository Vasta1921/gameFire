import { isSoundEnabled } from "../progress/Progress.js";

/**
 * Процедурные звуки через Web Audio — без файлов.
 * Браузер разрешает звук только после жеста игрока (unlock).
 */
export class SoundFx {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        if (!this.enabled && this.ctx && this.ctx.state === "running") {
            this.ctx.suspend();
        }
        if (this.enabled && this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    unlock() {
        if (!this.enabled) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        if (!this.ctx) {
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    shoot() {
        const ctx = this.ctx;
        if (!this.enabled || !ctx || ctx.state !== "running") return;

        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(420 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
    }

    explode(color = "red") {
        const ctx = this.ctx;
        if (!this.enabled || !ctx || ctx.state !== "running") return;

        const duration = 0.28;
        const t = ctx.currentTime;
        const frames = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i += 1) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(color === "green" ? 2200 : 900, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t);
    }
}

export function getSoundFx(game) {
    let sfx = game.registry.get("sfx");
    if (!sfx) {
        sfx = new SoundFx();
        game.registry.set("sfx", sfx);
    }
    sfx.setEnabled(isSoundEnabled());
    return sfx;
}
