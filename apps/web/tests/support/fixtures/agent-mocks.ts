/**
 * Agent Mock Fixtures - Deterministic AI Responses for Testing
 *
 * Provides mock responses for agent teams to enable predictable testing
 * without requiring actual AI API calls.
 *
 * @see docs/stories/11-5-agent-integration-e2e-tests.md
 */

/**
 * Mock response structure from agent team endpoints
 */
export interface MockTeamRunResponse {
  success: boolean;
  content: string;
  session_id: string;
  agent_name?: string;
  metadata: {
    business_id: string;
    team: string;
    workspace_id: string;
  };
}

/**
 * Mock Validation Team Response
 *
 * Simulates Vera's validation team output for market sizing,
 * competitor analysis, and customer discovery.
 */
export const mockValidationResponse: MockTeamRunResponse = {
  success: true,
  content: `# Business Validation Analysis

## Market Sizing
The target market shows strong potential with an estimated TAM of $500M annually.
Market growth rate: 15% YoY.

## Competitor Analysis
- Competitor A: Strong brand, high prices ($299/mo)
- Competitor B: Feature-rich but complex UX
- Competitor C: Limited features, budget option ($49/mo)

**Competitive Advantage:** Simplified UX with mid-tier pricing strategy.

## Customer Discovery
Target personas:
1. Small business owners (50-200 employees)
2. Operations managers seeking automation
3. Budget: $100-200/mo

Pain points:
- Manual processes consuming 10+ hours/week
- Lack of integration between tools
- High cost of enterprise solutions

## Risk Assessment
- Market risk: Medium (competitive but growing)
- Execution risk: Low (proven tech stack)
- Financial risk: Low (SaaS model, predictable revenue)

## Recommendation
**PROCEED** - Strong market validation with clear differentiation opportunity.
`,
  session_id: 'val_mock_12345',
  agent_name: 'Vera',
  metadata: {
    business_id: 'mock-business-123',
    team: 'validation',
    workspace_id: 'mock-workspace-456',
  },
};

/**
 * Mock Planning Team Response
 *
 * Simulates Blake's planning team output for business model,
 * financial projections, and growth strategy.
 */
export const mockPlanningResponse: MockTeamRunResponse = {
  success: true,
  content: `# Business Plan

## Business Model Canvas

### Value Proposition
Automated workflow platform that saves SMBs 10+ hours/week at 1/3 the cost of enterprise solutions.

### Customer Segments
- Primary: SMBs (50-200 employees)
- Secondary: Freelancers and solopreneurs
- Tertiary: Departments in larger enterprises

### Revenue Streams
- Subscription (SaaS): $99/mo Starter, $199/mo Professional, $499/mo Enterprise
- Professional services: Implementation ($2,500), training ($1,000)
- Marketplace: 20% commission on third-party integrations

### Key Partnerships
- Cloud infrastructure: AWS/GCP
- Payment processing: Stripe
- Identity provider: Better Auth
- AI models: Anthropic, OpenAI

## Financial Projections

### Year 1
- Revenue: $480K
- Costs: $720K
- Net: -$240K (investment phase)
- Customers: 400 (end of year)

### Year 2
- Revenue: $1.8M
- Costs: $1.2M
- Net: $600K (breakeven achieved Q2)
- Customers: 1,500 (end of year)

### Year 3
- Revenue: $5.4M
- Costs: $2.7M
- Net: $2.7M (profitable growth)
- Customers: 4,500 (end of year)

## Go-to-Market Strategy
1. Product-led growth: Free trial → self-serve conversion
2. Content marketing: SEO blog, case studies
3. Partnerships: Integration marketplace
4. Sales: Inside sales team (Year 2+)

## Operational Plan
- Team: 3 founders (Year 1), 10 employees (Year 2), 25 employees (Year 3)
- Tech stack: Next.js, NestJS, PostgreSQL, Redis
- Infrastructure: Multi-tenant SaaS on AWS
`,
  session_id: 'plan_mock_67890',
  agent_name: 'Blake',
  metadata: {
    business_id: 'mock-business-123',
    team: 'planning',
    workspace_id: 'mock-workspace-456',
  },
};

/**
 * Mock Branding Team Response
 *
 * Simulates Bella's branding team output for brand strategy,
 * visual identity, and messaging.
 */
