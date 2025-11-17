#!/usr/bin/env tsx
/**
 * BMAD Status Synchronization Script
 * Syncs story markdown files with Supabase database
 * Maintains bi-directional sync between documentation and tracking system
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import matter from 'gray-matter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface StoryFrontmatter {
  epic?: string;
  story?: string;
  status?: string;
  progress?: number;
  assignee?: string;
  dependencies?: string[];
  last_sync?: string;
  auto_sync?: boolean;
}

interface AcceptanceCriterion {
  number: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'blocked';
}

interface IntegrationVerification {
  number: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'n/a';
}

interface MigrationCheckpoint {
  number: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'n/a';
}

// Parse acceptance criteria from markdown content
function parseAcceptanceCriteria(content: string): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  const acRegex = /- \[([ x])\] \*\*AC(\d+)\*\*:?\s*(.+)/gi;

  let match;
  while ((match = acRegex.exec(content)) !== null) {
    criteria.push({
      number: `AC${match[2]}`,
      description: match[3].trim(),
      status: match[1] === 'x' ? 'passed' : 'pending'
    });
  }

  return criteria;
}

// Parse integration verifications from markdown
function parseIntegrationVerifications(content: string): IntegrationVerification[] {
  const verifications: IntegrationVerification[] = [];
  const ivRegex = /- \[([ x])\] \*\*IV(\d+)\*\*:?\s*(.+)/gi;

  let match;
  while ((match = ivRegex.exec(content)) !== null) {
    verifications.push({
      number: `IV${match[2]}`,
      description: match[3].trim(),
      status: match[1] === 'x' ? 'passed' : 'pending'
    });
  }

  return verifications;
}

// Parse migration checkpoints from markdown
function parseMigrationCheckpoints(content: string): MigrationCheckpoint[] {
  const checkpoints: MigrationCheckpoint[] = [];
  const mcRegex = /- \[([ x])\] \*\*MC(\d+)\*\*:?\s*(.+)/gi;

  let match;
  while ((match = mcRegex.exec(content)) !== null) {
    checkpoints.push({
      number: `MC${match[2]}`,
      description: match[3].trim(),
      status: match[1] === 'x' ? 'passed' : 'pending'
    });
  }

  return checkpoints;
}

// Get or create epic ID
async function getOrCreateEpicId(epicNumber: string): Promise<string | null> {
  if (!epicNumber) return null;

  const { data, error } = await supabase
    .from('epics')
    .select('id')
    .eq('epic_number', epicNumber)
    .single();

  if (data) return data.id;

  // Create epic if it doesn't exist
  const { data: newEpic, error: createError } = await supabase
    .from('epics')
    .insert({
      epic_number: epicNumber,
      title: `${epicNumber} (Auto-created)`,
      status: 'not_started',
      progress_percentage: 0
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`❌ Failed to create epic ${epicNumber}:`, createError);
    return null;
  }

  return newEpic?.id || null;
}

// Get story ID
async function getStoryId(storyNumber: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('id')
    .eq('story_number', storyNumber)
    .single();

  if (error) {
    console.error(`❌ Failed to get story ID for ${storyNumber}:`, error);
    return null;
  }

  return data?.id || null;
}

// Sync a single story file
async function syncStoryFile(filePath: string): Promise<void> {
  console.log(`📄 Syncing ${filePath}...`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    const fm = frontmatter as StoryFrontmatter;

    // Skip if auto_sync is false
    if (fm.auto_sync === false) {
      console.log(`  ⏭️  Skipping (auto_sync disabled)`);
      return;
    }

    // Extract story number from filename if not in frontmatter
    const storyNumber = fm.story || path.basename(filePath).match(/story-(\d+\.\d+)/)?.[0]?.replace('story-', 'STORY-');

    if (!storyNumber) {
      console.log(`  ⚠️  No story number found, skipping`);
      return;
    }

    // Extract epic number
    const epicNumber = fm.epic || path.basename(filePath).match(/epic-(\d+)/)?.[0]?.replace('epic-', 'EPIC-');

    // Get or create epic ID
    const epicId = epicNumber ? await getOrCreateEpicId(epicNumber) : null;

    // Parse content sections
    const acceptanceCriteria = parseAcceptanceCriteria(content);
    const integrationVerifications = parseIntegrationVerifications(content);
    const migrationCheckpoints = parseMigrationCheckpoints(content);

    // Extract title from content
    const titleMatch = content.match(/^#\s+Story\s+[\d.]+:\s*(.+)$/m);
    const title = titleMatch?.[1] || `Story ${storyNumber.replace('STORY-', '')}`;

    // Upsert story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .upsert({
        story_number: storyNumber,
        epic_id: epicId,
        title: title,
        status: fm.status || 'draft',
        progress_percentage: fm.progress || 0,
        assignee: fm.assignee || null,
        file_path: filePath,
        dependencies: fm.dependencies || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'story_number'
      })
      .select('id')
      .single();

    if (storyError) {
      console.error(`  ❌ Failed to upsert story:`, storyError);
      return;
    }

    const storyId = story.id;

    // Sync acceptance criteria
    for (const ac of acceptanceCriteria) {
      await supabase
        .from('acceptance_criteria')
        .upsert({
          story_id: storyId,
          criterion_number: ac.number,
          description: ac.description,
          status: ac.status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'story_id,criterion_number'
        });
    }

    // Sync integration verifications
    for (const iv of integrationVerifications) {
      await supabase
        .from('integration_verifications')
        .upsert({
          story_id: storyId,
          verification_number: iv.number,
          description: iv.description,
          status: iv.status
        }, {
          onConflict: 'story_id,verification_number'
        });
    }

    // Sync migration checkpoints
    for (const mc of migrationCheckpoints) {
      await supabase
        .from('migration_checkpoints')
        .upsert({
          story_id: storyId,
          checkpoint_number: mc.number,
          description: mc.description,
          status: mc.status
        }, {
          onConflict: 'story_id,checkpoint_number'
        });
    }

    // Update frontmatter with last_sync time
    const updatedFrontmatter = {
      ...fm,
      last_sync: new Date().toISOString(),
      auto_sync: fm.auto_sync !== false
    };

    const updatedContent = matter.stringify(content, updatedFrontmatter);
    fs.writeFileSync(filePath, updatedContent);

    console.log(`  ✅ Synced successfully (${acceptanceCriteria.length} AC, ${integrationVerifications.length} IV, ${migrationCheckpoints.length} MC)`);

  } catch (error) {
    console.error(`  ❌ Error syncing ${filePath}:`, error);
  }
}

// Sync all story files
async function syncAllStories(): Promise<void> {
  console.log('🔄 Starting BMAD status synchronization...\n');

  // Find all story files
  const storyFiles = glob.sync('docs/stories/epic-*.md', {
    cwd: process.cwd()
  });

  console.log(`📚 Found ${storyFiles.length} story files\n`);

  // Sync each file
  for (const file of storyFiles) {
    await syncStoryFile(file);
  }

  console.log('\n✨ Synchronization complete!');
}

// Generate master status document
async function generateMasterStatus(): Promise<void> {
  console.log('\n📊 Generating master status document...');

  // Query database for complete status
  const { data: epics, error: epicsError } = await supabase
    .from('epic_summary')
    .select('*')
    .order('epic_number');

  if (epicsError) {
    console.error('❌ Failed to fetch epic summary:', epicsError);
    return;
  }

  const { data: stories, error: storiesError } = await supabase
    .from('story_summary')
    .select('*')
    .order('story_number');

  if (storiesError) {
    console.error('❌ Failed to fetch story summary:', storiesError);
    return;
  }

  const { data: dashboard, error: dashboardError } = await supabase
    .from('bmad_dashboard')
    .select('*')
    .single();

  if (dashboardError) {
    console.error('❌ Failed to fetch dashboard data:', dashboardError);
    return;
  }

  // Generate markdown
  const now = new Date().toISOString();
  const markdown = `# BMAD Status Dashboard - Alkemy AI Studio
**Last Updated**: ${now} (Auto-generated)
**Database Sync**: ✅ Connected

## Quick Stats
- **Epics**: ${dashboard.completed_epics} complete, ${dashboard.in_progress_epics} in progress, ${dashboard.not_started_epics} not started
- **Stories**: ${dashboard.completed_stories} complete, ${dashboard.in_progress_stories} in progress, ${dashboard.blocked_stories} blocked
- **Acceptance Criteria**: ${dashboard.passed_criteria} passed, ${dashboard.failed_criteria} failed, ${dashboard.pending_criteria} pending
- **Current Sprint**: ${dashboard.stories_in_current_sprint} stories active

## Epic Progress Overview

| Epic | Status | Progress | Stories | Acceptance Criteria |
|------|--------|----------|---------|---------------------|
${epics?.map(epic => {
  const statusIcon = epic.status === 'complete' ? '✅' :
                     epic.status === 'in_progress' ? '🟡' :
                     epic.status === 'blocked' ? '🔴' : '⚪';
  return `| ${epic.epic_number} | ${statusIcon} ${epic.status} | ${epic.progress_percentage}% | ${epic.completed_stories}/${epic.total_stories} | ${epic.passed_acceptance_criteria}/${epic.total_acceptance_criteria} |`;
}).join('\n')}

## Story Status Details

### In Progress Stories
${stories?.filter(s => s.status === 'in_progress').map(story =>
  `- **${story.story_number}**: ${story.title} (${story.progress_percentage}% - ${story.passed_acceptance_criteria}/${story.total_acceptance_criteria} AC passed)`
).join('\n') || '*(No stories in progress)*'}

### Blocked Stories
${stories?.filter(s => s.status === 'blocked').map(story =>
  `- **${story.story_number}**: ${story.title} - ⚠️ BLOCKED`
).join('\n') || '*(No blocked stories)*'}

### Recently Completed
${stories?.filter(s => s.status === 'complete').slice(0, 5).map(story =>
  `- **${story.story_number}**: ${story.title} ✅`
).join('\n') || '*(No recently completed stories)*'}

## Epic Details

${epics?.map(epic => `
### ${epic.epic_number}: ${epic.title}
- **Status**: ${epic.status}
- **Progress**: ${epic.progress_percentage}% (${epic.completed_stories}/${epic.total_stories} stories)
- **Acceptance Criteria**: ${epic.passed_acceptance_criteria}/${epic.total_acceptance_criteria} passed
`).join('\n')}

---

*This document is auto-generated. Do not edit manually. Run \`npm run bmad:sync\` to update.*
`;

  // Write to file
  const outputPath = 'docs/BMAD_STATUS.md';
  fs.writeFileSync(outputPath, markdown);

  console.log(`✅ Master status document generated: ${outputPath}`);
}

// Main execution
async function main() {
  try {
    // Sync all stories
    await syncAllStories();

    // Generate master status
    await generateMasterStatus();

    console.log('\n🎉 BMAD synchronization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { syncStoryFile, syncAllStories, generateMasterStatus };