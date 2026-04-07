// src/scenes/PerkSelectScene.ts
// Full-screen perk selection after boss victory. Pick 1 of 3 random perks.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { PerkManager, PerkDef } from '@/systems/PerkManager';
import { SoundManager } from '@/systems/SoundManager';

const F = 'Arial, Helvetica, sans-serif';

interface PerkSelectData {
  score: number;
  distance: number;
  goldEarned: number;
}

const RARITY_COLORS: Record<string, { border: number; text: string; glow: number; label: string }> = {
  common:    { border: 0x3b82f6, text: '#60a5fa', glow: 0x3b82f6, label: 'COMMON' },
  rare:      { border: 0xa855f7, text: '#c084fc', glow: 0xa855f7, label: 'RARE' },
  legendary: { border: 0xfbbf24, text: '#fde68a', glow: 0xfbbf24, label: 'LEGENDARY' },
};

export class PerkSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PerkSelectScene' });
  }

  create(data: PerkSelectData): void {
    this.cameras.main.setBackgroundColor('#0a0f1a');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const choices = PerkManager.instance.getRandomChoices(3);
    const streak = PerkManager.instance.runStreak;

    // ── Header ──
    this.add.text(GAME_WIDTH / 2, 80, '\u2B06\uFE0F  LEVEL UP', {
      fontSize: '38px', color: '#fbbf24', fontFamily: F, fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4, letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, 'Choose a perk for your run', {
      fontSize: '16px', color: '#94a3b8', fontFamily: F,
    }).setOrigin(0.5);

    // Show run streak if > 0
    if (streak > 1) {
      this.add.text(GAME_WIDTH / 2, 148, `\u{1F525} ${streak} LEVEL STREAK  \u00D7${(1 + streak * 0.25).toFixed(2)} gold`, {
        fontSize: '14px', color: '#f97316', fontFamily: F, fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Show active perks count
    const existingPerks = PerkManager.instance.getAll();
    if (existingPerks.length > 0) {
      const perkIcons = existingPerks.map((p) => p.icon).join(' ');
      this.add.text(GAME_WIDTH / 2, 172, perkIcons, {
        fontSize: '20px',
      }).setOrigin(0.5);
    }

    // ── Perk cards ──
    const cardW = 200;
    const cardH = 280;
    const gap = 16;
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
      fontSize: '16px', color: '#475569', fontFamily: F, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipText.on('pointerover', () => skipText.setColor('#94a3b8'));
    skipText.on('pointerout', () => skipText.setColor('#475569'));
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
    bg.fillStyle(0x1a2840, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(2, rc.border, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    container.add(bg);

    // Rarity strip at top
    const strip = this.add.graphics();
    strip.fillStyle(rc.border, 0.3);
    strip.fillRoundedRect(-w / 2, -h / 2, w, 6, { tl: 16, tr: 16, bl: 0, br: 0 });
    container.add(strip);

    // Icon
    const icon = this.add.text(0, -h / 2 + 55, perk.icon, {
      fontSize: '48px',
    }).setOrigin(0.5);
    container.add(icon);

    // Rarity label
    container.add(this.add.text(0, -h / 2 + 95, rc.label, {
      fontSize: '10px', color: rc.text, fontFamily: F, fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5));

    // Name
    container.add(this.add.text(0, -h / 2 + 125, perk.name.toUpperCase(), {
      fontSize: '16px', color: '#ffffff', fontFamily: F, fontStyle: 'bold',
      wordWrap: { width: w - 24 }, align: 'center',
    }).setOrigin(0.5));

    // Description
    container.add(this.add.text(0, -h / 2 + 175, perk.description, {
      fontSize: '13px', color: '#94a3b8', fontFamily: F,
      wordWrap: { width: w - 28 }, align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0));

    // Hit zone
    const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    // Hover effect
    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e3050, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      bg.lineStyle(3, rc.border, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
      container.setScale(1.05);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a2840, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      bg.lineStyle(2, rc.border, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
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
