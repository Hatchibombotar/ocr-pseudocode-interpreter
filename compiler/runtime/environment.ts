import { error } from "../errors"
import { MemberExpression } from "../reader/ast"
import input from "./builtins/input"
import int from "./builtins/int"
import float from "./builtins/float"
import openRead from "./builtins/openRead"
import openWrite from "./builtins/openWrite"
import print from "./builtins/print"
import printRaw from "./builtins/printRaw"
import str from "./builtins/str"
import { BooleanValue, IntegerValue, RuntimeValue, ArrayValue, NullValue, MAKE_ARRAY, NativeFunctionValue, ValueType, NativeMethodValue, StringValue } from "./values"
import len from "./builtins/len"
import upper from "./builtins/upper"
import lower from "./builtins/lower"

const TYPE_USE_VAL_ASSIGNMENT: ValueType[] = [
    "null",
    "integer",
    "float",
    "boolean",
    "string"
]

function setupScope(environment: Environment) {
    // environment.declareVariable("x", { type: "number", value: 100 } as NumberValue)
    // environment.declareVariable("y", MAKE_ARRAY([5, 2]))
    environment.declareVariable("true", { type: "boolean", value: true } as BooleanValue)
    environment.declareVariable("false", { type: "boolean", value: false } as BooleanValue)

    environment.declareVariable(
        "print",
        {
            type: "native-function",
            call: print
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "input",
        {
            type: "native-function",
            call: input,
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "printRaw",
        {
            type: "native-function",
            call: printRaw
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "str",
        {
            type: "native-function",
            call: str
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "int",
        {
            type: "native-function",
            call: int
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "float",
        {
            type: "native-function",
            call: float
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "len",
        {
            type: "native-function",
            call: len
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "upper",
        {
            type: "native-function",
            call: upper
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "lower",
        {
            type: "native-function",
            call: lower
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "openRead",
        {
            type: "native-function",
            call: openRead
        } as NativeFunctionValue
	);
    environment.declareVariable(
        "openWrite",
        {
            type: "native-function",
            call: openWrite
        } as NativeFunctionValue
	);
}

export default class Environment {
    private parent?: Environment
    private variables: Map<string, RuntimeValue>
    public terminated: boolean
    public return_value: RuntimeValue | undefined
    public is_function: boolean

    constructor(parent_environment?: Environment, settings?: {is_function?: boolean}) {
        const global = parent_environment ? false : true
        this.parent = parent_environment
        this.variables = new Map()
        this.terminated = false
        this.is_function = settings?.is_function ?? false

        if (global) {
            setupScope(this)
        }
    }

    public returnValue(value: RuntimeValue) {
        this.terminated = true
        if (this.is_function) {
            this.return_value = value
        } else if (this.parent) {
            this.parent.returnValue(value)
        } else {
            error("runtime", "Can only return values inside of a function")
        }
        
    }

    public declareVariable(name: string, value: RuntimeValue): RuntimeValue {
        if (this.variables.has(name)) {
            error("runtime", `Cannot declare variable ${name}. As it is already defined.`)
        }
        this.variables.set(name, value)
        return value
    }

    // public declarePrototype(type: ValueType, value: NativeMethodValue): RuntimeValue {
    //     if (this.methods.has(type)) {
    //         console.error(`Cannot declare variable ${type}. As it is already defined.`)
    //         process.exit(1)
    //     }
    //     this.methods.set(name, value)
    //     return value
    // }

    public assignVariable(name: string, value: RuntimeValue): RuntimeValue {
        const environment = this.resolve(name)
        if (TYPE_USE_VAL_ASSIGNMENT.includes(value.type)) {
            value = {...value}
        }
        if (environment == null) {
            this.variables.set(name, value)
        } else {
            environment.variables.set(name, value)
        }
        return value
    }

    public assignToArray(name: string, index: number, value: RuntimeValue): RuntimeValue {
        const environment = this.resolve(name)
        if (environment == null) {
            error("runtime", `Cannot find variable ${name} in the current scope.`)
        }
        const variable = environment.variables.get(name)
        if (variable?.type != "array") {
            error("runtime", "Can only run array assignment on arrays")
        }
        const current_value = variable?.value as RuntimeValue[]
        current_value[index] = value

        environment.variables.set(name, {
            type: "array",
            value: current_value
        })
        return value
    }

    /**
     * Recursively searches for variable and returns the value associated with it.
     * @param name identifier of variable to lookup
     * @returns runtime value that is stored for the given identifer
     */
    public lookupVariable(name: string): RuntimeValue {
        const environment = this.resolve(name)
        if (environment == null) {
            error("runtime", `Cannot find variable/attribute ${name} in the current scope.`)
        }
        return environment.variables.get(name) as RuntimeValue
    }

    public resolve(name: string): Environment | null {
        if (this.variables.has(name)) {
            return this
        }
        if (this.parent == undefined) {
            return null
            // console.error(`Cannot resolve variable ${name}, as it does not exist.`)
            // process.exit(1)
        }
        return this.parent.resolve(name)
    }
}