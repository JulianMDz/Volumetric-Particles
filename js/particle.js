import { CONFIG } from './config.js';
import { seededRandom, noise, hslToRgb } from './utils.js';

export class Particle {
    constructor(x, y, z, seed, layer, scene, colorSchemes, currentSchemeIndex) {
        this.pos = new THREE.Vector3(x, y, z);
        this.vel = new THREE.Vector3(
            seededRandom(-1, 1),
            seededRandom(-1, 1),
            seededRandom(-1, 1)
        );
        this.acc = new THREE.Vector3(0, 0, 0);
        this.maxSpeed = seededRandom(2, 5);

        let distFromCenter = Math.sqrt(x * x + y * y + z * z);
        let sizeFactor = Math.max(0.3, 1 - (distFromCenter / 400));
        this.size = seededRandom(2, 15) * sizeFactor;

        this.seed = seed;
        this.layer = layer;
        this.damping = seededRandom(0.96, 0.99);
        this.noiseInfluence = seededRandom(0.6, 1.0);
        this.energyLevel = seededRandom(0.5, 1.5);
        this.neighborCount = 0;
        this.glowIntensity = 1.0;

        this.positionHistory = [];
        this.trailLine = null;
        this.hasTrail = seededRandom() < 0.3;

        this.colorSchemes = colorSchemes;
        this.currentSchemeIndex = currentSchemeIndex;

        this.updateColor();
        this.createMesh(scene);
        if (this.hasTrail && CONFIG.trailEnabled) {
            this.createTrail(scene);
        }
    }

    updateColor() {
        let scheme = this.colorSchemes[this.currentSchemeIndex];
        let noiseVal = noise(this.pos.x * 0.01, this.pos.y * 0.01, this.seed * 0.1);

        let hueOffset = this.layer * 5;
        let energyInfluence = this.energyLevel * 10;

        let hue = noiseVal * (scheme.hueRange[1] - scheme.hueRange[0]) +
                  scheme.hueRange[0] + hueOffset;

        let distFromCenter = this.pos.length();
        let saturationFactor = Math.max(0.7, 1 - (distFromCenter / CONFIG.maxDistance) * 0.5);

        let saturation = seededRandom(scheme.satRange[0], scheme.satRange[1]) * saturationFactor;
        let brightness = seededRandom(scheme.brightRange[0], scheme.brightRange[1]) *
                        this.energyLevel * 0.9;

        this.hue = hue % 360;
        this.saturation = Math.min(100, saturation);
        this.brightness = Math.min(100, brightness);
        this.alpha = seededRandom(0.7, 1.0) * saturationFactor;

        const rgb = hslToRgb(this.hue, this.saturation, this.brightness);
        this.color = new THREE.Color(rgb.r, rgb.g, rgb.b);

        if (this.mesh) {
            this.mesh.material.color = this.color;
            let emissiveIntensity = 0.5 + (this.energyLevel * 0.3);
            this.mesh.material.emissive = new THREE.Color(
                rgb.r * emissiveIntensity,
                rgb.g * emissiveIntensity,
                rgb.b * emissiveIntensity
            );
            this.mesh.material.emissiveIntensity = emissiveIntensity;
        }

        if (this.glow && this.glow.material) {
            let glowColor = new THREE.Color(rgb.r, rgb.g, rgb.b);
            glowColor.lerp(new THREE.Color(1, 1, 1), 0.25);
            this.glow.material.color = glowColor;
        }
    }

    setColorSchemeIndex(index) {
        this.currentSchemeIndex = index;
        this.updateColor();
    }

    createMesh(scene) {
        let segments = this.size > 8 ? 20 : 16;
        const geometry = new THREE.SphereGeometry(this.size, segments, segments);

        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.5 + (this.energyLevel * 0.4),
            shininess: 80 + (this.energyLevel * 40),
            transparent: true,
            opacity: this.alpha,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.pos);

        let glowColor = new THREE.Color(this.color);
        glowColor.lerp(new THREE.Color(1, 1, 1), 0.25);

        let glowSize = this.size > 10 ? 1.8 : (this.size > 6 ? 1.5 : 1.3);
        let baseGlowOpacity = this.size > 10 ? 0.15 : 0.10;

        const glowGeometry = new THREE.SphereGeometry(this.size * glowSize, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: baseGlowOpacity * this.energyLevel * this.glowIntensity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);

