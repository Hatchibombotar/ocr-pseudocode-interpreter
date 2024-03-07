import { error, log } from "../../errors";
import { FloatValue, IntegerValue, RuntimeValue, StringValue } from "../values";

export default function random(args: RuntimeValue[]): IntegerValue | FloatValue {
    const from_param = args[0]
    const to_param = args[1]

    const is_number = (from_param.type == "float" || from_param.type == "integer")
    if (is_number && from_param.type != to_param.type) {
        error("runtime", "from and to parameters of random function must both be of the same numeric type. e.g. integer and integer or float and float")
    }

    const result_type = from_param.type as "float" | "integer"

    const from_value = from_param.value as number
    const to_value = to_param.value as number

    const result = from_value + Math.random() * (to_value - from_value)

    if (result_type == "float") {
        return {
            type: "float",
            value: result
        } as FloatValue
    } else if (result_type == "integer") {
        return {
            type: "integer",
            value: Math.round(result)
        } as IntegerValue
    }

    error("runtime", "unknown result type in random function.")
}