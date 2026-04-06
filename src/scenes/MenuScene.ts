// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

const PAD = 40;
const NODE_R = 34;
const NODE_SPACING_Y = 120;
const WORLD_GAP = 55;
const LOOKAHEAD = 8;
const COL_L = 155;
const COL_C = GAME_WIDTH / 2;
const COL_R = GAME_WIDTH - 155;

function getNodeX(index: number): number {
  return [COL_L, COL_C, COL_R, COL_C][index % 4];
}

export class MenuScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private totalHeight: number = 0;
  private dragging: boolean = false;
  private dragStartY: number = 0;
  private scrollStartY: number = 0;
  private velocity: number = 0;
  private lastPointerY: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#080818');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // ── Header ──
    const headerH = 110;
    const hdrBg = this.add.graphics().setDepth(10);
    hdrBg.fillStyle(0x080818, 1);
    hdrBg.fillRect(0, 0, GAME_WIDTH, headerH);
    hdrBg.fillStyle(0x080818, 0.7);
    hdrBg.fillRect(0, headerH, GAME_WIDTH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'DEATHMARCH', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ff2040', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    // Score pill
    const scorePill = this.add.graphics().setDepth(11);
    scorePill.fillStyle(0xffd43b, 0.15);
    scorePill.fillRoundedRect(PAD, 62, 150, 32, 16);
    scorePill.lineStyle(2, 0xffd43b, 0.3);
    scorePill.strokeRoundedRect(PAD, 62, 150, 32, 16);

    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add.text(PAD + 14, 78, `\u2B50 ${highScore}`, {
      fontSize: '16px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    // Gold pill
    const goldPill = this.add.graphics().setDepth(11);
    goldPill.fillStyle(0xffd700, 0.15);
    goldPill.fillRoundedRect(GAME_WIDTH - PAD - 140, 62, 140, 32, 16);
    goldPill.lineStyle(2, 0xffd700, 0.3);
    goldPill.strokeRoundedRect(GAME_WIDTH - PAD - 140, 62, 140, 32, 16);

    this.add.text(GAME_WIDTH - PAD - 14, 78, `\u{1FA99} ${WalletManager.gold}g`, {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    // Hint
    this.add.text(GAME_WIDTH / 2, 98, 'Tap a level to play!', {
      fontSize: '12px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);

    // ── Footer ──
    const footBg = this.add.graphics().setDepth(10);
    footBg.fillStyle(0x080818, 0.9);
    footBg.fillRect(0, GAME_HEIGHT - 55, GAME_WIDTH, 55);

    const settBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '\u2699  SETTINGS', {
      fontSize: '15px', color: '#666666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settBtn.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);
    const positions = this.buildPositions(visibleCount);
    this.totalHeight = positions[positions.length - 1].y + 250;

    this.drawPaths(positions, maxUnlocked);
    this.drawWorldBanners(positions, visibleCount);
    this.drawNodes(positions, maxUnlocked);

    const currentY = positions[Math.min(maxUnlocked, positions.length - 1)].y;
    this.scrollContainer.y = -currentY + GAME_HEIGHT * 0.45;
    this.clampScroll();

    // ── Scroll input ──
    this.velocity = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true; this.dragStartY = p.y;
      this.scrollStartY = this.scrollContainer.y;
      this.velocity = 0; this.lastPointerY = p.y;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.scrollContainer.y = this.scrollStartY + (p.y - this.dragStartY);
      this.velocity = p.y - this.lastPointerY;
      this.lastPointerY = p.y;
      this.clampScroll();
    });
    this.input.on('pointerup', () => { this.dragging = false; });
  }

  update(): void {
    if (!this.dragging && Math.abs(this.velocity) > 0.5) {
      this.scrollContainer.y += this.velocity * 0.3;
      this.velocity *= 0.92;
      this.clampScroll();
    }
  }

  private buildPositions(count: number): { x: number; y: number }[] {
    const pos: { x: number; y: number }[] = [];
    let y = 160;
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % 5 === 0) y += WORLD_GAP;
      pos.push({ x: getNodeX(i), y });
      y += NODE_SPACING_Y;
    }
    return pos;
  }

  private drawPaths(positions: { x: number; y: number }[], maxUnlocked: number): void {
    const g = this.add.graphics();
    g.lineStyle(5, 0xffffff, 0.06);
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
    bright.lineStyle(5, 0x51cf66, 0.4);
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
      const y = positions[world.startLevel].y - 48;
      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;

      const bg = this.add.graphics();
      bg.fillStyle(accent, 0.1);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 150, y - 14, 300, 28, 14);
      bg.lineStyle(2, accent, 0.25);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 150, y - 14, 300, 28, 14);
      this.scrollContainer.add(bg);

      this.scrollContainer.add(this.add.text(GAME_WIDTH / 2, y, world.name.toUpperCase(), {
        fontSize: '13px', color: lvl.theme.accentHex, fontFamily: 'monospace',
        fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5));
    }
  }

  private drawNodes(positions: { x: number; y: number }[], maxUnlocked: number): void {
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const isCompleted = i < maxUnlocked;
      const isCurrent = i === maxUnlocked;
      const isLocked = i > maxUnlocked;
      const lvl = generateLevel(i);
      const accent = lvl.theme.accentColor;

      const nc = this.add.container(x, y);

      if (isCurrent) {
        // Glow
        const glow = this.add.graphics();
        glow.fillStyle(0xffd43b, 0.12);
        glow.fillCircle(0, 0, NODE_R + 12);
        nc.add(glow);
        this.tweens.add({
          targets: glow, alpha: { from: 0.15, to: 0.5 }, scale: { from: 0.95, to: 1.1 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // Filled circle
        const cg = this.add.graphics();
        cg.fillStyle(0xffd43b, 0.8);
        cg.fillCircle(0, 0, NODE_R);
        // Highlight top half
        cg.fillStyle(0xffffff, 0.2);
        cg.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.7);
        nc.add(cg);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '22px', color: '#111', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(0, NODE_R + 14, lvl.name.toUpperCase(), {
          fontSize: '12px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        // Play button
        this.createPlayButton(x, y + NODE_R + 44);

      } else if (isCompleted) {
        const cg = this.add.graphics();
        cg.fillStyle(0x51cf66, 0.7);
        cg.fillCircle(0, 0, NODE_R - 2);
        cg.fillStyle(0xffffff, 0.15);
        cg.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.6);
        nc.add(cg);

        nc.add(this.add.text(0, -3, '\u2713', {
          fontSize: '24px', color: '#111', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

      } else {
        const cg = this.add.graphics();
        cg.fillStyle(0x1a1a2e, 1);
        cg.fillCircle(0, 0, NODE_R - 4);
        cg.lineStyle(2, 0x333344, 0.5);
        cg.strokeCircle(0, 0, NODE_R - 4);
        nc.add(cg);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '16px', color: '#333344', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));
      }

      if (!isLocked) {
        const hit = this.add.zone(0, 0, NODE_R * 2 + 16, NODE_R * 2 + 16)
          .setInteractive({ useHandCursor: true });
        nc.add(hit);
        hit.on('pointerdown', () => {
          this.time.delayedCall(80, () => {
            if (Math.abs(this.velocity) < 3) {
              SoundManager.play('button_click');
              LevelManager.instance.setLevel(i);
              this.startGame();
            }
          });
        });
      }

      this.scrollContainer.add(nc);
    }
  }

  private createPlayButton(x: number, y: number): void {
    const btnW = 180, btnH = 48;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.85);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 3, btnW - 6, btnH * 0.4, { tl: btnH / 2 - 2, tr: btnH / 2 - 2, bl: 0, br: 0 });
    container.add(bg);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.15);
    glow.fillRoundedRect(-btnW / 2 - 4, -btnH / 2 - 4, btnW + 8, btnH + 8, btnH / 2 + 4);
    container.addAt(glow, 0);
    this.tweens.add({
      targets: glow, alpha: { from: 0.1, to: 0.35 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    container.add(this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '22px', color: '#111', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5));

    const hit = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    container.add(hit);
    hit.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({
        targets: container, scale: 0.93, duration: 60, yoyo: true, ease: 'Power2',
        onComplete: () => { container.setScale(1); this.startGame(); },
      });
    });

    this.scrollContainer.add(container);
  }

  private startGame(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }

  private clampScroll(): void {
    const minY = -(this.totalHeight - GAME_HEIGHT + 80);
    this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, 60);
  }
}
