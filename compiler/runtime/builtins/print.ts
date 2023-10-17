import { log } from "../../errors";
import { BooleanValue, NullValue, IntegerValue, RuntimeValue, StringValue, FloatValue, ArrayValue } from "../values";

export default function print(args: RuntimeValue[]): NullValue {
    log(...args.map(x => toString(x)).join(" "));
    return { type: "null", value: null } as NullValue;
}

function toString(value: RuntimeValue): string {
    if (value.type == "integer") {
        return String((value as IntegerValue).value)
    } else if (value.type == "float") {
        const val = (value as FloatValue).value
        return String(Number.isInteger(val) ? `${val}.0` : val)
    } else if (value.type == "string") {
        return (value as StringValue).value
    } else if (value.type == "boolean") {
        return String((value as BooleanValue).value)
    } else if (value.type == "array") {
        return "[" + (value as ArrayValue).value.map((v) => toString(v)).join(", ") + "]"
    } else {
        return `Type<${value.type}>`
    }
}