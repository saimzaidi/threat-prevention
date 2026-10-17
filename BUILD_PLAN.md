# Threat Prevention — Build Plan

## 1. Objective

Build a working, polished, locally runnable AI-assisted threat detection and incident-response prototype for CODE//CONNECT’26, Problem Statement 02.

The priority is a credible end-to-end demonstration, not the largest number of features.

**Current status:** Planning complete in progress. Implementation has not started. Every stage must be marked complete only after its acceptance criteria have been tested.

## 2. Rules for AI-Assisted Development

These rules apply when using Google AI Studio, Cursor, or any other coding assistant.

1. Follow `PROJECT_PLAN.md`, `ARCHITECTURE.md`, and this file.
2. Complete one clearly defined task at a time.
3. Inspect existing files before modifying them.
4. Do not replace working code or rewrite unrelated files without a clear reason.
5. Do not invent completed functionality, model results, test results, or performance numbers.
6. Do not add paid services, paid APIs, subscriptions, or unnecessary cloud dependencies.
7. Do not introduce extra frameworks or libraries without explaining why they are needed.
8. Preserve the agreed folder structure and technology stack unless a verified technical issue requires a change.
9. After each meaningful change, explain what changed, which files were affected, how to run it, and how to test it.
10. If a command fails, investigate the error before attempting unrelated changes.
11. Keep secrets, private footage, local databases, uploaded videos, model weights, and environment files out of Git.
12. Never claim a stage is complete until its acceptance criteria pass.

## 3. Development Strategy

Build in small, verifiable stages:

**Plan → Frontend shell → Backend foundation → Model validation → Video pipeline → Real detections → Incident management → Simulator → Integration testing → Demo polish.**

Do not build the complete application in one enormous prompt.

Use Google AI Studio for the initial frontend foundation if its workspace supports the workflow. Then export or transfer the code into the local `threat-prevention/` folder and continue with Cursor.

The local project folder and Git repository must remain the source of truth. Verify exported files before replacing or merging any existing work.

## 4. Stage 0 — Finalize the Workspace

### Tasks

- Confirm `PROJECT_PLAN.md` is saved.
- Confirm `ARCHITECTURE.md` is saved.
- Create and save `BUILD_PLAN.md`.
- Create `AGENTS.md` with the project-wide coding rules.
- Create a Git repository or another reliable local backup before implementation.
- Confirm Python, Node.js, npm, and Git are available.
- Check available memory and whether a usable GPU exists.
- Identify a small set of authorized, representative test videos.

### Acceptance criteria

- All planning files exist in the project root.
- The local project folder is accessible.
- Required development tools and versions are recorded.
- A backup or version-control recovery path exists.
- No implementation is incorrectly marked as complete.

## 5. Stage 1 — Frontend Foundation

### Tasks

Build the visual shell using React, Vite, and Tailwind CSS.

Create a clean, professional security-operations dashboard with:

- Navigation and application identity.
- Overview statistics.
- Alerts and incidents sections.
- Video-upload area.
- Recent activity or incident history.
- A clear route to incident details.
- A dedicated scenario-simulation section.
- Responsive layouts.
- Loading, empty, and error states.

Use realistic but clearly identified placeholder data only where necessary to develop the interface.

Do not imply that placeholder statistics or alerts are real detections.

### Design direction

- Minimal, polished, Apple-like interface.
- Clear typography and deliberate spacing.
- Restrained color palette.
- Severity colors used consistently.
- Subtle, purposeful animations.
- Strong visual hierarchy.
- Useful empty states instead of fake activity.
- No unnecessary charts, widgets, or decorative complexity.

### Acceptance criteria

- The frontend starts locally.
- Navigation and primary interactions work.
- The interface adapts to smaller and larger screens.
- Empty, loading, and error states are visible where appropriate.
- Placeholder information is identifiable as sample data.
- The application has a consistent visual system.

**Checkpoint:** Save a Git commit or backup before continuing.

## 6. Stage 2 — Backend Foundation

### Tasks

- Initialize a Python virtual environment.
- Install only the dependencies required for the current stage.
- Create the FastAPI application.
- Add a health-check endpoint.
- Configure local development settings.
- Add consistent JSON error responses.
- Establish a clean separation between API routes, business logic, and data access.
- Configure the frontend to communicate with the backend.

### Acceptance criteria

- The backend starts without errors.
- The health-check endpoint returns a successful response.
- Invalid requests produce understandable errors.
- The frontend can reach the backend.
- No paid API or cloud service is required.

**Checkpoint:** Test the backend independently before integrating video processing.

