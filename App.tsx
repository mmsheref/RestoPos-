
import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const AppRoutes: React.FC = () => {
    const { user, isLoading, showOnboarding, isDrawerOpen, closeDrawer } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Use a ref to access the latest drawer state inside the listener
    const isDrawerOpenRef = useRef(isDrawerOpen);
    useEffect(() => {
        isDrawerOpenRef.current = isDrawerOpen;
    }, [isDrawerOpen]);

    // Hardware Back Button Handling
    useEffect(() => {
        let listenerHandle: any;

        const setupBackButton = async () => {
            listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                // Priority 1: Close Drawer if open
                if (isDrawerOpenRef.current) {
                    closeDrawer();
                    return;
                }

                // Priority 2: Exit App Confirmation on Root Screens
                // We consider Sales ('/sales'), Root ('/'), and Login ('/login') as exit points.
                const currentPath = location.pathname;
                const rootPaths = ['/sales', '/login', '/'];

                if (rootPaths.includes(currentPath)) {
                    const confirmExit = window.confirm("Are you sure you want to exit RestoPos?");
                    if (confirmExit) {
                        CapacitorApp.exitApp();
                    }
                } else {
                    // Priority 3: Navigate Back
                    // If we are deep in the app (e.g. Settings, Receipt Details), go back one step.
                    // React Router's navigate(-1) handles the history stack.
                    navigate(-1);
                }
            });
        };

        setupBackButton();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [navigate, location.pathname, closeDrawer]); // Re-bind if location changes to ensure logic captures current path


    if (showOnboarding) {
        return <OnboardingScreen />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
               <div className="text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                   <p className="text-text-secondary">Authenticating...</p>
               </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // With the new persistent layout, we render the Layout component for all authenticated routes.
    // The Layout component itself will handle showing/hiding screens based on the path.
    return (
        <Routes>
           <Route path="/*" element={<Layout />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
};

export default App;