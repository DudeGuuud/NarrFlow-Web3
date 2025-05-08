import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookAnimationProps {
  children: React.ReactNode;
  isOpen?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
}

export const BookAnimation: React.FC<BookAnimationProps> = ({
  children,
  isOpen = true,
  delay = 0,
  duration = 0.8,
  className = '',
}) => {
  // 书本打开/关闭动画
  const bookVariants = {
    closed: {
      rotateY: 0,
      scale: 0.95,
      opacity: 0,
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
    },
    open: {
      rotateY: 0,
      scale: 1,
      opacity: 1,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      transition: {
        duration,
        delay,
        ease: [0.2, 0.65, 0.3, 0.9], // 自定义缓动函数，模拟书本打开的感觉
      }
    },
    closing: {
      rotateY: -90,
      scale: 0.95,
      opacity: 0,
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
      transition: {
        duration: duration * 0.8,
        ease: [0.7, 0, 0.3, 1],
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`perspective-[1500px] ${className}`}
        style={{ transformStyle: 'preserve-3d' }}
        variants={bookVariants}
        initial="closed"
        animate={isOpen ? "open" : "closing"}
        exit="closing"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default BookAnimation;