export const mockBrandingResponse: MockTeamRunResponse = {
  success: true,
  content: `# Brand Identity Guide

## Brand Strategy

### Brand Positioning
"The effortless automation platform for growing businesses"

### Brand Promise
Save 10+ hours per week with workflows that just work.

### Brand Personality
- Approachable
- Reliable
- Innovative
- Empowering

## Visual Identity

### Color Palette
- Primary: #6366F1 (Indigo) - Trust, Innovation
- Secondary: #10B981 (Emerald) - Growth, Success
- Accent: #F59E0B (Amber) - Energy, Warmth
- Neutrals: #1F2937 (Dark Gray), #F9FAFB (Light Gray)

### Typography
- Headings: Inter Bold (Modern, Clean)
- Body: Inter Regular (Readable, Professional)
- Code: JetBrains Mono (Technical, Precise)

### Logo Concept
Minimalist icon combining workflow nodes with upward arrow
symbolizing growth and automation.

## Brand Voice

### Tone
- Conversational but professional
- Confident but not arrogant
- Technical but accessible
- Supportive and empowering

### Messaging Pillars
1. **Simplicity**: "Complex workflows, simple setup"
2. **Reliability**: "Built for business-critical operations"
3. **Growth**: "Scale without limits"

### Key Messages
- Tagline: "Automate. Accelerate. Achieve."
- Value prop: "Save time. Grow faster. Work smarter."
- Mission: "Empowering businesses to focus on what matters"

## Brand Assets

### Required Deliverables
- Logo (primary, icon, wordmark)
- Color swatches and usage guidelines
- Typography system
- Icon library
- Marketing templates (presentations, one-pagers)
- Social media graphics templates
- Website wireframes

### Asset Generation Priority
1. Logo and wordmark
2. Color palette implementation
3. Typography system
4. Marketing one-pager
5. Social media templates
`,
  session_id: 'brand_mock_11223',
  agent_name: 'Bella',
  metadata: {
    business_id: 'mock-business-123',
    team: 'branding',
    workspace_id: 'mock-workspace-456',
  },
};

/**
 * Mock context object for validation → planning handoff
 *
 * Represents the context data passed from validation to planning team.
 */
export const mockValidationContext = {
  validation_output: mockValidationResponse.content,
  validation_session: mockValidationResponse.session_id,
  market_size: {
    tam: 500000000,
    sam: 100000000,
    som: 10000000,
  },
  competitive_landscape: {
    competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
    differentiation: 'Simplified UX with mid-tier pricing',
  },
  validation_score: 85,
  recommendation: 'PROCEED',
};

/**
 * Mock context object for planning → branding handoff
 *
 * Represents the context data passed from planning to branding team.
 */
export const mockPlanningContext = {
  business_plan: mockPlanningResponse.content,
  planning_session: mockPlanningResponse.session_id,
  business_model: {
    value_proposition: 'Automated workflow platform for SMBs',
    target_segments: ['SMBs (50-200 employees)', 'Freelancers', 'Enterprise departments'],
    pricing_tiers: [
      { name: 'Starter', price: 99 },
      { name: 'Professional', price: 199 },
      { name: 'Enterprise', price: 499 },
    ],
  },
  financial_summary: {
    year1_revenue: 480000,
    year2_revenue: 1800000,
    year3_revenue: 5400000,
    breakeven_quarter: 'Q2 Year 2',
  },
};

/**
 * Mock error responses for testing error handling
 */
export const mockErrorResponses = {
  unauthorized: {
    detail: 'Authentication required. Valid JWT token with workspace context needed.',
  },
  missingFields: {
    detail: [
      {
        type: 'missing',
        loc: ['body', 'business_id'],
        msg: 'Field required',
      },
    ],
  },
  crossTenantAccess: {
    detail: 'Access denied. Business does not belong to your workspace.',
  },
  agentExecutionError: {
    success: false,
    error: 'Validation team execution failed: Model error',
    session_id: 'error_session_123',
    metadata: {
      business_id: 'error-business-id',
      team: 'validation',
      workspace_id: 'error-workspace-id',
    },
  },
};

/**
 * Mock health check responses
 */
export const mockHealthResponses = {
  validation: {
    status: 'ok',
    team: 'validation',
    leader: 'Vera',
    members: ['Marco', 'Cipher', 'Persona', 'Risk'],
    version: '0.1.0',
    storage: 'bmv_validation_sessions',
  },
  planning: {
    status: 'ok',
    team: 'planning',
    leader: 'Blake',
    members: ['Model', 'Finn', 'Revenue', 'Forecast'],
    version: '0.1.0',
    storage: 'bmp_planning_sessions',
  },
  branding: {
    status: 'ok',
    team: 'branding',
    leader: 'Bella',
    members: ['Sage', 'Vox', 'Iris', 'Artisan', 'Audit'],
    version: '0.1.0',
    storage: 'bm_brand_sessions',
  },
};

/**
 * Helper function to create a mock response with custom data
 */
export function createMockResponse(overrides: Partial<MockTeamRunResponse>): MockTeamRunResponse {
  return {
    success: true,
    content: 'Mock agent response',
    session_id: `mock_${Date.now()}`,
    agent_name: 'MockAgent',
    metadata: {
      business_id: 'mock-business',
      team: 'mock',
      workspace_id: 'mock-workspace',
    },
    ...overrides,
  };
}
