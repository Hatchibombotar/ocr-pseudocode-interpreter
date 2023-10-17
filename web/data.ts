
import { createSignal } from 'solid-js';

export const [showExamples, setShowExamples] = createSignal(false)
export const [showFiles, setShowFiles] = createSignal(false)
export const editor_theme = "vs-dark"

export const [viewedFile, setViewedFile] = createSignal<string | null>(null)
