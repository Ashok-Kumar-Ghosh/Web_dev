// Enemy Stickman - Multi-Style Reactions (Sword Decapitation, Gun Ragdoll, Martial Arts Launch)
class EnemyStickman {
  constructor(x, groundY, direction = 1, speedX = 14, cadence = 0.44, promptWord = 'F') {
    this.x = x;
    this.groundY = groundY;
    this.frame = 0;
    this.speed = cadence;
    this.direction = direction;
    this.speedX = speedX;
    this.active = true;

    this.promptWord = promptWord;
    this.currentTypedIndex = 0;
    this.state = 'running'; // 'running', 'being_pushed', 'slashed', 'shot_dead', 'kicked_away', 'attacked', 'execution_swing'
    this.deathTimer = 0;
    this.hasHitPlayer = false;
    this.isBlockedByAhead = false;

    // Ragdoll & Decapitation Physics
    this.killType = 'sword_cleave';
    this.headVx = 0;
    this.headVy = 0;
    this.headX = 0;
    this.headY = 0;
    this.headRot = 0;

    this.bodyVx = 0;
    this.bodyVy = 0;
    this.bodyYOffset = 0;
    this.bodyRot = 0;
    this.knockbackVx = 0;
  }

  get currentTargetKey() {
    if (this.currentTypedIndex < this.promptWord.length) {
      return this.promptWord[this.currentTypedIndex];
    }
    return '';
  }

  triggerKnockback(vx) {
    this.state = 'being_pushed';
    this.knockbackVx = vx;
  }

  triggerDeath(killType) {
    this.killType = killType;
    this.deathTimer = 0;
    const dir = this.direction; // 1 = running left (from right), -1 = running right (from left)

    if (killType === 'sword_cleave') {
      this.state = 'slashed';
      this.headVx = dir * 5.5;
      this.headVy = -11.0;
    } else if (killType === 'gun_execution') {
      this.state = 'shot_dead';
      this.bodyVx = dir * 18;
      this.bodyVy = -7.5;
      this.headVx = dir * 8;
      this.headVy = -10;
    } else if (killType === 'hand_and_kick') {
      this.state = 'kicked_away';
      this.bodyVx = dir * 24;
      this.bodyVy = -11.5;
    }
  }

