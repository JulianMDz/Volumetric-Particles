let infoVisible = true;

export function updateSeedDisplay(seed) {
    const el = document.getElementById('seed-display');
    if (el) el.textContent = `Seed: ${seed}`;
}

export function updateColorSchemeDisplay(name) {
    const el = document.getElementById('color-scheme');
    if (el) el.textContent = `Scheme: ${name}`;
}

export function updateTurbulenceDisplay(value) {
    const el = document.getElementById('turbulence-display');
    if (el) el.textContent = `Turbulence: ${value.toFixed(2)}`;
}

export function updateMovementDisplay(type) {
    const el = document.getElementById('movement-display');
    if (el) el.textContent = `Physics: ${type}`;
}

export function updateCameraDisplay(text) {
    const el = document.getElementById('camera-display');
    if (el) el.innerHTML = text;
}

export function updateTrailDisplay(enabled) {
    const el = document.getElementById('trail-display');
    if (el) el.textContent = `Trails: ${enabled ? 'ON' : 'OFF'}`;
}

export function updateFPS(fps) {
    const el = document.getElementById('fps');
    if (el) el.textContent = `FPS: ${fps}`;
}

export function isInfoVisible() {
    return infoVisible;
}

export function toggleInfo() {
    infoVisible = !infoVisible;
    const panel = document.getElementById('info');
    const toggleBtn = document.getElementById('info-toggle');

    if (panel) {
        panel.classList.toggle('hidden', !infoVisible);
    }
    if (toggleBtn) {
        toggleBtn.style.display = infoVisible ? 'none' : 'flex';
    }
    return infoVisible;
}

export function setupInfoToggle() {
    const toggleBtn = document.getElementById('info-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleInfo);
    }
}
