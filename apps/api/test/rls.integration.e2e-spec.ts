/**
 * RLS Integration Tests (Manual / DB-backed)
 *
 * These tests require a real Postgres database with:
 * - Prisma migrations applied
 * - RLS policies enabled
 * - Seeded workspaces/users where needed
 *
 * They are intentionally skipped by default to avoid failing unit test runs.
 */

describe.skip('RLS Integration Tests (DB-backed)', () => {
  it('requires a configured Postgres database', () => {
    // Fail fast when a DB isn't configured for manual runs.
    expect(process.env.POSTGRES_URL).toBeDefined()
  })
})
