// src/scenes/MenuScene.ts
// Candy-crush style scrollable level map — supports infinite levels.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';

const NODE_SPACING = 150;
const LEFT_X = 190;
const RIGHT_X = 530;
const WORLD_GAP = 70;
const NODE_R = 30;
/** How many locked levels to show beyond the current one */
const LOOKAHEAD = 8;

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

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);

    // How many nodes to render (unlocked + lookahead)
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 300);
    bgGlow.setDepth(0);

    // ── Title bar (fixed) ──
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x050510, 0.95);
    titleBg.fillRect(0, 0, GAME_WIDTH, 110);
    titleBg.fillStyle(0x050510, 0.6);
    titleBg.fillRect(0, 110, GAME_WIDTH, 15);
    titleBg.setDepth(10);

    this.add.text(GAME_WIDTH / 2, 30, 'DEATHMARCH', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ff2040', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    this.add.rectangle(GAME_WIDTH / 2, 55, 160, 2, 0xff4040, 0.4).setDepth(11);

    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add.text(GAME_WIDTH / 2, 74, `BEST: ${highScore}`, {
      fontSize: '14px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    const cycleNum = Math.floor(maxUnlocked / 5) + 1;
    this.add.text(GAME_WIDTH / 2, 94, `LEVEL ${maxUnlocked + 1}  \u2022  CYCLE ${cycleNum}`, {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);

    const nodePositions = this.computeNodePositions(visibleCount);
    this.totalHeight = nodePositions[nodePositions.length - 1].y + 250;

    this.drawPath(nodePositions, maxUnlocked);
    this.drawWorldBanners(nodePositions, visibleCount);
    this.drawNodes(nodePositions, maxUnlocked);

    // ── Settings button (fixed) ──
    const settBg = this.add.graphics();
    settBg.fillStyle(0xffffff, 0.05);
    settBg.fillRoundedRect(10, GAME_HEIGHT - 52, 130, 36, 18);
    settBg.setDepth(11);

    const settBtn = this.add
      .text(75, GAME_HEIGHT - 34, '\u2699 SETTINGS', {
        fontSize: '13px', color: '#666666', fontFamily: 'monospace',
      })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // ── Scroll to current level ──
    const currentNodeY = nodePositions[Math.min(maxUnlocked, nodePositions.length - 1)].y;
    this.scrollContainer.y = -currentNodeY + GAME_HEIGHT * 0.5;
    this.clampScroll();

    // ── Input ──
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

  private computeNodePositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let y = 200;
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % 5 === 0) y += WORLD_GAP;
      const row = Math.floor(i / 2);
      const isLeft = (row % 2 === 0) ? (i % 2 === 0) : (i % 2 !== 0);
      positions.push({ x: isLeft ? LEFT_X : RIGHT_X, y });
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
      if ((i + 1) % 5 === 0) {
        // Dotted line between cycles
        for (let s = 0; s < 8; s += 2) {
          const t1 = s / 8, t2 = (s + 1) / 8;
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

  private drawWorldBanners(positions: { x: number; y: number }[], visibleCount: number): void {
    const maxLevel = visibleCount - 1;
    const worldInfos = getWorldInfoForLevels(maxLevel);

    for (const world of worldInfos) {
      if (world.startLevel >= positions.length) continue;
      const nodeY = positions[world.startLevel].y;
      const bannerY = nodeY - 60;

      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;
      const accentHex = lvl.theme.accentHex;

      const bg = this.add.graphics();
      bg.fillStyle(accent, 0.06);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 150, bannerY - 16, 300, 32, 16);
      bg.lineStyle(1, accent, 0.2);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 150, bannerY - 16, 300, 32, 16);

      const label = this.add
        .text(GAME_WIDTH / 2, bannerY, world.name.toUpperCase(), {
          fontSize: '12px', color: accentHex, fontFamily: 'monospace',
          fontStyle: 'bold', letterSpacing: 3,
        })
        .setOrigin(0.5);

      this.scrollContainer.add([bg, label]);
    }
  }

  private drawNodes(positions: { x: number; y: number }[], maxUnlocked: number): void {
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const isCompleted = i < maxUnlocked;
      const isCurrent = i === maxUnlocked;
      const isLocked = i > maxUnlocked;
      const lvl = generateLevel(i);
      const accentHex = lvl.theme.accentHex;
      const accent = lvl.theme.accentColor;

      const nameX = pos.x < GAME_WIDTH / 2 ? pos.x + NODE_R + 16 : pos.x - NODE_R - 16;
      const nameAlign = pos.x < GAME_WIDTH / 2 ? 0 : 1;

      const nc = this.add.container(pos.x, pos.y);

      if (isCompleted) {
        const circle = this.add.graphics();
        circle.fillStyle(0x51cf66, 0.15);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(2, 0x51cf66, 0.5);
        circle.strokeCircle(0, 0, NODE_R);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '16px', color: '#51cf66', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, 0, lvl.name, {
          fontSize: '11px', color: '#4a9e5e', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));

      } else if (isCurrent) {
        const glow = this.add.graphics();
        glow.fillStyle(0xffd43b, 0.12);
        glow.fillCircle(0, 0, NODE_R + 12);
        nc.add(glow);
        this.tweens.add({
          targets: glow, alpha: { from: 0.3, to: 0.7 },
          scale: { from: 0.9, to: 1.15 }, duration: 1000,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        const circle = this.add.graphics();
        circle.fillStyle(0xffd43b, 0.25);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(3, 0xffd43b, 0.8);
        circle.strokeCircle(0, 0, NODE_R);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '20px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, -8, lvl.name, {
          fontSize: '12px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(nameAlign, 0.5));

        nc.add(this.add.text(nameX - pos.x, 8, lvl.theme.worldName, {
          fontSize: '9px', color: '#887730', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));

        this.createPlayButton(pos.x, pos.y + NODE_R + 38);

      } else {
        const circle = this.add.graphics();
        circle.fillStyle(accent, 0.04);
        circle.fillCircle(0, 0, NODE_R - 4);
        circle.lineStyle(1, 0x333333, 0.25);
        circle.strokeCircle(0, 0, NODE_R - 4);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '14px', color: '#2a2a2a', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, 0, lvl.name, {
          fontSize: '10px', color: '#222222', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));
      }

      // Tappable for unlocked levels
      if (!isLocked) {
        const hitZone = this.add.zone(0, 0, NODE_R * 2 + 10, NODE_R * 2 + 10)
          .setInteractive({ useHandCursor: true });
        nc.add(hitZone);
        hitZone.on('pointerdown', () => {
          this.time.delayedCall(100, () => {
            if (Math.abs(this.velocity) < 3) {
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
    const btnW = 150, btnH = 44;
    const container = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.08);
    glow.fillRoundedRect(-btnW / 2 - 4, -btnH / 2 - 4, btnW + 8, btnH + 8, btnH / 2 + 4);
    container.add(glow);
    this.tweens.add({
      targets: glow, alpha: { from: 0.15, to: 0.4 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.15);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(2, 0x51cf66, 0.6);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const text = this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '18px', color: '#51cf66', fontFamily: 'monospace',
      fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5);
    container.add(text);

    const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
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
        if (Math.abs(this.velocity) < 3) this.startGame();
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
    this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, 50);
  }
}
