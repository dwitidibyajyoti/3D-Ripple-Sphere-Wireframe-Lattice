import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  OrbitControls,
  Float,
  ContactShadows,
  Sparkles,
} from '@react-three/drei'
import * as THREE from 'three'

// Custom WebGL Shader Material for Idle Wireframe Rings (with rhythmic pulsing edges) <-> Solid Glowing Neon Spheres
const createNodeShaderMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uNodePhase: { value: 0.0 },
      uExcitation: { value: 0.0 },
      uIdleRimColor: { value: new THREE.Color('#10b981') }, // Luminous emerald/teal edge glow
      uIdleCoreColor: { value: new THREE.Color('#011710') }, // Deep dark center
      uNeonGreen: { value: new THREE.Color('#22c55e') },     // Vivid neon green
      uElectricCyan: { value: new THREE.Color('#06b6d4') },  // Radiant electric cyan
      uPeakWhite: { value: new THREE.Color('#ffffff') },     // Bright white peak
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform float uTime;
      uniform float uNodePhase;
      uniform float uExcitation;
      uniform vec3 uIdleRimColor;
      uniform vec3 uIdleCoreColor;
      uniform vec3 uNeonGreen;
      uniform vec3 uElectricCyan;
      uniform vec3 uPeakWhite;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float NdotV = max(dot(normal, viewDir), 0.0);
        float fresnel = 1.0 - NdotV;

        // Silhouette depth factor: nodes facing away towards the sphere perimeter curvature
        float horizonSilhouette = pow(fresnel, 1.8);

        // Soft rhythmic blinking/pulsing glow across the perimeter and node edges
        float pulseA = sin(uTime * 2.2 + uNodePhase) * 0.5 + 0.5;
        float pulseB = sin(uTime * 3.4 + uNodePhase * 1.7) * 0.5 + 0.5;
        float rhythmicPulse = mix(pulseA, pulseB, 0.35);

        // Idle state: dark minimal core with a dynamic blinking/pulsing glow on edges & outer horizon rim
        float softRim = pow(fresnel, 2.4);
        float sharpEdgeGlow = pow(fresnel, 5.2);
        
        // Edge glow intensity continuously pulses to accentuate depth and spherical curvature
        float blinkIntensity = 1.0 + (0.75 + 1.4 * horizonSilhouette) * rhythmicPulse;
        vec3 idleEdgeGlow = uIdleRimColor * (softRim * 2.6 + sharpEdgeGlow * 4.8) * blinkIntensity;
        vec3 idleColor = uIdleCoreColor + idleEdgeGlow;

        // Transformation during wave passage: White -> Neon Green -> Cyan
        vec3 shiftColor = mix(uElectricCyan, uNeonGreen, smoothstep(0.2, 0.6, uExcitation));
        vec3 waveColor = mix(shiftColor, uPeakWhite, smoothstep(0.65, 0.95, uExcitation));

        // When wave hits: morph into solid glowing sphere with high emission
        vec3 solidGlow = waveColor * (0.85 + 0.45 * NdotV + softRim * 3.0);
        vec3 finalColor = mix(idleColor, solidGlow, uExcitation);

        // Alpha transition: subtle transparency in core with glowing edge, fully opaque when excited
        float alpha = mix(0.55 + softRim * 0.45, 1.0, uExcitation);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
  })

interface Shockwave {
  id: string
  origin: THREE.Vector3
  startTime: number
  speed: number
  waveWidth: number
  duration: number
}

interface NodeData {
  initialPosition: THREE.Vector3
  normal: THREE.Vector3
  quaternion: THREE.Quaternion
  scatterOffsets: THREE.Vector3[]
}

interface NodeInstanceProps {
  data: NodeData
  index: number
  geometry: THREE.BufferGeometry
  particleGeometry: THREE.BufferGeometry
  baseScale: number
  waves: Shockwave[]
  onNodeInteract: (worldPos: THREE.Vector3) => void
}

