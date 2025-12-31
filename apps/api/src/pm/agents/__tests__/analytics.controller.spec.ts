import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsController } from '../analytics.controller';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

// Throttler metadata keys (not exported from @nestjs/throttler in newer versions)
const THROTTLER_LIMIT = 'THROTTLER:LIMIT:';
const THROTTLER_TTL = 'THROTTLER:TTL:';

describe('AnalyticsController metadata', () => {
  it('applies guard chain for auth, tenancy, roles, and throttling', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AnalyticsController) || [];
    expect(guards).toEqual(expect.arrayContaining([ThrottlerGuard, AuthGuard, TenantGuard, RolesGuard]));
  });

  it('applies long throttle defaults at controller level', () => {
    const limit = Reflect.getMetadata(THROTTLER_LIMIT + 'long', AnalyticsController);
    const ttl = Reflect.getMetadata(THROTTLER_TTL + 'long', AnalyticsController);

    expect(limit).toBe(60);
    expect(ttl).toBe(60000);
  });

  it('applies medium throttle to forecast endpoints', () => {
    const forecastHandler = AnalyticsController.prototype.generateForecast;
    const scenarioHandler = AnalyticsController.prototype.getScenarioForecast;

    expect(Reflect.getMetadata(THROTTLER_LIMIT + 'medium', forecastHandler)).toBe(10);
    expect(Reflect.getMetadata(THROTTLER_TTL + 'medium', forecastHandler)).toBe(60000);
    expect(Reflect.getMetadata(THROTTLER_LIMIT + 'medium', scenarioHandler)).toBe(10);
    expect(Reflect.getMetadata(THROTTLER_TTL + 'medium', scenarioHandler)).toBe(60000);
  });

  it('requires roles for forecast endpoint', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, AnalyticsController.prototype.generateForecast);
    expect(roles).toEqual(expect.arrayContaining(['owner', 'admin', 'member']));
  });
});
