var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var player, player2;
var cursors, wasd, player2Keys;
var stars, bombs, platforms, enemies;
var score = 0;
var scoreText;
var gameOver = false;

function preload() {
    this.load.image("sky", 'assets/sky.png');
    this.load.image("bomb", 'assets/bomb.png');
    this.load.image("star", 'assets/star.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('enemy', 'assets/enemy.png'); 
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.audio('drop', 'assets/drop.mp3');
    this.load.audio('wasted', 'assets/wasted.mp3');
}

function create() {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Player 1
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setCollideWorldBounds(true);
    player.body.setGravityY(250);
    player.jumpCount = 0;

    // Player 2
    player2 = this.physics.add.sprite(700, 450, 'dude');
    player2.setCollideWorldBounds(true);
    player2.body.setGravityY(250);
    player2.jumpCount = 0;

    // Animaciones
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player2, platforms);

    // Controles
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
    player2Keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.I,
        left: Phaser.Input.Keyboard.KeyCodes.J,
        down: Phaser.Input.Keyboard.KeyCodes.K,
        right: Phaser.Input.Keyboard.KeyCodes.L
    });

    // Estrellas
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.overlap(player2, stars, collectStar, null, this);

    
    

    // Bombas
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    this.physics.add.collider(player2, bombs, hitBomb, null, this);

    // Puntuación
    scoreText = this.add.text(35, 35, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' });
}

function update() {
    if (gameOver) return;

    // PLAYER 1
    const isLeft = cursors.left.isDown || wasd.left.isDown;
    const isRight = cursors.right.isDown || wasd.right.isDown;
    const isUp = cursors.up.isDown || wasd.up.isDown;

    if (isLeft) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (isRight) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (player.body.touching.down) player.jumpCount = 0;
    if (isUp && player.jumpCount < 2 && !player.wasJumping) {
        player.setVelocityY(-450);
        player.jumpCount++;
        player.wasJumping = true;
    }
    if (!isUp) player.wasJumping = false;

    // PLAYER 2
    const p2Left = player2Keys.left.isDown;
    const p2Right = player2Keys.right.isDown;
    const p2Up = player2Keys.up.isDown;

    if (p2Left) {
        player2.setVelocityX(-160);
        player2.anims.play('left', true);
    } else if (p2Right) {
        player2.setVelocityX(160);
        player2.anims.play('right', true);
    } else {
        player2.setVelocityX(0);
        player2.anims.play('turn');
    }

    if (player2.body.touching.down) player2.jumpCount = 0;
    if (p2Up && player2.jumpCount < 2 && !player2.wasJumping) {
        player2.setVelocityY(-450);
        player2.jumpCount++;
        player2.wasJumping = true;
    }
    if (!p2Up) player2.wasJumping = false;
}

function collectStar(player, star) {
    this.sound.play('drop');
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(playerHit, bomb) {
    this.sound.play('wasted');

    this.physics.pause();
    player.setTint(0xff0000);
    player2.setTint(0xff0000);
    player.anims.play('turn');
    player2.anims.play('turn');
    gameOver = true;

    const gameOverText = this.add.text(300, 270, 'WASTED', {
        fontSize: '64px',
        fill: '#FF0000'
    }).setAlpha(0);

    this.tweens.add({
        targets: gameOverText,
        alpha: 1,
        duration: 1000,
        ease: 'Power2'
    });

    const restartButton = this.add.text(330, 345, 'levantate', {
        fontSize: '32px',
        fill: '#FFFFFF'
    }).setInteractive();

    this.tweens.add({
        targets: restartButton,
        alpha: 1,
        duration: 1000,
        ease: 'Power2'
    });

    restartButton.on('pointerdown', () => {
        this.scene.restart();
        score = 0;
        gameOver = false;
    });
}







