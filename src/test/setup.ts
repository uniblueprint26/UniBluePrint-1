// Vitest global setup. Referenced by vitest.config.ts's `test.setupFiles`.
// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
// for any component tests written against this harness.
import "@testing-library/jest-dom";
