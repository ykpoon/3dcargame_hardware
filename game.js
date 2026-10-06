// 初始化 Three.js 場景、相機與渲染器
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// 賽車與賽道狀態
let carSpeed = 0.6;
let maxSpeed = 1.2;
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

// 建立簡單賽車 (BoxGeometry 組合)
const carGroup = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(1.2, 0.5, 2.2);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
const carBody = new THREE.Mesh(bodyGeo, bodyMat);
carBody.position.y = 0.4;
carGroup.add(carBody);
scene.add(carGroup);

// 環境光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x38bdf8, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 建立動態無限賽道
const roadSegments = [];
const roadGeo = new THREE.PlaneGeometry(12, 100);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

for (let i = 0; i < 3; i++) {
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -i * 100;
  scene.add(road);
  roadSegments.push(road);
}

// 建立可收集硬體零件清單
const hardwareItems = [];
const itemTypes = [
  { name: 'CPU 核心', type: 'CPU', color: 0x10b981, desc: '中央處理器是電腦大腦！提升時脈可提高賽車極速與運算反應。' },
  { name: 'RAM 記憶體', type: 'RAM', color: 0xf59e0b, desc: '隨機存取記憶體是高速暫存區！容量越大，賽道能同時處理的物件越多。' }
];

function spawnHardware(zPos) {
  const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const itemGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const itemMat = new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.5 });
  const mesh = new THREE.Mesh(itemGeo, itemMat);
  
  // 隨機分布在賽道 3 條跑道
  mesh.position.set((Math.random() - 0.5) * 8, 0.5, zPos);
  mesh.userData = type;
  scene.add(mesh);
  hardwareItems.push(mesh);
}

// 預先生成前方零件
for (let i = 1; i <= 5; i++) {
  spawnHardware(-i * 35);
}

// 監聽鍵盤事件
window.addEventListener('keydown', (e) => { if (keys[e.code] !== undefined) keys[e.code] = true; });
window.addEventListener('keyup', (e) => { if (keys[e.code] !== undefined) keys[e.code] = false; });

// 顯示教學資訊卡
function displayHardwareKnowledge(item) {
  const card = document.getElementById('knowledge-card');
  document.getElementById('hw-title').textContent = `⚡ 升級組件：${item.name}`;
  document.getElementById('hw-desc').textContent = item.desc;
  card.classList.remove('hidden');

  // 更新 HUD 數值
  if (item.type === 'CPU') {
    carSpeed = Math.min(carSpeed + 0.15, maxSpeed);
    document.getElementById('cpu-stat').textContent = `${(carSpeed * 3).toFixed(1)} GHz`;
    document.getElementById('cpu-bar').style.width = `${(carSpeed / maxSpeed) * 100}%`;
  }
}

// 主渲染迴圈
function animate() {
  requestAnimationFrame(animate);

  // 左右控制移動
  if (keys.ArrowLeft && carGroup.position.x > -4.5) carGroup.position.x -= 0.15;
  if (keys.ArrowRight && carGroup.position.x < 4.5) carGroup.position.x += 0.15;

  // 賽車前進與相機跟隨
  carGroup.position.z -= carSpeed;
  camera.position.set(carGroup.position.x, 3.5, carGroup.position.z + 7);
  camera.lookAt(carGroup.position.x, 0.8, carGroup.position.z - 5);

  // 賽道無縫滾動機制
  roadSegments.forEach(road => {
    if (road.position.z > carGroup.position.z + 50) {
      road.position.z -= 300;
    }
  });

  // 硬體零件旋轉與碰撞偵測
  hardwareItems.forEach((item, index) => {
    item.rotation.y += 0.03;

    // 簡易距離碰撞判定
    if (carGroup.position.distanceTo(item.position) < 1.5) {
      displayHardwareKnowledge(item.userData);
      scene.remove(item);
      hardwareItems.splice(index, 1);
      spawnHardware(carGroup.position.z - 120); // 補充新道具
    }
  });

  renderer.render(scene, camera);
}

animate();

// 響應視窗縮放
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
