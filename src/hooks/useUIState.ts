/**
 * Custom hook to manage UI state
 * Extracted from App.tsx to reduce complexity and improve maintainability
 */

import { useState, useCallback, useEffect } from 'react';
import { useUserPreferences } from '../services/userDataService';
import { ToastMessage } from '../components/Toast';

const DEFAULT_ACTIVE_TAB = 'script';
const DEFAULT_SIDEBAR_EXPANDED = true;

export interface UIStateReturn {
    // UI State
    activeTab: string;
    isSidebarExpanded: boolean;
    toast: ToastMessage | null;

    // UI Actions
    setActiveTab: (tab: string) => void;
    setIsSidebarExpanded: (expanded: boolean) => void;
    setToast: (toast: ToastMessage | null) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => void;
    clearToast: () => void;

    // Loading states
    isAnalyzing: boolean;
    analysisError: string | null;
    analysisMessage: string;
    setIsAnalyzing: (analyzing: boolean) => void;
    setAnalysisError: (error: string | null) => void;
    setAnalysisMessage: (message: string) => void;
}

export const useUIState = (user: any): UIStateReturn => {
    const { userPreferences, updateUserPreferences, isLoading: preferencesLoading } = useUserPreferences(user?.id);

    // Tab and sidebar state
    const [activeTab, setActiveTabState] = useState<string>(() => {
        return userPreferences?.ui_state?.activeTab || DEFAULT_ACTIVE_TAB;
    });

    const [isSidebarExpanded, setIsSidebarExpandedState] = useState<boolean>(() => {
        return userPreferences?.ui_state?.isSidebarExpanded ?? DEFAULT_SIDEBAR_EXPANDED;
    });

    // Toast state
    const [toast, setToastState] = useState<ToastMessage | null>(null);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisMessage, setAnalysisMessage] = useState<string>('');

    // Synchronize state with user preferences
    useEffect(() => {
        if (userPreferences && !preferencesLoading) {
            setActiveTabState(userPreferences.ui_state?.activeTab || DEFAULT_ACTIVE_TAB);
            setIsSidebarExpandedState(userPreferences.ui_state?.isSidebarExpanded ?? DEFAULT_SIDEBAR_EXPANDED);
        }
    }, [userPreferences, preferencesLoading]);

    const setActiveTab = useCallback((tab: string) => {
        setActiveTabState(tab);
        if (user) {
            updateUserPreferences({
                ui_state: {
                    ...userPreferences?.ui_state,
                    activeTab: tab
                }
            });
        }
    }, [user, userPreferences, updateUserPreferences]);

    const setIsSidebarExpanded = useCallback((expanded: boolean) => {
        setIsSidebarExpandedState(expanded);
        if (user) {
            updateUserPreferences({
                ui_state: {
                    ...userPreferences?.ui_state,
                    isSidebarExpanded: expanded
                }
            });
        }
    }, [user, userPreferences, updateUserPreferences]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastState({ message, type });
    }, []);

    const clearToast = useCallback(() => {
        setToastState(null);
    }, []);

    // Auto-clear toast after 5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToastState(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [toast]);

    return {
        // UI State
        activeTab,
        isSidebarExpanded,
        toast,

        // UI Actions
        setActiveTab,
        setIsSidebarExpanded,
        setToast: setToastState,
        showToast,
        clearToast,

        // Loading states
        isAnalyzing,
        analysisError,
        analysisMessage,
        setIsAnalyzing,
        setAnalysisError,
        setAnalysisMessage
    };
};