function NodeInstance({
  data,
  index,
  geometry,
  particleGeometry,
  baseScale,
  waves,
  onNodeInteract,
}: NodeInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const scatterGroupRef = useRef<THREE.Group>(null!)
  const material = useMemo(() => {
    const mat = createNodeShaderMaterial()
    mat.uniforms.uNodePhase.value = (index * 0.42) % (Math.PI * 2)
    return mat
  }, [index])
  const particleMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#4ade80',
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  // Spring physics state for displacement and excitation
  const springPosRef = useRef(new THREE.Vector3().copy(data.initialPosition))
  const springVelRef = useRef(new THREE.Vector3(0, 0, 0))
  const excitationRef = useRef(0)
  const excitationVelRef = useRef(0)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const now = state.clock.getElapsedTime()
    const dt = Math.min(delta, 0.05)

    // Calculate maximum wave excitation at this node from all active ripples
    let targetExcitation = 0
    waves.forEach((w) => {
      const age = now - w.startTime
      if (age < 0 || age > w.duration) return

      const waveRadius = w.speed * age
      const distToOrigin = data.initialPosition.distanceTo(w.origin)
      const diff = Math.abs(distToOrigin - waveRadius)

      // Gaussian wave front intensity with exponential decay
      const waveProfile = Math.exp(-(diff * diff) / (2 * w.waveWidth * w.waveWidth))
      const timeDecay = Math.max(0, 1 - age / w.duration)
      const intensity = waveProfile * timeDecay

      if (intensity > targetExcitation) {
        targetExcitation = intensity
      }
    })

    // Spring physics for excitation smoothing & bounce
    const springStiffness = 35.0
    const springDamping = 8.5
    const excForce = (targetExcitation - excitationRef.current) * springStiffness
    excitationVelRef.current += (excForce - excitationVelRef.current * springDamping) * dt
    excitationRef.current = Math.max(0, Math.min(1.0, excitationRef.current + excitationVelRef.current * dt))

    // Update shader excitation and time uniforms
    material.uniforms.uExcitation.value = excitationRef.current
    material.uniforms.uTime.value = now

    // Outward radial displacement when excited
    const maxDisplacement = 0.95
    const targetPosition = data.initialPosition
      .clone()
      .add(data.normal.clone().multiplyScalar(excitationRef.current * maxDisplacement))

    // Spring-damper relaxation for position (easing snap-back)
    const posForce = targetPosition.clone().sub(springPosRef.current).multiplyScalar(40.0)
    springVelRef.current.add(posForce.sub(springVelRef.current.clone().multiplyScalar(9.0)).multiplyScalar(dt))
    springPosRef.current.add(springVelRef.current.clone().multiplyScalar(dt))

    meshRef.current.position.copy(springPosRef.current)

    // Dynamic scale: scales up during wave passing
    const scaleFactor = baseScale * (1.0 + excitationRef.current * 0.9)
    meshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor)

    // Scatter detached particles outward during peak excitation
    if (scatterGroupRef.current) {
      scatterGroupRef.current.position.copy(springPosRef.current)
      const scatterAmount = Math.max(0, excitationRef.current - 0.25) * 1.6
      scatterGroupRef.current.children.forEach((child, i) => {
        const offset = data.scatterOffsets[i]
        child.position.set(
          offset.x * scatterAmount,
          offset.y * scatterAmount,
          offset.z * scatterAmount
        )
        const pScale = (0.04 + 0.05 * excitationRef.current) * (scatterAmount > 0.05 ? 1 : 0)
        child.scale.set(pScale, pScale, pScale)
      })
      particleMaterial.opacity = Math.min(1.0, excitationRef.current * 1.2)
    }
  })

  const handlePointerInteraction = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    e.stopPropagation()
    const worldPos = e.point ? e.point.clone() : data.initialPosition.clone()
    onNodeInteract(worldPos)
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        quaternion={data.quaternion}
        onPointerOver={handlePointerInteraction}
        onPointerEnter={handlePointerInteraction}
        onPointerDown={handlePointerInteraction}
        onClick={handlePointerInteraction}
      />

      {/* Detached micro-scatter particles that disperse during wave & spring back */}
      <group ref={scatterGroupRef}>
        {data.scatterOffsets.map((_, i) => (
          <mesh
            key={i}
            geometry={particleGeometry}
            material={particleMaterial}
          />
        ))}
      </group>
    </group>
  )
}

interface SphereStructureProps {
  count: number
  radius: number
  gapPercentage: number
  expansionFactor: number
  autoRotateSpeed: number
  isDragging: boolean
}

