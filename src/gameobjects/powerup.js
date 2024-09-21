class PowerUp extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, name = "plenny0", power = "fruit", scale = 0.75) {
    super(scene, x, y, name);
    this.name = name;
    this.power = power;
    this.scene = scene;
    this.id = Math.random();

    // Set the scale of the power-up
    this.setScale(scale);
    
    // Spawn the shadow with the correct scale
    this.spawnShadow(x, y, scale);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Adjust the physics body to respect the scale
    this.body.setCircle(19 * scale); 
    this.body.setOffset(12 * scale, 12 * scale);
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(false);
    this.body.onWorldBounds = false;
    this.body.setBounce(1);
    
    // Set a random velocity for bouncing
    this.body.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));

    // Set shadow physics
    this.scene.physics.add.existing(this.shadow);
    this.shadow.body.setAllowGravity(false);
    this.shadow.body.setCollideWorldBounds(false);
    this.shadow.body.onWorldBounds = false;
    this.shadow.body.setBounce(1);
    this.shadow.body.setVelocity(this.body.velocity.x, this.body.velocity.y); // Match initial velocity

    // Set timer to destroy power-up after a certain duration
    this.scene.time.delayedCall(5000, this.destroyPowerUp, [], this);

    this.init();
  }

  /*
   The power-up also spawns a shadow.
  */
  spawnShadow(x, y, scale) {
    this.shadow = this.scene.physics.add.image(x + 20, y + 20, "plenny0") // Add directly with physics
      .setTint(0x000000)
      .setAlpha(0.4)
      .setScale(scale * 0.8);

    // Set up the physics properties for the shadow
    this.shadow.body.setAllowGravity(false);
    this.shadow.body.setCollideWorldBounds(true);
    this.shadow.body.onWorldBounds = true;
    this.shadow.body.setBounce(1);
  }

  /*
    This sets the animation and movement of the power-up.
  */
  init() {
    if (!this.scene.anims.exists(this.name)) {
      this.scene.anims.create({
        key: this.name,
        frames: this.scene.anims.generateFrameNumbers(this.name),
        frameRate: 10,
        repeat: -1,
      });
    }

    this.anims.play(this.name, true);

    // Apply a simple tween to create a floating effect
    this.scene.tweens.add({
      targets: [this, this.shadow],
      y: '+=10', // Move 10 pixels down
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /*
    Destroy the power-up after showing a flashing tween animation.
  */
  destroyPowerUp() {
    // Ensure this.scene exists
    if (this.scene) {
      // Play the flashing tween animation before destroying
      this.scene.tweens.add({
        targets: [this, this.shadow],
        duration: 200, // Duration of each flash
        alpha: { from: 1, to: 0.2 }, // Flashing effect
        repeat: 5, // Repeat 5 times
        yoyo: true, // Go back and forth
        onComplete: () => {
          // Destroy the power-up and its shadow after the tween
          if (this.shadow) this.shadow.destroy();
          this.destroy();
        },
      });
    } else {
      // If scene is undefined, just destroy the power-up immediately
      if (this.shadow) this.shadow.destroy();
      this.destroy();
    }
  }

  /*
    Override preUpdate to ensure the shadow follows the power-up
  */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Sync the shadow's position with the power-up
    this.shadow.x = this.x + 20;
    this.shadow.y = this.y + 20;

    // Ensure shadow matches the velocity of the power-up
    this.shadow.body.setVelocity(this.body.velocity.x, this.body.velocity.y);
  }
}

export default PowerUp;
