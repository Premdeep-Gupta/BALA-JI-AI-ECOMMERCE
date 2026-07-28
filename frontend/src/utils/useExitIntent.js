import { useState, useEffect } from 'react';

export const useExitIntent = (options = {}) => {
  const { 
    threshold = 20, 
    delay = 1000, 
    cookieName = 'exit_intent_shown' 
  } = options;
  
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    // Only show once per session to not annoy the user
    if (sessionStorage.getItem(cookieName)) return;

    let timer;
    const handleMouseLeave = (e) => {
      // If mouse leaves from the top of the window (moving to close tab or change URL)
      if (e.clientY < threshold) {
        timer = setTimeout(() => {
          setIsShowing(true);
          sessionStorage.setItem(cookieName, 'true');
        }, delay);
      }
    };

    const handleMouseEnter = () => {
      if (timer) clearTimeout(timer);
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (timer) clearTimeout(timer);
    };
  }, [threshold, delay, cookieName]);

  const close = () => setIsShowing(false);

  return { isShowing, close };
};
