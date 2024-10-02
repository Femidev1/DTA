import FoeGenerator from "../gameobjects/foe_generator";
import Player from "../gameobjects/player";
import PowerUp from "../gameobjects/powerup";
import SceneEffect from "../gameobjects/scene_effect";


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: "game" });
    this.player = null;
    this.score = 0;
    this.scoreText = null;
    this.collisionCount = 0;  // Initialize collision count
    this.maxLives = 5;    

    this.powerUpActive = false;  

  }

  /*
    We need to initialize the scene with the data we passed from the previous scene, especially the number of the stage to load the correct background. Also, we need to get the current power-up from the registry, although we are not applying it yet.
    */
  init(data) {
    this.name = data.name;
    this.number = data.number;
    this.next = data.next;
    this.currentPowerUp = +this.registry.get("currentPowerUp");
  }

  /*
    Here we create and start all the elements of the game. We create the background, the players, the foes, the shots, the power-ups, the scores, the audios and the colliders.
    */
  create() {
    this.duration = this.time * 1000;
    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.center_width = this.width / 2;
    this.center_height = this.height / 2;
    new SceneEffect(this).simpleOpen(() => 0);
    this.addBackground();
    this.cameras.main.setBackgroundColor(0x333333);
    this.lights.enable();
    this.lights.setAmbientColor(0x666666);
    this.addScores();
    this.addFoes();
    this.addPlayers();
    this.addPowerUps();
    this.addShots();
    this.loadAudios();
    this.addColliders();
    //this.addlives();
    this.addLivesDisplay(); 
    this.updateLivesDisplay();
    this.scheduleNextPowerUp();
  }
  

  /*
    This is how we create an infinite background. We create a tileSprite with the size of the screen and we set the origin to 0,0. Then we set the scroll factor to 0,1 so it will scroll only in the Y axis.
    */
    addBackground() {
      this.background = this.add
          .tileSprite(this.center_width, this.center_height, this.width, this.height, "stage" + this.number)
          .setOrigin(0.5, 0.5)
          .setScrollFactor(0, 1);
  }

  updateLivesDisplay() {
    // Update the lives text on the screen based on remaining lives
    const livesLeft = this.maxLives - this.collisionCount;
    this.livesText.setText(`LIVES: ${livesLeft}`);
    console.log(`Lives left: ${livesLeft}`);
  }

  /*
    This adds the score text to the scene. We create a group of scores, one for each player. We add the score text to the group and we set the scroll factor to 0 so it will not scroll with the camera.
    */
  addScores() {
    this.scores = {
      player1: {},
     // player2: {},
    };

    this.scores["player1"]["scoreText"] = this.add
      .bitmapText(
        10,
        10,
        "wendy",
        String(this.registry.get("score_player1")).padStart(6, "0"),
        40
      )
      .setOrigin(0, 0)
      .setScrollFactor(0);
   /* this.scores["player2"]["scoreText"] = this.add
      .bitmapText(this.width - 150, 16, "wendy", "0".padStart(6, "0"), 50)
      .setOrigin(0.5)
      .setScrollFactor(0); */
  }

  // Modify destroyWaveFoe to store positions of destroyed foes
 destroyWaveFoe(shot, foe) {
  this.lastDestroyedWaveFoe = { x: foe.x, y: foe.y };
  this.destroyFoe(shot, foe);
}

  spawnShake() {
    const { x, y } = this.lastDestroyedWaveFoe;
    this.shake = new PowerUp(this, x, y);
    this.powerUps.add(this.shake);
  }



  // Function to randomly spawn a power-up in the game
  spawnRandomPowerUp() {
    if (this.isGameOver || this.powerUpActive) return;

    this.powerUpActive = true;  // Mark the power-up as active

    const directions = ['leftToRight', 'rightToLeft'];
    const chosenDirection = Phaser.Utils.Array.GetRandom(directions);
    const spawnY = Phaser.Math.Between(50, this.height - 50);

    let spawnX, targetX;
    
    if (chosenDirection === 'leftToRight') {
      spawnX = -50;
      targetX = this.width + 50;
    } else {
      spawnX = this.width + 50;
      targetX = -50;
    }

    this.powerUp = new PowerUp(this, spawnX, spawnY);
    this.powerUps.add(this.powerUp);

    // Move the power-up across the screen
    this.tweens.add({
      targets: this.powerUp,
      x: targetX,
      duration: Phaser.Math.Between(4000, 6000),
      ease: 'Linear',
      onComplete: () => {
        if (this.powerUp.active) {
          this.powerUp.destroy();  // Destroy if not collected
          this.powerUpActive = false;  // Mark power-up as inactive
          this.scheduleNextPowerUp();  // Schedule the next power-up
        }
      }
    });

    // Collision detection with player
    this.physics.add.collider(this.players, this.powerUp, () => {
      this.pickPowerUp(this.player, this.powerUp);
    }, null, this);
  }


