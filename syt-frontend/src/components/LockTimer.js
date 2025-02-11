import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLockTimer } from '../../redux/slices/lockSlice';

const LockTimer = () => {
  const dispatch = useDispatch();
  const { expiryTime } = useSelector(state => state.lock);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!expiryTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const difference = expiry - now;
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      return { minutes, seconds };
    };

    const timer = setInterval(() => {
      const timeRemaining = calculateTimeLeft();
      if (timeRemaining) {
        setTimeLeft(timeRemaining);
        dispatch(setLockTimer(timeRemaining));
        
        // Show warning when 5 minutes or less remaining
        setShowWarning(timeRemaining.minutes <= 5);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, dispatch]);

  if (!timeLeft) return null;

  return (
    <div className="fixed top-0 right-0 m-4 z-50">
      {showWarning ? (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            Lock expires in {timeLeft.minutes}m {timeLeft.seconds}s
          </AlertTitle>
        </Alert>
      ) : (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-md">
          <Lock className="h-4 w-4" />
          <span>
            Lock active: {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>
      )}
    </div>
  );
};

export default LockTimer;