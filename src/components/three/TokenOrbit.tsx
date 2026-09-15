"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A slow cluster of coins orbiting the center, rendered with three.js.
 * Pointer movement nudges the camera. Honors reduced-motion by holding still.
 */
export default function TokenOrbit() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    // Far enough back that the nearest coin on the widest orbit still fits the
    // frame; narrow (phone) frames need a little more distance.
    const distanceFor = (aspect: number) => (aspect < 1.2 ? 15.5 : 13);
    camera.position.set(0, 0, distanceFor(camera.aspect));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const violet = new THREE.Color("#9945FF");
    const mint = new THREE.Color("#14F195");

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 6, 8);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0x8866cc, 0.6));
    const rim = new THREE.PointLight(0x14f195, 6, 30);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.16, 48);
    const coins: { mesh: THREE.Mesh; speed: number; radius: number; phase: number; tilt: number }[] = [];
    const COUNT = 9;

    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? violet : mint,
        metalness: 0.85,
        roughness: 0.25,
        emissive: (i % 2 === 0 ? violet : mint).clone().multiplyScalar(0.12),
      });
      const mesh = new THREE.Mesh(coinGeo, mat);
      const radius = 2.2 + (i % 3) * 0.8;
      const phase = (i / COUNT) * Math.PI * 2;
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
      coins.push({
        mesh,
        speed: 0.12 + (i % 4) * 0.04,
        radius,
        phase,
        tilt: (i % 5) * 0.2,
      });
    }

    const center = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.6,
        roughness: 0.2,
        emissive: violet.clone().multiplyScalar(0.18),
        flatShading: true,
      }),
    );
    group.add(center);

    let mx = 0;
    let my = 0;
    function onMove(e: PointerEvent) {
      const r = mount!.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      my = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
    }
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const clock = new THREE.Clock();

    function frame() {
      const t = clock.getElapsedTime();
      for (const c of coins) {
        const a = reduced ? c.phase : c.phase + t * c.speed;
        c.mesh.position.set(
          Math.cos(a) * c.radius,
          Math.sin(a * 1.3 + c.tilt) * 0.8,
          Math.sin(a) * c.radius,
        );
        if (!reduced) c.mesh.rotation.z += 0.01;
      }
      if (!reduced) {
        group.rotation.y = t * 0.12;
        center.rotation.x = t * 0.3;
        center.rotation.y = t * 0.2;
      }
      camera.position.x += (mx * 4 - camera.position.x) * 0.05;
      camera.position.y += (-my * 4 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    frame();

    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.position.z = distanceFor(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      coinGeo.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}
