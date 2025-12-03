// Mock for @paralleldrive/cuid2
let counter = 0;

export const createId = jest.fn(() => `mock-cuid-${++counter}`);
export const init = jest.fn();
export const getConstants = jest.fn();
export const isCuid = jest.fn((str: string) => str.startsWith('mock-cuid-'));
