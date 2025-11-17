/**
 * SaveStatusIndicator Component
 *
 * Professional save status UI with manual save controls,
 * unsaved changes indicator, and conflict resolution.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaveManager, SaveState, saveManager } from '../services/saveManager';
import Button from './Button';
import { CheckIcon, SaveIcon, XIcon, AlertTriangleIcon, RefreshCwIcon, ClockIcon } from './icons/Icons';

interface SaveStatusIndicatorProps {
  projectId: string | null;
  userId: string | null;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ projectId, userId }) => {
  const saveState = useSaveManager();
  const [showDetails, setShowDetails] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Initialize save manager when project/user changes
  useEffect(() => {
    if (projectId && userId) {
      saveManager.initialize(projectId, userId);
    }
  }, [projectId, userId]);

  // Show conflict modal when conflict detected
  useEffect(() => {
    if (saveState.conflictData) {
      setShowConflictModal(true);
    }
  }, [saveState.conflictData]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async () => {
    await saveState.saveNow({ showNotification: true, createVersion: false });
  };

  const handleSaveWithVersion = async () => {
    await saveState.saveNow({ showNotification: true, createVersion: true });
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      saveState.discardChanges();
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusColor = () => {
    if (saveState.isSaving) return 'text-blue-500';
    if (saveState.saveError) return 'text-red-500';
    if (saveState.hasUnsavedChanges) return 'text-#dfec2d';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (saveState.isSaving) {
      return <RefreshCwIcon className="w-4 h-4 animate-spin" />;
    }
    if (saveState.saveError) {
      return <XIcon className="w-4 h-4" />;
    }
    if (saveState.hasUnsavedChanges) {
      return <AlertTriangleIcon className="w-4 h-4" />;
    }
    return <CheckIcon className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (saveState.isSaving) return 'Saving...';
    if (saveState.saveError) return 'Save failed';
    if (saveState.hasUnsavedChanges) return 'Unsaved changes';
    return 'All changes saved';
  };

  if (!projectId || !userId) {
    return null; // Don't show for anonymous users
  }

  return (
    <>
      {/* Main Status Bar */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/95 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl"
        >
          {/* Compact Status */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>

            {saveState.hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-#dfec2d rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">
                  {saveState.pendingChanges.size} pending
                </span>
              </div>
            )}

            {saveState.lastSaved && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="w-3 h-3" />
                <span>{formatTimeAgo(saveState.lastSaved)}</span>
              </div>
            )}
          </div>

          {/* Expanded Actions */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-800 px-4 py-3 space-y-3 overflow-hidden"
              >
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    className="flex-1 !py-2 !text-sm"
                    disabled={!saveState.hasUnsavedChanges || saveState.isSaving}
                  >
                    <SaveIcon className="w-4 h-4" />
                    Save
                  </Button>

                  <Button
                    onClick={handleSaveWithVersion}
                    variant="secondary"
                    className="!py-2 !text-sm"
                    disabled={!saveState.hasUnsavedChanges || saveState.isSaving}
                    title="Save and create version snapshot"
                  >
                    <SaveIcon className="w-4 h-4" />
                    +V
                  </Button>

                  <Button
                    onClick={handleDiscard}
                    variant="secondary"
                    className="!py-2 !text-sm !text-red-400 !border-red-900"
                    disabled={!saveState.hasUnsavedChanges || saveState.isSaving}
                  >
                    <XIcon className="w-4 h-4" />
                    Discard
                  </Button>
                </div>

                {/* Pending Changes List */}
                {saveState.hasUnsavedChanges && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-semibold">Modified:</p>
                    <div className="space-y-0.5 max-h-32 overflow-y-auto">
                      {Array.from(saveState.pendingChanges.keys()).map(field => (
                        <div key={field} className="text-xs text-gray-400 pl-2">
                          • {field.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {saveState.saveError && (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-2">
                    <p className="text-xs text-red-400">
                      {saveState.saveError.message}
                    </p>
                  </div>
                )}

                {/* Keyboard Shortcut Hint */}
                <div className="text-xs text-gray-600 text-center">
                  Press <kbd className="px-1 py-0.5 bg-gray-800 rounded">⌘S</kbd> to save
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {showConflictModal && saveState.conflictData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangleIcon className="w-6 h-6 text-#dfec2d flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-white">Conflicting Changes Detected</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Another user or session has modified this project. How would you like to resolve this?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    saveState.saveNow({ forceSave: true });
                    setShowConflictModal(false);
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                >
                  <p className="font-semibold text-white">Keep My Changes</p>
                  <p className="text-xs text-gray-400">Overwrite remote changes with your local edits</p>
                </button>

                <button
                  onClick={() => {
                    saveState.discardChanges();
                    setShowConflictModal(false);
                    window.location.reload(); // Reload to get remote changes
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                >
                  <p className="font-semibold text-white">Keep Remote Changes</p>
                  <p className="text-xs text-gray-400">Discard your local edits and use the remote version</p>
                </button>

                <button
                  onClick={() => {
                    setShowConflictModal(false);
                    // TODO: Implement merge UI
                    alert('Merge functionality coming soon!');
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                >
                  <p className="font-semibold text-white">Review & Merge</p>
                  <p className="text-xs text-gray-400">Manually review and merge both versions</p>
                </button>
              </div>

              <button
                onClick={() => setShowConflictModal(false)}
                className="w-full mt-4 p-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Warning Badge */}
      {saveState.hasUnsavedChanges && !showDetails && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed top-20 right-6 bg-#dfec2d/10 border border-#dfec2d/50 rounded-full px-3 py-1 flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-#dfec2d rounded-full animate-pulse" />
          <span className="text-xs text-#dfec2d font-medium">Unsaved</span>
        </motion.div>
      )}
    </>
  );
};

export default SaveStatusIndicator;