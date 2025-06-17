"use client";

import React, { useEffect, useRef, useState } from 'react';

const PuriwiseVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  const features = [
    {
      title: "Live AQI Heatmap",
      subtitle: "Real-time pollution visualization",
      icon: "🗺️",
      color: "#3b82f6",
      gradient: ["#3b82f6", "#1d4ed8"],
      description: "Interactive pollution hotspots"
    },
    {
      title: "AI Health Advisories", 
      subtitle: "Personalized breathing plans",
      icon: "🧠",
      color: "#10b981",
      gradient: ["#10b981", "#059669"],
      description: "Smart health recommendations"
    },
    {
      title: "Clean-Air Routes",
      subtitle: "Optimized path planning", 
      icon: "🛣️",
      color: "#f59e0b",
      gradient: ["#f59e0b", "#d97706"],
      description: "Minimize pollution exposure"
    }
  ];

  const dataPoints = [
    { x: 0.2, y: 0.3, intensity: 0.8, type: 'pollution' },
    { x: 0.7, y: 0.2, intensity: 0.6, type: 'pollution' },
    { x: 0.4, y: 0.7, intensity: 0.9, type: 'pollution' },
    { x: 0.8, y: 0.6, intensity: 0.4, type: 'clean' },
    { x: 0.1, y: 0.8, intensity: 0.3, type: 'clean' },
    { x: 0.6, y: 0.5, intensity: 0.7, type: 'moderate' },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.min(rect.width - 32, 600),
          height: Math.min(rect.height - 32, 400)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const width = dimensions.width;
    const height = dimensions.height;
    
    let animationTime = 0;

    const drawVisualization = () => {
      animationTime += 0.02;
      
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const currentFeature = features[activeFeature];

      if (activeFeature === 0) {
        drawHeatmapVisualization(ctx, width, height, animationTime);
      } else if (activeFeature === 1) { 
        drawAIVisualization(ctx, width, height, animationTime);
      } else {
        drawRoutesVisualization(ctx, width, height, animationTime);
      }

      drawFloatingParticles(ctx, width, height, animationTime, currentFeature.color);
    };

    const drawHeatmapVisualization = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const x = (w / 10) * i;
        const y = (h / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        if (i < 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      dataPoints.forEach((point, index) => {
        const x = point.x * w;
        const y = point.y * h;
        const pulseIntensity = Math.sin(time + index) * 0.3 + 0.7;
        const radius = 30 + point.intensity * 20 + Math.sin(time + index) * 10;
        
        let color;
        if (point.type === 'pollution') {
          color = `rgba(239, 68, 68, ${point.intensity * 0.6 * pulseIntensity})`;
        } else if (point.type === 'clean') {
          color = `rgba(34, 197, 94, ${point.intensity * 0.6 * pulseIntensity})`;
        } else {
          color = `rgba(245, 158, 11, ${point.intensity * 0.6 * pulseIntensity})`;
        }

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      drawLegend(ctx, w, h, ['High Pollution', 'Moderate', 'Clean Air'], ['#ef4444', '#f59e0b', '#22c55e']);
    };

    const drawAIVisualization = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const centerX = w / 2;
      const centerY = h / 2;

      const nodes = [
        { x: centerX - 150, y: centerY - 60, label: 'Age' },
        { x: centerX - 150, y: centerY, label: 'Activity' },
        { x: centerX - 150, y: centerY + 60, label: 'Health' },
        { x: centerX, y: centerY - 30, label: 'AI Processing' },
        { x: centerX, y: centerY + 30, label: 'Analysis' },
        { x: centerX + 150, y: centerY, label: 'Health Plan' }
      ];

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      
      const connections = [
        [0, 3], [1, 3], [2, 4], [3, 5], [4, 5]
      ];

      connections.forEach(([from, to], index) => {
        const fromNode = nodes[from];
        const toNode = nodes[to];
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        const flowIntensity = Math.sin(time * 2 + index) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 + flowIntensity * 0.7})`;
        ctx.stroke();

        const progress = (Math.sin(time + index) + 1) / 2;
        const particleX = fromNode.x + (toNode.x - fromNode.x) * progress;
        const particleY = fromNode.y + (toNode.y - fromNode.y) * progress;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
      });

      nodes.forEach((node, index) => {
        const pulseSize = 5 + Math.sin(time + index) * 2;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15 + pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = index < 3 ? '#3b82f6' : index < 5 ? '#10b981' : '#f59e0b';
        ctx.fill();
        
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 35);
      });
    };

    const drawRoutesVisualization = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(w - 50, y);
        ctx.stroke();
      }
      
      for (let i = 1; i < 6; i++) {
        const x = ((w - 100) / 6) * i + 50;
        ctx.beginPath();
        ctx.moveTo(x, h / 5);
        ctx.lineTo(x, (h / 5) * 4);
        ctx.stroke();
      }

      const pollutionZones = [
        { x: w * 0.3, y: h * 0.4, size: 40 },
        { x: w * 0.7, y: h * 0.3, size: 35 },
        { x: w * 0.5, y: h * 0.7, size: 30 }
      ];

      pollutionZones.forEach((zone, index) => {
        const pulseIntensity = Math.sin(time + index) * 0.2 + 0.8;
        const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.size * pulseIntensity);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
        
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.size * pulseIntensity, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      const routePoints = [
        { x: 80, y: h * 0.8 },
        { x: w * 0.2, y: h * 0.8 },
        { x: w * 0.2, y: h * 0.6 },
        { x: w * 0.4, y: h * 0.6 },
        { x: w * 0.4, y: h * 0.2 },
        { x: w * 0.8, y: h * 0.2 },
        { x: w * 0.8, y: h * 0.5 },
        { x: w - 80, y: h * 0.5 }
      ];

      ctx.beginPath();
      ctx.moveTo(routePoints[0].x, routePoints[0].y);
      routePoints.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.stroke();

      const totalPoints = routePoints.length - 1;
      const progress = (Math.sin(time * 0.5) + 1) / 2;
      const segmentProgress = progress * totalPoints;
      const currentSegment = Math.floor(segmentProgress);
      const segmentPosition = segmentProgress - currentSegment;
      
      if (currentSegment < totalPoints) {
        const current = routePoints[currentSegment];
        const next = routePoints[currentSegment + 1];
        const travelerX = current.x + (next.x - current.x) * segmentPosition;
        const travelerY = current.y + (next.y - current.y) * segmentPosition;
        
        ctx.beginPath();
        ctx.arc(travelerX, travelerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#1d4ed8';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(travelerX, travelerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(29, 78, 216, 0.2)';
        ctx.fill();
      }

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(routePoints[0].x, routePoints[0].y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(routePoints[routePoints.length - 1].x, routePoints[routePoints.length - 1].y, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawFloatingParticles = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        const x = (Math.sin(time + i) * 0.5 + 0.5) * w;
        const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * h;
        const size = Math.sin(time + i) * 2 + 3;
        const opacity = Math.sin(time + i) * 0.3 + 0.7;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    };

    const drawLegend = (ctx: CanvasRenderingContext2D, w: number, h: number, labels: string[], colors: string[]) => {
      const legendX = 20;
      const legendY = h - 60;
      
      labels.forEach((label, index) => {
        const y = legendY + index * 20;
        
        ctx.beginPath();
        ctx.arc(legendX, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, legendX + 15, y + 4);
      });
    };

    const animate = () => {
      drawVisualization();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, activeFeature]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveFeature(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeFeature 
                ? 'bg-blue-500 w-6' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
      
      <div className="absolute top-6 left-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{features[activeFeature].icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {features[activeFeature].title}
            </h3>
            <p className="text-sm text-gray-600">
              {features[activeFeature].subtitle}
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute top-6 right-6 text-right">
        <div className="text-2xl font-bold text-gray-900">Real-time</div>
        <div className="text-sm text-gray-600">Data Processing</div>
      </div>
    </div>
  );
};

export default PuriwiseVisualization;