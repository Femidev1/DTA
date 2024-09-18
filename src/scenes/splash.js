import SceneEffect from "../gameobjects/scene_effect";
import { LightParticle } from "../gameobjects/particle";



export default class Splash extends Phaser.Scene {
  constructor() {
    super({ key: "splash" });
  }

  create() {
    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.center_width = this.width / 2;
    this.center_height = this.height / 2;
    this.addBackground();
    this.showLogo();
    this.registry.set("currentPowerUp", 0);
    this.time.delayedCall(1000, () => this.showInstructions(), null, this);
    this.addPlayerToSplash();
/*
    this.input.keyboard.on(
      "keydown-SPACE",
      () => this.transitionToChange(),
      this
    );
*/

this.input.on('pointerdown', () => this.transitionToChange(), this);
    this.playMusic();
  }

  /*
    The background, as the game, is a `tileSprite`, so we can scroll it to make it look like it's moving.
    */
  addBackground() {
    this.background = this.add
      .tileSprite(0, 0, this.width, this.height, "background")
      .setOrigin(0)
      .setScrollFactor(0, 1);
  }

  addPlayerToSplash() {
    // Spawn the player near the bottom of the screen, same as in the game
    let spawnX = this.center_width; // Center horizontally
    let spawnY = this.height - 100; // 100 pixels from the bottom

    // Create the player sprite
    this.splashPlayer = this.add.sprite(spawnX, spawnY, 'player1'); // Replace 'player1' with the correct sprite key
    this.splashPlayer.setScale(0.75); // Adjust scale if needed
    this.splashPlayer.setDepth(1); 
/*
    this.tweens.add({
      targets: this.splashPlayer,
      alpha: { from: 1, to: 0.75 }, // Blink between fully visible and half-transparent
      duration: 500, // Duration of one blink cycle in milliseconds
      yoyo: true, // Make the tween go back to the start value
      repeat: -1, // Repeat indefinitely
      ease: 'Sine.easeInOut' // Use a smooth easing function
  });
*/
    this.createTrailEffect();
}

createTrailEffect() {
  // Create a layer for the trail particles (if not already created)
  this.trailLayer = this.add.layer();

  // Set up an event to create the light particles at intervals
  this.time.addEvent({
      delay: 50, // Frequency of trail creation
      callback: () => {
          // Create a new light particle at the player's current position
          this.trailLayer.add(new LightParticle(this, this.splashPlayer.x, this.splashPlayer.y, 0xffffff, 10));
      },
      callbackScope: this,
      loop: true
  });
}



  update() {
    this.background.tilePositionY -= 2;
    this.background.tilePositionX += 2;
  }

  /*
    We add this effect to change to another screen:
    */
    transitionToChange() {
      this.startGame();
  }
  

  startGame() {
    if (this.theme) this.theme.stop();
    this.scene.start("game", {
      name: "STAGE",
      number: 1,
      time: 30,
    });
  }

  /*
    We add the logo, and then we tween it to make it move up and down.
    */
showLogo() {
    this.gameLogoShadow = this.add
      .image(this.center_width, 250, "logo")
      .setScale(0.3)
      .setOrigin(0.5);
    this.gameLogoShadow.setOrigin(0.48);
    this.gameLogoShadow.tint = 0x3e4e43;
    this.gameLogoShadow.alpha = 0.6;
   this.gameLogo = this.add
      .image(this.center_width, 250, "logo")
      .setScale(0.3)
      .setOrigin(0.5); 

    this.tweens.add({
      targets: [this.gameLogo, this.gameLogoShadow],
      duration: 500,
      y: {
        from: -200,
        to: 250,
      },
    });

    this.tweens.add({
      targets: [this.gameLogo, this.gameLogoShadow],
      duration: 1500,
      y: {
        from: 250,
        to: 200,
      },
      repeat: -1,
      yoyo: true,
    });
  }   

  /*
    This is the music for the splash scene. We'll play it in a loop.
    */
  playMusic(theme = "splash") {
    this.theme = this.sound.add(theme);
    this.theme.stop();
    this.theme.play({
      mute: false,
      volume: 0.5,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0,
    });
  }

  /*
    Here we add the instructions to the scene.
    */
  showInstructions() {
   this.instructionsText = this.add
      .bitmapText(this.center_width, 600, "wendy", "Hold to destroy", 40)
      .setOrigin(0.5)
      .setDropShadow(3, 4, 0x222222, 0.7);

      this.tweens.add({
        targets: this.instructionsText,
        duration: 400,
        alpha: { from: 0, to: 1 },
        repeat: -1,
        yoyo: true, 
      }); 


   /* this.add
      .bitmapText(this.center_width, 500, "wendy", "SPACE to shoot", 40)
      .setOrigin(0.5)
      .setDropShadow(3, 4, 0x222222, 0.7);
    this.add
      .sprite(this.center_width - 95, 598, "pello_logo")
      .setOrigin(0.5)
      .setScale(0.3)
      .setTint(0x000000)
      .setAlpha(0.7);
    this.add
      .sprite(this.center_width - 100, 590, "pello_logo")
      .setOrigin(0.5)
      .setScale(0.3); 

    this.add
      .bitmapText(this.center_width + 30, 590, "wendy", "PELLO", 50)
      .setOrigin(0.5)
      .setDropShadow(3, 4, 0x222222, 0.7); 


    this.space = this.add
      .bitmapText(this.center_width, 680, "wendy", "Press SPACE to start", 60)
      .setOrigin(0.5)
      .setDropShadow(3, 4, 0x222222, 0.7); */

  }
}
