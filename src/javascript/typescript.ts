import {ModuleKind, ScriptTarget, transpile} from "typescript";

export function transpileTypeScript(input: string): string {
  return transpile(input, {
    target: ScriptTarget.ESNext,
    module: ModuleKind.Preserve,
    verbatimModuleSyntax: true
  });
}
