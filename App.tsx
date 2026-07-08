
import React, { useState, useEffect } from 'react';
import { DataProvider } from './src/shared/contexts/DataContext';
import { AppDesktop } from './src/apps/desktop/AppDesktop';
import { AppMobile } from './src/apps/mobile/AppMobile';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DataProvider>
      {isMobile ? <AppMobile /> : <AppDesktop />}
    </DataProvider>
  );
};

export default App;
