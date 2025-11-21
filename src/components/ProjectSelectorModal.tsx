import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { Project } from '@/types';
import { getProjectService } from '@/services/projectService';
import Button from './Button';
import { formatDistanceToNow } from 'date-fns';

interface ProjectSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProject: (project: Project) => void;
    currentProjectId?: string;
}

const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelectProject,
    currentProjectId
}) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'last_accessed' | 'created' | 'updated'>('last_accessed');

    useEffect(() => {
        if (!isOpen || !user) return;

        const loadProjects = async () => {
            setIsLoading(true);
            try {
                const projectService = getProjectService();
                const { projects, error } = await projectService.getProjects(user.id);
                if (error) throw error;
                setProjects(projects || []);
            } catch (error) {
                console.error('Failed to load projects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProjects();
    }, [isOpen, user]);

    const filteredProjects = projects
        .filter(project =>
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.script_content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(
                sortBy === 'last_accessed' ? a.last_accessed_at || a.updated_at :
                sortBy === 'created' ? a.created_at :
                a.updated_at
            );
            const dateB = new Date(
                sortBy === 'last_accessed' ? b.last_accessed_at || b.updated_at :
                sortBy === 'created' ? b.created_at :
                b.updated_at
            );
            return dateB.getTime() - dateA.getTime();
        });

    const handleSelectProject = async (project: Project) => {
        onSelectProject(project);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-4xl max-h-[80vh] bg-white dark:bg-[#161616] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2A2A2A] overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Projects
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0B0B0B] border border-gray-300 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-#DFEC2D focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 bg-gray-50 dark:bg-[#0B0B0B] border border-gray-300 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-#DFEC2D focus:border-transparent"
                        >
                            <option value="last_accessed">Last Opened</option>
                            <option value="created">Date Created</option>
                            <option value="updated">Last Modified</option>
                        </select>
                    </div>
                </div>

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-#DFEC2D"></div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                {searchQuery ? 'No projects found' : 'No projects yet'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'Try adjusting your search' : 'Create your first project to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map((project) => {
                                const isActive = project.id === currentProjectId;
                                const lastAccessed = project.last_accessed_at || project.updated_at;
                                const scriptPreview = project.script_content?.slice(0, 100) || 'No script content';

                                return (
                                    <motion.div
                                        key={project.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectProject(project)}
                                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            isActive
                                                ? 'border-#DFEC2D bg-yellow-50 dark:bg-#DFEC2D/10'
                                                : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A]'
                                        }`}
                                    >
                                        {isActive && (
                                            <div className="absolute top-2 right-2">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-#DFEC2D text-white">
                                                    Active
                                                </span>
                                            </div>
                                        )}

                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-16">
                                            {project.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                            {scriptPreview}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                            <span>
                                                Last opened {formatDistanceToNow(new Date(lastAccessed), { addSuffix: true })}
                                            </span>
                                            {project.is_public && (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0B0B0B]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                        </p>
                        <Button onClick={onClose} variant="secondary">
                            Close
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectSelectorModal;