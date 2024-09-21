import Foe from "./foe";
import FoeShot from './foe_shot'; // Adjust the path if necessary


export default class FoeGenerator {
  constructor(scene) {
    this.scene = scene;
    this.waveFoes = [];
    this.generate();
    this.activeWave = false;
    this.waves = 0;
  }

  /*
    This is the main function to generate foes. Depending on the scene number, it will generate different foes.
    */
    generate() {
      // Track the difficulty level using a timer
      this.difficultyLevel = 1;
      
      // Increase difficulty over time
      this.scene.time.addEvent({
          delay: 10000, // Increase difficulty every 20 seconds
          callback: () => this.increaseDifficulty(),
          callbackScope: this,
          loop: true,
      });
  
      // Start spawning simple enemies
      this.startEnemyGeneration();
  }
  generate() {
    // Check if it's scene 4 to spawn guinxu
    if (this.scene.number === 4) {
        this.scene.time.delayedCall(2000, () => this.releaseGuinxu(), null, this);
    } else {
        // For all other scenes, start with difficulty progression
        this.difficultyLevel = 1;

        // Increase difficulty over time
        this.scene.time.addEvent({
            delay: 20000, // Increase difficulty every 20 seconds
            callback: () => this.increaseDifficulty(),
            callbackScope: this,
            loop: true,
        });

        // Start spawning simple enemies
        this.startEnemyGeneration();
    }
}

startEnemyGeneration() {
  // Generate basic foes
  this.generateEvent1 = this.scene.time.addEvent({
      delay: 7000,
      callback: () => this.orderedWave(),
      callbackScope: this,
      loop: true,
  });

  this.generateEvent2 = this.scene.time.addEvent({
      delay: 15000,
      callback: () => this.wave(),
      callbackScope: this,
      loop: true,
  });

  // More enemies will be added as the difficulty increases
}

increaseDifficulty() {
  this.difficultyLevel++;

  // As difficulty increases, add more complex enemies
  if (this.difficultyLevel === 2) {
      // Start generating tanks
      this.generateEvent3 = this.scene.time.addEvent({
          delay: 10000,
          callback: () => this.tank(),
          callbackScope: this,
          loop: true,
      });
  } else if (this.difficultyLevel === 3) {
      // Start generating sliders
      this.generateEvent4 = this.scene.time.addEvent({
          delay: 12000,
          callback: () => this.slider(),
          callbackScope: this,
          loop: true,
      });
  } else if (this.difficultyLevel === 4) {
      // Start generating teleporter foes
      this.generateEvent5 = this.scene.time.addEvent({
          delay: 12000,
          callback: () => this.teleporterFoe(),
          callbackScope: this,
          loop: true,
      });
  }

  // Optionally, you can also decrease the delay to make spawning faster
  if (this.difficultyLevel > 5) {
      this.generateEvent1.delay = Math.max(3000, this.generateEvent1.delay - 1000); // Decrease delay but don't go below 3000ms
      this.generateEvent2.delay = Math.max(5000, this.generateEvent2.delay - 1000);
      if (this.generateEvent3) this.generateEvent3.delay = Math.max(7000, this.generateEvent3.delay - 1000);
      if (this.generateEvent4) this.generateEvent4.delay = Math.max(9000, this.generateEvent4.delay - 1000);
      if (this.generateEvent5) this.generateEvent5.delay = Math.max(9000, this.generateEvent5.delay - 1000); // Adjust spawn rate for teleporter foes
      if (this.generateEvent6) this.generateEvent6.delay = Math.max(10000, this.generateEvent6.delay - 1000); // Adjust spawn rate for exploder foes
  }
}


  /*
  This is the function that generates the boss.
  */
  releaseGuinxu() {
    const guinxu = new Foe(
      this.scene,
      Phaser.Math.Between(200, 600),
      200,
      "guinxu",
      0,
      20
    );
    this.scene.playAudio("boss");
    this.laughterEvent = this.scene.time.addEvent({
      delay: 10000,
      callback: () => {
        this.scene.playAudio("boss");
      },
      callbackScope: this,
      loop: true,
    });
    this.scene.tweens.add({
      targets: guinxu,
      alpha: { from: 0.3, to: 1 },
      duration: 200,
      repeat: 10,
    });
    this.scene.foeGroup.add(guinxu);
  }

  /*
  This is the function that stops the generation of foes.
  */
  stop() {
    clearInterval(this.generationIntervalId);
    this.scene.foeGroup.children.entries.forEach((foe) => {
      if (foe === null || !foe.active) return;
      foe.destroy();
    });
  }

  /*
  This is called when the scene is finished and it takes care of destroying the generation events.
  */
 /*  finishScene() {
    this.generateEvent1.destroy();
    this.generateEvent2.destroy();
    if (this.scene.number > 1) this.generateEvent3.destroy();
    if (this.scene.number > 2) this.generateEvent4.destroy();
    this.scene.endScene();
  } */

  /*
  This is the function that creates the path for the foes to follow in formation.
  */
  createPath() {
    this.waves++;
   // if (this.waves === 2) this.finishScene();
    const start = Phaser.Math.Between(24, 200);
    this.path = new Phaser.Curves.Path(start, 0);

    this.path.lineTo(start, Phaser.Math.Between(10, 30));

    let max = 8;
    let h = 360 / max;

    for (let i = 0; i < max; i++) {
      if (i % 2 === 0) {
        this.path.lineTo(start, 24 + h * (i + 1));
      } else {
        this.path.lineTo(start + 120, 48 + h * (i + 1));
      }
    }

    this.path.lineTo(start, this.scene.height + 50);
    this.graphics = this.scene.add.graphics();
    this.graphics.lineStyle(0, 0xffffff, 0); // for debug
  }

