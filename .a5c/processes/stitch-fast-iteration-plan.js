/**
 * @process project/stitch-fast-iteration-plan
 * @description Fast-but-traceable planning workflow for implementing the Stitch-made Konzertkirche design in the Astro repo while keeping Linear as the project-plan source of truth.
 * @inputs { prompt: string, repo: object, linear: object, stitch: object, constraints?: object, maxRefinements?: number }
 * @outputs { success: boolean, filesChanged: string[], linearSync: object, review: object }
 * @process methodologies/spec-kit/spec-kit-planning
 * @process methodologies/spec-kit/spec-kit-brownfield
 * @process methodologies/superpowers/subagent-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/web-development/react-app-development
 * @process specializations/web-development/tailwind-design-system
 * @process specializations/web-development/accessibility-audit-remediation
 * @skill frontend-create /home/zepi/.pi/agent/npm/node_modules/pi-frontend-create/skills/frontend-create/SKILL.md
 * @skill context-mode /home/zepi/.pi/agent/npm/node_modules/context-mode/skills/context-mode/SKILL.md
 * @skill ask-user /home/zepi/.pi/agent/npm/node_modules/pi-ask-user/skills/ask-user/SKILL.md
 * @agent worker builtin
 * @agent reviewer builtin
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const targetPath = (inputs) => inputs.targetPlanPath || 'docs/stitch-implementation-plan.md';

export async function process(inputs, ctx) {
  const maxRefinements = Number.isInteger(inputs.maxRefinements) ? inputs.maxRefinements : 2;
  ctx.log('Starting Stitch fast-iteration planning workflow');

  let planUpdate = await ctx.task(updatePlanTask, {
    prompt: inputs.prompt,
    repo: inputs.repo,
    linear: inputs.linear,
    stitch: inputs.stitch,
    constraints: inputs.constraints || {},
    targetPlanPath: targetPath(inputs)
  });

  let review = await ctx.task(reviewPlanTask, {
    planUpdate,
    repo: inputs.repo,
    linear: inputs.linear,
    stitch: inputs.stitch,
    targetPlanPath: targetPath(inputs)
  });

  let refinementCount = 0;
  while (review.decision === 'request_changes' && refinementCount < maxRefinements) {
    refinementCount += 1;
    planUpdate = await ctx.task(refinePlanTask, {
      prompt: inputs.prompt,
      priorPlanUpdate: planUpdate,
      review,
      repo: inputs.repo,
      linear: inputs.linear,
      stitch: inputs.stitch,
      constraints: inputs.constraints || {},
      targetPlanPath: targetPath(inputs),
      refinementCount
    });
    review = await ctx.task(reviewPlanTask, {
      planUpdate,
      repo: inputs.repo,
      linear: inputs.linear,
      stitch: inputs.stitch,
      targetPlanPath: targetPath(inputs)
    });
  }

  const diffCheck = await ctx.task(diffCheckTask, { targetPlanPath: targetPath(inputs) });

  const approval = await ctx.breakpoint({
    title: 'Approve Linear plan sync',
    question:
      'The local fast-iteration plan has been prepared and reviewed. Approve syncing the same plan summary back to Linear?',
    options: ['Approve Linear sync', 'Stop after local plan'],
    expert: 'owner',
    tags: ['approval-gate', 'linear-sync', 'planning'],
    context: {
      runId: ctx.runId,
      planPath: targetPath(inputs),
      filesChanged: planUpdate.filesChanged || [],
      review,
      diffCheck,
      linearTargets: planUpdate.linearTargets || [],
      note: 'If rejected, the run completes with the local repo plan only and no Linear mutation.'
    }
  });

  if (!approval.approved) {
    return {
      success: true,
      syncedLinear: false,
      reason: 'User chose to stop after the local plan update',
      filesChanged: planUpdate.filesChanged || [],
      review,
      diffCheck,
      refinementCount,
      metadata: { processId: 'project/stitch-fast-iteration-plan', timestamp: ctx.now() }
    };
  }

  const linearSync = await ctx.task(syncLinearTask, {
    planUpdate,
    review,
    approval,
    linear: inputs.linear,
    targetPlanPath: targetPath(inputs)
  });

  const finalSummary = await ctx.task(finalSummaryTask, {
    planUpdate,
    review,
    diffCheck,
    linearSync,
    refinementCount
  });

  return {
    success: true,
    syncedLinear: true,
    filesChanged: planUpdate.filesChanged || [],
    review,
    diffCheck,
    linearSync,
    finalSummary,
    refinementCount,
    metadata: { processId: 'project/stitch-fast-iteration-plan', timestamp: ctx.now() }
  };
}

function agentTask(id, title, name, role, task, instructions, required) {
  return defineTask(id, (args, taskCtx) => ({
    kind: 'agent',
    title,
    agent: {
      name,
      prompt: { role, task, context: args, instructions, outputFormat: 'JSON' },
      outputSchema: {
        type: 'object',
        required,
        properties: Object.fromEntries(
          required.map((key) => [
            key,
            key.endsWith('s') ||
            key.endsWith('Targets') ||
            key === 'nextActions' ||
            key === 'risks' ||
            key === 'requiredChanges' ||
            key === 'strengths' ||
            key === 'changedFiles' ||
            key === 'linearLinks' ||
            key === 'caveats' ||
            key === 'residualRisks'
              ? { type: 'array' }
              : key === 'synced'
                ? { type: 'boolean' }
                : key === 'score'
                  ? { type: 'number' }
                  : { type: 'string' }
          ])
        )
      }
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
    }
  }));
}

export const updatePlanTask = agentTask(
  'update-stitch-implementation-plan',
  'Update repo plan from Linear, repo state, and Stitch design',
  'worker',
  'senior product-minded frontend technical lead',
  'Update the repository planning artifact for implementing the Stitch-made Kieler Konzertkirche design.',
  [
    'Actually edit the repository: create or update the target plan path in Markdown.',
    'Do not modify production source code in this task; this is a planning update only.',
    'Use Linear as the project-management source of truth and explicitly map the plan to relevant Linear issues/milestones.',
    'Use Stitch project 6221185249843486689 and local stitch-exports/kieler-konzertkirche screens as the design source of truth.',
    'Define a thin vertical slice, fast design feedback loop, quality gates, milestones, acceptance criteria, risks, and Linear sync payload.',
    'Return JSON only with summary, filesChanged, planPath, linearTargets, linearDocumentTitle, linearDocumentMarkdown, issueCommentMarkdown, nextActions, risks.'
  ],
  [
    'summary',
    'filesChanged',
    'planPath',
    'linearTargets',
    'linearDocumentTitle',
    'linearDocumentMarkdown',
    'issueCommentMarkdown',
    'nextActions',
    'risks'
  ]
);

export const reviewPlanTask = agentTask(
  'review-stitch-implementation-plan',
  'Review updated implementation plan',
  'reviewer',
  'principal frontend reviewer and delivery lead',
  'Review the updated plan artifact against Linear, Stitch, and repo constraints.',
  [
    'Read the updated plan file and compare it to the supplied Linear/Stitch/repo facts.',
    'Check that the plan enables fast design iteration without losing project traceability.',
    'Check concrete ordering, Linear issue mapping, quality gates, risks, and accessibility/responsiveness coverage.',
    'Return decision=approved or decision=request_changes with specific required changes.'
  ],
  ['decision', 'summary', 'requiredChanges', 'strengths', 'risks', 'score']
);

export const refinePlanTask = agentTask(
  'refine-stitch-implementation-plan',
  'Refine implementation plan after review',
  'worker',
  'senior frontend technical lead',
  'Refine the implementation plan according to review feedback.',
  [
    'Actually edit the same target plan file.',
    'Apply every required reviewer change unless it conflicts with user/repo constraints; document residual risks.',
    'Keep this task planning-only; do not modify production source code.',
    'Return the same JSON shape as updatePlanTask with updated Linear sync payload.'
  ],
  [
    'summary',
    'filesChanged',
    'planPath',
    'linearTargets',
    'linearDocumentTitle',
    'linearDocumentMarkdown',
    'issueCommentMarkdown',
    'nextActions',
    'risks'
  ]
);

export const diffCheckTask = defineTask('plan-diff-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture plan diff and status',
  shell: {
    command: `git status --short && printf '\n--- plan diff ---\n' && git diff -- ${args.targetPlanPath}`
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['git', 'verification', 'planning']
}));

export const syncLinearTask = agentTask(
  'sync-linear-plan',
  'Sync implementation plan back to Linear',
  'worker',
  'Linear project coordinator',
  'Sync the reviewed plan to Linear using the provided payload.',
  [
    'Create or update a Linear document attached to the Website Konzerte project using linearDocumentTitle and linearDocumentMarkdown.',
    'Add a concise comment to AKG-17 with issueCommentMarkdown and link the Linear document when available.',
    'Return JSON only with synced, documentId, documentUrl, commentId, commentUrl, summary, residualRisks.',
    'Do not mutate repository source files in this task.'
  ],
  ['synced', 'summary', 'residualRisks']
);

export const finalSummaryTask = agentTask(
  'final-plan-summary',
  'Summarize completed planning update',
  'delegate',
  'delivery lead',
  'Summarize the completed planning update and next implementation steps.',
  ['Return concise JSON with summary, changedFiles, linearLinks, nextSteps, caveats.'],
  ['summary', 'changedFiles', 'linearLinks', 'nextSteps', 'caveats']
);
