import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HologramSphereProps {
  score?: number;
  size?: number;
  color?: string;
  speed?: number;
}

export const HologramSphere3D: React.FC<HologramSphereProps> = ({
  score = 25,
  size = 120,
  color,
  speed = 1
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let hexColor = 0x10b981; // emerald
    if (score > 70) hexColor = 0xef4444; // crimson
    else if (score > 40) hexColor = 0xf59e0b; // amber
    if (color) hexColor = parseInt(color.replace('#', '0x'));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 180;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Outer wireframe icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(45, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    scene.add(icoMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(22, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.25
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Orbiting particle ring
    const ringGeo = new THREE.BufferGeometry();
    const ringCount = 36;
    const ringPositions = new Float32Array(ringCount * 3);
    for (let i = 0; i < ringCount; i++) {
      const theta = (i / ringCount) * Math.PI * 2;
      ringPositions[i * 3] = Math.cos(theta) * 56;
      ringPositions[i * 3 + 1] = Math.sin(theta * 2) * 8;
      ringPositions[i * 3 + 2] = Math.sin(theta) * 56;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    const ringMat = new THREE.PointsMaterial({
      color: 0x00f5d4,
      size: 2.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particleRing = new THREE.Points(ringGeo, ringMat);
    scene.add(particleRing);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      icoMesh.rotation.x += 0.008 * speed;
      icoMesh.rotation.y += 0.012 * speed;
      particleRing.rotation.y -= 0.015 * speed;
      particleRing.rotation.z += 0.005 * speed;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.clear();
    };
  }, [score, size, color, speed]);

  return <div ref={mountRef} className="flex items-center justify-center pointer-events-none" />;
};
