# Threat Prevention — Project Plan

**Event:** CODE//CONNECT’26  
**Problem:** Problem 02 — Threat Prevention  
**Project status:** Planning  
**Primary goal:** Build a reliable, polished, AI-assisted threat detection and incident-response prototype.

---

## 1. Project Vision

Build a lightweight security monitoring system that helps operators identify supported threats early, review evidence, prioritize alerts, and track incident responses.

The product must demonstrate a complete, working workflow rather than merely displaying a dashboard with sample alerts.

Our goal is to combine three strengths:

1. Genuine video-based AI detection.
2. A professional security monitoring command center.
3. An end-to-end incident management workflow.

The prototype should be practical to build during a hackathon, run on modest hardware, and operate without paid APIs or mandatory cloud services.

## 2. Problem We Are Solving

Security cameras and sensors can capture theft, violence, accidents, fires, and other dangerous situations. However, footage may be reviewed too late, and human operators can miss developing incidents.

Our system aims to shorten the path from available evidence to an actionable alert.

It should help answer:

- What potentially dangerous event was detected?
- When and where did it occur?
- What evidence supports the alert?
- How urgent is the situation?
- What should the operator do next?
- Has someone acknowledged and handled the incident?

The system is decision support for a human operator, not a replacement for human judgment.

## 3. Target Users

- Security operators monitoring cameras.
- Security teams responsible for reviewing incidents.
- Site managers who need incident records.
- Emergency-response personnel who may receive verified incident information through authorized human workflows.

## 4. Product Principles

1. **Real functionality over fake completeness.** A smaller working system is better than many unreliable features.
2. **Honest AI.** Clearly distinguish genuine model output, rule-based signals, and simulated scenarios.
3. **Early warning.** Detect supported signals as efficiently as possible.
4. **Proportionate response.** Present uncertainty and severity carefully.
5. **Human oversight.** Operators review and manage incidents.
6. **Privacy by design.** Process footage locally wherever practical and avoid unnecessary personal data.
7. **Free-first development.** No required paid APIs, subscriptions, or paid hosting.
8. **Modular architecture.** Detection models should be replaceable without rebuilding the entire application.
9. **Reliable demonstration.** The complete core workflow must work before optional features are added.

## 5. Scope and Priorities

### P0 — Essential features

These define the minimum credible prototype.

- A polished dashboard with clear navigation.
- Video upload with file validation and useful error messages.
- Local video reading and frame sampling.
- One genuine, tested AI detection capability.
- Detection results containing relevant timestamps and available evidence.
- An alert list with status, severity, and source.
- An incident detail view.
- Operator actions: acknowledge, investigate, and resolve.
- Persistent incident history using a local database.
- A scenario simulator for demonstrating additional incident workflows.
- A complete local setup and run procedure.

### P1 — Add after P0 is stable

- Person or vehicle detection where useful.
- Incident filtering and a clearer event timeline.
- Configurable detection thresholds.
- More informative processing and error states.
- Webcam input, if performance and time permit.
- A concise incident report or export feature.

### P2 — Stretch goals

- Multiple real camera streams.
- Additional validated threat-specific models.
- Temporal event recognition.
- More advanced tracking and correlation.
- Optional deployment, only if it remains free and does not jeopardize the local demo.

Features must be promoted into the build only when they offer enough value to justify their implementation and testing cost.

## 6. Threat Coverage Strategy

The challenge mentions theft, violence, accidents, fires, and other dangerous situations. We must address the problem broadly without falsely claiming that one model detects all of them.

### Initial real-detection candidate

Evaluate a pretrained wildfire-smoke detector:

https://huggingface.co/pyronear/yolo11s_sensitive-detector

The model is a candidate, not a confirmed project dependency. Before committing to it, verify its current model card, license, inference requirements, output format, and performance on representative footage.

Its intended smoke-detection scope must not be represented as universal fire detection.

### Additional threat categories

- **Fire and smoke:** Validate what the selected smoke detector can genuinely identify.
- **Accidents:** Add a real detection method only if it can be implemented and tested credibly.
- **Violence:** Do not infer violence from ordinary person detection. A suitable validated method is required.
- **Theft:** Do not label suspicious movement or object detection as confirmed theft without appropriate evidence.

Until a real detection method is validated, these additional categories can be demonstrated through an explicitly labelled **Scenario Simulator**.

The simulator must never present a generated event as a real AI detection.

## 7. Target Judge Demonstration

The primary demonstration should follow this sequence:

1. Open the security dashboard.
2. Upload a supported sample video.
3. Start video analysis.
4. Show processing progress.
5. Run the selected model locally on sampled frames.
6. Display genuine detection results and available evidence.
7. Generate an incident alert when the defined detection conditions are met.
8. Open the alert and inspect its details.
9. Acknowledge the incident.
10. Record an operator action and resolve the incident.
11. Reopen incident history and show the saved record.
12. Demonstrate a clearly labelled simulated scenario for an additional threat category.

The demo should be repeatable, understandable to judges, and honest about the model's limitations.

## 8. Proposed Technology Stack

