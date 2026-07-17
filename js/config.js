export const CONFIG = {
    numParticles: 5000,
    trailEnabled: true,
    trailLength: 12,
    turbulence: 0.8,
    mouseRadius: 350,
    mouseForce: 40,
    noiseScale: 0.003,
    centerPull: 0.03,
    maxDistance: 800,
    densityGradient: true,
    colorHarmony: true,
    depthLayers: 5,
    cameraDistance: 500,
    cameraAngle: 0,
    cameraHeight: 0,
    cameraSpeed: 0.15,
    autoOrbit: true,
    autoRegenerate: false,
    regenerateInterval: 180,
    resolution: 40,

    movementTypes: [
        "GRAVITATIONAL_DANCE", "ORBITAL_RINGS", "WAVE_INTERFERENCE",
        "GALAXY_SPIRAL", "BINARY_SYSTEM", "TIDAL_FORCES",
        "QUANTUM_FIELD", "COSMIC_VORTEX", "BLACK_HOLE_ACCRETION",
        "KERR_BLACK_HOLE", "WORMHOLE_TUNNEL", "FIBONACCI_SPIRAL",
        "LORENZ_ATTRACTOR", "DOUBLE_PENDULUM", "MANDELBROT_FLOW",
        "PULSAR_JETS"
    ],

    colorSchemes: [
        { name: "Pink/Purple", hueRange: [280, 340], satRange: [70, 100], brightRange: [75, 100] },
        { name: "Electric Blue", hueRange: [180, 240], satRange: [85, 100], brightRange: [70, 100] },
        { name: "Fire Orange", hueRange: [10, 45], satRange: [90, 100], brightRange: [85, 100] },
        { name: "Toxic Green", hueRange: [90, 140], satRange: [80, 100], brightRange: [75, 100] },
        { name: "Pure Cyan", hueRange: [170, 200], satRange: [90, 100], brightRange: [80, 100] },
        { name: "Golden Yellow", hueRange: [45, 65], satRange: [85, 100], brightRange: [85, 100] },
        { name: "Deep Red", hueRange: [350, 370], satRange: [85, 100], brightRange: [70, 95] },
        { name: "Arctic White", hueRange: [180, 220], satRange: [10, 30], brightRange: [90, 100] }
    ]
};

export default CONFIG;
