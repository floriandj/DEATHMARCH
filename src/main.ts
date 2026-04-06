import './pwa';
import { WakeLock } from '@/systems/WakeLock';
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { BootScene } from '@/scenes/BootScene';
import { SplashScene } from '@/scenes/SplashScene';
import { MenuScene } from '@/scenes/MenuScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { GameScene } from '@/scenes/GameScene';
import { BossScene } from '@/scenes/BossScene';
import { HUDScene } from '@/scenes/HUDScene';
import { GameOverScene } from '@/scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f1923',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, SplashScene, MenuScene, SettingsScene, GameScene, BossScene, HUDScene, GameOverScene],
};

new Phaser.Game(config);
WakeLock.enable();
