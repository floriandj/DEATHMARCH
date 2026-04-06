// src/scenes/MenuScene.ts
// Supercell "Royale" style level select with beveled panels, gold accents, and 3D buttons
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import {
  BG, BG_HEX, BORDER, GOLD, ACCENT, NEUTRAL, FONT, ANIM, Z,
  darken, lighten, toHex,
} from '@/ui/RoyaleTheme';
import {
  drawPanel, drawPill, drawHeaderBar, drawFooterBar,
  createButton, drawLevelNode, popIn,
} from '@/ui/RoyaleUI';

const PAD = 28;
const CW = GAME_WIDTH - PAD * 2;
const NODE_R = 34;
const NODE_SPACING = 120;
const WORLD_GAP = 52;
const LOOKAHEAD = 8;

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
    this.cameras.main.setBackgroundColor(BG_HEX.primary);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // ── Header panel (fixed) ──
    const headerH = 105;
    drawHeaderBar(this, headerH, GOLD.mid);

    this.add.text(GAME_WIDTH / 2, 30, 'DEATHMARCH', {
      fontSize: '34px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
      stroke: '#1a0a30', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(Z.fixedText);

    // Score pill
    drawPill(this, { x: PAD, y: 56, w: 145, h: 34, color: GOLD.bright, depth: Z.fixedText });
    this.add.text(PAD + 12, 73, `\u2B50 ${localStorage.getItem('deathmarch-highscore') || '0'}`, {
      fontSize: '15px', color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(Z.fixedText);

    // Gold pill
    drawPill(this, { x: GAME_WIDTH - PAD - 135, y: 56, w: 135, h: 34, color: GOLD.bright, depth: Z.fixedText });
    this.add.text(GAME_WIDTH - PAD - 12, 73, `\u{1FA99} ${WalletManager.gold}g`, {
      fontSize: '15px', color: GOLD.hex.bright, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(Z.fixedText);

    // ── Footer (fixed) ──
    const footH = 52;
    drawFooterBar(this, footH);

    const settBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - footH / 2, '\u2699  SETTINGS', {
      fontSize: '15px', color: NEUTRAL.dimHex, fontFamily: FONT.body, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(Z.fixedText);
    settBtn.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settBtn.on('pointerover', () => settBtn.setColor(NEUTRAL.whiteHex));
    settBtn.on('pointerout', () => settBtn.setColor(NEUTRAL.dimHex));

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(Z.scrollContent);
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
    g.lineStyle(4, BORDER.subtle, 0.35);
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

    // Bright completed path
    const bright = this.add.graphics();
    bright.lineStyle(5, ACCENT.green, 0.55);
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
      // Shadow
      bg.fillStyle(ACCENT.shadowPurple, 0.3);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 139, y - 12, 280, 28, 14);
      // Body
      bg.fillStyle(BG.panel, 0.92);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 140, y - 14, 280, 28, 14);
      bg.lineStyle(2, accent, 0.45);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, y - 14, 280, 28, 14);
      // Accent dot
      bg.fillStyle(accent, 0.8);
      bg.fillCircle(GAME_WIDTH / 2 - 120, y, 4);
      this.scrollContainer.add(bg);

      this.scrollContainer.add(this.add.text(GAME_WIDTH / 2, y, world.name.toUpperCase(), {
        fontSize: '12px', color: lvl.theme.accentHex, fontFamily: FONT.body, fontStyle: 'bold', letterSpacing: 3,
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
        // Animated glow ring
        const glow = this.add.graphics();
        glow.fillStyle(ACCENT.green, 0.12);
        glow.fillCircle(0, 0, NODE_R + 14);
        nc.add(glow);
        this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.45 }, scale: { from: 0.95, to: 1.12 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const ng = drawLevelNode(this, NODE_R, { state: 'current', color: ACCENT.green });
        nc.add(ng);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '22px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
          stroke: '#1a0a30', strokeThickness: 3,
        }).setOrigin(0.5));

        nc.add(this.add.text(0, NODE_R + 14, lvl.name.toUpperCase(), {
          fontSize: '11px', color: ACCENT.greenHex, fontFamily: FONT.body, fontStyle: 'bold',
        }).setOrigin(0.5));

        this.createPlayButton(x, y + NODE_R + 40);

      } else if (isCompleted) {
        const ng = drawLevelNode(this, NODE_R - 2, { state: 'completed', color: ACCENT.green });
        nc.add(ng);
        nc.add(this.add.text(0, -2, '\u2713', {
          fontSize: '22px', color: NEUTRAL.whiteHex, fontFamily: FONT.display, fontStyle: 'bold',
          stroke: '#1a0a30', strokeThickness: 2,
        }).setOrigin(0.5));

      } else {
        const ng = drawLevelNode(this, NODE_R - 4, { state: 'locked', color: BORDER.subtle });
        nc.add(ng);
        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '16px', color: NEUTRAL.darkHex, fontFamily: FONT.body, fontStyle: 'bold',
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
    const btn = createButton(this, {
      x, y, w: 170, h: 48,
      label: '\u25B6  PLAY',
      colorTop: ACCENT.greenBright,
      colorBot: ACCENT.greenDark,
      onPress: () => {
        SoundManager.play('button_click');
        this.startGame();
      },
    });
    this.scrollContainer.add(btn);
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
