import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    create() {
      const text = this.add.text(360, 640, 'Iso-Metric War', {
        fontSize: '32px',
        color: '#00d4ff',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
