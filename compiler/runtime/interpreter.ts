import { ValueType, RuntimeValue, IntegerValue, NullValue, MAKE_ARRAY, NativeFunctionValue, StringValue, BooleanValue, FunctionValue, ProcedureValue, prototype, NativeGetterValue, NativeMethodValue, ArrayValue, is_truthy, FloatValue } from "./values"
import { ArrayDeclaration, AssignmentExpression, BinaryExpression, CallExpression, DoUntilLoop, Expression, ForLoop, FunctionDeclaration, Identifier, IfStatement, MemberExpression, NodeType, NullLiteral, NumericLiteral, ProcedureDeclaration, Program, ReturnStatement, Statement, StringLiteral, SwitchStatement, UnaryExpression, VariableDeclaration, WhileLoop } from "../reader/ast"
import Environment from "./environment"
import {error} from "../errors"
import { updateObjKeepingRef } from "../utils"

function evaluate_program(program: Program, environment: Environment): RuntimeValue {
    let last_evaluated: RuntimeValue = { type: "null", value: null } as NullValue

    for (const statement of program.body) {
        last_evaluated = evaluate(statement, environment)
    }
    return last_evaluated
}

function evaluate_binary_expression(binary_operation: BinaryExpression, environment: Environment): RuntimeValue {
    const left = evaluate(binary_operation.left, environment)
    const right = evaluate(binary_operation.right, environment)

    const is_numeric = (left.type == "integer" || left.type == "float") && (right.type == "integer" || right.type == "float")
    const is_string_comparison = left.type == "string" && right.type == "string"

    if (binary_operation.operator == "==") {
        const equal = left.value === right.value
        return {
            type: "boolean",
            value: equal
        } as BooleanValue
    } else if (binary_operation.operator == "!=") {
        const not_equal = left.value !== right.value
        return {
            type: "boolean",
            value: not_equal
        } as BooleanValue
    } else if (binary_operation.operator == ">") {
        if (!(is_numeric || is_string_comparison)) {
            error("runtime", `Comparison operator ${binary_operation.operator} can only be used between two numbers or two strings.`)
        }
        const value = left.value > right.value
        return {
            type: "boolean",
            value
        } as BooleanValue
    } else if (binary_operation.operator == "<") {
        if (!(is_numeric || is_string_comparison)) {
            error("runtime", `Comparison operator ${binary_operation.operator} can only be used between two numbers or two strings.`)
        }
        const value = left.value < right.value
        return {
            type: "boolean",
            value
        } as BooleanValue
    } else if (binary_operation.operator == "<=") {
        if (!(is_numeric || is_string_comparison)) {
            error("runtime", `Comparison operator ${binary_operation.operator} can only be used between two numbers or two strings.`)
        }
        const value = left.value <= right.value
        return {
            type: "boolean",
            value
        } as BooleanValue
    } else if (binary_operation.operator == ">=") {
        if (!(is_numeric || is_string_comparison)) {
            error("runtime", `Comparison operator ${binary_operation.operator} can only be used between two numbers or two strings.`)
        }
        const value = left.value >= right.value
        return {
            type: "boolean",
            value
        } as BooleanValue
    } else if (is_numeric) {
        return evaluate_numeric_binary_expression(left as IntegerValue, right as IntegerValue, binary_operation.operator)
    } else if (left.type == "string" && right.type == "string") {
        return evaluate_string_binary_expression(left as StringValue, right as StringValue, binary_operation.operator)
    } else if (left.type == "boolean" && right.type == "boolean") {
        return evaluate_boolean_binary_expression(left as BooleanValue, right as BooleanValue, binary_operation.operator)
    } else {
        error("runtime", `Operator "${binary_operation.operator}" is not supported between types of ${left.type} and ${right.type}`)
    }

    return { "type": "null", "value": null } as NullValue
}

function evaluate_unary_expression(unary_operation: UnaryExpression, environment: Environment): RuntimeValue {
    const right = evaluate(unary_operation.right, environment)

    if (unary_operation.operator == "NOT") {
        return {
            type: "boolean",
            value: !is_truthy(right)
        } as BooleanValue
    } else if (unary_operation.operator == "-" && right.type == "integer") {
        return {
            type: "integer",
            value: (right as IntegerValue).value * -1
        } as IntegerValue
    } else if (unary_operation.operator == "+" && right.type == "integer") {
        return right
    } else {
        error("runtime", `Operator ${unary_operation.operator} not supported on type of ${right.type}`)
    }

    return { "type": "null", "value": null } as NullValue
}

