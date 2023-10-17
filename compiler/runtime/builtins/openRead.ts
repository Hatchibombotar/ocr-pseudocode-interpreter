import { readFile } from "../../../web/files";
import { error } from "../../errors";
import { RuntimeValue, FileReaderValue } from "../values";

export default function openRead(args: RuntimeValue[]): FileReaderValue {
    const [path] = args

    if (path.type != "string") {
        error("runtime", `Argument path is a ${path.type}, expecting string.`)
    }

    const data = readFile(path.value)
    if (data == undefined) {
        error("runtime", "file does not exist.")
    }

    
    return { type: "file-reader", value: data.split("\n"), current_line: 0, closed: false } as FileReaderValue;
}