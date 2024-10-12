import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/postprocessing/UnrealBloomPass.js';

// Create the scene with a dark background
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000'); // Dark background

// Set up the camera and move it closer to the image sphere
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4); // Camera is closer to the sphere

// Load the moon texture
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('assets/moon.jpg');

// Create the geometry and material for the sphere (moon)
const geometry = new THREE.SphereGeometry(2, 64, 64);
const material = new THREE.MeshPhongMaterial({
  map: moonTexture,
  shininess: 100,
  emissive: 0xff0000,
  emissiveIntensity: 0.1,
});

const moon = new THREE.Mesh(geometry, material);
scene.add(moon);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the Effect Composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add UnrealBloomPass for chromatic aberration
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 1, 0.2); // Adjust parameters as needed
composer.addPass(bloomPass);

// Create the stars in the background
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

  const starCount = 5000;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = (Math.random() - 0.5) * 2000; // Random x
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Random y
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // Random z
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

createStars(); // Add the stars to the scene

// OrbitControls setup (disabling zoom)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.025; // Halved damping factor for slower drag speed
controls.enableZoom = false; // Disable zooming

// Limit vertical dragging
controls.minPolarAngle = Math.PI / 2.7; // 30 degrees from the vertical
controls.maxPolarAngle = (5 * Math.PI) / 8; // 150 degrees from the vertical

// Create a group for images attached to an imaginary sphere around the moon
const imageGroup = new THREE.Group();
scene.add(imageGroup); // This group will stay static around the moon

// Function to create an image plane and attach it to the image group
function attachImageToGroup(imagePath, position) {
  textureLoader.load(imagePath, function (texture) {
    const imgWidth = texture.image.width;
    const imgHeight = texture.image.height;

    const aspectRatio = imgWidth / imgHeight;
    const planeHeight = 0.4; // Reduced height for the plane to fit more images
    const planeWidth = planeHeight * aspectRatio;

    const imgGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Create a material for the image with clipping planes
    const imgMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
    imgMesh.position.copy(position); // Set the position in 3D space

    // Calculate the normal vector by pointing the image away from the sphere's center
    imgMesh.lookAt(new THREE.Vector3(0, 0, 0)); // Point the normal away from the center of the sphere

    imageGroup.add(imgMesh); // Add to the image group

    // Set the initial scale for hover effect
    imgMesh.scale.set(1, 1, 1);
  });
}

// Define parameters for the imaginary sphere and image grid
const sphereRadius = 3.3; // Sphere radius larger than the moon
const rows = 15; // Increased number of rows for higher resolution
const columns = 30; // Increased number of columns for higher resolution
const imagePaths = ['assets/images1.jpg', 'assets/images2.jpg', 'assets/images3.jpg']; // Add more paths as needed

// Calculate positions for the images on the surface of the sphere
for (let row = 0; row < rows; row++) {
  const theta = Math.PI * (row / (rows - 1)); // Angle from top to bottom
  for (let col = 0; col < columns; col++) {
    const phi = 2 * Math.PI * (col / columns); // Angle around the sphere
    const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
    const y = sphereRadius * Math.cos(theta);
    const z = sphereRadius * Math.sin(theta) * Math.sin(phi);
    const position = new THREE.Vector3(x, y, z);

    // Attach an image at this position
    const imagePath = imagePaths[col % imagePaths.length]; // Cycle through image paths
    attachImageToGroup(imagePath, position);
  }
}

// Set up raycaster and mouse vector for hover effect
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredImage = null;

// Event listener for mouse movement
window.addEventListener('mousemove', (event) => {
  // Normalize mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Variables for spring damping effect
const scaleTarget = new THREE.Vector3(1, 1, 1); // Target scale
const scaleCurrent = new THREE.Vector3(1, 1, 1); // Current scale
const scaleSpeed = 0.05; // Speed of scaling

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the moon
  moon.rotation.y += 0.001;

  // Update the visibility of the images based on camera position
  imageGroup.children.forEach(imgMesh => {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection); // Get the direction the camera is facing

    // Calculate the distance from the image to the camera
    const distance = imgMesh.position.distanceTo(camera.position);

    // Calculate the dot product between the camera direction and the vector from the camera to the image
    const vectorToImage = new THREE.Vector3().subVectors(imgMesh.position, camera.position);
    const dotProduct = cameraDirection.dot(vectorToImage.normalize());

    // If the dot product is less than 0, the image is behind the camera; otherwise, it's in front
    if (dotProduct < 0 || distance > sphereRadius) {
      imgMesh.visible = false; // Hide the image
    } else {
      imgMesh.visible = true; // Show the image
    }
  });

  // Raycasting to detect hover over images
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(imageGroup.children);

  // Reset the hovered image scale target
  if (hoveredImage) {
    scaleTarget.set(1.1, 1.1, 1.1); // Scale up target
  } else {
    scaleTarget.set(1, 1, 1); // Reset to original scale
  }

  // Check for hover effect on images
  if (intersects.length > 0) {
    hoveredImage = intersects[0].object; // Set the hovered image
    scaleTarget.set(1.1, 1.1, 1.1); // Scale up target
  } else {
    hoveredImage = null; // No hovered image
  }

  // Interpolate current scale towards target scale
  scaleCurrent.x += (scaleTarget.x - scaleCurrent.x) * scaleSpeed;
  scaleCurrent.y += (scaleTarget.y - scaleCurrent.y) * scaleSpeed;
  scaleCurrent.z += (scaleTarget.z - scaleCurrent.z) * scaleSpeed;

  // Apply the current scale to the hovered image
  if (hoveredImage) {
    hoveredImage.scale.copy(scaleCurrent);
    hoveredImage.material.opacity = 0.8; // Slightly transparent on hover
  } else {
    // Reset scale and opacity for non-hovered images
    imageGroup.children.forEach(imgMesh => {
      imgMesh.scale.set(1, 1, 1); // Reset scale
      imgMesh.material.opacity = 1; // Reset opacity
    });
  }

  // Update OrbitControls and apply damping
  controls.update();

  // Render the scene using the composer
  composer.render();
}

// Start the animation
animate();

// Make the renderer responsive to window resizing
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
