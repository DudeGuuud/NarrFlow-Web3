import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
  direction = 'none',
  distance = 20
}) => {
  // 根据方向设置初始和结束位置
  const getDirectionAnimation = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={className}
        initial={{
          opacity: 0,
          ...getDirectionAnimation()
        }}
        animate={{
          opacity: 1,
          y: 0,
          x: 0
        }}
        exit={{
          opacity: 0,
          ...getDirectionAnimation()
        }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1.0], // 使用cubic-bezier曲线使动画更自然
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};