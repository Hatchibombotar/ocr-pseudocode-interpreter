import { error } from "../../errors";
import { RuntimeValue, StringValue } from "../values";

export default function upper(args: RuntimeValue[]): StringValue {
    const [inputValue] = args
    if (inputValue.type != "string") {
        error("runtime", `the upper function only works on strings.`)
    }
    return { type: "string", value: (inputValue as StringValue).value.toUpperCase() }
}