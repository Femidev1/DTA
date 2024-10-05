import SceneEffect from "../gameobjects/scene_effect";
import { LightParticle } from "../gameobjects/particle";

export default class Splash extends Phaser.Scene {
  constructor() {
    super({ key: "splash" });
  }

  preload(){
    //loading assets
    this.load.spritesheet("playButton", "assets/images/play.png", {
      frameWidth: 488,
      frameHeight: 88
    });
  //  this.load.image("mineButton", "assets/images/mine.png");
   // this.load.image("earnButton", "assets/images/earn.png");
  }

  create() {
    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.center_width = this.width / 2;
    this.center_height = this.height / 2;
    this.addBackground();
    // this.showLogo();
    this.registry.set("currentPowerUp", 0);
    // this.time.delayedCall(1000, () => this.showInstructions(), null, this);
    this.addPlayerToSplash();
    
    // Set initial score to 0 if not set before
    if (!this.registry.has("totalScore")) {
      this.registry.set("totalScore", 0);
    }
    this.showTotalScore();
    // this.time.delayedCall(1000, () => this.showInstructions(), null, this);
    
    // Adding buttons to splash
    this.createButtons();

    this.addPlayerToSplash();
    // Removing the old pointerdown event for the whole screen
    // this.input.on('pointerdown', () => this.transitionToChange(), this); // Removed

    this.playMusic();
    /*
    this.input.keyboard.on(
      "keydown-SPACE",
      () => this.transitionToChange(),
      this
    );
    */
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
    let spawnY = this.height/2 - 60; // 100 pixels from the bottom

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

  // Splash page buttons
  createButtons(){
  /*  const mineButton = this.add.image(this.center_width, 440, 'mineButton')
    .setInteractive()
    .setScale(0.5);

  mineButton.on('pointerdown', () => {
    console.log("Mine action triggered!");
  }); */

    const playButton = this.add.sprite(this.center_width, 500, 'playButton', 0) 
      .setInteractive()
      .setScale(0.5);

    // Now the game starts only when clicking the "Play" button
    playButton.on('pointerdown', () => {
      this.transitionToChange();
    });

   /* const earnButton = this.add.image(this.center_width, 560, 'earnButton')
      .setInteractive()
      .setScale(0.5);

    earnButton.on('pointerdown', () => {
      console.log("Earn action triggered!");
    });*/
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

    // Reset the score for the current game session only, NOT the total score
    this.registry.set("score_player1", 0);
    
    // Start the game
    this.scene.start("game", {
      name: "STAGE",
      number: 1,
      time: 30,
    });
  }

  /*
    We add the logo, and then we tween it to make it move up and down.
    */
  /* showLogo() {
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
  }   */

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

  // Function to show the player's total score on the splash screen
  showTotalScore() {
    // Get the total score from the registry (default to 0 if not set)
    const totalScore = this.registry.get("totalScore") || 0;

    // Display the total score on the splash screen
    this.add
      .bitmapText(this.center_width, 44, "wendy", ` ${totalScore}`, 48)
      .setOrigin(0.5)
      .setDropShadow(3, 4, 0x222222, 0.7);
  }

  /*
    Here we add the instructions to the scene.
    */
  /*  showInstructions() {
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
   this.add
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
      .setDropShadow(3, 4, 0x222222, 0.7); 
  } */
}