# BMAD Integration Guide

## BMAD Method Overview

The **Brownfield Method Agile Development (BMAD)** framework is fully integrated into the Alkemy AI Studio V2.0 project. BMAD provides a structured approach to development that emphasizes quality, user-centric design, and technical excellence while working with existing codebases.

### BMAD Core Principles

1. **User-Centric Development**: Every feature starts with user needs and creative workflow
2. **Quality-First Approach**: Testing and validation are built into every development cycle
3. **Technical Excellence**: High standards for code quality, architecture, and performance
4. **Incremental Improvement**: Brownfield development respects existing patterns while improving them
5. **Collaborative Process**: Clear roles and responsibilities through specialized agents

## BMAD Agent System Integration

### Available Agents

The project includes 9 specialized BMAD agents, each with specific responsibilities:

```typescript
interface BMADAgent {
  id: string;
  name: string;
  title: string;
  icon: string;
  whenToUse: string;
  capabilities: string[];
  dependencies: {
    tasks: string[];
    templates: string[];
    checklists: string[];
  };
}

const BMAD_AGENTS: BMADAgent[] = [
  {
    id: 'architect',
    name: 'Winston',
    title: 'Architect',
    icon: '🏗️',
    whenToUse: 'System design, architecture documents, technology selection',
    capabilities: ['system-architecture', 'technology-selection', 'api-design'],
    dependencies: {
      tasks: ['create-doc', 'document-project', 'create-deep-research-prompt'],
      templates: ['architecture-tmpl', 'fullstack-architecture-tmpl'],
      checklists: ['architect-checklist']
    }
  },
  {
    id: 'pm',
    name: 'Project Manager',
    title: 'Project Manager',
    icon: '📋',
    whenToUse: 'Project planning, roadmap creation, stakeholder management',
    capabilities: ['project-planning', 'roadmap-management', 'stakeholder-communication'],
    dependencies: {
      tasks: ['create-next-story', 'validate-next-story', 'review-story'],
      templates: ['story-tmpl', 'epic-tmpl'],
      checklists: ['pm-checklist']
    }
  },
  {
    id: 'dev',
    name: 'Development Lead',
    title: 'Development Lead',
    icon: '💻',
    whenToUse: 'Implementation, coding, technical execution',
    capabilities: ['coding', 'technical-implementation', 'code-review'],
    dependencies: {
      tasks: ['implement-story', 'technical-decision', 'code-review'],
      templates: ['technical-spec-tmpl'],
      checklists: ['dev-checklist']
    }
  },
  {
    id: 'qa',
    name: 'Test Architect Quinn',
    title: 'Quality Assurance',
    icon: '🧪',
    whenToUse: 'Testing, quality assurance, validation',
    capabilities: ['test-design', 'quality-validation', 'risk-assessment'],
    dependencies: {
      tasks: ['test-design', 'quality-validation', 'risk-profile'],
      templates: ['test-plan-tmpl', 'qa-report-tmpl'],
      checklists: ['qa-checklist']
    }
  },
  {
    id: 'analyst',
    name: 'Business Analyst',
    title: 'Business Analyst',
    icon: '📊',
    whenToUse: 'Requirements analysis, business process mapping',
    capabilities: ['requirements-analysis', 'business-modeling', 'user-story-creation'],
    dependencies: {
      tasks: ['analyze-requirements', 'create-user-stories', 'process-mapping'],
      templates: ['requirements-tmpl', 'user-story-tmpl'],
      checklists: ['analyst-checklist']
    }
  },
  {
    id: 'po',
    name: 'Product Owner',
    title: 'Product Owner',
    icon: '🎯',
    whenToUse: 'Product strategy, feature prioritization, user stories',
    capabilities: ['product-strategy', 'feature-prioritization', 'backlog-management'],
    dependencies: {
      tasks: ['prioritize-backlog', 'acceptance-criteria', 'user-acceptance-testing'],
      templates: ['feature-spec-tmpl', 'acceptance-criteria-tmpl'],
      checklists: ['po-checklist']
    }
  },
  {
    id: 'sm',
    name: 'Scrum Master',
    title: 'Scrum Master',
    icon: '🔄',
    whenToUse: 'Sprint planning, team facilitation, process improvement',
    capabilities: ['sprint-planning', 'team-facilitation', 'process-improvement'],
    dependencies: {
      tasks: ['facilitate-sprint', 'retrospective-planning', 'process-improvement'],
      templates: ['sprint-plan-tmpl', 'retrospective-tmpl'],
      checklists: ['sm-checklist']
    }
  },
  {
    id: 'ux-expert',
    name: 'UX Expert',
    title: 'UX Expert',
    icon: '🎨',
    whenToUse: 'User experience design, interface optimization, usability testing',
    capabilities: ['ux-design', 'usability-testing', 'interface-optimization'],
    dependencies: {
      tasks: ['ux-research', 'design-systems', 'usability-testing'],
      templates: ['ux-design-tmpl', 'usability-report-tmpl'],
      checklists: ['ux-checklist']
    }
  },
  {
    id: 'bmad-master',
    name: 'BMAD Master',
    title: 'BMAD Method Master',
    icon: '🎭',
    whenToUse: 'Method guidance, quality assurance, process oversight',
    capabilities: ['method-guidance', 'quality-oversight', 'process-validation'],
    dependencies: {
      tasks: ['validate-process', 'quality-assurance', 'method-guidance'],
      templates: ['quality-report-tmpl', 'process-validation-tmpl'],
      checklists: ['master-checklist']
    }
  }
];
```

