import { describe, it, expect } from "vitest";
import { Runtime } from "@observablehq/runtime";
import { observe } from "./observe.js";
import { input } from "./input.js";

describe("observe", () => {
  it("yields the most recent value", async () => {
    const o = observe((change) => {
      change(1);
      change(2);
    });
    expect((await o.next()).value).toBe(2);
  });

  it("rejects pending promise on return", async () => {
    const o = observe<number>(() => {});
    const pending = o.next();
    await o.return();
    await expect(pending).rejects.toThrow(/Generator returned/);
  });

  it("does not reject if no pending promise on return", async () => {
    const o = observe((change) => {
      change(1);
    });
    expect((await o.next()).value).toBe(1);
    // No pending promise, so return should complete without error
    const result = await o.return();
    expect(result.done).toBe(true);
  });
});

describe("Generators.input runtime integration", () => {
  // Mock input element compatible with Generators.input
  function createMockInput(initialValue: unknown) {
    const listeners = new Map<string, Array<(event: { type: string }) => void>>();
    return {
      value: initialValue,
      addEventListener(type: string, fn: (event: { type: string }) => void) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type)!.push(fn);
      },
      removeEventListener(type: string, fn: (event: { type: string }) => void) {
        const arr = listeners.get(type);
        if (arr) {
          const idx = arr.indexOf(fn);
          if (idx >= 0) arr.splice(idx, 1);
        }
      },
      dispatchEvent(event: { type: string }) {
        const arr = listeners.get(event.type);
        if (arr) arr.forEach((fn) => fn(event));
      },
    };
  }

  it("should not deadlock when upstream generator with undefined initial value is recomputed", async () => {
    const runtime = new Runtime();
    const main = runtime.module();

    const events: string[] = [];

    // viewof trigger - initial "tick", changes to "tock" after delay
    main.variable().define("viewof trigger", [], () => {
      events.push("viewof trigger: creating");
      const view = createMockInput("tick");
      setTimeout(() => {
        events.push("viewof trigger: dispatching tock");
        view.value = "tock";
        view.dispatchEvent({ type: "input" });
      }, 50);
      return view;
    });

    // trigger - generator using Generators.input
    main.variable().define("trigger", ["viewof trigger"], (view: Element) => {
      events.push("trigger: starting generator");
      return input(view);
    });

    // viewof item - depends on trigger, has UNDEFINED initial value
    main.variable().define("viewof item", ["trigger"], (trigger: string) => {
      events.push(`viewof item: creating (trigger=${trigger})`);
      const view = createMockInput(undefined); // Key: undefined initial value

      if (trigger === "tock") {
        setTimeout(() => {
          events.push("viewof item: dispatching foo");
          view.value = "foo";
          view.dispatchEvent({ type: "input" });
        }, 50);
      }
      return view;
    });

    // item - generator using Generators.input (will have undefined first)
    main.variable().define("item", ["viewof item"], (view: Element) => {
      events.push("item: starting generator");
      return input(view);
    });

    // display - should receive item's value
    let displayValue: unknown;
    let displayCount = 0;
    main.variable({
      fulfilled: (value: unknown) => {
        displayCount++;
        displayValue = value;
        events.push(`display: fulfilled with ${value}`);
      },
    }).define("display", ["item"], (item: unknown) => {
      events.push(`display: computing (item=${item})`);
      return item;
    });

    // Wait for the full sequence to complete
    // If there's a deadlock, the test will timeout
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify the display received "foo" eventually
    expect(events).toContain("display: fulfilled with foo");
    expect(displayValue).toBe("foo");
  }, 5000);
});
