import { CONFIG } from './config.js';

export const cameraState = {
    distance: CONFIG.cameraDistance,
    angle: CONFIG.cameraAngle,
    height: CONFIG.cameraHeight,
    speed: CONFIG.cameraSpeed,
    autoOrbit: CONFIG.autoOrbit,
    isDragging: false,
    previousMouseX: 0
};

export function updateCameraPosition(camera, state, time) {
    if (state.autoOrbit) {
        state.angle += state.speed * 0.01;
    }

    let distanceVariation = Math.sin(time * 0.08) * 100;
    let heightVariation = Math.sin(time * 0.05) * 150;

    camera.position.x = Math.cos(state.angle) * (state.distance + distanceVariation);
    camera.position.y = state.height + heightVariation;
    camera.position.z = Math.sin(state.angle) * (state.distance + distanceVariation);

    let lookAtOffset = new THREE.Vector3(
        Math.sin(time * 0.03) * 20,
        Math.cos(time * 0.025) * 15,
        0
    );
    camera.lookAt(lookAtOffset);
}

export function onMouseDown(event, state) {
    state.isDragging = true;
    state.previousMouseX = event.clientX;
    state.autoOrbit = false;
}

export function onMouseUp(state) {
    state.isDragging = false;
}

export function onMouseMove(event, state, mouseNormalized) {
    mouseNormalized.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNormalized.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (state.isDragging) {
        const deltaX = event.clientX - state.previousMouseX;
        state.angle -= deltaX * 0.005;
        state.previousMouseX = event.clientX;
    }
}

export function getCameraDisplayText(state) {
    return `Orbit: ${state.autoOrbit ? 'ON' : 'OFF'} | Speed: ${state.speed.toFixed(2)} | Dist: ${Math.round(state.distance)}`;
}
