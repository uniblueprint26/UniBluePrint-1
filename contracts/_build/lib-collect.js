/**
 * Capture-mode stand-in for lib.js, used only by build-merged.js.
 *
 * Re-exports every real paragraph/table/signature builder unchanged (they
 * produce the same docx.js objects either way), and overrides only build()
 * so it records {file, title, ref, children} into a shared registry instead
 * of packing and writing a standalone .docx. Swapped into the require cache
 * under lib.js's resolved path — the same technique build-html.js uses to
 * retarget the c-*.js content modules without touching their source.
 */

const real = require('./lib')

const REGISTRY = []

async function build({ file, title, ref, children }) {
  REGISTRY.push({ file, title, ref, children: children.flat() })
  return file
}

module.exports = { ...real, build, __registry: REGISTRY }
