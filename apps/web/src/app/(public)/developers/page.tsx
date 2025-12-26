import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developer Documentation - HYVVE API',
  description: 'API documentation and developer resources for integrating with HYVVE',
};

/**
 * Developer Portal Page
 *
 * Provides API documentation and getting started resources for developers.
 */
export default function DevelopersPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Developer Documentation</h1>
        <p className="mt-4 text-lg text-gray-600">
          Build powerful integrations with the HYVVE API
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View API Reference
          </a>
          <a
            href={`${API_BASE_URL}/api/docs/spec.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download OpenAPI Spec
          </a>
        </div>
      </div>

      {/* Quick Start */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Get Your API Key</h3>
            <p className="text-gray-600 mb-4">
              Generate an API key from your workspace settings. Navigate to Settings → API Keys and create a new key with the appropriate scopes.
            </p>
            <Link
              href="/settings/api-keys"
              className="text-primary hover:underline font-medium"
            >
              Generate API Key →
            </Link>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Make Your First Request</h3>
            <p className="text-gray-600 mb-4">
              All API requests require authentication via the X-API-Key header.
            </p>
            <CodeBlock
              language="bash"
              code={`curl ${API_BASE_URL}/api/v1/pm/projects \\
  -H "X-API-Key: sk_prod_your_key_here" \\
  -H "Content-Type: application/json"`}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Create a Task</h3>
            <p className="text-gray-600 mb-4">
              Create a new task in your project:
            </p>
            <CodeBlock
              language="bash"
              code={`curl -X POST ${API_BASE_URL}/api/v1/pm/tasks \\
  -H "X-API-Key: sk_prod_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "cm4abc123xyz",
    "phaseId": "cm4def456uvw",
    "title": "Implement user authentication",
    "description": "Add OAuth2 authentication",
    "priority": "HIGH",
    "type": "STORY"
  }'`}
            />
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication</h2>
        <div className="prose prose-gray max-w-none">
          <p>
            All API endpoints require authentication using an API key passed in the <code>X-API-Key</code> header.
          </p>
          <h3>API Key Format</h3>
          <ul>
            <li><code>sk_prod_...</code> - Production keys</li>
            <li><code>sk_test_...</code> - Test/development keys</li>
          </ul>
          <h3>Security Best Practices</h3>
          <ul>
            <li>Never commit API keys to version control</li>
            <li>Use environment variables to store keys</li>
            <li>Rotate keys regularly</li>
            <li>Use the minimum required scopes for your integration</li>
          </ul>
        </div>
      </section>

      {/* API Scopes */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">API Scopes</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <ScopeCard
            scope="pm:read"
            description="Read access to projects, tasks, phases, and views"
            operations={['List projects', 'Get task details', 'Search tasks']}
          />
          <ScopeCard
            scope="pm:write"
            description="Create and update projects, tasks, and phases"
            operations={['Create tasks', 'Update projects', 'Assign tasks']}
          />
          <ScopeCard
            scope="pm:admin"
            description="Full access including deletion"
            operations={['Delete projects', 'Delete tasks', 'Full management']}
          />
          <ScopeCard
            scope="webhook:write"
            description="Create and manage webhooks"
            operations={['Create webhooks', 'Update webhooks', 'View deliveries']}
          />
        </div>
      </section>

      {/* Rate Limits */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limits</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Standard Rate Limit</h3>
              <p className="text-blue-800 mb-4">
                1000 requests per hour per API key
              </p>
              <p className="text-blue-700 text-sm">
                Rate limit headers are included in all responses:
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li><code>X-RateLimit-Limit</code> - Maximum requests per window</li>
                <li><code>X-RateLimit-Remaining</code> - Requests remaining</li>
                <li><code>X-RateLimit-Reset</code> - Time when limit resets</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* API Versioning */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">API Versioning</h2>
        <div className="prose prose-gray max-w-none">
          <p>
            The HYVVE API uses URL path versioning. The current version is <code>v1</code>.
          </p>
          <h3>Version Format</h3>
          <p>
            All API endpoints include the version in the URL path: <code>/api/v1/...</code>
          </p>
          <h3>Versioning Strategy</h3>
          <ul>
            <li><strong>Stable releases</strong> - Major versions (v1, v2) are stable and supported long-term</li>
            <li><strong>Deprecation notice</strong> - Minimum 6 months notice before deprecating a version</li>
            <li><strong>Migration guides</strong> - Detailed migration documentation provided for version upgrades</li>
            <li><strong>Sunset headers</strong> - Deprecated versions include <code>Sunset</code> header with deprecation date</li>
          </ul>
          <h3>Breaking Changes</h3>
          <p>
            Breaking changes are only introduced in new major versions. Non-breaking additions
            (new optional fields, new endpoints) may be added to existing versions.
          </p>
        </div>
      </section>

      {/* Common Examples */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Use Cases</h2>
        <div className="space-y-6">
          <ExampleCard
            title="List All Projects"
            description="Retrieve all projects with pagination"
            code={`// GET /api/v1/pm/projects?limit=50&offset=0
const response = await fetch('${API_BASE_URL}/api/v1/pm/projects?limit=50', {
  headers: {
    'X-API-Key': 'sk_prod_your_key_here'
  }
});
const { data, pagination } = await response.json();
// pagination: { total, limit, offset }`}
          />

          <ExampleCard
            title="Filter Tasks by Status"
            description="Get all tasks in TODO status for a project"
            code={`// GET /api/v1/pm/tasks?projectId=xxx&status=TODO
const response = await fetch(
  '${API_BASE_URL}/api/v1/pm/tasks?projectId=cm4abc123&status=TODO',
  {
    headers: {
      'X-API-Key': 'sk_prod_your_key_here'
    }
  }
);
const { data } = await response.json();`}
          />

          <ExampleCard
            title="Update Task Status"
            description="Transition a task to IN_PROGRESS"
            code={`// POST /api/v1/pm/tasks/:id/transition
const response = await fetch(
  '${API_BASE_URL}/api/v1/pm/tasks/cm4task123/transition',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'sk_prod_your_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  }
);
const task = await response.json();`}
          />
        </div>
      </section>

      {/* Error Handling */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Error Handling</h2>
        <div className="prose prose-gray max-w-none">
          <p>
            All errors follow a consistent format with appropriate HTTP status codes:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "statusCode": 400,
  "message": "Validation failed: title is required",
  "error": "Bad Request"
}`}
          />
          <h3>Common Status Codes</h3>
          <ul>
            <li><strong>400 Bad Request</strong> - Invalid request data</li>
            <li><strong>401 Unauthorized</strong> - Missing or invalid API key</li>
            <li><strong>403 Forbidden</strong> - Insufficient scope permissions</li>
            <li><strong>404 Not Found</strong> - Resource not found</li>
            <li><strong>429 Too Many Requests</strong> - Rate limit exceeded</li>
            <li><strong>500 Internal Server Error</strong> - Server error</li>
          </ul>
        </div>
      </section>

      {/* Webhooks */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Webhooks</h2>
        <div className="prose prose-gray max-w-none">
          <p>
            Subscribe to real-time events in your workspace. Webhooks allow you to receive HTTP callbacks when specific events occur.
          </p>
          <h3>Project Events</h3>
          <ul>
            <li><code>pm.project.created</code> - New project created</li>
            <li><code>pm.project.updated</code> - Project updated</li>
            <li><code>pm.project.deleted</code> - Project deleted</li>
          </ul>
          <h3>Task Events</h3>
          <ul>
            <li><code>pm.task.created</code> - New task created</li>
            <li><code>pm.task.updated</code> - Task updated</li>
            <li><code>pm.task.status_changed</code> - Task status changed</li>
            <li><code>pm.task.assigned</code> - Task assigned to user</li>
            <li><code>pm.task.completed</code> - Task marked complete</li>
            <li><code>pm.task.deleted</code> - Task deleted</li>
          </ul>
          <h3>Phase Events</h3>
          <ul>
            <li><code>pm.phase.created</code> - New phase created</li>
            <li><code>pm.phase.updated</code> - Phase updated</li>
            <li><code>pm.phase.transitioned</code> - Phase status transitioned</li>
          </ul>
          <p>
            Configure webhooks via the API endpoints documented in the Swagger UI.
          </p>
        </div>
      </section>

      {/* Support */}
      <section className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
        <p className="text-gray-600 mb-6">
          Check out the full API reference or contact our developer support team.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            View Full API Reference
          </a>
          <a
            href="mailto:dev-support@hyvve.ai"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="relative">
      <div className="absolute top-3 right-3 text-xs text-gray-500 uppercase">
        {language}
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ScopeCard({
  scope,
  description,
  operations,
}: {
  scope: string;
  description: string;
  operations: string[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-primary">
          {scope}
        </code>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <ul className="text-sm text-gray-500 space-y-1">
        {operations.map((op) => (
          <li key={op} className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {op}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExampleCard({
  title,
  description,
  code,
}: {
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="p-4 bg-gray-900">
        <pre className="text-gray-100 text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
