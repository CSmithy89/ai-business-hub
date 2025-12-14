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
    expect(true).toBe(true)
  })
})

