import { error } from "../../errors";
import { ArrayValue, BooleanValue, FloatValue, IntegerValue, RuntimeValue, StringValue } from "../values";

export default function len(args: RuntimeValue[]): IntegerValue {
    const [inputValue] = args
    if (inputValue.type != "array") {
        error("runtime", `the len function only works on arrays. For strings, using the .length method e.g.\nthing="Hello"\nthing.length`)
    }
    return { type: "integer", value: (inputValue as ArrayValue).value.length } as IntegerValue
}