import { ValueType, RuntimeValue, IntegerValue, NullValue, MAKE_ARRAY, NativeFunctionValue, StringValue, BooleanValue, FunctionValue, ProcedureValue, prototype, NativeGetterValue, NativeMethodValue, ArrayValue, is_truthy, FloatValue, RangeValue, ClassValue, ClassInstanceValue } from "./values"
import { ArrayDeclaration, AssignmentExpression, BinaryExpression, CallExpression, ClassDeclaration, DoUntilLoop, Expression, ForLoop, FunctionDeclaration, Identifier, IfStatement, MemberExpression, NodeType, NullLiteral, NumericLiteral, ProcedureDeclaration, Program, RangeExpression, ReturnStatement, Statement, StringLiteral, SwitchStatement, UnaryExpression, VariableDeclaration, WhileLoop } from "../reader/ast"
import Environment from "./environment"
import { error } from "../errors"
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
}

function evaluate_class_initialisation(class_call: Expression, environment: Environment): ClassInstanceValue {
    if (class_call.kind != "CallExpression") {
        error("runtime", "Expecting CallExpression in class initialisation e.g. new Pet(), found something else.")
    }

    const created_from_class = evaluate((class_call as CallExpression).caller, environment)
    if (created_from_class.type != "class") {
        error("runtime", "Can only create instances from classes, found something else.")
    }

    // TODO: consider changing declatation_enviroment to use environment.resolve
    const internal_environment = new Environment((created_from_class as ClassValue).declatation_enviroment)

    const instance = {
        type: "instance",
        instance_of: created_from_class,
        internal_environment,
    } as ClassInstanceValue


    for (const attribute of (created_from_class as ClassValue).attributes) {
        internal_environment.declareVariable(
            attribute.identifier,
            {
                type: "null",
            }
        )
    }

    const argument_list = (class_call as CallExpression).arguments.map((arg) => evaluate(arg, environment));

    let constructor_exists = false
    for (const method of (created_from_class as ClassValue).methods) {
        if (method.identifier == "new") {
            constructor_exists = true
            const procedure = { ...method.value } as ProcedureValue // we don't want to override the class itself
            procedure.parent_scope = internal_environment // change scope constructor is defined in to be within the class instance

            // create super instance
            const super_class = (created_from_class as ClassValue).inherits_from
            if (super_class) {
                const super_internal_environment = new Environment((super_class as ClassValue).declatation_enviroment)

                const super_instance = {
                    type: "instance",
                    instance_of: super_class,
                    internal_environment: super_internal_environment,
                } as ClassInstanceValue

                instance.super_instance = super_instance
                internal_environment.declareVariable("super", super_instance)
            }


            call_procedure(
                procedure as ProcedureValue,
                argument_list
            )
        }
    }

    return instance
}

function class_constructor(created_from_class: ClassValue, internal_environment: Environment) {
    for (const attribute of (created_from_class as ClassValue).attributes) {
        internal_environment.declareVariable(
            attribute.identifier,
            {
                type: "null",
            }
        )
    }
}

