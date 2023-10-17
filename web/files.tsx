import { createSignal } from "solid-js";

export const [filesStorage, setFilesStorage] = createSignal<Record<string, string>>({
    "sample.txt": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nAenean sed semper ligula.\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec ac dolor aliquam, facilisis turpis sit amet, aliquet tortor.",
})

export function writeFile(path: string, data: string) {
    const file_storage = {...filesStorage()}
    file_storage[path] = data
    setFilesStorage(file_storage)
}

export function readFile(path: string) {
    return filesStorage()[path]
}