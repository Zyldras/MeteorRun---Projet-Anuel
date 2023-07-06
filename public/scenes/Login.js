import { config } from "../main.js";

export default class Login extends Phaser.Scene {
  constructor() {
    super({ key: "Login", active: false });
  }

  init(data) {
    document.getElementById("name_login").style.display = "block";
    document.getElementById("pwd_login").style.display = "block";

    this.resetInteractive = data.reset;
    this.context = data.context;
  }

  preload() {
    this.load.setPath("../assets/");
    this.load.image("loginBg", "menu-bg-vertical.png");
    this.load.image("btn", "btn.png");
    this.load.image("btnHover", "btnHover.png");
    this.load.image("close", "close.png");
  }

  create() {
    const x = config.width - 100;
    const w = config.width - 2 * x;

    const y = config.height - 140;
    const h = config.height - 2 * y;

    this.background = this.add.image(400, 300, "loginBg");
    this.background.setScale(3.5);

    // Login title
    this.title = this.add.text(300, 100, "LOGIN", {
      fontSize: "60px",
      fill: "#000",
      fontFamily: "Comic Sans MS",
    });

    this.createCloseButton(547, 68, this.clickClose);

    this.createLoginButtons(x, y, w);
  }

  createCloseButton(x, y, callback) {
    this.close = this.add.image(x, y, "close");
    this.close.setScale(0.75);

    this.close.setInteractive();
    this.close.on("pointerdown", callback, this);
  }

  createLoginButtons(x, y, w) {
    this.btn_login = this.createButton(x + 0.5 * w, y, this.clickLogin);

    this.label_menu = this.add.text(
      this.btn_login.getData("centerX") - 45,
      this.btn_login.getData("centerY") - 25,
      "Login",
      {
        fontSize: "35px",
        fill: "#FFF",
        fontFamily: "Comic Sans MS",
      }
    );
  }

  createButton(centerX, centerY, callback) {
    const btn = this.add.image(centerX, centerY, "btn").setScale(1.5);
    btn.setInteractive();
    btn.on("pointerover", () => {
      btn.setTexture("btnHover");
    });

    btn.on("pointerout", () => {
      btn.setTexture("btn");
    });
    btn.on("pointerdown", callback, this);

    btn.setData("centerX", centerX);
    btn.setData("centerY", centerY);

    return btn;
  }

  clickLogin() {
    // Get HTML inputs values
    const name = document.getElementById("name_login_input").value;
    const pwd = document.getElementById("pwd_login_input").value;

    // Test de la récupération des valeurs
    console.log(name, pwd);

    // @TODO
  }

  clickClose() {
    document.getElementById("name_login").style.display = "none";
    document.getElementById("pwd_login").style.display = "none";

    document.getElementById("name_login_input").value = "";
    document.getElementById("pwd_login_input").value = "";

    this.resetInteractive(this.context);

    this.scene.stop("Login");
  }
}
