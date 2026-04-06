// src/scenes/GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

interface GameOverData {
  score: number;
  distance: number;
  bossDefeated: boolean;
  goldEarned: number;
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
    const goldEarned = data.goldEarned || 0;

    if (data.bossDefeated) SoundManager.play('victory');

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(data.bossDefeated ? 0x51cf66 : accentColor, 0.06);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.12, 280);

    // ── Title ──
    const titleText = data.bossDefeated ? 'VICTORY' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    const titleStroke = data.bossDefeated ? '#2a8a3e' : '#aa2020';

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.07, titleText, {
        fontSize: '52px', color: titleColor, fontFamily: 'monospace',
        fontStyle: 'bold', stroke: titleStroke, strokeThickness: 3,
      })
      .setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.115, 180, 3,
      Phaser.Display.Color.HexStringToColor(titleColor).color, 0.5);

    // Level pill
    const pillY = GAME_HEIGHT * 0.15;
    const lpBg = this.add.graphics();
    lpBg.fillStyle(accentColor, 0.1);
    lpBg.fillRoundedRect(GAME_WIDTH / 2 - 200, pillY - 18, 400, 36, 18);
    this.add.text(GAME_WIDTH / 2, pillY, `LEVEL ${levelIndex + 1}  \u2022  ${level.name.toUpperCase()}`, {
      fontSize: '15px', color: accentHex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Stats Card (compact) ──
    const cardY = GAME_HEIGHT * 0.20;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.04);
    card.fillRoundedRect(GAME_WIDTH / 2 - 220, cardY, 440, 150, 20);
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 400, delay: 200 });

    let statY = cardY + 30;
    this.createStatRow(statY, '\u2605 SCORE', String(data.score), '#ffd43b', 250, data.score);
    statY += 40;
    this.createStatRow(statY, '\u279C DIST', `${data.distance}m`, '#00d4ff', 350);
    statY += 40;

    // Gold earned row
    this.createStatRow(statY, '\u{1FA99} GOLD', `+${goldEarned}g`, '#ffd700', 450);

    // Total gold
    const totalGoldY = cardY + 135;
    this.add.text(GAME_WIDTH / 2 + 180, totalGoldY, `${WalletManager.gold}g total`, {
      fontSize: '13px', color: '#aa8800', fontFamily: 'monospace',
    }).setOrigin(1, 0.5).setAlpha(0);

    // ── Shop Section ──
    const shopY = GAME_HEIGHT * 0.42;
    // ── Shop Section (only on death — not after victory) ──
    const showShop = !data.bossDefeated;
    if (showShop) {
      const shopBg = this.add.graphics();
      shopBg.fillStyle(0xffd700, 0.03);
      shopBg.fillRoundedRect(GAME_WIDTH / 2 - 230, shopY - 10, 460, 260, 20);
      shopBg.lineStyle(1, 0xffd700, 0.12);
      shopBg.strokeRoundedRect(GAME_WIDTH / 2 - 230, shopY - 10, 460, 260, 20);

      this.add.text(GAME_WIDTH / 2, shopY + 8, 'SHOP', {
        fontSize: '16px', color: '#ffd700', fontFamily: 'monospace',
        fontStyle: 'bold', letterSpacing: 6,
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, shopY + 28, `${WalletManager.gold}g`, {
        fontSize: '22px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);

      const items = WalletManager.getShopItems();
      let itemY = shopY + 60;
      for (const item of items) {
        this.createShopRow(itemY, item);
        itemY += 48;
      }
    }

    // ── Action Buttons (bottom-anchored for consistent muscle memory) ──
    const btnBase = GAME_HEIGHT - 60;

    this.createPillButton(GAME_WIDTH / 2, btnBase - 148,
      canAdvance ? 'NEXT LEVEL  \u25B6' : (data.bossDefeated ? '\u21BB REPLAY' : '\u21BB TRY AGAIN'),
      300, 64,
      canAdvance ? 0xffd43b : 0x00d4ff,
      canAdvance ? '#ffd43b' : '#00d4ff',
      '#ffffff', true,
      () => {
        if (canAdvance) {
          mgr.advanceLevel();
          localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
        }
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GameScene');
        });
      }, 700);

    if (canAdvance) {
      // Secondary replay below
      this.createPillButton(GAME_WIDTH / 2, btnBase - 76,
        '\u21BB REPLAY', 240, 52, 0x00d4ff, '#00d4ff', '#ffffff', false,
        () => this.scene.start('GameScene'), 800);
    }

    this.createPillButton(GAME_WIDTH / 2, btnBase,
      '\u2630 LEVELS', 200, 48, 0x666666, '#999999', '#ffffff', false,
      () => this.scene.start('MenuScene'), canAdvance ? 900 : 800);
  }

  // ── Shop row ──

  private createShopRow(y: number, item: ReturnType<typeof WalletManager.getShopItems>[0]): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;
    const textColor = canBuy ? '#ffffff' : '#555555';
    const costColor = canBuy ? '#ffd700' : '#444444';

    // Name + description
    this.add.text(GAME_WIDTH / 2 - 210, y, item.name, {
      fontSize: '15px', color: textColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2 - 210, y + 18, item.description, {
      fontSize: '10px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // Buy button
    const btnW = 90, btnH = 34;
    const btnX = GAME_WIDTH / 2 + 165;
    const container = this.add.container(btnX, y);

    const bg = this.add.graphics();
    const bgC = canBuy ? 0xffd700 : 0x444444;
    bg.fillStyle(bgC, canBuy ? 0.15 : 0.06);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(1, bgC, canBuy ? 0.4 : 0.15);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const label = this.add.text(0, 0, costStr, {
      fontSize: '14px', color: costColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    if (canBuy) {
      const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      container.add(hitZone);

      hitZone.on('pointerdown', () => {
        item.buy();
        SoundManager.play('shop_buy');
        // Refresh scene to show updated state
        this.tweens.add({
          targets: container, scale: 0.9, duration: 60, yoyo: true,
          onComplete: () => {
            // Quick refresh: recreate the scene
            this.scene.restart(this.scene.settings.data);
          },
        });
      });
    }
  }

  // ── Stat row with optional count-up ──

  private createStatRow(y: number, label: string, value: string, color: string, delay: number, countUp?: number): void {
    const row = this.add.container(0, y);
    row.add(this.add.text(GAME_WIDTH / 2 - 180, 0, label, {
      fontSize: '16px', color: '#bbbbbb', fontFamily: 'monospace',
    }).setOrigin(0, 0.5));

    const valueText = this.add.text(GAME_WIDTH / 2 + 180, 0, countUp !== undefined ? '0' : value, {
      fontSize: '24px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    row.add(valueText);
    row.setAlpha(0);
    this.tweens.add({ targets: row, alpha: 1, x: { from: 20, to: 0 }, duration: 400, delay, ease: 'Power2' });

    if (countUp !== undefined && countUp > 0) {
      const counter = { val: 0 };
      this.tweens.add({
        targets: counter, val: countUp,
        duration: Math.min(1200, 400 + countUp / 5), delay: delay + 200, ease: 'Power2',
        onUpdate: () => { valueText.setText(String(Math.floor(counter.val))); },
        onComplete: () => { valueText.setText(String(countUp)); },
      });
    }
  }

  // ── Pill button ──

  private createPillButton(
    x: number, y: number, label: string, w: number, h: number,
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
      fontSize: `${Math.min(h * 0.42, 24)}px`,
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
      this.tweens.add({
        targets: container, scale: 0.92, duration: 60, yoyo: true, ease: 'Power2',
        onComplete: () => { container.setScale(1); callback(); },
      });
    });

    this.tweens.add({
      targets: container, alpha: 1, y: { from: y + 15, to: y },
      duration: 400, delay, ease: 'Power2',
    });
  }
}
