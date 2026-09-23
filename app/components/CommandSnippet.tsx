"use client";

import { useEffect, useRef, useState } from "react";

type CommandSnippetProps = {
  command: string;
  label?: string;
};

export default function CommandSnippet({ command, label = "Command" }: CommandSnippetProps) {
  const [feedback, setFeedback] = useState<{ command: string; error: boolean } | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current !== null) clearTimeout(timeout.current);
  }, []);

  const copyCommand = async () => {
    if (timeout.current !== null) clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(command);
      setFeedback({ command, error: false });
      timeout.current = setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback({ command, error: true });
    }
  };
  const currentFeedback = feedback?.command === command ? feedback : null;

  return (
    <div className="w-full max-w-full overflow-hidden rounded-lg border border-neutral-700 bg-black">
      <div className="flex items-center justify-between border-b border-neutral-700 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
        <button
          type="button"
          onClick={copyCommand}
          aria-label={`Copy ${label}`}
          className="rounded border border-neutral-600 px-2 py-1 text-xs font-medium text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          {currentFeedback && !currentFeedback.error ? "Copied" : "Copy"}
        </button>
      </div>
      <p role="status" className={currentFeedback?.error ? "px-3 pb-3 text-sm text-amber-200" : "sr-only"}>
        {currentFeedback?.error
          ? "Could not copy. Select the command text and copy it manually."
          : currentFeedback ? `${label} copied. Run it in your terminal.` : ""}
      </p>
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain px-3 py-3 [scrollbar-gutter:stable]">
        <pre className="m-0 w-full whitespace-pre text-xs leading-relaxed text-green-400">
          <code>{command}</code>
        </pre>
      </div>
    </div>
  );
}
