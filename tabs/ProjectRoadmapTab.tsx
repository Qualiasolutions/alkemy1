import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Progress } from '@/components/ui/Progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Circle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Users,
  GitBranch,
  Zap,
  Sparkles,
  Play,
  ChevronRight,
  ChevronDown,
  Rocket,
  FileText
} from 'lucide-react';

// Define comprehensive epic data based on documentation
const EPIC_DATA = [
  {
    id: 'epic-1',
    epic_number: 'Epic 1',
    title: 'Director Voice Enhancement',
    status: 'complete',
    progress_percentage: 100,
    stories_complete: '4/4',
    description: 'Voice-enabled AI cinematography assistant with TTS, style learning, and continuity checking',
    features: [
      'Voice command integration via Web Speech API',
      'Text-to-speech responses with voice selection',
      'Creative pattern tracking and style learning',
      'Timeline continuity analysis and detection'
    ],
    deployment_url: 'https://alkemy1-fbwrj76nt-qualiasolutionscy.vercel.app',
    qa_report: 'QA_REPORT_EPIC_1.md',
    color: 'emerald'
  },
  {
    id: 'epic-2',
    epic_number: 'Epic 2',
    title: 'Character Identity Consistency',
    status: 'complete',
    progress_percentage: 100,
    stories_complete: '3/3',
    description: 'LoRA-based character consistency system achieving 90-98% visual similarity',
    features: [
      'Character reference image upload (3-5 images)',
      'FLUX LoRA model training (5-10 minutes)',
      'Identity testing with similarity scoring',
      'Automatic LoRA integration in generation pipeline'
    ],
    deployment_url: 'https://alkemy1-nzitt6da5-qualiasolutionscy.vercel.app',
    critical_fix: '2025-11-12: Fixed Fal.ai API integration',
    color: 'purple'
  },
  {
    id: 'epic-6',
    epic_number: 'Epic 6',
    title: 'Analytics & Quality Metrics',
    status: 'complete',
    progress_percentage: 100,
    stories_complete: '2/4',
    description: 'Comprehensive analytics dashboard with quality scoring and cost tracking',
    features: [
      'Creative quality analysis and scoring',
      'Performance metrics tracking',
      'Cost optimization insights',
      'Export analytics reports (PDF/CSV)'
    ],
    next_sprint: 'Sprint 5: Complete remaining stories',
    color: 'blue'
  },
  {
    id: 'epic-3',
    epic_number: 'Epic 3',
    title: '3D Worlds & Gaussian Splatting',
    status: 'not_started',
    progress_percentage: 0,
    stories_complete: '0/5',
    description: 'Advanced 3D world generation with Gaussian Splatting technology',
    features: [
      'WebGL viewer with .ply file support',
      'Text-to-3D scene generation',
      'Camera path animation editor',
      '3D asset library management',
      'Export to standard 3D formats'
    ],
    planned_start: 'Sprint 6 (Feb 11, 2025)',
    estimated_completion: 'Sprint 8 (Mar 24, 2025)',
    color: 'indigo'
  },
  {
    id: 'epic-4',
    epic_number: 'Epic 4',
    title: 'Voice Acting & Dialogue',
    status: 'not_started',
    progress_percentage: 0,
    stories_complete: '0/4',
    description: 'AI-powered voice acting with character-specific voice profiles',
    features: [
      'Voice generation service (ElevenLabs/OpenAI)',
      'Character voice profiles and consistency',
      'Dialogue sync with lip animation',
      'Multi-language support'
    ],
    planned_start: 'Sprint 9 (Mar 25, 2025)',
    estimated_completion: 'Sprint 10 (Apr 17, 2025)',
    color: 'amber'
  },
  {
    id: 'epic-5',
    epic_number: 'Epic 5',
    title: 'Audio Production Suite',
    status: 'not_started',
    progress_percentage: 0,
    stories_complete: '0/4',
    description: 'Complete audio production with music composition and sound effects',
    features: [
      'AI music composition',
      'Sound effects generation',
      'Audio mixing and mastering',
      'Spatial audio support'
    ],
    planned_start: 'Q2 2025',
    color: 'rose'
  },
  {
    id: 'epic-7a',
    epic_number: 'Epic 7a',
    title: 'Community Hub',
    status: 'not_started',
    progress_percentage: 0,
    stories_complete: '0/4',
    description: 'Social features for collaboration and sharing',
    features: [
      'Public gallery and showcases',
      'User profiles and portfolios',
      'Competitions and challenges',
      'Collaboration tools'
    ],
    planned_start: 'Q2 2025',
    color: 'teal'
  },
  {
    id: 'epic-8',
    epic_number: 'Epic 8',
    title: 'Testing & Integration',
    status: 'not_started',
    progress_percentage: 0,
    stories_complete: '0/2',
    description: 'Comprehensive testing suite and CI/CD pipeline',
    features: [
      'E2E testing framework',
      'Performance benchmarking',
      'Automated CI/CD',
      'Load testing'
    ],
    planned_start: 'Ongoing',
    color: 'slate'
  }
];