function SphereStructure({
  count,
  radius,
  gapPercentage,
  expansionFactor,
  autoRotateSpeed,
  isDragging,
}: SphereStructureProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [waves, setWaves] = useState<Shockwave[]>([])

  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 32, 32), [])
  const particleGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 12, 12), [])

  // Calculate uniform scale ensuring visible gaps between node rings
  const uniformScale = useMemo(() => {
    const neighborDist =
      count > 1 ? 2 * radius * Math.sqrt(Math.PI / count) : radius
    const gapFraction = Math.max(0.1, Math.min(0.8, gapPercentage / 100))
    const targetDiameter = neighborDist * (1 - gapFraction)
    return targetDiameter
  }, [count, radius, gapPercentage])

  // Fibonacci Sphere Algorithm for uniform distribution of circular nodes
  const sphereNodes = useMemo(() => {
    const nodes: NodeData[] = []
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
      const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = i * goldenAngle

      const x = radiusAtY * Math.cos(theta)
      const z = radiusAtY * Math.sin(theta)

      const normal = new THREE.Vector3(x, y, z).normalize()
      const initialPosition = normal.clone().multiplyScalar(radius * expansionFactor)

      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)

      // Generate 4 randomized scatter offset vectors for detached micro-particles
      const scatterOffsets: THREE.Vector3[] = []
      for (let s = 0; s < 4; s++) {
        const rnd = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
          .normalize()
          .multiplyScalar(0.4 + Math.random() * 0.5)
        scatterOffsets.push(rnd)
      }

      nodes.push({
        initialPosition,
        normal,
        quaternion,
        scatterOffsets,
      })
    }

    return nodes
  }, [count, radius, expansionFactor])

  // Propagate a new shockwave across the sphere on interaction
  const handleNodeInteract = useCallback((worldPos: THREE.Vector3) => {
    const newWave: Shockwave = {
      id: `${Date.now()}-${Math.random()}`,
      origin: worldPos,
      startTime: performance.now() / 1000,
      speed: 4.8,       // Ripple propagation speed
      waveWidth: 0.95,  // Smooth wave front width
      duration: 1.8,    // Full propagation & relaxation
    }
    setWaves((prev) => [...prev.slice(-8), newWave])
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.25
      groupRef.current.rotation.x += delta * autoRotateSpeed * 0.08
    }

    const now = state.clock.getElapsedTime()
    setWaves((prev) => {
      const active = prev.filter((w) => now - w.startTime < w.duration)
      return active.length !== prev.length ? active : prev
    })
  })

  const handleSurfacePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.point) {
      handleNodeInteract(e.point)
    }
  }

  return (
    <group ref={groupRef}>
      {/* Interaction surface to catch continuous mouse hover & drag waves */}
      <mesh
        visible={false}
        onPointerMove={handleSurfacePointerDown}
        onPointerDown={handleSurfacePointerDown}
      >
        <sphereGeometry args={[radius * 1.15, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Uniformly distributed nodes */}
      {sphereNodes.map((node, i) => (
        <NodeInstance
          key={i}
          index={i}
          data={node}
          geometry={geometry}
          particleGeometry={particleGeometry}
          baseScale={uniformScale}
          waves={waves}
          onNodeInteract={handleNodeInteract}
        />
      ))}
    </group>
  )
}

export interface BallSphereProps {
  ballCount?: number
  sphereRadius?: number
  gapPercentage?: number
  autoRotate?: boolean
  speed?: number
  expansion?: number
  showSparkles?: boolean
}

export function BallSphere({
  ballCount = 120,
  sphereRadius = 2.8,
  gapPercentage = 35,
  autoRotate = true,
  speed = 1.0,
  expansion = 1.0,
  showSparkles = true,
}: BallSphereProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Dark minimal ambient background */}
        <color attach="background" args={['#030a08']} />

        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[8, 12, 8]} intensity={1.8} color="#e6fffa" />
        <directionalLight position={[-8, -10, -6]} intensity={0.9} color="#059669" />
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#10b981" />
        <pointLight position={[0, -5, 0]} intensity={0.8} color="#06b6d4" />

        {/* Floating animated container */}
        <Float
          speed={1.0}
          rotationIntensity={0.12}
          floatIntensity={0.3}
          floatingRange={[-0.08, 0.08]}
        >
          <SphereStructure
            count={ballCount}
            radius={sphereRadius}
            gapPercentage={gapPercentage}
            expansionFactor={expansion}
            autoRotateSpeed={autoRotate ? speed : 0}
            isDragging={isDragging}
          />
        </Float>

        {/* Ambient Teal Sparkles */}
        {showSparkles && (
          <Sparkles
            count={70}
            scale={12}
            size={2.0}
            speed={0.3}
            opacity={0.4}
            color="#10b981"
          />
        )}

        {/* Ground Contact Shadows */}
        <ContactShadows
          position={[0, -3.8, 0]}
          opacity={0.35}
          scale={14}
          blur={2.6}
          far={7}
        />

        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={18}
          dampingFactor={0.05}
          rotateSpeed={0.8}
          onStart={() => setIsDragging(true)}
          onEnd={() => setIsDragging(false)}
        />
      </Canvas>
    </div>
  )
}
