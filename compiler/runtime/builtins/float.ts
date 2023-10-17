import { error } from "../../errors";
import { BooleanValue, FloatValue, IntegerValue, RuntimeValue, StringValue } from "../values";

export default function fkoat(args: RuntimeValue[]): FloatValue {
    const [inputValue] = args
    if (inputValue.type == "integer") {
        return { type: "float", value: (inputValue as IntegerValue).value } as FloatValue
    } else if (inputValue.type == "float" ) {
        return { type: "float", value: (inputValue as FloatValue).value } as FloatValue
    } else if (inputValue.type == "string") {
        const value = Number((inputValue as StringValue).value)
        if (Number.isNaN(value)) {
            error("runtime", `String ${inputValue.value} cannot be cast to a float`)
        }
        return { type: "float", value }
    } else if (inputValue.type == "boolean") {
        return { type: "float", value: (inputValue as BooleanValue).value == true ? 1 : 0 } as FloatValue
    } else {
        error("runtime", `type ${inputValue.type} cannot be cast to type int`)
    }
}