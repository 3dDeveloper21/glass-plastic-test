import "./style.css";
// import * as THREE from 'three';
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  IcosahedronGeometry,
  MeshNormalMaterial,
  Mesh,
  MeshPhysicalMaterial,
  Color,
  DirectionalLight,
  PlaneGeometry,
  MeshBasicMaterial,
  TextureLoader,
  SphereGeometry,
  EquirectangularReflectionMapping,
  ReinhardToneMapping,
  ACESFilmicToneMapping,
  Vector2,
  Clock,
} from "three";
import { GUI } from "dat.gui";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * Base - START
 */
const gui = new GUI();
let composer;
const textureLoader = new TextureLoader();
const normalMapTexture = textureLoader.load("./textures/normal.jpg");

// bloom settings
const params = {
  exposure: 1,
  bloomStrength: 1.5,
  bloomThreshold: 0.9,
  bloomRadius: 0.33,
};

// domEL - canvas
const canvas = document.querySelector("#canvas");

// sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Scene
const scene = new Scene();
scene.background = new Color(0x808080);

// Camera
const camera = new PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 0, 3);
scene.add(camera);

// Renderer
const renderer = new WebGLRenderer({
  antialias: true,
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.toneMapping = ACESFilmicToneMapping;

const controls = new OrbitControls(camera, canvas);
controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 1;
controls.maxDistance = 10;

// bloompass
const renderScene = new RenderPass(scene, camera);

const unrealBloomPass = new UnrealBloomPass(
  new Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
unrealBloomPass.threshold = params.bloomThreshold;
unrealBloomPass.strength = params.bloomStrength;
unrealBloomPass.radius = params.bloomRadius;

composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(unrealBloomPass);

gui.add(unrealBloomPass, "enabled");
gui.add(unrealBloomPass, "strength").min(0).max(2).step(0.001);
gui.add(unrealBloomPass, "radius").min(0).max(2).step(0.001);
gui.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001);

/**
 * Base - END
 */
// HDR
const hdrEquirect = new RGBELoader().load(
  "./textures/empty_warehouse_01_4k.hdr",
  () => {
    hdrEquirect.mapping = EquirectangularReflectionMapping;
  }
);

/**
 * Geometry - START
 */
// glass-plastic shape
const geometry = new IcosahedronGeometry(0.5, 0);
const material = new MeshPhysicalMaterial({
  metalness: 0,
  roughness: 0.15, // 0-0.15 and higher 0.65+, best to tweak once scene is established due to camera rendering distance does the calulation for the roughness
  transmission: 1, // Add transparency
  thickness: 0.5, // Add refraction
  envMap: hdrEquirect,
  normalMap: normalMapTexture,
  clearcoatNormalMap: normalMapTexture,
});
const icosGeo = new Mesh(geometry, material);
scene.add(icosGeo);

// sphere
const sphere = new Mesh(
  new SphereGeometry(0.5, 32, 32),
  new MeshPhysicalMaterial({
    metalness: 0,
    roughness: 0.15,
    transmission: 1,
    thickness: 0.5,
    envMap: hdrEquirect,
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
  })
);
sphere.position.x = 1.25;
scene.add(sphere);

// plane back drop
const bgTexture = new TextureLoader().load("./textures/color.jpg");
const bgGeometry = new PlaneGeometry(5, 5);
const bgMaterial = new MeshBasicMaterial({ map: bgTexture });
const bgMesh = new Mesh(bgGeometry, bgMaterial);
bgMesh.position.set(0, 0, -1);
scene.add(bgMesh);
camera.lookAt(bgMesh.position);

/**
 * Geometry - END
 */

/**
 * Lighting - START
 */
const light = new DirectionalLight(0xfff0dd, 1);
light.position.set(0, 5, 10);
scene.add(light);
/**
 * Lighting - END
 */
/**
 * Resize - START
 */
window.addEventListener("resize", () => {
  // update sizes.width and sizes.height
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // camera aspect ratio
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // renderer set size
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
});
/**
 * Resze - END
 */

/**
 * Game loop - START
 */
const gameLoop = () => {
  const delta = new Clock();
  // icosGeo.rotation.x = delta * 0.001;
  // renderer.render(scene, camera);
  composer.render();
  requestAnimationFrame(gameLoop);
};

gameLoop();
/**
 * Game loop - END
 */