### Agent Access Through BMAD Orchestrator

The BMAD Orchestrator provides unified access to all agents through a command interface:

```bash
# Access agents through slash commands
/BMad:agents:architect      # Transform into Architect (Winston)
/BMad:agents:pm             # Transform into Project Manager
/BMad:agents:dev            # Transform into Development Lead
/BMad:agents:qa             # Transform into Quality Assurance (Quinn)
/BMad:agents:analyst        # Transform into Business Analyst
/BMad:agents:po             # Transform into Product Owner
/BMad:agents:sm             # Transform into Scrum Master
/BMad:agents:ux-expert      # Transform into UX Expert
/BMad:agents:bmad-orchestrator # Master orchestrator for coordination
```

## BMAD Workflow Integration

### Development Workflow with BMAD

The Alkemy AI Studio integrates BMAD workflow into the development process:

```typescript
// BMAD Workflow State Management
interface BMADWorkflowState {
  currentAgent: BMADAgent | null;
  activeTask: BMADTask | null;
  workflowPhase: 'planning' | 'development' | 'validation' | 'completion';
  taskHistory: BMADTask[];
  qualityGates: QualityGate[];
  artifacts: WorkflowArtifact[];
}

class BMADWorkflowManager {
  private state: BMADWorkflowState;
  private orchestrator: BMADOrchestrator;

  constructor(orchestrator: BMADOrchestrator) {
    this.orchestrator = orchestrator;
    this.state = this.initializeState();
  }

  // Start a new development workflow
  async startWorkflow(requirements: ProjectRequirements): Promise<void> {
    // Phase 1: Planning with PM and Analyst
    await this.executePhase('planning', async () => {
      const analystResult = await this.orchestrator.transformTo('analyst')
        .executeTask('analyze-requirements', { requirements });

      const pmResult = await this.orchestrator.transformTo('pm')
        .executeTask('create-project-plan', { analysis: analystResult });

      return { analysis: analystResult, plan: pmResult };
    });

    // Phase 2: Architecture with Architect
    await this.executePhase('architecture', async () => {
      const architectResult = await this.orchestrator.transformTo('architect')
        .executeTask('create-system-architecture', {
          requirements,
          projectPlan: this.state.taskHistory.find(t => t.agentId === 'pm')
        });

      return architectResult;
    });

    // Phase 3: Development with Dev
    await this.executePhase('development', async () => {
      const devResult = await this.orchestrator.transformTo('dev')
        .executeTask('implement-features', {
          architecture: this.state.taskHistory.find(t => t.agentId === 'architect')
        });

      return devResult;
    });

    // Phase 4: Quality Validation with QA
    await this.executePhase('validation', async () => {
      const qaResult = await this.orchestrator.transformTo('qa')
        .executeTask('validate-quality', {
          implementation: this.state.taskHistory.find(t => t.agentId === 'dev')
        });

      return qaResult;
    });
  }

  private async executePhase(
    phaseName: string,
    phaseExecutor: () => Promise<any>
  ): Promise<void> {
    this.state.workflowPhase = phaseName as any;

    try {
      const result = await phaseExecutor();

      // Record successful phase completion
      this.state.taskHistory.push({
        id: generateId(),
        phase: phaseName,
        status: 'completed',
        result,
        timestamp: new Date()
      });

    } catch (error) {
      // Record phase failure
      this.state.taskHistory.push({
        id: generateId(),
        phase: phaseName,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }
}
```

