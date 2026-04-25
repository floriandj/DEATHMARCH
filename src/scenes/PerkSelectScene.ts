// src/scenes/PerkSelectScene.ts
// Full-screen perk selection after boss victory. Pick 1 of 3 random perks.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { PerkManager, PerkDef, CHECKPOINT_INTERVAL } from '@/systems/PerkManager';
import { SoundManager } from '@/systems/SoundManager';
import { UIFactory, UIPalette } from '@/systems/UIFactory';

const F = 'Arial, Helvetica, sans-serif';

interface PerkSelectData {
  score: number;
  distance: number;
  goldEarned: number;
  levelIndex: number;
}

const RARITY_COLORS: Record<string, { border: number; text: string; glow: number; label: string }> = {
  common:    { border: 0x2e92d4, text: '#5aade8', glow: 0x2e92d4, label: 'COMMON' },
  rare:      { border: 0xa864e8, text: '#b88ae8', glow: 0xa864e8, label: 'RARE' },
  legendary: { border: 0xebb654, text: '#f5d78e', glow: 0xebb654, label: 'LEGENDARY' },
};

export class PerkSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PerkSelectScene' });
  }

  create(data: PerkSelectData): void {
    this.cameras.main.setBackgroundColor('#0e1a2b');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const choices = PerkManager.instance.getRandomChoices(3);
    const streak = PerkManager.instance.runStreak;

    // ── Header ──
    // Golden glow ellipse behind title
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0xebb654, 0.1);
    titleGlow.fillEllipse(GAME_WIDTH / 2, 80, 340, 70);

    this.add.text(GAME_WIDTH / 2, 80, '\u2B06\uFE0F  LEVEL UP', {
      fontSize: '46px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4, letterSpacing: 4,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, 'Choose a perk for your run', {
      fontSize: '20px', color: '#e0eef8', fontFamily: F,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Show run streak if > 0
    if (streak > 1) {
      this.add.text(GAME_WIDTH / 2, 148, `\u{1F525} ${streak} LEVEL STREAK  \u00D7${(1 + streak * 0.25).toFixed(2)} gold`, {
        fontSize: '18px', color: '#e8923a', fontFamily: F, fontStyle: 'bold',
        stroke: '#1a3a4a', strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // Show active perks count
    const existingPerks = PerkManager.instance.getAll();
    if (existingPerks.length > 0) {
      const perkIcons = existingPerks.map((p) => p.icon).join(' ');
      this.add.text(GAME_WIDTH / 2, 172, perkIcons, {
        fontSize: '24px',
      }).setOrigin(0.5);
    }

    // Checkpoint indicator
    const nextLevel = data.levelIndex + 1;
    if (nextLevel % CHECKPOINT_INTERVAL === 0) {
      const cpY = existingPerks.length > 0 ? 196 : 172;
      this.add.text(GAME_WIDTH / 2, cpY, '\u{1F6A9} CHECKPOINT REACHED — progress saved!', {
        fontSize: '16px', color: '#4cde39', fontFamily: F, fontStyle: 'bold',
        stroke: '#1a3a4a', strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // ── Perk cards (responsive to screen size) ──
    const margin = 24;
    const gap = 14;
    const cardW = Math.min(220, Math.floor((GAME_WIDTH - margin * 2 - gap * 2) / 3));
    const maxCardH = Math.min(300, GAME_HEIGHT - 280); // leave room for header + skip
    const cardH = Math.max(200, maxCardH);
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const cardY = 210 + cardH / 2;

    for (let i = 0; i < choices.length; i++) {
      const perk = choices[i];
      const cx = startX + i * (cardW + gap);
      this.createPerkCard(cx, cardY, cardW, cardH, perk, data, i);
    }

    // ── Skip button (squishy, bottom) ──
    const skipY = Math.min(GAME_HEIGHT - 56, cardY + cardH / 2 + 56);
    UIFactory.createButton(
      this, GAME_WIDTH / 2, skipY, 200, 56, 'SKIP',
      () => this.selectPerk(null, data),
      {
        fillColor: UIPalette.panelDark,
        borderColor: UIPalette.sky,
        borderWidth: 3,
        cornerRadius: 28,
        fontSize: 20,
        fontColor: '#5de2ff',
      },
    );
  }

  private createPerkCard(
    x: number, y: number, w: number, h: number,
    perk: PerkDef, data: PerkSelectData, index: number,
  ): void {
    const rc = RARITY_COLORS[perk.rarity];
    const container = this.add.container(x, y);

    // Outer rarity halo (subtle ambient glow that pulses on hover).
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(rc.glow, 0.14);
    outerGlow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 28);
    container.add(outerGlow);

    // Card body via UIFactory: drop shadow + thick rarity-tinted border +
    // glossy white highlight on top + dark navy fill.
    const cardPanel = UIFactory.createPanel(this, 0, 0, w, h, {
      fillColor: UIPalette.panelDark,
      borderColor: rc.border,
      borderWidth: 4,
      cornerRadius: 22,
      shadowOffset: 8,
      shadowAlpha: 0.45,
      highlightAlpha: 0.16,
    });
    container.add(cardPanel);

    // Scale font sizes based on card width
    const iconSize = Math.min(48, Math.round(w * 0.22));
    const nameSize = Math.min(18, Math.round(w * 0.08));
    const descSize = Math.min(14, Math.round(w * 0.065));

    // Circular glow behind icon
    const iconGlow = this.add.graphics();
    iconGlow.fillStyle(rc.glow, 0.15);
    iconGlow.fillCircle(0, -h / 2 + h * 0.18, 34);
    container.add(iconGlow);

    // Icon
    const icon = this.add.text(0, -h / 2 + h * 0.18, perk.icon, {
      fontSize: `${iconSize}px`,
    }).setOrigin(0.5);
    container.add(icon);

    // Rarity label
    container.add(this.add.text(0, -h / 2 + h * 0.33, rc.label, {
      fontSize: '12px', color: rc.text, fontFamily: F, fontStyle: 'bold', letterSpacing: 2,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));

    // Name
    container.add(this.add.text(0, -h / 2 + h * 0.44, perk.name.toUpperCase(), {
      fontSize: `${nameSize}px`, color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      wordWrap: { width: w - 20 }, align: 'center',
      stroke: '#1a3a4a', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5));

    // Description
    container.add(this.add.text(0, -h / 2 + h * 0.58, perk.description, {
      fontSize: `${descSize}px`, color: '#c8dce8', fontFamily: F,
      wordWrap: { width: w - 20 }, align: 'center', lineSpacing: 3,
      stroke: '#000000', strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true },
    }).setOrigin(0.5, 0));

    // Hit zone
    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    // Glow pulse tween (paused by default)
    const glowPulse = this.tweens.add({
      targets: outerGlow,
      alpha: { from: 1, to: 0.5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });

    // Hover effect
    hitZone.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.06, duration: 160, ease: 'Back.easeOut' });
      outerGlow.clear();
      outerGlow.fillStyle(rc.glow, 0.30);
      outerGlow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 28);
      glowPulse.resume();
    });

    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 160, ease: 'Quad.easeOut' });
      glowPulse.pause();
      outerGlow.setAlpha(1);
      outerGlow.clear();
      outerGlow.fillStyle(rc.glow, 0.14);
      outerGlow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 28);
    });

    hitZone.on('pointerdown', () => {
      // Squishy press-in before selecting.
      this.tweens.add({
        targets: container,
        scale: 0.94,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => this.selectPerk(perk, data),
      });
    });

    // Entrance animation — stagger cards with vertical bounce
    const finalY = container.y;
    container.setAlpha(0).setScale(0.8).setY(finalY + 30);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: 200 + index * 120,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: container,
      y: finalY,
      duration: 500,
      delay: 200 + index * 120,
      ease: 'Back.easeOut',
    });
  }

  private selectPerk(perk: PerkDef | null, data: PerkSelectData): void {
    if (perk) {
      PerkManager.instance.addPerk(perk.id);
      SoundManager.play('gate_positive');
    }

    // Save checkpoint if the next level is a checkpoint boundary
    // e.g. completing level 4 means next is 5 (a checkpoint)
    const nextLevel = data.levelIndex + 1;
    if (nextLevel % CHECKPOINT_INTERVAL === 0) {
      PerkManager.instance.saveCheckpoint(nextLevel);
    }

    this.cameras.main.fade(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GameOverScene', {
        score: data.score,
        distance: data.distance,
        bossDefeated: true,
        goldEarned: data.goldEarned,
      });
    });
  }
}
