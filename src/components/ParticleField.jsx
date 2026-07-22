import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLS = 54;
const ROWS = 30;

function DotSurface({ timeline, reducedMotion }) {
  const points = useRef();
  const material = useRef();
  const positions = useMemo(() => new Float32Array(COLS * ROWS * 3), []);
  const sizes = useMemo(() => new Float32Array(COLS * ROWS), []);

  useFrame(({ clock, pointer, camera }) => {
    if (!points.current) return;
    const time = clock.elapsedTime;
    const scene = timeline.current.scene;
    const local = timeline.current.local;
    let index = 0;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const x = (col - (COLS - 1) / 2) * 0.34;
        const y = ((ROWS - 1) / 2 - row) * 0.34;
        const distance = Math.hypot(x, y);
        const wave = Math.sin(distance * 1.15 - time * 1.2) * 0.42;
        const ribbon = Math.sin(x * 0.75 + time * 0.7) * Math.cos(y * 0.52 - time * 0.35) * 0.7;
        const tunnel = -Math.exp(-distance * 0.22) * 4.2 + Math.sin(distance * 1.8 - time) * 0.22;
        const zTargets = [wave, ribbon, tunnel];
        const nextTarget = zTargets[Math.min(scene + 1, 2)];
        const morph = THREE.MathUtils.smootherstep(local, 0.7, 1);
        let z = THREE.MathUtils.lerp(zTargets[scene], nextTarget, morph);
        if (!reducedMotion) z += (pointer.x * x + pointer.y * y) * 0.045;

        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
        sizes[index] = 3 + Math.max(0, z + 1.4) * 3.2 + Math.sin(time * 1.4 + index * 0.07) * 0.7;
        index += 1;
      }
    }

    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.aSize.needsUpdate = true;
    points.current.rotation.z = Math.sin(time * 0.12) * 0.035;
    camera.position.z = 10.5 - scene * 0.65 - local * 0.25;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.32, 0.025);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.2, 0.025);
    camera.lookAt(0, 0, -0.5);
  });

  const vertexShader = `
    attribute float aSize;
    varying float vDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = clamp((position.z + 4.0) / 7.0, 0.0, 1.0);
      gl_PointSize = aSize * (18.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    varying float vDepth;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float circle = 1.0 - smoothstep(0.38, 0.5, length(uv));
      gl_FragColor = vec4(vec3(0.94 + vDepth * 0.06), circle * (0.38 + vDepth * 0.62));
    }
  `;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function ParticleField({ timeline, reducedMotion = false }) {
  return (
    <div className="intro-particle-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 10.5], fov: 54 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }}>
        <DotSurface timeline={timeline} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