  update(worldSpeed) {
    this.frame++;

    if (this.state === 'running') {
      if (!this.isBlockedByAhead) {
        this.x -= (this.direction * this.speedX);
      } else {
        this.x -= (this.direction * (this.speedX * 0.4));
      }
    } else if (this.state === 'being_pushed') {
      this.x += this.knockbackVx;
      this.knockbackVx *= 0.82;
    } else if (this.state === 'slashed') {
      this.deathTimer++;
      this.x -= (worldSpeed * 0.65);
      this.headX += this.headVx;
      this.headY += this.headVy;
      this.headVy += 0.58;
      this.headRot += 0.22;
      if (this.deathTimer > 42) this.active = false;
    } else if (this.state === 'shot_dead') {
      this.deathTimer++;
      this.x += this.bodyVx;
      this.bodyYOffset += this.bodyVy;
      this.bodyVy += 0.65;
      this.bodyVx *= 0.94;
      this.bodyRot += this.direction * 0.14;

      if (this.bodyYOffset > 0) {
        this.bodyYOffset = 0;
        this.bodyVy = -this.bodyVy * 0.35;
      }
      if (this.deathTimer > 38) this.active = false;
    } else if (this.state === 'kicked_away') {
      this.deathTimer++;
      this.x += this.bodyVx;
      this.bodyYOffset += this.bodyVy;
      this.bodyVy += 0.55;
      this.bodyRot += this.direction * 0.26;
      if (this.deathTimer > 38) this.active = false;
    } else if (this.state === 'attacked') {
      this.x -= (this.direction * (this.speedX + 4));
    } else if (this.state === 'execution_swing') {
      this.x -= (this.direction * 1.5);
    }

    if (this.x < -300 || this.x > window.innerWidth + 300) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    const cycle = this.frame * this.speed;
    const bounce = this.state === 'running' ? Math.abs(Math.sin(cycle)) * 4 : 0;
    const dir = this.direction;

    const isDecapitated = (this.state === 'slashed');
    const isRagdoll = (this.state === 'shot_dead' || this.state === 'kicked_away');
    let collapseY = isDecapitated ? Math.min(this.deathTimer * 1.5, 30) : 0;

    const hipX = this.x;
    const hipY = this.groundY - 40 - bounce + collapseY + this.bodyYOffset;

    if (isRagdoll) {
      ctx.translate(hipX, hipY);
      ctx.rotate(this.bodyRot);
      ctx.translate(-hipX, -hipY);
      ctx.globalAlpha = Math.max(0, 1 - (this.deathTimer / 38));
    }

    const chestX = hipX - (dir * 24);
    const chestY = hipY - 14 + collapseY;

    let headX = chestX - (dir * 10);
    let headY = chestY - 8;

    if (isDecapitated) {
      headX += this.headX;
      headY += this.headY;
      ctx.globalAlpha = Math.max(0, 1 - (this.deathTimer / 42));
    }

    const getLegJoints = (phaseOffset) => {
      const phi = cycle + phaseOffset;
      const thighAngle = (isDecapitated || isRagdoll) ? 0.45 : (this.state === 'being_pushed' ? 0.7 : Math.sin(phi) * 0.8 + 0.15);
      const kneeFlex = (isDecapitated || isRagdoll) ? 1.35 : (this.state === 'being_pushed' ? 1.6 : (Math.cos(phi) + 1) * 0.85 + 0.35);
      const kneeAngle = thighAngle - kneeFlex;

      const thighLen = 22;
      const shinLen = 22;

      const kx = hipX - (dir * Math.sin(thighAngle) * thighLen);
      const ky = hipY + Math.cos(thighAngle) * thighLen;
      const fx = kx - (dir * Math.sin(kneeAngle) * shinLen);
      const fy = isRagdoll ? (ky + Math.cos(kneeAngle) * shinLen) : Math.min(this.groundY + 2, ky + Math.cos(kneeAngle) * shinLen);

      return { kx, ky, fx, fy };
    };

    const backLeg = getLegJoints(Math.PI);
    const frontLeg = getLegJoints(0);

    const armWave = Math.sin(cycle) * 2;
    let elbowX, elbowY, wristX, wristY, swordTipX, swordTipY;

    if (this.state === 'execution_swing') {
      elbowX = chestX - (dir * 10);
      elbowY = chestY - 18;
      wristX = chestX - (dir * 28);
      wristY = chestY - 6;
      swordTipX = wristX - (dir * 68);
      swordTipY = wristY + 4;
    } else if (this.state === 'being_pushed' || isRagdoll) {
      elbowX = chestX + (dir * 18);
      elbowY = chestY - 14;
      wristX = chestX + (dir * 34);
      wristY = chestY - 22;
      swordTipX = wristX + (dir * 30);
      swordTipY = wristY - 30;
    } else if (this.state === 'attacked') {
      elbowX = chestX - (dir * 18);
      elbowY = chestY - 10;
      wristX = chestX - (dir * 32);
      wristY = chestY + 8;
      swordTipX = wristX - (dir * 42);
      swordTipY = wristY + 12;
    } else {
      elbowX = chestX + (dir * 20);
      elbowY = chestY + 2 + armWave;
      wristX = chestX + (dir * 32);
      wristY = chestY - 3 + armWave;
      swordTipX = wristX + (dir * 38);
      swordTipY = wristY - 14;
    }

    // PASS 1: RED OUTLINE
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 8.5;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(backLeg.kx, backLeg.ky); ctx.lineTo(backLeg.fx, backLeg.fy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(chestX, chestY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(headX, headY, 11, 0, Math.PI * 2);
    ctx.stroke();

    if (!isDecapitated) {
      ctx.beginPath();
      ctx.moveTo(chestX + (dir * 2), chestY + 2); ctx.lineTo(elbowX, elbowY); ctx.lineTo(wristX, wristY);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(frontLeg.kx, frontLeg.ky); ctx.lineTo(frontLeg.fx, frontLeg.fy);
    ctx.stroke();

    // PASS 2: INNER BLACK SILHOUETTE
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#050104';
    ctx.fillStyle = '#050104';
    ctx.lineWidth = 4.8;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(backLeg.kx, backLeg.ky); ctx.lineTo(backLeg.fx, backLeg.fy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(chestX, chestY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(headX, headY, 9, 0, Math.PI * 2);
    ctx.fill();

    if (!isDecapitated) {
      ctx.beginPath();
      ctx.moveTo(chestX + (dir * 2), chestY + 2); ctx.lineTo(elbowX, elbowY); ctx.lineTo(wristX, wristY);
      ctx.stroke();

      // Enemy Red Katana
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff0033';
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(wristX, wristY); ctx.lineTo(swordTipX, swordTipY);
      ctx.stroke();

      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(wristX, wristY); ctx.lineTo(swordTipX, swordTipY);
      ctx.stroke();

      if (this.state === 'execution_swing') {
        ctx.strokeStyle = 'rgba(255, 0, 51, 0.7)';
        ctx.lineWidth = 14;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(wristX, wristY, 68, Math.PI * 0.8, Math.PI * 1.5, false);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(hipX, hipY); ctx.lineTo(frontLeg.kx, frontLeg.ky); ctx.lineTo(frontLeg.fx, frontLeg.fy);
    ctx.stroke();

    // PROMPT BOX
    if (this.state === 'running' && this.x > 30 && this.x < window.innerWidth - 30) {
      const len = this.promptWord.length;
      const boxW = Math.max(64, len * 30 + 24);
      const boxH = 56;
      const boxX = headX - (boxW / 2);
      const boxY = headY - 80;

      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#050104';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      const startLetterX = boxX + boxW / 2 - ((len - 1) * 24) / 2;
      ctx.font = '900 28px -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      for (let i = 0; i < len; i++) {
        const char = this.promptWord[i];
        const lx = startLetterX + i * 24;

        if (i < this.currentTypedIndex) {
          ctx.fillStyle = '#10b981';
        } else if (i === this.currentTypedIndex) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(lx - 9, boxY + boxH - 12, 18, 4);
        } else {
          ctx.fillStyle = '#050104';
        }

        ctx.fillText(char, lx, boxY + boxH / 2 + 1);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

// Complete Key & Finger Mapping
const KEY_FINGER_MAP = {
  'A': { hand: 'L', idx: 0, defaultKey: 'A' },
  'Q': { hand: 'L', idx: 0, defaultKey: 'A' },
  'Z': { hand: 'L', idx: 0, defaultKey: 'A' },

  'S': { hand: 'L', idx: 1, defaultKey: 'S' },
  'W': { hand: 'L', idx: 1, defaultKey: 'S' },
  'X': { hand: 'L', idx: 1, defaultKey: 'S' },

  'D': { hand: 'L', idx: 2, defaultKey: 'D' },
  'E': { hand: 'L', idx: 2, defaultKey: 'D' },
  'C': { hand: 'L', idx: 2, defaultKey: 'D' },

  'F': { hand: 'L', idx: 3, defaultKey: 'F' },
  'R': { hand: 'L', idx: 3, defaultKey: 'F' },
  'V': { hand: 'L', idx: 3, defaultKey: 'F' },
  'G': { hand: 'L', idx: 3, defaultKey: 'F' },
  'T': { hand: 'L', idx: 3, defaultKey: 'F' },

  ';': { hand: 'R', idx: 0, defaultKey: ';' },
  'P': { hand: 'R', idx: 0, defaultKey: ';' },
  '/': { hand: 'R', idx: 0, defaultKey: ';' },

  'L': { hand: 'R', idx: 1, defaultKey: 'L' },
  'O': { hand: 'R', idx: 1, defaultKey: 'L' },
  '.': { hand: 'R', idx: 1, defaultKey: 'L' },

  'K': { hand: 'R', idx: 2, defaultKey: 'K' },
  'I': { hand: 'R', idx: 2, defaultKey: 'K' },
  ',': { hand: 'R', idx: 2, defaultKey: 'K' },

  'J': { hand: 'R', idx: 3, defaultKey: 'J' },
  'U': { hand: 'R', idx: 3, defaultKey: 'J' },
  'M': { hand: 'R', idx: 3, defaultKey: 'J' },
  'H': { hand: 'R', idx: 3, defaultKey: 'J' },
  'Y': { hand: 'R', idx: 3, defaultKey: 'J' },

  'SPACE': { hand: 'LR', idx: 4, defaultKey: 'SPC' }
};

const STAGE_PAIRS = {
  1: ['F', 'J'],
  2: ['D', 'K'],
  3: ['S', 'L'],
  4: ['A', ';'],
  5: ['G', 'H'],
  6: ['R', 'U'],
  7: ['E', 'I'],
  8: ['W', 'O'],
  9: ['Q', 'P'],
  10: ['T', 'Y'],
  11: ['V', 'M'],
  12: ['C', ','],
  13: ['X', '.']
};

function getCumulativeKeysUpTo(n) {
  let pool = [];
  for (let i = 1; i <= n; i++) {
    pool = pool.concat(STAGE_PAIRS[i]);
  }
  return pool;
}

const STAGES = {
  '1': { name: 'STAGE 1: [ F & J ]', keys: ['F', 'J'], fingerName: 'INDEX FINGERS (HOME ROW)', isBonus: false },
  '2': { name: 'STAGE 2: [ D & K ]', keys: ['D', 'K'], fingerName: 'MIDDLE FINGERS (HOME ROW)', isBonus: false },
  'b2': { name: 'BONUS STAGE 2', keys: getCumulativeKeysUpTo(2), fingerName: 'WORD MASTERY (F, J, D, K)', isBonus: true },
  '3': { name: 'STAGE 3: [ S & L ]', keys: ['S', 'L'], fingerName: 'RING FINGERS (HOME ROW)', isBonus: false },
  'b3': { name: 'BONUS STAGE 3', keys: getCumulativeKeysUpTo(3), fingerName: 'WORD MASTERY (6 HOME KEYS)', isBonus: true },
  '4': { name: 'STAGE 4: [ A & ; ]', keys: ['A', ';'], fingerName: 'PINKY FINGERS (HOME ROW)', isBonus: false },
  'b4': { name: 'BONUS STAGE 4', keys: getCumulativeKeysUpTo(4), fingerName: 'WORD MASTERY (FULL HOME ROW)', isBonus: true },
  '5': { name: 'STAGE 5: [ G & H ]', keys: ['G', 'H'], fingerName: 'INNER INDEX (HOME ROW)', isBonus: false },
  'b5': { name: 'BONUS STAGE 5', keys: getCumulativeKeysUpTo(5), fingerName: 'WORD MASTERY (HOME + G, H)', isBonus: true },
  '6': { name: 'STAGE 6: [ R & U ]', keys: ['R', 'U'], fingerName: 'INDEX FINGERS (TOP ROW)', isBonus: false },
  'b6': { name: 'BONUS STAGE 6', keys: getCumulativeKeysUpTo(6), fingerName: 'WORD MASTERY (HOME + R, U)', isBonus: true },
  '7': { name: 'STAGE 7: [ E & I ]', keys: ['E', 'I'], fingerName: 'MIDDLE FINGERS (TOP ROW)', isBonus: false },
  'b7': { name: 'BONUS STAGE 7', keys: getCumulativeKeysUpTo(7), fingerName: 'WORD MASTERY (HOME + E, I, R, U)', isBonus: true },
  '8': { name: 'STAGE 8: [ W & O ]', keys: ['W', 'O'], fingerName: 'RING FINGERS (TOP ROW)', isBonus: false },
  'b8': { name: 'BONUS STAGE 8', keys: getCumulativeKeysUpTo(8), fingerName: 'WORD MASTERY (16 UNLOCKED KEYS)', isBonus: true },
  '9': { name: 'STAGE 9: [ Q & P ]', keys: ['Q', 'P'], fingerName: 'PINKY FINGERS (TOP ROW)', isBonus: false },
  'b9': { name: 'BONUS STAGE 9', keys: getCumulativeKeysUpTo(9), fingerName: 'WORD MASTERY (18 UNLOCKED KEYS)', isBonus: true },
  '10': { name: 'STAGE 10: [ T & Y ]', keys: ['T', 'Y'], fingerName: 'CENTER INDEX (TOP ROW)', isBonus: false },
  'b10': { name: 'BONUS STAGE 10', keys: getCumulativeKeysUpTo(10), fingerName: 'WORD MASTERY (FULL TOP + HOME)', isBonus: true },
  '11': { name: 'STAGE 11: [ V & M ]', keys: ['V', 'M'], fingerName: 'INDEX FINGERS (BOTTOM ROW)', isBonus: false },
  'b11': { name: 'BONUS STAGE 11', keys: getCumulativeKeysUpTo(11), fingerName: 'WORD MASTERY (22 UNLOCKED KEYS)', isBonus: true },
  '12': { name: 'STAGE 12: [ C & , ]', keys: ['C', ','], fingerName: 'MIDDLE FINGERS (BOTTOM ROW)', isBonus: false },
  'b12': { name: 'BONUS STAGE 12', keys: getCumulativeKeysUpTo(12), fingerName: 'WORD MASTERY (24 UNLOCKED KEYS)', isBonus: true },
  '13': { name: 'STAGE 13: [ X & . ]', keys: ['X', '.'], fingerName: 'RING FINGERS (BOTTOM ROW)', isBonus: false },
  'b13': { name: 'BONUS STAGE 13', keys: getCumulativeKeysUpTo(13), fingerName: 'GRAND MASTER: ALL 26 KEYS', isBonus: true }
};

// Player Stickman Runner with Distance-Aware Combat + Space Jump & Double-Space Dash
class NinjaRun {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.x = window.innerWidth * 0.35;
    this.y = window.innerHeight * 0.665;
    this.frame = 0;
    this.speed = 0.44;

    this.lives = 3;
    this.isGameOver = false;
    this.isGameWon = false;
    this.isGameStarted = false;
    this.currentLevel = '1';

    this.subLevel = 1;
    this.killsInCurrentSubLevel = 0;
    this.targetKillsPerSubLevel = 5;
    this.totalStageKills = 0;
    this.maxSubLevels = 3;
    this.totalStageTarget = 15;

    this.gameOverTimer = 0;
    this.enemies = [];
    this.vfxParticles = [];

    // Post-Kill Effects: Shockwave Rings, Bullet Tracers, Floating Callouts
    this.shockwaves = [];
    this.killTexts = [];
    this.bulletTracers = [];
    this.killFlashColor = '#00ffff';
    this.killFlashAlpha = 0;

    // Sword Trail Mesh History
    this.swordTrail = [];

    // Combat State Machine: 'run', 'sword_cleave', 'gun_execution', 'hand_and_kick', 'hit', 'beheaded'
    this.actionState = 'run';
    this.actionTimer = 0;
    this.actionTargetEnemy = null;
    this.slashDirection = 1;
    this.attackDashDistance = 85;
    this.shake = 0;
    this.gunRecoil = 0;

    // JUMP & DOUBLE-SPACE AIR DASH PHYSICS
    this.jumpY = 0;
    this.jumpVy = 0;
    this.isJumping = false;
    this.canAirDash = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashOffsetX = 0;
    this.dashDirection = 1;
    this.dashAfterimages = [];
    this.lastSpaceTime = 0;

    // Behead Ragdoll Physics
    this.pHeadX = 0;
    this.pHeadY = 0;
    this.pHeadVx = 0;
    this.pHeadVy = 0;
    this.pHeadRot = 0;
    this.flashRedAlpha = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => this.handleKeyPress(e));

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  startLevel(level) {
    this.currentLevel = String(level);
    this.lives = 3;
    this.isGameOver = false;
    this.isGameWon = false;
    this.isGameStarted = true;

    const currentStage = STAGES[this.currentLevel] || STAGES['1'];

    this.maxSubLevels = currentStage.isBonus ? 4 : 3;
    this.targetKillsPerSubLevel = 5;
    this.totalStageTarget = this.maxSubLevels * this.targetKillsPerSubLevel;

    this.subLevel = 1;
    this.killsInCurrentSubLevel = 0;
    this.totalStageKills = 0;

    this.gameOverTimer = 0;
    this.enemies = [];
    this.vfxParticles = [];
    this.shockwaves = [];
    this.killTexts = [];
    this.bulletTracers = [];
    this.swordTrail = [];
    this.actionState = 'run';
    this.actionTimer = 0;
    this.actionTargetEnemy = null;

    this.jumpY = 0;
    this.jumpVy = 0;
    this.isJumping = false;
    this.canAirDash = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashOffsetX = 0;
    this.dashAfterimages = [];

    this.pHeadX = 0;
    this.pHeadY = 0;
    this.flashRedAlpha = 0;
    this.killFlashAlpha = 0;
    if (window.resetWorldTimer) window.resetWorldTimer();
  }

  goToHome() {
    this.lives = 3;
    this.isGameOver = false;
    this.isGameWon = false;
    this.isGameStarted = false;
    this.gameOverTimer = 0;
    this.enemies = [];
    this.vfxParticles = [];
    this.shockwaves = [];
    this.killTexts = [];
    this.bulletTracers = [];
    this.swordTrail = [];
    this.actionState = 'run';
    this.actionTimer = 0;
    this.actionTargetEnemy = null;

    this.jumpY = 0;
    this.jumpVy = 0;
    this.isJumping = false;
    this.canAirDash = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashOffsetX = 0;
    this.dashAfterimages = [];

    this.pHeadX = 0;
    this.pHeadY = 0;
    this.flashRedAlpha = 0;
    this.killFlashAlpha = 0;
    if (window.returnToHome) window.returnToHome();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Trigger Single-Space Jump & Double-Space Air Dash
  triggerJumpOrDash() {
    if (this.actionState === 'beheaded') return;

    const now = performance.now();
    const isQuickDoubleTap = (now - this.lastSpaceTime) < 350;
    this.lastSpaceTime = now;

    // 1. Single Space on Ground -> Jump
    if (!this.isJumping && !this.isDashing) {
      this.isJumping = true;
      this.jumpVy = -15.5;
      this.canAirDash = true;

      // Jump Takeoff Dust Particles
      for (let i = 0; i < 14; i++) {
        this.vfxParticles.push({
          x: this.x + (Math.random() - 0.5) * 24,
          y: this.y,
          vx: (Math.random() - 0.5) * 9,
          vy: -Math.random() * 4.5,
          life: 0.65,
          color: '#00ffff',
          size: 2.2 + Math.random() * 2
        });
      }
    }
    // 2. Second Space in Air (or quick double-tap) -> Cyber Dash!
    else if ((this.isJumping && this.canAirDash) || (isQuickDoubleTap && !this.isDashing)) {
      this.canAirDash = false;
      this.isDashing = true;
      this.dashTimer = 14; // Frames of high-speed dash
      this.jumpVy = 0; // Hold altitude during dash
      this.dashDirection = 1; // Forward dash
      this.shake = 14;
      this.killFlashColor = 'rgba(0, 240, 255, 1)';
      this.killFlashAlpha = 0.14;

      // Sonic Boom Ring at Dash Start
      this.shockwaves.push({
        x: this.x + this.dashOffsetX,
        y: this.y + this.jumpY - 40,
        radius: 8,
        maxRadius: 95,
        color: '#00ffff',
        alpha: 0.95,
        lineWidth: 5
      });

      // Dash Burst Sparks
      for (let i = 0; i < 26; i++) {
        this.vfxParticles.push({
          x: this.x + this.dashOffsetX,
          y: this.y + this.jumpY - 35,
          vx: -this.dashDirection * (6 + Math.random() * 14),
          vy: (Math.random() - 0.5) * 9,
          life: 0.75,
          color: Math.random() < 0.6 ? '#00ffff' : '#ffffff',
          size: 2.5 + Math.random() * 2.5
        });
      }
    }
  }

  generateWordForSubLevel(pool, wordLength) {
    let word = '';
    for (let i = 0; i < wordLength; i++) {
      word += pool[Math.floor(Math.random() * pool.length)];
    }
    return word;
  }

  spawnOneEnemy() {
    if (!this.isGameStarted || this.isGameOver || this.isGameWon) return;

    const currentStage = STAGES[this.currentLevel] || STAGES['1'];
    const availableKeys = currentStage.keys;

    let chosenPrompt = '';
    let baseSpeed = 9.5;
    let baseCadence = 0.40;
    let spawnDistanceOffset = 140;

    if (currentStage.isBonus) {
      const wordLen = this.subLevel;
      chosenPrompt = this.generateWordForSubLevel(availableKeys, wordLen);

      if (wordLen === 1) {
        baseSpeed = 8.8;
        baseCadence = 0.38;
        spawnDistanceOffset = 140;
      } else if (wordLen === 2) {
        baseSpeed = 7.0;
        baseCadence = 0.32;
        spawnDistanceOffset = 180;
      } else if (wordLen === 3) {
        baseSpeed = 6.0;
        baseCadence = 0.28;
        spawnDistanceOffset = 210;
      } else if (wordLen === 4) {
        baseSpeed = 5.2;
        baseCadence = 0.25;
        spawnDistanceOffset = 250;
      }
    } else {
      chosenPrompt = availableKeys[Math.floor(Math.random() * availableKeys.length)];

      if (this.subLevel === 1) {
        baseSpeed = 9.0;
        baseCadence = 0.38;
      } else if (this.subLevel === 2) {
        baseSpeed = 13.5;
        baseCadence = 0.48;
      } else if (this.subLevel === 3) {
        baseSpeed = 18.0;
        baseCadence = 0.58;
      }
    }

    const fromRight = Math.random() < 0.5;
    const direction = fromRight ? 1 : -1;
    const spawnX = fromRight ? (this.canvas.width + spawnDistanceOffset) : -spawnDistanceOffset;
    const enemySpeed = baseSpeed + Math.random() * 0.8;

    this.enemies.push(new EnemyStickman(
      spawnX,
      this.y,
      direction,
      enemySpeed,
      baseCadence,
      chosenPrompt
    ));
  }

  recordKill() {
    this.killsInCurrentSubLevel++;
    this.totalStageKills++;

    if (this.killsInCurrentSubLevel >= this.targetKillsPerSubLevel) {
      if (this.subLevel < this.maxSubLevels) {
        this.subLevel++;
        this.killsInCurrentSubLevel = 0;
      } else {
        this.isGameWon = true;
        this.gameOverTimer = 0;

        const clearedStages = JSON.parse(localStorage.getItem('shinobi_stars') || '{}');
        clearedStages[this.currentLevel] = 3;
        localStorage.setItem('shinobi_stars', JSON.stringify(clearedStages));
      }
    }
  }

  // Trigger Post-Kill Cinematic Impact Effects
  triggerKillCelebration(x, y, style) {
    let ringColor = '#00ffff';
    let label = 'SLICED!';

    if (style === 'gun_execution') {
      ringColor = '#ffcc00';
      const labels = ['HEADSHOT!', 'BULLSEYE!', 'GUNSLINGER!'];
      label = labels[Math.floor(Math.random() * labels.length)];
      this.killFlashColor = 'rgba(255, 210, 60, 1)';
    } else if (style === 'sword_cleave') {
      ringColor = '#00ffff';
      const labels = ['SLICED!', 'BLADE MASTER!', 'SEVERED!'];
      label = labels[Math.floor(Math.random() * labels.length)];
      this.killFlashColor = 'rgba(0, 240, 255, 1)';
    } else if (style === 'hand_and_kick') {
      ringColor = '#ff5500';
      const labels = ['KNOCKOUT!', 'DRAGON KICK!', 'CRUSHED!'];
      label = labels[Math.floor(Math.random() * labels.length)];
      this.killFlashColor = 'rgba(255, 95, 30, 1)';
    }

    this.killFlashAlpha = 0.22;

    // Primary Expanding Shockwave Ring
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: 155,
      color: ringColor,
      alpha: 1.0,
      lineWidth: 7
    });

    // Secondary Inner Ring
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: 95,
      color: '#ffffff',
      alpha: 0.9,
      lineWidth: 3
    });

    // Floating Finisher Text Callout
    this.killTexts.push({
      x: x,
      y: y - 45,
      text: label,
      subText: `+1 KILL`,
      color: ringColor,
      alpha: 1.0,
      vy: -2.4,
      scale: 1.35
    });
  }

  handleKeyPress(e) {
    if (this.isGameOver || this.isGameWon) {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Escape' || e.code === 'Space') {
        this.goToHome();
      }
      return;
    }

    if (!this.isGameStarted) return;

    // SPACE = Jump (Single) & Dash (Double)
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        this.triggerJumpOrDash();
      }
      return;
    }

    let pressed = e.key;
    if (pressed.length === 1) pressed = pressed.toUpperCase();

    const runningEnemies = this.enemies.filter(en => en.active && en.state === 'running');
    if (runningEnemies.length === 0) return;

    runningEnemies.sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x));
    const targetEnemy = runningEnemies[0];

    const dist = Math.abs(targetEnemy.x - this.x);
    if (dist < 580 && targetEnemy.currentTargetKey === pressed) {
      targetEnemy.currentTypedIndex++;

      // When word finishes: Choose Finisher based on Enemy Distance!
      if (targetEnemy.currentTypedIndex >= targetEnemy.promptWord.length) {
        let chosenCombo = 'gun_execution';

        // Close Range (<= 240px): Hand & Kick Combo or Sword Cleave
        if (dist <= 240) {
          chosenCombo = Math.random() < 0.65 ? 'hand_and_kick' : 'sword_cleave';
        }
        // Mid Range (240px - 340px): Jumping Sword Cleave or Gun Execution
        else if (dist <= 340) {
          chosenCombo = Math.random() < 0.55 ? 'sword_cleave' : 'gun_execution';
        }
        // Long Range (> 340px): Always Gun Execution
        else {
          chosenCombo = 'gun_execution';
        }

        this.actionState = chosenCombo;
        this.actionTimer = 0;
        this.actionTargetEnemy = targetEnemy;
        this.slashDirection = targetEnemy.x > this.x ? 1 : -1;
        this.attackDashDistance = Math.max(35, dist - 42);
        this.swordTrail = [];

        if (chosenCombo === 'gun_execution') {
          this.shake = 20;
          this.gunRecoil = 12;
          const gunMuzzleX = this.x + this.dashOffsetX + 24 + (this.slashDirection * 52);
          const gunMuzzleY = this.y + this.jumpY - 54;
          const hitX = targetEnemy.x;
          const hitY = targetEnemy.groundY - 48;

          this.spawnGunshotVFX(gunMuzzleX, gunMuzzleY, hitX, hitY);
          targetEnemy.triggerDeath('gun_execution');
          this.triggerKillCelebration(hitX, hitY, 'gun_execution');
          this.recordKill();

        } else if (chosenCombo === 'sword_cleave') {
          this.shake = 24;
          targetEnemy.triggerDeath('sword_cleave');
          this.spawnSlashVFX(targetEnemy.x, targetEnemy.groundY - 38);
          this.triggerKillCelebration(targetEnemy.x, targetEnemy.groundY - 45, 'sword_cleave');
          this.recordKill();

        } else if (chosenCombo === 'hand_and_kick') {
          this.shake = 12;
          targetEnemy.triggerKnockback(this.slashDirection * 4);
          this.spawnMartialHitVFX(targetEnemy.x, targetEnemy.groundY - 48, '#ffaa5e');
        }
      } else {
        this.spawnMiniHitVFX(targetEnemy.x, targetEnemy.groundY - 50, '#00ffff');
      }
    }
  }

