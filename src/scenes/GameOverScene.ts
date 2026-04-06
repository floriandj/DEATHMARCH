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
    if (isNewHigh) localStorage.setItem('deathmarch-highscore', String(data.score));

    const mgr = LevelManager.instance;
    const level = mgr.current;
    const levelIndex = mgr.currentLevelIndex;
    const canAdvance = data.bossDefeated && mgr.hasNextLevel;
    const accentHex = level.theme.accentHex;
    const accentColor = level.theme.accentColor;
    const goldEarned = data.goldEarned || 0;
    const showShop = !data.bossDefeated;

    if (data.bossDefeated) SoundManager.play('victory');

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(data.bossDefeated ? 0x51cf66 : 0xff4040, 0.06);
    bgGlow.fillCircle(GAME_WIDTH / 2, 120, 250);

    let yPos = 40;

    // ── Result title with emoji ──
    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    const subtitle = data.bossDefeated ? 'Boss destroyed!' : 'Your army was wiped out';

    const title = this.add.text(GAME_WIDTH / 2, yPos, `${emoji} ${titleText}`, {
      fontSize: '42px', color: titleColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    yPos += 50;
    this.add.text(GAME_WIDTH / 2, yPos, subtitle, {
      fontSize: '16px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    yPos += 30;

    // Level pill
    this.add.text(GAME_WIDTH / 2, yPos, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: '15px', color: accentHex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    yPos += 40;

    // ── Stats with big icons ──
    const cardW = 440;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.04);
    card.fillRoundedRect(cardX, yPos, cardW, 130, 20);

    yPos += 20;
    this.addStatLine(yPos, '\u2B50', 'SCORE', String(data.score), '#ffd43b', data.score);
    yPos += 38;
    this.addStatLine(yPos, '\u{1F3C3}', 'DISTANCE', `${data.distance}m`, '#00d4ff');
    yPos += 38;
    this.addStatLine(yPos, '\u{1FA99}', 'GOLD EARNED', `+${goldEarned}`, '#ffd700');

    yPos += 50;

    if (isNewHigh) {
      const newBest = this.add.text(GAME_WIDTH / 2, yPos, '\u2728 NEW HIGH SCORE! \u2728', {
        fontSize: '20px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: newBest, alpha: { from: 0.5, to: 1 }, scale: { from: 0.95, to: 1.05 },
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      yPos += 35;
    }

    // ── Shop (only on death) ──
    if (showShop) {
      yPos += 10;
      const shopCardW = 480;
      const shopCardX = (GAME_WIDTH - shopCardW) / 2;

      const shopBg = this.add.graphics();
      shopBg.fillStyle(0xffd700, 0.04);
      shopBg.fillRoundedRect(shopCardX, yPos, shopCardW, 290, 20);
      shopBg.lineStyle(1, 0xffd700, 0.15);
      shopBg.strokeRoundedRect(shopCardX, yPos, shopCardW, 290, 20);

      yPos += 16;
      this.add.text(GAME_WIDTH / 2, yPos, '\u{1F6D2} POWER UP!', {
        fontSize: '20px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5);

      yPos += 24;
      this.add.text(GAME_WIDTH / 2, yPos, `You have ${WalletManager.gold} gold`, {
        fontSize: '16px', color: '#aa8800', fontFamily: 'monospace',
      }).setOrigin(0.5);

      yPos += 30;

      const items = WalletManager.getShopItems();
      const shopIcons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const shopHints = [
        'Start with 3 extra soldiers',
        'Begin with a stronger weapon',
        'Block 1 enemy hit for free',
        'Earn 50% more gold forever!',
      ];
      for (let i = 0; i < items.length; i++) {
        this.addShopItem(yPos, shopIcons[i], items[i], shopHints[i]);
        yPos += 52;
      }
    }

    // ── Buttons — anchored near bottom of screen ──
    const btnW = 360, btnH = 64;
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + 16) - 16;
    // Place buttons at bottom with padding, but not higher than content
    const btnStartY = Math.max(yPos + 30, GAME_HEIGHT - btnBlockH - 50);

    let btnY = btnStartY;

    if (canAdvance) {
      this.createButton(GAME_WIDTH / 2, btnY, '\u27A1\uFE0F  NEXT LEVEL', btnW, btnH,
        0xffd43b, '#ffd43b', true, () => {
          mgr.advanceLevel();
          localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
          this.fadeToGame();
        }, 700);
      btnY += btnH + 16;

      this.createButton(GAME_WIDTH / 2, btnY, '\u21BB  REPLAY', btnW, btnH,
        0x00d4ff, '#00d4ff', false, () => this.fadeToGame(), 800);
      btnY += btnH + 16;
    } else {
      this.createButton(GAME_WIDTH / 2, btnY, '\u{1F4AA}  TRY AGAIN', btnW, btnH,
        0x00d4ff, '#00d4ff', true, () => this.fadeToGame(), 700);
      btnY += btnH + 16;
    }

    this.createButton(GAME_WIDTH / 2, btnY, '\u2630  LEVELS', btnW, btnH,
      0x666666, '#999999', false, () => this.scene.start('MenuScene'),
      canAdvance ? 900 : 800);
  }

  // ── Helpers ──

  private addStatLine(y: number, icon: string, label: string, value: string, color: string, countUp?: number): void {
    this.add.text(80, y, icon, { fontSize: '22px' }).setOrigin(0, 0.5);
    this.add.text(115, y, label, {
      fontSize: '15px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    const val = this.add.text(GAME_WIDTH - 80, y, countUp !== undefined ? '0' : value, {
      fontSize: '24px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    if (countUp !== undefined && countUp > 0) {
      const counter = { val: 0 };
      this.tweens.add({
        targets: counter, val: countUp,
        duration: Math.min(1000, 400 + countUp / 5), delay: 300, ease: 'Power2',
        onUpdate: () => val.setText(String(Math.floor(counter.val))),
        onComplete: () => val.setText(String(countUp)),
      });
    }
  }

  private addShopItem(y: number, icon: string, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'OWNED' : `${cost}g`;

    // Icon
    this.add.text(70, y + 8, icon, { fontSize: '24px' }).setOrigin(0, 0.5);

    // Name + description
    this.add.text(105, y, item.name, {
      fontSize: '16px', color: canBuy ? '#ffffff' : '#555555', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(105, y + 20, hint, {
      fontSize: '11px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // Buy button
    const btnW = 80, btnH = 36;
    const btnX = GAME_WIDTH - 90;
    const container = this.add.container(btnX, y + 8);

    const bg = this.add.graphics();
    const bgC = canBuy ? 0xffd700 : 0x444444;
    bg.fillStyle(bgC, canBuy ? 0.2 : 0.06);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(1, bgC, canBuy ? 0.5 : 0.15);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    container.add(this.add.text(0, 0, costStr, {
      fontSize: '15px', color: canBuy ? '#ffd700' : '#444444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    if (canBuy) {
      const hitZone = this.add.zone(0, 0, btnW + 20, btnH + 10).setInteractive({ useHandCursor: true });
      container.add(hitZone);
      hitZone.on('pointerdown', () => {
        item.buy();
        SoundManager.play('shop_buy');
        this.tweens.add({
          targets: container, scale: 0.9, duration: 60, yoyo: true,
          onComplete: () => this.scene.restart(this.scene.settings.data),
        });
      });
    }
  }

  private createButton(
    x: number, y: number, label: string, w: number, h: number,
    color: number, textColor: string, pulse: boolean,
    callback: () => void, delay: number,
  ): void {
    const container = this.add.container(x, y).setAlpha(0);
    const r = h / 2;

    if (pulse) {
      const glow = this.add.graphics();
      glow.fillStyle(color, 0.1);
      glow.fillRoundedRect(-w / 2 - 6, -r - 6, w + 12, h + 12, r + 6);
      container.add(glow);
      this.tweens.add({
        targets: glow, alpha: { from: 0.1, to: 0.4 },
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    const bg = this.add.graphics();
    bg.fillStyle(color, 0.15);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.lineStyle(2, color, 0.5);
    bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    container.add(bg);

    container.add(this.add.text(0, 0, label, {
      fontSize: '24px', color: textColor, fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5));

    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.25);
      bg.fillRoundedRect(-w / 2, -r, w, h, r);
      bg.lineStyle(2, color, 0.8);
      bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 0.15);
      bg.fillRoundedRect(-w / 2, -r, w, h, r);
      bg.lineStyle(2, color, 0.5);
      bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    });
    hitZone.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({
        targets: container, scale: 0.92, duration: 60, yoyo: true, ease: 'Power2',
        onComplete: () => { container.setScale(1); callback(); },
      });
    });

    this.tweens.add({
      targets: container, alpha: 1, y: { from: y + 12, to: y },
      duration: 350, delay, ease: 'Power2',
    });
  }

  private fadeToGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}
