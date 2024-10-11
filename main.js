import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// Create the scene with a dark background
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');  // Dark background

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4,0,0);  // Initial camera position

// Load the moon texture
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('assets/moon.jpg');  // Replace with your actual texture path

// Create the geometry and material for the sphere with the moon texture
const geometry = new THREE.SphereGeometry(2, 64, 64); // Sphere with radius 2 and high segments for smoothness
const material = new THREE.MeshPhongMaterial({
  map: moonTexture,  // Apply the moon texture
  shininess: 50,    // Keep some shininess to enhance material appearance
  emissive: new THREE.Color('#333333'),  // Soft emissive glow
  emissiveIntensity: 0.2,  // Low glow intensity
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Add soft ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);  // Bright ambient light (white, full intensity)
scene.add(ambientLight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the stars in the background
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

  const starCount = 5000; // Number of stars
  const starPositions = new Float32Array(starCount * 3); // Each star needs x, y, z

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = (Math.random() - 0.5) * 2000; // Random x position
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Random y position
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // Random z position
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

createStars(); // Call the function to create stars

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Enable damping (inertia)
controls.dampingFactor = 0.05;  // Damping factor for smoother movement
controls.maxDistance = 150;  // Max zoom-out distance
controls.minDistance = 3;   // Min zoom-in distance

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update OrbitControls and apply damping
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

animate();

// Make the scene responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();  // Must call this after updating the aspect ratio
  renderer.setSize(window.innerWidth, window.innerHeight);
});