### Story Development with BMAD

Each feature follows BMAD story development process:

```typescript
// BMAD Story Development Template
class BMADStoryDevelopment {
  async developStory(storyId: string): Promise<StoryResult> {
    const workflow = new BMADWorkflowManager();

    // Step 1: Story Analysis (Analyst)
    const storyAnalysis = await workflow.withAgent('analyst', async (agent) => {
      return agent.executeTask('analyze-story', { storyId });
    });

    // Step 2: Acceptance Criteria (Product Owner)
    const acceptanceCriteria = await workflow.withAgent('po', async (agent) => {
      return agent.executeTask('define-acceptance-criteria', {
        storyId,
        analysis: storyAnalysis
      });
    });

    // Step 3: Technical Design (Architect)
    const technicalDesign = await workflow.withAgent('architect', async (agent) => {
      return agent.executeTask('design-technical-approach', {
        storyId,
        criteria: acceptanceCriteria
      });
    });

    // Step 4: Test Planning (QA)
    const testPlan = await workflow.withAgent('qa', async (agent) => {
      return agent.executeTask('design-tests', {
        storyId,
        technicalDesign,
        acceptanceCriteria
      });
    });

    // Step 5: Implementation (Dev)
    const implementation = await workflow.withAgent('dev', async (agent) => {
      return agent.executeTask('implement-story', {
        storyId,
        technicalDesign,
        testPlan
      });
    });

    // Step 6: Validation (QA + UX Expert)
    const validation = await workflow.withAgent('qa', async (agent) => {
      return agent.executeTask('validate-implementation', {
        storyId,
        implementation,
        testPlan
      });
    });

    const uxValidation = await workflow.withAgent('ux-expert', async (agent) => {
      return agent.executeTask('validate-user-experience', {
        storyId,
        implementation
      });
    });

    return {
      storyId,
      analysis: storyAnalysis,
      criteria: acceptanceCriteria,
      design: technicalDesign,
      implementation,
      validation: {
        quality: validation,
        ux: uxValidation
      },
      status: 'completed'
    };
  }
}
```

## BMAD Tasks and Templates Integration

### Task System Integration

BMAD tasks are integrated into the development workflow:

