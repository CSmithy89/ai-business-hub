#!/usr/bin/env npx ts-node
/**
 * Widget Type Validation Script
 *
 * Validates that widget type definitions are synchronized across:
 * - packages/shared/src/types/widget.ts (TypeScript source of truth)
 * - packages/shared/widget-types.json (Python sync file)
 * - apps/web/src/components/slots/widget-registry.tsx (React components)
 *
 * DM-08.5: Created to ensure consistency across the stack.
 *
 * Usage: npx ts-node scripts/validate-widget-types.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Import widget types from shared package
import { WIDGET_TYPE_LIST } from '../packages/shared/src/types/widget';

const PROJECT_ROOT = path.resolve(__dirname, '..');

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate JSON file matches TypeScript definitions.
 */
function validateJsonFile(): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  const jsonPath = path.join(PROJECT_ROOT, 'packages', 'shared', 'widget-types.json');

  if (!fs.existsSync(jsonPath)) {
    result.errors.push(`Missing widget-types.json at ${jsonPath}`);
    result.valid = false;
    return result;
  }

  try {
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const jsonTypes: string[] = jsonContent.types || [];

    // Check for missing types in JSON
    for (const type of WIDGET_TYPE_LIST) {
      if (!jsonTypes.includes(type)) {
        result.errors.push(`Missing in widget-types.json: ${type}`);
        result.valid = false;
      }
    }

    // Check for extra types in JSON
    for (const type of jsonTypes) {
      if (!WIDGET_TYPE_LIST.includes(type as typeof WIDGET_TYPE_LIST[number])) {
        result.errors.push(`Extra type in widget-types.json not in TypeScript: ${type}`);
        result.valid = false;
      }
    }

    // Check order matches
    if (result.valid && JSON.stringify(jsonTypes) !== JSON.stringify(WIDGET_TYPE_LIST)) {
      result.warnings.push('Widget types order differs between TypeScript and JSON');
    }
  } catch (e) {
    result.errors.push(`Failed to parse widget-types.json: ${e}`);
    result.valid = false;
  }

  return result;
}

/**
 * Validate widget registry has components for all types.
 */
function validateWidgetRegistry(): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  const registryPath = path.join(
    PROJECT_ROOT,
    'apps',
    'web',
    'src',
    'components',
    'slots',
    'widget-registry.tsx'
  );

  if (!fs.existsSync(registryPath)) {
    result.errors.push(`Missing widget-registry.tsx at ${registryPath}`);
    result.valid = false;
    return result;
  }

  const content = fs.readFileSync(registryPath, 'utf-8');

  // Check each widget type is registered
  for (const type of WIDGET_TYPE_LIST) {
    // Look for patterns like: 'ProjectStatus': ... or "ProjectStatus": ...
    const pattern = new RegExp(`['"]${type}['"]\\s*:`);
    if (!pattern.test(content)) {
      result.warnings.push(`Widget type '${type}' may not be registered in widget-registry.tsx`);
    }
  }

  return result;
}

/**
 * Main validation entry point.
 */
function main(): void {
  console.log('Validating widget type definitions...\n');

  let hasErrors = false;

  // Validate JSON sync file
  console.log('Checking packages/shared/widget-types.json...');
  const jsonResult = validateJsonFile();
  if (jsonResult.errors.length > 0) {
    hasErrors = true;
    jsonResult.errors.forEach((e) => console.error(`  ERROR: ${e}`));
  }
  jsonResult.warnings.forEach((w) => console.warn(`  WARNING: ${w}`));
  if (jsonResult.valid && jsonResult.warnings.length === 0) {
    console.log('  OK\n');
  } else {
    console.log('');
  }

  // Validate widget registry
  console.log('Checking apps/web/src/components/slots/widget-registry.tsx...');
  const registryResult = validateWidgetRegistry();
  if (registryResult.errors.length > 0) {
    hasErrors = true;
    registryResult.errors.forEach((e) => console.error(`  ERROR: ${e}`));
  }
  registryResult.warnings.forEach((w) => console.warn(`  WARNING: ${w}`));
  if (registryResult.valid && registryResult.warnings.length === 0) {
    console.log('  OK\n');
  } else {
    console.log('');
  }

  // Summary
  console.log('---');
  console.log(`Widget types defined: ${WIDGET_TYPE_LIST.length}`);
  console.log(`Types: ${WIDGET_TYPE_LIST.join(', ')}`);
  console.log('---\n');

  if (hasErrors) {
    console.error('Widget type validation FAILED');
    process.exit(1);
  } else {
    console.log('Widget type validation PASSED');
    process.exit(0);
  }
}

main();
