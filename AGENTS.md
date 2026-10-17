# AGENTS.md — Threat Prevention

## 1. Project Context

You are working on Threat Prevention, an AI-assisted threat detection and incident-response prototype for CODE//CONNECT’26, Problem Statement 02.

The goal is to build a functional, credible, polished demonstration that helps operators identify potential incidents from video, inspect evidence, and manage incident response.

The project is being developed by a beginner-friendly team with limited hardware and a strict zero-paid-services budget.

## 2. Read These Documents First

Before making significant changes, read:

1. `PROJECT_PLAN.md` — product goals, scope, constraints, and success criteria.
2. `ARCHITECTURE.md` — technical design, component responsibilities, data flow, and safety boundaries.
3. `BUILD_PLAN.md` — implementation sequence, milestones, and acceptance criteria.

If these documents conflict, do not silently choose a direction. Explain the conflict and propose the smallest reasonable resolution.

Do not claim that a planned feature is already implemented.

## 3. Core Development Rules

- Implement only the task explicitly requested.
- Work in small, reviewable increments.
- Inspect the existing project structure and relevant files before editing.
- Reuse existing components and utilities when appropriate.
- Preserve working functionality.
- Avoid unrelated refactoring.
- Do not rewrite entire files when a focused change is sufficient.
- Do not create unnecessary files, directories, abstractions, or dependencies.
- Do not add placeholder functionality that appears to be production-ready.
- Never fabricate test results, detection outputs, performance figures, or completed features.
- Explain important trade-offs in beginner-friendly language.
- Ask for clarification when a decision materially affects the architecture or safety.
- If a task fails, diagnose the actual error before attempting a different solution.

## 4. Required Technology Stack

Use the following stack unless a verified compatibility issue requires a documented change:

- Frontend: React with Vite.
- Styling: Tailwind CSS.
- Backend: Python with FastAPI.
- Video processing: OpenCV.
- AI inference: ONNX Runtime where compatible with the selected model.
- Database: SQLite.
- API communication: HTTP and JSON.
- Version control: Git.

Assume local Windows development, approximately 8 GB RAM, and CPU-only inference until the hardware is verified.

Prefer lightweight, stable dependencies. Do not add a library simply because it is fashionable or convenient.

## 5. Budget and Infrastructure Constraints

The project must remain free to develop and demonstrate locally.

- Do not introduce paid APIs or model inference services.
- Do not require paid hosting, subscriptions, or cloud infrastructure.
- Prefer locally available, open-source components with compatible licenses.
- Do not assume that a free-tier service is unlimited or suitable for the demonstration.
- Do not require a credit card or paid account to run the core application.
- If a proposed feature introduces a cost, explain the cost risk and provide a free local alternative.

Never introduce an external service dependency without explicit approval.

## 6. Frontend Guidelines

Build a clean, professional security-operations interface.

- Use consistent spacing, typography, colors, and component patterns.
- Keep the interface minimal and purposeful.
- Use severity and status indicators consistently.
- Provide loading, empty, success, and error states.
- Make primary workflows easy to discover.
- Ensure the interface remains usable at common desktop and smaller screen sizes.
- Avoid unnecessary animations, excessive gradients, decorative charts, and redundant cards.
- Keep data fetching and presentation responsibilities reasonably separated.
- Use clear labels and accessible controls.
- Do not hardcode fake incidents or statistics as if they came from real monitoring.

Placeholder data may be used during interface development only when clearly identified and replaced or isolated before the final demonstration.

## 7. Backend Guidelines

- Keep API routes, application logic, detection logic, and data access separated where practical.
- Validate all incoming data.
- Use appropriate HTTP status codes and consistent JSON responses.
- Handle exceptions without exposing stack traces, secrets, or sensitive filesystem details to users.
- Use safe server-generated filenames.
- Enforce configurable upload limits.
- Do not trust filenames or client-provided content types.
- Avoid loading entire large videos into memory.
- Keep long-running video processing from unnecessarily blocking unrelated requests.
- Use transactions and appropriate validation for database updates.
- Keep configuration explicit and documented.
- Do not add complex infrastructure before the basic workflow requires it.

## 8. AI Detection Integrity

AI detection must be genuine, testable, and accurately described.

