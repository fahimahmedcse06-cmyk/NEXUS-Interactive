import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { detectHands, initializeHandTracking } from './vision/handTracking'

type Controls = {
  spread: number
  rotationX: number
  rotationY: number
  rotationZ: number
  swirl: number
  detected: boolean
}

function ParticleSystem({ controls }: { controls: React.MutableRefObject<Controls> }) {
  const points = useRef<THREE.Points>(null)
  const core = useRef<THREE.Mesh>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)

  const positions = useMemo(() => {
    const count = 6500
    const data = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const radius = 2.1
      data[i * 3] = radius * Math.sqrt(1 - u * u) * Math.cos(theta)
      data[i * 3 + 1] = radius * Math.sqrt(1 - u * u) * Math.sin(theta)
      data[i * 3 + 2] = radius * u
    }
    return data
  }, [])

  useFrame((state, delta) => {
    const c = controls.current
    const t = state.clock.elapsedTime

    if (points.current) {
      const scale = c.detected ? 0.65 + c.spread * 1.5 : 1
      points.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        Math.min(1, delta * 4)
      )
      points.current.rotation.x += ((c.detected ? c.rotationX : 0) - points.current.rotation.x) * delta * 3
      points.current.rotation.y += ((c.detected ? c.rotationY : t * 0.12) - points.current.rotation.y) * delta * 3
      points.current.rotation.z += ((c.detected ? c.rotationZ + c.swirl : 0) - points.current.rotation.z) * delta * 3
    }

    if (core.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.035
      core.current.scale.setScalar(pulse)
      core.current.rotation.y = t * 0.18
    }

    if (ring1.current) {
      ring1.current.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.4) * 0.15
      ring1.current.rotation.z = t * 0.18 + c.swirl * 0.2
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.PI / 2 + Math.cos(t * 0.3) * 0.2
      ring2.current.rotation.y = t * 0.12
    }
  })

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.48, 2]} />
        <meshBasicMaterial color="#72ffe0" wireframe transparent opacity={0.35} />
      </mesh>

      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#59ffe0"
          size={0.025}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh ref={ring1}>
        <torusGeometry args={[2.55, 0.009, 8, 160]} />
        <meshBasicMaterial color="#16d9ff" transparent opacity={0.65} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.8, 0.006, 8, 160]} />
        <meshBasicMaterial color="#8a6dff" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}


