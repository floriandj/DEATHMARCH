// src/scenes/MenuScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';

const NODE_SPACING = 170;
const LEFT_X = 180;
const RIGHT_X = 540;
const WORLD_GAP = 80;
const NODE_R = 38;
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

    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);

    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // Background glow
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 300);
    bgGlow.setDepth(0);

    // ── Title bar (fixed) ──
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x050510, 0.95);
    titleBg.fillRect(0, 0, GAME_WIDTH, 130);
    titleBg.fillStyle(0x050510, 0.6);
    titleBg.fillRect(0, 130, GAME_WIDTH, 15);
    titleBg.setDepth(10);

    this.add.text(GAME_WIDTH / 2, 36, 'DEATHMARCH', {
      fontSize: '42px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ff2040', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    this.add.rectangle(GAME_WIDTH / 2, 66, 200, 2, 0xff4040, 0.5).setDepth(11);

    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add.text(GAME_WIDTH / 2, 86, `BEST: ${highScore}`, {
      fontSize: '18px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    const cycleNum = Math.floor(maxUnlocked / 5) + 1;
    this.add.text(GAME_WIDTH / 2, 110, `LEVEL ${maxUnlocked + 1}  \u2022  CYCLE ${cycleNum}`, {
      fontSize: '14px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);

    const nodePositions = this.computeNodePositions(visibleCount);
    this.totalHeight = nodePositions[nodePositions.length - 1].y + 280;

    this.drawPath(nodePositions, maxUnlocked);
    this.drawWorldBanners(nodePositions, visibleCount);
    this.drawNodes(nodePositions, maxUnlocked);

    // ── Settings button (fixed, bigger) ──
    const settBg = this.add.graphics();
    settBg.fillStyle(0xffffff, 0.06);
    settBg.fillRoundedRect(10, GAME_HEIGHT - 60, 160, 44, 22);
    settBg.setDepth(11);

    const settBtn = this.add
      .text(90, GAME_HEIGHT - 38, '\u2699  SETTINGS', {
        fontSize: '16px', color: '#777777', fontFamily: 'monospace', fontStyle: 'bold',
      })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#777777'));

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

  private computeNodePositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let y = 220;
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
    g.lineStyle(5, 0xffffff, 0.07);

    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];
      if ((i + 1) % 5 === 0) {
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

    const brightG = this.add.graphics();
    brightG.lineStyle(6, 0x51cf66, 0.35);
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
    const worldInfos = getWorldInfoForLevels(visibleCount - 1);
    for (const world of worldInfos) {
      if (world.startLevel >= positions.length) continue;
      const nodeY = positions[world.startLevel].y;
      const bannerY = nodeY - 65;

      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;
      const accentHex = lvl.theme.accentHex;

      const bg = this.add.graphics();
      bg.fillStyle(accent, 0.08);
      bg.fillRoundedRect(GAME_WIDTH / 2 - 170, bannerY - 18, 340, 36, 18);
      bg.lineStyle(1, accent, 0.25);
      bg.strokeRoundedRect(GAME_WIDTH / 2 - 170, bannerY - 18, 340, 36, 18);

      const label = this.add
        .text(GAME_WIDTH / 2, bannerY, world.name.toUpperCase(), {
          fontSize: '15px', color: accentHex, fontFamily: 'monospace',
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
      const accent = lvl.theme.accentColor;

      const nameX = pos.x < GAME_WIDTH / 2 ? pos.x + NODE_R + 18 : pos.x - NODE_R - 18;
      const nameAlign = pos.x < GAME_WIDTH / 2 ? 0 : 1;

      const nc = this.add.container(pos.x, pos.y);

      if (isCompleted) {
        const circle = this.add.graphics();
        circle.fillStyle(0x51cf66, 0.18);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(3, 0x51cf66, 0.6);
        circle.strokeCircle(0, 0, NODE_R);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '20px', color: '#51cf66', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, 0, lvl.name, {
          fontSize: '14px', color: '#5cb86c', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));

      } else if (isCurrent) {
        const glow = this.add.graphics();
        glow.fillStyle(0xffd43b, 0.14);
        glow.fillCircle(0, 0, NODE_R + 14);
        nc.add(glow);
        this.tweens.add({
          targets: glow, alpha: { from: 0.3, to: 0.7 },
          scale: { from: 0.9, to: 1.15 }, duration: 1000,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        const circle = this.add.graphics();
        circle.fillStyle(0xffd43b, 0.28);
        circle.fillCircle(0, 0, NODE_R);
        circle.lineStyle(3, 0xffd43b, 0.85);
        circle.strokeCircle(0, 0, NODE_R);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '24px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, -10, lvl.name, {
          fontSize: '15px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(nameAlign, 0.5));

        nc.add(this.add.text(nameX - pos.x, 10, lvl.theme.worldName, {
          fontSize: '12px', color: '#998840', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));

        this.createPlayButton(pos.x, pos.y + NODE_R + 45);

      } else {
        const circle = this.add.graphics();
        circle.fillStyle(accent, 0.05);
        circle.fillCircle(0, 0, NODE_R - 4);
        circle.lineStyle(2, 0x444444, 0.3);
        circle.strokeCircle(0, 0, NODE_R - 4);
        nc.add(circle);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '18px', color: '#363636', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5));

        nc.add(this.add.text(nameX - pos.x, 0, lvl.name, {
          fontSize: '12px', color: '#2d2d2d', fontFamily: 'monospace',
        }).setOrigin(nameAlign, 0.5));
      }

      if (!isLocked) {
        const hitZone = this.add.zone(0, 0, NODE_R * 2 + 16, NODE_R * 2 + 16)
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
    const btnW = 200, btnH = 58;
    const container = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.1);
    glow.fillRoundedRect(-btnW / 2 - 5, -btnH / 2 - 5, btnW + 10, btnH + 10, btnH / 2 + 5);
    container.add(glow);
    this.tweens.add({
      targets: glow, alpha: { from: 0.15, to: 0.45 },
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
      this.time.delayedCall(50, () => {
        if (Math.abs(this.velocity) < 3) this.startGame();
      });
    });

    this.scrollContainer.add(container);
  }

  private startGame(): void {
    SoundManager.play('button_click');
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
