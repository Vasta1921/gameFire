    import { ShootScene } from './scenes/ShootScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 720,
    height: 1280,
    backgroundColor: '#000000',
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        ShootScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            