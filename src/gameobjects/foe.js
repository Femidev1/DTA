import FoeShot from "./foe_shot";
import Explosion from "./explosion";

const TYPES = {
  foe0: { points: 400, lives: 1 },
  foe1: { points: 500, lives: 3 },
  foe2: { points: 800, lives: 2 },
  guinxu: { points: 10000, lives: 20 },
};

class Foe extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, name = "foe0", velocityX = 0, velocityY = 0, scale = 0.75) {
    super(scene, x, y, name);
    
    // Ensure x and y are within the game area
    const gameWidth = scene.sys.game.config.width;
    const gameHeight = scene.sys.game.config.height;
    
    this.name = name;
    this.points = TYPES[name].points;
    this.lives = TYPES[name].lives;
    this.id = Math.random();
    this.setScale(scale);

    // Constrain the spawn position within the screen bounds
    this.x = Phaser.Math.Clamp(x, 0, gameWidth);
    this.y = Phaser.Math.Clamp(y, 0, gameHeight);
    
    if (this.name !== "foe2") {
      this.spawnShadow(this.x, this.y, scale);
    }
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setCircle(24);
    this.body.setOffset(12 * scale, 12 * scale);
    this.body.setVelocityX(velocityX);
    this.body.setVelocityY(velocityY);
    this.setData("vector", new Phaser.Math.Vector2());
    if (this.name === "guinxu") {
      this.setGuinxuShot();
    }
    this.init();
}


  /*
    This function sets a tween to the Guinxu foe, so it moves in a zig-zag pattern.
    */
  setGuinxuShot() {
    this.patternIndex = 0;
    this.pattern = Phaser.Utils.Array.NumberArrayStep(-300, 300, 50);
    this.pattern = this.pattern.concat(
      Phaser.Utils.Array.NumberArrayStep(300, -300, -50)
    );
    this.scene.tweens.add({
      targets: this,
      duration: 2000,
      y: { from: this.y, to: this.y + Phaser.Math.Between(100, -100) },
      x: { from: this.x, to: this.x + Phaser.Math.Between(100, -100) },
      yoyo: true,
      repeat: -1,
    });
  }

  /*
    This function spawns a shadow for each foe. We'll have to update it with the foe itself.
    */
  spawnShadow(x, y, scale) {
    this.shadow = this.scene.add
      .image(x + 20, y + 20, this.name)
      .setScale(scale * 0.7)
      .setTint(0x000000)
      .setAlpha(0.4);
  }

  updateShadow() {
    this.shadow.x = this.x + 20;
    this.shadow.y = this.y + 20;
  }

  /*
    This function adds an animation to the foe.
    */
    init() {
      // Check if the animation with the given key already exists before creating it
      if (!this.scene.anims.exists(this.name)) {
        this.scene.anims.create({
          key: this.name,
          frames: this.scene.anims.generateFrameNumbers(this.name),
          frameRate: 10,
          repeat: -1,
        });
      }
    
      // Play the animation
      this.anims.play(this.name, true);
      this.direction = -1;
    }
    
  /*
    This function is called from the foe generation. It updates the foe position, checks if it's out of bounds and also updates its shadow.
    */
  update() {
    if (this.y > this.scene.height + 64) {
      if (this.name !== "foe2") this.shadow.destroy();
      this.destroy();
    }

    if (this.name === "guinxu" && Phaser.Math.Between(1, 6) > 5) {
      this.guinxuShot();
    } else if (Phaser.Math.Between(1, 101) > 100) {
      if (!this.scene || !this.scene.player) return;
      this.scene.playAudio("foeshot");
      let shot = new FoeShot(this.scene, this.x, this.y, "foe", this.name);
      this.scene.foeShots.add(shot);
      this.scene.physics.moveTo(
        shot,
        this.scene.player.x,
        this.scene.player.y,
        300
      );
      this.scene.physics.moveTo(
        shot.shadow,
        this.scene.player.x,
        this.scene.player.y,
        300
      );
    }

    if (this.name !== "foe2") {
      this.updateShadow();
    }
  }

  /*
    This takes care of the shots generated by the final boss.
    */
  guinxuShot() {
    if (!this.scene || !this.scene.player) return;

    this.scene.playAudio("foeshot");
    let shot = new FoeShot(
      this.scene,
      this.x,
      this.y,
      "foe",
      this.name,
      this.pattern[this.patternIndex],
      300
    );
    this.scene.foeShots.add(shot);
    this.patternIndex =
      this.patternIndex + 1 === this.pattern.length ? 0 : ++this.patternIndex;
  }

  /*
    This function is called when the foe is destroyed, adding an explosion effect along with a tween and showing the points.
    */
  dead() {
    let radius = 60;
    let explosionRad = 20;
    if (this.name === "guinxu") {
      radius = 220;
      explosionRad = 220;
      this.scene.cameras.main.shake(500);
    }

    const explosion = this.scene.add
      .circle(this.x, this.y, 5)
      .setStrokeStyle(20, 0xffffff);
    this.showPoints(this.points);
    this.scene.tweens.add({
      targets: explosion,
      radius: { from: 10, to: radius },
      alpha: { from: 1, to: 0.3 },
      duration: 250,
      onComplete: () => {
        explosion.destroy();
      },
    });

    new Explosion(this.scene, this.x, this.y, explosionRad);
    if (
      this.name !== "foe2" &&
      this.scene &&
      this.scene.scene.isActive() &&
      this.shadow &&
      this.shadow.active
    )
      this.shadow.destroy();

    if (this.name === "guinxu") {
      this.scene.number = 5;
      this.scene.playAudio("explosion");
      this.scene.endScene();
    }
    this.destroy();
  }

  /*
    As we do when destroying shots, this function shows the points when a foe is destroyed with a simple tween effect.
    */
  showPoints(score, color = 0xff0000) {
    let text = this.scene.add
      .bitmapText(this.x + 20, this.y - 30, "wendy", "+" + score, 40, color)
      .setOrigin(0.5);
    this.scene.tweens.add({
      targets: text,
      duration: 800,
      alpha: { from: 1, to: 0 },
      y: { from: this.y - 20, to: this.y - 80 },
      onComplete: () => {
        text.destroy();
      },
    });
  }
}

export default Foe;