```typescript
// BMAD Task Execution Framework
class BMADTaskExecutor {
  private taskRegistry: Map<string, BMADTask> = new Map();

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks(): void {
    // Register all BMAD tasks
    this.registerTask('create-doc', new CreateDocumentTask());
    this.registerTask('analyze-story', new AnalyzeStoryTask());
    this.registerTask('create-next-story', new CreateNextStoryTask());
    this.registerTask('review-story', new ReviewStoryTask());
    this.registerTask('test-design', new TestDesignTask());
    this.registerTask('validate-next-story', new ValidateNextStoryTask());
    this.registerTask('document-project', new DocumentProjectTask());
    this.registerTask('execute-checklist', new ExecuteChecklistTask());
  }

  async executeTask(taskId: string, context: TaskContext): Promise<TaskResult> {
    const task = this.taskRegistry.get(taskId);
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }

    // Validate task prerequisites
    await this.validatePrerequisites(task, context);

    // Execute task with progress tracking
    return this.executeWithProgress(task, context);
  }

  private async executeWithProgress(
    task: BMADTask,
    context: TaskContext
  ): Promise<TaskResult> {
    const progressTracker = new ProgressTracker();

    try {
      // Execute task
      const result = await task.execute(context, (progress) => {
        progressTracker.update(task.id, progress);
      });

      // Log successful execution
      this.logTaskExecution(task.id, context, result, 'success');

      return result;

    } catch (error) {
      // Log failed execution
      this.logTaskExecution(task.id, context, null, 'failed', error);
      throw error;
    }
  }
}
```

### Template Integration

BMAD templates provide consistency across documentation and artifacts:

```typescript
// BMAD Template System
class BMADTemplateManager {
  private templates: Map<string, BMADTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Architecture templates
    this.registerTemplate('architecture-tmpl', new ArchitectureTemplate());
    this.registerTemplate('fullstack-architecture-tmpl', new FullStackArchitectureTemplate());
    this.registerTemplate('brownfield-architecture-tmpl', new BrownfieldArchitectureTemplate());

    // Story templates
    this.registerTemplate('story-tmpl', new StoryTemplate());
    this.registerTemplate('epic-tmpl', new EpicTemplate());

    // Test templates
    this.registerTemplate('test-plan-tmpl', new TestPlanTemplate());
    this.registerTemplate('qa-report-tmpl', new QAReportTemplate());
  }

  async generateTemplate(
    templateId: string,
    data: TemplateData
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    // Validate template data
    await this.validateTemplateData(template, data);

    // Generate content
    return template.generate(data);
  }

  async generateAndSaveTemplate(
    templateId: string,
    data: TemplateData,
    outputPath: string
  ): Promise<void> {
    const content = await this.generateTemplate(templateId, data);

    // Save to file system
    await fs.writeFile(outputPath, content);

    // Log template generation
    this.logTemplateGeneration(templateId, outputPath, data);
  }
}
```

## Quality Gates Integration

### BMAD Quality Gates

Quality gates are integrated throughout the development process:

```typescript
// BMAD Quality Gate System
class BMADQualityGateManager {
  private qualityGates: Map<string, QualityGate> = new Map();

  constructor() {
    this.initializeQualityGates();
  }

  private initializeQualityGates(): void {
    // Story Quality Gate
    this.registerQualityGate('story-quality', new StoryQualityGate());

    // Architecture Quality Gate
    this.registerQualityGate('architecture-quality', new ArchitectureQualityGate());

    // Implementation Quality Gate
    this.registerQualityGate('implementation-quality', new ImplementationQualityGate());

    // User Experience Quality Gate
    this.registerQualityGate('ux-quality', new UXQualityGate());
  }

  async validateQualityGate(
    gateId: string,
    context: QualityContext
  ): Promise<QualityResult> {
    const gate = this.qualityGates.get(gateId);
    if (!gate) {
      throw new Error(`Unknown quality gate: ${gateId}`);
    }

    try {
      const result = await gate.validate(context);

      // Record quality gate result
      await this.recordQualityGateResult(gateId, context, result);

      return result;

    } catch (error) {
      const failureResult: QualityResult = {
        passed: false,
        issues: [`Quality gate validation failed: ${error.message}`],
        recommendations: ['Review quality gate requirements and try again'],
        score: 0
      };

      await this.recordQualityGateResult(gateId, context, failureResult);

      return failureResult;
    }
  }

  // Example: Story Quality Gate Implementation
  private createStoryQualityGate(): QualityGate {
    return {
      id: 'story-quality',
      name: 'Story Quality Gate',
      criteria: [
        {
          id: 'completeness',
          name: 'Story Completeness',
          description: 'Story must have complete user story format',
          validator: (context) => this.validateStoryCompleteness(context)
        },
        {
          id: 'acceptance-criteria',
          name: 'Acceptance Criteria',
          description: 'Story must have clear acceptance criteria',
          validator: (context) => this.validateAcceptanceCriteria(context)
        },
        {
          id: 'technical-feasibility',
          name: 'Technical Feasibility',
          description: 'Story must be technically feasible',
          validator: (context) => this.validateTechnicalFeasibility(context)
        }
      ]
    };
  }
}
```

