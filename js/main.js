import { CONFIG } from './config.js';
import { randomSeed, seededRandom } from './utils.js';
import { Particle } from './particle.js';
import { world, generateFlowField, initializeDynamicForces, selectMovementType, updateWorld } from './world.js';
import { setupLighting, updateLighting, animateLights } from './lighting.js';
import { cameraState, updateCameraPosition, onMouseDown as camMouseDown, onMouseUp as camMouseUp, onMouseMove as camMouseMove, getCameraDisplayText } from './camera.js';
import { updateSeedDisplay, updateColorSchemeDisplay, updateTurbulenceDisplay, updateMovementDisplay, updateCameraDisplay, updateTrailDisplay, updateFPS, toggleInfo, setupInfoToggle } from './ui.js';

let scene, camera, renderer;
let particles = [];
let currentSeed = 0;
let currentScheme = 0;
let time = 0;
let frameCount = 0;
let lastTime = Date.now();
let mouse = { x: 0, y: 0 };
let mouseNormalized = { x: 0, y: 0 };
let autoRegenerate = false;
let regenerateTimer = 0;
let trailEnabled = CONFIG.trailEnabled;

function generateParticles(seed) {
    randomSeed(seed);

    particles.forEach(p => p.dispose(scene));
    particles = [];

    let particlesPerLayer = Math.floor(CONFIG.numParticles / CONFIG.depthLayers);

    for (let layer = 0; layer < CONFIG.depthLayers; layer++) {
        let layerRadius = 100 + (layer * 80);
        let layerDensity = 1 - (layer * 0.15);
        let particlesInLayer = Math.floor(particlesPerLayer * layerDensity);

        for (let i = 0; i < particlesInLayer; i++) {
            let theta = seededRandom(0, Math.PI * 2);
            let phi = Math.acos(seededRandom(-1, 1));

            let r = Math.pow(seededRandom(), 0.6) * layerRadius;

            if (seededRandom() < 0.3) {
                r *= 0.5;
            }

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            x += (seededRandom() - 0.5) * 40;
            y += (seededRandom() - 0.5) * 40;
            z += (seededRandom() - 0.5) * 40;

            let particle = new Particle(x, y, z, seed + i * 0.01, layer, scene, CONFIG.colorSchemes, currentScheme);
            particles.push(particle);
        }
    }

    console.log(`Generated ${particles.length} particles in ${CONFIG.depthLayers} layers`);
}

function regenerate(newSeed) {
    currentSeed = newSeed;
    randomSeed(newSeed);
    generateFlowField(currentSeed);
    generateParticles(currentSeed);
    initializeDynamicForces(currentSeed);
    selectMovementType(currentSeed);
    time = 0;
    updateSeedDisplay(currentSeed);
    updateLighting(currentScheme);
    updateMovementDisplay(CONFIG.movementTypes[world.movementType]);
}

function toggleTrails() {
    trailEnabled = !trailEnabled;
    particles.forEach(p => p.setTrailVisible(trailEnabled));
    updateTrailDisplay(trailEnabled);
}

function changeColorScheme() {
    currentScheme = (currentScheme + 1) % CONFIG.colorSchemes.length;
    particles.forEach(p => p.setColorSchemeIndex(currentScheme));
    updateColorSchemeDisplay(CONFIG.colorSchemes[currentScheme].name);
    updateLighting(currentScheme);
}

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0005);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        3000
    );
    camera.position.set(
        Math.cos(cameraState.angle) * cameraState.distance,
        cameraState.height,
        Math.sin(cameraState.angle) * cameraState.distance
    );
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    setupLighting(scene);

    currentSeed = Math.floor(Math.random() * 10000);
    regenerate(currentSeed);
    updateCameraDisplay(getCameraDisplayText(cameraState));
    updateTrailDisplay(trailEnabled);
    setupInfoToggle();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);

    animate();
}

function updateLightingForScheme() {
    updateLighting(currentScheme);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    regenerate(currentSeed);
}

function onMouseMove(event) {
    mouseNormalized.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNormalized.y = -(event.clientY / window.innerHeight) * 2 + 1;

    mouse.x = (event.clientX - window.innerWidth / 2);
    mouse.y = -(event.clientY - window.innerHeight / 2);

    camMouseMove(event, cameraState, mouseNormalized);
}

function onMouseDown(event) {
    camMouseDown(event, cameraState);
}

function onMouseUp() {
    camMouseUp(cameraState);
}

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            cameraState.distance = Math.max(200, cameraState.distance - 50);
            updateCameraDisplay(getCameraDisplayText(cameraState));
            break;
        case 'ArrowDown':
            cameraState.distance = Math.min(1000, cameraState.distance + 50);
            updateCameraDisplay(getCameraDisplayText(cameraState));
            break;
        case 'ArrowLeft':
            cameraState.speed = Math.max(0.05, cameraState.speed - 0.02);
            updateCameraDisplay(getCameraDisplayText(cameraState));
            break;
        case 'ArrowRight':
            cameraState.speed = Math.min(0.5, cameraState.speed + 0.02);
            updateCameraDisplay(getCameraDisplayText(cameraState));
            break;
        case 'r':
        case 'R':
            regenerate(Math.floor(Math.random() * 10000));
            break;
        case ' ':
            cameraState.autoOrbit = !cameraState.autoOrbit;
            updateCameraDisplay(getCameraDisplayText(cameraState));
            break;
        case 'o':
        case 'O':
            autoRegenerate = !autoRegenerate;
            regenerateTimer = 0;
            break;
        case 't':
        case 'T':
            toggleTrails();
            break;
        case '+':
        case '=':
            CONFIG.turbulence += 0.1;
            CONFIG.turbulence = Math.min(CONFIG.turbulence, 2.5);
            updateTurbulenceDisplay(CONFIG.turbulence);
            break;
        case '-':
        case '_':
            CONFIG.turbulence -= 0.1;
            CONFIG.turbulence = Math.max(CONFIG.turbulence, 0.2);
            updateTurbulenceDisplay(CONFIG.turbulence);
            break;
        case 'c':
        case 'C':
            changeColorScheme();
            break;
        case 'h':
        case 'H':
            toggleInfo();
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);

    updateCameraPosition(camera, cameraState, time);

    updateWorld(time);

    for (let i = 0; i < particles.length; i++) {
        if (particles[i]) {
            particles[i].update(time, world, mouse);
        }
    }

    if (frameCount % 30 === 0) {
        for (let i = 0; i < particles.length; i++) {
            if (particles[i]) {
                particles[i].updateNeighborCount(particles);
            }
        }
    }

    animateLights(time);

    time += 0.008;

    if (autoRegenerate) {
        regenerateTimer++;
        if (regenerateTimer >= CONFIG.regenerateInterval) {
            regenerate(Math.floor(Math.random() * 10000));
            regenerateTimer = 0;
        }
    }

    frameCount++;
    const currentTime = Date.now();
    if (currentTime - lastTime >= 1000) {
        updateFPS(frameCount);
        frameCount = 0;
        lastTime = currentTime;
    }

    renderer.render(scene, camera);
}

window.addEventListener('load', init);
