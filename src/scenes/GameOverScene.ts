// src/scenes/GameOverScene.ts
// Colorful game-UI style: dark navy panels, bright headers, vivid buttons
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager, getCheckpointLevel } from '@/systems/PerkManager';

interface GameOverData { score: number; distance: number; bossDefeated: boolean; goldEarned: number; }

const PAD = 34;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
// Color palette
const C_BG = 0x2484c5;
const C_PANEL = 0x2e92d4;
const C_BORDER = 0x4aa8e0;
const C_YELLOW = 0xebb654;
const C_GREEN = 0x4cde39;
const C_BLUE = 0x2e92d4;
const C_RED = 0xe85454;
const C_TEAL = 0x40c4e8;
const C_PINK = 0xe85a9c;
const C_ORANGE = 0xe8923a;

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor('#2484c5');
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
    let y = Math.round(24 * vs);

    // ── Title panel with colored header ──
    const titleH = Math.round(168 * vs);
    const headerBarH = Math.round(10 * vs);
    const headerColor = data.bossDefeated ? C_GREEN : C_RED;
    this.panel(PAD, y, CW, titleH, headerColor);

    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#6be85a' : '#f07070';

    const title = this.add.text(GAME_WIDTH / 2, y + titleH * 0.33, `${emoji}  ${titleText}`, {
      fontSize: `${Math.round(55 * vs)}px`, color: titleColor, fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: Math.round(5 * vs),
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.text(GAME_WIDTH / 2, y + titleH * 0.65, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: `${Math.round(20 * vs)}px`, color: '#8fb0c4', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setOrigin(0.5);

    // Stars row
    const starY = y + titleH * 0.85;
    const starCount = data.bossDefeated ? 3 : Math.min(2, Math.floor(data.distance / 800));
    for (let i = 0; i < 3; i++) {
      const sx = GAME_WIDTH / 2 + (i - 1) * Math.round(53 * vs);
      if (i < starCount) {
        const starGlow = this.add.graphics();
        starGlow.fillStyle(C_YELLOW, 0.25);
        starGlow.fillEllipse(sx, starY, Math.round(48 * vs), Math.round(44 * vs));
      }
      this.add.text(sx, starY, '\u2B50', {
        fontSize: `${Math.round(34 * vs)}px`,
      }).setOrigin(0.5).setAlpha(i < starCount ? 1 : 0.2);
    }

    y += titleH + Math.round(14 * vs);

    // ── Stats panel ──
    const statsH = Math.round(180 * vs);
    this.panel(PAD, y, CW, statsH, C_YELLOW);

    // Score row
    const scoreRowY = y + Math.round(36 * vs);
    this.iconBadge(PAD + 22, scoreRowY, '\u2B50', C_YELLOW, vs);
    this.add.text(PAD + Math.round(62 * vs), scoreRowY, 'SCORE', {
      fontSize: `${Math.round(18 * vs)}px`, color: '#8fb0c4', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);
    const scoreVal = this.add.text(PAD + CW - 22, scoreRowY + Math.round(7 * vs), '0', {
      fontSize: `${Math.round(53 * vs)}px`, color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(1, 0.5);
    // Golden glow behind score counter
    const scoreGlow = this.add.graphics();
    scoreGlow.fillStyle(C_YELLOW, 0.18);
    scoreGlow.fillEllipse(PAD + CW - 22 - Math.round(60 * vs), scoreRowY + Math.round(7 * vs), Math.round(180 * vs), Math.round(60 * vs));
    scoreGlow.setAlpha(0);
    if (data.score > 0) {
      const ctr = { val: 0 };
      this.tweens.add({ targets: scoreGlow, alpha: 1, duration: 200, delay: 300, ease: 'Power2' });
      this.tweens.add({ targets: ctr, val: data.score, duration: 1000, delay: 300, ease: 'Power2',
        onUpdate: () => scoreVal.setText(String(Math.floor(ctr.val))),
        onComplete: () => {
          scoreVal.setText(String(data.score));
          this.tweens.add({ targets: scoreGlow, alpha: 0, duration: 600, ease: 'Power2' });
        } });
    }

    // Divider
    this.add.rectangle(GAME_WIDTH / 2, y + Math.round(78 * vs), CW - 36, 1, 0xffffff, 0.08);

    // Distance
    const row2Y = y + Math.round(110 * vs);
    this.iconBadge(PAD + 22, row2Y, '\u{1F3C3}', C_TEAL, vs);
    this.add.text(PAD + Math.round(62 * vs), row2Y - 4, `${data.distance}m`, {
      fontSize: `${Math.round(29 * vs)}px`, color: '#38bdf8', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setOrigin(0, 0.5);

    // Gold
    this.iconBadge(GAME_WIDTH / 2 + Math.round(24 * vs), row2Y, '\u{1FA99}', C_ORANGE, vs);
    this.add.text(GAME_WIDTH / 2 + Math.round(65 * vs), row2Y - 4, `+${goldEarned}g`, {
      fontSize: `${Math.round(29 * vs)}px`, color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setOrigin(0, 0.5);

    if (isNewHigh) {
      this.add.text(PAD + CW - 22, row2Y + Math.round(24 * vs), '\u2728 NEW BEST!', {
        fontSize: `${Math.round(16 * vs)}px`, color: '#ebb654', fontFamily: F, fontStyle: 'bold',
        stroke: '#1a3a4a', strokeThickness: 2,
      }).setOrigin(1, 0.5);
    }

    y += statsH + Math.round(14 * vs);

    // ── Perks display (after checkpoint restore on death) ──
    const activePerks = PerkManager.instance.getAll();
    const streak = PerkManager.instance.runStreak;
    if (activePerks.length > 0 || streak > 0 || (!data.bossDefeated && checkpointLvl > 0)) {
      const perkH = Math.round(72 * vs);
      const isVictory = data.bossDefeated;
      this.panel(PAD, y, CW, perkH, isVictory ? 0xa864e8 : 0xe8923a);
      const perkLabel = isVictory ? 'ACTIVE PERKS' :
        (activePerks.length > 0 ? `\u{1F6A9} CHECKPOINT PERKS (LVL ${checkpointLvl + 1})` : 'NO CHECKPOINT PERKS');
      const labelColor = isVictory ? '#c084fc' : (activePerks.length > 0 ? '#fb923c' : '#8fb0c4');
      this.add.text(PAD + 16, y + perkH * 0.35, perkLabel, {
        fontSize: `${Math.round(14 * vs)}px`, color: labelColor, fontFamily: F, fontStyle: 'bold', letterSpacing: 1,
        stroke: '#1a3a4a', strokeThickness: 2,
      }).setOrigin(0, 0.5);
      if (activePerks.length > 0) {
        const icons = activePerks.map((p) => p.icon).join(' ');
        this.add.text(PAD + CW - 16, y + perkH * 0.35, icons, {
          fontSize: `${Math.round(22 * vs)}px`,
        }).setOrigin(1, 0.5);
      }
      if (streak > 0) {
        this.add.text(PAD + 16, y + perkH * 0.72, `\u{1F525} ${streak} streak  \u00D7${(1 + streak * 0.25).toFixed(2)} gold`, {
          fontSize: `${Math.round(16 * vs)}px`, color: '#e8923a', fontFamily: F, fontStyle: 'bold',
          stroke: '#1a3a4a', strokeThickness: 2,
        }).setOrigin(0, 0.5);
      }
      y += perkH + Math.round(10 * vs);
    }

    // ── Shop panel (death only) ──
    if (showShop) {
      const itemH = Math.round(67 * vs);
      const shopH = Math.round(82 * vs) + 4 * itemH;
      this.panel(PAD, y, CW, shopH, C_ORANGE);

      this.add.text(GAME_WIDTH / 2, y + Math.round(24 * vs), 'POWER UP', {
        fontSize: `${Math.round(24 * vs)}px`, color: '#ebb654', fontFamily: F, fontStyle: 'bold', letterSpacing: 4,
        stroke: '#1a3a4a', strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
      }).setOrigin(0.5);

      // Gold pill
      const pillW = Math.round(144 * vs), pillH = Math.round(34 * vs);
      const pillY = y + Math.round(48 * vs);
      const pg = this.add.graphics();
      pg.fillStyle(C_YELLOW, 0.2);
      pg.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
      this.add.text(GAME_WIDTH / 2, pillY + pillH / 2, `\u{1FA99}  ${WalletManager.gold}g`, {
        fontSize: `${Math.round(18 * vs)}px`, color: '#ebb654', fontFamily: F, fontStyle: 'bold',
        stroke: '#1a3a4a', strokeThickness: 2,
      }).setOrigin(0.5);

      let iy = y + Math.round(86 * vs);
      const items = WalletManager.getShopItems();
      const shopIcons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const shopColors = [C_BLUE, C_RED, C_GREEN, C_YELLOW];
      const hints = ['1 extra soldier', 'Stronger weapon', 'Block 1 hit', '+50% gold forever'];
      for (let i = 0; i < items.length; i++) {
        if (i > 0) {
          this.add.rectangle(GAME_WIDTH / 2, iy - Math.round(2 * vs), CW - 36, 1, 0xffffff, 0.1);
        }
        this.shopItem(iy, shopIcons[i], shopColors[i], items[i], hints[i], vs);
        iy += itemH;
      }
      y += shopH + Math.round(14 * vs);
    }

    // ── Buttons (bottom) ──
    const btnH = Math.round(74 * vs);
    const btnGap = Math.round(12 * vs);
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + btnGap) - btnGap;
    let btnY = Math.max(y + Math.round(19 * vs), GAME_HEIGHT - btnBlockH - Math.round(29 * vs));

    if (canAdvance) {
      this.btn(btnY, 'NEXT LEVEL  \u25B6', C_GREEN, 0x3cb82e, '#fff', () => {
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
    this.btn(btnY, '\u2630  LEVELS', 0x3090c8, 0x1c6da3, '#8fb0c4', () => this.scene.start('MenuScene'), canAdvance ? 700 : 600);
  }

  // ── Dark panel with colored top accent bar ──
  private panel(x: number, y: number, w: number, h: number, accentColor: number): void {
    const g = this.add.graphics();
    // Outer glow
    const glowPad = 6;
    g.fillStyle(accentColor, 0.08);
    g.fillRoundedRect(x - glowPad, y - glowPad, w + glowPad * 2, h + glowPad * 2, 23);
    // Panel body
    g.fillStyle(0x1c6da3, 1);
    g.fillRoundedRect(x, y, w, h, 19);
    g.lineStyle(2, C_BORDER, 0.7);
    g.strokeRoundedRect(x, y, w, h, 19);
    // Colored top accent bar
    g.fillStyle(accentColor, 0.9);
    g.fillRoundedRect(x + 2, y + 2, w - 4, 7, { tl: 17, tr: 17, bl: 0, br: 0 });
  }

  // ── Small colored icon badge ──
  private iconBadge(x: number, y: number, icon: string, color: number, vs: number): void {
    const r = Math.round(19 * vs);
    const g = this.add.graphics();
    g.fillStyle(color, 0.2);
    g.fillCircle(x, y, r);
    g.lineStyle(2, color, 0.4);
    g.strokeCircle(x, y, r);
    this.add.text(x, y, icon, { fontSize: `${Math.round(19 * vs)}px` }).setOrigin(0.5);
  }

  // ── Shop item row ──
  private shopItem(y: number, icon: string, iconColor: number, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string, vs: number): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;

    this.iconBadge(PAD + 29, y + 10, icon, iconColor, vs * 0.85);

    this.add.text(PAD + Math.round(62 * vs), y, item.name, {
      fontSize: `${Math.round(18 * vs)}px`, color: canBuy ? '#d4e6f0' : '#475569', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);
    this.add.text(PAD + Math.round(62 * vs), y + Math.round(24 * vs), hint, {
      fontSize: `${Math.round(16 * vs)}px`, color: '#6a8ea0', fontFamily: F,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0, 0.5);

    const bw = Math.round(94 * vs), bh = Math.round(41 * vs);
    const bx = PAD + CW - Math.round(58 * vs);
    const c = this.add.container(bx, y + 8);
    const bg = this.add.graphics();
    bg.fillStyle(canBuy ? C_GREEN : 0x3090c8, canBuy ? 1 : 0.6);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    if (canBuy) {
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 2, bw - 4, bh * 0.4, { tl: bh / 2 - 1, tr: bh / 2 - 1, bl: 0, br: 0 });
    }
    c.add(bg);
    c.add(this.add.text(0, 0, costStr, {
      fontSize: `${Math.round(18 * vs)}px`, color: canBuy ? '#fff' : '#6a8ea0', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
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
    const w = CW, h = Math.round(74 * vs), r = h / 2;
    const x = GAME_WIDTH / 2;
    const c = this.add.container(x, y).setAlpha(0);

    // Glow behind green (primary) button
    if (colorTop === C_GREEN) {
      const btnGlowG = this.add.graphics();
      btnGlowG.fillStyle(C_GREEN, 0.1);
      btnGlowG.fillRoundedRect(-w / 2 - 5, -r - 5, w + 10, h + 10, r + 4);
      c.add(btnGlowG);
    }

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
    // Bright highlight strip at top
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 4, -r + 2, w - 8, 4, { tl: r - 2, tr: r - 2, bl: 0, br: 0 });
    // Gold border for primary buttons
    if (colorTop === C_GREEN || colorTop === C_BLUE) {
      bg.lineStyle(1.5, 0xebb654, 0.4);
      bg.strokeRoundedRect(-w / 2, -r, w, h, r);
    }
    c.add(bg);

    c.add(this.add.text(0, 0, label, {
      fontSize: `${Math.round(26 * vs)}px`, color: textColor, fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true },
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
