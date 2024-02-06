export type NodeType =
  | "Program"
  | "VariableDeclaration"
  | "ArrayDeclaration"
  | "FunctionDeclaration"
  | "ProcedureDeclaration"
  | "IfStatement"
  | "ReturnStatement"
  | "ForLoop"
  | "WhileLoop"
  | "DoUntilLoop"
  | "SwitchStatement"
  | "CaseStatement"

  // Expressions
  | "AssignmentExpression"
  | "NullLiteral"
  | "NumericLiteral"
  | "FloatLiteral"
  | "StringLiteral"
  | "Identifier"
  | "BinaryExpression"
  | "UnaryExpression"
  | "MemberExpression"
  | "CallExpression"
  | "RangeExpression"

export interface Statement {
    kind: NodeType
}

export interface Program extends Statement {
    kind: "Program",
    body: Statement[]
}

export interface VariableDeclaration extends Statement {
    kind: "VariableDeclaration",
    identifier: string,
    value: Expression
}

export interface FunctionDeclaration extends Statement {
    kind: "FunctionDeclaration",
    identifier: string,
    parameters: string[], // TODO: change to array of objects so params can be passed as value/refrence
    body: Statement[]
}
export interface ProcedureDeclaration extends Statement {
    kind: "ProcedureDeclaration",
    identifier: string,
    parameters: string[], // TODO: change to array of objects so params can be passed as value/refrence
    body: Statement[]
}

export interface ArrayDeclaration extends Statement {
    kind: "ArrayDeclaration",
    identifier: string,
    dimensions: Expression[]
}

export interface IfStatement extends Statement {
    kind: "IfStatement",
    condition: Expression,
    then: Statement[],
    else: Statement[] | null,
}
export interface SwitchStatement extends Statement {
    kind: "SwitchStatement",
    discriminant: Expression,
    cases: CaseStatement[]
}

export interface CaseStatement extends Statement {
    kind: "CaseStatement",
    test: Expression | null,
    then: Statement[]
}

export interface ForLoop extends Statement {
    kind: "ForLoop",
    variable: string,
    initial_value: Expression,
    end_value: Expression,
    body: Statement[]
}

export interface WhileLoop extends Statement {
    kind: "WhileLoop"
    condition: Expression
    body: Statement[]
}
export interface DoUntilLoop extends Statement {
    kind: "DoUntilLoop"
    condition: Expression
    body: Statement[]
}

export interface ReturnStatement extends Statement {
    kind: "ReturnStatement",
    value: Expression
}

export interface AssignmentExpression extends Expression {
    kind: "AssignmentExpression",
    assign_to: Expression,
    value: Expression
}

export interface MemberExpression extends Expression {
    kind: "MemberExpression",
    object: Expression,
    property: Expression,
    computed: boolean
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression",
    left: Expression,
    right: Expression,
    operator: string
}

export interface RangeExpression extends Expression {
    kind: "RangeExpression",
    left: Expression,
    right: Expression
}

export interface UnaryExpression extends Expression {
    kind: "UnaryExpression",
    right: Expression,
    operator: string
}

export interface CallExpression extends Expression {
    kind: "CallExpression",
    caller: Expression,
    arguments: Expression[],
}

export interface Identifier extends Expression {
    kind: "Identifier",
    symbol: string
}

export interface NumericLiteral extends Expression {
    kind: "NumericLiteral",
    value: Number
}
export interface FloatLiteral extends Expression {
    kind: "FloatLiteral",
    value: Number
}

export interface StringLiteral extends Expression {
    kind: "StringLiteral"
    value: string
}

export interface NullLiteral extends Expression {
    kind: "NullLiteral",
    value: "null"
}