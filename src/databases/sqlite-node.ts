import {join} from "node:path";
import type {StatementSync} from "node:sqlite";
import {DatabaseSync} from "node:sqlite";
import type {DatabaseContext, SQLiteConfig, QueryTemplateFunction} from "./index.js";
import type {ColumnSchema} from "../runtime/index.js";
import {getColumnType} from "./sqlite.js";

export default function sqlite(
  {path = ":memory:"}: SQLiteConfig,
  context: DatabaseContext
): QueryTemplateFunction {
  if (path !== undefined) path = join(context.cwd, path);
  return async (strings, ...params) => {
    const date = new Date();
    const database = new DatabaseSync(path);
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

function getStatementSchema(statement: StatementSync): ColumnSchema[] {
  return statement
    .columns()
    .map((column) => ({name: column.name, type: getColumnType(column.type)}));
}
