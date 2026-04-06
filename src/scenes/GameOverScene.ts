// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';

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

    // Background glow using theme accent
    const bgGlow = this.add.graphics();
    const glowColor = data.bossDefeated ? 0x51cf66 : accentColor;
    bgGlow.fillStyle(glowColor, 0.06);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 250);

    // ── Title ──
    const titleText = data.bossDefeated ? 'VICTORY' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    const titleStroke = data.bossDefeated ? '#2a8a3e' : '#aa2020';

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.10, titleText, {
        fontSize: '48px',
        color: titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: titleStroke,
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScale(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Decorative line
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 160, 2,
      Phaser.Display.Color.HexStringToColor(titleColor).color, 0.4);

    // ── Level info pill ──
    const levelPillY = GAME_HEIGHT * 0.19;
    const lpBg = this.add.graphics();
    lpBg.fillStyle(accentColor, 0.08);
    lpBg.fillRoundedRect(GAME_WIDTH / 2 - 160, levelPillY - 18, 320, 36, 18);
    lpBg.lineStyle(1, accentColor, 0.2);
    lpBg.strokeRoundedRect(GAME_WIDTH / 2 - 160, levelPillY - 18, 320, 36, 18);

    this.add
      .text(GAME_WIDTH / 2, levelPillY, `LEVEL ${levelIndex + 1}  \u2022  ${level.name.toUpperCase()}`, {
        fontSize: '13px',
        color: accentHex,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // ── Stats Card ──
    const cardY = GAME_HEIGHT * 0.28;
    const cardH = isNewHigh ? 200 : 170;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.03);
    card.fillRoundedRect(GAME_WIDTH / 2 - 180, cardY, 360, cardH, 20);
    card.lineStyle(1, 0xffffff, 0.08);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 180, cardY, 360, cardH, 20);

    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 400, delay: 200 });

    // Stat rows
    let statY = cardY + 35;
    this.createStatRow(statY, '\u2605  SCORE', String(data.score), '#ffd43b', 300);
    statY += 45;

    this.createStatRow(statY, '\u279C  DISTANCE', `${data.distance}m`, '#00d4ff', 400);
    statY += 45;

    if (data.bossDefeated) {
      this.createStatRow(statY, '\u2620  BOSS', 'DEFEATED', '#51cf66', 500);
      statY += 45;
    }

    const bestLabel = isNewHigh ? '\u2728  NEW BEST!' : '\u2694  BEST';
    const bestColor = isNewHigh ? '#ffd43b' : '#888888';
    this.createStatRow(statY, bestLabel, String(Math.max(prev, data.score)), bestColor, 600);

    // ── Buttons ──
    let btnY = cardY + cardH + 50;

    if (canAdvance) {
      this.createPillButton(
        GAME_WIDTH / 2, btnY,
        'NEXT LEVEL  \u25B6', 260, 56,
        0xffd43b, '#ffd43b', '#ffffff',
        true,
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
      btnY += 72;
    }

    if (data.bossDefeated && !mgr.hasNextLevel) {
      const completeText = this.add
        .text(GAME_WIDTH / 2, btnY, '\u2605 ALL LEVELS COMPLETE \u2605', {
          fontSize: '16px',
          color: '#ffd43b',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({ targets: completeText, alpha: 1, duration: 500, delay: 700 });
      btnY += 50;
    }

    // Retry / Replay button
    const retryLabel = data.bossDefeated ? '\u21BB  REPLAY' : '\u21BB  TRY AGAIN';
    this.createPillButton(
      GAME_WIDTH / 2, btnY,
      retryLabel, 220, 48,
      0x00d4ff, '#00d4ff', '#ffffff',
      false,
      () => this.scene.start('GameScene'),
      canAdvance ? 800 : 700,
    );
    btnY += 62;

    // Menu button
    this.createPillButton(
      GAME_WIDTH / 2, btnY,
      '\u2630  LEVELS', 160, 42,
      0x888888, '#888888', '#ffffff',
      false,
      () => this.scene.start('MenuScene'),
      canAdvance ? 900 : 800,
    );
  }

  private createStatRow(y: number, label: string, value: string, color: string, delay: number): void {
    const row = this.add.container(0, y);

    const labelText = this.add
      .text(GAME_WIDTH / 2 - 140, 0, label, {
        fontSize: '14px',
        color: '#999999',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);

    const valueText = this.add
      .text(GAME_WIDTH / 2 + 140, 0, value, {
        fontSize: '22px',
        color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);

    row.add([labelText, valueText]);
    row.setAlpha(0);

    this.tweens.add({
      targets: row,
      alpha: 1,
      x: { from: 20, to: 0 },
      duration: 400,
      delay,
      ease: 'Power2',
    });
  }

  private createPillButton(
    x: number, y: number,
    label: string, w: number, h: number,
    bgColor: number, textColor: string, hoverColor: string,
    pulse: boolean,
    callback: () => void,
    delay: number,
  ): void {
    const container = this.add.container(x, y).setAlpha(0);
    const r = h / 2;

    if (pulse) {
      const glow = this.add.graphics();
      glow.fillStyle(bgColor, 0.08);
      glow.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, r + 6);
      container.add(glow);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.15, to: 0.45 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.12);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(2, bgColor, 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    container.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontSize: `${Math.min(h * 0.42, 22)}px`,
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      text.setColor(hoverColor);
      bg.clear();
      bg.fillStyle(bgColor, 0.22);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
      bg.lineStyle(2, bgColor, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    });
    hitZone.on('pointerout', () => {
      text.setColor(textColor);
      bg.clear();
      bg.fillStyle(bgColor, 0.12);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
      bg.lineStyle(2, bgColor, 0.5);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    });
    hitZone.on('pointerdown', callback);

    this.tweens.add({
      targets: container,
      alpha: 1,
      y: { from: y + 15, to: y },
      duration: 400,
      delay,
      ease: 'Power2',
    });
  }
}