// Function to call the spawnRandomPowerUp after a delay
scheduleNextPowerUp() {
  this.time.delayedCall(Phaser.Math.Between(12000, 20000), () => {
    this.spawnRandomPowerUp();
  });
}
  /*
    This adds the players to the scene. We create a group of players but in this particular implementation, we just add one player.
    */
    addPlayers() {
      this.trailLayer = this.add.layer();
      this.players = this.add.group();
  
      // Spawn the player near the bottom of the screen
      let spawnX = this.center_width; // Center horizontally
      let spawnY = this.height - 100; // 100 pixels from the bottom
  
      this.player = new Player(this, spawnX, spawnY);
      this.players.add(this.player);
  }
  

  addLivesDisplay() {
    this.livesText = this.add
      .bitmapText(
        10, 50,  // Position on the screen (X, Y)
        "wendy", // Font
        `LIVES: ${this.maxLives}`,  // Initial text showing the max lives
        40       // Font size
      )
      .setOrigin(0, 0)
      .setScrollFactor(0); // This ensures the text stays fixed on the screen
  }
  
  

  /*
    Next, we have some functions to add other groups for the game elements.
    */
  addShots() {
    this.shotsLayer = this.add.layer();
    this.shots = this.add.group();
  }

  addFoes() {
    this.foeGroup = this.add.group();
    this.foeWaveGroup = this.add.group();
    this.foeShots = this.add.group();
    this.foes = new FoeGenerator(this);
    this.foeShotsGroup = this.physics.add.group();

    this.foeGroup.setDepth(1);
    this.foeWaveGroup.setDepth(1);
    this.foeShotsGroup.setDepth(1);
  }

  addPowerUps() {
    this.available = ["fruit", "vanila", "chocolate", "spreadShot", "rapidFire"];
    this.powerUps = this.add.group();
  }

  /*
    Once we have created all groups of elements, we add the colliders between them.
    */
  addColliders() {
    this.physics.add.collider(
      this.players,
      this.foeGroup,
      this.crashFoe,
      () => {
        return true;
      },
      this
    );

    this.physics.add.collider(
      this.players,
      this.foeWaveGroup,
      this.crashFoe,
      () => {
        return true;
      },
      this
    );

    this.physics.add.overlap(
      this.shots,
      this.foeGroup,
      this.destroyFoe,
      () => {
        return true;
      },
      this
    );

    this.physics.add.overlap(
      this.shots,
      this.foeWaveGroup,
      this.destroyWaveFoe,
      () => {
        return true;
      },
      this
    );

    this.physics.add.collider(
      this.players,
      this.powerUps,
      this.pickPowerUp,
      () => {
        return true;
      },
      this
    );

    this.physics.add.overlap(
      this.players,
      this.foeShots,
      this.hitPlayer,
      () => {
        return true;
      },
      this
    );

    this.physics.add.collider(
      this.shots,
      this.foeShots,
      this.destroyShot,
      () => {
        return true;
      },
      this
    );
    this.physics.world.on("worldbounds", this.onWorldBounds);
  }

  /*
    This is the callback for the world bounds and we will use it to destroy elements that the game does not need anymore. We check if the element is a shot and if it is, we destroy it. We also destroy the shadow of the shot. We do this because the shadow is not a child of the shot, so it will not be destroyed automatically.
    */
    onWorldBounds(body, t) {
      const name = body.gameObject.name.toString();
      if (["foeshot", "shot"].includes(name)) {
        body.gameObject.shadow.destroy();
        body.gameObject.destroy();
      }
    }
  

  /*
    This is the callback for the collision between two shots. We destroy both shots and we create an explosion where they meet.
    */
  destroyShot(shot, foeShot) {
    const point = this.lights.addPointLight(shot.x, shot.y, 0xffffff, 10, 0.7);
    this.tweens.add({
      targets: point,
      duration: 400,
      scale: { from: 1, to: 0 },
    });
    this.playAudio("foexplosion");
    shot.shadow.destroy();
    shot.destroy();
    foeShot.shadow.destroy();
    foeShot.shot();
    this.updateScore(shot.playerName, 50);
  }

  /*
  This is the callback we call when a shot hits a foe. We destroy the shot and we decrease the lives of the foe. If the foe has no more lives, we destroy it and we create an explosion. We also add the points to the score of the player who shoots the foe.
    */
  destroyFoe(shot, foe) {
    foe.lives--;
    this.playAudio("foexplosion");
    const point = this.lights.addPointLight(shot.x, shot.y, 0xffffff, 10, 0.7);
    this.tweens.add({
      targets: point,
      duration: 400,
      scale: { from: 1, to: 0 },
    });
    this.tweens.add({
      targets: foe,
      duration: 400,
      tint: { from: 0xffffff, to: 0xff0000 },
    });
    this.updateScore(shot.playerName, 50);
    this.tweens.add({ targets: foe, y: "-=10", yoyo: true, duration: 100 });

    shot.destroy();
    if (foe.lives === 0) {
      this.playAudio("foedestroy");
      const point = this.lights.addPointLight(
        shot.x,
        shot.y,
        0xffffff,
        10,
        0.7
      );
      this.tweens.add({
        targets: point,
        duration: 400,
        scale: { from: 1, to: 0 },
      });
      this.updateScore(shot.playerName, foe.points);
      foe.dead();
    }
  }

  /*
  This one is called when a foe shot hits the player. Unless the player is blinking (because it just started), we destroy the player and we create an explosion. We also destroy the shadow of the shot. Then we respawn the player
    */
  hitPlayer(player, shot) {
    if (player.blinking) return;

    this.collisionCount++;
    this.updateLivesDisplay();  // Display lives after crash
    if (this.collisionCount >= this.maxLives) {

      // Play explosion audio and handle player's death
      this.playAudio("explosion");
      this.player.blinking = true;
      player.dead();
  
      this.time.delayedCall(500, () => {
        this.gameOver();  // Call gameOver after a 2-second delay (2000 ms)
      });

      return;
  }

    this.players.remove(this.player);
    player.dead();
    this.playAudio("explosion");
    shot.shadow.destroy();
    shot.destroy();
    this.time.delayedCall(500, () => this.respawnPlayer(), null, this);
  }

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

  gameOver() {
    // Add current game score to total score in the registry
    const currentScore = this.registry.get("score_player1");
    const totalScore = this.registry.get("totalScore") || 0; // Default to 0 if undefined

    // Accumulate the current score into the total score
    this.registry.set("totalScore", totalScore + currentScore);

    // Create a semi-transparent black overlay
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4)
      .setDepth(20);
    
    // "Game Over" text in red using bitmap font
    const gameOverText = this.add.bitmapText(width / 2, height / 2 - 50, 'wendy', 'GAME OVER', 60)
      .setTint(0xff0000) // Red color
      .setOrigin(0.5, 0.5) // Center the text
      .setDepth(22);

    // Instructions text to restart the game
    const restartText = this.add.bitmapText(width / 2, height / 2 + 50, 'wendy', 'Tap to Restart', 30)
      .setOrigin(0.5, 0.5) // Center the text
      .setDepth(23);

    // Ensure input is enabled (especially after pausing)
    this.input.enabled = true;
  
    // Delay to show the Game Over screen before allowing tap
    this.time.delayedCall(500, () => {
        overlay.setInteractive(); // Ensure the overlay is interactive

        overlay.once('pointerdown', () => {
            console.log('Going to home screen');

            // Reset collision count (lives) when transitioning back
            this.collisionCount = 0;
            this.updateLivesDisplay(); // Reset lives on display

            // Transition to the splash screen (or home screen)
            this.scene.start('splash'); // Transition to 'splash' instead of 'bootloader'
        });
    });
}
  /*
    This one is called when a player crashes with a foe. Unless the player is blinking (because it just started), we destroy the player, and the foe and also at the end we respawn the player.
    */
    crashFoe(player, foe) {
      if (player.blinking) return;
  
      this.collisionCount++;
      this.updateLivesDisplay();  // Display lives after crash
      if (this.collisionCount >= this.maxLives) {

        // Play explosion audio and handle player's death
        this.playAudio("explosion");
        this.player.blinking = true;
        player.dead();
          // Add a delay before transitioning to the game over screen
        this.time.delayedCall(2000, () => {
          this.gameOver();  // Call gameOver after a 2-second delay (2000 ms)
        });
        return;
    }
      player.dead();
      this.playAudio("explosion");
      foe.dead();
  
      this.time.delayedCall(1000, () => {
        this.respawnPlayer();
        player.blinking = false;
      }, null, this);
    }

  /*
    This is the callback when the player picks a powerup. We update the power-up of the player and we destroy the power-up. We also create a tween to make the player blink.
    */
    // Modify the pickPowerUp method to ensure the spawning continues
    pickPowerUp(player, powerUp) {
      this.playAudio("stageclear1");
      this.updatePowerUp(player, powerUp);
  
      this.tweens.add({
        targets: player,
        duration: 200,
        alpha: { from: 0.5, to: 1 },
        scale: { from: 1.2, to: 0.75 },
        repeat: 3,
      });
  
      if (powerUp.shadow) powerUp.shadow.destroy();
      powerUp.destroy();
      this.powerUpActive = false;
  
      // Schedule the next power-up spawn after the player collects one
      this.scheduleNextPowerUp();
    }
  

  /*
    This adds a player to the game. We create a tween to make the player blink and then we create a new player.
    */
    respawnPlayer() {
      // Spawn the player near the bottom of the screen
      let spawnX = this.center_width; // Center horizontally
      let spawnY = this.height - 100; // 100 pixels from the bottom
  
      this.player = new Player(this, spawnX, spawnY);
      this.player.blinking = true;
      this.players.add(this.player);
  
      this.tweens.add({
          targets: this.player,
          duration: 100,
          alpha: { from: 0, to: 1 },
          repeat: 10,
          onComplete: () => {
              this.player.blinking = false;
          },
      });
  }
  
  

  /*
    Here we load all the audio, and we add them to the `this.audios` object. Later we can play them with the `playAudio` method.
    */
  loadAudios() {
    this.audios = {
      shot: this.sound.add("shot"),
      foeshot: this.sound.add("foeshot"),
      explosion: this.sound.add("explosion"),
      foexplosion: this.sound.add("foexplosion"),
      foedestroy: this.sound.add("foedestroy"),
      stageclear1: this.sound.add("stageclear1"),
      stageclear2: this.sound.add("stageclear2"),
      boss: this.sound.add("boss"),
    };
  }



  playAudio(key) {
    this.audios[key].play();
  }

  /*
    The game loop is as simple as this. We update the player and the foes. We also update the background to make it scroll.
    */
  update() {
    if (this.player) this.player.update();
    this.foes.update();
    this.background.tilePositionY -= 10;
  }

  /*
    When the player finishes the stage, we destroy all the elements and we start the transition to the next scene.
    */
 /*   endScene() {
      this.foeWaveGroup.children.entries.forEach((foe) => {
          if (foe.shadow) {
              foe.shadow.destroy();
          }
      });
      this.foeGroup.children.entries.forEach((foe) => {
          if (foe.shadow) {
              foe.shadow.destroy();
          }
      });
      this.shots.children.entries.forEach((shot) => {
          if (shot.shadow) {
              shot.shadow.destroy();
          }
      });
      this.foeShots.children.entries.forEach((shot) => {
          if (shot.shadow) {
              shot.shadow.destroy();
          }
      });
      this.time.delayedCall(
          1000,
          () => {
              this.finishScene();
          },
          null,
          this
      );
  } */
  

  /*
    This is the callback for the end of the scene. We stop all the audio, we stop the scene and we start the transition to the next scene.
    */
 /* finishScene() {
    this.game.sound.stopAll();
    this.scene.stop("game");
    const scene = this.number < 5 ? "game" : "outro";
    this.scene.start(scene, {
      next: "game",
      name: "STAGE",
      number: this.number + 1,
    });
  } */

  /*
    The power-up looks the same but the effect is different. We keep increasing its value so we can apply the effect to the player. In this game, the power-up applies another shooting pattern.
    */
  updatePowerUp(player, powerUp) {
    player.powerUp = this.available[this.currentPowerUp];
    this.currentPowerUp =
      this.currentPowerUp + 1 === this.available.length
        ? this.currentPowerUp
        : this.currentPowerUp + 1;
    this.registry.set("currentPowerUp", this.currentPowerUp);
  }

  /*
    This is the method we use to update the score of the player. We get the score from the registry and we update it. We also create a tween to make the score text blink.
    */
  updateScore(playerName, points = 0) {
    const score = +this.registry.get("score_" + playerName) + points;
    this.registry.set("score_" + playerName, score);
    this.scores[playerName]["scoreText"].setText(
      String(score).padStart(6, "0")
    );
    this.tweens.add({
      targets: this.scores[playerName]["scoreText"],
      duration: 200,
      tint: { from: 0x0000ff, to: 0xffffff },
      scale: { from: 1.2, to: 1 },
      repeat: 2,
    });
  }
}
