import { error } from "../../errors";
import { RuntimeValue, FileWriterValue } from "../values";
import { readFile } from "../../../web/files";

export default function openWrite(args: RuntimeValue[]): FileWriterValue {
    const [path] = args

    if (path.type != "string") {
        error("runtime", `Argument path is a ${path.type}, expecting string.`)
    }

    const data = readFile(path.value)
    if (data == undefined) {
        error("runtime", "file does not exist.")
    }

    return { type: "file-writer", value: data.split("\n"), closed: false, path: path.value } as FileWriterValue;
}