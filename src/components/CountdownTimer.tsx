import React, { useState, useEffect } from 'react';
import { useLang } from '../contexts/lang/LangContext';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  className = ''
}) => {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    percentage: number;
  }>({ minutes: 0, seconds: 0, percentage: 100 });
  const [isExpired, setIsExpired] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // 计算总时长和初始百分比
  useEffect(() => {
    try {
      const expiryTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const initialDifference = expiryTime - now;

      if (initialDifference <= 0) {
        setIsExpired(true);
        setTimeLeft({ minutes: 0, seconds: 0, percentage: 0 });
        return;
      }

      // 假设投票会话总是 5 分钟 (300 秒)
      const totalSeconds = 300; // 5分钟

      // 计算已经过去的时间
      const elapsedSeconds = totalSeconds - Math.floor(initialDifference / 1000);

      // 计算初始百分比 (剩余时间/总时间)
      const initialPercentage = Math.max(0, Math.min(100, ((totalSeconds - elapsedSeconds) / totalSeconds) * 100));

      // 设置总时长
      setTotalDuration(totalSeconds);

      // 设置初始时间
      const minutes = Math.floor(initialDifference / 1000 / 60);
      const seconds = Math.floor((initialDifference / 1000) % 60);

      setTimeLeft({
        minutes,
        seconds,
        percentage: initialPercentage
      });
    } catch (error) {
      console.error('Error calculating initial time:', error);
    }
  }, [expiresAt]);

  // 倒计时逻辑
  useEffect(() => {
    if (isExpired || totalDuration === 0) return;

    const calculateTimeLeft = () => {
      try {
        const expiryTime = new Date(expiresAt).getTime();
        const now = new Date().getTime();
        const difference = expiryTime - now;

        if (difference <= 0) {
          setIsExpired(true);
          setTimeLeft({ minutes: 0, seconds: 0, percentage: 0 });
          if (onExpire) {
            onExpire();
          }
          return;
        }

        const remainingSeconds = Math.floor(difference / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        // 计算剩余时间百分比
        const percentage = Math.max(0, Math.min(100, (remainingSeconds / totalDuration) * 100));

        setTimeLeft({ minutes, seconds, percentage });
      } catch (error) {
        console.error('Error calculating time left:', error);
      }
    };

    // 立即计算
    calculateTimeLeft();

    // 设置定时器
    const timer = setInterval(calculateTimeLeft, 1000);

    // 清理
    return () => clearInterval(timer);
  }, [expiresAt, onExpire, totalDuration, isExpired]);

  const formatTime = (value: number): string => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  // 根据剩余时间百分比确定进度条颜色
  const getProgressColor = () => {
    if (timeLeft.percentage > 66) {
      return 'bg-green-500';
    } else if (timeLeft.percentage > 33) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {isExpired ? (
        <div className="flex flex-col items-center">
          <div className="text-red-500 text-xl font-bold mb-2">{t('voting_expired')}</div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: '0%' }} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-primary-700 dark:text-primary-300 text-lg font-bold">
              {t('voting_ends_in')}:
            </span>
            <div className="bg-primary-100 dark:bg-primary-900 rounded-lg px-4 py-2 text-primary-800 dark:text-primary-200 font-mono text-xl font-bold">
              {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear`}
              style={{ width: `${timeLeft.percentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CountdownTimer;
