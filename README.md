# Space Particle System

Sistema generativo de partículas 3D con Three.js. Simula 16 tipos diferentes de movimiento físico en un espacio tridimensional, orbitando desde atractores gravitacionales hasta agujeros negros de Kerr.

## Arquitectura

```
index.html          → Entry point (ES modules)
js/
  config.js         → Constantes del sistema
  utils.js          → Funciones matemáticas y de azar
  particle.js       → Clase Particle (ciclo de vida, render, físicas)
  world.js          → Entorno: flow field, cuerpos celestes, anillos
  lighting.js       → Iluminación dinámica (5 luces point)
  camera.js         → Cámara orbital con drag
  ui.js             → Panel glassmorphism + toggle visibilidad
  main.js           → Orquestación del sistema
```

## Física implementada

### 1. Gravitational Dance (Ley de gravitación inversa al cuadrado)

```
F = G * m₁ * m₂ / r²
```

Fuerza de atracción entre cuerpos masivos y cada partícula, con intensificación dentro del radio del cuerpo.

### 2. Lorenz Attractor

```
dx/dt = σ(y - x)
dy/dt = x(ρ - z) - y
dz/dt = xy - βz
```

Con σ = 10, ρ = 28, β = 8/3. Sistema caótico determinista de 3 variables acopladas.

### 3. Fibonacci / Golden Spiral

```
rₙ₊₁ = rₙ · φ⁻¹ · (1/φ)
θₙ₊₁ = θₙ + ln(r + 1) / ln(φ)
```

Donde φ = (1 + √5) / 2 ≈ 1.618. Las partículas trazan la espiral áurea logarítmica.

### 4. Black Hole (Schwarzschild + Kerr)

**Schwarzschild:** El horizonte de eventos (Rₛ = 2GM/c²) es el punto de no retorno donde la fuerza gravitacional se vuelve extrema (espaguetización).

**Kerr (rotante):** Efecto de *frame-dragging*, la rotación del agujero negro arrastra el espacio-tiempo alrededor del ergoesfera. Jets relativistas emergen de los polos.

### 5. Orbital Rings (Kepler)

```
v_orbital = √(GM / r)
```

Velocidad orbital kepleriana para formar discos como los anillos de Saturno, con fuerzas de compresión al plano orbital.

### 6. Wave Interference

```
F(r, t) = A · sin(k · r - ω · t + φ)
```

Superposición de ondas esféricas desde 4 generadores, creando patrones de interferencia constructiva/destructiva.

### 7. Mandelbrot Flow

```
zₙ₊₁ = zₙ² + c,  z₀ = 0
```

Iteración del conjunto de Mandelbrot donde c = (zₓ, zᵧ, t) usada como campo de fuerza.

### 8. Vortex / Cosmic Vortex

```
F = (1 - r/R) · S · (tangente al radio)
```

Fuerzas tangenciales con decaimiento radial, girando alrededor de centros de vórtice dinámicos.

## Controles

| Tecla   | Acción                        |
| ------- | ----------------------------- |
| `↑ ↓`   | Zoom in/out                   |
| `← →`   | Velocidad de órbita           |
| `R`     | Nueva generación (seed random)|
| `C`     | Cambiar esquema de color      |
| `T`     | Activar/desactivar trails     |
| `SPACE` | Pausar/reanudar órbita auto   |
| `O`     | Auto-regeneración             |
| `+ / -` | Turbulencia                   |
| `H`     | Mostrar/ocultar panel         |
| Mouse   | Drag para rotar cámara        |

## Tipos de movimiento (16)

`GRAVITATIONAL_DANCE`, `ORBITAL_RINGS`, `WAVE_INTERFERENCE`, `GALAXY_SPIRAL`, `BINARY_SYSTEM`, `TIDAL_FORCES`, `QUANTUM_FIELD`, `COSMIC_VORTEX`, `BLACK_HOLE_ACCRETION`, `KERR_BLACK_HOLE`, `WORMHOLE_TUNNEL`, `FIBONACCI_SPIRAL`, `LORENZ_ATTRACTOR`, `DOUBLE_PENDULUM`, `MANDELBROT_FLOW`, `PULSAR_JETS`

## Requisitos

- Navegador moderno con soporte para ES modules y WebGL
- Three.js r128 (cargado vía CDN)
