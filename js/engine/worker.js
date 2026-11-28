// engine/worker.js
// Runs the first-principles reactor off the main thread. The UI falls back to
// a direct import if module workers are unavailable (e.g. file:// previews).

import { react } from './reactor.js';

self.onmessage = (event) => {
  const { id, input } = event.data || {};
  try {
    const result = react(input);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error?.message || String(error),
      stack: error?.stack || null,
    });
  }
};
