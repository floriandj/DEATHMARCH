// src/scenes/MenuScene.ts
// Horizontal level carousel — simpler and better for endless games.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';

const NODE_R = 52;       // current level node radius
const NODE_R_SM = 36;    // neighbor node radius
const CAROUSEL_Y = 560;  // vertical center of the carousel
const NODE_GAP = 160;    // horizontal gap between nodes
const VISIBLE = 5;       // max visible nodes (2 left, current, 2 right)

export class MenuScene extends Phaser.Scene {
  private carouselContainer!: Phaser.GameObjects.Container;
  private currentIndex: number = 0;
  private maxUnlocked: number = 0;
  private dragging: boolean = false;
  private dragStartX: number = 0;
  private offsetX: number = 0;
  private baseOffsetX: number = 0;
  private velocity: number = 0;
  private lastPointerX: number = 0;

  // Refreshable UI elements
  private levelNameText!: Phaser.GameObjects.Text;
  private worldNameText!: Phaser.GameObjects.Text;
  private cycleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050510');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    SoundManager.init();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    this.maxUnlocked = Math.max(0, savedLevel);
    this.currentIndex = this.maxUnlocked;
    mgr.setLevel(this.currentIndex);

    // ── Background ──
    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(0xff2040, 0.03);
    bgGlow.fillCircle(GAME_WIDTH / 2, 200, 300);

