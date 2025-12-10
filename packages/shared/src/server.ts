/**
 * @hyvve/shared/server - Server-side utilities for HYVVE Platform
 *
 * This module exports utilities that depend on Node.js built-in modules
 * (like node:crypto) and should ONLY be imported in server-side code.
 *
 * DO NOT import this in client-side components or it will break bundling.
 *
 * @packageDocumentation
 */

// Re-export everything from the main package
export * from './index';

// Server-only utilities
export * from './utils/credential-encryption';
