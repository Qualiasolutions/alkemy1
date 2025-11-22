import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Map,
  Rocket,
  Sparkles,
  Target,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { supabase } from '@/services/supabase'

interface Epic {
  id: string
  epic_number: string
  title: string
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked' | 'deferred'
  progress_percentage: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

interface Story {
  id: string
  epic_id: string
  story_number: string
  title: string
  status: 'draft' | 'ready' | 'in_progress' | 'review' | 'complete' | 'blocked' | 'deferred'
  progress_percentage: number
  assignee: string | null
  file_path: string
  epic?: Epic
}

interface AcceptanceCriterion {
  id: string
  story_id: string
  criterion_number: string
  description: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'blocked'
  verified_at: string | null
}

interface DashboardStats {
  completed_epics: number
  in_progress_epics: number
  not_started_epics: number
  completed_stories: number
  in_progress_stories: number
  blocked_stories: number
  passed_criteria: number
  failed_criteria: number
  pending_criteria: number
  stories_in_current_sprint: number
}

// Simplified roadmap data for non-technical users
const ROADMAP_PHASES = [
  {
    id: 'v2.0',
    name: 'Foundation',
    tagline: 'Voice Commands & Character Consistency',
    icon: Rocket,
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    epics: [
      {
        number: 'EPIC-1',
        name: 'Voice Control',
        description: 'Talk to the AI Director',
        status: 'complete',
      },
      {
        number: 'EPIC-2',
        name: 'Character Identity',
        description: 'Keep characters looking the same',
        status: 'in_progress',
      },
      {
        number: 'EPIC-5',
        name: 'Music & Sound',
        description: 'Add soundtrack and effects',
        status: 'not_started',
      },
    ],
  },
  {
    id: 'v2.1',
    name: 'Immersion',
    tagline: '3D Worlds & Voice Acting',
    icon: Map,
    color: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    epics: [
      {
        number: 'EPIC-3',
        name: '3D Locations',
        description: 'Explore film locations in 3D',
        status: 'not_started',
      },
      {
        number: 'EPIC-4',
        name: 'Voice Acting',
        description: 'Give characters realistic voices',
        status: 'not_started',
      },
    ],
  },
  {
    id: 'v2.2',
    name: 'Growth',
    tagline: 'Analytics & Community',
    icon: Users,
    color: 'bg-gradient-to-br from-yellow-400 to-red-500',
    epics: [
      {
        number: 'EPIC-6',
        name: 'Quality Analytics',
        description: 'Get AI feedback on your film',
        status: 'not_started',
      },
      {
        number: 'EPIC-7a',
        name: 'Community Hub',
        description: 'Share films and compete',
        status: 'not_started',
      },
    ],
  },
  {
    id: 'v3',
    name: 'Future',
    tagline: 'Marketplace & Academy',
    icon: Award,
    color: 'bg-gradient-to-br from-gray-600 to-gray-800',
    epics: [
      {
        number: 'EPIC-7b',
        name: 'Asset Marketplace',
        description: 'Buy and sell creative assets',
        status: 'deferred',
      },
      {
        number: 'EPIC-7c',
        name: 'Alkemy Academy',
        description: 'Learn from pro filmmakers',
        status: 'deferred',
      },
    ],
  },
]

export function BMADStatusTab() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [_selectedEpic, _setSelectedEpic] = useState<string | null>(null)
  const [selectedStory, _setSelectedStory] = useState<Story | null>(null)
  const [_acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriterion[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullRoadmap, setShowFullRoadmap] = useState(false)
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()

    const epicSubscription = supabase
      .channel('epic-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epics' }, fetchDashboardData)
      .subscribe()

    const storySubscription = supabase
      .channel('story-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        fetchDashboardData
      )
      .subscribe()

    const acSubscription = supabase
      .channel('ac-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'acceptance_criteria' },
        () => {
          if (selectedStory) {
            fetchAcceptanceCriteria(selectedStory.id)
          }
        }
      )
      .subscribe()

