import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkDevice = () => {
      // 檢查螢幕寬度（手機通常小於 768px）
      const isSmallScreen = window.innerWidth < 768;
      
      // 檢查 User Agent 是否包含手機裝置關鍵字
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android',
        'webos',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',
        'windows phone',
        'mobile'
      ];
      
      const isMobileUserAgent = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );
      
      // 檢查是否有觸控支援
      const hasTouchSupport = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;
      
      // 綜合判斷：小螢幕 + (手機 User Agent 或 觸控支援)
      const isMobileDevice = isSmallScreen && (isMobileUserAgent || hasTouchSupport);
      
      setIsMobile(isMobileDevice);
    };

    // 初始檢查
    checkDevice();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // 避免 hydration 錯誤，在客戶端載入完成前返回 false
  return isMounted ? isMobile : false;
};

export default useIsMobile;