  spawnGunshotVFX(muzzleX, muzzleY, targetX, targetY) {
    this.bulletTracers.push({
      x1: muzzleX,
      y1: muzzleY,
      x2: targetX,
      y2: targetY,
      alpha: 1.0
    });

    for (let i = 0; i < 18; i++) {
      this.vfxParticles.push({
        x: muzzleX,
        y: muzzleY,
        vx: this.slashDirection * (5 + Math.random() * 14),
        vy: (Math.random() - 0.5) * 10,
        life: 0.55,
        color: Math.random() < 0.6 ? '#ffcc00' : '#ffffff',
        size: 2.5 + Math.random() * 2.5
      });
    }

    this.vfxParticles.push({
      x: muzzleX - this.slashDirection * 10,
      y: muzzleY - 4,
      vx: -this.slashDirection * (3 + Math.random() * 4),
      vy: -(6 + Math.random() * 3),
      life: 1.0,
      color: '#ffd700',
      size: 3.2
    });

    for (let i = 0; i < 36; i++) {
      this.vfxParticles.push({
        x: targetX,
        y: targetY,
        vx: this.slashDirection * (4 + Math.random() * 16) + (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.65) * 15,
        life: 0.95,
        color: Math.random() < 0.5 ? '#ff0033' : '#ffcc00',
        size: 2.8 + Math.random() * 3.2
      });
    }
  }

