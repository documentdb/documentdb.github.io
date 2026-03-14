import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import RenderMermaid from "react-x-mermaid";

export default function Code({
  code,
  language = 'javascript'
}: {
  code: string;
  language?: string;
}) {
  // Render Mermaid diagram at build time
  if (language === 'mermaid') {
    return (
    <section className="text-sm bg-white rounded-lg p-0 mb-4">
        <RenderMermaid
          mermaidCode={code}
          disableCopy={true}
          disableDownload={true}
          mermaidConfig={{
            theme: "dark",
            themeVariables: {
              background: "transparent",
              primaryColor: "#1e1e1e",
              primaryTextColor: "#f2f2f2",
              primaryBorderColor: "#333",
              lineColor: "#666",
              secondaryColor: "#2a2a2a",
              tertiaryColor: "#141414"
            }
          }}
        />
      </section>
    );
  }

  // Render syntax-highlighted code
  return (
    <section className="text-sm bg-neutral-900/50 rounded-lg p-4 border border-neutral-600/30 mb-4">
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: 0,
          background: 'transparent',
        }}>
        {code}
      </SyntaxHighlighter>
    </section>
  );
}
