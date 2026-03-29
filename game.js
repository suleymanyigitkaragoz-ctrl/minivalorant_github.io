let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHT
const light = new THREE.HemisphereLight(0xffffff,0x444444);
scene.add(light);

// PLAYER
let player = new THREE.Object3D();
scene.add(player);

camera.position.set(0,1.6,0);
player.add(camera);

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  new THREE.MeshBasicMaterial({color:0x222222})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// WALL
function wall(x,z){
  let w = new THREE.Mesh(
    new THREE.BoxGeometry(5,3,1),
    new THREE.MeshBasicMaterial({color:0x555555})
  );
  w.position.set(x,1.5,z);
  scene.add(w);
}
wall(5,5);
wall(-5,-5);

// BOT
let bot = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshBasicMaterial({color:"red"})
);
bot.position.set(5,1,5);
bot.hp = 100;
scene.add(bot);

// JOYSTICK
let moveX=0, moveZ=0;

const joystick = nipplejs.create({
  zone: document.getElementById('joystick'),
  mode:'static',
  position:{left:'75px', bottom:'75px'}
});

joystick.on('move',(e,data)=>{
  moveX = Math.cos(data.angle.radian);
  moveZ = Math.sin(data.angle.radian);
});
joystick.on('end',()=>{
  moveX=0; moveZ=0;
});

// TOUCH LOOK (SADECE BAKIŞ)
let touchLook = false;
let lastX=0, lastY=0;

renderer.domElement.addEventListener("touchstart",(e)=>{
  if(e.touches[0].clientX > window.innerWidth/2){ // sağ taraf = kamera
    touchLook = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
});

renderer.domElement.addEventListener("touchmove",(e)=>{
  if(!touchLook) return;

  let dx = e.touches[0].clientX - lastX;
  let dy = e.touches[0].clientY - lastY;

  player.rotation.y -= dx * 0.005;
  camera.rotation.x -= dy * 0.005;

  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));

  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
});

renderer.domElement.addEventListener("touchend",()=>{
  touchLook=false;
});

// SHOOT
window.addEventListener("click", shoot);
renderer.domElement.addEventListener("touchstart", shoot);

function shoot(){
  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({x:0,y:0}, camera);

  let hits = raycaster.intersectObject(bot);
  if(hits.length>0){
    bot.hp -= 20;
    if(bot.hp<=0) scene.remove(bot);
  }
}

// SKILLS
document.getElementById("fire").ontouchstart = ()=>{
  let fb = new THREE.Mesh(
    new THREE.SphereGeometry(0.3),
    new THREE.MeshBasicMaterial({color:"orange"})
  );
  fb.position.copy(player.position);

  let dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  scene.add(fb);

  let interval = setInterval(()=>{
    fb.position.add(dir.clone().multiplyScalar(0.5));

    if(bot && fb.position.distanceTo(bot.position)<1){
      bot.hp -= 40;
      scene.remove(fb);
      clearInterval(interval);
    }
  },16);
};

document.getElementById("heal").ontouchstart = ()=>{
  console.log("heal");
};

document.getElementById("ult").ontouchstart = ()=>{
  console.log("ultimate");
};

// BOT AI
function botAI(){
  if(!bot) return;

  let dir = player.position.clone().sub(bot.position);
  if(dir.length()>1){
    dir.normalize();
    bot.position.add(dir.multiplyScalar(0.02));
  }
}

// LOOP
function animate(){
  requestAnimationFrame(animate);

  // hareket (kamera yönüne göre)
  let forward = new THREE.Vector3();
  player.getWorldDirection(forward);

  let right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0));

  player.position.add(forward.multiplyScalar(moveZ * 0.1));
  player.position.add(right.multiplyScalar(moveX * 0.1));

  botAI();

  renderer.render(scene, camera);
}

animate();
