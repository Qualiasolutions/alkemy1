import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Loading component for lazy loaded tabs
export const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-t-transparent border-emerald-500 rounded-full"
    />
  </div>
);

// Lazy load heavy tabs to improve initial bundle size
export const ScriptTab = lazy(() => import('./tabs/ScriptTab'));
export const MoodboardTab = lazy(() => import('./tabs/MoodboardTab'));
export const PresentationTab = lazy(() => import('./tabs/PresentationTab'));
export const CastLocationsTab = lazy(() => import('./tabs/CastLocationsTab'));
export const SceneAssemblerTab = lazy(() => import('./tabs/SceneAssemblerTab'));
export const FramesTab = lazy(() => import('./tabs/FramesTab.simple'));
export const WanTransferTab = lazy(() => import('./tabs/WanTransferTab'));
export const PostProductionTab = lazy(() => import('./tabs/PostProductionTab'));
export const ExportsTab = lazy(() => import('./tabs/ExportsTab'));
export const RoadmapTab = lazy(() => import('./tabs/RoadmapTab'));
export const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
export const ThreeDWorldsTab = lazy(() => import('./tabs/3DWorldsTab').then(module => ({ default: module.ThreeDWorldsTab })));

// Wrapper component for lazy loaded tabs
export const LazyTab: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<TabLoader />}>
    {children}
  </Suspense>
);