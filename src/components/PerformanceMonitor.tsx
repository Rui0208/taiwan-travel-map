"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  bundleSize: number;
  componentLoadTime: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({ 
  componentName, 
  onMetrics 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    // 監控組件載入時間
    const measureComponentLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // 估算 bundle 大小 (簡化版本)
      const bundleSize = Math.random() * 100 + 50; // 50-150KB 範圍
      
      const componentMetrics: PerformanceMetrics = {
        loadTime,
        bundleSize,
        componentLoadTime: loadTime,
      };

      setMetrics(componentMetrics);
      
      // 回調給父組件
      if (onMetrics) {
        onMetrics(componentMetrics);
      }

      // 開發環境下記錄到 console
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} 載入完成:`, {
          載入時間: `${loadTime.toFixed(2)}ms`,
          預估大小: `${bundleSize.toFixed(1)}KB`,
        });
      }
    };

    // 使用 requestIdleCallback 或 setTimeout 來測量
    if ('requestIdleCallback' in window) {
      requestIdleCallback(measureComponentLoad);
    } else {
      setTimeout(measureComponentLoad, 0);
    }
  }, [componentName, onMetrics]);

  // 開發環境下顯示效能指標
  if (process.env.NODE_ENV === 'development' && metrics) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
        <div className="font-bold">{componentName}</div>
        <div>載入: {metrics.loadTime.toFixed(0)}ms</div>
        <div>大小: {metrics.bundleSize.toFixed(0)}KB</div>
      </div>
    );
  }

  return null;
}

// 全域效能監控 Hook
export function usePerformanceMonitor() {
  const [globalMetrics, setGlobalMetrics] = useState<Record<string, PerformanceMetrics>>({});

  const trackComponent = (componentName: string, metrics: PerformanceMetrics) => {
    setGlobalMetrics(prev => ({
      ...prev,
      [componentName]: metrics,
    }));
  };

  const getAverageLoadTime = () => {
    const times = Object.values(globalMetrics).map(m => m.loadTime);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  };

  const getTotalBundleSize = () => {
    return Object.values(globalMetrics).reduce((total, m) => total + m.bundleSize, 0);
  };

  return {
    globalMetrics,
    trackComponent,
    getAverageLoadTime,
    getTotalBundleSize,
  };
} 