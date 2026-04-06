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

const PAD = 30;
const CW = GAME_WIDTH - PAD * 2;
const FONT = 'Arial, Helvetica, sans-serif';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor('#0c1220');

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

    const vs = Math.min(1.4, Math.max(0.85, GAME_HEIGHT / 1280));

    // ── Dark gradient overlay ──
    const bg = this.add.graphics();
    bg.fillStyle(0x0c1220, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(data.bossDefeated ? 0x1a4020 : 0x401020, 0.4);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);

    let y = Math.round(30 * vs);

    // ── Title section ──
    const emoji = data.bossDefeated ? '\u{1F3C6}' : '\u{1F480}';
    const titleText = data.bossDefeated ? 'VICTORY!' : 'DEFEATED';
    const titleColor = data.bossDefeated ? '#4ade80' : '#f87171';

    const title = this.add.text(GAME_WIDTH / 2, y + Math.round(30 * vs), `${emoji}  ${titleText}`, {
      fontSize: `${Math.round(52 * vs)}px`, color: titleColor, fontFamily: FONT, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.text(GAME_WIDTH / 2, y + Math.round(72 * vs), `Level ${levelIndex + 1} \u2022 ${level.name}`, {
      fontSize: `${Math.round(18 * vs)}px`, color: '#94a3b8', fontFamily: FONT,
    }).setOrigin(0.5);

    y += Math.round(105 * vs);

    // ── Main stats panel ──
    const panelH = Math.round(180 * vs);
    this.drawPanel(PAD, y, CW, panelH);

    // Score
    this.add.text(PAD + 24, y + Math.round(24 * vs), 'SCORE', {
      fontSize: `${Math.round(14 * vs)}px`, color: '#94a3b8', fontFamily: FONT, fontStyle: 'bold',
    });
    const scoreVal = this.add.text(PAD + CW - 24, y + Math.round(55 * vs), '0', {
      fontSize: `${Math.round(48 * vs)}px`, color: '#fbbf24', fontFamily: FONT, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0.5);
    if (data.score > 0) {
      const ctr = { val: 0 };
      this.tweens.add({
        targets: ctr, val: data.score, duration: 1000, delay: 300, ease: 'Power2',
        onUpdate: () => scoreVal.setText(String(Math.floor(ctr.val))),
        onComplete: () => scoreVal.setText(String(data.score)),
      });
    }

    // Divider
    const divY = y + Math.round(85 * vs);
    this.add.rectangle(GAME_WIDTH / 2, divY, CW - 40, 1, 0xffffff, 0.08);

    // Distance + Gold row
    const rowY = divY + Math.round(30 * vs);
    this.add.text(PAD + 24, rowY, '\u{1F3C3}', { fontSize: `${Math.round(22 * vs)}px` }).setOrigin(0, 0.5);
    this.add.text(PAD + 24 + Math.round(30 * vs), rowY, `${data.distance}m`, {
      fontSize: `${Math.round(22 * vs)}px`, color: '#38bdf8', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(PAD + CW - 24, rowY, `+${goldEarned}g`, {
      fontSize: `${Math.round(22 * vs)}px`, color: '#fbbf24', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.add.text(PAD + CW - 24 - Math.round(80 * vs), rowY, '\u{1FA99}', {
      fontSize: `${Math.round(22 * vs)}px`,
    }).setOrigin(1, 0.5);

    y += panelH + Math.round(12 * vs);

    if (isNewHigh) {
      this.add.text(GAME_WIDTH / 2, y + 6, '\u2728 NEW BEST! \u2728', {
        fontSize: `${Math.round(20 * vs)}px`, color: '#fbbf24', fontFamily: FONT, fontStyle: 'bold',
      }).setOrigin(0.5);
      y += Math.round(34 * vs);
    }

    // ── Shop panel (death only) ──
    if (showShop) {
      y += Math.round(8 * vs);
      const itemH = Math.round(60 * vs);
      const shopPanelH = Math.round(70 * vs) + 4 * itemH;
      this.drawPanel(PAD, y, CW, shopPanelH);

      // Shop header
      this.add.text(GAME_WIDTH / 2, y + Math.round(18 * vs), 'POWER UP', {
        fontSize: `${Math.round(18 * vs)}px`, color: '#fbbf24', fontFamily: FONT, fontStyle: 'bold',
        letterSpacing: 4,
      }).setOrigin(0.5);

      // Gold pill
      const pillW = Math.round(120 * vs);
      const pillH = Math.round(28 * vs);
      const pillY = y + Math.round(42 * vs);
      const pg = this.add.graphics();
      pg.fillStyle(0xfbbf24, 0.15);
      pg.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
      this.add.text(GAME_WIDTH / 2, pillY + pillH / 2, `${WalletManager.gold}g`, {
        fontSize: `${Math.round(15 * vs)}px`, color: '#fbbf24', fontFamily: FONT, fontStyle: 'bold',
      }).setOrigin(0.5);

      let iy = y + Math.round(74 * vs);
      const items = WalletManager.getShopItems();
      const icons = ['\u{1F6E1}\uFE0F', '\u{1F52B}', '\u{1F6E1}\uFE0F', '\u{1FA99}'];
      const hints = ['3 extra soldiers', 'Stronger weapon', 'Block 1 hit', '+50% gold forever'];
      for (let i = 0; i < items.length; i++) {
        this.addShopItem(iy, icons[i], items[i], hints[i], vs);
        iy += itemH;
      }

      y += shopPanelH + Math.round(10 * vs);
    }

    // ── Buttons (bottom anchored) ──
    const btnH = Math.round(64 * vs);
    const btnGap = Math.round(12 * vs);
    const btnCount = canAdvance ? 3 : 2;
    const btnBlockH = btnCount * (btnH + btnGap) - btnGap;
    let btnY = Math.max(y + Math.round(20 * vs), GAME_HEIGHT - btnBlockH - Math.round(30 * vs));

    if (canAdvance) {
      this.createGradientButton(GAME_WIDTH / 2, btnY, 'NEXT LEVEL  \u25B6', CW, btnH, 0x22c55e, 0x16a34a, '#fff', 600);
      const advBtn = btnY; // capture for callback
      this.children.list[this.children.list.length - 1]
      // We need to attach callback to the button container's hit zone
      btnY += btnH + btnGap;

      this.createGradientButton(GAME_WIDTH / 2, btnY, '\u21BB  REPLAY', CW, btnH, 0x3b82f6, 0x2563eb, '#fff', 700);
      btnY += btnH + btnGap;
    } else {
      this.createGradientButton(GAME_WIDTH / 2, btnY, '\u{1F4AA}  TRY AGAIN', CW, btnH, 0x3b82f6, 0x2563eb, '#fff', 600);
      btnY += btnH + btnGap;
    }
    this.createGradientButton(GAME_WIDTH / 2, btnY, '\u2630  LEVELS', CW, btnH, 0x475569, 0x334155, '#cbd5e1', canAdvance ? 800 : 700);

    // Attach button callbacks
    this.attachButtonCallbacks(canAdvance, mgr, data);
  }

  private attachButtonCallbacks(canAdvance: boolean, mgr: typeof LevelManager.instance, data: GameOverData): void {
    // Find all containers with hit zones and attach callbacks in order
    const buttons: Phaser.GameObjects.Container[] = [];
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Container && (child as any)._isButton) {
        buttons.push(child);
      }
    });

    let idx = 0;
    if (canAdvance) {
      buttons[idx]?.getAll().forEach(c => {
        if (c instanceof Phaser.GameObjects.Zone) {
          c.on('pointerdown', () => {
            SoundManager.play('button_click');
            mgr.advanceLevel();
            localStorage.setItem('deathmarch-level', String(mgr.currentLevelIndex));
            this.fadeToGame();
          });
        }
      });
      idx++;
      buttons[idx]?.getAll().forEach(c => {
        if (c instanceof Phaser.GameObjects.Zone) {
          c.on('pointerdown', () => { SoundManager.play('button_click'); this.fadeToGame(); });
        }
      });
      idx++;
    } else {
      buttons[idx]?.getAll().forEach(c => {
        if (c instanceof Phaser.GameObjects.Zone) {
          c.on('pointerdown', () => { SoundManager.play('button_click'); this.fadeToGame(); });
        }
      });
      idx++;
    }
    buttons[idx]?.getAll().forEach(c => {
      if (c instanceof Phaser.GameObjects.Zone) {
        c.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('MenuScene'); });
      }
    });
  }

  // ── Panel with rounded corners and subtle border ──
  private drawPanel(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x1e293b, 0.9);
    g.fillRoundedRect(x, y, w, h, 20);
    g.lineStyle(1, 0x334155, 0.6);
    g.strokeRoundedRect(x, y, w, h, 20);
  }

  // ── Shop item ──
  private addShopItem(y: number, icon: string, item: ReturnType<typeof WalletManager.getShopItems>[0], hint: string, vs: number): void {
    const canBuy = item.canBuy();
    const cost = item.cost();
    const costStr = cost === Infinity ? 'MAX' : `${cost}g`;

    this.add.text(PAD + 22, y + 10, icon, { fontSize: `${Math.round(20 * vs)}px` }).setOrigin(0, 0.5).setAlpha(canBuy ? 1 : 0.3);

    this.add.text(PAD + Math.round(52 * vs), y + 2, item.name, {
      fontSize: `${Math.round(16 * vs)}px`, color: canBuy ? '#e2e8f0' : '#475569', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(PAD + Math.round(52 * vs), y + Math.round(22 * vs), hint, {
      fontSize: `${Math.round(12 * vs)}px`, color: '#64748b', fontFamily: FONT,
    }).setOrigin(0, 0.5);

    // Buy pill
    const btnW = Math.round(80 * vs), btnH2 = Math.round(36 * vs);
    const btnX = PAD + CW - Math.round(50 * vs);
    const container = this.add.container(btnX, y + 10);

    const bg = this.add.graphics();
    if (canBuy) {
      bg.fillStyle(0x22c55e, 0.8);
      bg.fillRoundedRect(-btnW / 2, -btnH2 / 2, btnW, btnH2, btnH2 / 2);
    } else {
      bg.fillStyle(0x334155, 0.5);
      bg.fillRoundedRect(-btnW / 2, -btnH2 / 2, btnW, btnH2, btnH2 / 2);
    }
    container.add(bg);
    container.add(this.add.text(0, 0, costStr, {
      fontSize: `${Math.round(14 * vs)}px`, color: canBuy ? '#fff' : '#64748b', fontFamily: FONT, fontStyle: 'bold',
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

  // ── Gradient-style button ──
  private createGradientButton(x: number, y: number, label: string, w: number, h: number,
    colorTop: number, colorBot: number, textColor: string, delay: number): void {
    const container = this.add.container(x, y).setAlpha(0);
    (container as any)._isButton = true;
    const r = h / 2;

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-w / 2 + 2, -r + 3, w, h, r);
    container.add(shadow);

    // Main fill
    const bg = this.add.graphics();
    bg.fillStyle(colorBot, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    // Lighter top half for gradient feel
    bg.fillStyle(colorTop, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h * 0.55, { tl: r, tr: r, bl: 4, br: 4 });
    // Shine
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-w / 2 + 6, -r + 4, w - 12, h * 0.3, { tl: r - 4, tr: r - 4, bl: 0, br: 0 });
    container.add(bg);

    container.add(this.add.text(0, 0, label, {
      fontSize: '22px', color: textColor, fontFamily: FONT, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hit);

    this.tweens.add({ targets: container, alpha: 1, y: { from: y + 10, to: y }, duration: 350, delay, ease: 'Power2' });
  }

  private fadeToGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }
}