- Verify model compatibility before integration.
- Inspect the model's license, scope, input format, output format, and dependencies.
- Do not invent inference outputs.
- Do not label hardcoded examples as real detections.
- Do not treat person detection alone as proof of theft, violence, or an accident.
- Do not describe a smoke detector as a universal fire or threat detector.
- Keep model confidence scores distinct from calibrated probabilities of a real-world threat.
- Record relevant timestamps and available evidence.
- Test both positive and negative examples when suitable footage is available.
- Document false positives, missed detections, and known limitations.
- Use thresholds and temporal rules only when their behavior is understood and tested.

If a model is unavailable or fails, report the actual failure and investigate it. Do not silently substitute fabricated detections.

## 9. Simulation Rules

Scenario simulation is allowed for demonstration and interface testing.

However:

- Every simulated event must be clearly labelled as simulated.
- Simulated events must use an explicit simulation source identifier.
- Simulations must not be described as outputs of the real AI model.
- Real and simulated records must remain distinguishable in lists, details, history, and reports.
- Simulation must never silently trigger real-world emergency actions.

## 10. Privacy and Safety Boundaries

- Process video locally by default.
- Use only footage the team is authorized to process.
- Do not implement facial identification.
- Do not infer criminal intent from a person's appearance or mere presence.
- Do not automatically contact police, emergency services, or other external responders.
- Keep a human operator responsible for reviewing evidence and choosing an appropriate response.
- Minimize retention of uploaded footage and generated evidence.
- Keep private footage and sensitive data out of Git.
- Avoid collecting personal information that the prototype does not need.

## 11. File and Secret Management

- Keep planning documents in the project root.
- Follow the existing folder structure unless a change is necessary.
- Keep frontend and backend responsibilities separated.
- Do not commit virtual environments, dependency caches, local databases, uploaded videos, generated evidence, model weights, or environment secrets.
- Configure appropriate `.gitignore` rules before adding sensitive or large local files.
- Provide a safe example environment file only when configuration variables are needed.
- Never put API keys, passwords, tokens, or private credentials directly into source code.
- Do not delete or rename user-created files without a clear reason and explicit communication.

## 12. Dependency and Compatibility Rules

Before adding or upgrading a dependency:

1. Confirm that it is needed for the requested task.
2. Check compatibility with the current project and runtime.
3. Prefer a maintained, lightweight option.
4. Explain any significant trade-off.
5. Update dependency manifests and lockfiles consistently when applicable.
6. Verify installation and basic functionality.

Do not perform broad dependency upgrades to solve an unrelated problem.

## 13. Testing and Verification

After each meaningful implementation change:

- Run the smallest relevant test.
- Check for build, import, runtime, and API errors as appropriate.
- Test the changed user workflow.
- Report tests that passed and tests that were not run.
- Never claim that code was executed if it was only inspected.
- Do not mark a milestone complete until its acceptance criteria have been verified.

When a test fails, explain the failure, its likely cause, and the next diagnostic step.

## 14. Git and Recovery

- Preserve a recoverable working state before risky changes.
- Encourage a Git commit after each completed milestone.
- Inspect changes before overwriting or deleting files.
- Avoid destructive Git commands.
- Do not reset, clean, or discard user changes without explicit approval.
- Keep commits focused on one meaningful change.

## 15. Working With a Beginner

The primary developer is still learning practical software development and vibe coding.

When completing a task:

1. State what you are implementing.
2. Briefly explain why it is needed.
3. Identify the files you will change.
4. Implement only the agreed scope.
5. Explain how to run or test the result.
6. Summarize what works, what remains incomplete, and any important limitations.

Prefer concrete instructions and small steps over large unexplained code dumps.

Do not overwhelm the developer with unrelated optimizations or advanced infrastructure.

## 16. Scope Discipline

Prioritize these outcomes in order:

1. A reliable local application.
2. One validated, genuine AI detection path.
3. Timestamped results and inspectable evidence.
4. A complete incident-review and resolution workflow.
5. Persistent incident history.
6. Clearly labelled scenario simulation.
7. UI polish and optional enhancements.

Do not build additional detection categories, live-camera infrastructure, cloud deployment, or advanced analytics while core acceptance criteria remain incomplete.

## 17. Definition of Success

A change is successful when it satisfies the requested task, preserves existing working behavior, follows the project documents, and can be verified.

The overall project is successful when the team can run a repeatable end-to-end demonstration, explain what the AI genuinely detects, show the evidence, manage incidents, and distinguish actual model results from simulated scenarios.

**Golden rule: Build what is real, test what matters, explain what changed, and never pretend an unfinished capability works.**