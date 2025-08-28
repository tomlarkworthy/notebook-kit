#!/usr/bin/env node

import {mkdir, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {parseArgs} from "node:util";
import {getDatabase, getDatabaseConfig, getQueryCachePath} from "../src/databases/index.js";

if (process.argv[1] === import.meta.filename) run();

export default async function run(args?: string[]): Promise<void> {
  const {values, positionals} = parseArgs({
    args,
    allowPositionals: true,
    allowNegative: true,
    options: {
      root: {
        type: "string",
        default: "."
      },
      database: {
        type: "string"
      },
      help: {
        type: "boolean",
        short: "h"
      }
    }
  });

  if (values.help || !values.database) {
    console.log(`usage: notebooks query <...query>

  --database <name>        name of the database
  --root <dir>             path to the root directory; defaults to cwd
  -h, --help               show this message
`);
    return;
  }

  // Parse positionals into query template arguments.
  const strings: string[] = [];
  const params: unknown[] = [];
  for (let i = 0; i < positionals.length; ++i) {
    if (i & 1) params.push(JSON.parse(positionals[i]));
    else strings.push(positionals[i]);
  }

  try {
    process.chdir(values.root);
    const cachePath = await getQueryCachePath(".", values.database, strings, ...params);
    const config = await getDatabaseConfig(".", values.database);
    const database = await getDatabase(config);
    const results = await database.call(null, strings, ...params);
    await mkdir(dirname(cachePath), {recursive: true});
    await writeFile(cachePath, JSON.stringify(results, replace));
    console.log(join(values.root, cachePath));
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

// Force dates to be serialized as ISO 8601 UTC, undoing this:
// https://github.com/snowflakedb/snowflake-connector-nodejs/blob/a9174fb7/lib/connection/result/sf_timestamp.js#L177-L179
function replace(this: {[key: string]: unknown}, key: string, value: unknown): unknown {
  return this[key] instanceof Date ? Date.prototype.toJSON.call(this[key]) : value;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error &&
    "errors" in error && // AggregateError
    Array.isArray(error.errors) &&
    error.errors.length > 0
    ? String(error.errors[0])
    : String(error);
}
