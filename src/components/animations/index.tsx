import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  hover?: boolean;
}

interface DirectionalAnimationProps extends AnimationProps {
  direction?: 'up' | 'down' | 'left' | 'right';
}

// 淡入动画
export const FadeIn: React.FC<DirectionalAnimationProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  hover = false
}) => {
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 20 };
      case 'down': return { opacity: 0, y: -20 };
      case 'left': return { opacity: 0, x: 20 };
      case 'right': return { opacity: 0, x: -20 };
      default: return { opacity: 0, y: 20 };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case 'up': 
      case 'down': 
        return { opacity: 1, y: 0 };
      case 'left':
      case 'right':
        return { opacity: 1, x: 0 };
      default: return { opacity: 1, y: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitial()}
      animate={getAnimate()}
      transition={{ delay, duration, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02 } : undefined}
    >
      {children}
    </motion.div>
  );
};

// 向上滑动动画
export const SlideUp: React.FC<AnimationProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  hover = false
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
    >
      {children}
    </motion.div>
  );
};

// 书本动画
export const BookAnimation: React.FC<AnimationProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.7
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay, 
        duration, 
        ease: [0.16, 1, 0.3, 1], // 自定义缓动函数，类似于 spring
      }}
    >
      {children}
    </motion.div>
  );
};

// 弹跳动画
export const Bounce: React.FC<AnimationProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay, 
        duration, 
        type: 'spring', 
        stiffness: 300, 
        damping: 15 
      }}
    >
      {children}
    </motion.div>
  );
};

// 旋转动画
export const Rotate: React.FC<AnimationProps & { degrees?: number }> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  degrees = 360
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: degrees }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// 脉冲动画
export const Pulse: React.FC<AnimationProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 2
}) => {
  return (
    <motion.div
      className={className}
      animate={{ 
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ 
        delay, 
        duration, 
        ease: 'easeInOut', 
        repeat: Infinity,
        repeatType: 'reverse'
      }}
    >
      {children}
    </motion.div>
  );
};