        this.glowMaterial = glowMaterial;
        this.baseGlowOpacity = baseGlowOpacity;

        scene.add(this.mesh);
    }

    createTrail(scene) {
        const points = [];
        for (let i = 0; i < CONFIG.trailLength; i++) {
            points.push(new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        this.trailLine = new THREE.Line(geometry, material);
        scene.add(this.trailLine);
    }

    updateTrail(trailEnabled) {
        if (!this.hasTrail || !trailEnabled) return;

        this.positionHistory.unshift(this.pos.clone());

        if (this.positionHistory.length > CONFIG.trailLength) {
            this.positionHistory.pop();
        }

        if (this.trailLine && this.positionHistory.length > 1) {
            const positions = this.trailLine.geometry.attributes.position.array;

            for (let i = 0; i < this.positionHistory.length; i++) {
                const pos = this.positionHistory[i];
                positions[i * 3] = pos.x;
                positions[i * 3 + 1] = pos.y;
                positions[i * 3 + 2] = pos.z;
            }

            for (let i = this.positionHistory.length; i < CONFIG.trailLength; i++) {
                const lastPos = this.positionHistory[this.positionHistory.length - 1];
                positions[i * 3] = lastPos.x;
                positions[i * 3 + 1] = lastPos.y;
                positions[i * 3 + 2] = lastPos.z;
            }

            this.trailLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateNeighborCount(allParticles) {
        this.neighborCount = 0;
        const detectionRadius = this.size * 4;
        const detectionRadiusSq = detectionRadius * detectionRadius;

        const sampleSize = Math.min(50, allParticles.length);
        const step = Math.floor(allParticles.length / sampleSize);

        for (let i = 0; i < allParticles.length; i += step) {
            let other = allParticles[i];
            if (other === this) continue;

            let distSq = this.pos.distanceToSquared(other.pos);
            if (distSq < detectionRadiusSq) {
                this.neighborCount++;
            }
        }

        this.glowIntensity = 1.0 + Math.min(1.0, this.neighborCount * 0.08);

        if (this.glowMaterial) {
            this.glowMaterial.opacity = this.baseGlowOpacity * this.energyLevel * this.glowIntensity;
        }
    }

    setTrailVisible(visible) {
        if (this.trailLine) {
            this.trailLine.visible = visible;
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    follow(flowField, cols, rows, depth, resolution) {
        let x = Math.floor((this.pos.x + window.innerWidth / 2) / resolution);
        let y = Math.floor((this.pos.y + window.innerHeight / 2) / resolution);
        let z = Math.floor((this.pos.z + 300) / resolution);

        x = Math.max(0, Math.min(x, cols - 1));
        y = Math.max(0, Math.min(y, rows - 1));
        z = Math.max(0, Math.min(z, depth - 1));

        let index = x + y * cols + z * cols * rows;
        let force = flowField[index];

        if (force) {
            let forceClone = force.clone();
            forceClone.multiplyScalar(CONFIG.turbulence * 0.7);
            this.applyForce(forceClone);
        }
    }

    applyVortexForces(vortexCenters) {
        for (let vortex of vortexCenters) {
            let diff = new THREE.Vector3().subVectors(vortex.pos, this.pos);
            let dist = diff.length();

            if (dist < vortex.radius && dist > 1) {
                let tangent = new THREE.Vector3().crossVectors(diff, new THREE.Vector3(0, 1, 0));
                tangent.normalize();
                let strength = (1 - dist / vortex.radius) * vortex.strength;
                tangent.multiplyScalar(strength * 0.5);
                this.applyForce(tangent);
            }
        }
    }

    applyGravitationalForces(gravitationalBodies) {
        for (let body of gravitationalBodies) {
            let diff = new THREE.Vector3().subVectors(body.pos, this.pos);
            let distSq = Math.max(diff.lengthSq(), 100);
            let dist = Math.sqrt(distSq);

            let forceMagnitude = body.mass / distSq;

            if (dist < body.radius) {
                forceMagnitude *= 1.5;
            }

            diff.normalize();
            diff.multiplyScalar(forceMagnitude * 0.0008);
            this.applyForce(diff);
        }
    }

    applyOrbitalRingForces(orbitalRings) {
        for (let ring of orbitalRings) {
            let toCenter = new THREE.Vector3().subVectors(this.pos, ring.center);

            let alongAxis = toCenter.dot(ring.axis);
            let perpendicular = new THREE.Vector3().copy(ring.axis).multiplyScalar(alongAxis);
            let inPlane = new THREE.Vector3().subVectors(toCenter, perpendicular);
            let radiusInPlane = inPlane.length();

            let distFromRing = Math.abs(radiusInPlane - ring.radius);
            let heightFromPlane = Math.abs(alongAxis);

            if (distFromRing < ring.thickness && heightFromPlane < ring.thickness) {
                if (radiusInPlane > 0) {
                    let radialForce = new THREE.Vector3().copy(inPlane).normalize();
                    radialForce.multiplyScalar((radiusInPlane - ring.radius) * -0.01 * ring.strength);
                    this.applyForce(radialForce);
                }

                let planeForce = new THREE.Vector3().copy(ring.axis);
                planeForce.multiplyScalar(alongAxis * -0.008 * ring.strength);
                this.applyForce(planeForce);

                let tangent = new THREE.Vector3().crossVectors(ring.axis, inPlane).normalize();
                tangent.multiplyScalar(ring.strength * 0.4);
                this.applyForce(tangent);
            }
        }
    }

    applyWaveForces(waveGenerators, time) {
        let totalWave = new THREE.Vector3(0, 0, 0);

        for (let wave of waveGenerators) {
            let diff = new THREE.Vector3().subVectors(this.pos, wave.pos);
            let dist = diff.length();

            let waveValue = Math.sin(
                dist * wave.frequency -
                time * wave.speed +
                wave.phase
            );

            let waveForce = new THREE.Vector3().copy(diff).normalize();
            waveForce.multiplyScalar(waveValue * wave.amplitude * 0.003);

            totalWave.add(waveForce);
        }

        this.applyForce(totalWave);
    }

    applyAttractionForces() {
    }

    applyMovementForces(movementType, world, time, turbulence) {
        switch (movementType) {
            case 0:
                {
                    this.applyGravitationalForces(world.gravitationalBodies);
                    let toCenter = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    let perpendicular = new THREE.Vector3(-this.pos.y, this.pos.x, this.pos.z * 0.3);
                    perpendicular.normalize();
                    perpendicular.multiplyScalar(0.15 * turbulence);
                    this.applyForce(perpendicular);
                }
                break;

            case 1:
                {
                    this.applyOrbitalRingForces(world.orbitalRings);
                    this.applyGravitationalForces(world.gravitationalBodies);
                }
                break;

            case 2:
                {
                    this.applyWaveForces(world.waveGenerators, time);
                    let toCenter = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    toCenter.normalize();
                    toCenter.multiplyScalar(0.1);
                    this.applyForce(toCenter);
                }
                break;

            case 3:
                {
                    let r = Math.sqrt(this.pos.x * this.pos.x + this.pos.y * this.pos.y);
                    let theta = Math.atan2(this.pos.y, this.pos.x);
                    let spiralAngle = theta + Math.log(r / 100) * 0.5 + time * 0.02;

                    let spiralForce = new THREE.Vector3(
                        Math.cos(spiralAngle) * 0.3,
                        Math.sin(spiralAngle) * 0.3,
                        Math.sin(r * 0.008 + time * 0.015) * 0.2
                    );
                    this.applyForce(spiralForce);

                    let centralForce = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    centralForce.normalize();
                    centralForce.multiplyScalar(0.15);
                    this.applyForce(centralForce);
                }
                break;

            case 4:
                {
                    if (world.gravitationalBodies.length >= 2) {
                        let body1 = world.gravitationalBodies[0];
                        let body2 = world.gravitationalBodies[1];

                        let diff1 = new THREE.Vector3().subVectors(body1.pos, this.pos);
                        let diff2 = new THREE.Vector3().subVectors(body2.pos, this.pos);

                        let dist1Sq = Math.max(diff1.lengthSq(), 100);
                        let dist2Sq = Math.max(diff2.lengthSq(), 100);

                        diff1.normalize().multiplyScalar((body1.mass * 1.5) / dist1Sq * 0.001);
                        diff2.normalize().multiplyScalar((body2.mass * 1.5) / dist2Sq * 0.001);

                        this.applyForce(diff1);
                        this.applyForce(diff2);
                    }

                    let tangent = new THREE.Vector3(-this.pos.y, this.pos.x, 0);
                    tangent.normalize().multiplyScalar(0.2);
                    this.applyForce(tangent);
                }
                break;

            case 5:
                {
                    this.applyGravitationalForces(world.gravitationalBodies);

                    for (let body of world.gravitationalBodies) {
                        let toBody = new THREE.Vector3().subVectors(body.pos, this.pos);
                        let dist = toBody.length();

                        if (dist < body.radius * 2) {
                            let tidalForce = new THREE.Vector3().copy(toBody).normalize();
                            let strength = (1 - dist / (body.radius * 2)) * 0.3;
                            tidalForce.multiplyScalar(strength);
                            this.applyForce(tidalForce);
                        }
                    }
                }
                break;

            case 6:
                {
                    this.applyWaveForces(world.waveGenerators, time);

                    let quantumNoise = new THREE.Vector3(
                        noise(this.pos.x * 0.05, time * 2) - 0.5,
                        noise(this.pos.y * 0.05, time * 2 + 100) - 0.5,
                        noise(this.pos.z * 0.05, time * 2 + 200) - 0.5
                    );
                    quantumNoise.multiplyScalar(0.5 * turbulence);
                    this.applyForce(quantumNoise);

                    let distFromCenter = this.pos.length();
                    if (distFromCenter > CONFIG.maxDistance * 0.6 && Math.random() < 0.01) {
                        let tunnel = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                        tunnel.normalize().multiplyScalar(20);
                        this.applyForce(tunnel);
                    }
                }
                break;

            case 7:
                {
                    this.applyVortexForces(world.vortexCenters);
                    this.applyGravitationalForces(world.gravitationalBodies);

                    let r = Math.sqrt(this.pos.x * this.pos.x + this.pos.y * this.pos.y);
                    let spiralZ = Math.sin(r * 0.01 + time * 0.03) * 0.4;
                    this.applyForce(new THREE.Vector3(0, 0, spiralZ));
                }
                break;

            case 8:
                {
                    let toBH = new THREE.Vector3().subVectors(world.blackHole.pos, this.pos);
                    let distFromBH = toBH.length();

                    if (distFromBH < world.blackHole.eventHorizon) {
                        toBH.normalize().multiplyScalar(5);
                        this.applyForce(toBH);
                    } else {
                        let gravityStrength = (world.blackHole.mass * 2) / Math.max(distFromBH * distFromBH, 100);
                        toBH.normalize().multiplyScalar(gravityStrength * 0.0015);
                        this.applyForce(toBH);

                        let discDistance = Math.sqrt(this.pos.x * this.pos.x + this.pos.y * this.pos.y);
                        if (discDistance > world.accretionDisc.innerRadius &&
                            discDistance < world.accretionDisc.outerRadius &&
                            Math.abs(this.pos.z) < world.accretionDisc.thickness) {

                            let orbitalSpeed = Math.sqrt(world.blackHole.mass / discDistance) * 0.02;
                            let tangential = new THREE.Vector3(-this.pos.y, this.pos.x, 0);
                            tangential.normalize().multiplyScalar(orbitalSpeed);
                            this.applyForce(tangential);

                            let compressionForce = new THREE.Vector3(0, 0, -this.pos.z * 0.02);
                            this.applyForce(compressionForce);
                        }
                    }
                }
                break;

            case 9:
                {
                    let toBH = new THREE.Vector3().subVectors(world.blackHole.pos, this.pos);
                    let distFromBH = toBH.length();

                    if (distFromBH < world.blackHole.ergoSphere) {
                        let frameDrag = new THREE.Vector3(-this.pos.y, this.pos.x, 0);
                        frameDrag.normalize();
                        let dragStrength = (1 - distFromBH / world.blackHole.ergoSphere) * world.blackHole.spin * 0.8;
                        frameDrag.multiplyScalar(dragStrength);
                        this.applyForce(frameDrag);
                    }

                    let angle = Math.abs(Math.atan2(Math.sqrt(this.pos.x * this.pos.x + this.pos.y * this.pos.y), this.pos.z));
                    if (angle < 0.3 || angle > Math.PI - 0.3) {
                        if (distFromBH < world.blackHole.eventHorizon * 3 && distFromBH > world.blackHole.eventHorizon) {
                            let jetForce = new THREE.Vector3(0, 0, this.pos.z > 0 ? 1 : -1);
                            jetForce.multiplyScalar(world.blackHole.jetStrength);
                            this.applyForce(jetForce);
                        }
                    }

                    let gravityStrength = world.blackHole.mass / Math.max(distFromBH * distFromBH, 100);
                    toBH.normalize().multiplyScalar(gravityStrength * 0.002);
                    this.applyForce(toBH);
                }
                break;

            case 10:
                {
                    let distToThroat = this.pos.length();

                    let toThroat = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    let throatStrength = 500 / Math.max(distToThroat * distToThroat, 50);
                    toThroat.normalize().multiplyScalar(throatStrength * 0.002);
                    this.applyForce(toThroat);

                    let spiralForce = new THREE.Vector3(-this.pos.y, this.pos.x, 0);
                    spiralForce.normalize().multiplyScalar(0.5);
                    this.applyForce(spiralForce);

                    if (distToThroat < 150) {
                        let compressionZ = -this.pos.z * 0.015;
                        this.applyForce(new THREE.Vector3(0, 0, compressionZ));
                    }

                    if (distToThroat < 30) {
                        this.pos.multiplyScalar(-0.95);
                        this.vel.multiplyScalar(0.5);
                    }
                }
                break;

            case 11:
                {
                    let r = Math.sqrt(this.pos.x * this.pos.x + this.pos.y * this.pos.y);
                    let theta = Math.atan2(this.pos.y, this.pos.x);
                    let phi = 1.618033988749;

                    let targetTheta = theta + (Math.log(r + 1) / Math.log(phi)) * 0.1 + time * 0.015;
                    let targetR = r * 0.998;

                    let targetX = targetR * Math.cos(targetTheta);
                    let targetY = targetR * Math.sin(targetTheta);

                    let spiralForce = new THREE.Vector3(
                        (targetX - this.pos.x) * 0.05,
                        (targetY - this.pos.y) * 0.05,
                        Math.sin(theta * phi + time * 0.02) * 0.2
                    );
                    this.applyForce(spiralForce);
                }
                break;

            case 12:
                {
                    let sigma = 10, rho = 28, beta = 8 / 3, scale = 0.02;

                    let dx = sigma * (this.pos.y - this.pos.x);
                    let dy = this.pos.x * (rho - this.pos.z) - this.pos.y;
                    let dz = this.pos.x * this.pos.y - beta * this.pos.z;

                    let lorenzForce = new THREE.Vector3(dx, dy, dz);
                    lorenzForce.multiplyScalar(scale * turbulence);
                    this.applyForce(lorenzForce);

                    if (this.pos.length() > 500) {
                        let centerForce = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                        centerForce.normalize().multiplyScalar(0.5);
                        this.applyForce(centerForce);
                    }
                }
                break;

            case 13:
                {
                    let r = this.pos.length();
                    let theta1 = Math.atan2(this.pos.y, this.pos.x);
                    let theta2 = Math.atan2(this.pos.z, r);

                    let omega1 = Math.sin(theta1 + time * 0.05) * 0.3;
                    let omega2 = Math.cos(theta2 + time * 0.07) * 0.3;

                    let pendulumForce = new THREE.Vector3(
                        Math.cos(theta1 + omega1) * 0.4 - this.pos.x * 0.01,
                        Math.sin(theta1 + omega1) * 0.4 - this.pos.y * 0.01,
                        Math.sin(theta2 + omega2) * 0.4 - this.pos.z * 0.01
                    );
                    this.applyForce(pendulumForce);
                }
                break;

            case 14:
                {
                    let scale = 0.003;
                    let zx = this.pos.x * scale;
                    let zy = this.pos.y * scale;

                    let iterations = 5;
                    let zx2 = zx, zy2 = zy;
                    for (let i = 0; i < iterations; i++) {
                        let temp = zx2 * zx2 - zy2 * zy2 + zx;
                        zy2 = 2 * zx2 * zy2 + zy;
                        zx2 = temp;
                    }

                    let mandelbrotForce = new THREE.Vector3(
                        (zx2 - this.pos.x * scale) * 20,
                        (zy2 - this.pos.y * scale) * 20,
                        Math.sin(zx2 * zy2 * 10 + time * 0.02) * 0.3
                    );
                    mandelbrotForce.multiplyScalar(turbulence * 0.5);
                    this.applyForce(mandelbrotForce);

                    let centerForce = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    centerForce.normalize().multiplyScalar(0.1);
                    this.applyForce(centerForce);
                }
                break;

            case 15:
                {
                    let pulsarAxis = new THREE.Vector3(
                        Math.sin(time * 0.1),
                        Math.cos(time * 0.1),
                        0.3
                    ).normalize();

                    let projection = this.pos.dot(pulsarAxis);
                    let perpendicular = new THREE.Vector3().copy(this.pos);
                    perpendicular.sub(pulsarAxis.clone().multiplyScalar(projection));
                    let distFromAxis = perpendicular.length();

                    if (distFromAxis < 100) {
                        let fieldForce = pulsarAxis.clone();
                        fieldForce.multiplyScalar(projection > 0 ? 0.4 : -0.4);
                        this.applyForce(fieldForce);
                    }

                    let rotationForce = new THREE.Vector3().crossVectors(pulsarAxis, perpendicular);
                    rotationForce.normalize().multiplyScalar(0.6);
                    this.applyForce(rotationForce);

                    let gravity = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
                    gravity.normalize().multiplyScalar(0.15);
                    this.applyForce(gravity);
                }
                break;
        }
    }

    update(time, world, mouse) {
        this.follow(world.flowField, world.cols, world.rows, world.depth, CONFIG.resolution);

        let nx = this.pos.x * CONFIG.noiseScale;
        let ny = this.pos.y * CONFIG.noiseScale;
        let nz = this.pos.z * CONFIG.noiseScale;
        let t = time + this.seed * 0.01;

        let noiseForce = new THREE.Vector3(
            noise(nx, ny, t) - 0.5,
            noise(ny, nz, t) - 0.5,
            noise(nz, nx, t) - 0.5
        );
        noiseForce.multiplyScalar(1.5 * CONFIG.turbulence * this.noiseInfluence);
        this.applyForce(noiseForce);

        this.applyVortexForces(world.vortexCenters);
        this.applyAttractionForces();
        this.applyMovementForces(world.movementType, world, time, CONFIG.turbulence);

        let mouse3D = new THREE.Vector3(mouse.x, mouse.y, 0);
        let d = this.pos.distanceTo(mouse3D);

        if (d < CONFIG.mouseRadius && d > 0) {
            let repel = new THREE.Vector3().subVectors(this.pos, mouse3D);
            repel.normalize();
            let strength = (1 - d / CONFIG.mouseRadius) * CONFIG.mouseForce;
            repel.multiplyScalar(strength);
            this.applyForce(repel);
        }

        let distFromCenter = this.pos.length();

        if (distFromCenter > CONFIG.maxDistance * 0.7) {
            let returnForce = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
            returnForce.normalize();
            let pullStrength = (distFromCenter - CONFIG.maxDistance * 0.7) / (CONFIG.maxDistance * 0.3);
            pullStrength = Math.pow(pullStrength, 2);
            returnForce.multiplyScalar(pullStrength);
            this.applyForce(returnForce);
        }

        let centerForce = new THREE.Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
        centerForce.normalize();
        centerForce.multiplyScalar(CONFIG.centerPull);
        this.applyForce(centerForce);

        if (Math.abs(this.pos.z) > 650) {
            this.pos.z *= -0.9;
            this.vel.z *= -0.5;
        }

        this.vel.add(this.acc);
        this.vel.clampLength(0, this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.multiplyScalar(0);
        this.vel.multiplyScalar(this.damping);

        if (this.mesh) {
            this.mesh.position.copy(this.pos);
            let fadeFactor = Math.max(0.3, 1 - (distFromCenter / CONFIG.maxDistance));
            this.mesh.material.opacity = this.alpha * fadeFactor;
            this.mesh.rotation.x += 0.01;
            this.mesh.rotation.y += 0.01;
        }

        this.updateTrail(CONFIG.trailEnabled);
    }

    dispose(scene) {
        if (this.mesh) {
            scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.glow) {
                if (this.glow.geometry) this.glow.geometry.dispose();
                if (this.glow.material) this.glow.material.dispose();
            }
        }
        if (this.trailLine) {
            scene.remove(this.trailLine);
            if (this.trailLine.geometry) this.trailLine.geometry.dispose();
            if (this.trailLine.material) this.trailLine.material.dispose();
        }
    }
}
