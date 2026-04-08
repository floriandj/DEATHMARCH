// src/scenes/PerkSelectScene.ts
// Full-screen perk selection after boss victory. Pick 1 of 3 random perks.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { PerkManager, PerkDef, CHECKPOINT_INTERVAL } from '@/systems/PerkManager';
import { SoundManager } from '@/systems/SoundManager';

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
    this.cameras.main.setBackgroundColor('#2484c5');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const choices = PerkManager.instance.getRandomChoices(3);
    const streak = PerkManager.instance.runStreak;

    // ── Header ──
    this.add.text(GAME_WIDTH / 2, 80, '\u2B06\uFE0F  LEVEL UP', {
      fontSize: '46px', color: '#ebb654', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4, letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, 'Choose a perk for your run', {
      fontSize: '20px', color: '#8fb0c4', fontFamily: F,
      stroke: '#1a3a4a', strokeThickness: 2,
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

    // ── Perk cards ──
    const cardW = 240;
    const cardH = 330;
    const gap = 20;
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const cardY = GAME_HEIGHT * 0.45;

    for (let i = 0; i < choices.length; i++) {
      const perk = choices[i];
      const cx = startX + i * (cardW + gap);
      this.createPerkCard(cx, cardY, cardW, cardH, perk, data, i);
    }

    // ── Skip button (subtle, bottom) ──
    const skipText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'SKIP', {
      fontSize: '20px', color: '#6a8ea0', fontFamily: F, fontStyle: 'bold',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipText.on('pointerover', () => skipText.setColor('#8fb0c4'));
    skipText.on('pointerout', () => skipText.setColor('#6a8ea0'));
    skipText.on('pointerdown', () => {
      this.selectPerk(null, data);
    });
  }

  private createPerkCard(
    x: number, y: number, w: number, h: number,
    perk: PerkDef, data: PerkSelectData, index: number,
  ): void {
    const rc = RARITY_COLORS[perk.rarity];
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x2e92d4, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
    bg.lineStyle(2, rc.border, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
    container.add(bg);

    // Rarity strip at top
    const strip = this.add.graphics();
    strip.fillStyle(rc.border, 0.3);
    strip.fillRoundedRect(-w / 2, -h / 2, w, 7, { tl: 20, tr: 20, bl: 0, br: 0 });
    container.add(strip);

    // Icon
    const icon = this.add.text(0, -h / 2 + 66, perk.icon, {
      fontSize: '56px',
    }).setOrigin(0.5);
    container.add(icon);

    // Rarity label
    container.add(this.add.text(0, -h / 2 + 114, rc.label, {
      fontSize: '14px', color: rc.text, fontFamily: F, fontStyle: 'bold', letterSpacing: 2,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));

    // Name
    container.add(this.add.text(0, -h / 2 + 150, perk.name.toUpperCase(), {
      fontSize: '20px', color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      wordWrap: { width: w - 28 }, align: 'center',
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5));

    // Description
    container.add(this.add.text(0, -h / 2 + 210, perk.description, {
      fontSize: '16px', color: '#8fb0c4', fontFamily: F,
      wordWrap: { width: w - 34 }, align: 'center', lineSpacing: 4,
      stroke: '#1a3a4a', strokeThickness: 2,
    }).setOrigin(0.5, 0));

    // Hit zone
    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    // Hover effect
    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a88c4, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
      bg.lineStyle(3, rc.border, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
      container.setScale(1.05);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2e92d4, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
      bg.lineStyle(2, rc.border, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
      container.setScale(1);
    });

    hitZone.on('pointerdown', () => {
      this.selectPerk(perk, data);
    });

    // Entrance animation — stagger cards
    container.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
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