function evaluate_numeric_binary_expression(left: IntegerValue | FloatValue, right: IntegerValue | FloatValue, operator: string): IntegerValue | FloatValue {
    let result: number
    let is_float = left.type == "float" || right.type == "float"
    if (operator == "+") {
        result = left.value + right.value
    } else if (operator == "-") {
        result = left.value - right.value
    } else if (operator == "*") {
        result = left.value * right.value
    } else if (operator == "/") {
        // TODO: Division by 0 check
        result = left.value / right.value
        is_float = true
    } else if (operator == "MOD") {
        // TODO: Division by 0 check
        result = left.value % right.value
    } else if (operator == "DIV") {
        result = ~~(left.value / right.value)
    } else if (operator == "^") {
        result = left.value ** right.value
    } else {
        error("runtime", `(Internal) Unrecognised operator "${operator}"`)
    }

    if (!Number.isInteger(result)) is_float = true

    return {
        type: is_float ? "float" : "integer", value: result
    }
}

function evaluate_string_binary_expression(left: StringValue, right: StringValue, operator: string): StringValue {
    let result: string
    if (operator == "+") {
        result = left.value + right.value
    } else {
        error("runtime", "Unrecognised operator for operating beween types of string and string " + operator)
    }

    return {
        type: "string", value: result
    }
}

function evaluate_boolean_binary_expression(left: BooleanValue, right: BooleanValue, operator: string): BooleanValue {
    let result: boolean
    if (operator == "AND") {
        result = left.value && right.value
    } else if (operator == "OR") {
        result = left.value || right.value
    } else {
        error("runtime", "Unrecognised operator for operating beween types of string and string " + operator)
    }

    return {
        type: "boolean", value: result
    }
}

function evaluate_identifier(identifier: Identifier, environment: Environment): RuntimeValue {
    const value = environment.lookupVariable(identifier.symbol)
    return value
}

function evaluate_call_expression(call_expression: CallExpression, environment: Environment): RuntimeValue {
    if (call_expression.caller.kind != "Identifier" && call_expression.caller.kind != "MemberExpression") {
        error("runtime", `Only identifiers are supported in call expressions, ${call_expression.caller.kind} is not supported.`)
    }

    const argument_list = call_expression.arguments.map((arg) => evaluate(arg, environment));
    const caller = evaluate(call_expression.caller, environment);

    if (caller.type === "native-function") {
        const func = evaluate(call_expression.caller, environment) as NativeFunctionValue
        const result = func.call(argument_list, environment);
        return result;
    } else if (caller.type === "function") {
        const func = evaluate(call_expression.caller, environment) as FunctionValue
        const function_scope = new Environment(func.parent_scope, {is_function: true})

        for (const index in func.parameters) {
            const parameter = func.parameters[index]
            const argument = argument_list[index]

            if (argument == undefined) {
                error("runtime", `Parameter ${parameter} has not been provided to function.`)
            }

            function_scope.assignVariable(
                parameter, argument
            )
        }

        let return_value: RuntimeValue = {
            type: "null",
            value: null
        } as NullValue

        for (const statement of (func as FunctionValue).body) {
            evaluate(statement, function_scope)
            
            if (function_scope.terminated) {
                return_value = function_scope.return_value ?? return_value
                break
            }
        }

        return return_value

    } else if (caller.type == "procedure") {
        const procedure = evaluate(call_expression.caller, environment) as ProcedureValue
        const function_scope = new Environment(procedure.parent_scope)

        for (const index in procedure.parameters) {
            const parameter = procedure.parameters[index]
            const argument = argument_list[index]

            if (argument == undefined) {
                error("runtime", `Parameter ${parameter} has not been provided to function.`)
            }

            function_scope.assignVariable(
                parameter, argument
            )
        }

        for (const statement of procedure.body) {
            evaluate(statement, function_scope)
        }

        return {
            type: "null",
            value: null
        } as NullValue
    } else if (caller.type === "native-method") {

        const func = evaluate(call_expression.caller, environment) as NativeMethodValue
        const object = evaluate(call_expression.caller.object, environment) as RuntimeValue

        const result = func.call(object, argument_list, environment);
        return result;
    } else {
        error("runtime", `Can only call functions or procedures, not values of type ${caller.type}`)
    }
}

