---
description: 'Execute complete epic lifecycle: tech spec → all stories (create → context → develop → review → commit) → create PR for epic → retrospective. Fully automated epic orchestration with context isolation.'
---

# orchestrate-epic

**EXECUTION CONTEXT**: This slash command is executed by the **main assistant**, not a subagent. You have full access to all tools including Task, Bash, Read, Edit, etc.

You are the **BMAD Epic Orchestrator**. Execute the complete epic lifecycle workflow: tech spec generation + all stories in sequence with strict context isolation.

## Mission

Execute the complete BMAD epic workflow:
1. **Create Epic Branch**: Create a feature branch for all epic work
2. **Epic Tech Spec** (if needed): Generate technical specification for the epic
3. **All Stories**: Execute complete story workflow for every story in the epic
4. **Create Epic PR**: Create a single PR for the entire epic after all stories complete
5. **Retrospective** (optional): Offer to run epic retrospective after completion

Each workflow step MUST run in complete isolation - no shared context between workflow invocations.

## Context Isolation Architecture

**CRITICAL**: All workflow executions (tech spec, story workflows) MUST use Task tool for context isolation:
- You (main assistant) invoke Task tool to launch general-purpose subagent
- Each subagent runs one workflow in complete isolation
- Subagent reads all inputs from disk (story files, context files, code files)
- Subagent writes all outputs to disk (updated files, new files)
- Subagent fully exits and context is destroyed
- Next workflow reads fresh state from disk - no memory inheritance

**Why**: This ensures each workflow reads the latest state from files and prevents context pollution.

## Pre-Flight Check: Epic Identification

**EXECUTE FIRST - BEFORE ANY OTHER STEPS:**

1. Read `docs/sprint-status.yaml` to analyze epic/story status
2. Find the first epic that has at least one story in "backlog" status
3. Extract epic number (e.g., "3-1-...", "3-2-..." → Epic 3)
4. Determine if epic needs tech context:
   - If epic status = "backlog" → needs tech spec (Epic Step 2)
   - If epic status = "contexted" → skip to story execution
5. Count total stories in this epic that need execution (status: backlog, drafted, ready-for-dev, in-progress, review)
6. Report epic details to user:
   - Epic number
   - Epic status
   - Total stories to execute
   - Whether tech spec is needed

**Report Example:**
```
🎯 Epic Orchestration Plan

Epic: Epic 3 (User Interface & Interaction Layer)
Status: contexted (tech spec exists)
Stories to execute: 8 stories (3-2 through 3-9)
Tech spec needed: No
Branch: epic/03-user-interface-layer

Ready to proceed?
```

**User Confirmation**: Ask user if they want to proceed with the epic orchestration.

---

## Epic Step 1: Create Epic Branch

**Execute FIRST before any other work:**

```bash
# Verify clean working tree
git status --porcelain
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree not clean. Commit or stash changes first."
  exit 1
fi

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create epic branch (format: epic/NN-short-description)
# Example: epic/00-project-scaffolding, epic/03-user-interface
git checkout -b epic/[NN]-[short-description]

# Verify branch created
git branch --show-current
```

**Report**: "✅ Epic Step 1: Created epic branch epic/[NN]-[short-description]"

---

## Epic Step 2: Epic Tech Context (Conditional)

**Only execute if epic status = "backlog"**

```
Task(subagent_type="general-purpose",
     prompt="Execute the epic-tech-context workflow for Epic [N].
             Load bmad/core/tasks/workflow.xml and execute with
             workflow-config: bmad/bmm/workflows/3-epic-planning/epic-tech-context/workflow.yaml
             Generate comprehensive technical specification for the epic.
             Update sprint-status.yaml to mark epic as 'contexted'.")
```

**Wait**: Confirm subagent fully exited

**Verify**:
- Check `docs/epics/epic-[N]-tech-spec.md` exists
- Epic status = "contexted" in sprint-status.yaml

**Commit tech spec to epic branch:**
```bash
git add -A
git commit -m "docs: add Epic [N] tech specification

Generated technical specification for Epic [N]: [Title]

- Architecture decisions documented
- Story breakdown included
- Technical dependencies identified"
```

**Report**: "✅ Epic Step 2: Epic tech spec created and committed"

---

## Story Execution Loop

**For each story in the epic (in sequential order):**

### Story Identification
- Read `docs/sprint-status.yaml` fresh from disk
- Find next story in epic with status: "backlog", "drafted", "ready-for-dev", "in-progress", or "review"
- If no stories need execution, exit loop → proceed to Epic PR Creation
- Extract story ID (e.g., "3-2-create-location-input-field-with-validation")

