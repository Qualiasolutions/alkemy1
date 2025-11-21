# Project Management Features Documentation

## Overview

This document describes the enhanced project management features added to Alkemy AI Studio, including soft delete, templates, activity logging, and bulk operations. These features provide users with professional project organization capabilities while maintaining data safety and recovery options.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Service Layer](#service-layer)
3. [UI Components](#ui-components)
4. [Feature Usage](#feature-usage)
5. [Migration Guide](#migration-guide)
6. [API Reference](#api-reference)

## Database Schema

### Enhanced Projects Table

The `projects` table has been extended with the following columns:

```sql
-- Soft Delete
deleted_at timestamptz DEFAULT NULL
permanently_delete_at timestamptz DEFAULT NULL

-- Enhanced Metadata
description text DEFAULT ''
tags text[] DEFAULT '{}'
parent_project_id uuid REFERENCES projects(id)
is_template boolean DEFAULT false
template_category text DEFAULT NULL
```

### New Tables

#### project_templates
Stores reusable project templates including system-provided and user-created templates.

```sql
CREATE TABLE project_templates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text, -- 'documentary', 'narrative', 'commercial', etc.
  script_content text,
  script_analysis jsonb,
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  usage_count int DEFAULT 0,
  rating float DEFAULT 0.0
)
```

#### project_activity_log
Tracks all project-related actions for audit and history purposes.

```sql
CREATE TABLE project_activity_log (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  user_id uuid REFERENCES auth.users(id),
  action text, -- 'created', 'updated', 'deleted', 'restored', etc.
  details jsonb,
  created_at timestamptz DEFAULT now()
)
```

## Service Layer

### ProjectService Interface

The enhanced `projectService.ts` provides comprehensive project management capabilities:

```typescript
// Import the service
import { getProjectService } from '@/services/projectService';

const projectService = getProjectService();
```

### Key Methods

#### Soft Delete Operations

```typescript
// Move project to trash (30-day retention)
await projectService.softDeleteProject(projectId);

// Restore from trash
await projectService.restoreProject(projectId);

// Permanently delete
await projectService.permanentlyDeleteProject(projectId);

// Get all deleted projects
const { projects } = await projectService.getDeletedProjects(userId);

// Empty entire trash
await projectService.emptyTrash(userId);
```

#### Template Operations

```typescript
// Get all templates (system + user)
const { templates } = await projectService.getTemplates(includeSystem);

// Create template from existing project
const { template } = await projectService.createTemplate(
  project,
  'My Template',
  'documentary',
  'Template for documentary projects'
);

// Create project from template
const { project } = await projectService.createProjectFromTemplate(
  templateId,
  'New Project Name',
  'Optional description'
);
```

#### Bulk Operations

```typescript
// Bulk delete multiple projects
await projectService.bulkDeleteProjects([id1, id2, id3]);

// Bulk restore
await projectService.bulkRestoreProjects([id1, id2, id3]);

// Bulk export
const { data } = await projectService.bulkExportProjects([id1, id2, id3]);
```

#### Search and Filter

```typescript
// Advanced filtering
const { projects } = await projectService.getProjects(userId, {
  includeDeleted: false,
  onlyDeleted: false,
  tags: ['documentary', 'interview'],
  searchTerm: 'climate',
  sortBy: 'updated',
  sortOrder: 'desc',
  limit: 50,
  offset: 0
});

// Search projects
const { projects } = await projectService.searchProjects(userId, 'search term');

// Get projects by tags
const { projects } = await projectService.getProjectsByTag(userId, ['tag1', 'tag2']);
```

## UI Components

### SaveProjectDialog

A modal dialog for saving project details with metadata.

```tsx
import SaveProjectDialog from '@/components/SaveProjectDialog';

<SaveProjectDialog
  isOpen={showSaveDialog}
  onClose={() => setShowSaveDialog(false)}
  project={currentProject}
  mode="save" // or "save-as"
  onSave={(project) => {
    // Handle saved project
  }}
/>
```

**Features:**
- Edit project name and description
- Add/remove tags
- Save vs Save As modes
- Validation and error handling
- Success feedback

### DeleteConfirmationDialog

A confirmation dialog with safety features for project deletion.

```tsx
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

<DeleteConfirmationDialog
  isOpen={showDeleteDialog}
  onClose={() => setShowDeleteDialog(false)}
  projects={projectsToDelete}
  onDelete={(projectIds, permanent) => {
    // Handle deletion complete
  }}
  mode="soft" // "soft" | "permanent" | "empty-trash"
/>
```

**Features:**
- Soft delete with 30-day retention
- Permanent delete with confirmation
- Bulk delete support
- Safety confirmation for permanent actions
- Visual warnings and status indicators

### ProjectSelectorModalEnhanced

Enhanced project selector with trash and template management.

```tsx
import ProjectSelectorModalEnhanced from '@/components/ProjectSelectorModalEnhanced';

<ProjectSelectorModalEnhanced
  isOpen={showProjectSelector}
  onClose={() => setShowProjectSelector(false)}
  onSelectProject={(project) => {
    // Load selected project
  }}
  onCreateProject={() => {
    // Create new project
  }}
  currentProjectId={currentProject?.id}
/>
```

**Features:**
- Three tabs: Projects, Trash, Templates
- Grid and list view modes
- Bulk selection and operations
- Search and filtering
- Sort options
- Restore deleted projects
- Create from templates
- Export projects

## Feature Usage

### Soft Delete Workflow

1. **Delete Project**: Projects are moved to trash, not deleted immediately
2. **30-Day Retention**: Deleted projects remain recoverable for 30 days
3. **Restore**: Restore any project from trash within retention period
4. **Auto-cleanup**: Projects are permanently deleted after 30 days
5. **Manual Permanent Delete**: Force immediate permanent deletion if needed

### Template System

1. **System Templates**: 5 pre-configured templates for common project types
   - Documentary Template
   - Short Film Template
   - Commercial Template
   - Music Video Template
   - Animation Template

2. **Create Custom Templates**: Save any project as a reusable template
3. **Template Categories**: Organize templates by project type
4. **Usage Tracking**: See which templates are most popular
5. **Rating System**: Rate templates for quality feedback

### Activity Logging

All major actions are logged automatically:
- Project creation, updates, deletion
- Template creation and usage
- Import/export operations
- Manual saves vs auto-saves
- Restoration from trash

## Migration Guide

### Apply Database Migration

```bash
# Check migration status
npm run supabase:db status

# Apply the migration
npm run supabase:db push

# Or directly with Supabase CLI
supabase db push --db-url "postgresql://..."
```

The migration file `20251120000001_project_management_enhancements.sql` includes:
- Schema changes
- SQL functions
- RLS policies
- System template seeds
- Indexes for performance

### Update Existing Code

1. **Replace ProjectSelectorModal**:
```tsx
// Old
import ProjectSelectorModal from '@/components/ProjectSelectorModal';

// New (with enhanced features)
import ProjectSelectorModalEnhanced from '@/components/ProjectSelectorModalEnhanced';
```

2. **Add Save/Delete Buttons**:
```tsx
// In your app header or project controls
<Button onClick={() => setShowSaveDialog(true)}>
  <Save className="w-4 h-4 mr-2" />
  Save
</Button>

<Button onClick={() => setShowDeleteDialog(true)} variant="outline">
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</Button>
```

3. **Handle Project Metadata**:
```tsx
// When creating projects
const { project } = await projectService.createProject(
  userId,
  'Project Title',
  'Optional description'
);

// Update metadata
await projectService.updateProjectMetadata(projectId, {
  description: 'Updated description',
  tags: ['tag1', 'tag2']
});
```

## API Reference

### Types

```typescript
interface Project {
  // Existing fields...
  description?: string;
  tags?: string[];
  deleted_at?: string | null;
  permanently_delete_at?: string | null;
  parent_project_id?: string | null;
  is_template?: boolean;
  template_category?: string | null;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isSystem: boolean;
  usageCount: number;
  rating: number;
}

interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  details: any;
  createdAt: string;
}

interface ProjectFilter {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'name' | 'updated' | 'created' | 'accessed';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

### Error Handling

All service methods return a consistent error structure:

```typescript
const { project, error } = await projectService.someMethod();

if (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
}
```

### Performance Considerations

1. **Indexed Queries**: All frequently queried columns have indexes
2. **Soft Delete Performance**: Deleted projects are excluded by default from queries
3. **Batch Operations**: Use bulk methods for multiple operations
4. **Pagination**: Use limit/offset for large project lists
5. **Lazy Loading**: Project content is loaded on-demand, not in list views

## Security

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only see their own projects
- Deleted projects are hidden unless explicitly requested
- Templates respect ownership and system flags
- Activity logs are read-only for users

### Permissions

```sql
-- Users can:
- View their own projects and activity
- Create, update, delete their own projects
- Create custom templates
- View system templates
- Restore their deleted projects

-- Users cannot:
- Access other users' projects
- Modify system templates
- View other users' activity logs
- Bypass the 30-day retention for soft deletes
```

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Ensure Supabase is configured correctly
   - Check for existing tables/columns
   - Verify user permissions

2. **Projects Not Appearing in Trash**
   - Check if `deleted_at` is set
   - Ensure RLS policies are correct
   - Verify user authentication

3. **Templates Not Loading**
   - Check if system templates were seeded
   - Verify `project_templates` table exists
   - Check RLS policies for templates

4. **Bulk Operations Timeout**
   - Reduce batch size
   - Use pagination for large datasets
   - Consider background processing for huge operations

## Future Enhancements

Planned features for Phase 2 and 3:

1. **Version Control**
   - Project snapshots
   - Rollback capabilities
   - Diff viewer

2. **Collaboration**
   - Share projects with team members
   - Real-time collaboration
   - Comments and annotations

3. **Advanced Templates**
   - Template marketplace
   - Premium templates
   - Template versioning

4. **Enhanced Activity Log**
   - Visual timeline
   - Undo/redo from activity log
   - Export activity reports

---

**Last Updated**: November 20, 2024
**Version**: 1.0.0
**Status**: Phase 1 Complete