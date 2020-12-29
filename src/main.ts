import Phaser from "phaser";

import HelloWorldScene from "./scenes/HelloWorldScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scale: {
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
  },
  dom: {
    createContainer: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      gravity: { y: 1000 },
    },
  },
  scene: [HelloWorldScene],
};

export default new Phaser.Game(config);
