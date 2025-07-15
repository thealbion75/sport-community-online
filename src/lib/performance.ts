/**
 * Performance Optimization Utilities
 * Tools for monitoring and optimizing application performance
 */

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', entry.duration);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation timing observer not supported');
    }

    // Observe resource loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(`resource-${entry.initiatorType}`, entry.duration);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing observer not supported');
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint timing observer not supported');
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported');
    }

    // Observe cumulative layout shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cumulative-layout-shift', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }
    
    return result;
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.recordMetric(`function-${name}`, end - start);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    this.recordMetric(`async-function-${name}`, end - start);
    return result;
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    const metrics = this.getMetrics();
    return {
      lcp: metrics['largest-contentful-paint']?.avg,
      fid: metrics['first-input-delay']?.avg,
      cls: metrics['cumulative-layout-shift']?.avg
    };
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

/**
 * Image optimization utilities
 */
export const ImageOptimizer = {
  /**
   * Create optimized image with lazy loading
   */
  createOptimizedImage(src: string, alt: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    loading?: 'lazy' | 'eager';
    sizes?: string;
  } = {}): HTMLImageElement {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = options.loading || 'lazy';
    
    if (options.width) img.width = options.width;
    if (options.height) img.height = options.height;
    if (options.sizes) img.sizes = options.sizes;
    
    return img;
  },

  /**
   * Preload critical images
   */
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * Convert image to WebP if supported
   */
  getOptimalImageFormat(src: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      // WebP is supported, return WebP version if available
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return src;
  }
};

/**
 * Bundle optimization utilities
 */
export const BundleOptimizer = {
  /**
   * Lazy load component
   */
  lazyLoadComponent<T>(importFn: () => Promise<{ default: T }>): T {
    let component: T | null = null;
    let promise: Promise<T> | null = null;
    
    return new Proxy({} as T, {
      get(target, prop) {
        if (!component) {
          if (!promise) {
            promise = importFn().then(module => {
              component = module.default;
              return component;
            });
          }
          throw promise;
        }
        return (component as any)[prop];
      }
    });
  },

  /**
   * Preload module
   */
  preloadModule(importFn: () => Promise<any>): void {
    // Start loading the module but don't wait for it
    importFn().catch(() => {
      // Ignore errors during preloading
    });
  }
};

/**
 * Memory optimization utilities
 */
export const MemoryOptimizer = {
  /**
   * Create weak reference cache
   */
  createWeakCache<K extends object, V>(): {
    get: (key: K) => V | undefined;
    set: (key: K, value: V) => void;
    has: (key: K) => boolean;
    delete: (key: K) => boolean;
  } {
    const cache = new WeakMap<K, V>();
    
    return {
      get: (key: K) => cache.get(key),
      set: (key: K, value: V) => cache.set(key, value),
      has: (key: K) => cache.has(key),
      delete: (key: K) => cache.delete(key)
    };
  },

  /**
   * Create LRU cache
   */
  createLRUCache<T>(maxSize: number): {
    get: (key: string) => T | undefined;
    set: (key: string, value: T) => void;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
    clear: () => void;
    size: number;
  } {
    const cache = new Map<string, T>();
    
    return {
      get(key: string): T | undefined {
        if (cache.has(key)) {
          const value = cache.get(key)!;
          // Move to end (most recently used)
          cache.delete(key);
          cache.set(key, value);
          return value;
        }
        return undefined;
      },
      
      set(key: string, value: T): void {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Remove least recently used (first item)
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      
      has(key: string): boolean {
        return cache.has(key);
      },
      
      delete(key: string): boolean {
        return cache.delete(key);
      },
      
      clear(): void {
        cache.clear();
      },
      
      get size(): number {
        return cache.size;
      }
    };
  },

  /**
   * Monitor memory usage
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  }
};

/**
 * Network optimization utilities
 */
export const NetworkOptimizer = {
  /**
   * Implement request deduplication
   */
  createRequestDeduplicator<T>(): (key: string, requestFn: () => Promise<T>) => Promise<T> {
    const pendingRequests = new Map<string, Promise<T>>();
    
    return async (key: string, requestFn: () => Promise<T>): Promise<T> => {
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!;
      }
      
      const promise = requestFn().finally(() => {
        pendingRequests.delete(key);
      });
      
      pendingRequests.set(key, promise);
      return promise;
    };
  },

  /**
   * Implement request batching
   */
  createRequestBatcher<T, R>(
    batchFn: (requests: T[]) => Promise<R[]>,
    delay: number = 10
  ): (request: T) => Promise<R> {
    let batch: { request: T; resolve: (value: R) => void; reject: (error: any) => void }[] = [];
    let timeoutId: NodeJS.Timeout | null = null;
    
    const processBatch = async () => {
      const currentBatch = batch;
      batch = [];
      timeoutId = null;
      
      try {
        const results = await batchFn(currentBatch.map(item => item.request));
        currentBatch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        currentBatch.forEach(item => {
          item.reject(error);
        });
      }
    };
    
    return (request: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        batch.push({ request, resolve, reject });
        
        if (timeoutId === null) {
          timeoutId = setTimeout(processBatch, delay);
        }
      });
    };
  },

  /**
   * Check network connection quality
   */
  getNetworkInfo(): {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return {};
  }
};

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): PerformanceMonitor {
  const monitor = new PerformanceMonitor();
  
  // Log performance metrics periodically
  setInterval(() => {
    const metrics = monitor.getMetrics();
    const webVitals = monitor.getCoreWebVitals();
    
    console.group('Performance Metrics');
    console.table(metrics);
    console.log('Core Web Vitals:', webVitals);
    console.groupEnd();
  }, 30000); // Every 30 seconds
  
  return monitor;
}