"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";

interface CodeEditorProps {
  value: string;
  height?: string;
  theme?: "dark" | "light";
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Thin CodeMirror wrapper. Imported via next/dynamic from editor-client so the
 * editor + lang-html grammar are code-split out of the initial route bundle.
 */
export default function CodeEditor({
  value,
  height = "100%",
  theme = "dark",
  onChange,
  className,
}: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height={height}
      theme={theme}
      extensions={[html()]}
      onChange={onChange}
      className={className}
    />
  );
}
