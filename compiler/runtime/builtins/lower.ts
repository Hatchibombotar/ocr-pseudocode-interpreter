import { error } from "../../errors";
import { RuntimeValue, StringValue } from "../values";

export default function lower(args: RuntimeValue[]): StringValue {
    const [inputValue] = args
    if (inputValue.type != "string") {
        error("runtime", `the lower function only works on strings.`)
    }
    return { type: "string", value: (inputValue as StringValue).value.toLowerCase() }
}