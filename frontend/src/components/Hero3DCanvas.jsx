import React, { useEffect, useRef } from 'react';

const Hero3DCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 500);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 500;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking with lerp smoothing
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 3D Particles & Neural Net Nodes
    const NUM_PARTICLES = 120;
    const particles = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100, // 3D Depth Z
        ox: (Math.random() - 0.5) * width * 1.5,
        oy: (Math.random() - 0.5) * height * 1.5,
        oz: Math.random() * 800 + 100,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.4 ? '#F97316' : '#38BDF8' // IEEE Orange & Cyan
      });
    }

    // 3D Wireframe Icosahedron Mesh Nodes
    const meshNodes = [];
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = 160;

    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([v1, v2, v3]) => ({
      x: v1 * scale,
      y: v2 * scale,
      z: v3 * scale
    }));

    let rotX = 0;
    let rotY = 0;

    const render = () => {
      // Smooth lerp mouse coordinates
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const normMouseX = (mouse.x - width / 2) / (width / 2);
      const normMouseY = (mouse.y - height / 2) / (height / 2);

      rotY += 0.005 + normMouseX * 0.02;
      rotX += 0.003 + normMouseY * 0.02;

      ctx.clearRect(0, 0, width, height);

      // FOCAL LENGTH for 3D Perspective Projection
      const fov = 400;
      const centerX = width / 2;
      const centerY = height / 2;

      // Project & Draw 3D Floating Particles
      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around bounds
        if (p.z < 50) p.z = 900;
        if (p.z > 900) p.z = 50;

        // 3D Rotation based on cursor
        const cosY = Math.cos(normMouseX * 0.8);
        const sinY = Math.sin(normMouseX * 0.8);
        const cosX = Math.cos(normMouseY * 0.8);
        const sinX = Math.sin(normMouseY * 0.8);

        let rx = p.x * cosY - p.z * sinY;
        let rz = p.x * sinY + p.z * cosY;

        let ry = p.y * cosX - rz * sinX;
        rz = p.y * sinX + rz * cosX;

        // 3D to 2D Screen Projection
        const scale2D = fov / (fov + rz + 400);
        const sx = rx * scale2D + centerX;
        const sy = ry * scale2D + centerY;

        if (sx > 0 && sx < width && sy > 0 && sy < height && scale2D > 0) {
          projected.push({ sx, sy, scale2D, color: p.color, size: p.size });

          // Draw Particle Node
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * scale2D, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, scale2D * 1.2));
          ctx.fill();

          // Particle Glow
          ctx.shadowBlur = 12 * scale2D;
          ctx.shadowColor = p.color;
        }
      }

      // Draw Neural Network Connections (3D distance check)
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.25;
            ctx.stroke();
          }
        }
      }

      // Draw 3D Interactive Rotating Wireframe Geometric Core
      const projectedMesh = baseVertices.map((v) => {
        // Rotate X
        let y1 = v.y * Math.cos(rotX) - v.z * Math.sin(rotX);
        let z1 = v.y * Math.sin(rotX) + v.z * Math.cos(rotX);

        // Rotate Y
        let x2 = v.x * Math.cos(rotY) + z1 * Math.sin(rotY);
        let z2 = -v.x * Math.sin(rotY) + z1 * Math.cos(rotY);

        const s = fov / (fov + z2 + 300);
        return {
          sx: x2 * s + centerX,
          sy: y1 * s + centerY,
          s
        };
      });

      // Draw Icosahedron Edges
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.4;

      for (let i = 0; i < projectedMesh.length; i++) {
        for (let j = i + 1; j < projectedMesh.length; j++) {
          const v1 = projectedMesh[i];
          const v2 = projectedMesh[j];
          const dist = Math.hypot(v1.sx - v2.sx, v1.sy - v2.sy);

          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(v1.sx, v1.sy);
            ctx.lineTo(v2.sx, v2.sy);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

export default Hero3DCanvas;
