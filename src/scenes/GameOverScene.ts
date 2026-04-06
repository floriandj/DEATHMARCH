// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';

interface GameOverData {
  score: number;
  distance: number;
  bossDefeated: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor('#050510');

    const prev = parseInt(localStorage.getItem('deathmarch-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) {
      localStorage.setItem('deathmarch-highscore', String(data.score));
    }

    const mgr = LevelManager.instance;
    const level = mgr.current;
    const levelIndex = mgr.currentLevelIndex;
    const canAdvance = data.bossDefeated && mgr.hasNextLevel;
    const accentColor = level.theme.accentColor;
    const accentHex = level.theme.accentHex;

    // Play result sound
    if (data.bossDefeated) {
      SoundManager.play('victory');
    }

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(data.bossDefeated ? 0x51cf66 : accentColor, 0.06);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 280);

    // ── Title ──
    const titleText = data.bossDefeated ? 'VICTORY' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    const titleStroke = data.bossDefeated ? '#2a8a3e' : '#aa2020';

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.09, titleText, {
        fontSize: '56px', color: titleColor, fontFamily: 'monospace',
        fontStyle: 'bold', stroke: titleStroke, strokeThickness: 3,
      })
      .setOrigin(0.5).setScale(0.5).setAlpha(0);

    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.145, 200, 3,
      Phaser.Display.Color.HexStringToColor(titleColor).color, 0.5);

    // ── Level info pill ──
    const pillY = GAME_HEIGHT * 0.19;
    const lpBg = this.add.graphics();
    lpBg.fillStyle(accentColor, 0.1);
    lpBg.fillRoundedRect(GAME_WIDTH / 2 - 200, pillY - 22, 400, 44, 22);
    lpBg.lineStyle(1, accentColor, 0.25);
    lpBg.strokeRoundedRect(GAME_WIDTH / 2 - 200, pillY - 22, 400, 44, 22);

    this.add.text(GAME_WIDTH / 2, pillY, `LEVEL ${levelIndex + 1}  \u2022  ${level.name.toUpperCase()}`, {
      fontSize: '17px', color: accentHex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Stats Card ──
    const cardY = GAME_HEIGHT * 0.27;
    const rowH = 55;
    const rowCount = data.bossDefeated ? 4 : 3;
    const cardH = rowCount * rowH + 30;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.04);
    card.fillRoundedRect(GAME_WIDTH / 2 - 220, cardY, 440, cardH, 24);
    card.lineStyle(1, 0xffffff, 0.1);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 220, cardY, 440, cardH, 24);
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 400, delay: 200 });

    let statY = cardY + 40;
    this.createStatRow(statY, '\u2605  SCORE', String(data.score), '#ffd43b', 300, data.score);
    statY += rowH;
    this.createStatRow(statY, '\u279C  DISTANCE', `${data.distance}m`, '#00d4ff', 400);
    statY += rowH;

    if (data.bossDefeated) {
      this.createStatRow(statY, '\u2620  BOSS', 'DEFEATED', '#51cf66', 500);
      statY += rowH;
    }

    const bestLabel = isNewHigh ? '\u2728  NEW BEST!' : '\u2694  BEST';
    const bestColor = isNewHigh ? '#ffd43b' : '#aaaaaa';
    this.createStatRow(statY, bestLabel, String(Math.max(prev, data.score)), bestColor, 600);

    // ── Buttons ──
    let btnY = cardY + cardH + 55;

    if (canAdvance) {
      this.createPillButton(
        GAME_WIDTH / 2, btnY,
        'NEXT LEVEL  \u25B6', 320, 68,
        0xffd43b, '#ffd43b', '#ffffff', true,
        () => {
          mgr.advanceLevel();
          localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameScene');
          });
        },
        700,
      );
      btnY += 85;
    }

    const retryLabel = data.bossDefeated ? '\u21BB  REPLAY' : '\u21BB  TRY AGAIN';
    this.createPillButton(
      GAME_WIDTH / 2, btnY,
      retryLabel, 280, 60,
      0x00d4ff, '#00d4ff', '#ffffff', false,
      () => this.scene.start('GameScene'),
      canAdvance ? 800 : 700,
    );
    btnY += 76;

    this.createPillButton(
      GAME_WIDTH / 2, btnY,
      '\u2630  LEVELS', 220, 54,
      0x999999, '#999999', '#ffffff', false,
      () => this.scene.start('MenuScene'),
      canAdvance ? 900 : 800,
    );
  }

  private createStatRow(y: number, label: string, value: string, color: string, delay: number, countUp?: number): void {
    const row = this.add.container(0, y);

    row.add(this.add.text(GAME_WIDTH / 2 - 180, 0, label, {
      fontSize: '18px', color: '#bbbbbb', fontFamily: 'monospace',
    }).setOrigin(0, 0.5));

    const valueText = this.add.text(GAME_WIDTH / 2 + 180, 0, countUp !== undefined ? '0' : value, {
      fontSize: '28px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    row.add(valueText);

    row.setAlpha(0);
    this.tweens.add({ targets: row, alpha: 1, x: { from: 20, to: 0 }, duration: 400, delay, ease: 'Power2' });

    // Count-up animation for numeric values
    if (countUp !== undefined && countUp > 0) {
      const counter = { val: 0 };
      this.tweens.add({
        targets: counter,
        val: countUp,
        duration: Math.min(1200, 400 + countUp / 5),
        delay: delay + 200,
        ease: 'Power2',
        onUpdate: () => { valueText.setText(String(Math.floor(counter.val))); },
        onComplete: () => { valueText.setText(String(countUp)); },
      });
    }
  }

  private createPillButton(
    x: number, y: number,
    label: string, w: number, h: number,
    bgColor: number, textColor: string, hoverColor: string,
    pulse: boolean, callback: () => void, delay: number,
  ): void {
    const container = this.add.container(x, y).setAlpha(0);
    const r = h / 2;

    if (pulse) {
      const glow = this.add.graphics();
      glow.fillStyle(bgColor, 0.1);
      glow.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, r + 6);
      container.add(glow);
      this.tweens.add({
        targets: glow, alpha: { from: 0.15, to: 0.5 },
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.14);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(2, bgColor, 0.55);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontSize: `${Math.min(h * 0.42, 26)}px`,
      color: textColor, fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      text.setColor(hoverColor);
      bg.clear();
      bg.fillStyle(bgColor, 0.25);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
      bg.lineStyle(2, bgColor, 0.85);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    });
    hitZone.on('pointerout', () => {
      text.setColor(textColor);
      bg.clear();
      bg.fillStyle(bgColor, 0.14);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
      bg.lineStyle(2, bgColor, 0.55);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    });
    hitZone.on('pointerdown', () => {
      SoundManager.play('button_click');
      // Tap feedback: quick scale bounce
      this.tweens.add({
        targets: container,
        scale: 0.92,
        duration: 60,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => { container.setScale(1); callback(); },
      });
    });

    this.tweens.add({
      targets: container, alpha: 1, y: { from: y + 15, to: y },
      duration: 400, delay, ease: 'Power2',
    });
  }
}
