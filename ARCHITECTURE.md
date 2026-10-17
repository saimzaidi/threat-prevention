# Threat Prevention — System Architecture

## 1. Purpose

This document defines the technical architecture for Threat Prevention, a local-first AI-assisted threat detection and incident-response prototype for CODE//CONNECT’26, Problem Statement 02.

The architecture must remain beginner-friendly, modular, testable, lightweight, and free to run locally.

**Current status:** Architecture planning only. No implementation has been completed or verified.

## 2. Architecture Principles

- Separate the frontend, backend, AI inference, and database responsibilities.
- Run the prototype locally on Windows.
- Assume CPU-only execution and approximately 8 GB RAM until hardware is verified.
- Prefer free, open-source libraries and locally running models.
- Keep AI inference separate from interface rendering.
- Store incident records persistently in SQLite.
- Clearly distinguish real model detections from simulated scenarios.
- Never present an unverified detection capability as implemented.
- Avoid unnecessary services, complex infrastructure, paid APIs, and cloud dependencies.

## 3. High-Level System

The application consists of five main components:

1. **Frontend:** Displays the security dashboard, video-upload interface, alerts, evidence, incident details, and operator actions.
2. **Backend API:** Validates requests, manages uploaded videos, coordinates analysis, creates alerts, and handles incident operations.
3. **Video Processing:** Uses OpenCV to open videos, validate them, sample frames, and retain their timestamps.
4. **AI Detection Engine:** Runs a validated local model using ONNX Runtime where compatible. It returns model outputs that the backend converts into structured detection results.
5. **Database:** Uses SQLite to persist incidents, their statuses, relevant evidence references, and operator activity.

### Request flow

Frontend → FastAPI backend → Video processing → AI inference → Detection results → Incident creation → SQLite → Frontend updates.

The scenario simulator follows a separate, explicitly labelled path. Simulated events must never be represented as genuine model detections.

## 4. Technology Stack

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | User interface and client-side interactions |
| Styling | Tailwind CSS | Responsive visual design |
| Backend | Python + FastAPI | API endpoints and application logic |
| Video processing | OpenCV | Video validation, decoding, and frame sampling |
| Model inference | ONNX Runtime | Local CPU-based inference, if the selected model is compatible |
| Database | SQLite | Persistent incident records |
| Communication | HTTP + JSON | Frontend/backend communication |
| Version control | Git | Change tracking and recovery |

Exact versions and model dependencies will be selected during implementation after compatibility checks.

## 5. Frontend Responsibilities

The frontend is responsible for:

- Rendering the main security dashboard.
- Uploading supported video files.
- Displaying analysis progress and processing errors.
- Showing detection results with timestamps and available evidence.
- Displaying alerts with category, severity, source, and status.
- Opening detailed incident views.
- Allowing operators to acknowledge, investigate, add notes, and resolve incidents.
- Displaying historical incidents.
- Providing a separate scenario-simulation interface.
- Showing loading, empty, success, and error states.

The frontend must not independently decide whether a threat occurred. It displays results received from the backend.

## 6. Backend Responsibilities

FastAPI will act as the central application service.

It will:

- Expose endpoints for application health, video analysis, detections, alerts, and incidents.
- Validate upload types and enforce configurable file-size and duration limits.
- Generate safe server-side filenames instead of trusting uploaded filenames.
- Process videos without loading entire large files into memory.
- Coordinate model inference and transform model outputs into structured results.
- Create incident records only when configured detection rules are satisfied.
- Store and retrieve incident information through SQLite.
- Validate allowed status transitions and operator actions.
- Return meaningful errors without exposing stack traces or sensitive server details.
- Clearly label simulated events.

Long-running video analysis must not block unrelated API requests unnecessarily. The implementation should begin with a simple, bounded processing approach rather than adding a task queue or distributed system prematurely.

## 7. Video Processing Pipeline

The intended pipeline is:

1. Receive and validate a video upload.
2. Store it temporarily in a controlled local directory.
3. Open the file using OpenCV.
4. Validate that frames can be decoded.
5. Read selected frames at configurable intervals.
6. Resize frames to the model's required input dimensions.
7. Run the selected model on supported frames.
8. Apply validated thresholds and any required consecutive-frame rules.
9. Record relevant timestamps, detection outputs, and evidence references.
10. Create an alert if the configured criteria are met.
11. Clean up temporary files according to the retention policy.

The pipeline must handle corrupt videos, unsupported formats, empty files, excessive file sizes, and videos that produce no detections.

The implementation must limit memory usage and processing time. Frame sampling intervals and video limits will be established during testing.

## 8. AI Model Boundary

The first candidate model is PyroNear's YOLO11 smoke detector:

https://huggingface.co/pyronear/yolo11s_sensitive-detector

This is a candidate, not a confirmed dependency. Before integration, verify its license, model files, runtime compatibility, expected input and output formats, hardware requirements, and performance on representative video clips.

Its documented scope and actual tested capabilities must determine the feature description shown in the application. A smoke detector must not be presented as a universal fire detector or a general-purpose threat detector.

Additional categories such as violence, theft, and accidents must only be described as real AI detections after suitable models and end-to-end behavior have been independently validated.

Person detection alone is not proof of theft, violence, or an accident.

If the candidate model cannot run reliably on the available hardware, retain the modular detection interface and reassess the model before committing to an alternative.

## 9. Detection Result Structure

