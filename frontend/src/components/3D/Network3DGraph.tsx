import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Merchant } from '../../types';
import { Network, Activity, Filter, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface Network3DProps {
  merchants: Merchant[];
  onSelectMerchant?: (m: Merchant) => void;
  selectedMerchantId?: string | null;
}

export const Network3DGraph: React.FC<Network3DProps> = ({
  merchants,
  onSelectMerchant,
  selectedMerchantId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Merchant | null>(null);
  const [selectedNode, setSelectedNode] = useState<Merchant | null>(null);
  const [stressPropagationActive, setStressPropagationActive] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.0012);

    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 2500);
    camera.position.set(0, 200, 520);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Grid Plane
    const gridHelper = new THREE.GridHelper(800, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // 4. Generate 3D Graph Nodes
    const displayMerchants = merchants.slice(0, 45); // top 45 merchants for network view
    const nodeGroup = new THREE.Group();
    const nodeDataList: { mesh: THREE.Mesh; merchant: Merchant; position: THREE.Vector3; sectorIdx: number }[] = [];

    const sectors = Array.from(new Set(displayMerchants.map(m => m.sector)));
    const sectorAngleStep = (Math.PI * 2) / Math.max(1, sectors.length);

    // Glow Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(canvas);

    displayMerchants.forEach((m, i) => {
      const sIdx = sectors.indexOf(m.sector);
      const sectorAngle = sIdx * sectorAngleStep;
      const radius = 120 + ((i % 5) * 45);
      const theta = sectorAngle + ((i % 3) - 1) * 0.35;
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = ((m.current_risk_score - 50) / 50) * 80 + Math.sin(i * 1.5) * 20;

      let color = 0x10b981;
      if (m.risk_band === 'Watchlist') color = 0xf59e0b;
      if (m.risk_band === 'Critical') color = 0xef4444;

      const size = m.risk_band === 'Critical' ? 6.5 : m.risk_band === 'Watchlist' ? 5 : 4;
      const geo = new THREE.SphereGeometry(size, 20, 20);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { merchant: m };

      // Halo Sprite
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        opacity: m.risk_band === 'Critical' ? 0.85 : 0.45,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(size * 4.5, size * 4.5, 1);
      mesh.add(sprite);

      nodeGroup.add(mesh);
      nodeDataList.push({ mesh, merchant: m, position: new THREE.Vector3(x, y, z), sectorIdx: sIdx });
    });

    scene.add(nodeGroup);

    // 5. Connect Supply Chain & Transaction Link Edges (Curves)
    const linksGroup = new THREE.Group();
    const linkCurves: THREE.QuadraticBezierCurve3[] = [];

    for (let i = 0; i < nodeDataList.length; i++) {
      // Connect to 2 or 3 nearby nodes
      for (let j = i + 1; j < Math.min(i + 4, nodeDataList.length); j++) {
        const p1 = nodeDataList[i].position;
        const p2 = nodeDataList[j].position;
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        mid.y += 25; // arch curve upwards

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        linkCurves.push(curve);

        const points = curve.getPoints(24);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        
        // Link color depends on risk interaction
        const isCriticalLink = nodeDataList[i].merchant.risk_band === 'Critical' || nodeDataList[j].merchant.risk_band === 'Critical';
        const lineMat = new THREE.LineBasicMaterial({
          color: isCriticalLink ? 0xef4444 : 0x00f5d4,
          transparent: true,
          opacity: isCriticalLink ? 0.35 : 0.12
        });
        const line = new THREE.Line(lineGeo, lineMat);
        linksGroup.add(line);
      }
    }
    scene.add(linksGroup);

    // 6. Traveling Energy Packets (Particles traversing link curves)
    const packetCount = linkCurves.length;
    const packetGeo = new THREE.BufferGeometry();
    const packetPositions = new Float32Array(packetCount * 3);
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));
    const packetMat = new THREE.PointsMaterial({
      color: 0x00f5d4,
      size: 4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const packets = new THREE.Points(packetGeo, packetMat);
    scene.add(packets);

    // 7. Mouse Orbit Controls & Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0.35;
    let zoomDistance = 540;

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
        targetRotationX = Math.max(-0.2, Math.min(1.2, targetRotationX + deltaY * 0.005));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      if (intersects.length > 0) {
        const found = intersects[0].object.userData.merchant;
        if (found) setHoveredNode(found);
      } else if (!isMouseDown) {
        setHoveredNode(null);
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

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistance = Math.max(250, Math.min(950, zoomDistance + e.deltaY * 0.5));
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      if (intersects.length > 0) {
        const found = intersects[0].object.userData.merchant;
        if (found) {
          setSelectedNode(found);
          if (onSelectMerchant) onSelectMerchant(found);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);

    // 8. Animation loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Auto gentle rotation
      if (!isMouseDown) {
        targetRotationY += 0.001;
      }

      // Camera positioning
      camera.position.x = zoomDistance * Math.sin(targetRotationY) * Math.cos(targetRotationX);
      camera.position.z = zoomDistance * Math.cos(targetRotationY) * Math.cos(targetRotationX);
      camera.position.y = zoomDistance * Math.sin(targetRotationX) + 50;
      camera.lookAt(0, 0, 0);

      // Animate packet positions along curves
      const posAttr = packetGeo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < linkCurves.length; k++) {
        const t = (time * 0.4 + (k / linkCurves.length)) % 1;
        const pt = linkCurves[k].getPoint(t);
        posAttr.setXYZ(k, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;

      // Pulse nodes
      nodeDataList.forEach(({ mesh, merchant, position }, idx) => {
        if (merchant.risk_band === 'Critical') {
          const s = 1 + Math.sin(time * 5 + idx) * 0.3;
          mesh.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

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
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      scene.clear();
    };
  }, [merchants, stressPropagationActive, onSelectMerchant]);

  return (
    <div className="relative w-full h-[520px] glass-panel rounded-2xl p-4 overflow-hidden border border-slate-800/80 bg-[#0A0E1A]/95">
      
      {/* Header Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
          <Network className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">3D Supply Chain & Contagion Graph</h3>
            <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
              Topology Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Transaction Interconnects & Stress Transmission
          </p>
        </div>
      </div>

      {/* Control Tools */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setStressPropagationActive(!stressPropagationActive)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
            stressPropagationActive 
              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Stress Packets: {stressPropagationActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Card */}
      {hoveredNode && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 glass-panel-glow px-5 py-3 rounded-xl text-xs flex items-center gap-4 pointer-events-none animate-fade-in border border-teal-500/40 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="font-bold text-slate-100 text-sm">{hoveredNode.name}</div>
            <div className="text-slate-400 font-mono text-[11px]">{hoveredNode.id} • {hoveredNode.sector}</div>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div>
            <div className="text-slate-400 text-[10px]">Stress Score</div>
            <div className={`font-mono font-bold text-sm ${
              hoveredNode.current_risk_score > 70 ? 'text-rose-400' : hoveredNode.current_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {hoveredNode.current_risk_score} / 100
            </div>
          </div>
          <div className="text-teal-300 font-mono text-[11px] font-semibold pl-2">Click to open 360° →</div>
        </div>
      )}

      {/* Footer Navigation Help */}
      <div className="absolute bottom-3 left-4 z-20 text-[11px] font-mono text-slate-500 flex items-center gap-2 pointer-events-none">
        <span>🖱️ Drag to rotate 3D graph</span>
        <span>•</span>
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Click node to select</span>
      </div>

    </div>
  );
};
