const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let bot;

// 🎯 PLAYER
const playerStats = {
    hp: 100,
    maxHp: 100,
    isUltimate: false
};

const hpUI = document.getElementById("hp");

// 📱 JOYSTICK
const joystick = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' }
});

let moveX = 0;
let moveZ = 0;

joystick.on('move', (evt, data) => {
    const angle = data.angle.radian;
    moveX = Math.cos(angle);
    moveZ = Math.sin(angle);
});

joystick.on('end', () => {
    moveX = 0;
    moveZ = 0;
});

// 🎮 SCENE
const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    scene.collisionsEnabled = true;

    // Kamera
    const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 2, -10), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.5;
    camera.checkCollisions = true;
    camera.applyGravity = true;

    // Işık
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Zemin
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:50, height:50}, scene);
    ground.checkCollisions = true;

    // Player hitbox
    const player = BABYLON.MeshBuilder.CreateBox("player", {size:1}, scene);
    player.isVisible = false;
    player.checkCollisions = true;
    camera.parent = player;

    // 🧱 HARİTA
    function createWall(x, z, w, h, d) {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", {
            width: w,
            height: h,
            depth: d
        }, scene);

        wall.position = new BABYLON.Vector3(x, h / 2, z);
        wall.checkCollisions = true;
    }

    createWall(0, 20, 40, 5, 1);
    createWall(0, -20, 40, 5, 1);
    createWall(20, 0, 1, 5, 40);
    createWall(-20, 0, 1, 5, 40);

    createWall(5, 5, 5, 3, 1);
    createWall(-5, -5, 5, 3, 1);
    createWall(-10, 10, 3, 3, 1);

    // 🤖 BOT
    bot = BABYLON.MeshBuilder.CreateBox("bot", {size:2}, scene);
    bot.position = new BABYLON.Vector3(10, 1, 10);
    bot.health = 100;

    // 🔫 SHOOT
    window.addEventListener("click", shoot);
    canvas.addEventListener("touchstart", shoot);

    function shoot() {
        applyRecoil();

        const ray = scene.createPickingRay(
            scene.pointerX,
            scene.pointerY,
            BABYLON.Matrix.Identity(),
            camera
        );

        const hit = scene.pickWithRay(ray);

        if (hit.pickedMesh === bot) {
            bot.health -= 20;

            if (bot.health <= 0) {
                bot.dispose();
            }
        }
    }

    // 🎯 RECOIL
    function applyRecoil() {
        camera.rotation.x += 0.05;

        let recoilBack = setInterval(() => {
            camera.rotation.x -= 0.01;
            if (camera.rotation.x <= 0) clearInterval(recoilBack);
        }, 10);
    }

    // 🔥 FIREBALL (Q)
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "q") {
            const fb = BABYLON.MeshBuilder.CreateSphere("fb", {diameter:1}, scene);
            fb.position = camera.position.clone();

            const forward = camera.getForwardRay().direction;
            fb.direction = forward;
            fb.speed = 0.7;

            scene.onBeforeRenderObservable.add(() => {
                if (!fb || fb.isDisposed()) return;

                fb.position.addInPlace(fb.direction.scale(fb.speed));

                if (bot && fb.intersectsMesh(bot, false)) {
                    bot.health -= 40;
                    fb.dispose();
                }
            });
        }
    });

    // 💚 HEAL (E)
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "e") {
            const zone = BABYLON.MeshBuilder.CreateCylinder("heal", {
                diameter: 3,
                height: 0.2
            }, scene);

            zone.position = player.position.clone();

            setTimeout(() => zone.dispose(), 5000);

            scene.onBeforeRenderObservable.add(() => {
                if (!zone || zone.isDisposed()) return;

                if (zone.intersectsMesh(player, false)) {
                    playerStats.hp += 0.3;
                    if (playerStats.hp > playerStats.maxHp)
                        playerStats.hp = playerStats.maxHp;
                }
            });
        }
    });

    // 💥 ULT (X)
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "x") {
            playerStats.isUltimate = true;

            setTimeout(() => {
                playerStats.isUltimate = false;
            }, 8000);
        }
    });

    // 🤖 BOT AI
    scene.onBeforeRenderObservable.add(() => {
        if (!bot || bot.isDisposed()) return;

        const direction = player.position.subtract(bot.position);
        const distance = direction.length();

        if (distance > 2) {
            direction.normalize();
            bot.position.addInPlace(direction.scale(0.05));
        } else {
            damagePlayer(0.2);
        }
    });

    // 📱 JOYSTICK MOVE
    scene.onBeforeRenderObservable.add(() => {
        player.position.x += moveX * 0.1;
        player.position.z += moveZ * 0.1;
    });

    // ❤️ HP UI
    scene.onBeforeRenderObservable.add(() => {
        hpUI.innerText = Math.floor(playerStats.hp);
    });

    // 💀 DAMAGE
    function damagePlayer(amount) {
        if (playerStats.isUltimate) {
            player.position = new BABYLON.Vector3(0,2,-10);
            return;
        }

        playerStats.hp -= amount;

        if (playerStats.hp <= 0) {
            alert("Öldün heheheha");
            playerStats.hp = playerStats.maxHp;
            player.position = new BABYLON.Vector3(0,2,-10);
        }
    }

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});
