// src/scenes/MenuScene.ts
// Candy-crush style scrollable level map with winding path and world banners.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, WORLD_INFO } from '@/config/progression';

/** Vertical spacing between level nodes */
const NODE_SPACING = 140;
/** Left / right X positions for the zigzag */
const LEFT_X = 200;
const RIGHT_X = 520;
/** Extra vertical gap before each world banner */
const WORLD_GAP = 60;
/** Radius of a level node */
const NODE_R = 32;

export class MenuScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private totalHeight: number = 0;
  private dragging: boolean = false;
  private dragStartY: number = 0;
  private scrollStartY: number = 0;
  private velocity: number = 0;
  private selectedLevel: number = -1;

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
    this.selectedLevel = maxUnlocked;

    // Background subtle glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.04);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 300);
    bgGlow.fillStyle(0x0040ff, 0.02);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 400);
    bgGlow.setDepth(0);

    // ── Title (fixed at top) ──
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x050510, 0.95);
    titleBg.fillRect(0, 0, GAME_WIDTH, 100);
    titleBg.fillStyle(0x050510, 0.6);
    titleBg.fillRect(0, 100, GAME_WIDTH, 20);
    titleBg.setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, 35, 'DEATHMARCH', {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#ff2040',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add.rectangle(GAME_WIDTH / 2, 60, 160, 2, 0xff4040, 0.4).setDepth(11);

    // High score
    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add
      .text(GAME_WIDTH / 2, 80, `HIGH SCORE: ${highScore}`, {
        fontSize: '12px',
        color: '#ffd43b',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(11);

    // ── Build scrollable level map ──
    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(5);

    const nodePositions = this.computeNodePositions(mgr.totalLevels);
    this.totalHeight = nodePositions[nodePositions.length - 1].y + 200;

    // Draw the path connecting nodes
    this.drawPath(nodePositions);

    // Draw world banners
    this.drawWorldBanners(nodePositions);

    // Draw level nodes
    this.drawNodes(nodePositions, maxUnlocked);

    // ── Settings button (fixed bottom-left) ──
    const settBtn = this.add
      .text(20, GAME_HEIGHT - 40, '\u2699 SETTINGS', {
        fontSize: '14px',
        color: '#666666',
        fontFamily: 'monospace',
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    settBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // Version
    this.add
      .text(GAME_WIDTH - 20, GAME_HEIGHT - 40, 'v2.0', {
        fontSize: '11px',
        color: '#333333',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 0)
      .setDepth(11);

    // ── Scroll to current level ──
    const currentNodeY = nodePositions[maxUnlocked].y;
    // Center the current level on screen
    this.scrollContainer.y = -currentNodeY + GAME_HEIGHT * 0.5;
    this.clampScroll();

    // ── Input: drag to scroll ──
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollContainer.y;
      this.velocity = 0;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dy = pointer.y - this.dragStartY;
      this.scrollContainer.y = this.scrollStartY + dy;
      this.velocity = dy;
      this.clampScroll();
    });

    this.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  update(): void {
    // Inertia scrolling
    if (!this.dragging && Math.abs(this.velocity) > 0.5) {
      this.scrollContainer.y += this.velocity * 0.05;
      this.velocity *= 0.92;
      this.clampScroll();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Layout computation
  // ─────────────────────────────────────────────────────────────────────────

  private computeNodePositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let y = 200; // start below title area

    for (let i = 0; i < count; i++) {
      // Add world gap before first level of each world (except world 1)
      if (i > 0 && i % 4 === 0) {
        y += WORLD_GAP;
      }

      // Zigzag: alternate left/right, with pairs going L-R then R-L
      const row = Math.floor(i / 2);
      const isLeft = (row % 2 === 0) ? (i % 2 === 0) : (i % 2 !== 0);
      const x = isLeft ? LEFT_X : RIGHT_X;

      positions.push({ x, y });
      y += NODE_SPACING;
    }

    return positions;
  }

  private drawPath(positions: { x: number; y: number }[]): void {
    const g = this.add.graphics();
    g.lineStyle(4, 0xffffff, 0.08);

    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];

      // Skip path across world boundaries (drawn as dashed)
      if ((i + 1) % 4 === 0) {
        // Dotted line between worlds
        const steps = 8;
        for (let s = 0; s < steps; s += 2) {
          const t1 = s / steps;
          const t2 = (s + 1) / steps;
          g.beginPath();
          g.moveTo(
            a.x + (b.x - a.x) * t1,
            a.y + (b.y - a.y) * t1,
          );
          g.lineTo(
            a.x + (b.x - a.x) * t2,
            a.y + (b.y - a.y) * t2,
          );
          g.strokePath();
        }
      } else {
        // Curved connection
        const midX = (a.x + b.x) / 2;
        const cpX = a.x === b.x ? midX + 60 : midX;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.strokePath();
      }
    }

    // Brighter path for completed section (draw on top)
    const brightG = this.add.graphics();
    brightG.lineStyle(4, 0x51cf66, 0.25);
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);

    for (let i = 0; i < Math.min(savedLevel, positions.length - 1); i++) {
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
    for (const world of WORLD_INFO) {
      const nodeY = positions[world.startLevel].y;
      const bannerY = nodeY - 55;

      // Banner background
      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 0.04);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 130, bannerY - 14, 260, 28, 14);
      bg.lineStyle(1, 0xffffff, 0.1);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 130, bannerY - 14, 260, 28, 14);

      const label = this.add
        .text(GAME_WIDTH / 2, bannerY, world.name.toUpperCase(), {
          fontSize: '13px',
          color: '#888888',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          letterSpacing: 4,
        })
        .setOrigin(0.5);

      this.scrollContainer.add([bg, label]);
    }
  }

  private drawNodes(
    positions: { x: number; y: number }[],
    maxUnlocked: number,
  ): void {
    const mgr = LevelManager.instance;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const isCompleted = i < maxUnlocked;
      const isCurrent = i === maxUnlocked;
      const isLocked = i > maxUnlocked;

      // Node container
      const nodeContainer = this.add.container(pos.x, pos.y);

      if (isCompleted) {
        // ── Completed: gold circle with check ──
        const circle = this.add.graphics();
        circle.fillStyle(0x51cf66, 0.2);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(2, 0x51cf66, 0.6);
        circle.strokeCircle(0, 0, NODE_R);
        nodeContainer.add(circle);

        const check = this.add
          .text(0, -1, '\u2713', {
            fontSize: '24px',
            color: '#51cf66',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(check);

        // Level number below
        const num = this.add
          .text(0, NODE_R + 14, String(i + 1), {
            fontSize: '12px',
            color: '#51cf66',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);

      } else if (isCurrent) {
        // ── Current: glowing animated circle ──
        const glow = this.add.graphics();
        glow.fillStyle(0xffd43b, 0.15);
        glow.fillCircle(0, 0, NODE_R + 10);
        nodeContainer.add(glow);

        this.tweens.add({
          targets: glow,
          alpha: { from: 0.3, to: 0.8 },
          scale: { from: 0.9, to: 1.15 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        const circle = this.add.graphics();
        circle.fillStyle(0xffd43b, 0.3);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(3, 0xffd43b, 0.9);
        circle.strokeCircle(0, 0, NODE_R);
        nodeContainer.add(circle);

        const num = this.add
          .text(0, -1, String(i + 1), {
            fontSize: '22px',
            color: '#ffd43b',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);

        // Level name below
        const name = this.add
          .text(0, NODE_R + 14, mgr.current.name, {
            fontSize: '11px',
            color: '#ffd43b',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        nodeContainer.add(name);

        // Play button below name
        this.createPlayButton(pos.x, pos.y + NODE_R + 40);

      } else {
        // ── Locked: dark gray with lock ──
        const circle = this.add.graphics();
        circle.fillStyle(0xffffff, 0.03);
        circle.fillCircle(0, 0, NODE_R - 4);
        circle.lineStyle(2, 0x333333, 0.3);
        circle.strokeCircle(0, 0, NODE_R - 4);
        nodeContainer.add(circle);

        const lock = this.add
          .text(0, -1, '\u{1F512}', {
            fontSize: '16px',
            color: '#333333',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        nodeContainer.add(lock);

        const num = this.add
          .text(0, NODE_R + 10, String(i + 1), {
            fontSize: '11px',
            color: '#333333',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        nodeContainer.add(num);
      }

      // Make completed and current nodes tappable
      if (!isLocked) {
        const hitZone = this.add.zone(0, 0, NODE_R * 2 + 10, NODE_R * 2 + 10)
          .setInteractive({ useHandCursor: true });
        nodeContainer.add(hitZone);

        hitZone.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
          // Only treat as tap if not dragging significantly
          this.time.delayedCall(100, () => {
            if (Math.abs(this.velocity) < 2) {
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
    this.selectedLevel = index;
    this.startGame();
  }

  private createPlayButton(x: number, y: number): void {
    const btnW = 160;
    const btnH = 46;

    const container = this.add.container(x, y);

    // Glow
    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.1);
    glow.fillRoundedRect(-btnW / 2 - 4, -btnH / 2 - 4, btnW + 8, btnH + 8, btnH / 2 + 4);
    container.add(glow);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Button bg
    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.15);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(2, 0x51cf66, 0.6);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const text = this.add
      .text(0, 0, 'PLAY', {
        fontSize: '22px',
        color: '#51cf66',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 6,
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
        if (Math.abs(this.velocity) < 2) {
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