## BMAD Configuration Integration

### Technical Preferences Implementation

BMAD technical preferences are integrated into the project configuration:

```typescript
// BMAD Technical Preferences
interface BMADTechnicalPreferences {
  codeQuality: {
    typescript: {
      strictMode: boolean;
      noImplicitAny: boolean;
      strictNullChecks: boolean;
    };
    testing: {
      coverageThreshold: number;
      testPatterns: string[];
      testFrameworks: string[];
    };
  };
  architecture: {
    componentPatterns: ComponentPattern[];
    servicePatterns: ServicePattern[];
    namingConventions: NamingConvention[];
  };
  performance: {
    bundleSizeLimit: number;
    loadTimeTarget: number;
    imageOptimization: boolean;
  };
  security: {
    encryptionLevel: 'AES-256-GCM';
    authenticationRequired: boolean;
    apiRateLimiting: boolean;
  };
}

class BMADTechnicalManager {
  private preferences: BMADTechnicalPreferences;

  constructor(preferences: BMADTechnicalPreferences) {
    this.preferences = preferences;
  }

  // Validate code against BMAD preferences
  validateCodeQuality(filePath: string, content: string): CodeQualityResult {
    const issues: CodeQualityIssue[] = [];

    // TypeScript validation
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      issues.push(...this.validateTypeScript(filePath, content));
    }

    // Testing validation
    issues.push(...this.validateTesting(filePath, content));

    // Architecture validation
    issues.push(...this.validateArchitecture(filePath, content));

    return {
      filePath,
      passed: issues.length === 0,
      issues,
      score: this.calculateQualityScore(issues)
    };
  }

  private validateTypeScript(filePath: string, content: string): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    if (this.preferences.codeQuality.typescript.strictMode) {
      // Check for any type usage
      if (content.includes(': any') || content.includes('as any')) {
        issues.push({
          type: 'typescript',
          severity: 'error',
          message: 'Use of "any" type is not allowed in strict mode',
          line: this.findLineNumber(content, ': any') || 0
        });
      }
    }

    return issues;
  }

  private validateArchitecture(filePath: string, content: string): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    // Validate component patterns
    this.preferences.architecture.componentPatterns.forEach(pattern => {
      if (!pattern.validator(content)) {
        issues.push({
          type: 'architecture',
          severity: 'warning',
          message: `Component does not follow ${pattern.name} pattern`,
          line: 0
        });
      }
    });

    return issues;
  }
}
```

## BMAD Integration in Development Tools

### IDE Integration

BMAD is integrated into development tools and workflows:

```typescript
// BMAD IDE Integration
class BMADIDEIntegration {
  private bmadManager: BMADWorkflowManager;
  private qualityManager: BMADQualityGateManager;

  constructor() {
    this.bmadManager = new BMADWorkflowManager();
    this.qualityManager = new BMADQualityGateManager();
  }

  // VS Code extension integration
  async createVSCodeExtension(): Promise<void> {
    // Register BMAD commands
    vscode.commands.registerCommand('bmad.startWorkflow', async () => {
      await this.startBMADWorkflow();
    });

    vscode.commands.registerCommand('bmad.validateQuality', async () => {
      await this.validateCurrentFileQuality();
    });

    vscode.commands.registerCommand('bmad.createStory', async () => {
      await this.createNewStory();
    });

    // Register BMAD diagnostics
    this.setupBMADDiagnostics();
  }

  private async validateCurrentFileQuality(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const filePath = editor.document.fileName;
    const content = editor.document.getText();

    const qualityResult = await this.qualityManager.validateQualityGate(
      'implementation-quality',
      { filePath, content }
    );

    // Show quality results
    this.showQualityResults(qualityResult);
  }

  private setupBMADDiagnostics(): void {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('bmad');

    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const diagnostics: vscode.Diagnostic[] = [];

      // Validate changes against BMAD preferences
      event.contentChanges.forEach(change => {
        const issues = this.validateChangeAgainstBMAD(change);
        issues.forEach(issue => {
          diagnostics.push(this.createDiagnostic(issue, event.document));
        });
      });

      diagnosticCollection.set(event.document.uri, diagnostics);
    });
  }
}
```

