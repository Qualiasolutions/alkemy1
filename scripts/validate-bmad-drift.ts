#!/usr/bin/env tsx
/**
 * BMAD Drift Validation Script
 * Detects when documentation and database are out of sync
 * Ensures single source of truth integrity
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
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface DriftIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  suggestion?: string;
}

// Parse acceptance criteria from markdown
function parseAcceptanceCriteria(content: string): Map<string, string> {
  const criteria = new Map<string, string>();
  const acRegex = /- \[([ x])\] \*\*AC(\d+)\*\*:?\s*(.+)/gi;

  let match;
  while ((match = acRegex.exec(content)) !== null) {
    const status = match[1] === 'x' ? 'passed' : 'pending';
    criteria.set(`AC${match[2]}`, status);
  }

  return criteria;
}

// Validate story files vs database
async function validateStories(): Promise<DriftIssue[]> {
  const issues: DriftIssue[] = [];

  // Get all stories from database
  const { data: dbStories, error } = await supabase
    .from('stories')
    .select('*');

  if (error) {
    issues.push({
      type: 'error',
      category: 'Database',
      message: 'Failed to fetch stories from database',
      suggestion: 'Check database connection and permissions'
    });
    return issues;
  }

  // Get all story files
  const storyFiles = glob.sync('docs/stories/epic-*.md');

  // Create maps for comparison
  const dbStoryMap = new Map(dbStories?.map(s => [s.story_number, s]) || []);
  const fileStoryNumbers = new Set<string>();

  // Check each file
  for (const filePath of storyFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);

      // Extract story number
      const storyNumber = frontmatter.story ||
        path.basename(filePath).match(/story-(\d+\.\d+)/)?.[0]?.replace('story-', 'STORY-');

      if (!storyNumber) {
        issues.push({
          type: 'warning',
          category: 'Story Files',
          message: `No story number found in file`,
          file: filePath,
          suggestion: 'Add "story: STORY-X.Y" to frontmatter'
        });
        continue;
      }

      fileStoryNumbers.add(storyNumber);

      // Check if story exists in database
      const dbStory = dbStoryMap.get(storyNumber);
      if (!dbStory) {
        issues.push({
          type: 'error',
          category: 'Story Sync',
          message: `Story ${storyNumber} exists in file but not in database`,
          file: filePath,
          suggestion: 'Run "npm run bmad:sync" to sync file to database'
        });
        continue;
      }

      // Compare status
      if (frontmatter.status && dbStory.status !== frontmatter.status) {
        issues.push({
          type: 'warning',
          category: 'Status Mismatch',
          message: `Story ${storyNumber} status mismatch: file=${frontmatter.status}, db=${dbStory.status}`,
          file: filePath,
          suggestion: 'Run "npm run bmad:sync" to update database'
        });
      }

      // Compare progress
      if (frontmatter.progress !== undefined && dbStory.progress_percentage !== frontmatter.progress) {
        issues.push({
          type: 'warning',
          category: 'Progress Mismatch',
          message: `Story ${storyNumber} progress mismatch: file=${frontmatter.progress}%, db=${dbStory.progress_percentage}%`,
          file: filePath,
          suggestion: 'Run "npm run bmad:sync" to update database'
        });
      }

      // Check acceptance criteria
      const fileCriteria = parseAcceptanceCriteria(content);
      if (fileCriteria.size > 0) {
        const { data: dbCriteria, error: acError } = await supabase
          .from('acceptance_criteria')
          .select('*')
          .eq('story_id', dbStory.id);

        if (!acError && dbCriteria) {
          const dbCriteriaMap = new Map(dbCriteria.map(c => [c.criterion_number, c.status]));

          // Check for missing criteria in database
          for (const [acNumber, fileStatus] of fileCriteria) {
            const dbStatus = dbCriteriaMap.get(acNumber);
            if (!dbStatus) {
              issues.push({
                type: 'warning',
                category: 'Acceptance Criteria',
                message: `${storyNumber}: ${acNumber} exists in file but not in database`,
                file: filePath,
                suggestion: 'Run "npm run bmad:sync" to add missing criteria'
              });
            } else if (dbStatus !== fileStatus) {
              issues.push({
                type: 'warning',
                category: 'Acceptance Criteria',
                message: `${storyNumber}: ${acNumber} status mismatch: file=${fileStatus}, db=${dbStatus}`,
                file: filePath,
                suggestion: 'Run "npm run bmad:sync" to update criteria status'
              });
            }
          }

          // Check for extra criteria in database
          for (const dbCriterion of dbCriteria) {
            if (!fileCriteria.has(dbCriterion.criterion_number)) {
              issues.push({
                type: 'info',
                category: 'Acceptance Criteria',
                message: `${storyNumber}: ${dbCriterion.criterion_number} exists in database but not in file`,
                file: filePath,
                suggestion: 'Add criterion to story file or remove from database'
              });
            }
          }
        }
      }

    } catch (error) {
      issues.push({
        type: 'error',
        category: 'File Processing',
        message: `Failed to process file: ${error}`,
        file: filePath
      });
    }
  }

  // Check for database stories without files
  for (const [storyNumber, dbStory] of dbStoryMap) {
    if (!fileStoryNumbers.has(storyNumber)) {
      issues.push({
        type: 'warning',
        category: 'Story Files',
        message: `Story ${storyNumber} exists in database but no corresponding file found`,
        suggestion: `Create file: docs/stories/epic-${storyNumber.match(/\d+/)?.[0]}-story-${storyNumber.replace('STORY-', '')}.md`
      });
    }
  }

  return issues;
}

// Validate epics
async function validateEpics(): Promise<DriftIssue[]> {
  const issues: DriftIssue[] = [];

  // Get all epics from database
  const { data: dbEpics, error } = await supabase
    .from('epics')
    .select('*')
    .order('epic_number');

  if (error) {
    issues.push({
      type: 'error',
      category: 'Database',
      message: 'Failed to fetch epics from database'
    });
    return issues;
  }

  // Check for expected epics based on story files
  const storyFiles = glob.sync('docs/stories/epic-*.md');
  const epicNumbersFromFiles = new Set<string>();

  for (const filePath of storyFiles) {
    const epicMatch = path.basename(filePath).match(/epic-(\d+)/);
    if (epicMatch) {
      epicNumbersFromFiles.add(`EPIC-${epicMatch[1]}`);
    }
  }

  // Check each epic from files exists in database
  for (const epicNumber of epicNumbersFromFiles) {
    const dbEpic = dbEpics?.find(e => e.epic_number === epicNumber);
    if (!dbEpic) {
      issues.push({
        type: 'warning',
        category: 'Epic Sync',
        message: `Epic ${epicNumber} referenced in story files but not in database`,
        suggestion: 'Run "npm run bmad:sync" to create epic'
      });
    }
  }

  // Validate epic progress calculations
  for (const epic of dbEpics || []) {
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('status')
      .eq('epic_id', epic.id);

    if (!storiesError && stories) {
      const totalStories = stories.length;
      const completedStories = stories.filter(s => s.status === 'complete').length;
      const expectedProgress = totalStories > 0 ? Math.round((completedStories * 100) / totalStories) : 0;

      if (Math.abs(epic.progress_percentage - expectedProgress) > 5) {
        issues.push({
          type: 'warning',
          category: 'Epic Progress',
          message: `Epic ${epic.epic_number} progress mismatch: db=${epic.progress_percentage}%, calculated=${expectedProgress}%`,
          suggestion: 'Progress should auto-calculate from story completion'
        });
      }
    }
  }

  return issues;
}

// Check for missing frontmatter
async function validateFrontmatter(): Promise<DriftIssue[]> {
  const issues: DriftIssue[] = [];
  const storyFiles = glob.sync('docs/stories/epic-*.md');

  for (const filePath of storyFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter } = matter(fileContent);

      const requiredFields = ['epic', 'story', 'status', 'progress'];
      const missingFields = requiredFields.filter(field => !(field in frontmatter));

      if (missingFields.length > 0) {
        issues.push({
          type: 'warning',
          category: 'Frontmatter',
          message: `Missing required frontmatter fields: ${missingFields.join(', ')}`,
          file: filePath,
          suggestion: 'Add missing fields to enable auto-sync'
        });
      }

      // Check for auto_sync flag
      if (!('auto_sync' in frontmatter)) {
        issues.push({
          type: 'info',
          category: 'Frontmatter',
          message: 'No auto_sync flag found (defaults to true)',
          file: filePath,
          suggestion: 'Add "auto_sync: true" to frontmatter for explicit control'
        });
      }

    } catch (error) {
      issues.push({
        type: 'error',
        category: 'File Processing',
        message: `Failed to read file: ${error}`,
        file: filePath
      });
    }
  }

  return issues;
}

// Main validation function
async function validateBMAD(): Promise<void> {
  console.log('🔍 Validating BMAD documentation drift...\n');

  const allIssues: DriftIssue[] = [];

  // Run all validations
  console.log('📋 Checking stories...');
  const storyIssues = await validateStories();
  allIssues.push(...storyIssues);

  console.log('📊 Checking epics...');
  const epicIssues = await validateEpics();
  allIssues.push(...epicIssues);

  console.log('📝 Checking frontmatter...');
  const frontmatterIssues = await validateFrontmatter();
  allIssues.push(...frontmatterIssues);

  // Group issues by type
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const info = allIssues.filter(i => i.type === 'info');

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80));

  if (errors.length > 0) {
    console.log('\n❌ ERRORS (' + errors.length + ')');
    console.log('-'.repeat(40));
    for (const issue of errors) {
      console.log(`\n[${issue.category}] ${issue.message}`);
      if (issue.file) console.log(`  File: ${issue.file}`);
      if (issue.suggestion) console.log(`  💡 ${issue.suggestion}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (' + warnings.length + ')');
    console.log('-'.repeat(40));
    for (const issue of warnings) {
      console.log(`\n[${issue.category}] ${issue.message}`);
      if (issue.file) console.log(`  File: ${issue.file}`);
      if (issue.suggestion) console.log(`  💡 ${issue.suggestion}`);
    }
  }

  if (info.length > 0) {
    console.log('\nℹ️  INFO (' + info.length + ')');
    console.log('-'.repeat(40));
    for (const issue of info) {
      console.log(`\n[${issue.category}] ${issue.message}`);
      if (issue.file) console.log(`  File: ${issue.file}`);
      if (issue.suggestion) console.log(`  💡 ${issue.suggestion}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Issues: ${allIssues.length}`);
  console.log(`  - Errors: ${errors.length}`);
  console.log(`  - Warnings: ${warnings.length}`);
  console.log(`  - Info: ${info.length}`);

  if (allIssues.length === 0) {
    console.log('\n✅ No drift detected! Documentation and database are in sync.');
    process.exit(0);
  } else if (errors.length > 0) {
    console.log('\n🔴 Critical issues detected. Run "npm run bmad:sync" to fix.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n🟡 Minor drift detected. Consider running "npm run bmad:sync".');
    process.exit(0);
  } else {
    console.log('\n🟢 Only informational items found. System is healthy.');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  validateBMAD().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { validateBMAD, validateStories, validateEpics, validateFrontmatter };