    return () => {
      epicSubscription.unsubscribe()
      storySubscription.unsubscribe()
      acSubscription.unsubscribe()
    }
  }, [selectedStory, fetchAcceptanceCriteria, fetchDashboardData])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const { data: epicsData, error: epicsError } = await supabase
        .from('epics')
        .select('*')
        .order('epic_number')

      if (epicsError) throw epicsError
      setEpics(epicsData || [])

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*, epic:epics(*)')
        .order('story_number')

      if (storiesError) throw storiesError
      setStories(storiesData || [])

      const { data: statsData, error: statsError } = await supabase
        .from('bmad_dashboard')
        .select('*')
        .single()

      if (statsError) {
        const stats: DashboardStats = {
          completed_epics: epicsData?.filter((e) => e.status === 'complete').length || 0,
          in_progress_epics: epicsData?.filter((e) => e.status === 'in_progress').length || 0,
          not_started_epics: epicsData?.filter((e) => e.status === 'not_started').length || 0,
          completed_stories: storiesData?.filter((s) => s.status === 'complete').length || 0,
          in_progress_stories: storiesData?.filter((s) => s.status === 'in_progress').length || 0,
          blocked_stories: storiesData?.filter((s) => s.status === 'blocked').length || 0,
          passed_criteria: 0,
          failed_criteria: 0,
          pending_criteria: 0,
          stories_in_current_sprint: 0,
        }
        setDashboardStats(stats)
      } else {
        setDashboardStats(statsData)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load development status')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAcceptanceCriteria(storyId: string) {
    const { data, error } = await supabase
      .from('acceptance_criteria')
      .select('*')
      .eq('story_id', storyId)
      .order('criterion_number')

    if (!error) {
      setAcceptanceCriteria(data || [])
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-yellow-400" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
      case 'blocked':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'deferred':
        return <AlertCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-600" />
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'complete':
        return 'Complete'
      case 'in_progress':
        return 'In Progress'
      case 'not_started':
        return 'Not Started'
      case 'blocked':
        return 'Blocked'
      case 'deferred':
        return 'Planned'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-950 via-black to-yellow-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-300" />
          </div>
          <p className="text-yellow-100 text-lg font-medium">Loading Development Roadmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-950 via-black to-yellow-950">
        <Card className="max-w-md bg-black/80 border-yellow-900/50">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-center text-yellow-100 text-lg mb-2">Unable to Load Status</p>
            <p className="text-center text-gray-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-gradient-to-br from-gray-950 via-black to-yellow-950">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-black via-yellow-950/20 to-black border-b border-yellow-900/30 p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30">
              <Target className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                Development Roadmap
              </h1>
              <p className="text-yellow-100/70 text-sm mt-1">
                Building the future of AI filmmaking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      {dashboardStats && (
        <div className="max-w-7xl mx-auto w-full px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <Rocket className="w-8 h-8 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">
                  {dashboardStats.completed_epics}/{epics.length}
                </div>
              </div>
              <div className="text-yellow-100 font-medium">Features Complete</div>
              <div className="text-yellow-400/60 text-sm mt-1">
                {dashboardStats.in_progress_epics} in progress
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">
                  {dashboardStats.completed_stories}/{stories.length}
                </div>
              </div>
              <div className="text-yellow-100 font-medium">Tasks Complete</div>
              <div className="text-yellow-400/60 text-sm mt-1">
                {dashboardStats.in_progress_stories} active now
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-8 h-8 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">
                  {dashboardStats.passed_criteria}
                </div>
              </div>
              <div className="text-yellow-100 font-medium">Tests Passing</div>
              <div className="text-yellow-400/60 text-sm mt-1">
                {dashboardStats.pending_criteria} pending
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">
                  {dashboardStats.stories_in_current_sprint}
                </div>
              </div>
              <div className="text-yellow-100 font-medium">Current Sprint</div>
              <div className="text-yellow-400/60 text-sm mt-1">tasks in progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Roadmap View */}
      <div className="max-w-7xl mx-auto w-full px-8 pb-8">
        <div className="mb-6">
          <button
            onClick={() => setShowFullRoadmap(!showFullRoadmap)}
            className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 rounded-xl shadow-lg shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105"
          >
            <Map className="w-6 h-6 text-black" />
            <span className="text-black font-bold text-lg">
              {showFullRoadmap ? 'Hide' : 'View'} Full Roadmap
            </span>
            {showFullRoadmap ? (
              <ChevronDown className="w-5 h-5 text-black" />
            ) : (
              <ChevronRight className="w-5 h-5 text-black" />
            )}
          </button>
        </div>

        {showFullRoadmap && (
          <div className="space-y-6 animate-in slide-in-from-top duration-500">
            {ROADMAP_PHASES.map((phase, index) => {
              const PhaseIcon = phase.icon
              const isExpanded = expandedPhase === phase.id

              return (
                <div key={phase.id} className="group">
                  <div
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start gap-6 mb-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-16 h-16 rounded-2xl ${phase.color} shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}
                        >
                          <PhaseIcon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-yellow-100">{phase.name}</h2>
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                            {phase.id.toUpperCase()}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-yellow-400 ml-auto" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-yellow-400 ml-auto" />
                          )}
                        </div>
                        <p className="text-yellow-300/80 text-lg">{phase.tagline}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ml-22 space-y-3 animate-in slide-in-from-top duration-300">
                        {phase.epics.map((epic) => (
                          <div
                            key={epic.number}
                            className="bg-black/40 border border-yellow-900/40 rounded-xl p-5 backdrop-blur hover:bg-black/60 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(epic.status)}
                                <div>
                                  <div className="text-yellow-100 font-semibold">{epic.name}</div>
                                  <div className="text-yellow-400/60 text-sm">{epic.number}</div>
                                </div>
                              </div>
                              <Badge
                                className={`${
                                  epic.status === 'complete'
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                    : epic.status === 'in_progress'
                                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                      : epic.status === 'deferred'
                                        ? 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                        : 'bg-gray-700/20 text-gray-400 border-gray-700/50'
                                }`}
                              >
                                {getStatusLabel(epic.status)}
                              </Badge>
                            </div>
                            <p className="text-yellow-100/70 text-sm leading-relaxed">
                              {epic.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {index < ROADMAP_PHASES.length - 1 && (
                    <div className="flex justify-center my-6">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-yellow-500/50 to-transparent"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-yellow-900/30 bg-black/40 backdrop-blur px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="text-yellow-400/60">Last synced: {new Date().toLocaleString()}</div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg border border-yellow-500/50 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}
