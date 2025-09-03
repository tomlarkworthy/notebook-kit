import {nameHash, stringHash} from "../../lib/hash.js";
import {getInterpreterExtension} from "../../lib/interpreters.js";
import type {Cell} from "../../lib/notebook.js";
import {FileAttachment} from "./fileAttachment.js";

/** A serializable value that can be interpolated into a query. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InterpreterParam = any;

export interface InterpreterOptionsSpec {
  /** the interpreter format; defaults to "buffer" */
  format?: Cell["format"];
  /** if present, the id of the cell that owns this interpreter */
  id?: number;
  /** if present, results are at least as fresh as the specified date */
  since?: Date | string | number;
}

export interface InterpreterOptions extends InterpreterOptionsSpec {
  since?: Date;
}

export interface Interpreter {
  readonly options: InterpreterOptions;
  run(input: string): Promise<FileAttachment>;
}

export const Interpreter = (name: string, options?: InterpreterOptionsSpec): Interpreter => {
  return new InterpreterImpl(name, normalizeOptions(options));
};

function normalizeOptions({
  format = "buffer",
  id,
  since
}: InterpreterOptionsSpec = {}): InterpreterOptions {
  const options: InterpreterOptions = {format};
  if (id !== undefined) options.id = id;
  if (since !== undefined) options.since = new Date(since);
  return options;
}

class InterpreterImpl implements Interpreter {
  readonly name!: string;
  readonly options!: InterpreterOptions;
  constructor(name: string, options: InterpreterOptions) {
    Object.defineProperties(this, {
      name: {value: name, enumerable: true},
      options: {value: options, enumerable: true}
    });
  }
  async run(input: string): Promise<FileAttachment> {
    return FileAttachment(await this.cachePath(input));
  }
  async cachePath(input: string): Promise<string> {
    const {format} = this.options;
    return `.observable/cache/${await nameHash(this.name)}-${await stringHash(input)}${getInterpreterExtension(format)}`; // TODO avoid conflict with database cache?
  }
}

Interpreter.prototype = InterpreterImpl.prototype; // instanceof
Object.defineProperty(InterpreterImpl, "name", {value: "Interpreter"}); // prevent mangling
