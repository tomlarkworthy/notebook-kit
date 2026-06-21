import {assert, test} from "vitest";
import {addStableResolutions, dedollar} from "./observable.js";

test("addStableResolutions pins Observable API imports to one resolution context", () => {
  // Without a resolutions argument the API stamps a per-importer context, which
  // forks shared transitive modules; a constant context makes them dedupe.
  assert.strictEqual(
    addStableResolutions("https://api.observablehq.com/@u/nb.js?v=4"),
    "https://api.observablehq.com/@u/nb.js?v=4&resolutions=0000000000000000@0"
  );
  assert.strictEqual(
    addStableResolutions("https://api.observablehq.com/d/2d6bf7be248d66f3@173.js?v=4"),
    "https://api.observablehq.com/d/2d6bf7be248d66f3@173.js?v=4&resolutions=0000000000000000@0"
  );
  // does not override an explicit resolutions argument
  assert.strictEqual(
    addStableResolutions("https://api.observablehq.com/@u/nb.js?v=4&resolutions=abc123@7"),
    "https://api.observablehq.com/@u/nb.js?v=4&resolutions=abc123@7"
  );
  // leaves non-Observable imports untouched
  assert.strictEqual(addStableResolutions("npm:d3"), "npm:d3");
  assert.strictEqual(addStableResolutions("https://cdn.jsdelivr.net/npm/d3/+esm"), "https://cdn.jsdelivr.net/npm/d3/+esm");
});

test("unescapes dollar signs in imported symbols", () => {
  assert.strictEqual(dedollar("viewof$foo"), "viewof foo");
  assert.strictEqual(dedollar("viewof$"), "viewof ");
  assert.strictEqual(dedollar("$viewof"), " viewof");
  assert.strictEqual(dedollar("viewof$$foo"), "viewof$foo");
  assert.strictEqual(dedollar("viewof$$$foo"), "viewof$$foo");
  assert.strictEqual(dedollar("$"), " ");
  assert.strictEqual(dedollar("$$"), "$");
  assert.strictEqual(dedollar("$$$"), "$$");
  assert.strictEqual(dedollar("$$_"), "$_");
});
