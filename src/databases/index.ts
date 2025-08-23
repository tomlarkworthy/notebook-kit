import {createReadStream} from "node:fs";
import {dirname, join} from "node:path";
import {json} from "node:stream/consumers";
import {isEnoent} from "../lib/error.js";
import {hash as getQueryHash, nameHash as getNameHash} from "../lib/hash.js";
import type {ColumnSchema, QueryParam} from "../runtime/index.js";

export {hash as getQueryHash, nameHash as getNameHash} from "../lib/hash.js";

export type DatabaseConfig = DuckDBConfig | SQLiteConfig | SnowflakeConfig | PostgresConfig;

export type DuckDBConfig = {
  type: "duckdb";
  path?: string;
  options?: {[key: string]: string}; // https://duckdb.org/docs/stable/configuration/overview.html
};

export type SQLiteConfig = {
  type: "sqlite";
  path?: string;
};

export type SnowflakeConfig = {
  type: "snowflake";
  account: string;
  database?: string;
  role?: string;
  schema?: string;
  username?: string;
  warehouse?: string;
  password?: string;
};

export type PostgresConfig = {
  type: "postgres";
  host?: string;
  port?: string | number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
};

export type DatabaseContext = {
  cwd: string;
};

export type QueryTemplateFunction = (
  strings: readonly string[],
  ...params: QueryParam[]
) => Promise<SerializableQueryResult>;

export type SerializableQueryResult = {
  rows: Record<string, unknown>[];
  schema: ColumnSchema[];
  duration: number;
  date: Date;
};

export async function getDatabaseConfig(
  sourcePath: string,
  databaseName: string
): Promise<DatabaseConfig> {
  const sourceDir = dirname(sourcePath);
  const configPath = join(sourceDir, ".observable", "databases.json");
  let config: DatabaseConfig | undefined;
  try {
    const configStream = createReadStream(configPath, "utf-8");
    const configs = (await json(configStream)) as Record<string, DatabaseConfig>;
    config = configs[databaseName];
  } catch (error) {
    if (!isEnoent(error)) throw error;
  }
  if (config === undefined) {
    if (databaseName === "postgres") config = {type: "postgres"};
    else if (databaseName === "duckdb") config = {type: "duckdb"};
    else if (databaseName === "sqlite") config = {type: "sqlite"};
    else if (/\.duckdb$/i.test(databaseName)) config = {type: "duckdb", path: databaseName};
    else if (/\.db$/i.test(databaseName)) config = {type: "sqlite", path: databaseName}; // TODO disambiguate
    else throw new Error(`database not found: ${databaseName}`);
  }
  return config;
}

export async function getDatabase(
  config: DatabaseConfig,
  context: DatabaseContext
): Promise<QueryTemplateFunction> {
  switch (config.type) {
    case "duckdb":
      return (await import("./duckdb.js")).default(config, context);
    case "sqlite":
      return (await import(process.versions.bun ? "./sqlite-bun.js" : "./sqlite-node.js")).default(config, context);
    case "snowflake":
      return (await import("./snowflake.js")).default(config);
    case "postgres":
      return (await import("./postgres.js")).default(config);
    default:
      throw new Error(`unsupported database type: ${config["type"]}`);
  }
}

export async function getQueryCachePath(
  sourcePath: string,
  databaseName: string,
  strings: readonly string[],
  ...params: unknown[]
): Promise<string> {
  const sourceDir = dirname(sourcePath);
  const cacheName = `${await getNameHash(databaseName)}-${await getQueryHash(strings, ...params)}.json`;
  return join(sourceDir, ".observable", "cache", cacheName);
}
