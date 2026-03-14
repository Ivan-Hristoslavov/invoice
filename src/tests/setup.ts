import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// jsdom exposes requestSubmit but throws "Not implemented", so override it.
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  configurable: true,
  value: function (submitter?: HTMLElement | null) {
    if (submitter) {
      submitter.click();
      return;
    }

    this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
});

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => server.close()); 