### Story Pre-Flight Check
- If story status = "done", skip to next story
- Report: "📝 Starting Story [X.Y]: [Title]"

---

### Story Step 1: Create Story File

**Execute with Context Isolation**:
```
Task(subagent_type="general-purpose",
     prompt="Execute the create-story workflow for story [X.Y].
             Load bmad/core/tasks/workflow.xml and execute with
             workflow-config: bmad/bmm/workflows/4-implementation/create-story/workflow.yaml
             Create story file at docs/stories/[story-file].md with all required sections.
             Update sprint-status.yaml to mark story as 'drafted'.")
```

**Wait**: Confirm subagent fully exited

**Verify**:
- Check `docs/stories/[story-file].md` exists
- Story status = "drafted" in sprint-status.yaml

**Report**: "✅ Story [X.Y] Step 1: Story file created"

---

### Story Step 2: Generate Story Context

**Execute with Context Isolation**:
```
Task(subagent_type="general-purpose",
     prompt="Execute the story-context workflow for story [X.Y].
             Load bmad/core/tasks/workflow.xml and execute with
             workflow-config: bmad/bmm/workflows/4-implementation/story-context/workflow.yaml
             Read story file and generate context.xml with all relevant project context.
             Update sprint-status.yaml to mark story as 'ready-for-dev'.")
```

**Wait**: Confirm subagent fully exited

**Verify**:
- Check `docs/stories/[story-file].context.xml` exists
- Story status = "ready-for-dev"

**Report**: "✅ Story [X.Y] Step 2: Context file generated"

---

### Story Step 3: Develop Story (with Retry Loop)

**Execute with Context Isolation**:
```
Task(subagent_type="general-purpose",
     prompt="Execute the dev-story workflow for story [X.Y].
             Load bmad/core/tasks/workflow.xml and execute with
             workflow-config: bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml
             Read story file and context.xml, implement required changes.
             Update story file with implementation details.
             Update sprint-status.yaml to 'in-progress' then 'review'.")
```

**Wait**: Confirm subagent fully exited

**Verify**:
- Implementation files modified
- Story file updated with development section
- Story status = "review"

**Report**: "✅ Story [X.Y] Step 3: Story implementation complete"

---

### Story Step 4: Code Review (with Auto-Retry)

**Execute with Context Isolation**:
```
Task(subagent_type="general-purpose",
     prompt="Execute the code-review workflow for story [X.Y].
             Load bmad/core/tasks/workflow.xml and execute with
             workflow-config: bmad/bmm/workflows/4-implementation/code-review/workflow.yaml
             Read story file and implementation changes.
             Perform comprehensive senior developer review.
             Append review section to story file with outcome: APPROVE / Changes Requested / Blocked.")
```

**Wait**: Confirm subagent fully exited

**Verify**:
- Story file contains "Senior Developer Review" section
- Parse review outcome from file

**Auto-Retry Logic** (max 3 attempts):
- If outcome = "Changes Requested" or "Blocked":
  - Retry counter < 3: Re-run Story Step 3 (with retry context) → Story Step 4
  - Retry counter ≥ 3: STOP, report manual intervention needed
- If outcome = "APPROVE": Continue to Story Step 5

**Report**: "✅ Story [X.Y] Step 4: Code review complete - [outcome]"

---

### Story Step 5: Update Story File Status to Done

**Only if review = APPROVE:**

**CRITICAL**: This step fixes the bug where story files remain at "Status: review" even after approval.

**Execute directly using Edit tool (not via Task):**

```
1. Read the story file: docs/stories/[story-file].md
2. Use Edit tool to update the Status line:
   old_string: "Status: review"
   new_string: "Status: done"
3. Verify the change was made successfully
```

**Verify**:
- Story file now shows "Status: done" (typically around line 3-5)
- Read the file again to confirm if needed

**Report**: "✅ Story [X.Y] Step 5: Story file status updated to done"

---

### Story Step 6: Commit Story Changes

**Only if review = APPROVE:**

```bash
# Stage all changes for this story
git add -A

# Create comprehensive commit message
git commit -m "feat(story-XY): [Story Title]

Implementation:
- [Key changes from story file]
- [Components/files created or modified]

Code Review: APPROVED
Acceptance Criteria: All met

Story: docs/stories/[story-file].md"
```

**Report**: "✅ Story [X.Y] Step 6: Changes committed to epic branch"

---

### Story Step 7: Clean Up Background Processes

**Execute regardless of approval status:**

