import { error, log } from "../../errors";
import { RuntimeValue, StringValue } from "../values";

export default function input(args: RuntimeValue[]): StringValue {
    const input_prompt = args[0]
    if (input_prompt.type != "string") {
        error("runtime", "parameter 0 of input(...) function of unexpected type. expected: string.")
    }

    const display_input = (input_prompt as StringValue).value
    const input: string = prompt(display_input) as string

    let console_output = display_input
    console_output += console_output.at(-1) == " " ? "" : " "
    console_output += input
    log(console_output)
    
    return { type: "string", value: input } as StringValue;
}