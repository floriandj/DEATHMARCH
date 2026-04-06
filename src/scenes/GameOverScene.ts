// src/scenes/GameOverScene.ts
// Supercell-style results screen with beveled panels, gold stat cards, and 3D buttons
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import {
  BG, BG_HEX, BORDER, GOLD, ACCENT, NEUTRAL, FONT, ANIM, Z,
  darken, lighten, toHex,
} from '@/ui/RoyaleTheme';
import {
  drawPanel, drawPill, drawIconBadge, createButton, popIn,
} from '@/ui/RoyaleUI';

interface GameOverData { score: number; distance: number; bossDefeated: boolean; goldEarned: number; }

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(BG_HEX.primary);
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

    const vs = Math.min(1.35, Math.max(0.85, GAME_HEIGHT / 1280));
    let y = Math.round(20 * vs);

    // ── Title panel with colored accent bar ──
    const titleH = Math.round(140 * vs);
    const headerColor = data.bossDefeated ? ACCENT.green : ACCENT.red;
    drawPanel(this, { x: PAD, y, w: CW, h: titleH, accent: headerColor });

    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? ACCENT.greenHex : ACCENT.redHex;

    // Overshoot pop-in for title
    const title = this.add.text(GAME_WIDTH / 2, y + titleH * 0.33, `${emoji}  ${titleText}`, {
      fontSize: `${Math.round(46 * vs)}px`, color: titleColor, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: Math.round(5 * vs),
    }).setOrigin(0.5).setScale(0).setAlpha(0);
    popIn(this, title, 0, ANIM.overshoot.duration);

    this.add.text(GAME_WIDTH / 2, y + titleH * 0.65, `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: `${Math.round(17 * vs)}px`, color: NEUTRAL.midHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stars row
    const starY = y + titleH * 0.85;
    const starCount = data.bossDefeated ? 3 : Math.min(2, Math.floor(data.distance / 800));
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(GAME_WIDTH / 2 + (i - 1) * Math.round(44 * vs), starY, '\u2B50', {
        fontSize: `${Math.round(28 * vs)}px`,
      }).setOrigin(0.5).setAlpha(0);
      if (i < starCount) {
        // Overshoot pop each star with stagger
        star.setScale(0);
        this.tweens.add({
          targets: star,
          scale: 1, alpha: 1,
          duration: 350,
          delay: 300 + i * 150,
          ease: ANIM.overshoot.ease,
        });
      } else {
        star.setAlpha(0.2);
      }
    }

    y += titleH + Math.round(12 * vs);

    // ── Stats panel ──
    const statsH = Math.round(150 * vs);
    drawPanel(this, { x: PAD, y, w: CW, h: statsH, accent: GOLD.mid });

    // Score row
    const scoreRowY = y + Math.round(30 * vs);
    drawIconBadge(this, PAD + 18, scoreRowY, '\u2B50', GOLD.bright, vs);
    this.add.text(PAD + Math.round(52 * vs), scoreRowY, 'SCORE', {
      fontSize: `${Math.round(14 * vs)}px`, color: NEUTRAL.midHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const scoreVal = this.add.text(PAD + CW - 18, scoreRowY + Math.round(6 * vs), '0', {
      fontSize: `${Math.round(44 * vs)}px`, color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 3,
    }).setOrigin(1, 0.5);
    if (data.score > 0) {
      const ctr = { val: 0 };
      this.tweens.add({ targets: ctr, val: data.score, duration: 1000, delay: 300, ease: 'Power2',
        onUpdate: () => scoreVal.setText(String(Math.floor(ctr.val))),
        onComplete: () => scoreVal.setText(String(data.score)) });
    }

    // Divider
    this.add.rectangle(GAME_WIDTH / 2, y + Math.round(65 * vs), CW - 30, 1, NEUTRAL.white, 0.06);

    // Distance
    const row2Y = y + Math.round(92 * vs);
    drawIconBadge(this, PAD + 18, row2Y, '\u{1F3C3}', ACCENT.teal, vs);
    this.add.text(PAD + Math.round(52 * vs), row2Y - 4, `${data.distance}m`, {
      fontSize: `${Math.round(24 * vs)}px`, color: ACCENT.tealHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Gold earned
    drawIconBadge(this, GAME_WIDTH / 2 + Math.round(20 * vs), row2Y, '\u{1FA99}', ACCENT.orange, vs);
    this.add.text(GAME_WIDTH / 2 + Math.round(54 * vs), row2Y - 4, `+${goldEarned}g`, {
      fontSize: `${Math.round(24 * vs)}px`, color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (isNewHigh) {
      this.add.text(PAD + CW - 18, row2Y + Math.round(20 * vs), '\u2728 NEW BEST!', {
        fontSize: `${Math.round(13 * vs)}px`, color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    }

    y += statsH + Math.round(12 * vs);

    // ── Shop panel (death only) ──
    if (showShop) {
      const itemH = Math.round(56 * vs);
      const shopH = Math.round(68 * vs) + 4 * itemH;
      drawPanel(this, { x: PAD, y, w: CW, h: shopH, accent: ACCENT.orange });

      this.add.text(GAME_WIDTH / 2, y + Math.round(20 * vs), 'POWER UP', {
        fontSize: `${Math.round(18 * vs)}px`, color: GOLD.hex.bright, fontFamily: FONT.display, fontStyle: 'bold', letterSpacing: 4,
      }).setOrigin(0.5);

      // Gold wallet pill
      const pillW = Math.round(120 * vs), pillH = Math.round(28 * vs);
      const pillY = y + Math.round(40 * vs);
      drawPill(this, { x: GAME_WIDTH / 2 - pillW / 2, y: pillY, w: pillW, h: pillH, color: GOLD.bright });
      this.add.text(GAME_WIDTH / 2, pillY + pillH / 2, `\u{1FA99}  ${WalletManager.gold}g`, {
        fontSize: `${Math.round(14 * vs)}px`, color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
      }).setOrigin(0.5);

      let iy = y + Math.round(72 * vs);
      const items = WalletManager.getShopItems();
      const shopIcons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const shopColors = [ACCENT.blue, ACCENT.red, ACCENT.green, GOLD.bright];
      const hints = ['3 extra soldiers', 'Stronger weapon', 'Block 1 hit', '+50% gold forever'];
      for (let i = 0; i < items.length; i++) {
        this.shopItem(iy, shopIcons[i], shopColors[i], items[i], hints[i], vs);
        iy += itemH;
      }
      y += shopH + Math.round(12 * vs);
    }

    // ── Buttons (bottom) — Royale 3D beveled style ──
    const btnH = Math.round(62 * vs);
    const btnGap = Math.round(10 * vs);
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + btnGap) - btnGap;
    let btnY = Math.max(y + Math.round(16 * vs), GAME_HEIGHT - btnBlockH - Math.round(24 * vs));

    if (canAdvance) {
      createButton(this, {
        x: GAME_WIDTH / 2, y: btnY, w: CW, h: btnH,
        label: 'NEXT LEVEL  \u25B6',
        colorTop: ACCENT.greenBright, colorBot: ACCENT.greenDark,
        onPress: () => {
          mgr.advanceLevel(); localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex)); this.fadeToGame();
        },
        animDelay: 500,
      });
      btnY += btnH + btnGap;
      createButton(this, {
        x: GAME_WIDTH / 2, y: btnY, w: CW, h: btnH,
        label: '\u21BB  REPLAY',
        colorTop: ACCENT.blueBright, colorBot: ACCENT.blueDark,
        onPress: () => this.fadeToGame(),
        animDelay: 600,
      });
      btnY += btnH + btnGap;
    } else {
      createButton(this, {
        x: GAME_WIDTH / 2, y: btnY, w: CW, h: btnH,
        label: '\u{1F4AA}  TRY AGAIN',
        colorTop: ACCENT.blueBright, colorBot: ACCENT.blueDark,
        onPress: () => this.fadeToGame(),
        animDelay: 500,
      });
      btnY += btnH + btnGap;
    }
    createButton(this, {
      x: GAME_WIDTH / 2, y: btnY, w: CW, h: btnH,
      label: '\u2630  LEVELS',
      colorTop: NEUTRAL.dark, colorBot: darken(NEUTRAL.dark, 0.3),
      textColor: NEUTRAL.midHex,
      onPress: () => this.scene.start('MenuScene'),
      animDelay: canAdvance ? 700 : 600,
    });
  }

  private shopItem(y: number, icon: string, iconColor: number, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string, vs: number): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;

    drawIconBadge(this, PAD + 24, y + 8, icon, iconColor, vs * 0.85);

    this.add.text(PAD + Math.round(52 * vs), y, item.name, {
      fontSize: `${Math.round(15 * vs)}px`, color: canBuy ? NEUTRAL.lightHex : NEUTRAL.darkHex,
      fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + Math.round(52 * vs), y + Math.round(20 * vs), hint, {
      fontSize: `${Math.round(11 * vs)}px`, color: NEUTRAL.dimHex, fontFamily: FONT.body,
    }).setOrigin(0, 0.5);

    const bw = Math.round(78 * vs), bh = Math.round(34 * vs);
    const bx = PAD + CW - Math.round(48 * vs);

    if (canBuy) {
      createButton(this, {
        x: bx, y: y + 8, w: bw, h: bh,
        label: costStr,
        colorTop: ACCENT.greenBright, colorBot: ACCENT.greenDark,
        fontSize: `${Math.round(14 * vs)}px`,
        onPress: () => {
          item.buy(); SoundManager.play('shop_buy');
          this.scene.restart(this.scene.settings.data);
        },
      });
    } else {
      // Grayed out
      const c = this.add.container(bx, y + 8);
      const bg = this.add.graphics();
      bg.fillStyle(NEUTRAL.dark, 0.5);
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
      c.add(bg);
      c.add(this.add.text(0, 0, costStr, {
        fontSize: `${Math.round(14 * vs)}px`, color: NEUTRAL.dimHex, fontFamily: FONT.body, fontStyle: 'bold',
      }).setOrigin(0.5));
    }
  }

  private fadeToGame(): void {
    this.cameras.main.fadeOut(ANIM.sceneFade.duration, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }
}
