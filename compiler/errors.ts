import { consoleOutput, setConsoleOutput } from "../web/console"

// @ts-ignore
export function error(type: "syntax" | "runtime", error: any): never {
    const type_label = type == "syntax" ? "Syntax" : "Runtime"

    setConsoleOutput([
        ...consoleOutput(),
        {
            text: type_label + " Error: " + error,
            type: "error"
        }
    ])
    // process.exit(1)
    throw Error()
}
export function log(...data: any) {
    console.log(
        ...data
    )
    setConsoleOutput([
        ...consoleOutput(),
        {
            text: data,
            type: "log"
        }
    ])
}