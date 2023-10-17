import { createEffect, onMount } from 'solid-js';
import * as monaco from "monaco-editor"
import { editor_theme, showFiles, setShowFiles, viewedFile } from './data';
import { FiXCircle } from 'solid-icons/fi';
import FolderView from './FolderView';
import { filesStorage } from './files';


export function FileViewer() {
    let textEditorRef!: HTMLDivElement;
    let text_editor!: monaco.editor.IStandaloneCodeEditor
    onMount(() => {
      text_editor = monaco.editor.create(textEditorRef, {
        value: "Create a file using the openWrite() function to see it appear on the left.\nSelect a file to view it's contents.",
        language: 'plaintext',
        automaticLayout: true,
        theme: editor_theme,
        glyphMargin: false,
        lineDecorationsWidth: 6,
        lineNumbersMinChars: 3,
        readOnly: true
      });
    })

    createEffect(() => {
        const path = viewedFile()
        if (path == null) {
            return
        }
        text_editor.setValue(filesStorage()[path])
    })
  
    return <div classList={{
      "hidden": !showFiles()
    }}>
      <div class="absolute top-0 left-0 bg-neutral-950/80 w-full h-full" onclick={() => setShowFiles(false)}></div>
      <div class="absolute top-0 left-0 bottom-0 right-0 p-4 w-full h-[95vh]">
        <div class=" border rounded-md border-neutral-400 bg-neutral-900 w-full px-2 h-full overflow-y-auto special-scroll pb-2">
          <div class="my-1 flex items-center">
            <h2 class="text-lg">Files</h2>
            <FiXCircle class="ml-auto cursor-pointer" onclick={() => setShowFiles(false)} />
          </div>
          <div class="flex h-full">
            <div class='w-1/4'>
              <FolderView
                paths={() => Object.keys(filesStorage())}
              />
            </div>
            <div class="h-full w-3/4" ref={textEditorRef}>
  
            </div>
          </div>
        </div>
      </div>
    </div>
  }