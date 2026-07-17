import { CONFIG } from './config.js';
import { randomSeed, seededRandom, noise } from './utils.js';

export const world = {
    flowField: [],
    cols: 0,
    rows: 0,
    depth: 0,
    vortexCenters: [],
    attractionPoints: [],
    gravitationalBodies: [],
    orbitalRings: [],
    waveGenerators: [],
    blackHole: null,
    accretionDisc: null,
    movementType: 0
};

export function generateFlowField(seed) {
    randomSeed(seed);
    world.flowField = [];

    world.cols = Math.floor(window.innerWidth / CONFIG.resolution) + 2;
    world.rows = Math.floor(window.innerHeight / CONFIG.resolution) + 2;
    world.depth = Math.floor(700 / CONFIG.resolution);

    for (let z = 0; z < world.depth; z++) {
        for (let y = 0; y < world.rows; y++) {
            for (let x = 0; x < world.cols; x++) {
                let angle1 = noise(x * CONFIG.noiseScale * 2, y * CONFIG.noiseScale * 2, z * CONFIG.noiseScale * 2 + seed) * Math.PI * 2 * 4;
                let angle2 = noise(x * CONFIG.noiseScale * 2 + 1000, y * CONFIG.noiseScale * 2 + 1000, z * CONFIG.noiseScale * 2 + seed) * Math.PI * 2 * 2;

                let v = new THREE.Vector3(
                    Math.sin(angle1) * Math.cos(angle2),
                    Math.sin(angle1) * Math.sin(angle2),
                    Math.cos(angle1)
                );
                v.normalize();
                v.multiplyScalar(0.5);
                world.flowField.push(v);
            }
        }
    }
}

export function initializeDynamicForces(seed) {
    randomSeed(seed);

    world.gravitationalBodies = [];
    for (let i = 0; i < 3; i++) {
        world.gravitationalBodies.push({
            pos: new THREE.Vector3(
                seededRandom(-250, 250),
                seededRandom(-250, 250),
                seededRandom(-200, 200)
            ),
            mass: seededRandom(500, 2000),
            radius: seededRandom(100, 300),
            orbitSpeed: seededRandom(0.01, 0.03),
            orbitRadius: seededRandom(150, 300),
            orbitPhase: seededRandom(0, Math.PI * 2)
        });
    }

    world.blackHole = {
        pos: new THREE.Vector3(0, 0, 0),
        mass: 3000,
        eventHorizon: 50,
        ergoSphere: 100,
        spin: 0.8,
        jetStrength: 1.2
    };

    world.accretionDisc = {
        innerRadius: world.blackHole.eventHorizon * 3,
        outerRadius: 350,
        thickness: 40,
        rotationSpeed: 0.02,
        temperature: 1.0
    };

    world.orbitalRings = [];
    for (let i = 0; i < 2; i++) {
        world.orbitalRings.push({
            center: new THREE.Vector3(
                seededRandom(-150, 150),
                seededRandom(-150, 150),
                seededRandom(-100, 100)
            ),
            radius: seededRandom(200, 400),
            thickness: seededRandom(40, 100),
            strength: seededRandom(0.3, 0.8),
            rotationSpeed: seededRandom(0.005, 0.015),
            axis: new THREE.Vector3(
                seededRandom(-1, 1),
                seededRandom(-1, 1),
                seededRandom(-1, 1)
            ).normalize()
        });
    }

    world.waveGenerators = [];
    for (let i = 0; i < 4; i++) {
        world.waveGenerators.push({
            pos: new THREE.Vector3(
                seededRandom(-300, 300),
                seededRandom(-300, 300),
                seededRandom(-200, 200)
            ),
            frequency: seededRandom(0.002, 0.008),
            amplitude: seededRandom(20, 60),
            speed: seededRandom(0.02, 0.05),
            phase: seededRandom(0, Math.PI * 2)
        });
    }

    world.vortexCenters = [];
    for (let i = 0; i < 2; i++) {
        world.vortexCenters.push({
            pos: new THREE.Vector3(
                seededRandom(-150, 150),
                seededRandom(-150, 150),
                seededRandom(-100, 100)
            ),
            radius: seededRandom(250, 450),
            strength: seededRandom(0.5, 1.2),
            speed: seededRandom(0.01, 0.025)
        });
    }
}

export function selectMovementType(seed) {
    randomSeed(seed);
    world.movementType = Math.floor(seededRandom(0, CONFIG.movementTypes.length));
}

export function updateWorld(time) {
    for (let i = 0; i < world.gravitationalBodies.length; i++) {
        let body = world.gravitationalBodies[i];
        body.orbitPhase += body.orbitSpeed;
        body.pos.x = Math.cos(body.orbitPhase) * body.orbitRadius;
        body.pos.y = Math.sin(body.orbitPhase) * body.orbitRadius * 0.7;
        body.pos.z = Math.sin(body.orbitPhase * 0.5) * body.orbitRadius * 0.5;
    }

    for (let ring of world.orbitalRings) {
        let angle = time * ring.rotationSpeed;
        let rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationAxis(ring.axis, angle);
    }

    for (let i = 0; i < world.waveGenerators.length; i++) {
        let wave = world.waveGenerators[i];
        wave.phase += wave.speed * 0.1;
        let waveAngle = time * wave.speed + i * Math.PI / 2;
        wave.pos.x = Math.cos(waveAngle) * 200;
        wave.pos.y = Math.sin(waveAngle) * 200;
        wave.pos.z = Math.sin(waveAngle * 0.3) * 150;
    }

    for (let vortex of world.vortexCenters) {
        vortex.pos.x += Math.sin(time * vortex.speed) * 0.3;
        vortex.pos.y += Math.cos(time * vortex.speed) * 0.3;
    }
}