## 7. Stage 3 — Validate the AI Model Independently

### Tasks

Investigate the candidate PyroNear YOLO11 smoke detector:

https://huggingface.co/pyronear/yolo11s_sensitive-detector

Before committing to it:

- Verify its current license and intended scope.
- Identify the supported model format and required dependencies.
- Confirm the expected input size, preprocessing, labels, and output format.
- Determine whether CPU inference works on the available hardware.
- Obtain representative test footage from authorized or openly licensed sources.
- Test at least one positive example and one negative example when suitable clips are available.
- Measure processing time and memory use.
- Inspect false positives and missed detections.
- Document limitations.

### Acceptance criteria

- The model loads successfully in the selected runtime.
- A test frame can be processed without errors.
- The outputs can be interpreted correctly.
- The result can be mapped to a timestamped detection record.
- Basic positive and negative tests have been performed.
- The model's scope and limitations are documented.

### Fallback

If the candidate cannot be made to work reliably, stop and investigate the compatibility problem before choosing an alternative.

Do not spend the entire hackathon forcing a model to run. If necessary, demonstrate the rest of the incident workflow using clearly labelled simulations while continuing to evaluate a genuine detection path.

**Checkpoint:** Save the verified test script, configuration, and findings.

## 8. Stage 4 — Video Upload and Processing

### Tasks

- Add a frontend upload workflow.
- Validate supported video formats and file sizes on the backend.
- Generate safe local filenames.
- Store uploads in a controlled temporary directory.
- Open videos using OpenCV.
- Sample frames at a configurable interval.
- Resize frames to the model's supported dimensions.
- Preserve timestamps corresponding to the original video.
- Track processing progress or status.
- Handle invalid, corrupt, empty, and unsupported files.
- Clean up temporary files according to the retention policy.

Start with short test videos. Do not optimize for long videos or multiple simultaneous uploads prematurely.

### Acceptance criteria

- A valid test video uploads successfully.
- Invalid inputs are rejected safely.
- Frames can be sampled from a valid video.
- Sampled frames retain correct video timestamps.
- Processing does not load an entire large video into memory.
- Errors are shown clearly to the operator.

## 9. Stage 5 — Connect Real AI Detection

### Tasks

- Connect the independently tested model to the video-processing pipeline.
- Run inference on sampled frames.
- Apply the model's required preprocessing and output decoding.
- Use configurable detection thresholds.
- Evaluate whether consecutive-frame rules help reduce false alerts.
- Associate detections with video timestamps and evidence frames.
- Display genuine results in the frontend.
- Record the source as `real_model`.
- Show analysis progress, completion, and failure states.

Do not invent detection results to make the dashboard look active.

### Acceptance criteria

- A known test video can pass through the full inference pipeline.
- The backend returns actual outputs from the selected model.
- Detection timestamps correspond to the source video.
- Relevant evidence can be inspected.
- No-detection results are handled correctly.
- Errors do not crash the entire application.
- The interface accurately describes the model's capabilities and limitations.

**Milestone:** At least one genuine detection path works end to end.

## 10. Stage 6 — Incident Management and Persistence

### Tasks

- Create the SQLite database and schema.
- Store incidents and relevant detection metadata.
- Create incidents when validated detection rules are satisfied.
- Display alerts with category, severity, source, timestamp, and status.
- Implement incident-detail views.
- Support acknowledgement, investigation, notes, and resolution.
- Persist state changes to SQLite.
- Show incident history after application restarts.
- Keep evidence references associated with the relevant incident.

Use explicit incident statuses and validate allowed transitions.

### Acceptance criteria

- A qualifying detection can create an incident.
- Incident details match the saved record.
- Operator actions update persistent state.
- Resolved incidents remain available in history.
- Data survives a normal application restart.
- The UI never confuses a model score with certainty that an incident occurred.

## 11. Stage 7 — Scenario Simulator

### Purpose

Demonstrate the broader incident-response workflow without falsely claiming that every threat category has a working AI model.

### Tasks

- Add a clearly labelled simulation interface.
- Support sample scenarios for relevant categories, such as theft, violence, accidents, and fire-related events.
- Use predefined scenario data with realistic timestamps, severity labels, and descriptions.
- Allow simulated incidents to be acknowledged, investigated, and resolved.
- Persist simulated incidents using the same incident-management workflow.
- Keep simulated records visibly distinguishable from real model detections.

### Acceptance criteria

- Each scenario is clearly marked as simulated.
- Simulation never invokes a fake model result presented as genuine inference.
- Simulated incidents can follow the complete operator workflow.
- Source labels remain accurate in lists, details, and history.

