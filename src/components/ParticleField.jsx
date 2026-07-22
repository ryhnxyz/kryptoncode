import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLS = 68;
const ROWS = 38;
const damp = (current, target, speed, delta) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * Math.min(delta, 0.05)));
const smooth = (value) => value * value * (3 - 2 * value);

function DotRoom({ timeline, reducedMotion }) {
  const points = useRef(null);
  const positions = useMemo(() => new Float32Array(COLS * ROWS * 3), []);
  const base = useMemo(() => {
    const values = new Float32Array(COLS * ROWS * 3);
    let i = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const x = (col - (COLS - 1) / 2) * 0.245;
        const y = ((ROWS - 1) / 2 - row) * 0.245;
        values[i * 3] = x;
        values[i * 3 + 1] = y;
        values[i * 3 + 2] = -0.35 + Math.sin(col * 0.3) * 0.05 + Math.cos(row * 0.42) * 0.04;
        i += 1;
      }
    }
    return values;
  }, []);
  const sizes = useMemo(() => Float32Array.from({ length: COLS * ROWS }, (_, i) => 1.25 + ((i * 17) % 10) * 0.04), []);
  const pointer = useRef(new THREE.Vector2(20, 20));
  const cameraTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!points.current) return;
    const { progress = 0, scene = 0, local = 0 } = timeline.current;
    pointer.current.x = damp(pointer.current.x, state.pointer.x * 7.5, 2.8, delta);
    pointer.current.y = damp(pointer.current.y, state.pointer.y * 4.2, 2.8, delta);

    for (let i = 0; i < COLS * ROWS; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const distance = Math.hypot(x - pointer.current.x, y - pointer.current.y);
      const push = reducedMotion ? 0 : Math.exp(-distance * distance * 0.7) * 0.65;
      const drift = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.32 + x * 0.17 + y * 0.12) * 0.035;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = damp(positions[i * 3 + 2] || base[i * 3 + 2], base[i * 3 + 2] - push + drift, 4.5, delta);
    }
    points.current.geometry.attributes.position.needsUpdate = true;

    const p = smooth(local);
    let x = 0; let y = 0; let z = 10.8; let tx = 0; let ty = 0;
    if (scene === 0) {
      x = p * 3.6; z = 10.8 - p * 0.8; tx = p * 1.35;
    } else if (scene === 1) {
      x = 3.6 - p * 6.2; y = Math.sin(p * Math.PI) * 0.5; z = 10 - p * 1.1; tx = 1.35 - p * 2.25; ty = Math.sin(p * Math.PI) * 0.18;
    } else {
      x = -2.6 + p * 2.6; y = 0.15 * (1 - p); z = 8.9 - p * 4.2; tx = -0.9 + p * 0.9;
    }
    if (reducedMotion) { x = 0; y = 0; z = 10.5; tx = 0; ty = 0; }

    const speed = progress > 0.97 ? 1.5 : 3;
    state.camera.position.x = damp(state.camera.position.x, x, speed, delta);
    state.camera.position.y = damp(state.camera.position.y, y, speed, delta);
    state.camera.position.z = damp(state.camera.position.z, z, speed, delta);
    cameraTarget.current.x = damp(cameraTarget.current.x, tx, speed, delta);
    cameraTarget.current.y = damp(cameraTarget.current.y, ty, speed, delta);
    state.camera.lookAt(cameraTarget.current.x, cameraTarget.current.y, -0.4);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial transparent depthWrite={false} vertexShader={`
        attribute float aSize; varying float vAlpha;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vAlpha = clamp(1.2 - (-mv.z * .045), .28, .82); gl_PointSize = aSize * (13.0 / -mv.z); gl_Position = projectionMatrix * mv; }
      `} fragmentShader={`
        varying float vAlpha;
        void main() { float d = length(gl_PointCoord - .5); float dot = 1.0 - smoothstep(.3, .5, d); gl_FragColor = vec4(vec3(.96), dot * vAlpha); }
      `} />
    </points>
  );
}

export default function ParticleField({ timeline, reducedMotion = false }) {
  return <div className="intro-particle-canvas" aria-hidden="true"><Canvas camera={{ position: [0, 0, 10.8], fov: 48 }} dpr={[1, 1.35]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}><DotRoom timeline={timeline} reducedMotion={reducedMotion} /></Canvas></div>;
}
