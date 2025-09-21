export const ModuleKind = {};
export const ScriptTarget = {};
export const transpile = () => '';
export const createProgram = () => ({
  getSourceFile: () => undefined,
  emit: () => ({ emitSkipped: true }),
  getSyntacticDiagnostics: () => [],
  getSemanticDiagnostics: () => [],
  getDeclarationDiagnostics: () => [],
});
export const createSourceFile = () => undefined;
export const isClassExpression = () => false;
export const isFunctionExpression = () => false;
export const isParenthesizedExpression = () => false;
export const isExpressionStatement = () => false;
export default {};