The simulator demonstrates the incident-response interface, not real detection capability.

## 12. Stage 8 — Integration and Reliability Testing

Test the application from the user's perspective.

### End-to-end test

1. Start the frontend and backend.
2. Open the dashboard.
3. Upload a valid test video.
4. Start analysis.
5. Observe processing status.
6. Review genuine model results, if the model is working.
7. Open a resulting incident.
8. Inspect available evidence.
9. Acknowledge the incident.
10. Move it to investigation.
11. Add an operator note.
12. Resolve it.
13. Confirm the incident remains in history after a restart.
14. Run a separate simulated scenario.
15. Confirm the real and simulated sources remain distinguishable.

### Negative tests

- Unsupported file type.
- Corrupt or empty video.
- File exceeding the configured limit.
- Video with no qualifying detection.
- Model-loading or inference failure.
- Backend unavailable.
- Database update failure.
- Repeated operator actions.
- Missing or unavailable evidence.
- Browser refresh during or after analysis.

### Acceptance criteria

- The main workflow works without manually editing source code during the demo.
- Errors are recoverable and understandable.
- Real and simulated results are never confused.
- Incident history persists.
- No critical error blocks the main demonstration.

## 13. Stage 9 — UI Polish and Performance

Only begin this stage after the main workflow is functional.

### Tasks

- Improve spacing, typography, and visual consistency.
- Refine alert severity and status indicators.
- Add useful progress feedback.
- Improve incident detail layouts.
- Remove redundant controls.
- Test responsive layouts.
- Measure actual video-processing performance.
- Reduce unnecessary rerenders and expensive processing where needed.
- Improve startup and error messages.
- Verify that the demo works on the actual presentation machine.

Do not sacrifice core functionality for decorative animations or unnecessary features.

## 14. Stage 10 — Demo and Submission Readiness

### Tasks

- Create a repeatable local startup procedure.
- Prepare a short, tested positive video clip and a negative clip.
- Prepare one or more labelled simulation scenarios.
- Reset the demo database or prepare a clean starting state.
- Rehearse the end-to-end demonstration.
- Prepare a short architecture explanation.
- Explain the chosen model, evidence pipeline, and incident lifecycle.
- Document known limitations honestly.
- Create `README.md` at the end, including setup, dependencies, run instructions, test procedure, and limitations.
- Verify the project can be launched without relying on undocumented steps.

### Acceptance criteria

- The project starts from a clean, documented setup.
- The main demo has been rehearsed successfully.
- The team can explain which features use real AI and which are simulated.
- Test footage and dependencies are available on the presentation machine.
- No required step depends on an unverified internet service or paid API.

## 15. Scope Control

### Must-have

- Functional dashboard.
- Video upload and validation.
- One independently validated AI detection path.
- Timestamped detection results and inspectable evidence.
- Incident creation and operator actions.
- SQLite persistence.
- Clearly labelled scenario simulation.
- Reliable local startup and an end-to-end demonstration.

### Should-have

- Incident filtering and search.
- Better progress reporting.
- Exportable incident summaries.
- Additional validated detection capabilities.
- Improved evidence timeline.

### Only if time permits

- Multiple live camera streams.
- Advanced object tracking.
- Multiple large AI models.
- Sophisticated temporal event recognition.
- Cloud deployment.
- Authentication and multi-user permissions beyond what the local prototype requires.

Do not start optional features while must-have acceptance criteria remain incomplete.

## 16. Change Management

Before adding a feature, answer:

1. Does it directly support the problem statement or demonstration?
2. Is it required for a must-have milestone?
3. Can it be implemented and tested with the available time and hardware?
4. Will it destabilize a working feature?
5. Is there a simpler, credible alternative?

If a feature threatens the core workflow, postpone it.

Every completed stage should end with a working test, a brief record of what changed, and a recoverable Git commit or backup.

## 17. Final Definition of Done

The project is ready when:

- It runs locally on the target machine.
- Video upload and processing work.
- At least one genuine model-based detection path has been validated, or its limitation is explicitly disclosed if a technical fallback is necessary.
- Results include accurate timestamps and available evidence.
- Operators can review and manage incidents.
- Incident data persists in SQLite.
- Simulated scenarios are clearly labelled.
- The full demonstration works without source-code edits.
- Setup instructions and limitations are documented.
- The team can explain the architecture and demonstrate the system honestly.

**Final priority:** A small, real, reliable system is stronger than a large dashboard full of fake or unverified AI capabilities.