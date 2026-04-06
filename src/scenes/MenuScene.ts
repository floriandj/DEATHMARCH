// src/scenes/MenuScene.ts
// Candy-crush style vertical winding path with level nodes.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

const PAD = 40;
const NODE_R = 36;
const NODE_SPACING_Y = 130;
const WORLD_GAP = 60;
const LOOKAHEAD = 8;
// S-curve X positions (3 columns zigzag)
const COL_L = 160;
const COL_C = GAME_WIDTH / 2;
const COL_R = GAME_WIDTH - 160;

/** Generate an S-curve pattern of X positions */
function getNodeX(index: number): number {
  const pattern = [COL_L, COL_C, COL_R, COL_C]; // left, center, right, center
  return pattern[index % 4];
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
    this.cameras.main.setBackgroundColor('#050510');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // ── Fixed header (on top of scroll) ──
    const headerH = 120;

    // Header bg
    const headerBg = this.add.graphics().setDepth(10);
    headerBg.fillStyle(0x050510, 1);
    headerBg.fillRect(0, 0, GAME_WIDTH, headerH);
    headerBg.fillStyle(0x050510, 0.7);
    headerBg.fillRect(0, headerH, GAME_WIDTH, 20);

    this.add.text(GAME_WIDTH / 2, 32, 'DEATHMARCH', {
      fontSize: '40px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ff2040', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    this.add.rectangle(GAME_WIDTH / 2, 62, 180, 2, 0xff4040, 0.5).setDepth(11);

    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add.text(PAD, 84, `\u2605 ${highScore}`, {
      fontSize: '18px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(11);

    this.add.text(GAME_WIDTH - PAD, 84, `${WalletManager.gold}g`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(11);

    this.add.text(GAME_WIDTH / 2, 100, `LEVEL ${maxUnlocked + 1}`, {
      fontSize: '14px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);

    // ── Fixed footer with settings ──
    const footerBg = this.add.graphics().setDepth(10);
    footerBg.fillStyle(0x050510, 0.8);
    footerBg.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

    const settBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '\u2699 SETTINGS', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settBtn.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // ── Scrollable level map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);
    const positions = this.buildPositions(visibleCount);
    this.totalHeight = positions[positions.length - 1].y + 300;

    this.drawPaths(positions, maxUnlocked);
    this.drawWorldBanners(positions, visibleCount);
    this.drawNodes(positions, maxUnlocked);

    // Scroll to current level
    const currentY = positions[Math.min(maxUnlocked, positions.length - 1)].y;
    this.scrollContainer.y = -currentY + GAME_HEIGHT * 0.45;
    this.clampScroll();

    // ── Scroll input ──
    this.velocity = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartY = p.y;
      this.scrollStartY = this.scrollContainer.y;
      this.velocity = 0;
      this.lastPointerY = p.y;
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

  // ── Layout ──

  private buildPositions(count: number): { x: number; y: number }[] {
    const pos: { x: number; y: number }[] = [];
    let y = headerOffset();
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % 5 === 0) y += WORLD_GAP;
      pos.push({ x: getNodeX(i), y });
      y += NODE_SPACING_Y;
    }
    return pos;
  }

  private drawPaths(positions: { x: number; y: number }[], maxUnlocked: number): void {
    // Dark path
    const g = this.add.graphics();
    g.lineStyle(6, 0xffffff, 0.05);
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i], b = positions[i + 1];
      if ((i + 1) % 5 === 0) {
        // Dotted between worlds
        for (let s = 0; s < 6; s += 2) {
          const t1 = s / 6, t2 = (s + 1) / 6;
          g.beginPath();
          g.moveTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
          g.lineTo(a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2);
          g.strokePath();
        }
      } else {
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.strokePath();
      }
    }
    this.scrollContainer.add(g);

    // Bright completed path
    const bright = this.add.graphics();
    bright.lineStyle(6, 0x51cf66, 0.35);
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
      const nodeY = positions[world.startLevel].y - 55;
      const lvl = generateLevel(world.startLevel);

      const bg = this.add.graphics();
      bg.fillStyle(lvl.theme.accentColor, 0.08);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 160, nodeY - 16, 320, 32, 16);
      bg.lineStyle(1, lvl.theme.accentColor, 0.2);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 160, nodeY - 16, 320, 32, 16);
      this.scrollContainer.add(bg);

      const label = this.add.text(GAME_WIDTH / 2, nodeY, world.name.toUpperCase(), {
        fontSize: '14px', color: lvl.theme.accentHex, fontFamily: 'monospace',
        fontStyle: 'bold', letterSpacing: 3,
      }).setOrigin(0.5);
      this.scrollContainer.add(label);
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
        glow.fillCircle(0, 0, NODE_R + 14);
        nc.add(glow);
        this.tweens.add({
          targets: glow, alpha: { from: 0.2, to: 0.6 }, scale: { from: 0.95, to: 1.1 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // Circle
        const cg = this.add.graphics();
        cg.fillStyle(0x0a0a1a, 1);
        cg.fillCircle(0, 0, NODE_R);
        cg.lineStyle(3, 0xffd43b, 0.9);
        cg.strokeCircle(0, 0, NODE_R);
        nc.add(cg);

        // Number
        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '24px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        // Level name
        nc.add(this.add.text(0, NODE_R + 16, lvl.name.toUpperCase(), {
          fontSize: '13px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        // PLAY button below
        this.createPlayButton(x, y + NODE_R + 50);

      } else if (isCompleted) {
        const cg = this.add.graphics();
        cg.fillStyle(0x51cf66, 0.12);
        cg.fillCircle(0, 0, NODE_R - 2);
        cg.lineStyle(2, 0x51cf66, 0.5);
        cg.strokeCircle(0, 0, NODE_R - 2);
        nc.add(cg);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '20px', color: '#51cf66', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

      } else {
        const cg = this.add.graphics();
        cg.fillStyle(accent, 0.04);
        cg.fillCircle(0, 0, NODE_R - 4);
        cg.lineStyle(2, 0x333333, 0.25);
        cg.strokeCircle(0, 0, NODE_R - 4);
        nc.add(cg);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '18px', color: '#333333', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));
      }

      // Tappable for unlocked levels
      if (!isLocked) {
        const hitZone = this.add.zone(0, 0, NODE_R * 2 + 16, NODE_R * 2 + 16)
          .setInteractive({ useHandCursor: true });
        nc.add(hitZone);
        hitZone.on('pointerdown', () => {
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
    const btnW = 200, btnH = 56;
    const container = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.08);
    glow.fillRoundedRect(-btnW / 2 - 4, -btnH / 2 - 4, btnW + 8, btnH + 8, btnH / 2 + 4);
    container.add(glow);
    this.tweens.add({
      targets: glow, alpha: { from: 0.12, to: 0.4 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.18);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(2, 0x51cf66, 0.7);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const text = this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '24px', color: '#51cf66', fontFamily: 'monospace',
      fontStyle: 'bold', letterSpacing: 5,
    }).setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      text.setColor('#ffffff');
      bg.clear();
      bg.fillStyle(0x51cf66, 0.3);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(2, 0x51cf66, 0.95);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    });
    hitZone.on('pointerout', () => {
      text.setColor('#51cf66');
      bg.clear();
      bg.fillStyle(0x51cf66, 0.18);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(2, 0x51cf66, 0.7);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    });
    hitZone.on('pointerdown', () => {
      SoundManager.play('button_click');
      this.tweens.add({
        targets: container, scale: 0.92, duration: 60, yoyo: true, ease: 'Power2',
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

function headerOffset(): number {
  return 180; // first node starts below the fixed header
}
