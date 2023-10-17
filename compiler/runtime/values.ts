import { error } from "../errors"
import { Statement } from "../reader/ast"
import type Environment from "./environment"
import { writeFile } from "../../web/files"

export type ValueType = "null" | "integer" | "float" | "boolean" | "array" | "string" | "function" | "procedure" | "file-reader" | "file-writer" | "native-function" | "native-method" | "native-getter"

export interface RuntimeValue {
    type: ValueType,
    value?: any
}

export interface NullValue extends RuntimeValue {
    type: "null",
    value: null
}

export interface IntegerValue extends RuntimeValue {
    type: "integer",
    value: number
}
export interface FloatValue extends RuntimeValue {
    type: "float",
    value: number
}

export interface StringValue extends RuntimeValue {
    type: "string",
    value: string
}

export const prototype: {
    [type in ValueType]?: {
        [property: string]: RuntimeValue
    }
} = {
    string: {
        length: ({
            type: "native-getter",
            call: (source: StringValue) => ({
                type: "integer",
                value: source.value.length
            }) as IntegerValue
        }) as NativeGetterValue,
        substring: ({
            type: "native-method",
            call: (source: StringValue, args: [IntegerValue, IntegerValue], environment) => {
                if (args[0].type != "integer" || args[1].type != "integer") {
                    error("runtime", "Only integers can be used in the substring method.")
                }
                return ({
                    type: "string",
                    value: source.value.substring(args[0].value, args[0].value + args[1].value)
                }) as StringValue
            }
        }) as NativeMethodValue
    },
    "file-reader": {
        readLine: ({
            type: "native-method",
            call: (source: RuntimeValue) => {
                let file = source as FileReaderValue
                if (file.closed) {
                    error("runtime", "Cannot read from file after it has been closed.")
                }
                if (file.current_line > file.value.length) {
                    error("runtime", "Cannot read line of file that doesn't exist.")
                }
                const value = {
                    type: "string",
                    value: file.value[file.current_line] ?? error("runtime", "Cannot read line of file that doesn't exist.")
                }
                file.current_line += 1

                return value as StringValue
            },
            value: null,
        }) as NativeMethodValue,
        endOfFile: ({
            type: "native-method",
            call: (source: RuntimeValue) => {
                let file = source as FileReaderValue
                if (file.closed) {
                    error("runtime", "Cannot read from file after it has been closed.")
                }
                return {
                    "type": "boolean",
                    value: file.current_line >= file.value.length
                } as BooleanValue
            },
            value: null,
        }) as NativeMethodValue,
        close: ({
            type: "native-method",
            call: (source: RuntimeValue) => {
                let file = source as FileReaderValue
                if (file.closed) {
                    error("runtime", "Cannot close a closed file.")
                }
                file.closed = true
                return {
                    type: "null",
                    value: null
                }
            },
            value: null
        }) as NativeMethodValue,
    },
    "file-writer": {
        writeLine: ({
            type: "native-method",
            call: (source: RuntimeValue, args) => {
                let file = source as FileWriterValue
                if (file.closed) {
                    error("runtime", "Cannot write lines to a file after it has been closed.")
                }

                const [value] = args
                if (value.type != "string") {
                    error("runtime", "Cannot write values that aren't strings to a file.")
                }

                file.value.push(
                    value.value
                )

                return value as StringValue
            }
        }) as NativeMethodValue,
        close: ({
            type: "native-method",
            call: (source: RuntimeValue) => {
                let file = source as FileWriterValue
                if (file.closed) {
                    error("runtime", "Cannot close a closed file.")
                }
                writeFile(file.path, file.value.join("\n"))
                console.log(file.path)
                file.closed = true
                return {
                    type: "null",
                    value: null
                }
            }
        }) as NativeMethodValue,
    }
}

export interface BooleanValue extends RuntimeValue {
    type: "boolean",
    value: boolean
}

export interface ArrayValue extends RuntimeValue {
    type: "array",
    value: RuntimeValue[],
    dimensions: 1
}

export interface FileReaderValue extends RuntimeValue {
    type: "file-reader",
    value: string[],
    current_line: number,
    closed: boolean
}
export interface FileWriterValue extends RuntimeValue {
    type: "file-writer",
    value: string[],
    closed: boolean,
    path: string,
}

export type FunctionCall = (args: RuntimeValue[], env: Environment) => RuntimeValue;

export interface NativeFunctionValue extends RuntimeValue {
    type: "native-function",
    call: FunctionCall;
}

export interface ProcedureValue extends RuntimeValue {
    type: "procedure",
    parameters: string[], // TODO: change to array of objects so params can be passed as value/reference
    body: Statement[],
    parent_scope: Environment
}

export interface FunctionValue extends RuntimeValue {
    type: "function",
    parameters: string[], // TODO: change to array of objects so params can be passed as value/reference
    body: Statement[],
    parent_scope: Environment
}

export type MethodCall = (source: RuntimeValue, args: RuntimeValue[], env: Environment) => RuntimeValue;

export interface NativeMethodValue extends RuntimeValue {
    type: "native-method",
    call: MethodCall;
}

export interface NativeGetterValue extends RuntimeValue {
    type: "native-getter",
    call: (source: RuntimeValue) => any;
}

export function MAKE_ARRAY(dimensions: number[]): ArrayValue {
    const current_dimension_length = dimensions.shift()
    let array: RuntimeValue[] = new Array(current_dimension_length)

    if (dimensions.length > 0) {
        // has to pass a new array for dimensions, as otherwise it will remove elements before other iterations of the loop can access it.
        array = Array.from({ length: array.length }, () => MAKE_ARRAY([...dimensions]));
    } else {
        array = Array.from({ length: array.length }, () => ({ "type": "null", "value": null } as NullValue));
    }

    return { type: "array", dimensions: 1, value: array }
}

export function is_truthy(value: RuntimeValue): boolean {
    switch (value.type) {
        case "string":
        case "array":
            return value.value.length > 0
        case "boolean":
            return value.value
        case "null":
            return false
        default:
            return true
    }
}