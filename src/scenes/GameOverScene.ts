// src/scenes/GameOverScene.ts
// Colorful game-UI style: dark navy panels, bright headers, vivid buttons
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager, getCheckpointLevel } from '@/systems/PerkManager';

interface GameOverData { score: number; distance: number; bossDefeated: boolean; goldEarned: number; }

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
// Color palette
const C_BG = 0x0f1923;
const C_PANEL = 0x1a2840;
const C_BORDER = 0x2a3f5f;
const C_YELLOW = 0xfbbf24;
const C_GREEN = 0x22c55e;
const C_BLUE = 0x3b82f6;
const C_RED = 0xef4444;
const C_TEAL = 0x06b6d4;
const C_PINK = 0xec4899;
const C_ORANGE = 0xf97316;

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor('#0a0f1a');
    // Vignette overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.15);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const prev = parseInt(localStorage.getItem('deathmarch-highscore') || '0', 10);
    const isNewHigh = data.score > prev;
    if (isNewHigh) localStorage.setItem('deathmarch-highscore', String(data.score));

    const mgr = LevelManager.instance;
    const level = mgr.current;
    const levelIndex = mgr.currentLevelIndex;
    const canAdvance = data.bossDefeated && mgr.hasNextLevel;
    const goldEarned = data.goldEarned || 0;
    const showShop = !data.bossDefeated;
    if (data.bossDefeated) SoundManager.play('victory');

    // On death: restore perks to last checkpoint state and go back to checkpoint level
    const checkpointLvl = PerkManager.instance.checkpointLevel;
    if (!data.bossDefeated) {
      PerkManager.instance.restoreCheckpoint();
      mgr.setLevel(checkpointLvl);
    }

    const vs = Math.min(1.35, Math.max(0.85, GAME_HEIGHT / 1280));
    let y = Math.round(20 * vs);

    // ── Title panel with colored header ──
    const titleH = Math.round(140 * vs);
    const headerBarH = Math.round(8 * vs);
    const headerColor = data.bossDefeated ? C_GREEN : C_RED;
    this.panel(PAD, y, CW, titleH, headerColor);

    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#4ade80' : '#f87171';

    const title = this.add.text(GAME_WIDTH / 2, y + titleH * 0.33, `${emoji}  ${titleText}`, {
      fontSize: `${Math.round(46 * vs)}px`, color: titleColor, fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: Math.round(4 * vs),
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.text(GAME_WIDTH / 2, y + titleH * 0.65, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: `${Math.round(17 * vs)}px`, color: '#94a3b8', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stars row
    const starY = y + titleH * 0.85;
    const starCount = data.bossDefeated ? 3 : Math.min(2, Math.floor(data.distance / 800));
    for (let i = 0; i < 3; i++) {
      this.add.text(GAME_WIDTH / 2 + (i - 1) * Math.round(44 * vs), starY, '\u2B50', {
        fontSize: `${Math.round(28 * vs)}px`,
      }).setOrigin(0.5).setAlpha(i < starCount ? 1 : 0.2);
    }

    y += titleH + Math.round(12 * vs);

    // ── Stats panel ──
    const statsH = Math.round(150 * vs);
    this.panel(PAD, y, CW, statsH, C_YELLOW);

    // Score row
    const scoreRowY = y + Math.round(30 * vs);
    this.iconBadge(PAD + 18, scoreRowY, '\u2B50', C_YELLOW, vs);
    this.add.text(PAD + Math.round(52 * vs), scoreRowY, 'SCORE', {
      fontSize: `${Math.round(14 * vs)}px`, color: '#94a3b8', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const scoreVal = this.add.text(PAD + CW - 18, scoreRowY + Math.round(6 * vs), '0', {
      fontSize: `${Math.round(44 * vs)}px`, color: '#ffffff', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    if (data.score > 0) {
      const ctr = { val: 0 };
      this.tweens.add({ targets: ctr, val: data.score, duration: 1000, delay: 300, ease: 'Power2',
        onUpdate: () => scoreVal.setText(String(Math.floor(ctr.val))),
        onComplete: () => scoreVal.setText(String(data.score)) });
    }

    // Divider
    this.add.rectangle(GAME_WIDTH / 2, y + Math.round(65 * vs), CW - 30, 1, 0xffffff, 0.08);

    // Distance
    const row2Y = y + Math.round(92 * vs);
    this.iconBadge(PAD + 18, row2Y, '\u{1F3C3}', C_TEAL, vs);
    this.add.text(PAD + Math.round(52 * vs), row2Y - 4, `${data.distance}m`, {
      fontSize: `${Math.round(24 * vs)}px`, color: '#38bdf8', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Gold
    this.iconBadge(GAME_WIDTH / 2 + Math.round(20 * vs), row2Y, '\u{1FA99}', C_ORANGE, vs);
    this.add.text(GAME_WIDTH / 2 + Math.round(54 * vs), row2Y - 4, `+${goldEarned}g`, {
      fontSize: `${Math.round(24 * vs)}px`, color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (isNewHigh) {
      this.add.text(PAD + CW - 18, row2Y + Math.round(20 * vs), '\u2728 NEW BEST!', {
        fontSize: `${Math.round(13 * vs)}px`, color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    }

    y += statsH + Math.round(12 * vs);

    // ── Perks display (after checkpoint restore on death) ──
    const activePerks = PerkManager.instance.getAll();
    const streak = PerkManager.instance.runStreak;
    if (activePerks.length > 0 || streak > 0 || (!data.bossDefeated && checkpointLvl > 0)) {
      const perkH = Math.round(60 * vs);
      const isVictory = data.bossDefeated;
      this.panel(PAD, y, CW, perkH, isVictory ? 0xa855f7 : 0xf97316);
      const perkLabel = isVictory ? 'ACTIVE PERKS' :
        (activePerks.length > 0 ? `\u{1F6A9} CHECKPOINT PERKS (LVL ${checkpointLvl + 1})` : 'NO CHECKPOINT PERKS');
      const labelColor = isVictory ? '#c084fc' : (activePerks.length > 0 ? '#fb923c' : '#94a3b8');
      this.add.text(PAD + 16, y + perkH * 0.35, perkLabel, {
        fontSize: `${Math.round(11 * vs)}px`, color: labelColor, fontFamily: F, fontStyle: 'bold', letterSpacing: 1,
      }).setOrigin(0, 0.5);
      if (activePerks.length > 0) {
        const icons = activePerks.map((p) => p.icon).join(' ');
        this.add.text(PAD + CW - 16, y + perkH * 0.35, icons, {
          fontSize: `${Math.round(18 * vs)}px`,
        }).setOrigin(1, 0.5);
      }
      if (streak > 0) {
        this.add.text(PAD + 16, y + perkH * 0.72, `\u{1F525} ${streak} streak  \u00D7${(1 + streak * 0.25).toFixed(2)} gold`, {
          fontSize: `${Math.round(12 * vs)}px`, color: '#f97316', fontFamily: F, fontStyle: 'bold',
        }).setOrigin(0, 0.5);
      }
      y += perkH + Math.round(8 * vs);
    }

    // ── Shop panel (death only) ──
    if (showShop) {
      const itemH = Math.round(56 * vs);
      const shopH = Math.round(68 * vs) + 4 * itemH;
      this.panel(PAD, y, CW, shopH, C_ORANGE);

      this.add.text(GAME_WIDTH / 2, y + Math.round(20 * vs), 'POWER UP', {
        fontSize: `${Math.round(18 * vs)}px`, color: '#fbbf24', fontFamily: F, fontStyle: 'bold', letterSpacing: 4,
      }).setOrigin(0.5);

      // Gold pill
      const pillW = Math.round(120 * vs), pillH = Math.round(28 * vs);
      const pillY = y + Math.round(40 * vs);
      const pg = this.add.graphics();
      pg.fillStyle(C_YELLOW, 0.2);
      pg.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
      this.add.text(GAME_WIDTH / 2, pillY + pillH / 2, `\u{1FA99}  ${WalletManager.gold}g`, {
        fontSize: `${Math.round(14 * vs)}px`, color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
      }).setOrigin(0.5);

      let iy = y + Math.round(72 * vs);
      const items = WalletManager.getShopItems();
      const shopIcons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const shopColors = [C_BLUE, C_RED, C_GREEN, C_YELLOW];
      const hints = ['1 extra soldier', 'Stronger weapon', 'Block 1 hit', '+50% gold forever'];
      for (let i = 0; i < items.length; i++) {
        this.shopItem(iy, shopIcons[i], shopColors[i], items[i], hints[i], vs);
        iy += itemH;
      }
      y += shopH + Math.round(12 * vs);
    }

    // ── Buttons (bottom) ──
    const btnH = Math.round(62 * vs);
    const btnGap = Math.round(10 * vs);
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + btnGap) - btnGap;
    let btnY = Math.max(y + Math.round(16 * vs), GAME_HEIGHT - btnBlockH - Math.round(24 * vs));

    if (canAdvance) {
      this.btn(btnY, 'NEXT LEVEL  \u25B6', C_GREEN, 0x16a34a, '#fff', () => {
        mgr.advanceLevel(); localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex)); this.fadeToGame();
      }, 500); btnY += btnH + btnGap;
      this.btn(btnY, '\u21BB  REPLAY', C_BLUE, 0x2563eb, '#fff', () => this.fadeToGame(), 600);
      btnY += btnH + btnGap;
    } else {
      const retryLabel = checkpointLvl === levelIndex
        ? '\u{1F4AA}  TRY AGAIN'
        : `\u{1F6A9}  RETRY FROM LVL ${checkpointLvl + 1}`;
      this.btn(btnY, retryLabel, C_BLUE, 0x2563eb, '#fff', () => this.fadeToGame(), 500);
      btnY += btnH + btnGap;
    }
    this.btn(btnY, '\u2630  LEVELS', 0x374151, 0x1f2937, '#9ca3af', () => this.scene.start('MenuScene'), canAdvance ? 700 : 600);
  }

  // ── Dark panel with colored top accent bar ──
  private panel(x: number, y: number, w: number, h: number, accentColor: number): void {
    const g = this.add.graphics();
    // Panel body
    g.fillStyle(0x0d1520, 1);
    g.fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(2, C_BORDER, 0.7);
    g.strokeRoundedRect(x, y, w, h, 16);
    // Colored top accent bar
    g.fillStyle(accentColor, 0.9);
    g.fillRoundedRect(x + 2, y + 2, w - 4, 6, { tl: 14, tr: 14, bl: 0, br: 0 });
  }

  // ── Small colored icon badge ──
  private iconBadge(x: number, y: number, icon: string, color: number, vs: number): void {
    const r = Math.round(16 * vs);
    const g = this.add.graphics();
    g.fillStyle(color, 0.2);
    g.fillCircle(x, y, r);
    g.lineStyle(2, color, 0.4);
    g.strokeCircle(x, y, r);
    this.add.text(x, y, icon, { fontSize: `${Math.round(16 * vs)}px` }).setOrigin(0.5);
  }

  // ── Shop item row ──
  private shopItem(y: number, icon: string, iconColor: number, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string, vs: number): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;

    this.iconBadge(PAD + 24, y + 8, icon, iconColor, vs * 0.85);

    this.add.text(PAD + Math.round(52 * vs), y, item.name, {
      fontSize: `${Math.round(15 * vs)}px`, color: canBuy ? '#e2e8f0' : '#475569', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + Math.round(52 * vs), y + Math.round(20 * vs), hint, {
      fontSize: `${Math.round(11 * vs)}px`, color: '#64748b', fontFamily: F,
    }).setOrigin(0, 0.5);

    const bw = Math.round(78 * vs), bh = Math.round(34 * vs);
    const bx = PAD + CW - Math.round(48 * vs);
    const c = this.add.container(bx, y + 8);
    const bg = this.add.graphics();
    bg.fillStyle(canBuy ? C_GREEN : 0x374151, canBuy ? 1 : 0.6);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    if (canBuy) {
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh * 0.4, { tl: bh / 2 - 1, tr: bh / 2 - 1, bl: 0, br: 0 });
    }
    c.add(bg);
    c.add(this.add.text(0, 0, costStr, {
      fontSize: `${Math.round(14 * vs)}px`, color: canBuy ? '#fff' : '#64748b', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5));

    if (canBuy) {
      const hit = this.add.zone(0, 0, bw + 16, bh + 8).setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerdown', () => {
        item.buy(); SoundManager.play('shop_buy');
        this.tweens.add({ targets: c, scale: 0.9, duration: 60, yoyo: true,
          onComplete: () => this.scene.restart(this.scene.settings.data) });
      });
    }
  }

  // ── Colored gradient button ──
  private btn(y: number, label: string, colorTop: number, colorBot: number, textColor: string, cb: () => void, delay: number): void {
    const vs = Math.min(1.35, Math.max(0.85, GAME_HEIGHT / 1280));
    const w = CW, h = Math.round(62 * vs), r = h / 2;
    const x = GAME_WIDTH / 2;
    const c = this.add.container(x, y).setAlpha(0);

    // Shadow
    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.4);
    sh.fillRoundedRect(-w / 2 + 3, -r + 4, w, h, r);
    c.add(sh);

    // Fill
    const bg = this.add.graphics();
    bg.fillStyle(colorBot, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.fillStyle(colorTop, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h * 0.5, { tl: r, tr: r, bl: 4, br: 4 });
    // Shine
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 6, -r + 3, w - 12, h * 0.28, { tl: r - 4, tr: r - 4, bl: 0, br: 0 });
    // Gold border for primary buttons
    if (colorTop === C_GREEN || colorTop === C_BLUE) {
      bg.lineStyle(1.5, 0xffd700, 0.4);
      bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    }
    c.add(bg);

    c.add(this.add.text(0, 0, label, {
      fontSize: `${Math.round(22 * vs)}px`, color: textColor, fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: c, scale: 0.94, duration: 50, yoyo: true, ease: 'Power2',
        onComplete: () => { c.setScale(1); cb(); } });
    });

    this.tweens.add({ targets: c, alpha: 1, y: { from: y + 10, to: y }, duration: 300, delay, ease: 'Power2' });
  }

  private fadeToGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }
}