```bash
# Kill all background processes for clean slate
# Use KillShell tool for any running background bash processes
```

**Report**: "✅ Story [X.Y] Step 7: Background processes cleaned - Ready for next story"

---

### End of Story Loop

After completing all steps for a story:
- Report story completion
- Update progress counter (e.g., "Story 2 of 8 complete")
- Loop back to Story Identification to process next story

---

## Post-Story Loop: Update Documentation and Create Pull Request

**After ALL stories are complete, update documentation and create a single PR for the entire epic:**

### Epic Step 3: Update README.md

**Update the project README with epic accomplishments before creating PR:**

1. **Read current README.md** to understand its structure

2. **Identify sections to update:**
   - "Current Development Status" or similar progress section
   - Feature highlights if significant features were added
   - Any API/usage documentation if public interfaces changed

3. **Generate README updates based on:**
   - Stories completed in this epic (from story files)
   - Key features implemented
   - Status progression (mark epic as complete, update percentages)
   - Any new capabilities or modules added

4. **Apply updates using Edit tool:**
   ```
   - Update epic status from "In Progress" to "Complete"
   - Add summary of key features delivered
   - Update story/feature counts
   - Add any new documentation links
   ```

**Example status update:**
```markdown
### Epic [NN]: [Title]
- **Status:** ✅ Complete
- **Stories:** [X]/[X] completed
- **Key Features:**
  - [Feature 1 from stories]
  - [Feature 2 from stories]
  - [Feature 3 from stories]
```

**Report**: "✅ Epic Step 3: README.md updated with epic accomplishments"

---

### Epic Step 4: Push Epic Branch

```bash
# Verify all changes are committed
git status --porcelain
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Uncommitted changes found. Committing..."
  git add -A
  git commit -m "chore: cleanup before PR"
fi

# Push epic branch to remote
git push -u origin epic/[NN]-[short-description]
```

**Report**: "✅ Epic branch pushed to remote"

---

### Epic Step 5: Create Epic Pull Request

```bash
# Generate list of stories completed
STORIES=$(git log main..HEAD --oneline | grep -E "^[a-f0-9]+ feat\(story" | wc -l)

# Create comprehensive PR
gh pr create \
  --title "Epic [NN]: [Epic Title]" \
  --body "## Epic Summary
[Brief description of the epic's purpose and scope]

## Stories Completed
This PR includes $STORIES stories:

$(git log main..HEAD --oneline --grep="feat(story" | sed 's/^/- /')

## Key Changes
- [Major feature 1]
- [Major feature 2]
- [Architecture changes if any]

## Documentation
- Epic Tech Spec: docs/epics/epic-[NN]-tech-spec.md
- Story Files: docs/stories/[NN]-*.md

## Testing
- [ ] TypeScript type check passes
- [ ] ESLint passes
- [ ] Semgrep security scan passes
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## AI Code Reviews
Awaiting reviews from:
- [ ] CodeAnt AI
- [ ] Gemini Code Assist
- [ ] Claude AI Review

## Merge Strategy
Squash merge recommended to keep main branch history clean.
" \
  --base main \
  --head epic/[NN]-[short-description]

# Capture PR URL
PR_URL=$(gh pr view --json url -q .url)
echo "Epic PR created: $PR_URL"
```

**Report**: "✅ Epic PR created: $PR_URL"

---

### Epic Step 6: Report PR for Review

**DO NOT auto-merge. The PR is for human + AI review.**

```
🎯 Epic [NN] PR Ready for Review

PR URL: $PR_URL

The PR includes all [X] stories for this epic.

NEXT STEPS (Manual):
1. Wait for CI checks to pass (typecheck, lint, build)
2. Wait for AI code reviews (CodeAnt, Gemini, Claude)
3. Address any review feedback with additional commits
4. Request human review if required
5. Merge when approved

Once merged, run this command to sync:
  git checkout main && git pull origin main
```

**IMPORTANT**: Stop here and let the user handle the PR review and merge process.
The PR will be reviewed by:
- CI Pipeline (typecheck, lint, build, tests)
- CodeAnt AI
- Gemini Code Assist
- Claude AI Review (consolidated todo list)
- Human reviewers (if configured)

---

## Final Step: Epic Retrospective (Manual Process)

**After the PR is merged and main is synced:**

Report epic completion summary and provide guidance for running the retrospective manually:

