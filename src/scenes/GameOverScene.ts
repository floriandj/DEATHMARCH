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

const PAD = 36;
const CW = GAME_WIDTH - PAD * 2;

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

    // ── Calculate layout zones based on GAME_HEIGHT ──
    // Buttons always take bottom ~20% of screen
    const btnH = 68;
    const btnGap = 14;
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + btnGap) - btnGap;
    const btnStartY = GAME_HEIGHT - btnBlockH - 30;

    // Content fills top portion
    const contentEndY = btnStartY - 20;

    // Scale factor: how much vertical space we have vs baseline 1280
    const vScale = Math.min(1.3, Math.max(0.8, GAME_HEIGHT / 1280));

    let y = Math.round(20 * vScale);

    // ── Header card ──
    const headerColor = data.bossDefeated ? 0x51cf66 : 0xff4040;
    const headerH = Math.round(150 * vScale);
    this.drawCard(PAD, y, CW, headerH, headerColor, 0.15, 3);

    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#51cf66' : '#ff6b6b';
    const subtitle = data.bossDefeated ? 'Boss destroyed!' : 'Your army was wiped out';

    const title = this.add.text(GAME_WIDTH / 2, y + headerH * 0.3, `${emoji}  ${titleText}`, {
      fontSize: `${Math.round(44 * vScale)}px`, color: titleColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.text(GAME_WIDTH / 2, y + headerH * 0.58, subtitle, {
      fontSize: `${Math.round(18 * vScale)}px`, color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, y + headerH * 0.78, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: `${Math.round(17 * vScale)}px`, color: accentHex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    y += headerH + Math.round(14 * vScale);

    // ── Score card ──
    const scoreH = Math.round(90 * vScale);
    this.drawCard(PAD, y, CW, scoreH, 0xffd43b, 0.12, 2);

    this.add.text(PAD + 20, y + scoreH * 0.3, '\u2B50', { fontSize: `${Math.round(32 * vScale)}px` }).setOrigin(0, 0.5);
    this.add.text(PAD + 20 + Math.round(40 * vScale), y + scoreH * 0.25, 'SCORE', {
      fontSize: `${Math.round(16 * vScale)}px`, color: '#ccaa44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const scoreVal = this.add.text(PAD + CW - 20, y + scoreH * 0.6, '0', {
      fontSize: `${Math.round(42 * vScale)}px`, color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
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

    y += scoreH + Math.round(10 * vScale);

    // ── Distance + Gold side by side ──
    const halfW = (CW - 10) / 2;
    const subH = Math.round(80 * vScale);

    this.drawCard(PAD, y, halfW, subH, 0x00d4ff, 0.12, 2);
    this.add.text(PAD + 16, y + subH * 0.3, '\u{1F3C3} DISTANCE', {
      fontSize: `${Math.round(13 * vScale)}px`, color: '#0099bb', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + halfW - 16, y + subH * 0.65, `${data.distance}m`, {
      fontSize: `${Math.round(28 * vScale)}px`, color: '#00d4ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const goldX = PAD + halfW + 10;
    this.drawCard(goldX, y, halfW, subH, 0xffd700, 0.12, 2);
    this.add.text(goldX + 16, y + subH * 0.3, '\u{1FA99} GOLD', {
      fontSize: `${Math.round(13 * vScale)}px`, color: '#bb8800', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(goldX + halfW - 16, y + subH * 0.65, `+${goldEarned}`, {
      fontSize: `${Math.round(28 * vScale)}px`, color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    y += subH + Math.round(10 * vScale);

    if (isNewHigh) {
      this.add.text(GAME_WIDTH / 2, y + 8, '\u2728 NEW HIGH SCORE! \u2728', {
        fontSize: `${Math.round(22 * vScale)}px`, color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      y += Math.round(36 * vScale);
    }

    // ── Shop (death only) ──
    if (showShop) {
      y += Math.round(8 * vScale);
      const itemH = Math.round(54 * vScale);
      const shopH = Math.round(80 * vScale) + 4 * itemH + 10;
      this.drawCard(PAD, y, CW, shopH, 0xffd43b, 0.06, 2);

      this.add.text(GAME_WIDTH / 2, y + Math.round(24 * vScale), '\u{1F6D2}  POWER UP!', {
        fontSize: `${Math.round(22 * vScale)}px`, color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5);

      const balPillW = Math.round(160 * vScale);
      const balG = this.add.graphics();
      balG.fillStyle(0xffd700, 0.15);
      balG.fillRoundedRect(GAME_WIDTH / 2 - balPillW / 2, y + Math.round(42 * vScale), balPillW, Math.round(32 * vScale), 16);
      balG.lineStyle(1, 0xffd700, 0.3);
      balG.strokeRoundedRect(GAME_WIDTH / 2 - balPillW / 2, y + Math.round(42 * vScale), balPillW, Math.round(32 * vScale), 16);
      this.add.text(GAME_WIDTH / 2, y + Math.round(58 * vScale), `\u{1FA99} ${WalletManager.gold}g`, {
        fontSize: `${Math.round(17 * vScale)}px`, color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);

      let iy = y + Math.round(82 * vScale);
      const items = WalletManager.getShopItems();
      const icons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const iconColors = [0x00d4ff, 0xff6b6b, 0x51cf66, 0xffd700];
      const hints = ['Start with 3 extra soldiers', 'Begin with a stronger weapon', 'Block 1 enemy hit for free', 'Earn 50% more gold forever!'];
      for (let i = 0; i < items.length; i++) {
        this.addShopItem(iy, icons[i], iconColors[i], items[i], hints[i], vScale);
        iy += itemH;
      }
    }

    // ── Buttons at bottom ──
    let btnY = btnStartY;

    if (canAdvance) {
      this.createButton(GAME_WIDTH / 2, btnY, '\u27A1\uFE0F  NEXT LEVEL', CW, btnH,
        0xffd43b, '#111', true, () => {
          mgr.advanceLevel();
          localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
          this.fadeToGame();
        }, 600);
      btnY += btnH + btnGap;

      this.createButton(GAME_WIDTH / 2, btnY, '\u21BB  REPLAY', CW, btnH,
        0x00d4ff, '#111', false, () => this.fadeToGame(), 700);
      btnY += btnH + btnGap;
    } else {
      this.createButton(GAME_WIDTH / 2, btnY, '\u{1F4AA}  TRY AGAIN', CW, btnH,
        0x00d4ff, '#111', true, () => this.fadeToGame(), 600);
      btnY += btnH + btnGap;
    }

    this.createButton(GAME_WIDTH / 2, btnY, '\u2630  LEVELS', CW, btnH,
      0x333355, '#cccccc', false, () => this.scene.start('MenuScene'),
      canAdvance ? 800 : 700);
  }

  private drawCard(x: number, y: number, w: number, h: number, color: number, alpha: number, borderW: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, alpha * 0.3);
    g.fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(borderW, color, alpha + 0.15);
    g.strokeRoundedRect(x, y, w, h, 16);
  }

  private addShopItem(y: number, icon: string, iconColor: number, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string, vs: number): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;
    const iconR = Math.round(20 * vs);

    const iconG = this.add.graphics();
    iconG.fillStyle(iconColor, canBuy ? 0.2 : 0.06);
    iconG.fillCircle(PAD + 26, y + 12, iconR);
    iconG.lineStyle(1, iconColor, canBuy ? 0.4 : 0.1);
    iconG.strokeCircle(PAD + 26, y + 12, iconR);

    this.add.text(PAD + 26, y + 12, icon, { fontSize: `${Math.round(18 * vs)}px` }).setOrigin(0.5).setAlpha(canBuy ? 1 : 0.4);

    this.add.text(PAD + 26 + iconR + 10, y + 2, item.name, {
      fontSize: `${Math.round(16 * vs)}px`, color: canBuy ? '#ffffff' : '#555', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + 26 + iconR + 10, y + Math.round(22 * vs), hint, {
      fontSize: `${Math.round(11 * vs)}px`, color: '#777', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    const btnW = Math.round(90 * vs), btnH2 = Math.round(38 * vs);
    const btnX = PAD + CW - Math.round(56 * vs);
    const container = this.add.container(btnX, y + 12);
    const bg = this.add.graphics();
    if (canBuy) {
      bg.fillStyle(0xffd700, 0.3);
      bg.fillRoundedRect(-btnW / 2, -btnH2 / 2, btnW, btnH2, btnH2 / 2);
      bg.lineStyle(2, 0xffd700, 0.6);
      bg.strokeRoundedRect(-btnW / 2, -btnH2 / 2, btnW, btnH2, btnH2 / 2);
    } else {
      bg.fillStyle(0x333333, 0.2);
      bg.fillRoundedRect(-btnW / 2, -btnH2 / 2, btnW, btnH2, btnH2 / 2);
    }
    container.add(bg);
    container.add(this.add.text(0, 0, costStr, {
      fontSize: `${Math.round(15 * vs)}px`, color: canBuy ? '#ffd700' : '#444', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    if (canBuy) {
      const hit = this.add.zone(0, 0, btnW + 20, btnH2 + 10).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerdown', () => {
        item.buy(); SoundManager.play('shop_buy');
        this.tweens.add({ targets: container, scale: 0.9, duration: 60, yoyo: true,
          onComplete: () => this.scene.restart(this.scene.settings.data) });
      });
    }
  }

  private createButton(x: number, y: number, label: string, w: number, h: number,
    color: number, textColor: string, pulse: boolean, callback: () => void, delay: number): void {
    const container = this.add.container(x, y).setAlpha(0);
    const r = h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 4, -r + 3, w - 8, h * 0.4, { tl: r - 2, tr: r - 2, bl: 0, br: 0 });
    container.add(bg);

    if (pulse) {
      const glow = this.add.graphics();
      glow.fillStyle(color, 0.15);
      glow.fillRoundedRect(-w / 2 - 4, -r - 4, w + 8, h + 8, r + 4);
      container.addAt(glow, 0);
      this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.4 }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    container.add(this.add.text(0, 0, label, {
      fontSize: '24px', color: textColor, fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: container, scale: 0.94, duration: 60, yoyo: true, ease: 'Power2',
        onComplete: () => { container.setScale(1); callback(); } });
    });
    this.tweens.add({ targets: container, alpha: 1, y: { from: y + 10, to: y }, duration: 350, delay, ease: 'Power2' });
  }

  private fadeToGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }
}
