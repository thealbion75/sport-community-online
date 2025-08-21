/**
 * SwipeNavigation Component
 * Provides swipe gesture support for mobile navigation in club approval interface
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeNavigationProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  showIndicators?: boolean;
  className?: string;
  disabled?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
}

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  showIndicators = true,
  className = '',
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;
  
  // Maximum vertical movement allowed for horizontal swipe
  const maxVerticalMovement = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.targetTouches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
    setTouchEnd(null);
    setIsSwipeActive(true);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStart) return;
    
    const touch = e.targetTouches[0];
    const currentTouch = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    setTouchEnd(currentTouch);
    
    // Calculate swipe direction for visual feedback
    const deltaX = currentTouch.x - touchStart.x;
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    // Only show direction if it's a valid horizontal swipe
    if (Math.abs(deltaX) > 20 && deltaY < maxVerticalMovement) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !touchStart || !touchEnd) {
      setIsSwipeActive(false);
      setSwipeDirection(null);
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Check if it's a valid horizontal swipe
    const isValidSwipe = Math.abs(deltaX) > minSwipeDistance && deltaY < maxVerticalMovement;
    
    if (isValidSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setIsSwipeActive(false);
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Prevent default touch behavior on the container to avoid scrolling conflicts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isSwipeActive && swipeDirection) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, [isSwipeActive, swipeDirection]);

  return (
    <div
      ref={containerRef}
      className={`relative touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Swipe Indicators */}
      {showIndicators && !disabled && (
        <>
          {/* Left swipe indicator */}
          {onSwipeLeft && (
            <div 
              className={`
                absolute left-2 top-1/2 -translate-y-1/2 
                bg-black/20 text-white rounded-full p-2
                transition-all duration-200 pointer-events-none
                ${swipeDirection === 'left' ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}
                md:hidden
              `}
            >
              <ChevronLeft className="h-4 w-4" />
            </div>
          )}
          
          {/* Right swipe indicator */}
          {onSwipeRight && (
            <div 
              className={`
                absolute right-2 top-1/2 -translate-y-1/2 
                bg-black/20 text-white rounded-full p-2
                transition-all duration-200 pointer-events-none
                ${swipeDirection === 'right' ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}
                md:hidden
              `}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </>
      )}
      
      {/* Swipe hint overlay (shows briefly on first load) */}
      {showIndicators && !disabled && (onSwipeLeft || onSwipeRight) && (
        <SwipeHint onSwipeLeft={!!onSwipeLeft} onSwipeRight={!!onSwipeRight} />
      )}
    </div>
  );
};

interface SwipeHintProps {
  onSwipeLeft: boolean;
  onSwipeRight: boolean;
}

const SwipeHint: React.FC<SwipeHintProps> = ({ onSwipeLeft, onSwipeRight }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Show hint after a short delay, only on mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const timer = setTimeout(() => {
      setShowHint(true);
      
      // Hide hint after 3 seconds
      setTimeout(() => {
        setShowHint(false);
      }, 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!showHint) return null;

  return (
    <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none md:hidden">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mx-4 text-center shadow-lg">
        <p className="text-sm text-gray-700 mb-2">Swipe to navigate</p>
        <div className="flex items-center justify-center gap-4">
          {onSwipeLeft && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <ChevronLeft className="h-3 w-3" />
              <span>Previous</span>
            </div>
          )}
          {onSwipeRight && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeNavigation;