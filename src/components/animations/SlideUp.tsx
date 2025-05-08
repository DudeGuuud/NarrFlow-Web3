import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  staggerChildren?: boolean;
  staggerDelay?: number;
  hover?: boolean;
}

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  distance = 50,
  className = '',
  staggerChildren = false,
  staggerDelay = 0.1,
  hover = false
}) => {
  // 基本动画
  const baseAnimation = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0], // 使用cubic-bezier曲线使动画更自然
        staggerChildren: staggerChildren ? staggerDelay : 0,
        delayChildren: staggerChildren ? delay : 0
      }
    },
    exit: {
      opacity: 0,
      y: distance,
      transition: {
        duration: duration * 0.75,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  // 悬停效果
  const hoverEffect = hover ? {
    whileHover: {
      y: -5,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  } : {};

  return (
    <AnimatePresence>
      <motion.div
        className={className}
        variants={baseAnimation}
        initial="hidden"
        animate="visible"
        exit="exit"
        {...hoverEffect}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};