    // ── Title ──
    this.add.text(GAME_WIDTH / 2, 60, 'DEATHMARCH', {
      fontSize: '44px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ff2040', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.rectangle(GAME_WIDTH / 2, 92, 200, 3, 0xff4040, 0.5);

    // ── Stats row ──
    const highScore = localStorage.getItem('deathmarch-highscore') || '0';
    this.add.text(GAME_WIDTH / 2 - 120, 120, `BEST ${highScore}`, {
      fontSize: '16px', color: '#ffd43b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2 + 120, 120, `${WalletManager.gold}g`, {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── World name banner (above carousel) ──
    this.worldNameText = this.add.text(GAME_WIDTH / 2, CAROUSEL_Y - 120, '', {
      fontSize: '14px', color: '#666666', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5);

    // ── Carousel ──
    this.carouselContainer = this.add.container(0, 0);
    this.offsetX = 0;
    this.rebuildCarousel();

    // ── Level name (below carousel) ──
    this.levelNameText = this.add.text(GAME_WIDTH / 2, CAROUSEL_Y + 90, '', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.cycleText = this.add.text(GAME_WIDTH / 2, CAROUSEL_Y + 120, '', {
      fontSize: '13px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.updateLabels();

    // ── Swipe hint ──
    this.add.text(GAME_WIDTH / 2, CAROUSEL_Y + 160, '\u25C0  SWIPE  \u25B6', {
      fontSize: '13px', color: '#333333', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ── PLAY button (fixed, always visible) ──
    this.createPlayButton(GAME_WIDTH / 2, GAME_HEIGHT - 220);

    // ── Settings button ──
    const settBg = this.add.graphics();
    settBg.fillStyle(0xffffff, 0.06);
    settBg.fillRoundedRect(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 110, 160, 48, 24);

    const settBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 86, '\u2699  SETTINGS', {
      fontSize: '15px', color: '#666666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    settBtn.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settBtn.on('pointerover', () => settBtn.setColor('#ffffff'));
    settBtn.on('pointerout', () => settBtn.setColor('#666666'));

    // ── Swipe input ──
    this.velocity = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartX = p.x;
      this.baseOffsetX = this.offsetX;
      this.velocity = 0;
      this.lastPointerX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.offsetX = this.baseOffsetX + (p.x - this.dragStartX);
      this.velocity = p.x - this.lastPointerX;
      this.lastPointerX = p.x;
      this.rebuildCarousel();
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      const swipeDist = p.x - this.dragStartX;

      // Determine snap target
      if (Math.abs(swipeDist) > 40 || Math.abs(this.velocity) > 4) {
        if (swipeDist > 0 && this.currentIndex > 0) {
          this.currentIndex--;
        } else if (swipeDist < 0 && this.currentIndex < this.maxUnlocked) {
          this.currentIndex++;
        }
      }

      // Snap to current index
      this.snapToIndex();
    });
  }

  update(): void {
    // Inertia handled by snap tween
  }

  private snapToIndex(): void {
    const targetOffset = 0; // current index is always at center
    this.tweens.add({
      targets: this,
      offsetX: targetOffset,
      duration: 250,
      ease: 'Power2',
      onUpdate: () => this.rebuildCarousel(),
      onComplete: () => {
        LevelManager.instance.setLevel(this.currentIndex);
        this.updateLabels();
      },
    });
  }

  private updateLabels(): void {
    const lvl = generateLevel(this.currentIndex);
    this.levelNameText.setText(lvl.name.toUpperCase());
    this.worldNameText.setText(lvl.theme.worldName.toUpperCase());
    this.worldNameText.setColor(lvl.theme.accentHex);
    const cycle = Math.floor(this.currentIndex / 5) + 1;
    this.cycleText.setText(`LEVEL ${this.currentIndex + 1}  \u2022  CYCLE ${cycle}`);
  }

  private rebuildCarousel(): void {
    this.carouselContainer.removeAll(true);

    // Render nodes around the current index
    const startIdx = Math.max(0, this.currentIndex - 3);
    const endIdx = this.currentIndex + 4;

    for (let i = startIdx; i <= endIdx; i++) {
      const offset = i - this.currentIndex;
      const screenX = GAME_WIDTH / 2 + offset * NODE_GAP + this.offsetX;

      // Skip if far off-screen
      if (screenX < -100 || screenX > GAME_WIDTH + 100) continue;

      const isCurrent = i === this.currentIndex;
      const isCompleted = i < this.maxUnlocked;
      const isLocked = i > this.maxUnlocked;
      const lvl = generateLevel(i);
      const accent = lvl.theme.accentColor;

      const r = isCurrent ? NODE_R : NODE_R_SM;

      // Distance from center for scaling
      const distFromCenter = Math.abs(screenX - GAME_WIDTH / 2);
      const scaleFactor = Math.max(0.6, 1 - distFromCenter / 500);

      const nodeG = this.add.graphics();

      if (isCurrent) {
        // Glowing ring
        nodeG.fillStyle(accent, 0.08);
        nodeG.fillCircle(screenX, CAROUSEL_Y, r + 12);
        // Main circle
        nodeG.fillStyle(0x0a0a1a, 1);
        nodeG.fillCircle(screenX, CAROUSEL_Y, r);
        nodeG.lineStyle(3, accent, 0.9);
        nodeG.strokeCircle(screenX, CAROUSEL_Y, r);
      } else if (isCompleted) {
        nodeG.fillStyle(0x0a0a1a, 1);
        nodeG.fillCircle(screenX, CAROUSEL_Y, r * scaleFactor);
        nodeG.lineStyle(2, 0x51cf66, 0.5 * scaleFactor);
        nodeG.strokeCircle(screenX, CAROUSEL_Y, r * scaleFactor);
      } else {
        nodeG.fillStyle(0x0a0a1a, 0.8);
        nodeG.fillCircle(screenX, CAROUSEL_Y, r * scaleFactor);
        nodeG.lineStyle(2, 0x333333, 0.3 * scaleFactor);
        nodeG.strokeCircle(screenX, CAROUSEL_Y, r * scaleFactor);
      }
      this.carouselContainer.add(nodeG);

      // Number
      const numSize = isCurrent ? '28px' : `${Math.round(18 * scaleFactor)}px`;
      const numColor = isCurrent ? '#ffffff' : isCompleted ? '#51cf66' : '#333333';
      const num = this.add.text(screenX, CAROUSEL_Y, String(i + 1), {
        fontSize: numSize, color: numColor, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(scaleFactor);
      this.carouselContainer.add(num);

      // Lock icon for locked levels
      if (isLocked) {
        const lock = this.add.text(screenX, CAROUSEL_Y + r * scaleFactor + 12, '\u{1F512}', {
          fontSize: '12px', color: '#333333',
        }).setOrigin(0.5).setAlpha(scaleFactor * 0.6);
        this.carouselContainer.add(lock);
      }
    }
  }

  private createPlayButton(x: number, y: number): void {
    const btnW = 320, btnH = 72;
    const container = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0x51cf66, 0.08);
    glow.fillRoundedRect(-btnW / 2 - 6, -btnH / 2 - 6, btnW + 12, btnH + 12, btnH / 2 + 6);
    container.add(glow);
    this.tweens.add({
      targets: glow, alpha: { from: 0.12, to: 0.4 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const bg = this.add.graphics();
    bg.fillStyle(0x51cf66, 0.18);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    bg.lineStyle(2, 0x51cf66, 0.7);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    container.add(bg);

    const text = this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '28px', color: '#51cf66', fontFamily: 'monospace',
      fontStyle: 'bold', letterSpacing: 6,
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
        onComplete: () => {
          container.setScale(1);
          LevelManager.instance.setLevel(this.currentIndex);
          this.cameras.main.fadeOut(200, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameScene');
          });
        },
      });
    });
  }
}
