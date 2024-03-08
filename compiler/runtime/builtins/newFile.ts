import { writeFile } from "../../../web/files";
import { error } from "../../errors";
import { RuntimeValue, NullValue } from "../values";

export default function newFile(args: RuntimeValue[]): NullValue {
    const [path] = args

    if (path.type != "string") {
        error("runtime", `Argument path is a ${path.type}, expecting string.`)
    }

    writeFile(path.value, "")
    
    return {type: "null", value: null}
}