| Layer | Initial choice | Purpose |
|---|---|---|
| Frontend | React + Vite | Dashboard and application interface |
| Styling | Tailwind CSS | Consistent responsive design |
| Backend | Python + FastAPI | API, processing coordination, and incident operations |
| Video processing | OpenCV | Video reading and frame sampling |
| Model inference | ONNX Runtime CPU | Local inference with a compatible ONNX model |
| Database | SQLite | Persistent incident and response records |
| Communication | HTTP and JSON | Frontend-backend communication |
| Version control | Git | Safe checkpoints and change tracking |

All dependencies must be checked for compatibility and licensing before use. Avoid installing or implementing everything in one step.

## 9. Hardware and Performance Constraints

Development environment:

- Operating system: Windows.
- RAM: 8 GB.
- Dedicated GPU: not yet confirmed.
- Internet: generally available.
- Budget: zero for required development and demo services.

Design for CPU-only inference initially.

Performance measures:

- Start with short sample videos.
- Resize frames appropriately.
- Sample frames instead of processing every frame.
- Keep inference workloads bounded.
- Avoid loading multiple large models simultaneously.
- Display processing status instead of freezing the interface.
- Measure real processing time and memory usage.
- Preserve a reliable sample-video demonstration if live processing is slow.

Do not promise real-time performance until it has been measured on the target laptop.

## 10. Visual Design Direction

The interface should feel minimal, polished, calm, and professional, inspired by Apple's design principles rather than copying any proprietary interface.

### Design principles

- Clear typography and hierarchy.
- Generous whitespace.
- Consistent spacing and alignment.
- Restrained colors and subtle borders.
- Stronger colors reserved for meaningful alert severity.
- Smooth, purposeful transitions.
- Clear empty, loading, success, and error states.
- Responsive layouts and accessible contrast.
- Evidence and active incidents take priority over decorative charts.

### Initial application areas

- Overview dashboard.
- Video analysis.
- Active incidents.
- Incident details.
- Incident history.
- Scenario simulator.

Avoid unnecessary pages, decorative metrics, and controls that do not perform a real action.

## 11. Incident and Alert Requirements

Every incident should contain as many of the following fields as are genuinely available:

- Unique incident identifier.
- Incident category.
- Detection source: real model, rule-based logic, or simulation.
- Timestamp.
- Camera or uploaded-video source.
- Severity level.
- Model score or confidence, when applicable.
- Evidence reference, such as a frame or timestamp.
- Current status.
- Operator notes and recorded actions.
- Creation and resolution timestamps.

A model score must not automatically be described as a calibrated probability.

Severity should be based on explicit, documented logic. The application must not treat every detection as a confirmed emergency.

## 12. Privacy and Responsible Use

- Prefer local processing for the initial prototype.
- Use footage the team is authorized to use.
- Avoid facial identification and unnecessary personal information.
- Do not infer criminal intent from a person's appearance.
- Do not automatically contact emergency services or law enforcement.
- Require human review for incident handling.
- Communicate uncertainty and limitations.
- Test false positives as well as successful detections.
- Keep uploaded footage and generated evidence out of version control.
- Document the source and license of each model and dataset.

## 13. Free-Tier and Development Safeguards

- No required paid inference APIs.
- No mandatory paid hosting or database.
- No paid subscriptions or payment-required trials.
- Keep a working local copy of the project.
- Use Git or manual backups before substantial changes.
- Give coding agents small, specific tasks.
- Preserve working code instead of regenerating the entire project.
- Test after each milestone.
- Keep a fallback sample video and scenario simulator available.
- Never let an optional feature endanger the core demonstration.

## 14. Definition of Done

The prototype is ready for the hackathon demonstration when:

- The application starts reliably on the development machine.
- Video upload and validation work.
- The selected AI model produces reproducible results on tested footage.
- Genuine detections are distinguishable from simulations.
- Alerts display relevant timestamps and available evidence.
- Severity and uncertainty are communicated honestly.
- Operators can acknowledge, investigate, and resolve incidents.
- Incident history persists after restarting the application.
- Additional scenario demonstrations are clearly labelled.
- The core workflow can be demonstrated without editing source code during the presentation.
- The team can explain the architecture, model limitations, and free-tier choices.

## 15. Implementation Order

1. Finalize the architecture and implementation checklist.
2. Establish the repository and project instructions.
3. Build the initial frontend shell in Google AI Studio.
4. Verify the generated structure and run the frontend.
5. Transfer the project to Cursor when the foundation is stable.
6. Set up the Python backend and a health-check endpoint.
7. Validate the chosen detection model independently.
8. Implement video upload, frame sampling, and inference.
9. Connect detections to incident and alert creation.
10. Add SQLite persistence and operator actions.
11. Add the labelled scenario simulator.
12. Test errors, false positives, performance, and the complete demo.
13. Refine the visual design and prepare the presentation.

Each milestone must be tested before proceeding to the next.

---

**Project rule:** Build a small, genuine, end-to-end system first. Expand only when the existing workflow works reliably.

**Current status:** Planning only. No technology, model, or feature should be considered successfully implemented until it has been tested.
