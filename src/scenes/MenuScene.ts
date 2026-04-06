// src/scenes/MenuScene.ts
// Colorful game-UI style matching the game over screen
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
const NODE_R = 34;
const NODE_SPACING = 120;
const WORLD_GAP = 52;
const LOOKAHEAD = 8;
const C_BG = 0x0f1923;
const C_PANEL = 0x1a2840;
const C_BORDER = 0x2a3f5f;
const C_YELLOW = 0xfbbf24;
const C_GREEN = 0x22c55e;

const COL_L = 155;
const COL_C = GAME_WIDTH / 2;
const COL_R = GAME_WIDTH - 155;
function getNodeX(i: number): number { return [COL_L, COL_C, COL_R, COL_C][i % 4]; }

export class MenuScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private totalHeight = 0;
  private dragging = false;
  private dragStartY = 0;
  private scrollStartY = 0;
  private velocity = 0;
  private lastPointerY = 0;

  constructor() { super({ key: 'MenuScene' }); }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f1923');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // ── Header panel (fixed) ──
    const headerH = 105;
    const hdr = this.add.graphics().setDepth(10);
    hdr.fillStyle(C_PANEL, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, headerH);
    hdr.lineStyle(2, C_BORDER, 0.5);
    hdr.lineBetween(0, headerH, GAME_WIDTH, headerH);
    // Yellow accent line at top
    hdr.fillStyle(C_YELLOW, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 4);

    this.add.text(GAME_WIDTH / 2, 30, 'DEATHMARCH', {
      fontSize: '34px', color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    // Score pill
    this.pill(PAD, 56, 145, 34, C_YELLOW, 11);
    this.add.text(PAD + 12, 73, `\u2B50 ${localStorage.getItem('deathmarch-highscore') || '0'}`, {
      fontSize: '15px', color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    // Gold pill
    this.pill(GAME_WIDTH - PAD - 135, 56, 135, 34, C_YELLOW, 11);
    this.add.text(GAME_WIDTH - PAD - 12, 73, `\u{1FA99} ${WalletManager.gold}g`, {
      fontSize: '15px', color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    // ── Footer (fixed) ──
    const footH = 52;
    const foot = this.add.graphics().setDepth(10);
    foot.fillStyle(C_PANEL, 1);
    foot.fillRect(0, GAME_HEIGHT - footH, GAME_WIDTH, footH);
    foot.lineStyle(1, C_BORDER, 0.4);
    foot.lineBetween(0, GAME_HEIGHT - footH, GAME_WIDTH, GAME_HEIGHT - footH);

    const settBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - footH / 2, '\u2699  SETTINGS', {
      fontSize: '15px', color: '#64748b', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settBtn.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#64748b'));

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);
    const positions = this.buildPositions(visibleCount);
    this.totalHeight = positions[positions.length - 1].y + 240;

    this.drawPaths(positions, maxUnlocked);
    this.drawWorldBanners(positions, visibleCount);
    this.drawNodes(positions, maxUnlocked);

    const currentY = positions[Math.min(maxUnlocked, positions.length - 1)].y;
    this.scrollContainer.y = -currentY + GAME_HEIGHT * 0.45;
    this.clampScroll();

    this.velocity = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true; this.dragStartY = p.y;
      this.scrollStartY = this.scrollContainer.y; this.velocity = 0; this.lastPointerY = p.y;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.scrollContainer.y = this.scrollStartY + (p.y - this.dragStartY);
      this.velocity = p.y - this.lastPointerY; this.lastPointerY = p.y; this.clampScroll();
    });
    this.input.on('pointerup', () => { this.dragging = false; });
  }

  update(): void {
    if (!this.dragging && Math.abs(this.velocity) > 0.5) {
      this.scrollContainer.y += this.velocity * 0.3;
      this.velocity *= 0.92; this.clampScroll();
    }
  }

  private pill(x: number, y: number, w: number, h: number, color: number, depth: number): void {
    const g = this.add.graphics().setDepth(depth);
    g.fillStyle(color, 0.15);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2, color, 0.3);
    g.strokeRoundedRect(x, y, w, h, h / 2);
  }

  private buildPositions(count: number): { x: number; y: number }[] {
    const pos: { x: number; y: number }[] = [];
    let y = 150;
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % 5 === 0) y += WORLD_GAP;
      pos.push({ x: getNodeX(i), y }); y += NODE_SPACING;
    }
    return pos;
  }

  private drawPaths(positions: { x: number; y: number }[], maxUnlocked: number): void {
    const g = this.add.graphics();
    g.lineStyle(4, C_BORDER, 0.3);
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i], b = positions[i + 1];
      if ((i + 1) % 5 === 0) {
        for (let s = 0; s < 6; s += 2) {
          const t1 = s / 6, t2 = (s + 1) / 6;
          g.beginPath();
          g.moveTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
          g.lineTo(a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2);
          g.strokePath();
        }
      } else {
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokePath();
      }
    }
    this.scrollContainer.add(g);

    const bright = this.add.graphics();
    bright.lineStyle(5, C_GREEN, 0.5);
    for (let i = 0; i < Math.min(maxUnlocked, positions.length - 1); i++) {
      bright.beginPath();
      bright.moveTo(positions[i].x, positions[i].y);
      bright.lineTo(positions[i + 1].x, positions[i + 1].y);
      bright.strokePath();
    }
    this.scrollContainer.add(bright);
  }

  private drawWorldBanners(positions: { x: number; y: number }[], visibleCount: number): void {
    const worldInfos = getWorldInfoForLevels(visibleCount - 1);
    for (const world of worldInfos) {
      if (world.startLevel >= positions.length) continue;
      const y = positions[world.startLevel].y - 44;
      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;

      const bg = this.add.graphics();
      bg.fillStyle(C_PANEL, 0.9);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 140, y - 14, 280, 28, 14);
      bg.lineStyle(2, accent, 0.4);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, y - 14, 280, 28, 14);
      // Accent dot
      bg.fillStyle(accent, 0.8);
      bg.fillCircle(GAME_WIDTH / 2 - 120, y, 4);
      this.scrollContainer.add(bg);

      this.scrollContainer.add(this.add.text(GAME_WIDTH / 2, y, world.name.toUpperCase(), {
        fontSize: '12px', color: lvl.theme.accentHex, fontFamily: F, fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5));
    }
  }

  private drawNodes(positions: { x: number; y: number }[], maxUnlocked: number): void {
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const isCurrent = i === maxUnlocked;
      const isCompleted = i < maxUnlocked;
      const isLocked = i > maxUnlocked;
      const lvl = generateLevel(i);

      const nc = this.add.container(x, y);

      if (isCurrent) {
        // Glow
        const glow = this.add.graphics();
        glow.fillStyle(C_GREEN, 0.12);
        glow.fillCircle(0, 0, NODE_R + 12);
        nc.add(glow);
        this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.4 }, scale: { from: 0.95, to: 1.1 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Filled node
        const ng = this.add.graphics();
        ng.fillStyle(C_GREEN, 1);
        ng.fillCircle(0, 0, NODE_R);
        ng.fillStyle(0xffffff, 0.2);
        ng.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.65);
        ng.lineStyle(3, 0xffffff, 0.3);
        ng.strokeCircle(0, 0, NODE_R);
        nc.add(ng);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '22px', color: '#fff', fontFamily: F, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5));

        nc.add(this.add.text(0, NODE_R + 14, lvl.name.toUpperCase(), {
          fontSize: '11px', color: '#4ade80', fontFamily: F, fontStyle: 'bold',
        }).setOrigin(0.5));

        this.createPlayButton(x, y + NODE_R + 40);

      } else if (isCompleted) {
        const ng = this.add.graphics();
        ng.fillStyle(C_GREEN, 0.7);
        ng.fillCircle(0, 0, NODE_R - 2);
        ng.fillStyle(0xffffff, 0.15);
        ng.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.55);
        nc.add(ng);
        nc.add(this.add.text(0, -2, '\u2713', {
          fontSize: '22px', color: '#fff', fontFamily: F, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5));

      } else {
        const ng = this.add.graphics();
        ng.fillStyle(C_PANEL, 1);
        ng.fillCircle(0, 0, NODE_R - 4);
        ng.lineStyle(2, C_BORDER, 0.5);
        ng.strokeCircle(0, 0, NODE_R - 4);
        nc.add(ng);
        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '16px', color: '#475569', fontFamily: F, fontStyle: 'bold',
        }).setOrigin(0.5));
      }

      if (!isLocked) {
        const hit = this.add.zone(0, 0, NODE_R * 2 + 16, NODE_R * 2 + 16).setInteractive({ useHandCursor: true });
        nc.add(hit);
        hit.on('pointerdown', () => {
          this.time.delayedCall(80, () => {
            if (Math.abs(this.velocity) < 3) {
              SoundManager.play('button_click'); LevelManager.instance.setLevel(i); this.startGame();
            }
          });
        });
      }
      this.scrollContainer.add(nc);
    }
  }

  private createPlayButton(x: number, y: number): void {
    const w = 170, h = 48, r = h / 2;
    const c = this.add.container(x, y);

    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.3);
    sh.fillRoundedRect(-w / 2 + 2, -r + 3, w, h, r);
    c.add(sh);

    const bg = this.add.graphics();
    bg.fillStyle(0x16a34a, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.fillStyle(C_GREEN, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h * 0.5, { tl: r, tr: r, bl: 4, br: 4 });
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 4, -r + 3, w - 8, h * 0.28, { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
    c.add(bg);

    c.add(this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '20px', color: '#fff', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({ targets: c, scale: 0.93, duration: 50, yoyo: true, ease: 'Power2',
        onComplete: () => { c.setScale(1); this.startGame(); } });
    });

    this.scrollContainer.add(c);
  }

  private startGame(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }

  private clampScroll(): void {
    const minY = -(this.totalHeight - GAME_HEIGHT + 80);
    this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, 60);
  }
}
