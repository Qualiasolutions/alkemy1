-- =====================================================
-- FIX BMAD DASHBOARD UNDEFINED VALUES
-- Date: 2025-11-20
-- Purpose: Add missing aggregate fields to views
-- =====================================================

BEGIN;

-- Fix epic_summary view to include total_stories and total_acceptance_criteria
DROP VIEW IF EXISTS public.epic_summary CASCADE;

CREATE VIEW public.epic_summary AS
SELECT
  e.id,
  e.epic_number,
  e.title,
  e.description,
  e.status,
  e.progress_percentage,
  e.priority,
  COUNT(DISTINCT s.id) AS total_stories,
  COUNT(DISTINCT CASE WHEN s.status = 'complete' THEN s.id END) AS completed_stories,
  COUNT(DISTINCT ac.id) AS total_acceptance_criteria,
  COUNT(DISTINCT CASE WHEN ac.status = 'passed' THEN ac.id END) AS passed_acceptance_criteria,
  e.created_at,
  e.updated_at
FROM public.epics e
LEFT JOIN public.stories s ON s.epic_id = e.id
LEFT JOIN public.acceptance_criteria ac ON ac.story_id = s.id
GROUP BY e.id, e.epic_number, e.title, e.description, e.status, e.progress_percentage, e.priority, e.created_at, e.updated_at;

GRANT SELECT ON public.epic_summary TO authenticated;
GRANT SELECT ON public.epic_summary TO anon;

-- Fix story_summary view to include total_acceptance_criteria and passed_acceptance_criteria
DROP VIEW IF EXISTS public.story_summary CASCADE;

CREATE VIEW public.story_summary AS
SELECT
  s.id,
  s.story_number,
  s.title,
  s.description,
  s.status,
  s.progress_percentage,
  s.epic_id,
  e.epic_number,
  e.title AS epic_title,
  COUNT(DISTINCT ac.id) AS total_acceptance_criteria,
  COUNT(DISTINCT CASE WHEN ac.status = 'passed' THEN ac.id END) AS passed_acceptance_criteria,
  s.created_at,
  s.updated_at
FROM public.stories s
LEFT JOIN public. epics e ON e.id = s.epic_id
LEFT JOIN public.acceptance_criteria ac ON ac.story_id = s.id
GROUP BY s.id, s.story_number, s.title, s.description, s.status, s.progress_percentage, s.epic_id, e.epic_number, e.title, s.created_at, s.updated_at;

GRANT SELECT ON public.story_summary TO authenticated;
GRANT SELECT ON public.story_summary TO anon;

-- Fix bmad_dashboard view
DROP VIEW IF EXISTS public.bmad_dashboard CASCADE;

CREATE VIEW public.bmad_dashboard AS
SELECT
  COUNT(DISTINCT CASE WHEN e.status = 'complete' THEN e.id END) AS completed_epics,
  COUNT(DISTINCT CASE WHEN e.status = 'in_progress' THEN e.id END) AS in_progress_epics,
  COUNT(DISTINCT CASE WHEN e.status = 'not_started' OR e.status IS NULL THEN e.id END) AS not_started_epics,
  COUNT(DISTINCT CASE WHEN s.status = 'complete' THEN s.id END) AS completed_stories,
  COUNT(DISTINCT CASE WHEN s.status = 'in_progress' THEN s.id END) AS in_progress_stories,
  COUNT(DISTINCT CASE WHEN s.status = 'blocked' THEN s.id END) AS blocked_stories,
  COUNT(DISTINCT CASE WHEN ac.status = 'passed' THEN ac.id END) AS passed_criteria,
  COUNT(DISTINCT CASE WHEN ac.status = 'failed' THEN ac.id END) AS failed_criteria,
  COUNT(DISTINCT CASE WHEN ac.status = 'pending' OR ac.status IS NULL THEN ac.id END) AS pending_criteria,
  COUNT(DISTINCT CASE WHEN ss.sprint_id IS NOT NULL AND s.status IN ('in_progress', 'ready') THEN s.id END) AS stories_in_current_sprint
FROM public.epics e
LEFT JOIN public.stories s ON s.epic_id = e.id
LEFT JOIN public.acceptance_criteria ac ON ac.story_id = s.id
LEFT JOIN public.sprint_stories ss ON ss.story_id = s.id;

GRANT SELECT ON public.bmad_dashboard TO authenticated;
GRANT SELECT ON public.bmad_dashboard TO anon;

COMMIT;
