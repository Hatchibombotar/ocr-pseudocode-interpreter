import { NullValue } from "../values";

export default function printRaw(args: any): NullValue {
    console.log(...args);
    return { type: "null", value: null } as NullValue;
}
