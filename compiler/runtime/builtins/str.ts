import { BooleanValue, NullValue, IntegerValue, RuntimeValue, StringValue } from "../values";

export default function str(args: RuntimeValue[]): StringValue {
    const [inputValue] = args
    if (inputValue.type == "integer") {
        return { type: "string", value: String((inputValue as IntegerValue).value) } as StringValue
    } else if (inputValue.type == "string") {
        return inputValue as StringValue
    } else if (inputValue.type == "boolean") {
        return { type: "string", value: String((inputValue as BooleanValue).value) } as StringValue
    } else if (inputValue.type == "null") {
        return { type: "string", value: "null" } as StringValue
    } else {
        console.error(`type ${inputValue.type} cannot be cast to type string`)
        process.exit(1)
    }
}