function evaluate_unary_expression(unary_operation: UnaryExpression, environment: Environment): RuntimeValue {
    if (unary_operation.operator == "new") {
        return evaluate_class_initialisation(unary_operation.right, environment)
    }
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
    } else if (unary_operation.operator == "-" && right.type == "float") {
        return {
            type: "float",
            value: (right as FloatValue).value * -1
        } as FloatValue
    } else if (unary_operation.operator == "+" && right.type == "float") {
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

function call_procedure(procedure: ProcedureValue, args: RuntimeValue[]) {
    const function_scope = new Environment(procedure.parent_scope)

    for (const index in procedure.parameters) {
        const parameter = procedure.parameters[index]
        const argument = args[index]

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
}

function evaluate_call_expression(call_expression: CallExpression, environment: Environment): RuntimeValue {
    if (call_expression.caller.kind != "Identifier" && call_expression.caller.kind != "MemberExpression") {
        error("runtime", `Only identifiers are supported in call expressions, ${call_expression.caller.kind} is not supported.`)
    }

    const argument_list = call_expression.arguments.map((arg) => evaluate(arg, environment));
    const caller = evaluate(call_expression.caller, environment);

    if (caller.type === "native-function") {
        const func = caller as NativeFunctionValue
        const result = func.call(argument_list, environment);
        return result;
    } else if (caller.type === "function") {
        const func = caller as FunctionValue
        const function_scope = new Environment(func.parent_scope, { is_function: true })

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
        call_procedure(caller as ProcedureValue, argument_list)

        return {
            type: "null",
            value: null
        } as NullValue
    } else if (caller.type === "native-method") {
        const func = evaluate(call_expression.caller, environment) as NativeMethodValue
        const object = evaluate(call_expression.caller.object, environment) as RuntimeValue

        const result = func.call(object, argument_list, environment);
        return result;
    } else if (caller.type === "instance") {

        const instance = caller as ClassInstanceValue
        console.log("Instance!", instance)
        // instance.inherits_from.attributes

    } else {
        error("runtime", `Can only call functions, procedures, or class instances, not values of type ${caller.type}`)
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
        case "RangeExpression":
            return evaluate_range_expression(ast_node as RangeExpression, environment)
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
        case "ClassDeclaration":
            return evaluate_class_declaration(ast_node as ClassDeclaration, environment)
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
            error("runtime", "(Internal) AST node not set up for interpretation " + JSON.stringify(ast_node, null, 4))
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
        i++
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

function evaluate_function_declaration(declaration: FunctionDeclaration, environment: Environment): FunctionValue {
    const { identifier, parameters, body } = declaration
    return environment.declareVariable(
        identifier, {
            type: "function",
            parameters,
            body,
            parent_scope: environment
        } as FunctionValue
    ) as FunctionValue
}
function evaluate_procedure_declaration(declaration: ProcedureDeclaration, environment: Environment): ProcedureValue {
    const { identifier, parameters, body } = declaration
    return environment.declareVariable(
        identifier, {
            type: "procedure",
            parameters,
            body,
            parent_scope: environment
        } as ProcedureValue
    ) as ProcedureValue
}
function evaluate_class_declaration(declaration: ClassDeclaration, environment: Environment): ClassValue {
    const { identifier, inherits_from, body } = declaration
    const attributes: ClassValue["attributes"] = []
    const methods: ClassValue["methods"] = []
    const class_environment = new Environment(environment)

    let parent_class = null;
    if (inherits_from) {
        parent_class = environment.lookupVariable(inherits_from)
        if (parent_class.type != "class") {
            error("runtime", "Cannot inherit from non-classes")
        }
    }
    for (const { data, visibility } of body) {
        switch (data.kind) {
            case "FunctionDeclaration":
                methods.push({
                    is_private: visibility == "private",
                    identifier: data.identifier,
                    value: evaluate_function_declaration(data, class_environment)
                })
                continue
            case "ProcedureDeclaration":
                methods.push({
                    is_private: visibility == "private",
                    identifier: data.identifier,
                    value: evaluate_procedure_declaration(data, class_environment)
                })
                continue
            case "Identifier":
                attributes.push({
                    is_private: visibility == "private",
                    identifier: data.symbol,
                    initial_value: { type: "null", value: null } as NullValue
                })
                continue
            default:
                error("runtime", "(Internal) Unexpected class body item")
        }
    }
    return environment.declareVariable(
        identifier, {
            type: "class",
            methods,
            attributes,
            inherits_from: parent_class
        } as ClassValue
    ) as ClassValue
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

        if (computed_property.type == "integer") {
            if (object.type == "array") {
                return (object as ArrayValue).value[computed_property.value]
            } else if (object.type == "string") {
                return {
                    type: "string",
                    value: object.value[computed_property.value]
                } as StringValue
            }
        } else if (computed_property.type == "range") {
            const range = computed_property as RangeValue
            if (object.type == "array") {
                const array = object as ArrayValue

                if (range.start < 0) {
                    error("runtime", `Index ${range.start} out of range`)
                } else if (range.end > array.value.length) {
                    error("runtime", `Index ${range.end} out of range`)
                }

                return {
                    type: "array",
                    dimensions: 1,
                    value: array.value.slice(range.start, range.end)
                } as ArrayValue

            } else if (object.type == "string") {
                const string = object as StringValue

                if (range.start < 0) {
                    error("runtime", `Index ${range.start} out of range`)
                } else if (range.end > string.value.length) {
                    error("runtime", `Index ${range.end} out of range`)
                }

                return {
                    type: "string",
                    value: string.value.slice(range.start, range.end)
                } as StringValue
            } else {
                error("runtime", "Cannot index into type of")
            }
        } else {
            error("runtime", "Only integers and ranges are supported in computed property values.")

        }
    } else if (type == "instance") {
        let instance = object as ClassInstanceValue
        while (true) {
            console.log(instance)
            const instance_of = instance.instance_of
            for (const { identifier, is_private } of instance_of.attributes) {
                if (identifier == string_property) {
                    if (is_private) {
                        error("runtime", "Attempted to access an attribute that is set to private")
                    }
                    const value = instance.internal_environment.lookupVariable(identifier)
                    return value
                }
            }
            for (const { identifier, is_private, value } of instance_of.methods) {
                if (identifier == string_property) {
                    if (is_private) {
                        error("runtime", "Attempted to access a method that is set to private")
                    }
                    const procedure = { ...value } // we don't want to override the class itself
                    procedure.parent_scope = instance.internal_environment // change scope defined in to be within the class instance
    
                    // NOTE: kinda hacky, shouldn't run when a member is accessed, only when the constructor is called
                    // TODO: Fix this!
                    if (identifier == "new") {
                        class_constructor(instance.instance_of, instance.internal_environment)
                    }
                    return procedure
                }
            }
            if (instance.super_instance) {
                instance = instance.super_instance
            } else {
                break
            }
        }

        error("runtime", `Cannot find attribute/method ${string_property} on class instance`)
    } else {
        error("runtime", `Can not find property ${string_property} on variable.`)
    }
}

function evaluate_range_expression(expression: RangeExpression, environment: Environment): RangeValue {
    const left = evaluate(expression.left, environment)
    const right = evaluate(expression.right, environment)

    if (left.type != "integer") {
        error("runtime", "Ranges can only be defined as being between integers. Found" + left.type)
    } else if (right.type != "integer") {
        error("runtime", "Ranges can only be defined as being between integers. Found" + right.type)
    }

    return {
        type: "range",
        start: (left as IntegerValue).value,
        end: (right as IntegerValue).value
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
