import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MobileHeroFallback } from './MobileHeroFallback';

export const SecurityCore3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLError, setWebGLError] = useState(false);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Check if WebGL is supported
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('[3D_CORE] WebGL not supported on this browser context. Using procedural fallback.');
        setWebGLError(true);
        return;
      }
    } catch (e) {
      console.warn('[3D_CORE] WebGL detection failed:', e);
      setWebGLError(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    const innerGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const nucleusGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const shieldGeo = new THREE.IcosahedronGeometry(3.6, 2);
    const ring1Geo = new THREE.TorusGeometry(5.2, 0.04, 16, 100);
    const ring2Geo = new THREE.TorusGeometry(6.4, 0.03, 16, 100);
    const particlesGeo = new THREE.BufferGeometry();

    try {
      // Dimensions
      const width = currentMount.clientWidth || window.innerWidth;
      const height = currentMount.clientHeight || 500;

      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
      camera.position.set(0, 0, 16);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      currentMount.appendChild(renderer.domElement);

      // Ambient & Point Lights
      const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.6);
      scene.add(ambientLight);

      const coreLight = new THREE.PointLight(0x00f0ff, 3, 25);
      coreLight.position.set(0, 0, 0);
      scene.add(coreLight);

      const redLight = new THREE.PointLight(0xef4444, 2, 20);
      redLight.position.set(6, 4, 3);
      scene.add(redLight);

      const greenLight = new THREE.PointLight(0x10b981, 2, 20);
      greenLight.position.set(-6, -4, 3);
      scene.add(greenLight);

      // Central Security Core Group
      const coreGroup = new THREE.Group();
      scene.add(coreGroup);

      // Inner glowing sphere
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const innerSphere = new THREE.Mesh(innerGeo, innerMat);
      coreGroup.add(innerSphere);

      // Solid core nucleus
      const nucleusMat = new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
        emissive: 0x083344,
      });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      coreGroup.add(nucleus);

      // Outer crystalline shield (Icosahedron wireframe)
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      coreGroup.add(shield);

      // Orbit Rings
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.4 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      ring1.rotation.y = Math.PI / 6;
      scene.add(ring1);

      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.3 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = -Math.PI / 4;
      ring2.rotation.y = -Math.PI / 4;
      scene.add(ring2);

      // Particle Data Streams (Inbound actions -> Core -> Outbound Decisions)
      const particleCount = 450;
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);

      const colorGreen = new THREE.Color(0x10b981);
      const colorAmber = new THREE.Color(0xf59e0b);
      const colorRed = new THREE.Color(0xef4444);
      const colorCyan = new THREE.Color(0x06b6d4);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 3.5 + Math.random() * 8.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;

        posArray[i3] = radius * Math.cos(theta) * Math.cos(phi);
        posArray[i3 + 1] = radius * Math.sin(phi);
        posArray[i3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

        // Distribute semantic decision particle colors
        const rand = Math.random();
        let pColor = colorCyan;
        if (rand < 0.45) pColor = colorGreen; // ALLOW
        else if (rand < 0.70) pColor = colorAmber; // CONFIRM
        else if (rand < 0.90) pColor = colorRed; // BLOCK

        colorArray[i3] = pColor.r;
        colorArray[i3 + 1] = pColor.g;
        colorArray[i3 + 2] = pColor.b;
      }

      particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

      const particlesMat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particlesMesh);

      // Mouse Interaction Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        const rect = currentMount.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
        mouseY = -(((event.clientY - rect.top) / height) * 2 - 1);
      };

      window.addEventListener('mousemove', handleMouseMove);

      // Resize Handler
      const handleResize = () => {
        if (!currentMount || !renderer) return;
        const newWidth = currentMount.clientWidth;
        const newHeight = currentMount.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Smooth camera interpolation
        targetX += (mouseX * 2.5 - targetX) * 0.05;
        targetY += (mouseY * 2.5 - targetY) * 0.05;
        camera.position.x = targetX;
        camera.position.y = targetY;
        camera.lookAt(0, 0, 0);

        // Rotate central core
        coreGroup.rotation.y = elapsedTime * 0.25;
        coreGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
        nucleus.rotation.y = -elapsedTime * 0.4;
        nucleus.rotation.z = elapsedTime * 0.2;

        // Pulse shield
        const scalePulse = 1 + Math.sin(elapsedTime * 2) * 0.04;
        shield.scale.set(scalePulse, scalePulse, scalePulse);

        // Rotate orbit rings
        ring1.rotation.z = elapsedTime * 0.15;
        ring2.rotation.z = -elapsedTime * 0.12;

        // Rotate particle cloud
        particlesMesh.rotation.y = elapsedTime * 0.08;
        particlesMesh.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1;

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        if (renderer && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
        if (renderer) renderer.dispose();
        innerGeo.dispose();
        nucleusGeo.dispose();
        shieldGeo.dispose();
        ring1Geo.dispose();
        ring2Geo.dispose();
        particlesGeo.dispose();
      };
    } catch (err) {
      console.warn('[3D_CORE] Three.js initialization exception, switching to procedural fallback:', err);
      setWebGLError(true);
    }
  }, []);

  if (webGLError) {
    return <MobileHeroFallback />;
  }

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[480px] md:h-[580px] cursor-grab active:cursor-grabbing select-none"
    />
  );
};
