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
