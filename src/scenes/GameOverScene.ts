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

// Consistent padding from edges
const PAD = 40;
const CW = GAME_WIDTH - PAD * 2; // content width

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor('#080818');

    const prev = parseInt(localStorage.getItem('deathmarch-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) localStorage.setItem('deathmarch-highscore', String(data.score));

    const mgr = LevelManager.instance;
    const level = mgr.current;
    const levelIndex = mgr.currentLevelIndex;
    const canAdvance = data.bossDefeated && mgr.hasNextLevel;
    const accentHex = level.theme.accentHex;
    const goldEarned = data.goldEarned || 0;
    const showShop = !data.bossDefeated;

    if (data.bossDefeated) SoundManager.play('victory');

    let y = 30;

    // ── Header card (title + level info) ──
    const headerColor = data.bossDefeated ? 0x51cf66 : 0xff4040;
    const headerH = 140;
    this.drawCard(PAD, y, CW, headerH, headerColor, 0.15, 3);

    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';

    const title = this.add.text(GAME_WIDTH / 2, y + 40, `${emoji}  ${titleText}`, {
      fontSize: '38px', color: titleColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    const subtitle = data.bossDefeated ? 'Boss destroyed!' : 'Your army was wiped out';
    this.add.text(GAME_WIDTH / 2, y + 80, subtitle, {
      fontSize: '15px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, y + 108, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: '14px', color: accentHex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    y += headerH + 14;

    // ── Score card (big, gold) ──
    this.drawCard(PAD, y, CW, 80, 0xffd43b, 0.12, 2);

    this.add.text(PAD + 20, y + 26, '\u2B50', { fontSize: '28px' }).setOrigin(0, 0.5);
    this.add.text(PAD + 56, y + 22, 'SCORE', {
      fontSize: '13px', color: '#ccaa44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const scoreVal = this.add.text(PAD + CW - 20, y + 44, '0', {
      fontSize: '36px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    if (data.score > 0) {
      const ctr = { val: 0 };
      this.tweens.add({
        targets: ctr, val: data.score,
        duration: Math.min(1200, 500 + data.score / 10), delay: 300, ease: 'Power2',
        onUpdate: () => scoreVal.setText(String(Math.floor(ctr.val))),
        onComplete: () => scoreVal.setText(String(data.score)),
      });
    } else scoreVal.setText('0');

    y += 90;

    // ── Distance + Gold (side by side) ──
    const halfW = (CW - 10) / 2;

    this.drawCard(PAD, y, halfW, 72, 0x00d4ff, 0.12, 2);
    this.add.text(PAD + 14, y + 20, '\u{1F3C3}', { fontSize: '18px' }).setOrigin(0, 0.5);
    this.add.text(PAD + 38, y + 20, 'DISTANCE', {
      fontSize: '11px', color: '#0099bb', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + halfW - 14, y + 48, `${data.distance}m`, {
      fontSize: '24px', color: '#00d4ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const goldX = PAD + halfW + 10;
    this.drawCard(goldX, y, halfW, 72, 0xffd700, 0.12, 2);
    this.add.text(goldX + 14, y + 20, '\u{1FA99}', { fontSize: '18px' }).setOrigin(0, 0.5);
    this.add.text(goldX + 38, y + 20, 'GOLD', {
      fontSize: '11px', color: '#bb8800', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(goldX + halfW - 14, y + 48, `+${goldEarned}`, {
      fontSize: '24px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    y += 82;

    if (isNewHigh) {
      const nb = this.add.text(GAME_WIDTH / 2, y + 10, '\u2728 NEW HIGH SCORE! \u2728', {
        fontSize: '18px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: nb, alpha: { from: 0.5, to: 1 }, scale: { from: 0.96, to: 1.04 },
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      y += 36;
    }

    // ── Shop (only on death) ──
    if (showShop) {
      y += 8;
      this.drawCard(PAD, y, CW, 280, 0xffd43b, 0.06, 2);

      this.add.text(GAME_WIDTH / 2, y + 22, '\u{1F6D2}  POWER UP!', {
        fontSize: '20px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5);

      // Gold balance pill
      const balPillW = 140;
      const balG = this.add.graphics();
      balG.fillStyle(0xffd700, 0.15);
      balG.fillRoundedRect(GAME_WIDTH / 2 - balPillW / 2, y + 38, balPillW, 28, 14);
      balG.lineStyle(1, 0xffd700, 0.3);
      balG.strokeRoundedRect(GAME_WIDTH / 2 - balPillW / 2, y + 38, balPillW, 28, 14);
      this.add.text(GAME_WIDTH / 2, y + 52, `\u{1FA99} ${WalletManager.gold}g`, {
        fontSize: '15px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);

      y += 74;

      const items = WalletManager.getShopItems();
      const icons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const iconColors = [0x00d4ff, 0xff6b6b, 0x51cf66, 0xffd700];
      const hints = [
        'Start with 3 extra soldiers',
        'Begin with a stronger weapon',
        'Block 1 enemy hit for free',
        'Earn 50% more gold forever!',
      ];
      for (let i = 0; i < items.length; i++) {
        this.addShopItem(y, icons[i], iconColors[i], items[i], hints[i]);
        y += 48;
      }
    }

    // ── Buttons (always at bottom) ──
    const btnW = CW;
    const btnH = 60;
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + 12) - 12;
    let btnY = Math.max(y + 30, GAME_HEIGHT - btnBlockH - 40);

    if (canAdvance) {
      this.createButton(GAME_WIDTH / 2, btnY, '\u27A1\uFE0F  NEXT LEVEL', btnW, btnH,
        0xffd43b, '#111', true, () => {
          mgr.advanceLevel();
          localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
          this.fadeToGame();
        }, 600);
      btnY += btnH + 12;

      this.createButton(GAME_WIDTH / 2, btnY, '\u21BB  REPLAY', btnW, btnH,
        0x00d4ff, '#111', false, () => this.fadeToGame(), 700);
      btnY += btnH + 12;
    } else {
      this.createButton(GAME_WIDTH / 2, btnY, '\u{1F4AA}  TRY AGAIN', btnW, btnH,
        0x00d4ff, '#111', true, () => this.fadeToGame(), 600);
      btnY += btnH + 12;
    }

    this.createButton(GAME_WIDTH / 2, btnY, '\u2630  LEVELS', btnW, btnH,
      0x444466, '#cccccc', false, () => this.scene.start('MenuScene'),
      canAdvance ? 800 : 700);
  }

  // ── Helpers ──

  private drawCard(x: number, y: number, w: number, h: number, color: number, alpha: number, borderW: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, alpha * 0.3);
    g.fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(borderW, color, alpha + 0.15);
    g.strokeRoundedRect(x, y, w, h, 16);
  }

  private addShopItem(y: number, icon: string, iconColor: number, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;

    // Icon circle
    const iconG = this.add.graphics();
    iconG.fillStyle(iconColor, canBuy ? 0.2 : 0.06);
    iconG.fillCircle(PAD + 26, y + 12, 18);
    iconG.lineStyle(1, iconColor, canBuy ? 0.4 : 0.1);
    iconG.strokeCircle(PAD + 26, y + 12, 18);

    this.add.text(PAD + 26, y + 12, icon, {
      fontSize: '16px',
    }).setOrigin(0.5).setAlpha(canBuy ? 1 : 0.4);

    this.add.text(PAD + 52, y + 4, item.name, {
      fontSize: '15px', color: canBuy ? '#ffffff' : '#555555', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + 52, y + 22, hint, {
      fontSize: '10px', color: '#777777', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // Buy button
    const btnW = 80, btnH = 34;
    const btnX = PAD + CW - 54;
    const container = this.add.container(btnX, y + 12);

    const bg = this.add.graphics();
    if (canBuy) {
      bg.fillStyle(0xffd700, 0.3);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(2, 0xffd700, 0.6);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    } else {
      bg.fillStyle(0x333333, 0.2);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(1, 0x333333, 0.2);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    }
    container.add(bg);

    container.add(this.add.text(0, 0, costStr, {
      fontSize: '14px', color: canBuy ? '#ffd700' : '#444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    if (canBuy) {
      const hit = this.add.zone(0, 0, btnW + 20, btnH + 10).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerdown', () => {
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

    // Button fill
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    // Top highlight
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 4, -r + 3, w - 8, h * 0.4, { tl: r - 2, tr: r - 2, bl: 0, br: 0 });
    container.add(bg);

    if (pulse) {
      const glow = this.add.graphics();
      glow.fillStyle(color, 0.15);
      glow.fillRoundedRect(-w / 2 - 4, -r - 4, w + 8, h + 8, r + 4);
      container.addAt(glow, 0);
      this.tweens.add({
        targets: glow, alpha: { from: 0.1, to: 0.4 },
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    container.add(this.add.text(0, 0, label, {
      fontSize: '22px', color: textColor, fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hit);

    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({
        targets: container, scale: 0.94, duration: 60, yoyo: true, ease: 'Power2',
        onComplete: () => { container.setScale(1); callback(); },
      });
    });

    this.tweens.add({
      targets: container, alpha: 1, y: { from: y + 10, to: y },
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
