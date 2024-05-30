import parse from "./reader/parser";
import { evaluate } from "./runtime/interpreter";
import Environment from "./runtime/environment";
import { readFileSync, writeFileSync } from "fs";

async function main() {
    const environment = new Environment()

    const input = String(readFileSync("./sample.txt"))
    const program = parse(input)
    writeFileSync("./data/ast.json", JSON.stringify(program, null, 4))
    
    console.log("== sample.txt ==")
    const result = evaluate(program, environment)

    console.log("\n", result)


}

main()