  spawnMartialHitVFX(x, y, color = '#ff8800') {
    for (let i = 0; i < 24; i++) {
      this.vfxParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16,
        life: 0.75,
        color: Math.random() < 0.6 ? color : '#ffffff',
        size: 2.6 + Math.random() * 2.8
      });
    }
  }

  spawnMiniHitVFX(x, y, color = '#00ffff') {
    for (let i = 0; i < 9; i++) {
      this.vfxParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.6,
        color: color,
        size: 2.2
      });
    }
  }

  spawnSlashVFX(x, y) {
    const count = 42;
    for (let i = 0; i < count; i++) {
      this.vfxParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 19,
        vy: (Math.random() - 0.6) * 17,
        life: 1.0,
        color: Math.random() < 0.65 ? '#00ffff' : '#ff0033',
        size: 2.8 + Math.random() * 3.5
      });
    }
  }

  spawnDecapitationBlood(x, y) {
    for (let i = 0; i < 65; i++) {
      this.vfxParticles.push({
        x: x,
        y: y,
        vx: -(3 + Math.random() * 14),
        vy: -(6 + Math.random() * 12),
        life: 1.3,
        color: Math.random() < 0.75 ? '#ff0033' : '#ff7700',
        size: 2.5 + Math.random() * 3.5
      });
    }
  }

  drawHUD(ctx) {
    ctx.save();
    const startX = 36;
    const startY = 36;

    if (this.isGameStarted) {
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillStyle = '#ffaa5e';
      ctx.fillText('SHINOBI VITALITY', startX, startY - 8);

      for (let i = 0; i < 3; i++) {
        const hx = startX + i * 28;
        const hy = startY + 12;
        const isAlive = i < this.lives;

        ctx.beginPath();
        ctx.arc(hx, hy, 8, 0, Math.PI * 2);

        if (isAlive) {
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12;
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(hx - 2, hy - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 0, 50, 0.2)';
          ctx.strokeStyle = '#ff0033';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
          ctx.fill();
          ctx.stroke();
        }
      }

      const currentStage = STAGES[this.currentLevel] || STAGES['1'];
      const isBonus = currentStage.isBonus;
      const centerX = this.canvas.width / 2;

      ctx.textAlign = 'center';
      ctx.shadowBlur = 12;
      ctx.shadowColor = isBonus ? '#ffaa5e' : '#00ffff';
      ctx.fillStyle = isBonus ? '#ffaa5e' : '#00ffff';
      ctx.font = '900 15px -apple-system, sans-serif';

      let subLabel = '';
      if (isBonus) {
        const bonusLevelNames = {
          1: 'LEVEL 1: 1-KEY DRILL',
          2: 'LEVEL 2: 2-KEY WORDS',
          3: 'LEVEL 3: 3-KEY WORDS',
          4: 'LEVEL 4: 4-KEY MASTER WORDS'
        };
        subLabel = bonusLevelNames[this.subLevel];
      } else {
        const normalLevelNames = {
          1: 'LEVEL 1: SLOW PACE',
          2: 'LEVEL 2: COMBAT DRILL',
          3: 'LEVEL 3: MULTI-OPPONENT RUSH'
        };
        subLabel = normalLevelNames[this.subLevel];
      }

      ctx.fillText(`${currentStage.name} • ${subLabel}`, centerX, 30);

      const barW = 320;
      const barH = 10;
      const barX = centerX - barW / 2;
      const barY = 42;
      const progressRatio = Math.min(1, this.totalStageKills / this.totalStageTarget);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = isBonus ? 'rgba(255, 170, 94, 0.4)' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 5);
      ctx.fill();
      ctx.stroke();

      if (progressRatio > 0) {
        ctx.shadowColor = isBonus ? '#ffaa5e' : '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = isBonus ? '#ffaa5e' : '#00f0ff';
        ctx.beginPath();
        ctx.roundRect(barX + 1.5, barY + 1.5, Math.max(8, (barW - 3) * progressRatio), barH - 3, 4);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffaa5e';
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillText(`STAGE PROGRESS: ${this.totalStageKills} / ${this.totalStageTarget} KILLS  •  [SPACE] JUMP / [2x SPACE] DASH`, centerX, barY + 22);
    }

    ctx.restore();
  }

  drawDetailedHand(ctx, cx, cy, isRight, activeTargetKey, currentStage) {
    ctx.save();
    ctx.translate(cx, cy);

    if (isRight) {
      ctx.scale(-1, 1);
    }

    let stageTargetIdx = -1;
    let stageKeyLabel = '';

    if (currentStage.isBonus) {
      if (activeTargetKey) {
        const keyMeta = KEY_FINGER_MAP[activeTargetKey];
        if (keyMeta && (keyMeta.hand === (isRight ? 'R' : 'L') || keyMeta.hand === 'LR')) {
          stageTargetIdx = keyMeta.idx;
          stageKeyLabel = activeTargetKey;
        }
      }
    } else {
      const currentLKey = currentStage.keys[0];
      const currentRKey = currentStage.keys[1];
      const lTarget = KEY_FINGER_MAP[currentLKey] || { idx: 3 };
      const rTarget = KEY_FINGER_MAP[currentRKey] || { idx: 3 };

      stageTargetIdx = isRight ? rTarget.idx : lTarget.idx;
      stageKeyLabel = isRight ? currentRKey : currentLKey;
    }

    const fingers = [
      { idx: 0, x: -44, y: -28, w: 14, h: 42, defaultLabel: isRight ? ';' : 'A' },
      { idx: 1, x: -25, y: -42, w: 15, h: 56, defaultLabel: isRight ? 'L' : 'S' },
      { idx: 2, x: -5,  y: -52, w: 16, h: 66, defaultLabel: isRight ? 'K' : 'D' },
      { idx: 3, x: 16,  y: -44, w: 16, h: 58, defaultLabel: isRight ? 'J' : 'F' },
      { idx: 4, x: 39,  y: -6,  w: 16, h: 36, defaultLabel: 'SPC' }
    ];

    ctx.fillStyle = '#0d040a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-48, 6, 92, 48, [12, 12, 20, 20]);
    ctx.fill();
    ctx.stroke();

    fingers.forEach((f) => {
      const isThumbJumpActive = (f.idx === 4 && (this.isJumping || this.isDashing));
      const isStageFinger = (f.idx === stageTargetIdx) || isThumbJumpActive;
      const isCurrentActiveStrike = (isStageFinger && (activeTargetKey === stageKeyLabel || currentStage.isBonus)) || isThumbJumpActive;
      const displayLabel = (f.idx === stageTargetIdx && stageKeyLabel) ? stageKeyLabel : f.defaultLabel;

      ctx.save();
      if (isCurrentActiveStrike) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#00f0ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#050104';
        ctx.font = '900 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isRight) {
          ctx.save();
          ctx.translate(f.x + f.w / 2, f.y + 14);
          ctx.scale(-1, 1);
          ctx.fillText(displayLabel, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(displayLabel, f.x + f.w / 2, f.y + 14);
        }
      } else if (isStageFinger && !currentStage.isBonus) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ffff';
        ctx.font = '800 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isRight) {
          ctx.save();
          ctx.translate(f.x + f.w / 2, f.y + 14);
          ctx.scale(-1, 1);
          ctx.fillText(displayLabel, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(displayLabel, f.x + f.w / 2, f.y + 14);
        }
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(f.x, f.y, f.w, f.h, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '700 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isRight) {
          ctx.save();
          ctx.translate(f.x + f.w / 2, f.y + 14);
          ctx.scale(-1, 1);
          ctx.fillText(displayLabel, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(displayLabel, f.x + f.w / 2, f.y + 14);
        }
      }
      ctx.restore();
    });

    ctx.restore();
  }

  drawFingerGuide(ctx) {
    if (!this.isGameStarted || this.isGameOver || this.isGameWon) return;

    ctx.save();
    const centerX = this.canvas.width / 2;
    const bottomY = this.canvas.height - 70;

    let activeTargetKey = null;
    const runningEnemies = this.enemies.filter(e => e.active && e.state === 'running');
    if (runningEnemies.length > 0) {
      runningEnemies.sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x));
      activeTargetKey = runningEnemies[0].currentTargetKey.toUpperCase();
    }

    const currentStage = STAGES[this.currentLevel] || STAGES['1'];

    const hudW = 460;
    const hudH = 122;
    ctx.fillStyle = 'rgba(6, 2, 7, 0.88)';
    ctx.strokeStyle = currentStage.isBonus ? 'rgba(255, 170, 94, 0.4)' : 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.shadowColor = currentStage.isBonus ? 'rgba(255, 170, 94, 0.22)' : 'rgba(0, 240, 255, 0.15)';
    ctx.shadowBlur = 24;

    ctx.beginPath();
    ctx.roundRect(centerX - hudW / 2, bottomY - 60, hudW, hudH, 20);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawDetailedHand(ctx, centerX - 115, bottomY + 4, false, activeTargetKey, currentStage);
    this.drawDetailedHand(ctx, centerX + 115, bottomY + 4, true, activeTargetKey, currentStage);

    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillStyle = '#ffaa5e';
    ctx.textAlign = 'center';
    ctx.fillText('LEFT HAND', centerX - 115, bottomY - 42);
    ctx.fillText('RIGHT HAND', centerX + 115, bottomY - 42);

    ctx.fillStyle = currentStage.isBonus ? '#ffaa5e' : '#00ffff';
    ctx.font = '900 11px -apple-system, sans-serif';
    if (currentStage.isBonus) {
      ctx.fillText(`BONUS WORD DRILL: TYPE NEXT KEY [ ${activeTargetKey || '-'} ]`, centerX, bottomY - 42);
    } else {
      ctx.fillText(`PAIR: ${currentStage.keys[0]} & ${currentStage.keys[1]}`, centerX, bottomY - 42);
    }

    ctx.restore();
  }

  drawGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 1, 4, 0.86)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 44px -apple-system, sans-serif';
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 28;
    ctx.fillText('EXECUTION: BEHEADED', this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillText('RETURNING TO BASE...', this.canvas.width / 2, this.canvas.height / 2 + 30);
    ctx.restore();
  }

  drawGameWon(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 16, 0.88)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '40px -apple-system, sans-serif';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 24;
    ctx.fillText('⭐⭐⭐', this.canvas.width / 2, this.canvas.height / 2 - 50);

    ctx.font = '900 42px -apple-system, sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('STAGE COMPLETED!', this.canvas.width / 2, this.canvas.height / 2 + 4);

    ctx.font = '700 15px -apple-system, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillText('3 STARS MASTERED • RETURNING TO BASE...', this.canvas.width / 2, this.canvas.height / 2 + 50);
    ctx.restore();
  }

  drawSwordSlashMesh(ctx) {
    if (this.swordTrail.length < 3) return;

    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 28;

    ctx.beginPath();
    ctx.moveTo(this.swordTrail[0].wx, this.swordTrail[0].wy);
    for (let i = 1; i < this.swordTrail.length; i++) {
      ctx.lineTo(this.swordTrail[i].wx, this.swordTrail[i].wy);
    }
    for (let i = this.swordTrail.length - 1; i >= 0; i--) {
      ctx.lineTo(this.swordTrail[i].tx, this.swordTrail[i].ty);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(
      this.swordTrail[0].wx, this.swordTrail[0].wy,
      this.swordTrail[this.swordTrail.length - 1].tx, this.swordTrail[this.swordTrail.length - 1].ty
    );
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.0)');
    grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.55)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.98)');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.swordTrail[0].tx, this.swordTrail[0].ty);
    for (let i = 1; i < this.swordTrail.length; i++) {
      ctx.lineTo(this.swordTrail[i].tx, this.swordTrail[i].ty);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Draw Heavy Cyber-Pistol & Muzzle Flash
  drawCyberPistol(ctx, wristX, wristY, dir, showFlash) {
    ctx.save();
    ctx.translate(wristX, wristY);
    if (dir < 0) ctx.scale(-1, 1);

    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(-2, 0, 7, 13, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-2, -6, 24, 8, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(4, -4, 12, 3);

    if (showFlash) {
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 28;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.lineTo(48, -12);
      ctx.lineTo(38, -2);
      ctx.lineTo(54, -2);
      ctx.lineTo(38, 4);
      ctx.lineTo(46, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(25, -2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle Post-Kill Screen Flash
    if (this.killFlashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.killFlashAlpha;
      ctx.fillStyle = this.killFlashColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.killFlashAlpha -= 0.025;
      ctx.restore();
    }

    // Damage Red Flash
    if (this.flashRedAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 0, 50, ${this.flashRedAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashRedAlpha -= 0.045;
      ctx.restore();
    }

    this.drawHUD(ctx);
    this.drawFingerGuide(ctx);

    if (this.isGameOver) {
      this.drawGameOver(ctx);
      this.gameOverTimer++;
      if (this.gameOverTimer > 85) {
        this.goToHome();
      }
      return;
    }

    if (this.isGameWon) {
      this.drawGameWon(ctx);
      this.gameOverTimer++;
      if (this.gameOverTimer > 110) {
        this.goToHome();
      }
      return;
    }

    ctx.save();
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(sx, sy);
      this.shake *= 0.85;
    }

    // ==========================================
    // JUMP & DOUBLE-SPACE AIR DASH PHYSICS UPDATE
    // ==========================================
    if (this.isDashing) {
      this.dashTimer--;
      this.dashOffsetX += this.dashDirection * 13;

      // Spawn Cyan Speed Lines during Dash
      this.vfxParticles.push({
        x: this.x + this.dashOffsetX + (Math.random() - 0.5) * 18,
        y: this.y + this.jumpY - 35 + (Math.random() - 0.5) * 28,
        vx: -this.dashDirection * (8 + Math.random() * 8),
        vy: (Math.random() - 0.5) * 2,
        life: 0.45,
        color: '#00ffff',
        size: 2.4
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Smoothly return horizontal dash offset back to normal running position
      this.dashOffsetX *= 0.88;
      if (Math.abs(this.dashOffsetX) < 0.5) this.dashOffsetX = 0;

      if (this.isJumping) {
        this.jumpY += this.jumpVy;
        this.jumpVy += 0.78; // Gravity

        if (this.jumpY >= 0) {
          this.jumpY = 0;
          this.jumpVy = 0;
          this.isJumping = false;
          this.canAirDash = false;
        }
      }
    }

    const effectivePlayerX = this.x + this.dashOffsetX;
    const isAirborneSafe = (this.jumpY < -55) || this.isDashing;

    // Combat Queue & Check Lethal 3rd Hit (Dodges if high in air or dashing!)
    const activeRunningEnemies = this.enemies.filter(e => e.active && (e.state === 'running' || e.state === 'execution_swing' || e.state === 'being_pushed'));
    activeRunningEnemies.sort((a, b) => Math.abs(a.x - effectivePlayerX) - Math.abs(b.x - effectivePlayerX));

    for (let i = 0; i < activeRunningEnemies.length; i++) {
      const enemy = activeRunningEnemies[i];

      if (i > 0) {
        const leadEnemy = activeRunningEnemies[0];
        const distToLead = Math.abs(enemy.x - leadEnemy.x);
        enemy.isBlockedByAhead = (distToLead < 150);
      } else {
        enemy.isBlockedByAhead = false;
      }

      const dist = Math.abs(enemy.x - effectivePlayerX);
      if (dist < 44 && !isAirborneSafe && !enemy.hasHitPlayer && i === 0 && enemy.state === 'running') {
        enemy.hasHitPlayer = true;
        this.lives--;

        if (this.lives <= 0) {
          this.lives = 0;
          this.actionState = 'beheaded';
          this.actionTimer = 0;
          this.shake = 35;
          this.flashRedAlpha = 0.6;
          enemy.state = 'execution_swing';

          this.pHeadVx = -7;
          this.pHeadVy = -12;
          this.pHeadRot = 0;
          this.spawnDecapitationBlood(effectivePlayerX + 24, this.y - 45);
        } else {
          enemy.state = 'attacked';
          this.actionState = 'hit';
          this.actionTimer = 0;
          this.shake = 24;
          this.spawnSlashVFX(effectivePlayerX, this.y - 30);
        }
      }
    }

    // Player State Timers & Multi-Phase Transitions
    if (this.actionState === 'beheaded') {
      this.actionTimer++;
      this.pHeadX += this.pHeadVx;
      this.pHeadY += this.pHeadVy;
      this.pHeadVy += 0.58;
      this.pHeadRot += 0.2;

      if (this.y - 40 - 8 + this.pHeadY > this.y - 8) {
        this.pHeadY = this.y - (this.y - 40 - 8) - 8;
        this.pHeadVy = -this.pHeadVy * 0.45;
        this.pHeadVx *= 0.8;
      }

      if (this.actionTimer > 55) {
        this.isGameOver = true;
        this.gameOverTimer = 0;
      }
    } else if (this.actionState === 'gun_execution') {
      this.actionTimer++;
      this.gunRecoil *= 0.8;
      if (this.actionTimer === 6 && this.actionTargetEnemy) {
        this.gunRecoil = 10;
        const gunMuzzleX = effectivePlayerX + 24 + (this.slashDirection * 52);
        const gunMuzzleY = this.y + this.jumpY - 54;
        this.spawnGunshotVFX(gunMuzzleX, gunMuzzleY, this.actionTargetEnemy.x, this.actionTargetEnemy.groundY - 52);
      }
      if (this.actionTimer > 20) {
        this.actionState = 'run';
        this.swordTrail = [];
      }
    } else if (this.actionState === 'hand_and_kick') {
      this.actionTimer++;
      if (this.actionTimer === 3 || this.actionTimer === 6) {
        this.shake = 10;
        if (this.actionTargetEnemy) {
          this.spawnMartialHitVFX(this.actionTargetEnemy.x, this.actionTargetEnemy.groundY - 48, '#00ffff');
        }
      }
      if (this.actionTimer === 10) {
        this.shake = 26;
        if (this.actionTargetEnemy && this.actionTargetEnemy.active) {
          const hitX = this.actionTargetEnemy.x;
          const hitY = this.actionTargetEnemy.groundY - 45;
          this.actionTargetEnemy.triggerDeath('hand_and_kick');
          this.spawnMartialHitVFX(hitX, hitY, '#ff5500');
          this.triggerKillCelebration(hitX, hitY, 'hand_and_kick');
        }
        this.recordKill();
      }
      if (this.actionTimer > 24) {
        this.actionState = 'run';
        this.swordTrail = [];
      }
    } else if (this.actionState !== 'run') {
      this.actionTimer++;
      if (this.actionTimer > 20) {
        this.actionState = 'run';
        this.swordTrail = [];
      }
    }

    // ==========================================
    // RIGGING COMBO ANIMATIONS (EXACT CONTACT TRACKING)
    // ==========================================
    const cycle = this.frame * this.speed;
    const bounce = (this.isJumping || this.isDashing) ? 0 : Math.abs(Math.sin(cycle)) * 4;

    let forwardDashOffset = this.dashOffsetX;
    let verticalJumpOffset = this.jumpY;

    if (this.actionState === 'sword_cleave') {
      const p = this.actionTimer / 20;
      verticalJumpOffset += -Math.sin(p * Math.PI) * 56;
      forwardDashOffset += Math.sin(p * Math.PI) * Math.min(220, this.attackDashDistance) * this.slashDirection;
    } else if (this.actionState === 'gun_execution') {
      forwardDashOffset += -Math.sin((this.actionTimer / 20) * Math.PI) * 14 * this.slashDirection;
    } else if (this.actionState === 'hand_and_kick') {
      const liveDist = (this.actionTargetEnemy && this.actionTargetEnemy.active)
        ? Math.max(0, Math.abs(this.actionTargetEnemy.x - this.x) - 42)
        : this.attackDashDistance;

      if (this.actionTimer < 10) {
        const snapProgress = Math.min(1, this.actionTimer / 3);
        forwardDashOffset = liveDist * snapProgress * this.slashDirection;
      } else {
        const p = (this.actionTimer - 10) / 14;
        verticalJumpOffset += -Math.sin(p * Math.PI) * 34;
        forwardDashOffset = liveDist * (1 - p * 0.7) * this.slashDirection;
      }
    } else if (this.actionState === 'hit') {
      forwardDashOffset += -Math.sin(this.actionTimer * 0.8) * 8;
    }

    const hipX = this.x + forwardDashOffset;
    const hipY = this.y - 40 - bounce + verticalJumpOffset + (this.actionState === 'beheaded' ? 24 : 0);
    const chestX = hipX + (this.isDashing ? 32 : 24);
    const chestY = hipY - (this.isDashing ? 10 : 14);

    let headX = chestX + 10;
    let headY = chestY - 8;

    if (this.actionState === 'beheaded') {
      headX += this.pHeadX;
      headY += this.pHeadY;
    }

    // Record & Draw Cyan Afterimages during Double-Space Air Dash
    if (this.isDashing) {
      this.dashAfterimages.push({
        hipX, hipY, chestX, chestY, headX, headY, alpha: 0.75
      });
    }
    for (let i = this.dashAfterimages.length - 1; i >= 0; i--) {
      const ghost = this.dashAfterimages[i];
      ghost.alpha -= 0.08;
      if (ghost.alpha <= 0) {
        this.dashAfterimages.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = ghost.alpha;
      ctx.strokeStyle = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(ghost.hipX, ghost.hipY);
      ctx.lineTo(ghost.chestX, ghost.chestY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ghost.headX, ghost.headY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawLeg = (phaseOffset) => {
      const phi = cycle + phaseOffset;
      let thighAngle = Math.sin(phi) * 0.8 + 0.15;
      let kneeFlex = (Math.cos(phi) + 1) * 0.85 + 0.35;

      const isKickingLeg = (this.actionState === 'hand_and_kick' && this.actionTimer >= 9 && phaseOffset === 0);

      if (isKickingLeg) {
        thighAngle = 1.48 * this.slashDirection;
        kneeFlex = 0.04;
      } else if (this.isDashing) {
        // Streamlined Horizontal Air-Dash Pose
        thighAngle = phaseOffset === 0 ? -0.45 : -0.95;
        kneeFlex = 0.9;
      } else if (this.isJumping) {
        // Ninja Mid-Air Tuck Pose
        thighAngle = phaseOffset === 0 ? 0.85 : -0.25;
        kneeFlex = phaseOffset === 0 ? 1.55 : 1.25;
      } else if (this.actionState === 'sword_cleave') {
        thighAngle = 0.55;
        kneeFlex = 1.35;
      } else if (this.actionState === 'beheaded') {
        thighAngle = 0.4;
        kneeFlex = 1.5;
      }

      const kneeAngle = thighAngle - kneeFlex;
      const thighLen = 22;
      const shinLen = 22;

      const kx = hipX + Math.sin(thighAngle) * thighLen;
      const ky = hipY + Math.cos(thighAngle) * thighLen;
      const fx = kx + Math.sin(kneeAngle) * shinLen;
      const fy = (this.isJumping || this.isDashing)
        ? (ky + Math.cos(kneeAngle) * shinLen)
        : Math.min(this.y + 2, ky + Math.cos(kneeAngle) * shinLen);

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();

      if (isKickingLeg) {
        ctx.save();
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(fx, fy, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    ctx.strokeStyle = (this.actionState === 'hit' || this.actionState === 'beheaded') ? '#ff0033' : '#050104';
    ctx.fillStyle = (this.actionState === 'hit' || this.actionState === 'beheaded') ? '#ff0033' : '#050104';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawLeg(Math.PI); // back leg

    // Spine
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(chestX, chestY);
    ctx.stroke();

    // Head
    ctx.save();
    if (this.actionState === 'beheaded') {
      ctx.translate(headX, headY);
      ctx.rotate(this.pHeadRot);
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(headX, headY, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Arms & Weapons (Sword, Gun, or Martial Arts Fists)
    const armWave = Math.sin(cycle) * 2;
    let pElbowX, pElbowY, pWristX, pWristY, pSwordTipX, pSwordTipY;
    let weaponMode = 'sword'; // 'sword', 'gun', 'fists'

    if (this.actionState === 'sword_cleave') {
      weaponMode = 'sword';
      const p = this.actionTimer / 20;
      const swingAngle = -Math.PI * 0.75 + (p * Math.PI * 1.4);
      pElbowX = chestX + Math.cos(swingAngle) * 16 * this.slashDirection;
      pElbowY = chestY + Math.sin(swingAngle) * 16;
      pWristX = chestX + Math.cos(swingAngle) * 32 * this.slashDirection;
      pWristY = chestY + Math.sin(swingAngle) * 32;
      pSwordTipX = pWristX + Math.cos(swingAngle) * 68 * this.slashDirection;
      pSwordTipY = pWristY + Math.sin(swingAngle) * 68;
    } else if (this.actionState === 'gun_execution') {
      weaponMode = 'gun';
      const recoilAngle = -this.gunRecoil * 0.04;
      pElbowX = chestX + 16 * this.slashDirection;
      pElbowY = chestY - 2 + Math.sin(recoilAngle) * 8;
      pWristX = chestX + 34 * this.slashDirection;
      pWristY = chestY - 4 - this.gunRecoil * 0.9;
    } else if (this.actionState === 'hand_and_kick') {
      weaponMode = 'fists';
      if (this.actionTimer < 10) {
        const punchWave = Math.sin(this.actionTimer * 2.6);
        pElbowX = chestX + (14 + punchWave * 8) * this.slashDirection;
        pElbowY = chestY - 2;
        pWristX = chestX + (32 + punchWave * 18) * this.slashDirection;
        pWristY = chestY - 4 + punchWave * 3;
      } else {
        pElbowX = chestX - 14 * this.slashDirection;
        pElbowY = chestY - 6;
        pWristX = chestX - 24 * this.slashDirection;
        pWristY = chestY + 4;
      }
    } else {
      weaponMode = 'sword';
      pElbowX = chestX - 20;
      pElbowY = chestY + 2 + armWave;
      pWristX = chestX - 32;
      pWristY = chestY - 3 + armWave;
      pSwordTipX = pWristX - 38;
      pSwordTipY = pWristY - 14;
    }

    if (this.actionState !== 'beheaded') {
      ctx.beginPath();
      ctx.moveTo(chestX - 2, chestY + 2);
      ctx.lineTo(pElbowX, pElbowY);
      ctx.lineTo(pWristX, pWristY);
      ctx.stroke();

      if (weaponMode === 'sword') {
        this.swordTrail.push({
          wx: pWristX,
          wy: pWristY,
          tx: pSwordTipX,
          ty: pSwordTipY
        });
        if (this.swordTrail.length > 7) {
          this.swordTrail.shift();
        }
        this.drawSwordSlashMesh(ctx);

        // Glowing Katana
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#00ffff';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 5.4;
        ctx.beginPath();
        ctx.moveTo(pWristX, pWristY);
        ctx.lineTo(pSwordTipX, pSwordTipY);
        ctx.stroke();

        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(pWristX, pWristY);
        ctx.lineTo(pSwordTipX, pSwordTipY);
        ctx.stroke();
        ctx.restore();
      } else if (weaponMode === 'gun') {
        const showFlash = (this.actionTimer <= 3 || (this.actionTimer >= 6 && this.actionTimer <= 8));
        this.drawCyberPistol(ctx, pWristX, pWristY, this.slashDirection, showFlash);
      } else if (weaponMode === 'fists' && this.actionTimer < 10) {
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pWristX, pWristY, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    drawLeg(0); // front leg

    // Enemies Draw
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.groundY = this.y;
      enemy.update(26);
      enemy.draw(ctx);

      if (!enemy.active) {
        this.enemies.splice(i, 1);
      }
    }

    // Bullet Tracer Beams Draw
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const bt = this.bulletTracers[i];
      bt.alpha -= 0.14;
      if (bt.alpha <= 0) {
        this.bulletTracers.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = bt.alpha;
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bt.x1, bt.y1);
      ctx.lineTo(bt.x2, bt.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bt.x1, bt.y1);
      ctx.lineTo(bt.x2, bt.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Expanding Post-Kill Shockwave Rings Draw
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.22;
      sw.alpha -= 0.055;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = sw.lineWidth * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // VFX Particles Draw
    for (let i = this.vfxParticles.length - 1; i >= 0; i--) {
      const p = this.vfxParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.life -= 0.038;

      if (p.life <= 0) {
        this.vfxParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating Kill Callouts Draw
    for (let i = this.killTexts.length - 1; i >= 0; i--) {
      const kt = this.killTexts[i];
      kt.y += kt.vy;
      kt.vy *= 0.92;
      kt.scale += (1.0 - kt.scale) * 0.2;
      kt.alpha -= 0.026;

      if (kt.alpha <= 0) {
        this.killTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = kt.alpha;
      ctx.translate(kt.x, kt.y);
      ctx.scale(kt.scale, kt.scale);
      ctx.textAlign = 'center';

      ctx.font = '900 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.shadowColor = kt.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(kt.text, 0, 0);

      ctx.font = '800 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = kt.color;
      ctx.fillText(kt.subText, 0, 16);
      ctx.restore();
    }

    ctx.restore();
  }

  animate() {
    this.frame++;
    this.draw();
    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ninjaInstance = new NinjaRun('canvas');
});