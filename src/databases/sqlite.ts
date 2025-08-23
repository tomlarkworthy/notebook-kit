import {join} from "node:path";
import type {StatementSync} from "node:sqlite";
import {DatabaseSync} from "node:sqlite";
import type {DatabaseContext, SQLiteConfig, QueryTemplateFunction} from "./index.js";
import type {ColumnSchema} from "../runtime/index.js";

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

function getColumnType(type: string | null): ColumnSchema["type"] {
  switch (type) {
    case "INT":
    case "INTEGER":
    case "TINYINT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "BIGINT":
    case "UNSIGNED BIG INT":
    case "INT2":
    case "INT8":
      return "integer";
    case "TEXT":
    case "CLOB":
      return "string";
    case "REAL":
    case "DOUBLE":
    case "DOUBLE PRECISION":
    case "FLOAT":
    case "NUMERIC":
      return "number";
    case "BLOB":
      return "buffer";
    case "DATE":
    case "DATETIME":
      return "string"; // TODO convert strings to Date instances in sql.js
    case null:
      return "other";
    default:
      return /^(?:(?:(?:VARYING|NATIVE) )?CHARACTER|(?:N|VAR|NVAR)CHAR)\(/.test(type)
        ? "string"
        : /^(?:DECIMAL|NUMERIC)\(/.test(type)
          ? "number"
          : "other";
  }
}
