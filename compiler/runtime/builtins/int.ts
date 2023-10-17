import { error } from "../../errors";
import { BooleanValue, FloatValue, IntegerValue, RuntimeValue, StringValue } from "../values";

export default function int(args: RuntimeValue[]): IntegerValue {
    const [inputValue] = args
    if (inputValue.type == "integer") {
        return { type: "integer", value: (inputValue as IntegerValue).value } as IntegerValue
    } else if (inputValue.type == "float" ) {
        return { type: "integer", value: Math.floor((inputValue as FloatValue).value) } as IntegerValue
    } else if (inputValue.type == "string") {
        const value = Number((inputValue as StringValue).value)
        if (Number.isNaN(value)) {
            error("runtime", `String ${inputValue.value} cannot be cast to an integer`)
        }
        return { type: "integer", value }
    } else if (inputValue.type == "boolean") {
        return { type: "integer", value: (inputValue as BooleanValue).value == true ? 1 : 0 } as IntegerValue
    } else {
        error("runtime", `type ${inputValue.type} cannot be cast to type int`)
    }
}