// Sprint data based on roadmap
const SPRINT_DATA = [
  {
    id: 'sprint-4',
    number: 4,
    name: 'BMAD Documentation',
    status: 'active',
    duration: 'Jan 13-27, 2025',
    progress: 55,
    points_complete: '27/49',
    goals: [
      'Complete BMAD tracking database',
      'Synchronization scripts',
      'Frontend dashboard',
      'Git/CI integration',
      'Story documentation updates'
    ],
    current: true
  },
  {
    id: 'sprint-5',
    number: 5,
    name: 'Analytics Completion',
    status: 'upcoming',
    duration: 'Jan 28 - Feb 10, 2025',
    progress: 0,
    points_complete: '0/30',
    goals: [
      'Performance Metrics Tracking (50% → 100%)',
      'Analytics Dashboard UI (0% → 100%)',
      'Export Analytics Reports (0% → 100%)'
    ]
  },
  {
    id: 'sprint-6',
    number: 6,
    name: '3D Foundation',
    status: 'upcoming',
    duration: 'Feb 11-24, 2025',
    progress: 0,
    points_complete: '0/35',
    goals: [
      'Gaussian Splatting Viewer',
      'WebGL viewer component',
      'Basic .ply file loading',
      'Camera controls',
      'Performance benchmarking'
    ]
  },
  {
    id: 'sprint-7',
    number: 7,
    name: '3D Scene Generation',
    status: 'upcoming',
    duration: 'Feb 25 - Mar 10, 2025',
    progress: 0,
    points_complete: '0/40',
    goals: [
      'Text-to-3D generation',
      'Camera path editor',
      'Basic asset management',
      'Supabase storage integration'
    ]
  },
  {
    id: 'sprint-8',
    number: 8,
    name: '3D Export & Polish',
    status: 'upcoming',
    duration: 'Mar 11-24, 2025',
    progress: 0,
    points_complete: '0/35',
    goals: [
      'Complete asset library UI',
      'Export to standard formats',
      'Performance optimization',
      'Integration with compositing'
    ]
  },
  {
    id: 'sprint-9',
    number: 9,
    name: 'Voice Acting Core',
    status: 'upcoming',
    duration: 'Mar 25 - Apr 7, 2025',
    progress: 0,
    points_complete: '0/45',
    goals: [
      'Voice Generation Service',
      'Character Voice Profiles',
      'Dialogue Sync (partial)',
      'ElevenLabs/OpenAI integration'
    ]
  }
];

