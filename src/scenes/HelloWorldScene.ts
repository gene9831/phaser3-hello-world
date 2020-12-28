import Phaser from "phaser";

enum GameStatus {
  READY,
  START,
  GAMEOVER,
}

export default class HelloWorldScene extends Phaser.Scene {
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private stars?: Phaser.Physics.Arcade.Group;
  private bombs?: Phaser.Physics.Arcade.Group;
  private player?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private score: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private username?: Phaser.GameObjects.Text;
  private gameStatus: GameStatus = GameStatus.READY;
  private gameover?: Phaser.GameObjects.DOMElement;

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 42 });
    this.load.html("nameform", "assets/nameform.html");
    this.load.html("gameover", "assets/gameover.html");
  }

  create() {
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();

    const groudImage = this.textures.get("ground").getSourceImage();
    (this.platforms.create(400, 600 - groudImage.height / 2, "ground") as Phaser.Physics.Arcade.Image)
      .setScale(2, 1)
      .refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // add player
    this.player = this.physics.add.sprite(100, 450, "dude", 4);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(160, 400);

    // animation
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "leftStill",
      frames: [{ key: "dude", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "rightStill",
      frames: [{ key: "dude", frame: 5 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    // add stars
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child) => {
      (child as Phaser.Physics.Arcade.Sprite).setBounceY(Phaser.Math.FloatBetween(0.3, 0.5));
    });

    // add bombs
    this.bombs = this.physics.add.group();

    // add collider and overlap
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);
    this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);

    // text
    this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", color: "#000" });
    const usernameText = this.add.text(0, 16, "enter you name", {
      fontSize: "24px",
      color: "#000",
      align: "right",
      fixedWidth: 800 - 16,
    });

    const nameform = this.add.dom(400, 300).createFromCache("nameform");
    nameform.addListener("click");
    nameform.on("click", (event: any) => {
      if (event.target.id === "play") {
        const name = (nameform.getChildByID("name") as any).value;
        if (!name) return;

        console.log("play");
        nameform.removeListener("click");
        nameform.setVisible(false);

        this.username = name;
        usernameText.setText(name);

        this.createCursors();
        this.gameStatus = GameStatus.START;
      }
    });
  }

  private createCursors() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private hasKeyDown() {
    return (
      this.cursors?.left.isDown ||
      this.cursors?.right.isDown ||
      this.cursors?.up.isDown ||
      this.keyA?.isDown ||
      this.keyD?.isDown ||
      this.keySpace?.isDown
    );
  }

  private collectStar(player: any, star: any) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const s = star as Phaser.Physics.Arcade.Sprite;

    s.disableBody(true, true);
    this.score += 10;
    this.scoreText?.setText("Score: " + this.score);

    if (this.stars?.countActive(true) === 0) {
      this.stars.children.iterate((child) => {
        const c = child as Phaser.Physics.Arcade.Sprite;
        c.enableBody(true, c.x, 0, true, true);
      });

      const x = p.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      const bomb: Phaser.Physics.Arcade.Sprite = this.bombs?.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }

  private hitBomb(player: any, bomb: any) {
    this.physics.pause();

    const p = player as Phaser.Physics.Arcade.Sprite;
    p.setTint(0xff0000);
    p.anims.play("turn");

    this.gameStatus = GameStatus.GAMEOVER;

    if (!this.gameover) {
      this.gameover = this.add.dom(400, 300).createFromCache("gameover");
      this.gameover.addListener("click");
      this.gameover.on("click", (event: any) => {
        if (event.target.id === "restart") {
          this.restart();
        }
      });
    } else {
      this.gameover.setVisible(true);
    }
  }

  private restart() {
    console.log("restart");
    this.physics.resume();

    this.player?.body.reset(100, 450);
    this.player?.clearTint();
    this.stars?.children.iterate((child) => {
      const c = child as Phaser.Physics.Arcade.Sprite;
      c.enableBody(true, c.x, 0, true, true);
    });
    this.score = 0;
    this.scoreText?.setText("Score: 0");
    this.gameover?.setVisible(false);
    this.bombs?.clear(true, true);

    this.gameStatus = GameStatus.START;
  }

  private axGround: number = 300;
  private axAir: number = 200;

  private setAccelerationX(a: number) {
    if (this.cursors?.left?.isDown || this.keyA?.isDown) {
      this.player?.setAccelerationX(-a);
      this.player?.anims.play("left", true);
    } else if (this.cursors?.right?.isDown || this.keyD?.isDown) {
      this.player?.setAccelerationX(a);
      this.player?.anims.play("right", true);
    } else {
      const vx = this.player?.body.velocity.x;
      let positive = 0;
      if (vx) {
        if (vx >= 5) {
          positive = -1;
        } else if (vx <= -5) {
          positive = 1;
        } else {
          this.player?.setVelocityX(0);
        }
      }
      this.player?.setAccelerationX(positive * a);
      this.player?.anims.play("turn");
    }
  }

  update() {
    if (this.gameStatus !== GameStatus.START) return;

    if (this.player?.body.touching.down) {
      this.setAccelerationX(this.axGround);
      if (this.cursors?.up?.isDown || this.keySpace?.isDown) {
        this.player?.setVelocityY(-400);
      }
    } else {
      this.setAccelerationX(this.axAir);
    }
  }
}
