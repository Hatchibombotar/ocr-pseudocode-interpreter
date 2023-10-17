import { createSignal } from "solid-js";

export const [consoleOutput, setConsoleOutput] = createSignal<{
    "text": string,
    type: "log" | "error"
}[]>([])