import { onMount, type Component, For, Show, createSignal } from 'solid-js';
import * as monaco from "monaco-editor"
import FileSaver from "file-saver"
import { AiFillCaretRight } from 'solid-icons/ai'
import { FiXCircle } from 'solid-icons/fi'

import Parser from '../compiler/reader/parser';
import Environment from '../compiler/runtime/environment';
import { evaluate } from '../compiler/runtime/interpreter';
import { consoleOutput, setConsoleOutput } from './console';
import examples from './examples';
import { valuesToStrings } from '../compiler/utils';
import monarch_language from '../monarch_language';
import { editor_theme, showExamples, setShowExamples, showFiles, setShowFiles, showExamQuestions, setShowExamQuestions } from './data';
import { FileViewer } from './FileViewer';

window.onbeforeunload = () => true

monaco.languages.register({
  id: 'pseudocode',
  extensions: ['.pseudocode'], // File extensions associated with your language
  aliases: ['OCR Pseudocode'], // Language aliases
  mimetypes: ['text/x-mycustom'], // MIME types
});

monaco.languages.setMonarchTokensProvider('pseudocode', monarch_language);


let editor!: monaco.editor.IStandaloneCodeEditor
const App: Component = () => {
  let editorRef!: HTMLDivElement
  let replRef!: HTMLInputElement
  let fileNameRef!: HTMLInputElement
  onMount(() => {
    editor = monaco.editor.create(editorRef, {
      theme: editor_theme,
      value: 'print("Hello World!!")',
      language: 'pseudocode',
      automaticLayout: true,
      glyphMargin: false,
      lineDecorationsWidth: 6,
      lineNumbersMinChars: 3
    });

    document.addEventListener("keydown", (event) => {
      if (event.key == "F5") {
        run()
        return event.preventDefault()
      }
    })
  })

  let environment = new Environment()

  const run = () => {
    setConsoleOutput([
      {
        text: "---",
        type: "log"
      }
    ])

    const input = editor.getValue()

    environment = new Environment()

    const program = Parser(input)

    // console.log(JSON.stringify(program))

    // console.log(program)

    evaluate(program, environment)
  }
  const run_repl = () => {
    const input = replRef.value

    setConsoleOutput([
      ...consoleOutput(),
      {
        text: "> " + input,
        type: "log"
      },
    ])

    const program = Parser(input)
    const result = evaluate(program, environment)

    setConsoleOutput([
      ...consoleOutput(),
      {
        text: valuesToStrings(result),
        type: "log"
      }
    ])
  }

  return (
    <div class="bg-neutral-900 font-sans text-white px-2">
      <header class="mx-2 my-2 flex items-center">
        <h1 class="font-semibold my-0">
          OCR Exam Reference Language Interpreter
        </h1>
      </header>
      <div class="mx-2 flex gap-1">
        <input ref={fileNameRef} class="bg-[#1e1e1e] border rounded-md border-neutral-400 text-white px-1 text-sm" value={"hello"}></input>
        <button class="border rounded-md border-neutral-400 text-white px-1 text-sm" onclick={() => {
          const blob = new Blob([editor.getValue()], { type: "text/plain;charset=utf-8" });
          FileSaver.saveAs(blob, fileNameRef.value + ".pseudocode");
        }}>Save</button>
        <button class="border rounded-md border-neutral-400 text-white px-1 text-sm" onclick={() => {
          const file_input = document.createElement("input");
          file_input.type = "file";
          file_input.accept = ".pseudocode";
          file_input.onchange = async (e: any) => {
            const file = e.target.files[0]
            const name = file.name
            const text = await file.text()
            fileNameRef.value = name
            editor.setValue(text)
          }
          file_input.click()
        }}>Load</button>
        <button class="border rounded-md border-neutral-400 text-white px-1 text-sm" onclick={() => setShowExamples(!showExamples())}>Examples</button>
        {/* <button class="border rounded-md border-neutral-400 text-white px-1 text-sm" onclick={() => setShowExamQuestions(!showExamQuestions())}>Exam Questions</button> */}
        <div class="ml-auto flex gap-1">
          <button class="border rounded-md border-neutral-400 text-white px-1 text-sm" onclick={() => setShowFiles(!showFiles())}>Files</button>
          <button class="bg-green-600 flex items-center justify-center rounded-md text-white text-sm py-1 px-2" onclick={run}>
            <AiFillCaretRight class="mr-1" />
            <span>Run</span>
          </button>
        </div>
      </div>
      <div class=" rounded-md p-2">
        <div class="flex flex-col sm:flex-row h-[80vh] gap-2">
          <div class="bg-[#1e1e1e] sm:w-1/2 h-full border rounded-md border-neutral-400 p-1">
            <div ref={editorRef} class="h-full w-full" />
          </div>

          <div class="bg-[#1e1e1e] sm:w-1/2 h-96 sm:h-auto border rounded-md border-neutral-400 text-sm relative overflow-hidden">
            {/* <p>This is the output console!</p> */}
            <div class=" font-mono p-1 overflow-y-auto h-[94%] special-scroll">
              <For each={consoleOutput()}>{({ text, type }) =>
                <p classList={{
                  "text-red-500": type == "error"
                }}>
                  {text}
                </p>
              }</For>
            </div>
            <div class="absolute bottom-0 w-full">
              <input ref={replRef} type='text' class="w-full bg-neutral-900 border-t border-t-neutral-400 focus-within:outline-none font-mono px-2 py-1 h-8" onKeyPress={({ key }) => {
                if (key == "Enter") {
                  run_repl()
                  replRef.value = ""
                }
              }}></input>
              {/* <p class="w-full font-mono px-2 py-1 h-8 bg-neutral-900"></p> */}
            </div>
          </div>
        </div>
      </div>
      <Examples />
      <ExamQuestions />
      <FileViewer />

      <footer class="mx-2">
        <a class="underline text-sm text-neutral-300" target='_blank' href="https://hatchibombotar.com#contact">Contact</a>
      </footer>
    </div>
  );
};

