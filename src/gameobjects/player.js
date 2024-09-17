import Explosion from "./explosion";
import { LightParticle } from "./particle";
import ShootingPatterns from "./shooting_patterns";

const shootingRates = {
  water: 200, 
  chocolate: 200,
  vanilla: 400, 
  fruit: 250,
};

class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, name = "player1", powerUp = "water", scale = 0.75) {
    super(scene, x, y, name);
    this.name = name;
    this.spawnShadow(x, y, scale);
    this.powerUp = powerUp;
    this.id = Math.random();
    this.setScale(scale);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);
    this.body.setAllowGravity(false);
    this.isTouching = false; // Initialize isTouching to false
    this.body.setCircle(24);
    this.body.setOffset((0, 0) / 2); // Adjust offset based on scaled size
    this.power = 0;
    this.blinking = false;
    this.shootingPatterns = new ShootingPatterns(this.scene, this.name);

    this.updateShootingRate();
    this.lastShotTime = 0;
    this.init();
    this.setControls();
  }

  /*
    We add a shadow to the player, and we'll have to update its position with the player.
  */
  spawnShadow(x, y, scale) {
    this.shadow = this.scene.add
      .image(x + 10, y + 10, "player1")
      .setTint(0x000000)
      .setAlpha(0.4);
    const shadowScale = 1;
    this.shadow.setScale(scale * shadowScale);
  }

  /*
    We set the animations for the player.
  */
  init() {
    if (!this.scene.anims.exists(this.name)) {
      this.scene.anims.create({
        key: this.name,
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 0,
          end: 0,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists(this.name + "right")) {
      this.scene.anims.create({
        key: this.name + "right",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 1,
          end: 1,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists(this.name + "left")) {
      this.scene.anims.create({
        key: this.name + "left",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 2,
          end: 2,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    this.anims.play(this.name, true);
    this.upDelta = 0;
  }

  /*
    We set the controls for the player.
  */
    setControls() {
      // Clear any existing input events to avoid multiple bindings
      this.scene.input.off('pointerdown');
      this.scene.input.off('pointermove');
      this.scene.input.off('pointerup');
  
      // Pointer down event: Start tracking movement and update player position immediately
      this.scene.input.on('pointerdown', (pointer) => {
          this.isTouching = true;
          this.pointer = pointer;
  
          // Ensure this.scene and its properties are valid
          if (!this.scene || !this.scene.sys || !this.scene.sys.game) return;
  
          // Access game dimensions directly
          const gameWidth = this.scene.sys.game.config.width;
          const gameHeight = this.scene.sys.game.config.height;
  
          // Immediately update the player's position
          this.x = Phaser.Math.Clamp(pointer.x, this.width / 2, gameWidth - this.width / 2);
          this.y = Phaser.Math.Clamp(pointer.y, this.height / 2, gameHeight - this.height / 2);
      });
  
      // Pointer move event: Update the player's position
      this.scene.input.on('pointermove', (pointer) => {
          if (this.isTouching) {
              // Ensure this.scene and its properties are valid
              if (!this.scene || !this.scene.sys || !this.scene.sys.game) return;
  
              // Access game dimensions directly
              const gameWidth = this.scene.sys.game.config.width;
              const gameHeight = this.scene.sys.game.config.height;
  
              // Update the player's position using pointer coordinates, clamping within game bounds
              this.x = Phaser.Math.Clamp(pointer.x, this.width / 2, gameWidth - this.width / 2);
              this.y = Phaser.Math.Clamp(pointer.y, this.height / 2, gameHeight - this.height / 2);
          }
      });
  
      // Pointer up event: Stop tracking movement
      this.scene.input.on('pointerup', () => {
          this.isTouching = false;
      });
  }
  

  updateShootingRate() {
    this.shootingCooldown = shootingRates[this.powerUp] || 300;
  }

  /*
    This will be called when the player shoots.
  */
  shoot() {
    const currentTime = this.scene.time.now;

    if (currentTime - this.lastShotTime >= this.shootingCooldown) {
      this.scene.playAudio("shot");
      this.shootingPatterns.shoot(this.x, this.y, this.powerUp);
      this.lastShotTime = currentTime;
    }
  }

  /*
    This is the game loop for the player.
  */
  update(timestep, delta) {
    if (this.death) return;

    // Automatic shooting while the screen is being touched
    if (this.isTouching) {
      this.shoot();
    }

    // Add trail effect
    this.scene.trailLayer.add(
      new LightParticle(this.scene, this.x, this.y, 0xffffff, 10)
    );

    // Update shadow position
    this.updateShadow();
  }

  /*
    We update the shadow position to follow the player.
  */
  updateShadow() {
    this.shadow.x = this.x + 10;
    this.shadow.y = this.y + 10;
  }

  /*
    Every time the player destroys a foe or a shot we show the points.
  */
  showPoints(score, color = 0xff0000) {
    let text = this.scene.add
      .bitmapText(this.x + 20, this.y - 30, "starshipped", score, 20, 0xfffd37)
      .setOrigin(0.5);
    this.scene.tweens.add({
      targets: text,
      duration: 2000,
      alpha: { from: 1, to: 0 },
      y: { from: text.y - 10, to: text.y - 100 },
    });
  }

  /*
    This will be called when the player dies.
  */
  dead() {
    const explosion = this.scene.add
      .circle(this.x, this.y, 10)
      .setStrokeStyle(40, 0xffffff);
    this.scene.tweens.add({
      targets: explosion,
      radius: { from: 10, to: 512 },
      alpha: { from: 1, to: 0.3 },
      duration: 300,
      onComplete: () => {
        explosion.destroy();
      },
    });
    this.scene.cameras.main.shake(500);
    this.death = true;
    this.shadow.destroy();
    new Explosion(this.scene, this.x, this.y, 40);
    super.destroy();
  }

  setPowerUp(newPowerUp) {
    this.powerUp = newPowerUp;
    this.updateShootingRate();
  }
}

export default Player;