  /*
  This is the function that generates a wave of foes in an ordered formation.
  */
  orderedWave(difficulty = 5) {
    const x = Phaser.Math.Between(24, this.scene.width - 200);
    const y = Phaser.Math.Between(-24, 0);
    const minus = Phaser.Math.Between(-1, 1) > 0 ? 1 : -1;
    

    Array(difficulty)
      .fill()
      .forEach((_, i) => this.addOrder(i, x, y, minus));
  }

  /*
  This function just creates a simple wave of foes.
  */
  wave(difficulty = 5) {
    this.createPath();
    const x = Phaser.Math.Between(40, this.scene.width - 40); // Ensure it spawns within visible area
    const y = Phaser.Math.Between(-50, -10); // Spawn slightly off the top of the screen
    const minus = Phaser.Math.Between(-1, 1) > 0 ? 1 : -1;

    let previousX = null;
    let previousY = null;

    Array(difficulty)
        .fill()
        .forEach((_, i) => {
            this.addToWave(i);
        });
    this.activeWave = true;
}



  /*
  This function generates a single tank foe.
  */
  tank() {
    this.scene.foeGroup.add(
      new Foe(this.scene, Phaser.Math.Between(40, 320), -50, "foe2", 0, 620)
    );
  }

  /*
  This generates a slider foe and adds a rotation tween to it.
  */
  slider() {
    let velocity = -200;
    let x = 0;
    if (Phaser.Math.Between(-1, 1) > 0) {
      velocity = 200;
      x = -100;
    } else {
      x = this.scene.width + 100;
    }
    const foe = new Foe(
      this.scene,
      x,
      Phaser.Math.Between(100, 600),
      "foe1",
      velocity,
      0
    );
    this.scene.tweens.add({
      targets: [foe, foe.shadow],
      duration: 500,
      rotation: "+=5",
      repeat: -1,
    });
    this.scene.foeGroup.add(foe);
  }



  // TeleporterFoe - Teleports randomly around the screen
teleporterFoe() {
  const x = Phaser.Math.Between(50, this.scene.width - 50);
  const foe = new Foe(this.scene, x, -50, "foe3", 0, 200); // Replace "foe6" with your actual texture key

  // Set up teleporting behavior
  this.scene.time.addEvent({
      delay: 2000, // Teleport every 2 seconds
      callback: () => {
          if (foe.active) {
              // Teleport to a random position on the screen
              foe.setPosition(
                  Phaser.Math.Between(50, this.scene.width - 50),
                  Phaser.Math.Between(50, this.scene.height - 50)
              );

              // Optional: Add a flash effect to indicate teleportation
              this.scene.tweens.add({
                  targets: foe,
                  alpha: { from: 0.3, to: 1 },
                  duration: 200,
                  yoyo: true,
              });
          }
      },
      callbackScope: this,
      loop: true
  });

  this.scene.foeGroup.add(foe);
}


  /*
  This function adds a foe to the scene, in a random position.
  */
  add() {
    const foe = new Foe(
      this.scene,
      Phaser.Math.Between(32, this.scene.width - 32),
      0
    );
    this.scene.foeGroup.add(foe);
  }

  /*
  This function generates and ordered group of foes.
  */
  addOrder(i, x, y, minus) {
    // Adjust the spacing values
    const horizontalSpacing = 40; // Change this value to increase/decrease horizontal spacing
    const verticalOffsetMultiplier = 10; // Change this value to adjust vertical offset
    
    const offset = minus * verticalOffsetMultiplier; // Vertical offset for each foe

    // Modify the foe's position using the new spacing values
    this.scene.foeGroup.add(
      new Foe(this.scene, x + i * horizontalSpacing, y + offset, "foe0", 0, 400)
    );
}


  /*
  This function adds a foe to the wave.
  */
  addToWave(i) {
    // Ensure the foes spawn within visible bounds
    const x = Phaser.Math.Between(40, this.scene.width - 40); // 40 pixels margin on both sides
    const y = Phaser.Math.Between(-50, -10); // Spawn slightly off the top

    const foe = new Foe(this.scene, x, y, "foe0");
    
    this.scene.tweens.add({
      targets: foe,
      z: 1,
      ease: "Linear",
      duration: 12000,
      repeat: -1,
      delay: i * 300,
    });

    this.scene.foeWaveGroup.add(foe);
}

  /*
  This function updates all foes in the scene. This could be done independently in each foe as we will see in other projects.
  */
  update() {
    if (this.path) {
      this.path.draw(this.graphics);

      this.scene.foeWaveGroup.children.entries.forEach((foe) => {
        if (foe === null || !foe.active) return;
        let t = foe.z;
        let vec = foe.getData("vector");
        this.path.getPoint(t, vec);
        foe.setPosition(vec.x, vec.y);
        foe.shadow.setPosition(vec.x + 20, vec.y + 20);
        foe.setDepth(foe.y);
      });

      if (this.activeWave && this.checkIfWaveDestroyed()) {
        this.activeWave = false;
       // this.scene.spawnShake();
        this.path.destroy();
      }
    }

    this.scene.foeGroup.children.entries.forEach((foe) => {
      if (foe === null || !foe.active || foe.y > this.scene.height + 100)
        foe.destroy();
      foe.update();
    });
  }

  /*
  This function checks if the wave of foes has been destroyed so we can generate a power-up.
  */
  checkIfWaveDestroyed() {
    const foes = this.scene.foeWaveGroup.children.entries;

    return foes.length === foes.filter((foe) => !foe.active).length;
  }
}
