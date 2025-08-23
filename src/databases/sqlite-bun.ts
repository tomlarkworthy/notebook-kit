import {join} from "node:path";
import type {Statement} from "bun:sqlite";
import {Database} from "bun:sqlite";
import type {DatabaseContext, SQLiteConfig, QueryTemplateFunction} from "./index.js";
import type {ColumnSchema} from "../runtime/index.js";
import {getColumnType} from "./sqlite.js";

export default function sqlite(
  {path}: SQLiteConfig,
  context: DatabaseContext
): QueryTemplateFunction {
  return async (strings, ...params) => {
    const date = new Date();
    const database = new Database(path === undefined ? ":memory:" : join(context.cwd, path));
    try {
      const statement = database.prepare(strings.join("?"));
      const rows = statement.all(...params) as Record<string, unknown>[];
      return {
        rows,
        schema: getStatementSchema(statement),
        duration: Date.now() - +date,
        date
      };
    } finally {
      database.close();
    }
  };
}

function getStatementSchema(statement: Statement): ColumnSchema[] {
  return statement.columnNames.map((name, i) => ({
    name,
    type: getColumnType(statement.columnTypes[i])
  }));
}
