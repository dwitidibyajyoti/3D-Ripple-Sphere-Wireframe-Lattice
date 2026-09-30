# 3D Ripple Sphere & Wireframe Lattice

[![React](https://img.shields.io/badge/React-19.x-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-v9.x-black?style=flat-square)](https://docs.pmnd.rs/react-three-fiber)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

An interactive 3D WebGL visualizer featuring a hollow, uniformly distributed spherical lattice based on the Fibonacci sphere algorithm. Nodes are rendered with custom GLSL Fresnel edge-glow shaders that transition dynamically into glowing neon shockwaves with spring-damper physics upon pointer interaction.

---

## ✨ Features

- **🌐 Fibonacci Sphere Lattice**: Uniformly distributes circular nodes across a 3D spherical shell using the golden ratio spiral ($2\pi / \phi^2$).
- **🎨 Custom GLSL Shader Material**:
  - **Idle State**: Dark minimal cores with rhythmic blinking/pulsing emerald & teal edge glow across the outer horizon rim and curvature silhouettes.
  - **Excitation State**: Dynamically morphs into solid high-emission neon nodes shifting through Electric Cyan $\to$ Vivid Neon Green $\to$ Peak White during wave transit.
- **🌊 Interactive Shockwave Dynamics**:
  - Hover or click on the sphere to dispatch multi-origin Gaussian wave ripples.
  - Wavefronts propagate radially along the surface with realistic decay curves.
- **⚡ Spring-Damper Physics**:
  - Nodes physically displace outward along their normal vectors and bounce back with elastic relaxation.
  - Micro-scatter particles detach and disperse outward at peak excitation before snapping back to equilibrium.
- **🎛️ Real-Time Parameter Controls**:
  - **Node Count**: 30 to 240 nodes.
  - **Node Gap Spacing**: Adjust spacing ratios between adjacent lattice rings.
  - **Sphere Radius & Expansion Factor**: Dynamically scale lattice size and radial spacing.
  - **Rotation Speed & Auto-Rotate**: Smooth continuous orbit rotation with drag damping.
  - **Ambient Sparkles & Lighting**: Toggle atmospheric floating particle effects.

---

## 🎮 Interactive Controls

| Action | Interaction |
| :--- | :--- |
| **Trigger Ripple Wave** | Move mouse / hover across any surface node |
| **Burst Shockwave** | Click / Tap on the sphere |
| **Orbit / Rotate View** | Click + Drag |
| **Zoom In / Out** | Mouse Wheel / Pinch Gesture |
| **Adjust Parameters** | Use the right-side control dashboard |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/)
- **React 3D Ecosystem**: [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**, **yarn**, or **pnpm**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dwitidibyajyoti/3D-Ripple-Sphere-Wireframe-Lattice.git
   cd 3D-Ripple-Sphere-Wireframe-Lattice/my-react-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Production Build

Create an optimized production bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Linting

Run Oxlint checks:
```bash
npm run lint
```

---

##  Project Structure

```
my-react-app/
├── public/
├── src/
│   ├── assets/              # Icons and static resources
│   ├── components/
│   │   ├── BallSphere.tsx   # Three.js Canvas, R3F Scene, Custom GLSL Shaders & Physics
│   │   └── Form.tsx         # Supplementary UI components
│   ├── App.tsx              # Main application shell with real-time parameter controls
│   ├── App.css              # Dark minimal cyberpunk theme styling
│   ├── index.css            # Base styles & typography
│   └── main.tsx             # React entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