function Examples() {
  return <div classList={{
    "hidden": !showExamples()
  }}>
    <div class="absolute top-0 left-0 bg-neutral-950/80 w-full h-full" onclick={() => setShowExamples(false)}></div>
    <div class="absolute top-3 left-3 border rounded-md border-neutral-400 bg-neutral-900 w-auto px-2 max-h-[95vh] overflow-y-auto special-scroll pb-2">
      <div class="my-1 flex items-center">
        <h2 class="text-lg">Examples</h2>
        <FiXCircle class="ml-auto cursor-pointer" onclick={() => setShowExamples(false)} />
      </div>
      <div class="">
        <For each={examples}>{({ title, examples }) =>
          <div>
            <h1>{title}</h1>
            <div class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <For each={examples}>{({ title, code }) =>
                <div class="border rounded-md border-neutral-400 pb-2 bg-[#1e1e1e] w-96">
                  <div class="flex items-center justify-center mx-2 my-1">
                    <h3 class="text-sm  mb-1 font-semibold">{title}</h3>
                    <button class="bg-blue-600 flex items-center justify-center rounded-md text-white text-sm py-1 px-2 ml-auto" onclick={() => {
                      const confirmation = confirm("Are you sure you want to override the current file?")
                      if (confirmation) {
                        editor.setValue(code)
                        setShowExamples(false)
                      }
                    }}>
                      <span>Load</span>
                    </button>
                  </div>
                  <ReadOnlyEditor text={code} />
                </div>
              }</For>
            </div>
          </div>

        }</For>
      </div>
    </div>
  </div>
}


function ExamQuestions() {
  return <div classList={{
    "hidden": !showExamQuestions()
  }}>
    <div class="absolute top-0 left-0 bg-neutral-950/80 w-full h-full" onclick={() => setShowExamQuestions(false)}></div>
    <div class="absolute top-3 left-3 border rounded-md border-neutral-400 bg-neutral-900 w-auto px-2 max-h-[95vh] overflow-y-auto special-scroll pb-2">
      <div class="my-1 flex items-center">
        <h2 class="text-lg">Exam Questions</h2>
        <FiXCircle class="ml-auto cursor-pointer" onclick={() => setShowExamQuestions(false)} />
      </div>
      <div class="">
        <h3>GCSE</h3>
        <h3>AS</h3>
        <p class="underline">May 2019 - Question 4a</p>
        <h3>A-Level</h3>

      </div>
    </div>
  </div>
}

function ReadOnlyEditor({ text }: { text: string }) {
  let div!: HTMLDivElement
  onMount(
    () => {
      monaco.editor.create(div, {
        value: text,
        language: 'pseudocode',
        automaticLayout: true,
        theme: editor_theme,
        glyphMargin: false,
        lineNumbers: "off",
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
        readOnly: true,
        folding: false,
        minimap: {
          enabled: false
        }
      });
    }
  )

  return <div ref={div} class="h-36 pl-3"></div>
}

export default App;