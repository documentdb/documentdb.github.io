import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Index({
  code,
  language = 'javascript'
}: {
  code: string;
  language?: string;
}) {
  return (
    <section className="text-sm">
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
