import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Merchant } from '../../types';
import { ShieldAlert, Compass, Maximize2, RotateCcw } from 'lucide-react';

interface RadarProps {
  merchants: Merchant[];
  onSelectMerchant?: (m: Merchant) => void;
}

export const RadarVisualizer3D: React.FC<RadarProps> = ({ merchants, onSelectMerchant }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMerchant, setHoveredMerchant] = useState<Merchant | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'watchlist' | 'healthy'>('all');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 320, 480);
    camera.lookAt(0, 0, 0);

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Grid & Concentric 3D Rings
    const ringGroup = new THREE.Group();
    const ringRadii = [80, 160, 240, 320];
    const ringColors = [0x10b981, 0x06b6d4, 0xf59e0b, 0xef4444];

    ringRadii.forEach((rad, idx) => {
      const ringGeometry = new THREE.RingGeometry(rad - 0.75, rad + 0.75, 96);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColors[idx],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: idx === 3 ? 0.35 : 0.15
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = idx * 6; // subtle tier elevation in 3D
      ringGroup.add(ringMesh);
    });

    // Crosshair axis lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.3 });
    const crossPoints1 = [new THREE.Vector3(-330, 0, 0), new THREE.Vector3(330, 0, 0)];
    const crossGeo1 = new THREE.BufferGeometry().setFromPoints(crossPoints1);
    const line1 = new THREE.Line(crossGeo1, lineMat);
    ringGroup.add(line1);

    const crossPoints2 = [new THREE.Vector3(0, 0, -330), new THREE.Vector3(0, 0, 330)];
    const crossGeo2 = new THREE.BufferGeometry().setFromPoints(crossPoints2);
    const line2 = new THREE.Line(crossGeo2, lineMat);
    ringGroup.add(line2);

    scene.add(ringGroup);

    // 4. Volumetric Sweeping Radar Cone / Beam
    const sweepGroup = new THREE.Group();
    const sweepGeo = new THREE.CircleGeometry(320, 64, 0, Math.PI / 3);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.rotation.x = -Math.PI / 2;
    sweepGroup.add(sweepMesh);

    // Sweeping leading edge line
    const leadPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(320, 0, 0)];
    const leadGeo = new THREE.BufferGeometry().setFromPoints(leadPoints);
    const leadMat = new THREE.LineBasicMaterial({ color: 0x00f5d4, linewidth: 2, transparent: true, opacity: 0.6 });
    const leadLine = new THREE.Line(leadGeo, leadMat);
    sweepGroup.add(leadLine);

    scene.add(sweepGroup);

    // 5. Merchant Nodes
    const nodeGroup = new THREE.Group();
    const nodeMeshes: { mesh: THREE.Mesh; merchant: Merchant; basePos: THREE.Vector3; pulseOffset: number }[] = [];

    // Helper textures for node halos
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(canvas);

    merchants.forEach((m, idx) => {
      const angle = (idx / Math.max(1, merchants.length)) * Math.PI * 2 + (Math.sin(idx * 7) * 0.4);
      // Distance based on risk score (0-100 mapped to 30..310)
      const dist = (m.current_risk_score / 100) * 270 + 40;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (m.current_risk_score / 100) * 35; // 3D elevation based on stress

      let nodeColor = 0x10b981; // Healthy
      if (m.risk_band === 'Watchlist') nodeColor = 0xf59e0b;
      if (m.risk_band === 'Critical') nodeColor = 0xef4444;

      const size = m.risk_band === 'Critical' ? 6 : m.risk_band === 'Watchlist' ? 4.5 : 3.5;
      const sphereGeo = new THREE.SphereGeometry(size, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(x, y, z);
      sphereMesh.userData = { merchant: m };

      // Sprite glow halo
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: nodeColor,
        transparent: true,
        opacity: m.risk_band === 'Critical' ? 0.8 : 0.45,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(size * 4, size * 4, 1);
      sphereMesh.add(sprite);

      // Vertical stem drop line to grid plane
      const stemPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -y, 0)];
      const stemGeo = new THREE.BufferGeometry().setFromPoints(stemPoints);
      const stemMat = new THREE.LineBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.25 });
      const stem = new THREE.Line(stemGeo, stemMat);
      sphereMesh.add(stem);

      nodeGroup.add(sphereMesh);
      nodeMeshes.push({
        mesh: sphereMesh,
        merchant: m,
        basePos: new THREE.Vector3(x, y, z),
        pulseOffset: Math.random() * Math.PI * 2
      });
    });

    scene.add(nodeGroup);

    // 6. Ambient 3D Starfield / Dust particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 800;
      particlePositions[i + 1] = Math.random() * 180 - 20;
      particlePositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 2,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(particleGeo, particleMat);
    scene.add(points);

    // 7. Raycaster & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX = Math.max(0.1, Math.min(1.2, targetRotationX + deltaY * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Check hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      if (intersects.length > 0) {
        const found = intersects[0].object.userData.merchant;
        if (found) setHoveredMerchant(found);
      } else if (!isMouseDown) {
        setHoveredMerchant(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      if (intersects.length > 0 && onSelectMerchant) {
        const m = intersects[0].object.userData.merchant;
        if (m) onSelectMerchant(m);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('click', handleClick);

    // 8. Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate radar sweep
      sweepGroup.rotation.y -= 0.015;

      // Auto camera rotation when enabled
      if (isAutoRotating && !isMouseDown) {
        targetRotationY += 0.0015;
      }

      // Smooth camera position orbit interpolation
      const radius = 560;
      camera.position.x = radius * Math.sin(targetRotationY) * Math.cos(targetRotationX);
      camera.position.z = radius * Math.cos(targetRotationY) * Math.cos(targetRotationX);
      camera.position.y = radius * Math.sin(targetRotationX) + 80;
      camera.lookAt(0, 15, 0);

      // Node pulsing for Critical Risk
      nodeMeshes.forEach(({ mesh, merchant, basePos, pulseOffset }) => {
        if (merchant.risk_band === 'Critical') {
          const s = 1 + Math.sin(elapsedTime * 4 + pulseOffset) * 0.25;
          mesh.scale.set(s, s, s);
        }
        // Floating gentle bobbing
        mesh.position.y = basePos.y + Math.sin(elapsedTime * 2 + pulseOffset) * 1.5;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('mousedown', handleMouseDown);
      dom.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      scene.clear();
    };
  }, [merchants, isAutoRotating, onSelectMerchant]);

  return (
    <div className="relative w-full h-[480px] glass-panel rounded-2xl p-4 overflow-hidden border border-slate-800/80 bg-[#0A0E1A]/90">
      
      {/* Top Left Header & Live Pulsing Radar Tag */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500 shadow-glow-teal"></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wide text-slate-100">3D Financial Stress Radar</h3>
            <span className="text-[10px] font-mono uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded">
              Spatial 3D
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {merchants.length} Monitored Merchants • Drag to orbit in 3D
          </p>
        </div>
      </div>

      {/* Top Right Controls & Legend */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald"></span>
            <span className="text-slate-300">Healthy (&lt;40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber"></span>
            <span className="text-slate-300">Watchlist (40-70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-rose animate-pulse"></span>
            <span className="text-slate-300">Critical (&gt;70)</span>
          </div>
        </div>

        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
            isAutoRotating 
              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={isAutoRotating ? 'Pause 3D auto orbit' : 'Resume 3D auto orbit'}
        >
          <Compass className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span className="hidden md:inline">{isAutoRotating ? 'Auto Orbit' : 'Manual'}</span>
        </button>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Floating HUD Card */}
      {hoveredMerchant && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 glass-panel-glow px-5 py-3 rounded-xl text-xs flex items-center gap-5 pointer-events-none animate-fade-in border border-teal-500/40 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>{hoveredMerchant.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredMerchant.id}
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5">
              Sector: <span className="text-slate-200">{hoveredMerchant.sector}</span> • Region: <span className="text-slate-200">{hoveredMerchant.region}</span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-700/80"></div>

          <div>
            <div className="text-slate-400 text-[10px] uppercase font-mono">Stress Index</div>
            <div className={`font-mono font-bold text-base ${
              hoveredMerchant.current_risk_score > 70 
                ? 'text-rose-400' 
                : hoveredMerchant.current_risk_score > 40 
                ? 'text-amber-400' 
                : 'text-emerald-400'
            }`}>
              {hoveredMerchant.current_risk_score} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="text-teal-300 font-mono text-xs flex items-center gap-1 font-semibold pl-2">
            Click to inspect 360° →
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 z-20 text-[11px] font-mono text-slate-500 flex items-center gap-2 pointer-events-none">
        <span>💡 Left-click + Drag to rotate 3D view</span>
        <span>•</span>
        <span>Elevation indicates Stress Level</span>
      </div>

    </div>
  );
};
