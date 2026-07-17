import { CONFIG } from './config.js';
import { hslToRgb } from './utils.js';

let lights = {};

export function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x0a0a0a, 0.3);
    scene.add(ambientLight);

    lights.pointLight1 = new THREE.PointLight(0xff00ff, 3, 2000);
    lights.pointLight1.position.set(500, -400, 600);
    scene.add(lights.pointLight1);

    lights.pointLight2 = new THREE.PointLight(0x00ffff, 3, 2000);
    lights.pointLight2.position.set(-500, 400, -600);
    scene.add(lights.pointLight2);

    lights.pointLight3 = new THREE.PointLight(0xff0088, 2.5, 1500);
    lights.pointLight3.position.set(0, 500, 400);
    scene.add(lights.pointLight3);

    lights.accentLight1 = new THREE.PointLight(0xffaa00, 1.5, 1000);
    lights.accentLight1.position.set(300, 0, -400);
    scene.add(lights.accentLight1);

    lights.accentLight2 = new THREE.PointLight(0x00ffaa, 1.5, 1000);
    lights.accentLight2.position.set(-300, -300, 300);
    scene.add(lights.accentLight2);

    return lights;
}

export function updateLighting(currentScheme) {
    let scheme = CONFIG.colorSchemes[currentScheme];

    const rgb1 = hslToRgb(scheme.hueRange[0], 95, 70);
    const rgb2 = hslToRgb(scheme.hueRange[1] % 360, 95, 70);
    const rgbMid = hslToRgb(((scheme.hueRange[0] + scheme.hueRange[1]) / 2) % 360, 90, 65);
    const rgbComplement = hslToRgb((scheme.hueRange[0] + 180) % 360, 85, 65);
    const rgbAnalogous = hslToRgb((scheme.hueRange[1] + 40) % 360, 85, 65);

    lights.pointLight1.color = new THREE.Color(rgb1.r, rgb1.g, rgb1.b);
    lights.pointLight2.color = new THREE.Color(rgb2.r, rgb2.g, rgb2.b);
    lights.pointLight3.color = new THREE.Color(rgbMid.r, rgbMid.g, rgbMid.b);

    if (lights.accentLight1) {
        lights.accentLight1.color = new THREE.Color(rgbComplement.r, rgbComplement.g, rgbComplement.b);
    }
    if (lights.accentLight2) {
        lights.accentLight2.color = new THREE.Color(rgbAnalogous.r, rgbAnalogous.g, rgbAnalogous.b);
    }
}

export function animateLights(time) {
    if (lights.pointLight1) {
        lights.pointLight1.position.x = Math.sin(time * 0.08) * 500 + 200;
        lights.pointLight1.position.z = Math.cos(time * 0.06) * 400 + 300;
    }
    if (lights.pointLight2) {
        lights.pointLight2.position.x = Math.cos(time * 0.07) * 500 - 200;
        lights.pointLight2.position.z = Math.sin(time * 0.09) * 400 - 300;
    }
    if (lights.pointLight3) {
        lights.pointLight3.position.y = Math.sin(time * 0.05) * 300 + 400;
    }
    if (lights.accentLight1) {
        lights.accentLight1.position.x = Math.cos(time * 0.1) * 350;
        lights.accentLight1.position.y = Math.sin(time * 0.08) * 250;
    }
    if (lights.accentLight2) {
        lights.accentLight2.position.x = Math.sin(time * 0.09) * -350;
        lights.accentLight2.position.z = Math.cos(time * 0.07) * 300;
    }
}
