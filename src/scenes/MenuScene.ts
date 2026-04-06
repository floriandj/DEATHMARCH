// src/scenes/MenuScene.ts
// Candy-crush style scrollable level map with winding path and world banners.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, WORLD_INFO } from '@/config/progression';
import { generateAllLevels } from '@/config/progression/LevelGenerator';

/** Vertical spacing between level nodes */
const NODE_SPACING = 150;
/** Left / right X positions for the zigzag */
const LEFT_X = 190;
const RIGHT_X = 530;
/** Extra vertical gap before each world banner */
const WORLD_GAP = 70;
/** Radius of a level node */
const NODE_R = 30;

/** Cache of all level configs for name display */
const ALL_LEVELS = generateAllLevels();

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

    // Restore saved level progress
    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.min(savedLevel, mgr.totalLevels - 1);
    if (maxUnlocked >= 0 && maxUnlocked < mgr.totalLevels) {
      mgr.setLevel(maxUnlocked);
    }

    // Background subtle glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 300);
    bgGlow.setDepth(0);

    // ── Title bar (fixed at top) ──
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x050510, 0.95);
    titleBg.fillRect(0, 0, GAME_WIDTH, 110);
    titleBg.fillStyle(0x050510, 0.6);
    titleBg.fillRect(0, 110, GAME_WIDTH, 15);
    titleBg.setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, 30, 'DEATHMARCH', {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#ff2040',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add.rectangle(GAME_WIDTH / 2, 55, 160, 2, 0xff4040, 0.4).setDepth(11);

    // High score
    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add
      .text(GAME_WIDTH / 2, 74, `BEST: ${highScore}`, {
        fontSize: '14px',
        color: '#ffd43b',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    // Level count
    this.add
      .text(GAME_WIDTH / 2, 94, `${maxUnlocked + 1} / ${mgr.totalLevels} LEVELS`, {
        fontSize: '11px',
        color: '#555555',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(11);

    // ── Build scrollable level map ──
    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(5);

    const nodePositions = this.computeNodePositions(mgr.totalLevels);
    this.totalHeight = nodePositions[nodePositions.length - 1].y + 250;

    this.drawPath(nodePositions, maxUnlocked);
    this.drawWorldBanners(nodePositions);
    this.drawNodes(nodePositions, maxUnlocked);

    // ── Settings button (fixed bottom-left) ──
    const settBg = this.add.graphics();
    settBg.fillStyle(0xffffff, 0.05);
    settBg.fillRoundedRect(10, GAME_HEIGHT - 52, 130, 36, 18);
    settBg.setDepth(11);

    const settBtn = this.add
      .text(75, GAME_HEIGHT - 34, '\u2699 SETTINGS', {
        fontSize: '13px',
        color: '#666666',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    settBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // Version
    this.add
      .text(GAME_WIDTH - 20, GAME_HEIGHT - 34, 'v2.0', {
        fontSize: '11px',
        color: '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 0.5)
      .setDepth(11);

    // ── Scroll to current level ──
    const currentNodeY = nodePositions[maxUnlocked].y;
    this.scrollContainer.y = -currentNodeY + GAME_HEIGHT * 0.5;
    this.clampScroll();

    // ── Input: drag to scroll ──
    this.velocity = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollContainer.y;
      this.velocity = 0;
      this.lastPointerY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dy = pointer.y - this.dragStartY;
      this.scrollContainer.y = this.scrollStartY + dy;
      this.velocity = pointer.y - this.lastPointerY;
      this.lastPointerY = pointer.y;
      this.clampScroll();
    });

    this.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  update(): void {
    // Inertia scrolling
    if (!this.dragging && Math.abs(this.velocity) > 0.5) {
      this.scrollContainer.y += this.velocity * 0.3;
      this.velocity *= 0.92;
      this.clampScroll();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Layout computation
  // ─────────────────────────────────────────────────────────────────────────

  private computeNodePositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let y = 200;

    for (let i = 0; i < count; i++) {
      // Add world gap before first level of each world (except world 1)
      if (i > 0 && i % 4 === 0) {
        y += WORLD_GAP;
      }

      // Zigzag: alternate left/right
      const row = Math.floor(i / 2);
      const isLeft = (row % 2 === 0) ? (i % 2 === 0) : (i % 2 !== 0);
      const x = isLeft ? LEFT_X : RIGHT_X;

      positions.push({ x, y });
      y += NODE_SPACING;
    }

    return positions;
  }

  private drawPath(positions: { x: number; y: number }[], maxUnlocked: number): void {
    const g = this.add.graphics();
    g.lineStyle(4, 0xffffff, 0.06);

    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];

      if ((i + 1) % 4 === 0) {
        // Dotted line between worlds
        const steps = 8;
        for (let s = 0; s < steps; s += 2) {
          const t1 = s / steps;
          const t2 = (s + 1) / steps;
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

    // Bright completed path
    const brightG = this.add.graphics();
    brightG.lineStyle(5, 0x51cf66, 0.3);
    for (let i = 0; i < Math.min(maxUnlocked, positions.length - 1); i++) {
      const a = positions[i];
      const b = positions[i + 1];
      brightG.beginPath();
      brightG.moveTo(a.x, a.y);
      brightG.lineTo(b.x, b.y);
      brightG.strokePath();
    }

    this.scrollContainer.add([g, brightG]);
  }

  private drawWorldBanners(positions: { x: number; y: number }[]): void {
    for (let wi = 0; wi < WORLD_INFO.length; wi++) {
      const world = WORLD_INFO[wi];
      const nodeY = positions[world.startLevel].y;
      const bannerY = nodeY - 60;

      // Get accent color from the first level of this world
      const lvl = ALL_LEVELS[world.startLevel];
      const accent = lvl.theme.accentColor;
      const accentHex = lvl.theme.accentHex;

      const bg = this.add.graphics();
      bg.fillStyle(accent, 0.06);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 140, bannerY - 16, 280, 32, 16);
      bg.lineStyle(1, accent, 0.2);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 140, bannerY - 16, 280, 32, 16);

      const label = this.add
        .text(GAME_WIDTH / 2, bannerY, world.name.toUpperCase(), {
          fontSize: '13px',
          color: accentHex,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          letterSpacing: 3,
        })
        .setOrigin(0.5);

      this.scrollContainer.add([bg, label]);
    }
  }

  private drawNodes(
    positions: { x: number; y: number }[],
    maxUnlocked: number,
  ): void {
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const isCompleted = i < maxUnlocked;
      const isCurrent = i === maxUnlocked;
      const isLocked = i > maxUnlocked;
      const lvl = ALL_LEVELS[i];
      const accent = lvl.theme.accentColor;
      const accentHex = lvl.theme.accentHex;

      // Name label position: to the side opposite of the node
      const nameX = pos.x < GAME_WIDTH / 2 ? pos.x + NODE_R + 16 : pos.x - NODE_R - 16;
      const nameAlign = pos.x < GAME_WIDTH / 2 ? 0 : 1;

      const nodeContainer = this.add.container(pos.x, pos.y);

      if (isCompleted) {
        // ── Completed: accent-colored circle with check ──
        const circle = this.add.graphics();
        circle.fillStyle(0x51cf66, 0.15);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(2, 0x51cf66, 0.5);
        circle.strokeCircle(0, 0, NODE_R);
        nodeContainer.add(circle);

        const num = this.add
          .text(0, -2, String(i + 1), {
            fontSize: '16px',
            color: '#51cf66',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);

        // Level name to the side
        const name = this.add
          .text(nameX - pos.x, 0, lvl.name, {
            fontSize: '11px',
            color: '#4a9e5e',
            fontFamily: 'monospace',
          })
          .setOrigin(nameAlign, 0.5);
        nodeContainer.add(name);

      } else if (isCurrent) {
        // ── Current: glowing animated circle with accent ──
        const glow = this.add.graphics();
        glow.fillStyle(0xffd43b, 0.12);
        glow.fillCircle(0, 0, NODE_R + 12);
        nodeContainer.add(glow);

        this.tweens.add({
          targets: glow,
          alpha: { from: 0.3, to: 0.7 },
          scale: { from: 0.9, to: 1.15 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        const circle = this.add.graphics();
        circle.fillStyle(0xffd43b, 0.25);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(3, 0xffd43b, 0.8);
        circle.strokeCircle(0, 0, NODE_R);
        nodeContainer.add(circle);

        const num = this.add
          .text(0, -2, String(i + 1), {
            fontSize: '20px',
            color: '#ffd43b',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);

        // Level name to the side (brighter)
        const name = this.add
          .text(nameX - pos.x, -8, lvl.name, {
            fontSize: '12px',
            color: '#ffd43b',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(nameAlign, 0.5);
        nodeContainer.add(name);

        // World subtitle
        const worldSub = this.add
          .text(nameX - pos.x, 8, lvl.theme.worldName, {
            fontSize: '9px',
            color: '#887730',
            fontFamily: 'monospace',
          })
          .setOrigin(nameAlign, 0.5);
        nodeContainer.add(worldSub);

        // Play button below
        this.createPlayButton(pos.x, pos.y + NODE_R + 38);

      } else {
        // ── Locked: dark with accent tint ──
        const circle = this.add.graphics();
        circle.fillStyle(accent, 0.04);
        circle.fillCircle(0, 0, NODE_R - 4);
        circle.lineStyle(1, 0x333333, 0.25);
        circle.strokeCircle(0, 0, NODE_R - 4);
        nodeContainer.add(circle);

        const num = this.add
          .text(0, -2, String(i + 1), {
            fontSize: '14px',
            color: '#2a2a2a',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);

        // Level name (dimmed)
        const name = this.add
          .text(nameX - pos.x, 0, lvl.name, {
            fontSize: '10px',
            color: '#222222',
            fontFamily: 'monospace',
          })
          .setOrigin(nameAlign, 0.5);
        nodeContainer.add(name);
      }

      // Make completed and current nodes tappable
      if (!isLocked) {
        const hitZone = this.add.zone(0, 0, NODE_R * 2 + 10, NODE_R * 2 + 10)
          .setInteractive({ useHandCursor: true });
        nodeContainer.add(hitZone);

        hitZone.on('pointerdown', () => {
          this.time.delayedCall(100, () => {
            if (Math.abs(this.velocity) < 3) {
              this.selectLevel(i);
            }
          });
        });
      }

      this.scrollContainer.add(nodeContainer);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Interactions
  // ─────────────────────────────────────────────────────────────────────────

  private selectLevel(index: number): void {
    const mgr = LevelManager.instance;
    mgr.setLevel(index);
    this.startGame();
  }

  private createPlayButton(x: number, y: number): void {
    const btnW = 150;
    const btnH = 44;

    const container = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.08);
    glow.fillRoundedRect(-btnW / 2 - 4, -btnH / 2 - 4, btnW + 8, btnH + 8, btnH / 2 + 4);
    container.add(glow);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.15, to: 0.4 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.15);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(2, 0x51cf66, 0.6);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const text = this.add
      .text(0, 0, '\u25B6  PLAY', {
        fontSize: '18px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      text.setColor('#ffffff');
      bg.clear();
      bg.fillStyle(0x51cf66, 0.25);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(2, 0x51cf66, 0.9);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    });
    hitZone.on('pointerout', () => {
      text.setColor('#51cf66');
      bg.clear();
      bg.fillStyle(0x51cf66, 0.15);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
      bg.lineStyle(2, 0x51cf66, 0.6);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    });
    hitZone.on('pointerdown', () => {
      this.time.delayedCall(50, () => {
        if (Math.abs(this.velocity) < 3) {
          this.startGame();
        }
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
    const minY = -(this.totalHeight - GAME_HEIGHT + 50);
    const maxY = 50;
    this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, maxY);
  }
}
