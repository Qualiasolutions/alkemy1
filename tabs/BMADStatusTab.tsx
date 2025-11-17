import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Progress } from '@/components/ui/Progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Circle, XCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

interface Epic {
  id: string;
  epic_number: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked' | 'deferred';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface Story {
  id: string;
  epic_id: string;
  story_number: string;
  title: string;
  status: 'draft' | 'ready' | 'in_progress' | 'review' | 'complete' | 'blocked' | 'deferred';
  progress_percentage: number;
  assignee: string | null;
  file_path: string;
  epic?: Epic;
}

interface AcceptanceCriterion {
  id: string;
  story_id: string;
  criterion_number: string;
  description: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'blocked';
  verified_at: string | null;
}

interface DashboardStats {
  completed_epics: number;
  in_progress_epics: number;
  not_started_epics: number;
  completed_stories: number;
  in_progress_stories: number;
  blocked_stories: number;
  passed_criteria: number;
  failed_criteria: number;
  pending_criteria: number;
  stories_in_current_sprint: number;
}

export function BMADStatusTab() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriterion[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const epicSubscription = supabase
      .channel('epic-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epics' }, fetchDashboardData)
      .subscribe();

    const storySubscription = supabase
      .channel('story-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, fetchDashboardData)
      .subscribe();

    const acSubscription = supabase
      .channel('ac-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acceptance_criteria' }, () => {
        if (selectedStory) {
          fetchAcceptanceCriteria(selectedStory.id);
        }
      })
      .subscribe();

    return () => {
      epicSubscription.unsubscribe();
      storySubscription.unsubscribe();
      acSubscription.unsubscribe();
    };
  }, [selectedStory]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch epics
      const { data: epicsData, error: epicsError } = await supabase
        .from('epics')
        .select('*')
        .order('epic_number');

      if (epicsError) throw epicsError;
      setEpics(epicsData || []);

      // Fetch stories with epic data
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*, epic:epics(*)')
        .order('story_number');

      if (storiesError) throw storiesError;
      setStories(storiesData || []);

      // Fetch dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('bmad_dashboard')
        .select('*')
        .single();

      if (statsError) {
        // If view doesn't exist, calculate manually
        const stats: DashboardStats = {
          completed_epics: epicsData?.filter(e => e.status === 'complete').length || 0,
          in_progress_epics: epicsData?.filter(e => e.status === 'in_progress').length || 0,
          not_started_epics: epicsData?.filter(e => e.status === 'not_started').length || 0,
          completed_stories: storiesData?.filter(s => s.status === 'complete').length || 0,
          in_progress_stories: storiesData?.filter(s => s.status === 'in_progress').length || 0,
          blocked_stories: storiesData?.filter(s => s.status === 'blocked').length || 0,
          passed_criteria: 0,
          failed_criteria: 0,
          pending_criteria: 0,
          stories_in_current_sprint: 0
        };
        setDashboardStats(stats);
      } else {
        setDashboardStats(statsData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load BMAD status data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAcceptanceCriteria(storyId: string) {
    const { data, error } = await supabase
      .from('acceptance_criteria')
      .select('*')
      .eq('story_id', storyId)
      .order('criterion_number');

    if (!error) {
      setAcceptanceCriteria(data || []);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'blocked':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'deferred':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'complete':
      case 'passed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'blocked':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BMAD status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-center text-muted-foreground">{error}</p>
            <p className="text-center text-sm mt-4">
              Make sure the BMAD tracking tables are created by running:
              <code className="block mt-2 p-2 bg-muted rounded">npx supabase db push</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">BMAD Development Status</h1>
        <p className="text-muted-foreground">
          Real-time tracking of epics, stories, and acceptance criteria
        </p>
      </div>

      {/* Quick Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Epics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.completed_epics}/{epics.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dashboardStats.in_progress_epics} in progress
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.completed_stories}/{stories.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dashboardStats.in_progress_stories} in progress
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Acceptance Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.passed_criteria}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dashboardStats.pending_criteria} pending, {dashboardStats.failed_criteria} failed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Current Sprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.stories_in_current_sprint}</div>
              <div className="text-xs text-muted-foreground mt-1">stories active</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Epics List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Epics</span>
              <Badge variant="secondary">{epics.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {epics.map(epic => (
              <div
                key={epic.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedEpic === epic.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedEpic(epic.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(epic.status)}
                    <span className="font-medium">{epic.epic_number}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(epic.status)}>
                    {epic.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{epic.title}</p>
                <Progress value={epic.progress_percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {epic.progress_percentage}% complete
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stories List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stories</span>
              {selectedEpic && (
                <Badge variant="secondary">
                  {stories.filter(s => s.epic_id === selectedEpic).length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-auto">
            {stories
              .filter(story => !selectedEpic || story.epic_id === selectedEpic)
              .map(story => (
                <div
                  key={story.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStory?.id === story.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedStory(story);
                    fetchAcceptanceCriteria(story.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(story.status)}
                      <span className="font-medium text-sm">{story.story_number}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(story.status)} className="text-xs">
                      {story.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{story.title}</p>
                  {story.progress_percentage > 0 && (
                    <div className="mt-2">
                      <Progress value={story.progress_percentage} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {story.progress_percentage}% complete
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Acceptance Criteria */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Acceptance Criteria</span>
              {selectedStory && (
                <Badge variant="secondary">{acceptanceCriteria.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStory ? (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="font-medium">{selectedStory.story_number}</p>
                  <p className="text-sm text-muted-foreground">{selectedStory.title}</p>
                </div>
                {acceptanceCriteria.length > 0 ? (
                  <div className="space-y-2">
                    {acceptanceCriteria.map(ac => (
                      <div key={ac.id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50">
                        {getStatusIcon(ac.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{ac.criterion_number}</span>
                            <Badge variant={getStatusBadgeVariant(ac.status)} className="text-xs">
                              {ac.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{ac.description}</p>
                          {ac.verified_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Verified: {new Date(ac.verified_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No acceptance criteria defined for this story
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a story to view acceptance criteria
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
          <button
            onClick={() => window.location.href = '/docs/BMAD_STATUS.md'}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
}