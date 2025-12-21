# PM-09 Follow-up Tasks (from Open Questions)

## FU-01: Select Timeline/Gantt Library + Benchmarks
- Question: Which Gantt/timeline library will be used (gantt-task-react vs custom), and what are the performance benchmarks?
- Task: Prototype candidate libraries and capture render/interaction benchmarks at 100/500/1000 tasks with dependencies.
- Output: Benchmark notes + recommended library with rationale and constraints.

## FU-02: Define Portfolio Health Score Formula
- Question: How are portfolio “health scores” and aggregate metrics calculated (formula/inputs)?
- Task: Specify health score inputs (schedule, scope, risk, capacity) and weighting; document formulas and data sources.
- Output: Metrics spec for portfolio dashboard and API aggregation.

## FU-03: Define Share URL + Authorization
- Question: What is the public share URL format and which service will authorize share-token access?
- Task: Decide share route (UI + API), token format, and access checks for public links; include audit logging requirements.
- Output: Share access contract and security checklist.

## FU-04: Decide Capacity Source of Truth
- Question: What is the canonical source for capacity (TeamMember capacity vs derived from phase allocation)?
- Task: Choose capacity source of truth, document precedence rules, and update TeamMember contract if needed.
- Output: Capacity model decision note tied to resource utilization view.
