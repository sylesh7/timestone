import { useEffect, useRef, memo } from 'react';
import Hyperspeed from './Hyperspeed';

const ContinuousHyperspeed = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hyperspeedRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Hyperspeed only once
    if (!hyperspeedRef.current && containerRef.current) {
      // This ensures the component is only initialized once
      hyperspeedRef.current = true;
    }
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-full h-4/5 transform -translate-y-8">
        <Hyperspeed
          key="continuous-hyperspeed" // Static key to prevent re-mounting
          effectOptions={{
            speedUp: 1.5,
            fov: 120,
            carLightsFade: 0.6,
            totalSideLightSticks: 30,
            lightPairsPerRoadWay: 50,
          }}
        />
      </div>
    </div>
  );
});

ContinuousHyperspeed.displayName = 'ContinuousHyperspeed';

export default ContinuousHyperspeed;