function EnergyVortex({ controls }: { controls: React.MutableRefObject<Controls> }) {
  const vortex = useRef<THREE.Points>(null)
  const wave1 = useRef<THREE.Mesh>(null)
  const wave2 = useRef<THREE.Mesh>(null)

  const positions = useMemo(() => {
    const count = 2200
    const data = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const t = i / count
      const angle = t * Math.PI * 28
      const radius = 1.15 + t * 2.15

      data[i * 3] = Math.cos(angle) * radius
      data[i * 3 + 1] = (Math.random() - 0.5) * 2.4
      data[i * 3 + 2] = Math.sin(angle) * radius
    }

    return data
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const c = controls.current

    if (vortex.current) {
      vortex.current.rotation.y += delta * (0.12 + Math.abs(c.swirl) * 0.08)
      vortex.current.rotation.x += ((c.detected ? c.rotationX * 0.25 : 0) - vortex.current.rotation.x) * delta * 2
      const scale = c.detected ? 0.85 + c.spread * 0.35 : 1
      vortex.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 3)
    }

    if (wave1.current) {
      const pulse = (t * 0.22) % 1
      wave1.current.scale.setScalar(0.7 + pulse * 1.5)
      const material = wave1.current.material as THREE.MeshBasicMaterial
      material.opacity = (1 - pulse) * 0.35
      wave1.current.rotation.z = t * 0.12
    }

    if (wave2.current) {
      const pulse = ((t * 0.22) + 0.5) % 1
      wave2.current.scale.setScalar(0.7 + pulse * 1.5)
      const material = wave2.current.material as THREE.MeshBasicMaterial
      material.opacity = (1 - pulse) * 0.25
      wave2.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.12
    }
  })

  return (
    <group>
      <points ref={vortex}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9b75ff"
          size={0.018}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh ref={wave1}>
        <torusGeometry args={[2.2, 0.012, 8, 128]} />
        <meshBasicMaterial color="#31eaff" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <mesh ref={wave2}>
        <torusGeometry args={[2.2, 0.009, 8, 128]} />
        <meshBasicMaterial color="#a879ff" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Stars() {
  const positions = useMemo(() => {
    const data = new Float32Array(900 * 3)
    for (let i = 0; i < 900; i++) {
      data[i * 3] = (Math.random() - 0.5) * 18
      data[i * 3 + 1] = (Math.random() - 0.5) * 12
      data[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
    }
    return data
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8bdfff" size={0.012} transparent opacity={0.65} />
    </points>
  )
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const spreadRef = useRef<HTMLDivElement>(null)

  const controls = useRef<Controls>({
    spread: 0.5,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    swirl: 0,
    detected: false,
  })

  useEffect(() => {
    let active = true
    let stream: MediaStream | null = null
    let animationId = 0
    let previousX = 0
    let previousY = 0
    let previousTime = 0

    const distance = (a: {x:number,y:number}, b: {x:number,y:number}) =>
      Math.hypot(a.x - b.x, a.y - b.y)

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        })
        if (!active || !videoRef.current) return

        videoRef.current.srcObject = stream
        await videoRef.current.play()
        if (statusRef.current) statusRef.current.textContent = 'LOADING NEURAL VISION...'

        await initializeHandTracking()
        if (!active) return

        function track() {
          if (!active || !videoRef.current) return

          const result = detectHands(videoRef.current)
          const landmarks = result?.landmarks?.[0]
          const c = controls.current

          if (landmarks) {
            const wrist = landmarks[0]
            const middle = landmarks[9]
            const indexTip = landmarks[8]
            const tips = [8, 12, 16, 20]
            const pips = [6, 10, 14, 18]

            let openness = 0
            for (let i = 0; i < 4; i++) {
              openness += distance(landmarks[tips[i]], wrist) /
                Math.max(0.001, distance(landmarks[pips[i]], wrist))
            }
            openness /= 4

            c.spread = THREE.MathUtils.clamp((openness - 0.85) / 0.55, 0, 1)
            c.rotationY = (0.5 - middle.x) * 2.8
            c.rotationX = (0.5 - middle.y) * 2
            c.rotationZ = Math.atan2(middle.y - wrist.y, middle.x - wrist.x)
            c.detected = true

            if (previousTime !== 0) {
              const dx = indexTip.x - previousX
              const dy = indexTip.y - previousY
              c.swirl += THREE.MathUtils.clamp((previousX * dy - previousY * dx) * 35, -0.08, 0.08)
              c.swirl = THREE.MathUtils.clamp(c.swirl, -6, 6)
            }

            previousX = indexTip.x
            previousY = indexTip.y
            previousTime = performance.now()

            if (statusRef.current) {
              statusRef.current.textContent = c.spread > 0.65
                ? 'OPEN PALM / ENERGY EXPANSION'
                : c.spread < 0.25
                  ? 'FIST / ENERGY COMPRESSION'
                  : 'GESTURE LINK ESTABLISHED'
            }
            if (handRef.current) handRef.current.textContent = '01 / TRACKED'
            if (spreadRef.current) spreadRef.current.textContent = `${Math.round(c.spread * 100)}%`
          } else {
            c.detected = false
            previousTime = 0
            if (statusRef.current) statusRef.current.textContent = 'WAITING FOR HAND INPUT'
            if (handRef.current) handRef.current.textContent = '00 / SEARCHING'
          }

          animationId = requestAnimationFrame(track)
        }
        track()
      } catch (error) {
        console.error(error)
        if (statusRef.current) statusRef.current.textContent = 'CAMERA / MODEL ERROR'
      }
    }

    start()
    return () => {
      active = false
      cancelAnimationFrame(animationId)
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  return (
    <main className="nexus">
      <Canvas camera={{ position: [0, 0, 8], fov: 48 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#030810']} />
        <Stars />
        <EnergyVortex controls={controls} />
        <ParticleSystem controls={controls} />
        <EffectComposer>
          <Bloom intensity={1.25} luminanceThreshold={0.12} luminanceSmoothing={0.8} mipmapBlur />
          <Vignette eskil={false} offset={0.15} darkness={0.75} />
        </EffectComposer>
      </Canvas>

      <div className="topbar">
        <div className="brand">
          <div className="brand-icon">N</div>
          <div><h1>NEXUS<span> / SYSTEM</span></h1><small>GESTURE INTELLIGENCE INTERFACE</small></div>
        </div>
        <div className="system-state"><i /> SYSTEM ONLINE <span>V 1.0.0</span></div>
      </div>

      <div className="left-panel glass">
        <div className="panel-label">INTERACTION MODULE</div>
        <h2>Gesture<br /><em>Control</em></h2>
        <div className="line" />
        <div className="metric"><span>HAND TRACKING</span><strong ref={handRef}>00 / SEARCHING</strong></div>
        <div className="metric"><span>ENERGY SPREAD</span><strong ref={spreadRef}>50%</strong></div>
        <div className="metric"><span>INPUT MODE</span><strong>VISION AI</strong></div>
        <div className="gesture-list">
          <div><b>✋</b><span>OPEN PALM</span><small>EXPAND</small></div>
          <div><b>✊</b><span>FIST</span><small>CONTRACT</small></div>
          <div><b>↻</b><span>HAND MOTION</span><small>ROTATE</small></div>
        </div>
      </div>

      <div className="right-panel glass">
        <div className="panel-label">LIVE CAMERA FEED</div>
        <div className="camera-frame">
          <video ref={videoRef} autoPlay muted playsInline />
          <div className="camera-corner tl" /><div className="camera-corner tr" />
          <div className="camera-corner bl" /><div className="camera-corner br" />
        </div>
        <div className="camera-caption"><i /> VISION SENSOR ACTIVE</div>
        <div className="line" />
        <div className="panel-label">PARTICLE ENGINE</div>
        <div className="metric"><span>PARTICLE COUNT</span><strong>6,500</strong></div>
        <div className="metric"><span>RENDER MODE</span><strong>REALTIME 3D</strong></div>
        <div className="metric"><span>CONTROL</span><strong>HAND GESTURE</strong></div>
      </div>

      <div className="bottom-bar glass">
        <div className="connection"><i /> <span ref={statusRef}>INITIALIZING...</span></div>
        <div className="bottom-hint">MOVE YOUR HAND TO CONTROL THE ENERGY FIELD</div>
        <div className="coordinates">NEXUS CORE <b>●</b> ACTIVE</div>
      </div>
      <div className="crosshair">＋</div>
      <div className="scanline" />
    </main>
  )
}
