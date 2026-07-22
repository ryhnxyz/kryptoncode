import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLS = 68;
const ROWS = 38;
const damp = (current, target, speed, delta) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta));

function DotRoom({ timeline, reducedMotion }) {
  const points = useRef(null);
  const positions = useMemo(() => new Float32Array(COLS * ROWS * 3), []);
  const base = useMemo(() => {
    const values = new Float32Array(COLS * ROWS * 3);
    let i = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        values[i * 3] = (col - (COLS - 1) / 2) * 0.245;
        values[i * 3 + 1] = ((ROWS - 1) / 2 - row) * 0.245;
        values[i * 3 + 2] = -0.28 + Math.sin(col * 0.31) * 0.035;
        i += 1;
      }
    }
    return values;
  }, []);
  const sizes = useMemo(() => {
    const values = new Float32Array(COLS * ROWS);
    for (let i = 0; i < values.length; i += 1) values[i] = 1.35 + ((i * 17) % 9) * 0.035;
    return values;
  }, []);
  const pointer = useRef(new THREE.Vector2(20, 20));
  const cameraTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!points.current) return;
    const progress = timeline.current.progress || 0;
    const activePointer = state.pointer;
    pointer.current.x = damp(pointer.current.x, activePointer.x * 8.2, 3.2, delta);
    pointer.current.y = damp(pointer.current.y, activePointer.y * 4.6, 3.2, delta);

    for (let i = 0; i < COLS * ROWS; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const distance = Math.hypot(x - pointer.current.x, y - pointer.current.y);
      const localPush = reducedMotion ? 0 : Math.exp(-distance * distance * 0.72) * 0.7;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = damp(positions[i * 3 + 2] || base[i * 3 + 2], base[i * 3 + 2] - localPush, 5, delta);
    }
    points.current.geometry.attributes.position.needsUpdate = true;

    let x = 0;
    let y = 0;
    let z = 10.8;
    let tx = 0;
    if (progress < 0.34) {
      const p = THREE.MathUtils.smootherstep(progress / 0.34, 0, 1);
      x = p * 3.4; z = 10.8 - p * 0.8; tx = 1.25 * p;
    } else if (progress < 0.67) {
      const p = THREE.MathUtils.smootherstep((progress - 0.34) / 0.33, 0, 1);
      x = 3.4 - p * 5.8; y = Math.sin(p * Math.PI) * 0.55; z = 10 - p * 1.25; tx = 1.25 - p * 2.1;
    } else {
      const p = THREE.MathUtils.smootherstep((progress - 0.67) / 0.33, 0, 1);
      x = -2.4 + p * 2.4; z = 8.75 - p * 4.1; tx = -0.85 + p * 0.85;
    }
    if (reducedMotion) { x = 0; y = 0; z = 10.5; tx = 0; }
    state.camera.position.x = damp(state.camera.position.x, x, 2.4, delta);
    state.camera.position.y = damp(state.camera.position.y, y, 2.4, delta);
    state.camera.position.z = damp(state.camera.position.z, z, 2.4, delta);
    cameraTarget.current.x = damp(cameraTarget.current.x, tx, 2.4, delta);
    state.camera.lookAt(cameraTarget.current.x, cameraTarget.current.y, -0.4);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial transparent depthWrite={false} vertexShader={`
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vAlpha = clamp(1.25 - (-mv.z * 0.045), .35, .9);
          gl_PointSize = aSize * (13.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `} fragmentShader={`
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - .5);
          float dot = 1.0 - smoothstep(.32, .5, d);
          gl_FragColor = vec4(vec3(.96), dot * vAlpha);
        }
      `} />
    </points>
  );
}

export default function ParticleField({ timeline, reducedMotion = false }) {
  return (
    <div className="intro-particle-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 10.8], fov: 48 }} dpr={[1, 1.4]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
        <DotRoom timeline={timeline} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
