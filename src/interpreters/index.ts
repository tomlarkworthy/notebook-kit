import {dirname, join} from "node:path";
import {nameHash, stringHash} from "../lib/hash.js";
import {getInterpreterExtension} from "../lib/interpreters.js";
import type {Cell} from "../lib/notebook.js";

export async function getInterpreterCachePath(
  sourcePath: string,
  interpreter: string,
  format: Cell["format"],
  input: string
): Promise<string> {
  const sourceDir = dirname(sourcePath);
  const cacheName = `${await nameHash(interpreter)}-${await stringHash(input)}${getInterpreterExtension(format)}`; // TODO avoid conflict with database cache?
  return join(sourceDir, ".observable", "cache", cacheName);
}

export function getInterpreterCommand(interpreter: string): [command: string, args: string[]] {
  switch (interpreter) {
    case "node":
      return ["node", ["--input-type=module", "--permission", "--allow-fs-read=."]];
    case "python":
      return ["python3", []];
    default:
      throw new Error(`unknown interpreter: ${interpreter}`);
  }
}