```
🎉 Epic [N] Complete!

All [X] stories have been successfully implemented and merged to main.

═══════════════════════════════════════════════════════════
NEXT STEP: Epic Retrospective (Optional but Recommended)
═══════════════════════════════════════════════════════════

The Epic Retrospective is an INTERACTIVE, CONVERSATIONAL workflow that
should NOT be run within this orchestration. It requires human input
and collaborative discussion between team personas.

To run the retrospective:

1. CLEAR YOUR CONTEXT (important for fresh perspective):
   - Use /clear command to reset conversation
   - Or start a new conversation

2. LOAD THE SCRUM MASTER AGENT:
   - Run: /bmad:bmm:agents:sm
   - This loads the SM (Scrum Master) persona

3. RUN THE RETROSPECTIVE WORKFLOW:
   - Run: /bmad:bmm:workflows:retrospective
   - The SM will facilitate an interactive retrospective session
   - You'll be prompted for input during the discussion
   - The workflow will create: docs/retrospectives/epic-[N]-retrospective.md
   - Sprint status will be updated to mark retrospective as "completed"

BENEFITS OF RUNNING RETROSPECTIVE:
- Capture learnings from Epic [N]
- Identify improvements for Epic [N+1]
- Document best practices and patterns
- Prepare for next epic with better context

═══════════════════════════════════════════════════════════
```

**IMPORTANT:** This workflow CANNOT clear context or run the retrospective for you.
The user must manually clear context and load the SM agent to run the retrospective.

**DO NOT offer to execute the retrospective automatically.**
**DO NOT execute the retrospective as a Task within this workflow.**

---

## Error Handling

### Epic Level Errors
- **No eligible epic found**: Report to user, exit gracefully
- **Epic tech spec fails**: Stop immediately, report error, preserve state
- **Epic branch already exists**: Offer to checkout existing branch or create new one

### Story Level Errors
- **Story creation fails**: Stop epic execution, report which story failed
- **Development fails**: Stop epic execution, report error
- **Review fails after max retries**: Stop epic execution, report which story needs manual intervention

### Recovery Strategy
- Epic branch is preserved on remote
- Sprint status shows exact state of each story
- User can resume epic orchestration after manual fixes
- Suggest running orchestrate-story for individual story fixes

---

## Quality Assurance

After EACH workflow step:
- [ ] Verify expected artifacts exist on disk
- [ ] Confirm status transitions in sprint-status.yaml
- [ ] Report completion before proceeding
- [ ] Check for errors before continuing
- [ ] Verify context isolation (no cached knowledge)

After EACH story:
- [ ] All story steps completed successfully
- [ ] Story status = "done" in sprint-status.yaml
- [ ] Story file shows "Status: done"
- [ ] Changes committed to epic branch
- [ ] Background processes cleaned up

**Never skip steps. Never assume success. Always verify.**

---

## Progress Tracking

Use TodoWrite tool to track epic orchestration progress:

```
Epic [N] Orchestration:
[ ] Epic Step 1: Create epic branch
[ ] Epic Step 2: Epic tech spec (if needed)
[ ] Story [X.1] (7 sub-steps)
[ ] Story [X.2] (7 sub-steps)
[ ] Story [X.3] (7 sub-steps)
...
[ ] Epic Step 3: Update README.md
[ ] Epic Step 4: Push epic branch
[ ] Epic Step 5: Create epic PR
[ ] Epic Step 6: Report PR for review
[ ] Epic retrospective (optional - after merge)
```

Update todos as each story completes.

---

## Final Summary Report

Upon successful PR creation:

```
🎯 BMAD Epic Workflow Complete - Epic [N]

Epic: [Epic Title]
Branch: epic/[NN]-[short-description]
Stories Completed: [X] stories
Total Commits: [X] commits
Total Files Modified: [X] files

Stories:
✅ Story [X.1]: [Title] - committed
✅ Story [X.2]: [Title] - committed
✅ Story [X.3]: [Title] - committed
...

Documentation:
- Epic Tech Spec: docs/epics/epic-[N]-tech-spec.md
- Story Files: docs/stories/[N]-*.md

PR Created: [PR_URL]
Status: Awaiting CI checks and AI reviews

Next Steps:
1. Wait for CI + AI reviews
2. Address any feedback
3. Merge when approved
4. Run retrospective (optional)
```

---

## Context Isolation Verification

After EACH workflow step, verify:
- [ ] Previous Task subagent has fully exited (you see its final return message)
- [ ] Expected files were written to disk by the subagent
- [ ] You are about to read from disk, not from any cached context
- [ ] Next Task invocation will be a fresh subagent with zero inherited state

**Never:**
- Assume file contents without reading from disk
- Pass information between workflows via conversation context
- Skip verification that artifacts exist on disk
- Continue to next story if current story has errors
