// Import statements will be handled by adding type="module" to your script tag in HTML
// Make sure your script tag looks like: <script type="module" src="script.js"></script>

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// ===== NAVIGATION MENU =====
const menuBtn = document.getElementById("menu-btn");
const navMenu = document.getElementById("nav-menu");
const navcloseBtn = document.getElementById("nav-close-btn");

menuBtn.addEventListener("click", () => {
  navMenu.classList.add("active");
});

navcloseBtn.addEventListener("click", () => {
  navMenu.classList.remove("active");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
    navMenu.classList.remove("active");
  }
});
disconnectButton.addEventListener("click", () => {
  disconnectWallet();
  navMenu.classList.remove("active");
});
window.addEventListener("scroll", () => {
  if (window.scrollY > 10) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

menuBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});
// Footer
document.getElementById("current-year").textContent = new Date().getFullYear();

function init() {
  // ====== RENDERER SETUP ======
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000); // Black background
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // Enable shadows if desired
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.getElementById("three-container");
  container.appendChild(renderer.domElement);

  // ====== SCENE ======
  const scene = new THREE.Scene();

  // Load HDR environment map
  // new RGBELoader()
  //   .load('background.hdr', function(texture) {
  //     texture.mapping = THREE.EquirectangularReflectionMapping;
  //     scene.environment = texture;
  //     scene.background = texture;
  //   });

  // ====== CAMERA ======
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 2, 8);

  // ====== ORBIT CONTROLS ======
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 20;
  controls.autoRotate = false; // If you want OrbitControls to auto‐rotate, set true
  controls.target.set(0, 1, 0);
  controls.update();

  // ====== LIGHTS ======
  // 1) Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  // 2) Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // ====== LOAD DIAMOND MODEL ======
  let diamond = null;
  const loader = new GLTFLoader();

  // Update path as needed. If your diamond is in "public/diamond/scene.gltf":
  loader.load(
    "diamond/scene.gltf",
    (gltf) => {
      diamond = gltf.scene;

      // Scale factor for mobile vs desktop
      const scaleFactor = window.innerWidth < 768 ? 1.5 : 2;
      diamond.scale.set(scaleFactor, scaleFactor, scaleFactor);
      diamond.position.set(0, 1, 0); // slightly above ground

      // Crystal white diamond material
      const diamondMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.4,
        ior: 2.4,
        specularIntensity: 2.0,
        clearcoat: 1.2,
        clearcoatRoughness: 0.1,
        envMapIntensity: 2.5,
        transparent: true,
        opacity: 0.95,
        attenuationColor: new THREE.Color(1.0, 1.0, 1.0),
        attenuationDistance: 0.3,
      });
      // Apply to all meshes in the glTF
      diamond.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = diamondMaterial;
        }
      });

      scene.add(diamond);
    },
    undefined,
    (error) => {
      console.error("Error loading diamond model:", error);
    }
  );

  // ====== DIAMOND AUTO‐ROTATION + MOUSE/TILT ======
  let autoRotateSpeed = window.innerWidth < 768 ? 0.008 : 0.01;
  let rotationX = 0;
  let rotationY = 0;
  let rotationDirection = 1;
  let rotationTimer = 0;

  // Mouse/touch handler
  function handleInteraction(event) {
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const { innerWidth, innerHeight } = window;
    const mouseX = (clientX / innerWidth) * 2 - 1;
    const mouseY = -(clientY / innerHeight) * 2 + 1;

    // These become target rotations
    rotationX = mouseY * Math.PI * 0.5;
    rotationY = mouseX * Math.PI * 0.5;
  }

  window.addEventListener("touchmove", handleInteraction);

  // ====== RESIZE HANDLER ======
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ====== ANIMATION LOOP ======
  function animate() {
    requestAnimationFrame(animate);

    // If diamond is loaded, auto‐rotate + mouse tilt
    if (diamond) {
      rotationTimer += 0.01;
      if (rotationTimer > Math.PI) {
        rotationDirection *= -1;
        rotationTimer = 0;
      }

      // Basic slow auto‐rotation
      diamond.rotation.x += autoRotateSpeed / 2;
      diamond.rotation.y += autoRotateSpeed * rotationDirection;
      diamond.rotation.z += autoRotateSpeed / 3;

      // Lerp diamond rotation to the mouse/touch target
      diamond.rotation.x += 0.05 * (rotationX - diamond.rotation.x);
      diamond.rotation.y += 0.05 * (rotationY - diamond.rotation.y);
    }

    // Update OrbitControls (if used)
    controls.update();

    // Render
    renderer.render(scene, camera);
  }
  animate();
}

init();

/*=============== SHOW MODAL ===============*/
const showModal = (openButton, modalContent) => {
  const openBtn = document.getElementById(openButton),
    modalContainer = document.getElementById(modalContent);

  if (openBtn && modalContainer) {
    openBtn.addEventListener("click", () => {
      modalContainer.classList.add("show-modal");
    });
  }
};
showModal("open-modal", "modal-container");

/*=============== CLOSE MODAL ===============*/
const closeBtn = document.querySelectorAll(".close-modal");

function closeModal() {
  const modalContainer = document.getElementById("modal-container");
  modalContainer.classList.remove("show-modal");
}
closeBtn.forEach((c) => c.addEventListener("click", closeModal));

// Add functionality to update character count
const input = document.querySelector(".search-input");
const charCount = document.querySelector(".char-count");

input.addEventListener("input", function () {
  charCount.textContent = `${this.value.length}/48`;
});
