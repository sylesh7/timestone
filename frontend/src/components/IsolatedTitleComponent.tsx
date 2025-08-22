import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './ui/decrypted-text';

const IsolatedTitleComponent = () => {
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const triggerAnimation = useCallback(() => {
    setAnimationTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Set up interval to trigger decryption every 7 seconds
    const interval = setInterval(triggerAnimation, 7000);
    return () => clearInterval(interval);
  }, [triggerAnimation]);

  return (
    <div className="fixed top-6 left-6 z-50">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-4xl font-bold tracking-wider text-green-400"
        style={{ fontFamily: '"ASROG GENOS", serif' }}
      >
        <div key={`decrypt-${animationTrigger}`} className="inline-block">
          <DecryptedText
            text="TimeStone"
            animateOn="mount"
            speed={100}
            maxIterations={8}
            sequential={true}
            revealDirection="start"
            className="text-green-400"
            delay={0}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default IsolatedTitleComponent;
