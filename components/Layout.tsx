
import React, { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import NavDrawer from './NavDrawer';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS } from '../constants';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    isDrawerOpen, openDrawer, 
    headerTitle, setHeaderTitle, 
  } = useAppContext();
  const location = useLocation();

  const currentLink = NAV_LINKS.find(link => link.path === location.pathname);
  const baseTitle = currentLink ? currentLink.label : 'Sales';
  
  const finalTitle = location.pathname === '/sales' && headerTitle ? headerTitle : baseTitle;
  const isSalesScreen = location.pathname === '/sales';

  useEffect(() => {
    // Reset header title when navigating away from the sales screen
    if(location.pathname !== '/sales') {
        setHeaderTitle('');
    }
  }, [location.pathname, setHeaderTitle]);


  return (
    <div className="relative h-screen w-full overflow-x-hidden bg-gray-100 dark:bg-gray-900 flex flex-col">
      {!isSalesScreen && <Header 
        title={finalTitle} 
        onMenuClick={openDrawer}
      />}
      <NavDrawer />
      <motion.main
        animate={{ x: isDrawerOpen ? 256 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col will-change-transform shadow-lg overflow-hidden relative"
      >
        <div className={`flex-1 overflow-y-auto w-full ${isSalesScreen ? '' : 'bg-white dark:bg-gray-900'}`}>
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;