export function evaluate(ast_node: Statement, environment: Environment): RuntimeValue {
    switch (ast_node.kind) {
        case "BinaryExpression":
            return evaluate_binary_expression(ast_node as BinaryExpression, environment)
        case "UnaryExpression":
            return evaluate_unary_expression(ast_node as UnaryExpression, environment)
        case "NumericLiteral":
            return {
                type: "integer",
                value: ((ast_node as NumericLiteral).value)
            } as IntegerValue
        case "FloatLiteral":
            return {
                type: "float",
                value: ((ast_node as NumericLiteral).value)
            } as FloatValue
        case "StringLiteral":
            return {
                type: "string",
                value: ((ast_node as StringLiteral).value)
            } as StringValue
        case "Identifier":
            return evaluate_identifier(ast_node as Identifier, environment)
        case "AssignmentExpression":
            return evaluate_variable_assignment(ast_node as AssignmentExpression, environment)
        case "CallExpression":
            return evaluate_call_expression(ast_node as CallExpression, environment)
        case "MemberExpression": 
            return evaluate_member_expression(ast_node as MemberExpression, environment)
        case "IfStatement":
            return evaluate_if_statement(ast_node as IfStatement, environment)
        case "SwitchStatement":
            return evaluate_switch_statement(ast_node as SwitchStatement, environment)
        case "NullLiteral":
            return {
                type: "null",
                value: null
            } as NullValue
        case "Program":
            return evaluate_program(ast_node as Program, environment)
        case "VariableDeclaration":
            return evaluate_variable_declaration(ast_node as VariableDeclaration, environment)
        case "ArrayDeclaration":
            return evaluate_array_declaration(ast_node as ArrayDeclaration, environment)
        case "FunctionDeclaration":
            return evaluate_function_declaration(ast_node as FunctionDeclaration, environment)
        case "ProcedureDeclaration":
            return evaluate_procedure_declaration(ast_node as ProcedureDeclaration, environment)
        case "ForLoop":
            return evaluate_for_statement(ast_node as ForLoop, environment)
        case "WhileLoop":
            return evaluate_while_statement(ast_node as WhileLoop, environment)
        case "DoUntilLoop":
            return evaluate_do_until_statement(ast_node as DoUntilLoop, environment)
        case "ReturnStatement":
            environment.returnValue(evaluate((ast_node as ReturnStatement).value, environment))
            return {
                type: "null",
                value: null
            } as NullValue
        default:
            error("runtime", "(Internal) AST node not set up for interpretation " + ast_node)
    }
}

function evaluate_for_statement(loop: ForLoop, environment: Environment): NullValue {
    const loop_scope = new Environment(environment)
    const initial_value = evaluate(loop.initial_value, environment)
    const end_value = evaluate(loop.end_value, environment)
    if (initial_value.type != "integer") {
        error("runtime", "Variable in for loops must be initialised with an integer type.")
    }
    if (end_value.type != "integer") {
        error("runtime", "Variable in for loops must be initialised with an integer type.")
    }
    loop_scope.declareVariable(loop.variable, initial_value as IntegerValue)

    while (true) {
        if (loop_scope.lookupVariable(loop.variable).value == (end_value as IntegerValue).value + 1) {
            break
        }
        for (const statement of loop.body) {
            if (loop_scope.terminated) {
                break
            }
            evaluate(statement, loop_scope)
        }
        loop_scope.assignVariable(
            loop.variable,
            {
                type: "integer",
                value: loop_scope.lookupVariable(loop.variable).value + 1
            }
        )
    }
    
    return {
        type: "null",
        value: null
    } as NullValue
}

function evaluate_do_until_statement(loop: DoUntilLoop, environment: Environment): NullValue {
    const loop_scope = new Environment(environment)

    while (true) {
        const condition_result = evaluate(loop.condition, environment) as BooleanValue
        if (condition_result.type != "boolean") {
            error("runtime", "Only expressions evaluating to booleans can be used to end a while loop.")
        }
        if (condition_result.type == "boolean" && condition_result.value == true) {
            break
        }
        for (const statement of loop.body) {
            if (loop_scope.terminated) {
                break
            }
            evaluate(statement, loop_scope)
        }
    }
    
    return {
        type: "null",
        value: null
    } as NullValue
}

function evaluate_while_statement(loop: WhileLoop, environment: Environment): NullValue {
    const loop_scope = new Environment(environment)

    let i = 0
    while (true) {
        i ++
        if (loop_scope.terminated) {
            break
        }
        if (i > 200) {
            error("runtime", "Max loop iterations reached (200)")
        }
        const condition_result = evaluate(loop.condition, environment) as BooleanValue
        if (condition_result.type != "boolean") {
            error("runtime", "Only expressions evaluating to a boolean can be used to control a while loop.")
        }
        if (condition_result.type == "boolean" && condition_result.value == false) {
            break
        }
        for (const statement of loop.body) {
            evaluate(statement, loop_scope)
            if (loop_scope.terminated) {
                break
            }
        }
    }
    
    return {
        type: "null",
        value: null
    } as NullValue
}

