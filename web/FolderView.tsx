import { createSignal, Show, For } from "solid-js"
import { setViewedFile } from "./data"

type FolderNode = {
    name: string
    children: {
        [node: string]: FolderNode
    }
}

export default function FolderView({ paths }: {paths: () => string[]}) {
    return (
        <div class=" select-none">
            <FolderViewChild depth={0} name="." nodes={() => getData(paths() ?? [])} />
        </div>
    )
}

function FolderViewChild({ depth, name, nodes }: { depth: number, name: string, nodes: () => FolderNode}) {
    const [collapsed, setCollaped] = createSignal(false)

    return (
        <div>
            <Show when={depth > 0}>
                <div
                    class="flex items-center cursor-pointer hover:bg-neutral-700 "
                    onclick={(e) => {
                        if (Object.keys(nodes().children).length == 0) {
                            setViewedFile(name)
                        } else {
                            setCollaped(!collapsed())
                            e.stopPropagation()
                        }
                    }}
                >
                    <span>{isFolder(nodes())? "📁" : "📝"}</span>
                    <span class="ml-1">{getName(name)}</span>
                </div>
            </Show>

            <For each={Object.values(nodes().children)}>
                {(node: FolderNode) => (
                    <div classList={{ "pl-4 border-l": depth > 0 }}>
                        <Show when={!collapsed()}>
                            <FolderViewChild
                                depth={depth + 1}
                                nodes={() => node}
                                name={node.name}
                            />
                        </Show>
                    </div>
                )}
            </For>
        </div>
    )
}

function getData(paths: string[]): FolderNode {
    let data = {
        name: "root",
        children: {},
    }

    paths.forEach((path) => {
        let paths = path.split("/")
        fillDict(data, paths)
    })

    return data
}

function fillDict(data: FolderNode, path: string[]) {
    const children = data.children
    const first = path.shift()
    if (first == undefined) {
        return
    }

    // Create if needed
    if (!(first in children)) {
        children[first] = {
            name: first,
            children: {},
        }
    }

    // If there are more paths, recurse
    if (path.length > 0) {
        fillDict(children[first], path)
    }
}

function isFolder(node: FolderNode) {
    return Object.values(node.children).length > 0
}

function getName(path: string) {
    return path.split("/")[0]
}