The backend should normalize model outputs into a consistent structure containing, where available:

- Detection identifier.
- Event category.
- Source type: `real_model`, `rule_based`, or `simulation`.
- Video or camera reference.
- Video timestamp.
- Frame or evidence reference.
- Model label.
- Raw confidence score.
- Configured threshold or rule that triggered the event.
- Processing timestamp.

Not every field will be available for every detection type.

A model confidence score must not automatically be described as the probability that a real-world threat occurred. Thresholds and temporal rules must be tested against false positives and missed detections.

## 10. Incident and Alert Management

An incident record should support:

- Unique incident ID.
- Category and severity.
- Source type.
- Detection timestamp and record-creation timestamp.
- Source video or camera reference.
- Available evidence references.
- Model output and applicable detection rule.
- Current status.
- Operator notes and actions.
- Creation and resolution timestamps, when applicable.

Suggested statuses:

`new` → `acknowledged` → `investigating` → `resolved`

The implementation may support a documented reopening or dismissal flow if needed.

Severity is a configurable operational label, not a claim of certainty. The operator must be able to inspect evidence before deciding how to respond.

## 11. Database Design

SQLite is the initial persistence layer.

The implementation should define appropriate tables for:

- Incidents.
- Detection records, if separated from incidents.
- Operator actions or incident activity history.
- Evidence metadata, where required.

Store evidence paths and metadata in the database rather than embedding full video files or image bytes into incident rows.

Database access should be isolated behind a small backend data-access layer so it can be tested and maintained independently.

Use database transactions and appropriate constraints for incident updates. The initial version does not require a separate database server.

## 12. API Design

The exact endpoint contracts will be finalized before implementation. The intended API groups are:

- **Health:** Confirm that the backend is running.
- **Video analysis:** Upload a video and initiate or perform analysis.
- **Analysis status/results:** Retrieve processing status and detection results when asynchronous processing is used.
- **Incidents:** List, filter, and retrieve incident details.
- **Incident actions:** Acknowledge, investigate, add notes, and resolve.
- **Simulation:** Generate clearly labelled sample incidents for demonstrations.

API responses should use consistent JSON structures and meaningful HTTP status codes.

The frontend must obtain incident and detection data through the API instead of relying on hardcoded demo records as if they were live results.

## 13. Evidence and File Storage

Use controlled local directories for temporary uploads and generated evidence.

The exact directories and cleanup policy will be defined during implementation. User uploads, model weights, generated evidence, database files, and environment secrets must not be committed to Git.

Validate file content and processing results rather than trusting a filename or browser-provided MIME type alone.

The initial prototype should not expose uploaded files through unrestricted filesystem paths.

## 14. Privacy and Safety

- Process footage locally by default.
- Use only footage the team is authorized to process.
- Do not implement facial identification.
- Do not infer criminal intent from appearance, identity, or the mere presence of a person.
- Do not automatically contact police or emergency services.
- Keep a human operator responsible for reviewing evidence and deciding on action.
- Make model limitations and simulated events visible.
- Minimize retention of uploaded footage and evidence.
- Do not claim guaranteed prevention, perfect accuracy, or universal threat recognition.

This prototype assists monitoring and review; it does not replace trained security personnel or emergency procedures.

## 15. Performance and Reliability

The initial system must be designed for modest hardware.

- Process videos in bounded chunks or sampled frames.
- Resize frames to the model's supported input size.
- Avoid loading multiple large models simultaneously.
- Limit upload size, video duration, and concurrent analyses.
- Report progress and failures honestly.
- Handle inference errors without crashing the entire application.
- Keep the dashboard usable while an analysis is running.
- Test actual processing speed and memory use before setting performance claims.

Performance targets will be defined after testing on the team's available hardware.

## 16. Development and Deployment

The initial development environment is a local Windows machine.

The frontend and backend may run as separate local development servers. Their startup commands, required environment variables, ports, and setup instructions will be documented after the project structure and dependencies are confirmed.

No paid API, paid hosting, or cloud inference service is required for the initial prototype.

Any future public deployment must be evaluated separately for security, privacy, file storage, resource limits, and free-tier restrictions.

## 17. Testing Boundaries

Test the components independently before relying on the complete demo:

- Frontend renders correctly and handles empty/loading/error states.
- Backend health endpoint works.
- Upload validation rejects invalid inputs.
- Video decoding and frame sampling work on known test clips.
- The model runs on a representative clip and returns interpretable outputs.
- Detection timestamps correspond to the original video.
- Evidence can be reviewed by the operator.
- Incident creation and status changes persist after restarting the application.
- Real detections and simulated events remain distinguishable throughout the system.
- The complete demonstration works from upload to resolution.

## 18. Architecture Decisions Still to Verify

Before implementation, confirm:

1. Whether the candidate smoke model runs reliably with the available Python and ONNX Runtime versions.
2. Which sample clips provide useful positive and negative test cases.
3. The initial upload limits, frame-sampling interval, and detection thresholds.
4. Whether video analysis can remain synchronous or requires a simple background-job mechanism.
5. The evidence format and retention policy.
6. The final API schemas and database tables.

Do not treat these unresolved decisions as implemented features.

## 19. Final Architectural Goal

Deliver a simple, maintainable local application in which video processing, model inference, incident management, persistence, and operator review work together in a credible end-to-end demonstration.

Prioritize a single validated detection path and reliable incident handling over a larger list of unverified AI capabilities.