function evaluate_variable_declaration(declaration: VariableDeclaration, environment: Environment) {
    const value = evaluate(declaration.value as Expression, environment)

    return environment.declareVariable(
        declaration.identifier, value
    )
}

function evaluate_array_declaration(declaration: ArrayDeclaration, environment: Environment) {
    const dimension_list: number[] = []
    for (const dimension of declaration.dimensions) {
        const value = evaluate(dimension, environment)
        if (value.type != "integer") {
            error("runtime", "Arrays only support indexing with type of integer.")
        }
        dimension_list.push(value.value)
    }
    return environment.declareVariable(
        declaration.identifier, MAKE_ARRAY(dimension_list)
    )
}

function evaluate_function_declaration(declaration: FunctionDeclaration, environment: Environment) {
    const { identifier, parameters, body } = declaration
    return environment.declareVariable(
        identifier, {
            type: "function",
            parameters,
            body,
            parent_scope: environment
        } as FunctionValue
    )
}
function evaluate_procedure_declaration(declaration: ProcedureDeclaration, environment: Environment) {
    const { identifier, parameters, body } = declaration
    return environment.declareVariable(
        identifier, {
            type: "procedure",
            parameters,
            body,
            parent_scope: environment
        } as ProcedureValue
    )
}

function evaluate_variable_assignment(assignment: AssignmentExpression, environment: Environment): RuntimeValue {
    if (assignment.assign_to.kind == "Identifier") {
        const name = (assignment.assign_to as Identifier).symbol
        const value = evaluate(assignment.value as Expression, environment)

        return environment.assignVariable(
            name, value
        )
    } else if (assignment.assign_to.kind == "MemberExpression") {
        const value = evaluate(assignment.assign_to as MemberExpression, environment)
        const new_value = evaluate(assignment.value as Expression, environment)


        // new_value is a newly created object, so replacing value with new_value would set the refrence of value to the new object
        // this means the object used as the variable data will not be changed.
        updateObjKeepingRef(evaluate(assignment.assign_to as MemberExpression, environment), new_value)

        return value
    } else {
        error("runtime", `Can not assign to ${JSON.stringify(assignment.assign_to)}`)
    }
}

function evaluate_member_expression(expression: MemberExpression, environment: Environment) {
    let object = evaluate(expression.object, environment)
    const type = object.type
    const type_prototype = prototype[type]
    const string_property = (expression.property as Identifier).symbol
    if (type_prototype && type_prototype[string_property]) {
        const value = type_prototype[string_property]

        if (value.type == "native-getter") {
            return (value as NativeGetterValue).call(object)
        } else if (value.type == "native-method") {
            return value as NativeMethodValue
        }
    } else if (expression.computed && ["string", "array"].includes(type)) {
        const computed_property = evaluate(expression.property, environment)

        if (computed_property.type != "integer") {
            error("runtime", "Only integers are supported in computed property values.")
        }
        if (object.type == "array") {
            return (object as ArrayValue).value[computed_property.value]
        } else if (object.type == "string") {
            return {
                type: "string",
                value: object.value[computed_property.value]
            } as StringValue
        }
    } else {
        error("runtime", `Can not find property ${string_property} on variable ${"somevar name"}.`)
    }
}

function evaluate_if_statement(if_statement: IfStatement, environment: Environment): RuntimeValue {
    const condition_result = evaluate(if_statement.condition, environment)
    if (is_truthy(condition_result)) {
        const block_environment = new Environment(environment)
        for (const statement of if_statement.then) {
            if (block_environment.terminated) break
            evaluate(statement, block_environment)
        }
    } else if (if_statement.else) {
        const block_environment = new Environment(environment)
        for (const statement of if_statement.else) {
            if (block_environment.terminated) break
            evaluate(statement, block_environment)
        }
    }
    return {
        type: "null", value: null
    } as NullValue
}
function evaluate_switch_statement(switch_statement: SwitchStatement, environment: Environment): RuntimeValue {
    const discriminant = evaluate(switch_statement.discriminant, environment)

    const block_environment = new Environment(environment)
    for (const switch_case of switch_statement.cases) {
        const test = switch_case.test == null ? null : evaluate(switch_case.test, environment)
        const is_equal = discriminant.value == test?.value || switch_case.test == null

        if (is_equal) {
            for (const statement of switch_case.then) {
                if (block_environment.terminated) break
                evaluate(statement, block_environment)
            }
            break
        }
    }
    return {
        type: "null", value: null
    } as NullValue
}
