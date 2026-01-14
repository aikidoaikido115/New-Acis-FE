import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'bun:test' {
  interface Matchers<R = unknown, T = {}> extends TestingLibraryMatchers<R, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}