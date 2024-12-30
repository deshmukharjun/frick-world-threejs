import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/UnrealBloomPass.js';

// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');

// Set up the camera
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4);

// Load textures and create the moon
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('assets/moon.jpg');
const moonGeometry = new THREE.SphereGeometry(2, 64, 64);
const moonMaterial = new THREE.MeshPhongMaterial({
  map: moonTexture,
  shininess: 100,
  emissive: 0xff0000,
  emissiveIntensity: 0.1,
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the Effect Composer with BloomPass
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 1, 0.2);
composer.addPass(bloomPass);

// Create stars
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const starCount = 5000;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 2000;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}
createStars();

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2.7;
controls.maxPolarAngle = (5 * Math.PI) / 8;

// Group for images
const imageGroup = new THREE.Group();
scene.add(imageGroup);

// Attach images
function attachImage(imagePath, position) {
  textureLoader.load(imagePath, function (texture) {
    const aspectRatio = texture.image.width / texture.image.height;
    const planeHeight = 0.4;
    const planeWidth = planeHeight * aspectRatio;
    const imgGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const imgMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
    imgMesh.position.copy(position);
    imgMesh.lookAt(new THREE.Vector3(0, 0, 0));
    imageGroup.add(imgMesh);
    imgMesh.scale.set(1, 1, 1);
  });
}

// Sphere and image grid configuration
const sphereRadius = 3.3;
const rows = 15;
const columns = 30;
let imagePaths = [
  'assets/images1.jpg', 'assets/images2.jpg', 'assets/images3.jpg',
  'assets/images4.jpg', 'assets/images5.jpg', 'assets/images6.jpg',
  'assets/images7.jpg', 'assets/images8.jpg', 'assets/images9.jpg',
  'assets/images10.jpg', 'assets/images11.jpg'
];

// Shuffle array helper function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
imagePaths = shuffleArray(imagePaths);

// Populate image grid
for (let row = 0; row < rows; row++) {
  const theta = Math.PI * (row / (rows - 1));
  for (let col = 0; col < columns; col++) {
    const phi = 2 * Math.PI * (col / columns);
    const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
    const y = sphereRadius * Math.cos(theta);
    const z = sphereRadius * Math.sin(theta) * Math.sin(phi);
    const position = new THREE.Vector3(x, y, z);
    const imagePath = imagePaths[Math.floor(Math.random() * imagePaths.length)];
    attachImage(imagePath, position);
  }
}

// Raycaster for hover effect
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredImage = null;
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Scaling effect parameters
const scaleTarget = new THREE.Vector3(1.1, 1.1, 1.1);
const scaleNormal = new THREE.Vector3(1, 1, 1);
const scaleSpeed = 0.1;

// Animate function
function animate() {
  requestAnimationFrame(animate);
  moon.rotation.y += 0.001;

  // Handle visibility of images based on camera direction
  imageGroup.children.forEach(imgMesh => {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const distance = imgMesh.position.distanceTo(camera.position);
    const vectorToImage = new THREE.Vector3().subVectors(imgMesh.position, camera.position);
    const dotProduct = cameraDirection.dot(vectorToImage.normalize());
    imgMesh.visible = dotProduct >= 0 && distance <= sphereRadius;
  });

  // Raycaster hover effect
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(imageGroup.children);
  imageGroup.children.forEach((img) => {
    if (intersects.length > 0 && intersects[0].object === img) {
      img.scale.lerp(scaleTarget, scaleSpeed);
      img.material.opacity = 0.8;
      hoveredImage = img;
    } else {
      img.scale.lerp(scaleNormal, scaleSpeed);
      img.material.opacity = 1;
    }
  });

  controls.update();
  composer.render();
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
});
