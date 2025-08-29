import {DBSQLClient, DBSQLLogger, LogLevel, thrift} from "@databricks/sql";
import type {DBSQLSession} from "@databricks/sql";
import type {DatabricksConfig, QueryTemplateFunction} from "./index.js";
import {ColumnSchema} from "../runtime/index.js";

type IOperation = Awaited<ReturnType<DBSQLSession["executeStatement"]>>;
type TTableSchema = NonNullable<Awaited<ReturnType<IOperation["getSchema"]>>>;
type TColumnDesc = TTableSchema["columns"][0];
type TTypeDesc = TColumnDesc["typeDesc"];
const TTypeId = thrift.TCLIService_types.TTypeId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function databricks({type, ...options}: DatabricksConfig): QueryTemplateFunction {
  return async (strings, ...params) => {
    const logger = new DBSQLLogger({level: LogLevel.error});
    const client = new DBSQLClient({logger});
    await client.connect(options);
    try {
      const session = await client.openSession();
      try {
        const date = new Date();
        const operation = await session.executeStatement(strings.join("?"), {
          runAsync: true,
          ordinalParameters: params,
          maxRows: 10000
        });
        try {
          const rows = (await operation.fetchAll()) as Record<string, unknown>[];
          const schema = await operation.getSchema();
          return {rows, schema: getTableSchema(schema!), duration: Date.now() - +date, date};
        } finally {
          await operation.close();
        }
      } finally {
        await session.close();
      }
    } finally {
      await client.close();
    }
  };
}

function getTableSchema({columns}: TTableSchema): ColumnSchema[] {
  return columns.map(getColumnSchema);
}

function getColumnSchema(column: TColumnDesc): ColumnSchema {
  return {name: column.columnName, type: getColumnType(column.typeDesc)};
}

function getColumnType({types: [type]}: TTypeDesc): ColumnSchema["type"] {
  switch (type.primitiveEntry?.type) {
    case TTypeId.BINARY_TYPE:
      return "buffer";
    case TTypeId.BOOLEAN_TYPE:
      return "boolean";
    case TTypeId.BIGINT_TYPE:
    case TTypeId.TINYINT_TYPE:
    case TTypeId.SMALLINT_TYPE:
    case TTypeId.INT_TYPE:
    case TTypeId.DECIMAL_TYPE:
      return "integer";
    case TTypeId.DOUBLE_TYPE:
    case TTypeId.FLOAT_TYPE:
      return "number";
    case TTypeId.DATE_TYPE:
    case TTypeId.TIMESTAMP_TYPE:
    case TTypeId.INTERVAL_DAY_TIME_TYPE:
    case TTypeId.INTERVAL_YEAR_MONTH_TYPE:
      return "date";
    default:
      return "string";
  }
}