### CLI Integration

BMAD commands are available through CLI:

```bash
# BMAD CLI Commands
npm run bmad:start-workflow     # Start new BMAD workflow
npm run bmad:validate-story    # Validate story against BMAD criteria
npm run bmad:quality-check     # Run quality gate validation
npm run bmad:create-document   # Create BMAD-compliant document
npm run bmad:review-code       # Review code with BMAD standards
npm run bmad:test-coverage     # Validate test coverage
npm run bmad:architecture-check # Validate architecture patterns
```

## BMAD Analytics and Reporting

### BMAD Metrics Tracking

```typescript
// BMAD Analytics System
class BMADAnalytics {
  private metrics: Map<string, BMADMetric[]> = new Map();

  async trackBMADActivity(
    activity: BMADActivity
  ): Promise<void> {
    const metric: BMADMetric = {
      id: generateId(),
      timestamp: new Date(),
      agentId: activity.agentId,
      taskId: activity.taskId,
      duration: activity.duration,
      success: activity.success,
      qualityScore: activity.qualityScore
    };

    // Store metric
    const agentMetrics = this.metrics.get(activity.agentId) || [];
    agentMetrics.push(metric);
    this.metrics.set(activity.agentId, agentMetrics);

    // Generate insights
    await this.generateInsights(activity);
  }

  async generateBMADReport(): Promise<BMADReport> {
    const report: BMADReport = {
      period: this.getReportPeriod(),
      agentPerformance: await this.calculateAgentPerformance(),
      qualityMetrics: await this.calculateQualityMetrics(),
      workflowEfficiency: await this.calculateWorkflowEfficiency(),
      recommendations: await this.generateRecommendations()
    };

    return report;
  }

  private async calculateAgentPerformance(): Promise<AgentPerformance[]> {
    const performance: AgentPerformance[] = [];

    this.metrics.forEach((metrics, agentId) => {
      const agentPerformance: AgentPerformance = {
        agentId,
        totalTasks: metrics.length,
        successRate: metrics.filter(m => m.success).length / metrics.length,
        averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        averageQualityScore: metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length
      };

      performance.push(agentPerformance);
    });

    return performance;
  }
}
```

## Best Practices for BMAD Integration

### Development Workflow Best Practices

1. **Always Start with User Stories**
   - Use BMAD analyst to analyze requirements
   - Create clear acceptance criteria with Product Owner
   - Validate technical feasibility with Architect

2. **Quality Gates at Every Stage**
   - Story quality gate before development
   - Architecture quality gate before implementation
   - Implementation quality gate before deployment

3. **Continuous Validation**
   - Run BMAD validation in CI/CD pipeline
   - Automated quality checks in IDE
   - Regular BMAD retrospectives

4. **Documentation Standards**
   - Use BMAD templates for consistency
   - Maintain living documentation
   - Cross-reference between artifacts

5. **Agent Collaboration**
   - Clear handoffs between agents
   - Document agent decisions
   - Regular agent retrospectives

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [Frontend Guide](./frontend-guide.md), [Backend Guide](./backend-guide.md), [Quality Gates](../5-quality/quality-gates.md)
**Next Review**: 2025-12-19