// Roadmap phases
const ROADMAP_PHASES = [
  {
    name: 'Phase 1: Foundation Completion',
    duration: 'Jan 17 - Feb 17, 2025',
    status: 'in_progress',
    sprints: [4, 5, 6],
    description: 'Complete BMAD system, finish analytics, begin 3D infrastructure'
  },
  {
    name: 'Phase 2: 3D Implementation',
    duration: 'Feb 18 - Mar 17, 2025',
    status: 'upcoming',
    sprints: [7, 8],
    description: 'Full 3D world generation pipeline with camera animation and asset management'
  },
  {
    name: 'Phase 3: Voice & Audio',
    duration: 'Mar 18 - Apr 17, 2025',
    status: 'upcoming',
    sprints: [9],
    description: 'Voice acting system and dialogue generation foundation'
  }
];

interface ProjectRoadmapTabProps {
  // Optional props for future integration
}

export function ProjectRoadmapTab(props: ProjectRoadmapTabProps) {
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(4);
  const [expandedPhase, setExpandedPhase] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'roadmap' | 'epics' | 'sprints'>('roadmap');
  const [loading, setLoading] = useState(false);

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
      case 'active':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'upcoming':
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'complete':
        return 'default';
      case 'in_progress':
      case 'active':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  function getEpicColorClass(color: string) {
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
      purple: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
      blue: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
      indigo: 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20',
      amber: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
      rose: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20',
      teal: 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20',
      slate: 'bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20'
    };
    return colorMap[color] || colorMap.slate;
  }

  const completedEpics = EPIC_DATA.filter(e => e.status === 'complete').length;
  const totalStories = EPIC_DATA.reduce((sum, epic) => {
    const [complete] = epic.stories_complete.split('/').map(Number);
    return sum + (complete || 0);
  }, 0);
  const totalPlannedStories = EPIC_DATA.reduce((sum, epic) => {
    const [, total] = epic.stories_complete.split('/').map(Number);
    return sum + (total || 0);
  }, 0);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Rocket className="w-8 h-8 text-purple-400" />
              Alkemy AI Studio Roadmap
            </h1>
            <p className="text-gray-400 mt-1">
              90-Day Development Plan • Jan 17 - Apr 17, 2025
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('roadmap')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'roadmap'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('epics')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'epics'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Epics
            </button>
            <button
              onClick={() => setViewMode('sprints')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'sprints'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Sprints
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Sparkles className="w-8 h-8 text-emerald-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{completedEpics}/8</div>
                  <div className="text-xs text-gray-400">Epics Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 text-purple-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{totalStories}/{totalPlannedStories}</div>
                  <div className="text-xs text-gray-400">Stories Done</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Zap className="w-8 h-8 text-yellow-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">Sprint 4</div>
                  <div className="text-xs text-gray-400">Current Sprint</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">90</div>
                  <div className="text-xs text-gray-400">Days Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">38%</div>
                  <div className="text-xs text-gray-400">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {viewMode === 'roadmap' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">90-Day Roadmap Timeline</h2>

            {ROADMAP_PHASES.map((phase, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedPhase(expandedPhase === index ? -1 : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedPhase === index ?
                        <ChevronDown className="w-5 h-5 text-gray-400" /> :
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      }
                      <div>
                        <CardTitle className="text-xl text-white">{phase.name}</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">{phase.duration}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(phase.status)}>
                      {phase.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                {expandedPhase === index && (
                  <CardContent>
                    <p className="text-gray-300 mb-4">{phase.description}</p>

                    <div className="space-y-3">
                      {phase.sprints.map(sprintNum => {
                        const sprint = SPRINT_DATA.find(s => s.number === sprintNum);
                        if (!sprint) return null;

                        return (
                          <div key={sprint.id} className="bg-gray-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(sprint.status)}
                                <span className="font-medium text-white">Sprint {sprint.number}: {sprint.name}</span>
                              </div>
                              <span className="text-sm text-gray-400">{sprint.duration}</span>
                            </div>

                            {sprint.progress > 0 && (
                              <div className="mb-2">
                                <Progress value={sprint.progress} className="h-2" />
                                <p className="text-xs text-gray-400 mt-1">
                                  {sprint.points_complete} points • {sprint.progress}% complete
                                </p>
                              </div>
                            )}

                            <ul className="space-y-1 mt-3">
                              {sprint.goals.slice(0, 3).map((goal, idx) => (
                                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                  <span className="text-purple-400 mt-1">•</span>
                                  <span>{goal}</span>
                                </li>
                              ))}
                              {sprint.goals.length > 3 && (
                                <li className="text-sm text-gray-500">
                                  +{sprint.goals.length - 3} more goals...
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {viewMode === 'epics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {EPIC_DATA.map(epic => (
              <Card
                key={epic.id}
                className={`border transition-all cursor-pointer ${getEpicColorClass(epic.color)}`}
                onClick={() => setSelectedEpic(selectedEpic === epic.id ? null : epic.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(epic.status)}
                      <span className="text-sm font-bold text-gray-300">{epic.epic_number}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(epic.status)}>
                      {epic.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-white">{epic.title}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">{epic.stories_complete} stories</p>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-300 mb-3">{epic.description}</p>

                  {epic.progress_percentage > 0 && (
                    <div className="mb-3">
                      <Progress value={epic.progress_percentage} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">
                        {epic.progress_percentage}% complete
                      </p>
                    </div>
                  )}

                  {selectedEpic === epic.id && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-700">
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Features:</h4>
                        <ul className="space-y-1">
                          {epic.features.map((feature, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {epic.deployment_url && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Deployment:</h4>
                          <a
                            href={epic.deployment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline break-all"
                          >
                            {epic.deployment_url}
                          </a>
                        </div>
                      )}

                      {epic.planned_start && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Timeline:</h4>
                          <p className="text-xs text-gray-400">Start: {epic.planned_start}</p>
                          {epic.estimated_completion && (
                            <p className="text-xs text-gray-400">End: {epic.estimated_completion}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === 'sprints' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Sprint Highlight */}
            {SPRINT_DATA.filter(s => s.current).map(sprint => (
              <Card key={sprint.id} className="lg:col-span-2 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white flex items-center gap-2">
                        <Play className="w-6 h-6 text-purple-400" />
                        Current Sprint: {sprint.name}
                      </CardTitle>
                      <p className="text-gray-400 mt-1">Sprint {sprint.number} • {sprint.duration}</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-600 text-white">
                      ACTIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Progress</span>
                      <span className="text-sm text-gray-300">{sprint.points_complete} points</span>
                    </div>
                    <Progress value={sprint.progress} className="h-3" />
                    <p className="text-xs text-gray-400 mt-1">{sprint.progress}% complete</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Sprint Goals:</h4>
                    <ul className="space-y-2">
                      {sprint.goals.map((goal, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            idx === 0 ? 'text-green-400' : 'text-gray-500'
                          }`} />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Other Sprints */}
            {SPRINT_DATA.filter(s => !s.current).map(sprint => (
              <Card
                key={sprint.id}
                className={`bg-gray-800/50 border-gray-700 transition-all ${
                  selectedSprint === sprint.number ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedSprint(sprint.number)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sprint.status)}
                      <CardTitle className="text-lg text-white">
                        Sprint {sprint.number}: {sprint.name}
                      </CardTitle>
                    </div>
                    <Badge variant={getStatusBadgeVariant(sprint.status)}>
                      {sprint.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{sprint.duration}</p>
                </CardHeader>

                <CardContent>
                  {sprint.progress > 0 && (
                    <div className="mb-3">
                      <Progress value={sprint.progress} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">
                        {sprint.points_complete} points • {sprint.progress}% complete
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Goals:</h4>
                    <ul className="space-y-1">
                      {sprint.goals.slice(0, 3).map((goal, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                      {sprint.goals.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{sprint.goals.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleString()} • Documentation synced from /docs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open('/docs/PROJECT_ROADMAP_CURRENT.md', '_blank')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Full Roadmap
            </button>
            <button
              onClick={() => window.open('/docs/BMAD_STATUS.md', '_blank')}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              BMAD Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}