// src/scenes/MenuScene.ts
// Colorful game-UI style matching the game over screen
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { LevelManager, generateLevel, getWorldInfoForLevels } from '@/config/progression';
import { SoundManager } from '@/systems/SoundManager';
import { WalletManager } from '@/systems/WalletManager';
import { PerkManager, getCheckpointLevel } from '@/systems/PerkManager';

const PAD = 34;
const CW = GAME_WIDTH - PAD * 2;
const F = 'Arial, Helvetica, sans-serif';
const NODE_R = 41;
const NODE_SPACING = 160;
const WORLD_GAP = 80;
const LOOKAHEAD = 8;
const C_BG = 0x2484c5;
const C_PANEL = 0x2e92d4;
const C_BORDER = 0x4aa8e0;
const C_YELLOW = 0xebb654;
const C_GREEN = 0x4cde39;

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
    this.cameras.main.setBackgroundColor('#2484c5');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    SoundManager.init();
    PerkManager.instance.syncFromStorage();

    const mgr = LevelManager.instance;
    const savedLevel = parseInt(localStorage.getItem('deathmarch-level') || '0', 10);
    const maxUnlocked = Math.max(0, savedLevel);
    mgr.setLevel(maxUnlocked);
    const visibleCount = maxUnlocked + 1 + LOOKAHEAD;

    // ── Header panel (fixed) ──
    const headerH = 144;
    const hdr = this.add.graphics().setDepth(10);
    // Gradient header: bright blue, slightly darker at bottom
    const hdrSteps = 16;
    for (let s = 0; s < hdrSteps; s++) {
      const t = s / hdrSteps;
      const r = Phaser.Math.Linear(0x30, 0x24, t);
      const g = Phaser.Math.Linear(0x98, 0x84, t);
      const b = Phaser.Math.Linear(0xd8, 0xc5, t);
      const c = (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
      hdr.fillStyle(c, 1);
      hdr.fillRect(0, Math.floor(headerH * s / hdrSteps), GAME_WIDTH, Math.ceil(headerH / hdrSteps) + 1);
    }
    // Gold accent line at top (3px thick)
    hdr.fillStyle(0xebb654, 0.9);
    hdr.fillRect(0, 0, GAME_WIDTH, 3);
    // Solid bottom edge (no transparency leak)
    hdr.lineStyle(2, 0xebb654, 0.5);
    hdr.lineBetween(0, headerH, GAME_WIDTH, headerH);

    this.add.text(GAME_WIDTH / 2, 46, 'DEATHMARCH', {
      fontSize: '42px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#e0b050', strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(11);

    // Score pill
    this.pill(PAD, 88, 174, 41, 0xebb654, 11);
    this.add.text(PAD + 14, 108, `\u2B50 ${localStorage.getItem('deathmarch-highscore') || '0'}`, {
      fontSize: '18px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0, 0.5).setDepth(11);

    // Gold pill
    this.pill(GAME_WIDTH - PAD - 162, 88, 162, 41, 0xebb654, 11);
    this.add.text(GAME_WIDTH - PAD - 14, 108, `\u{1FA99} ${WalletManager.gold}g`, {
      fontSize: '18px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(1, 0.5).setDepth(11);

    // ── Footer (fixed) ──
    const footH = 96;
    const foot = this.add.graphics().setDepth(10);
    // Gradient footer: slightly darker at top, bright at bottom
    const footSteps = 12;
    for (let s = 0; s < footSteps; s++) {
      const t = s / footSteps;
      const rr = Phaser.Math.Linear(0x24, 0x30, t);
      const gg = Phaser.Math.Linear(0x84, 0x98, t);
      const bb = Phaser.Math.Linear(0xc5, 0xd8, t);
      const cc = (Math.round(rr) << 16) | (Math.round(gg) << 8) | Math.round(bb);
      foot.fillStyle(cc, 1);
      foot.fillRect(0, GAME_HEIGHT - footH + Math.floor(footH * s / footSteps), GAME_WIDTH, Math.ceil(footH / footSteps) + 1);
    }
    // Gold accent line at top of footer (3px)
    foot.fillStyle(0xebb654, 0.7);
    foot.fillRect(0, GAME_HEIGHT - footH, GAME_WIDTH, 3);

    const settBtnW = 260, settBtnH = 62;
    const settBtnX = GAME_WIDTH / 2, settBtnY = GAME_HEIGHT - footH / 2;
    // Outer glow behind settings button
    const settGlow = this.add.graphics().setDepth(10.5);
    settGlow.fillStyle(0x2e92d4, 0.25);
    settGlow.fillEllipse(settBtnX, settBtnY, settBtnW + 28, settBtnH + 24);
    settGlow.fillStyle(0x2e92d4, 0.12);
    settGlow.fillEllipse(settBtnX, settBtnY, settBtnW + 48, settBtnH + 40);
    const settBg = this.add.graphics().setDepth(11);
    settBg.fillStyle(0x2e92d4, 1);
    settBg.fillRoundedRect(settBtnX - settBtnW / 2, settBtnY - settBtnH / 2, settBtnW, settBtnH, settBtnH / 2);
    settBg.lineStyle(1.5, 0xebb654, 0.3);
    settBg.strokeRoundedRect(settBtnX - settBtnW / 2, settBtnY - settBtnH / 2, settBtnW, settBtnH, settBtnH / 2);

    const settBtn = this.add.text(settBtnX, settBtnY, '\u2699  SETTINGS', {
      fontSize: '26px', color: '#d4e8f4', fontFamily: F, fontStyle: 'bold',
      stroke: '#e0b050', strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 2, fill: true },
    }).setOrigin(0.5).setDepth(11);

    const settHit = this.add.zone(settBtnX, settBtnY, settBtnW, settBtnH)
      .setInteractive({ useHandCursor: true }).setDepth(12);
    settHit.on('pointerdown', () => { SoundManager.play('button_click'); this.scene.start('SettingsScene'); });
    settHit.on('pointerover', () => settBtn.setColor('#ffffff'));
    settHit.on('pointerout', () => settBtn.setColor('#d4e8f4'));

    // ── Scrollable map ──
    this.scrollContainer = this.add.container(0, 0).setDepth(5);
    const positions = this.buildPositions(visibleCount);
    this.totalHeight = positions[positions.length - 1].y + 240;

    this.drawPaths(positions, maxUnlocked);
    this.drawWorldBanners(positions, visibleCount);
    this.drawNodes(positions, maxUnlocked);
    this.drawPerkBar();

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
    g.fillStyle(color, 0.35);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2, color, 0.8);
    g.strokeRoundedRect(x, y, w, h, h / 2);
  }

  private buildPositions(count: number): { x: number; y: number }[] {
    const pos: { x: number; y: number }[] = [];
    let y = 210;
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
      const y = positions[world.startLevel].y - 64;
      const lvl = generateLevel(world.startLevel);
      const accent = lvl.theme.accentColor;

      const ribbonW = 360, ribbonH = 38, notchW = 14;
      const rx = GAME_WIDTH / 2 - ribbonW / 2;
      const bg = this.add.graphics();
      bg.fillStyle(accent, 0.85);
      bg.beginPath();
      bg.moveTo(rx + notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW - notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW, y);
      bg.lineTo(rx + ribbonW - notchW, y + ribbonH / 2);
      bg.lineTo(rx + notchW, y + ribbonH / 2);
      bg.lineTo(rx, y);
      bg.closePath();
      bg.fillPath();
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRect(rx + notchW + 4, y - ribbonH / 2 + 3, ribbonW - notchW * 2 - 8, ribbonH / 3);
      bg.lineStyle(1.5, 0x000000, 0.3);
      bg.beginPath();
      bg.moveTo(rx + notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW - notchW, y - ribbonH / 2);
      bg.lineTo(rx + ribbonW, y);
      bg.lineTo(rx + ribbonW - notchW, y + ribbonH / 2);
      bg.lineTo(rx + notchW, y + ribbonH / 2);
      bg.lineTo(rx, y);
      bg.closePath();
      bg.strokePath();
      this.scrollContainer.add(bg);

      this.scrollContainer.add(this.add.text(GAME_WIDTH / 2, y, world.name.toUpperCase(), {
        fontSize: '18px', color: '#ffffff', fontFamily: F, fontStyle: 'bold', letterSpacing: 4,
        stroke: '#000', strokeThickness: 1,
        shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 2, fill: true },
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
        // Outer glow (more visible)
        const glowOuter = this.add.graphics();
        glowOuter.fillStyle(0xebb654, 0.08);
        glowOuter.fillCircle(0, 0, NODE_R + 28);
        nc.add(glowOuter);
        const glow = this.add.graphics();
        glow.fillStyle(0xebb654, 0.18);
        glow.fillCircle(0, 0, NODE_R + 14);
        nc.add(glow);
        this.tweens.add({ targets: glow, alpha: { from: 0.15, to: 0.5 }, scale: { from: 0.95, to: 1.15 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: glowOuter, alpha: { from: 0.06, to: 0.2 }, scale: { from: 1.0, to: 1.2 },
          duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Filled node
        const ng = this.add.graphics();
        ng.fillStyle(C_GREEN, 1);
        ng.fillCircle(0, 0, NODE_R);
        ng.fillStyle(0xffffff, 0.2);
        ng.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.65);
        ng.lineStyle(3, 0xebb654, 0.8);
        ng.strokeCircle(0, 0, NODE_R);
        ng.lineStyle(1.5, 0xffffff, 0.3);
        ng.strokeCircle(0, 0, NODE_R - 3);
        nc.add(ng);

        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '26px', color: '#fff', fontFamily: F, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
          shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
        }).setOrigin(0.5));

        nc.add(this.add.text(0, NODE_R + 18, lvl.name.toUpperCase(), {
          fontSize: '18px', color: '#6be85a', fontFamily: F, fontStyle: 'bold',
          stroke: '#1a3a4a', strokeThickness: 2,
          shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 2, fill: true },
        }).setOrigin(0.5));

        this.createPlayButton(x, y + NODE_R + 56);

      } else if (isCompleted) {
        // Subtle green shimmer glow behind completed nodes
        const shimmer = this.add.graphics();
        shimmer.fillStyle(C_GREEN, 0.1);
        shimmer.fillCircle(0, 0, NODE_R + 8);
        nc.add(shimmer);
        this.tweens.add({ targets: shimmer, alpha: { from: 0.08, to: 0.25 },
          duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const ng = this.add.graphics();
        ng.fillStyle(C_GREEN, 0.7);
        ng.fillCircle(0, 0, NODE_R - 2);
        ng.fillStyle(0xffffff, 0.15);
        ng.fillCircle(0, -NODE_R * 0.2, NODE_R * 0.55);
        nc.add(ng);
        nc.add(this.add.text(0, -2, '\u2713', {
          fontSize: '26px', color: '#fff', fontFamily: F, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
          shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 2, fill: true },
        }).setOrigin(0.5));

      } else {
        const ng = this.add.graphics();
        ng.fillStyle(C_PANEL, 1);
        ng.fillCircle(0, 0, NODE_R - 4);
        ng.lineStyle(2, C_BORDER, 0.5);
        ng.strokeCircle(0, 0, NODE_R - 4);
        nc.add(ng);
        nc.add(this.add.text(0, -2, String(i + 1), {
          fontSize: '20px', color: '#7aaabb', fontFamily: F, fontStyle: 'bold',
          stroke: '#1a3a4a', strokeThickness: 2,
          shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
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
    const w = 180, h = 52, r = h / 2;
    const c = this.add.container(x, y);

    // Outer glow behind button
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(C_GREEN, 0.12);
    outerGlow.fillEllipse(0, 0, w + 40, h + 30);
    outerGlow.fillStyle(C_GREEN, 0.06);
    outerGlow.fillEllipse(0, 0, w + 64, h + 48);
    c.add(outerGlow);
    this.tweens.add({ targets: outerGlow, alpha: { from: 0.7, to: 1.0 }, scale: { from: 0.97, to: 1.05 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.3);
    sh.fillRoundedRect(-w / 2 + 2, -r + 3, w, h, r);
    c.add(sh);

    const bg = this.add.graphics();
    bg.fillStyle(0x3cb82e, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h, r);
    bg.fillStyle(C_GREEN, 1);
    bg.fillRoundedRect(-w / 2, -r, w, h * 0.5, { tl: r, tr: r, bl: 4, br: 4 });
    // Brighter highlight strip at top (white at 0.2 opacity)
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(-w / 2 + 3, -r + 2, w - 6, 6, { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
    // Existing specular highlight
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-w / 2 + 4, -r + 3, w - 8, h * 0.28, { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
    c.add(bg);

    c.add(this.add.text(0, 0, '\u25B6  PLAY', {
      fontSize: '24px', color: '#fff', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
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

  private drawPerkBar(): void {
    const activePerks = PerkManager.instance.getAll();
    if (activePerks.length === 0) return;

    // Draw perks in a row above the footer
    const footH = 96;
    const perkY = GAME_HEIGHT - footH - 58;
    const perkBarW = Math.min(CW, activePerks.length * 52 + 28);
    const startX = (GAME_WIDTH - perkBarW) / 2;

    // Background panel
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x2e92d4, 0.9);
    bg.fillRoundedRect(startX, perkY - 22, perkBarW, 44, 22);
    bg.lineStyle(1, 0xebb654, 0.3);
    bg.strokeRoundedRect(startX, perkY - 22, perkBarW, 44, 22);

    // Label
    this.add.text(startX + 14, perkY, 'PERKS', {
      fontSize: '14px', color: '#ebb654', fontFamily: F, fontStyle: 'bold', letterSpacing: 2,
      stroke: '#1a3a4a', strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setOrigin(0, 0.5).setDepth(11);

    // Perk icons
    const iconStartX = startX + 72;
    const uniquePerks = new Map<string, { perk: typeof activePerks[0]; count: number }>();
    for (const p of activePerks) {
      const existing = uniquePerks.get(p.id);
      if (existing) existing.count++;
      else uniquePerks.set(p.id, { perk: p, count: 1 });
    }

    let i = 0;
    for (const { perk, count } of uniquePerks.values()) {
      const ix = iconStartX + i * 48;
      const icon = this.add.text(ix, perkY, perk.icon, {
        fontSize: '22px',
      }).setOrigin(0.5).setDepth(11);

      if (count > 1) {
        this.add.text(ix + 12, perkY + 10, `x${count}`, {
          fontSize: '12px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(11);
      }
      i++;
    }
  }

  private startGame(): void {
    // If starting from a checkpoint level, restore checkpoint perks.
    // If starting from level 0, reset everything for a fresh run.
    const selectedLevel = LevelManager.instance.currentLevelIndex;
    const checkpointLvl = PerkManager.instance.checkpointLevel;
    if (selectedLevel === 0) {
      PerkManager.instance.resetAll();
    } else if (selectedLevel <= checkpointLvl) {
      PerkManager.instance.restoreCheckpoint();
    }
    // If starting past the checkpoint (replaying a completed level), keep current perks

    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameScene'));
  }

  private clampScroll(): void {
    const minY = -(this.totalHeight - GAME_HEIGHT + 80);
    this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, 120);
  }
}
