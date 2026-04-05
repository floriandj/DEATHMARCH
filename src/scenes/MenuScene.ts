// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050510');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Restore saved level progress
    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    if (savedLevel >= 0 && savedLevel < mgr.totalLevels) {
      mgr.setLevel(savedLevel);
    }

    // Background gradient layers
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.04);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 300);
    bgGlow.fillStyle(0x0040ff, 0.02);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 400);

    // Ambient floating particles
    for (let i = 0; i < 25; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(20, GAME_HEIGHT - 20),
        Phaser.Math.Between(1, 2),
        0xff4040,
        Phaser.Math.FloatBetween(0.05, 0.2),
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(60, 150),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }

    // ── Title Section ──
    const titleGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.14, 100, 0xff2040, 0.08);
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.15,
      scale: 1.4,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.14, 'DEATHMARCH', {
        fontSize: '52px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#ff2040',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Decorative lines under title
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.19, 200, 2, 0xff4040, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.195, 120, 1, 0xff4040, 0.25);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, 'Drag to command your army', {
        fontSize: '14px',
        color: '#777777',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // ── High Score Card ──
    const scoreCardY = GAME_HEIGHT * 0.32;
    const scoreCard = this.add.graphics();
    scoreCard.fillStyle(0xffffff, 0.03);
    scoreCard.fillRoundedRect(GAME_WIDTH / 2 - 150, scoreCardY - 30, 300, 90, 16);
    scoreCard.lineStyle(1, 0xffd43b, 0.15);
    scoreCard.strokeRoundedRect(GAME_WIDTH / 2 - 150, scoreCardY - 30, 300, 90, 16);

    this.add
      .text(GAME_WIDTH / 2, scoreCardY - 10, 'HIGH SCORE', {
        fontSize: '11px',
        color: '#999999',
        fontFamily: 'monospace',
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    const scoreValue = this.add
      .text(GAME_WIDTH / 2, scoreCardY + 25, highScore, {
        fontSize: '38px',
        color: '#ffd43b',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: scoreValue,
      alpha: 0.6,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Level Selector Card ──
    const levelY = GAME_HEIGHT * 0.47;
    const levelCard = this.add.graphics();
    levelCard.fillStyle(0xffffff, 0.03);
    levelCard.fillRoundedRect(GAME_WIDTH / 2 - 200, levelY - 35, 400, 80, 16);
    levelCard.lineStyle(1, 0x00d4ff, 0.15);
    levelCard.strokeRoundedRect(GAME_WIDTH / 2 - 200, levelY - 35, 400, 80, 16);

    this.add
      .text(GAME_WIDTH / 2, levelY - 16, 'LEVEL', {
        fontSize: '10px',
        color: '#999999',
        fontFamily: 'monospace',
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    const levelText = this.add
      .text(GAME_WIDTH / 2, levelY + 14, this.getLevelLabel(mgr), {
        fontSize: '20px',
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Arrow buttons with circle backgrounds
    const maxUnlocked = savedLevel;

    const leftArrowBg = this.createCircleButton(
      GAME_WIDTH / 2 - 170, levelY + 8, 22,
      mgr.currentLevelIndex > 0,
    );
    const leftArrow = this.add
      .text(GAME_WIDTH / 2 - 170, levelY + 8, '\u25C0', {
        fontSize: '18px',
        color: mgr.currentLevelIndex > 0 ? '#00d4ff' : '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const rightArrowBg = this.createCircleButton(
      GAME_WIDTH / 2 + 170, levelY + 8, 22,
      mgr.currentLevelIndex < maxUnlocked,
    );
    const rightArrow = this.add
      .text(GAME_WIDTH / 2 + 170, levelY + 8, '\u25B6', {
        fontSize: '18px',
        color: mgr.currentLevelIndex < maxUnlocked ? '#00d4ff' : '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const updateArrows = () => {
      const canLeft = mgr.currentLevelIndex > 0;
      const canRight = mgr.currentLevelIndex < maxUnlocked;
      leftArrow.setColor(canLeft ? '#00d4ff' : '#333333');
      rightArrow.setColor(canRight ? '#00d4ff' : '#333333');
      leftArrowBg.clear();
      this.drawCircleBtn(leftArrowBg, GAME_WIDTH / 2 - 170, levelY + 8, 22, canLeft);
      rightArrowBg.clear();
      this.drawCircleBtn(rightArrowBg, GAME_WIDTH / 2 + 170, levelY + 8, 22, canRight);
      levelText.setText(this.getLevelLabel(mgr));
    };

    leftArrow.on('pointerdown', () => {
      if (mgr.currentLevelIndex > 0) {
        mgr.setLevel(mgr.currentLevelIndex - 1);
        updateArrows();
      }
    });

    rightArrow.on('pointerdown', () => {
      if (mgr.currentLevelIndex < maxUnlocked) {
        mgr.setLevel(mgr.currentLevelIndex + 1);
        updateArrows();
      }
    });

    // ── START Button (Modern pill style) ──
    const startY = GAME_HEIGHT * 0.60;
    const startBtnW = 280;
    const startBtnH = 64;

    // Glow behind button
    const startGlow = this.add.graphics();
    startGlow.fillStyle(0x51cf66, 0.1);
    startGlow.fillRoundedRect(
      GAME_WIDTH / 2 - startBtnW / 2 - 8, startY - startBtnH / 2 - 8,
      startBtnW + 16, startBtnH + 16, 40,
    );
    this.tweens.add({
      targets: startGlow,
      alpha: 0.4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Button body
    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0x51cf66, 0.15);
    startBtnBg.fillRoundedRect(
      GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
      startBtnW, startBtnH, 32,
    );
    startBtnBg.lineStyle(2, 0x51cf66, 0.6);
    startBtnBg.strokeRoundedRect(
      GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
      startBtnW, startBtnH, 32,
    );

    const startBtn = this.add
      .text(GAME_WIDTH / 2, startY, 'START', {
        fontSize: '32px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 8,
      })
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Rectangle(
          -startBtnW / 2, -startBtnH / 2,
          startBtnW, startBtnH,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });

    startBtn.on('pointerover', () => {
      startBtn.setColor('#ffffff');
      startBtnBg.clear();
      startBtnBg.fillStyle(0x51cf66, 0.25);
      startBtnBg.fillRoundedRect(
        GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
        startBtnW, startBtnH, 32,
      );
      startBtnBg.lineStyle(2, 0x51cf66, 0.9);
      startBtnBg.strokeRoundedRect(
        GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
        startBtnW, startBtnH, 32,
      );
    });
    startBtn.on('pointerout', () => {
      startBtn.setColor('#51cf66');
      startBtnBg.clear();
      startBtnBg.fillStyle(0x51cf66, 0.15);
      startBtnBg.fillRoundedRect(
        GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
        startBtnW, startBtnH, 32,
      );
      startBtnBg.lineStyle(2, 0x51cf66, 0.6);
      startBtnBg.strokeRoundedRect(
        GAME_WIDTH / 2 - startBtnW / 2, startY - startBtnH / 2,
        startBtnW, startBtnH, 32,
      );
    });
    startBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene');
      });
    });

    // ── SETTINGS Button (Subtle pill) ──
    const settingsY = GAME_HEIGHT * 0.72;
    const settBtnW = 200;
    const settBtnH = 48;

    const settBtnBg = this.add.graphics();
    settBtnBg.fillStyle(0xffffff, 0.04);
    settBtnBg.fillRoundedRect(
      GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
      settBtnW, settBtnH, 24,
    );
    settBtnBg.lineStyle(1, 0x888888, 0.2);
    settBtnBg.strokeRoundedRect(
      GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
      settBtnW, settBtnH, 24,
    );

    const settingsBtn = this.add
      .text(GAME_WIDTH / 2, settingsY, '\u2699  SETTINGS', {
        fontSize: '18px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Rectangle(-settBtnW / 2, -settBtnH / 2, settBtnW, settBtnH),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });

    settingsBtn.on('pointerover', () => {
      settingsBtn.setColor('#ffffff');
      settBtnBg.clear();
      settBtnBg.fillStyle(0xffffff, 0.08);
      settBtnBg.fillRoundedRect(
        GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
        settBtnW, settBtnH, 24,
      );
      settBtnBg.lineStyle(1, 0xffffff, 0.3);
      settBtnBg.strokeRoundedRect(
        GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
        settBtnW, settBtnH, 24,
      );
    });
    settingsBtn.on('pointerout', () => {
      settingsBtn.setColor('#888888');
      settBtnBg.clear();
      settBtnBg.fillStyle(0xffffff, 0.04);
      settBtnBg.fillRoundedRect(
        GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
        settBtnW, settBtnH, 24,
      );
      settBtnBg.lineStyle(1, 0x888888, 0.2);
      settBtnBg.strokeRoundedRect(
        GAME_WIDTH / 2 - settBtnW / 2, settingsY - settBtnH / 2,
        settBtnW, settBtnH, 24,
      );
    });
    settingsBtn.on('pointerdown', () => {
      this.scene.start('SettingsScene');
    });

    // Version tag bottom
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'v1.0.0', {
        fontSize: '11px',
        color: '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
  }

  private createCircleButton(x: number, y: number, r: number, active: boolean): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    this.drawCircleBtn(g, x, y, r, active);
    return g;
  }

  private drawCircleBtn(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, active: boolean): void {
    if (active) {
      g.fillStyle(0x00d4ff, 0.1);
      g.fillCircle(x, y, r);
      g.lineStyle(1, 0x00d4ff, 0.3);
      g.strokeCircle(x, y, r);
    } else {
      g.fillStyle(0xffffff, 0.03);
      g.fillCircle(x, y, r);
      g.lineStyle(1, 0x333333, 0.2);
      g.strokeCircle(x, y, r);
    }
  }

  private getLevelLabel(mgr: LevelManager): string {
    return `${mgr.currentLevelIndex + 1}/${mgr.totalLevels}  ${mgr.current.name}`;
  }
}
