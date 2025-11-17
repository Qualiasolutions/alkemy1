#!/usr/bin/env tsx
/**
 * Quick fix script to update story statuses in markdown files
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Stories that should be marked as complete based on Epic completion
const storiesToUpdate = [
  // Epic 1 stories (all should be complete)
  { file: 'epic-1-story-1.2-voice-output.md', status: 'complete', progress: 100 },
  { file: 'epic-1-story-1.3-style-learning.md', status: 'complete', progress: 100 },
  { file: 'epic-1-story-1.4-continuity-checking.md', status: 'complete', progress: 100 },
  // Epic 2 stories (all should be complete)
  { file: 'epic-2-story-2.1-character-identity-training.md', status: 'complete', progress: 100 },
  { file: 'epic-2-story-2.2-character-identity-preview.md', status: 'complete', progress: 100 },
  { file: 'epic-2-story-2.3-character-identity-integration.md', status: 'complete', progress: 100 },
];

async function updateStoryFiles() {
  console.log('🔧 Fixing story statuses in markdown files...\n');

  for (const story of storiesToUpdate) {
    const filePath = path.join('docs/stories', story.file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);

      // Extract story number from filename if not in frontmatter
      const storyMatch = story.file.match(/story-(\d+\.\d+)/);
      const storyNumber = storyMatch ? `STORY-${storyMatch[1]}` : '';

      // Extract epic number from filename
      const epicMatch = story.file.match(/epic-(\d+)/);
      const epicNumber = epicMatch ? `EPIC-${epicMatch[1]}` : '';

      // Update frontmatter with complete status
      const updatedFrontmatter = {
        epic: epicNumber || frontmatter.epic,
        story: storyNumber || frontmatter.story,
        title: frontmatter.title || `Story ${storyNumber.replace('STORY-', '')}`,
        status: story.status,
        progress: story.progress,
        assignee: frontmatter.assignee || null,
        dependencies: frontmatter.dependencies || [],
        last_sync: new Date().toISOString(),
        auto_sync: frontmatter.auto_sync !== false,
        completed_date: '2025-11-10T00:00:00.000Z' // Marking as completed on this date
      };

      const updatedContent = matter.stringify(content, updatedFrontmatter);
      fs.writeFileSync(filePath, updatedContent);

      console.log(`✅ Updated ${story.file}: status=${story.status}, progress=${story.progress}%`);
    } catch (error) {
      console.error(`❌ Error updating ${story.file}:`, error);
    }
  }

  console.log('\n✨ Story status fixes complete!');
}

// Run the fix
updateStoryFiles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});