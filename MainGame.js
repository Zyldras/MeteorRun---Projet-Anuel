export default class MainGame extends Phaser.Scene {

    constructor() {
        super('MainGame');

        this.ground;
        this.player;
        this.meteors;
        this.cursors;
        this.score = 0;
        this.gameOver = false;
        this.scoreText;
        this.gameOverText;
        this.meteorTimer = 0;
        this.meteorAcceleration = 1.2;
        this.lastMeteorVelocityY = Phaser.Math.Between(100, 300);
        this.lastMeteorVelocityYAccelerated = false;
        this.lastAccelerationTime = 0;
        this.meteorGenerationTime = 1000;
    }

    preload() {
        this.load.setPath('assets/');
        this.load.image('player', 'player.png');
        this.load.image('meteor', 'meteor.png');
        this.load.image('background', 'sky.png');
        this.load.image('ground', 'platform.png');
    }

    create() {
        
        // Ajoute une image de fond
        this.add.image(400, 300, 'background').setScale(2);

        // Ajoute le sol
        this.ground = this.physics.add.staticGroup();
        this.ground.create(400, 600, 'ground').setScale(2).refreshBody();

        // Crée le joueur
        this.player = this.physics.add.sprite(400, 500, 'player').setScale(0.4).setVelocityY(100);
        this.player.setCollideWorldBounds(true);

        // Crée les météorites
        this.meteors = this.physics.add.group();

        // Crée les flèches du clavier
        this.cursors = this.input.keyboard.createCursorKeys();

        // Crée le texte du score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

        // Crée le texte de fin de partie
        this.gameOverText = this.add.text(250, 250, 'GAME OVER\nPress F5 to Restart', { fontSize: '40px', fill: '#000' });
        this.gameOverText.setVisible(false);

        // Gère la collision entre les météorites, le joueur et le sol
        this.physics.add.collider(this.player, this.meteors, this.hitMeteor, null, this);
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.meteors, this.ground);
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
        this.scoreText.setText('Score: ' + this.score);

        // Génère les météorites toutes les secondes
        this.meteorTimer += delta;
        if (this.meteorTimer > this.meteorGenerationTime) {
            this.generateMeteor();
            this.meteorTimer = 0;
        }

        // Accélère la chute des météorites toutes les 10 secondes
        if (time - this.lastAccelerationTime > 10000) {
            this.lastAccelerationTime = time;
            this.lastMeteorVelocityY *= this.meteorAcceleration;
            this.lastMeteorVelocityYAccelerated = true;
            this.meteorGenerationTime *= 0.8; // Réduit le temps entre les générations de 20% à chaque accélération
        } else {
            this.lastMeteorVelocityYAccelerated = false;
        }

        // Vérifie si les météorites touche le sol
        this.meteors.getChildren().forEach((meteor) => {
            if (meteor.body.touching.down && meteor.active) {
                meteor.destroy();
                this.score += 1;
            }
        });
    }

    generateMeteor() {
        if (!this.gameOver) {
            var x = Phaser.Math.Between(0, 800);
            var meteor = this.meteors.create(x, 0, 'meteor').setScale(0.04);
            meteor.setVelocityY(this.lastMeteorVelocityY);
            meteor.setCollideWorldBounds(true);
            meteor.setBounce(1);
            meteor.setGravityY(0);
            if (this.lastMeteorVelocityYAccelerated) {
                meteor.velocityYBeforeAccelerate = this.lastMeteorVelocityY;
            }
        }
    }

    hitMeteor() {
        // Arrête le jeu  
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.gameOver = true;
        this.gameOverText.setVisible(true);
    }

}

