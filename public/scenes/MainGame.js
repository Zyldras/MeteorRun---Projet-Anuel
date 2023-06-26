export default class MainGame extends Phaser.Scene {
  constructor() {
    super("MainGame");
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.isBonusActive = false;
    this.isBubbleActive = false;
    this.meteorTimer = 0;
    this.bonusTimer = null;
    this.meteorAcceleration = 1.1;
    this.limitVelotcity = 900;
    this.lastMeteorVelocityY = 200;
    this.lastMeteorVelocityYAccelerated = false;
    this.lastAccelerationTime = 0;
    this.meteorGenerationTime = 1000;
    this.bubbleImage = null;
    this.bonusTimerEvent = null;
  }

  preload() {
    this.load.setPath("../assets/");
    this.load.image("player", "player.png");
    this.load.spritesheet('meteor', 'meteor.png', {
      frameWidth: 420,
      frameHeight: 580
    });
    this.load.image("background", "sky.png");
    this.load.image("ground", "platform.png");
    this.load.image("bubble", "bubble.png");
    this.load.image("slow-time", "clock.png");
    this.load.image("invincibility", "star.png");
    this.load.spritesheet('reverse-clock', 'reverse-clock.png', {
      frameWidth: 166, // Largeur d'une image du GIF
      frameHeight: 166, // Hauteur d'une image du GIF
    });
  }

  create() {
    // Ajoute une image de fond
    this.add.image(400, 300, "background").setScale(2);

    // Ajoute le sol
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 600, "ground").setScale(2).refreshBody();

    // Crée un sprite animé pour le GIF du bonus Slow Time
    this.slowTimeGif = this.add.sprite(400, 300, "reverse-clock");
    this.slowTimeGif.setScale(0.5);
    this.slowTimeGif.setVisible(false);

    // Crée l'animation du GIF
    this.anims.create({
      key: 'slow-time-animation',
      frames: this.anims.generateFrameNumbers('reverse-clock', {
        start: 0,
        end: 84 - 1, // Remplacez numFrames par le nombre total d'images du GIF
      }),
      frameRate: 60, // Réglez la vitesse de l'animation selon vos besoins
      repeat: 0, // Ne pas répéter l'animation
    });

    this.slowTimeGif.on('animationcomplete', this.hideSlowTimeGif, this);

    this.progressBar = this.add.graphics();
    this.progressDuration = 4500;

    // Crée le joueur
    this.player = this.physics.add
      .sprite(400, 500, "player")
      .setScale(0.4)
      .setVelocityY(100);
    this.player.setCollideWorldBounds(true);

    // Crée les météorites
    this.anims.create({
      key: 'meteor-animation',
      frames: this.anims.generateFrameNumbers('meteor', {
        start: 0,
        end: 8-1, // Remplacez numFrames par le nombre total d'images du GIF
      }),
      frameRate: 10, // Réglez la vitesse de l'animation selon vos besoins
      repeat: -1, // -1 pour répéter l'animation indéfiniment
    });
    this.meteors = this.physics.add.group();

    // Crée les flèches du clavier
    this.cursors = this.input.keyboard.createCursorKeys();

    // Crée le texte du score
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#000",
    });

    // Crée les bonus
    this.bonuses = this.physics.add.group();

    this.bonusTimerEvent = this.time.addEvent({
      delay: 20000,
      callback: this.generateBonus,
      callbackScope: this,
      loop: true,
      paused: false
    });

    // Gère la collision entre les météorites, le joueur et le sol
    this.meteorCollider = this.physics.add.collider(
      this.player,
      this.meteors,
      this.hitMeteor,
      null,
      this
    );
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.meteors, this.ground);
    // Gère la collision entre le joueur et les bonus
    this.physics.add.overlap(this.player, this.bonuses, this.collectBonus, null, this);
    this.physics.add.collider(this.bonuses, this.ground);

  }

  update(time, delta) {
    // Déplace le joueur selon les flèches du clavier
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }

    // Met à jour le score
    this.scoreText.setText("Score: " + this.score);

    // Génère les météorites toutes les secondes
    this.meteorTimer += delta;
    if (this.meteorTimer > this.meteorGenerationTime) {
      this.generateMeteor();
      this.meteorTimer = 0;
    }

    if (this.lastMeteorVelocityY > this.limitVelotcity) {
      console.log("bite");
    }

    // Accélère la chute des météorites toutes les 10 secondes
    if (this.lastMeteorVelocityY < this.limitVelotcity) {
      if (time - this.lastAccelerationTime > 10000) {
        this.lastAccelerationTime = time;
        this.lastMeteorVelocityY *= this.meteorAcceleration;
        this.lastMeteorVelocityYAccelerated = true;
        this.meteorGenerationTime *= 0.9; // Réduit le temps entre les générations de 10% à chaque accélération
      } else {
        this.lastMeteorVelocityYAccelerated = false;
      }
    }


    // Vérifie si les météorites touchent le sol
    this.meteors.getChildren().forEach((meteor) => {
      if (meteor.body.touching.down && meteor.active) {
        meteor.destroy();
        this.score += 1;
      }
    });

    // Vérifie si les bonus touchent le sol
    this.bonuses.getChildren().forEach((bonus) => {
      if (bonus.body.touching.down && bonus.active) {
        bonus.destroy();
        this.bonusTimerEvent.paused = false;
      }
    });

    if (this.isBubbleActive) {
      // Positionne l'image de la bulle autour du joueur
      this.bubbleImage.setPosition(this.player.x + 5, this.player.y);
    }
  }

  generateMeteor() {
    if (!this.gameOver) {
      var x = Phaser.Math.Between(0, 800);
      var meteor = this.meteors.create(x, 0, "meteor").setScale(0.12);
      meteor.setVelocityY(this.lastMeteorVelocityY);
      meteor.setCollideWorldBounds(true);
      meteor.setBounce(1);
      meteor.setGravityY(0);
      meteor.play('meteor-animation');
      if (this.lastMeteorVelocityYAccelerated) {
        meteor.velocityYBeforeAccelerate = this.lastMeteorVelocityY;
      }
    }
  }

  hitMeteor() {
    // Arrête le jeu
    if (this.gameOver == true) return;

    this.physics.pause();
    this.player.setTint(0xff0000);
    this.gameOver = true;

    this.time.addEvent({
      delay: 1000,
      callback: this.showGameOver,
      callbackScope: this,
    });
  }

  showGameOver() {
    // Show game over scene as overlay
    this.scoreText.setVisible(false);
    this.scene.launch("GameOver", { score: this.score });
    const panel = this.scene.get("GameOver");

    panel.events.on("clickMenu", this.handleGoMenu, this);
    panel.events.on("clickRetry", this.handleRetry, this);
  }

  closeGameOver() {
    this.scene.stop("GameOver");
  }

  handleGoMenu() {
    this.closeGameOver();
    this.scene.start("MainMenu");
  }

  handleRetry() {
    this.closeGameOver();
    this.scene.restart();
  }

  generateBonus() {
    if (!this.gameOver && !this.isBonusActive) {
      if (this.bonuses.getLength() === 0) {
        this.bonusTimerEvent.paused = true;
        if (this.isBubbleActive === true) {
          var bonusType = Phaser.Math.Between(1, 2);
        } else {
          var bonusType = Phaser.Math.Between(0, 2);
        }
        var x = Phaser.Math.Between(0, 800);
        var bonus = this.bonuses.create(x, 0, this.getBonusTexture(bonusType)).setScale(0.15);
        bonus.setVelocityY(100);
        bonus.setCollideWorldBounds(true);
        bonus.setBounce(1);
        bonus.setGravityY(0);
        bonus.setData("type", bonusType);
      }
    }
  }

  getBonusTexture(type) {
    switch (type) {
      case 0:
        return "bubble";
      case 1:
        return "slow-time";
      case 2:
        return "invincibility";
      default:
        return "";
    }
  }

  collectBonus(player, bonus) {
    var bonusType = bonus.getData("type");
    bonus.destroy();

    // Activer le bonus correspondant
    switch (bonusType) {
      case 0: // Bulle
        this.activateBubble();
        break;
      case 1: // Slow-Time
        this.activateSlowTime();
        break;
      case 2: // Invincibility
        this.activateInvincibility();
        break;
    }
  }

  activateBubble() {
    this.isBonusActive = false;
    this.isBubbleActive = true;
    this.bonusTimerEvent.paused = false;
    // Crée l'image de la bulle
    this.bubbleImage = this.physics.add.image(1000, 1000, "bubble");
    this.bubbleImage.setCircle(126);
    this.bubbleImage.setScale(0.5);
    // Gère la collision entre la bulle et les météorites
    this.physics.add.collider(this.bubbleImage, this.meteors, this.hitBubble, null, this);
  }

  hitBubble(bubble, meteor) {
    // Détruit la bulle et la météorite
    bubble.destroy();
    meteor.destroy();
    this.isBubbleActive = false;
  }

  activateSlowTime() {
    this.isBonusActive = true;
    this.bonusTimerEvent.paused = true;

    // Afficher et animer le GIF du bonus Slow Time
    this.slowTimeGif.setPosition(370, 300);
    this.slowTimeGif.setVisible(true);
    this.slowTimeGif.play("slow-time-animation");

    // Démarre la barre de progression
    this.startProgressBar();

    // Sauvegarder la vitesse et le temps de génération actuels
    const originalVelocityY = this.lastMeteorVelocityY;
    const originalGenerationTime = this.meteorGenerationTime;
    // Ralentissez la vitesse des météorites
    this.meteors.getChildren().forEach((meteor) => {
      meteor.setVelocityY(this.lastMeteorVelocityY / 2);
    });

    // Réduire la vitesse et le temps de génération des météorites
    this.lastMeteorVelocityY /= 2;
    this.meteorGenerationTime *= 2;

    this.time.delayedCall(5000, () => {
      this.bonusTimerEvent.paused = false;
      this.isBonusActive = false;
      this.player.clearTint();

      // Restaurer la vitesse et le temps de génération d'origine
      this.lastMeteorVelocityY = originalVelocityY;
      this.meteorGenerationTime = originalGenerationTime;
    });
  }

  hideSlowTimeGif() {
    this.slowTimeGif.setVisible(false);
  }

  activateInvincibility() {
    this.isBonusActive = true;
    this.bonusTimerEvent.paused = true;
    this.meteorCollider.active = false;

    // Démarre la barre de progression
    this.startProgressBar();

    this.player.setTintFill(0xffff00);
    this.time.delayedCall(5000, () => {
      this.meteorCollider.active = true;
      this.bonusTimerEvent.paused = false;
      this.isBonusActive = false;
      this.player.clearTint();
    });
  }

  // ...

  startProgressBar() {
    const startX = 650; // Position de départ horizontale de la barre
    const endX = 750; // Position de fin horizontale de la barre
    const barHeight = 20; // Hauteur de la barre

    // Définit les couleurs de remplissage et de contour de la barre
    const fillColor = 0x00ff00; // Vert
    const fillAlpha = 1;
    const strokeColor = 0x000000; // Noir
    const strokeAlpha = 1;

    let progress = 0; // Progression actuelle de la barre

    const updateProgressBar = () => {
      // Calculer la position horizontale actuelle de la barre
      const currentX = Phaser.Math.Linear(startX, endX, progress);

      // Effacer et dessiner la barre de progression
      this.progressBar.clear();
      this.progressBar.fillStyle(fillColor, fillAlpha);
      this.progressBar.lineStyle(2, strokeColor, strokeAlpha);
      this.progressBar.fillRect(currentX, 20, endX - currentX, barHeight);
      this.progressBar.strokeRect(startX, 20, endX - startX, barHeight);

      progress += 0.01; // Augmenter la progression

      if (progress <= 1) {
        // Appeler la fonction de mise à jour à nouveau après un court délai
        this.time.delayedCall(this.progressDuration / 100, updateProgressBar, [], this);
      } else {
        // La progression est terminée, effacer la barre
        this.progressBar.clear();
      }
    };

    // Démarrer la progression de la barre
    updateProgressBar();
  }
}

