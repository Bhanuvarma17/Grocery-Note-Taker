import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Produce3DHeroProps {
  compact?: boolean;
}

export const Produce3DHero: React.FC<Produce3DHeroProps> = ({ compact = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [is3DDisabled, setIs3DDisabled] = useState(false);
  const [webGLError, setWebGLError] = useState(false);

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (is3DDisabled || webGLError) return;
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;

    // Track mouse for gentle interactive tilt
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 0.45;
      mouseY = y * 0.35;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 320;
      const height = container.clientHeight || (compact ? 95 : 135);

      camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      camera.position.set(0, 0.3, 4.4);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Studio Lighting for Glass reflection
      const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.85);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4edda, 1.0);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfffaee, 2.4);
      keyLight.position.set(3, 4.5, 3.5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xecfdf5, 1.3);
      fillLight.position.set(-3, 1, 2);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xfef9c3, 1.2);
      rimLight.position.set(0, -2, -2);
      scene.add(rimLight);

      // Root group for all produce
      const produceCluster = new THREE.Group();
      scene.add(produceCluster);

      // -------------------------------------------------------------
      // 1. PROCEDURAL TOMATO (Center-Left)
      // -------------------------------------------------------------
      const tomatoGroup = new THREE.Group();
      const tomatoGeo = new THREE.SphereGeometry(0.72, 32, 24);
      const pos = tomatoGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        pos.setY(i, y * 0.88);
      }
      tomatoGeo.computeVertexNormals();

      const tomatoMat = new THREE.MeshStandardMaterial({
        color: 0xef4444, // Vibrant ripe tomato red
        roughness: 0.22,
        metalness: 0.1,
      });
      const tomatoMesh = new THREE.Mesh(tomatoGeo, tomatoMat);
      tomatoGroup.add(tomatoMesh);

      // Calyx & stem
      const calyxGroup = new THREE.Group();
      calyxGroup.position.set(0, 0.62, 0);

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.45,
      });

      for (let i = 0; i < 5; i++) {
        const sepalGeo = new THREE.ConeGeometry(0.08, 0.32, 5);
        sepalGeo.rotateX(Math.PI / 2.3);
        const sepal = new THREE.Mesh(sepalGeo, leafMat);
        sepal.rotation.y = (i * Math.PI * 2) / 5;
        sepal.position.y = 0.02;
        calyxGroup.add(sepal);
      }

      const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8);
      stemGeo.rotateZ(0.2);
      const stem = new THREE.Mesh(stemGeo, leafMat);
      stem.position.set(0.02, 0.12, 0);
      calyxGroup.add(stem);

      tomatoGroup.add(calyxGroup);
      tomatoGroup.position.set(-0.85, -0.05, 0.2);
      tomatoGroup.rotation.set(0.1, -0.2, -0.05);
      produceCluster.add(tomatoGroup);

      // -------------------------------------------------------------
      // 2. PROCEDURAL CARROT (Center-Right)
      // -------------------------------------------------------------
      const carrotGroup = new THREE.Group();
      const carrotGeo = new THREE.CylinderGeometry(0.24, 0.04, 1.45, 18);
      const carrotMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, // Fresh farm carrot
        roughness: 0.36,
        metalness: 0.05,
      });
      const carrotMesh = new THREE.Mesh(carrotGeo, carrotMat);
      carrotGroup.add(carrotMesh);

      const foliageGroup = new THREE.Group();
      foliageGroup.position.set(0, 0.72, 0);

      const fernMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.5,
      });

      for (let i = 0; i < 4; i++) {
        const tuftGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.45, 6);
        const tuft = new THREE.Mesh(tuftGeo, fernMat);
        tuft.position.set(
          Math.sin(i * 1.5) * 0.06,
          0.2,
          Math.cos(i * 1.5) * 0.06
        );
        tuft.rotation.z = (i - 1.5) * 0.25;
        tuft.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.15;
        foliageGroup.add(tuft);
      }
      carrotGroup.add(foliageGroup);

      carrotGroup.position.set(0.7, -0.05, 0.1);
      carrotGroup.rotation.set(-0.25, 0.4, -0.45);
      produceCluster.add(carrotGroup);

      // -------------------------------------------------------------
      // 3. PROCEDURAL CRISP BELL PEPPER / LEAFY GREENS (Foreground Center)
      // -------------------------------------------------------------
      const pepperGroup = new THREE.Group();
      const pepperGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.75, 16);
      const pepperMat = new THREE.MeshStandardMaterial({
        color: 0x15803d, // Crisp emerald pepper
        roughness: 0.26,
        metalness: 0.12,
      });
      const pepperMesh = new THREE.Mesh(pepperGeo, pepperMat);
      pepperGroup.add(pepperMesh);

      const pepperStemGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.2, 7);
      const pepperStemMat = new THREE.MeshStandardMaterial({
        color: 0x14532d,
        roughness: 0.6,
      });
      const pepperStem = new THREE.Mesh(pepperStemGeo, pepperStemMat);
      pepperStem.position.set(0, 0.46, 0);
      pepperGroup.add(pepperStem);

      pepperGroup.position.set(-0.05, -0.38, 0.55);
      pepperGroup.scale.set(0.72, 0.72, 0.72);
      pepperGroup.rotation.set(0.18, 0.3, 0.1);
      produceCluster.add(pepperGroup);

      // -------------------------------------------------------------
      // 4. PROCEDURAL ONION / SHALLOT (Far Right Accent)
      // -------------------------------------------------------------
      const onionGroup = new THREE.Group();
      const onionGeo = new THREE.SphereGeometry(0.38, 20, 16);
      const onionMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7, // Red / purple onion
        roughness: 0.28,
        metalness: 0.08,
      });
      const onionMesh = new THREE.Mesh(onionGeo, onionMat);
      onionGroup.add(onionMesh);

      const sproutGeo = new THREE.ConeGeometry(0.06, 0.35, 6);
      const sproutMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 });
      const sprout = new THREE.Mesh(sproutGeo, sproutMat);
      sprout.position.set(0, 0.4, 0);
      onionGroup.add(sprout);

      onionGroup.position.set(1.4, -0.25, -0.2);
      onionGroup.rotation.set(0.1, 0, 0.2);
      produceCluster.add(onionGroup);

      // -------------------------------------------------------------
      // 5. PROCEDURAL BROCCOLI CROWN (Far Left Accent)
      // -------------------------------------------------------------
      const broccoliGroup = new THREE.Group();
      const stalkGeo = new THREE.CylinderGeometry(0.14, 0.2, 0.5, 10);
      const stalkMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      broccoliGroup.add(stalk);

      const crownGeo = new THREE.DodecahedronGeometry(0.38, 1);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 0.32, 0);
      broccoliGroup.add(crown);

      broccoliGroup.position.set(-1.45, -0.2, -0.15);
      broccoliGroup.rotation.set(0.15, -0.3, -0.2);
      produceCluster.add(broccoliGroup);

      // -------------------------------------------------------------
      // 6. SOFT CONTACT SHADOW PLANE
      // -------------------------------------------------------------
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
        grad.addColorStop(0, 'rgba(10, 30, 20, 0.35)');
        grad.addColorStop(0.5, 'rgba(10, 30, 20, 0.15)');
        grad.addColorStop(1, 'rgba(10, 30, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(3.8, 1.8);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -0.85, 0);
      produceCluster.add(shadowMesh);

      // Position entire cluster
      produceCluster.position.set(0, compact ? -0.1 : 0, 0);

      // Resize handler
      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth || 320;
        const newH = container.clientHeight || (compact ? 95 : 135);
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        if (!prefersReducedMotion) {
          // Gentle breathing float
          tomatoGroup.position.y = -0.05 + Math.sin(elapsed * 1.3) * 0.04;
          carrotGroup.position.y = -0.05 + Math.cos(elapsed * 1.1) * 0.045;
          pepperGroup.position.y = -0.38 + Math.sin(elapsed * 1.5 + 1) * 0.035;
          onionGroup.position.y = -0.25 + Math.sin(elapsed * 1.2 + 2) * 0.03;
          broccoliGroup.position.y = -0.2 + Math.cos(elapsed * 1.4 + 1.5) * 0.03;

          // Parallax interpolation
          targetRotationY = mouseX * 0.6;
          targetRotationX = mouseY * 0.4;
          produceCluster.rotation.y = THREE.MathUtils.damp(produceCluster.rotation.y, targetRotationY, 4, delta);
          produceCluster.rotation.x = THREE.MathUtils.damp(produceCluster.rotation.x, targetRotationX, 4, delta);
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', onPointerMove);
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        // Dispose geometries and materials
        tomatoGeo.dispose();
        tomatoMat.dispose();
        leafMat.dispose();
        carrotGeo.dispose();
        carrotMat.dispose();
        fernMat.dispose();
        pepperGeo.dispose();
        pepperMat.dispose();
        pepperStemGeo.dispose();
        pepperStemMat.dispose();
        onionGeo.dispose();
        onionMat.dispose();
        sproutGeo.dispose();
        sproutMat.dispose();
        stalkGeo.dispose();
        stalkMat.dispose();
        crownGeo.dispose();
        crownMat.dispose();
        shadowGeo.dispose();
        shadowMat.dispose();
        shadowTex.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.warn('WebGL initialization failed in Produce3DHero', err);
      setWebGLError(true);
    }
  }, [compact, is3DDisabled, prefersReducedMotion, webGLError]);

  if (is3DDisabled || webGLError) {
    return (
      <div
        className={`flex items-center justify-center gap-3 select-none ${
          compact ? 'h-16' : 'h-24'
        }`}
        aria-label="Fresh grocery produce graphic"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          3D Produce (Disabled)
        </span>
        <button
          onClick={() => setIs3DDisabled(false)}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline ml-2 transition-colors"
          title="Enable 3D view"
        >
          Enable 3D
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none group">
      {/* 3D Canvas Container - pointer-events-none so it NEVER blocks any click or tap */}
      <div
        ref={mountRef}
        className={`w-full max-w-md pointer-events-none flex items-center justify-center ${
          compact ? 'h-24' : 'h-32 md:h-36'
        }`}
        aria-hidden="true"
      />

      {/* Control to switch to static view if preferred by user */}
      <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIs3DDisabled(true)}
          className="text-[10px] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 bg-white/50 dark:bg-black/40 px-2 py-0.5 rounded border border-stone-200/50 dark:border-white/10 transition-colors"
          title="Switch to flat mode for low-power savings"
        >
          Flat Mode
        </button>
      </div>
    </div>
  );
};
