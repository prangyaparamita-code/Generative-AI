import React, { useState } from 'react';
import { Check, Copy, Code, Terminal, Eye, EyeOff } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // If the content contains raw <think> tags, we strip or isolate them
  const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Parse markdown blocks (headings, code blocks, lists, tables, paragraphs)
  const blocks = parseMarkdownBlocks(cleanContent || content);

  return (
    <div className="text-[15px] leading-relaxed text-zinc-200 space-y-3 break-words selection:bg-emerald-500/20">
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx)}</React.Fragment>
      ))}
    </div>
  );
};

interface Block {
  type: 'code' | 'heading' | 'list' | 'table' | 'quote' | 'paragraph';
  level?: number;
  lang?: string;
  code?: string;
  items?: string[];
  ordered?: boolean;
  headers?: string[];
  rows?: string[][];
  text?: string;
}

function parseMarkdownBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks ```lang
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        lang: lang || 'text',
        code: codeLines.join('\n'),
      });
      i++;
      continue;
    }

    // Headings #, ##, ###
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote >
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteLines.join('\n'),
      });
      continue;
    }

    // Markdown Table | col1 | col2 |
    if (line.includes('|') && lines[i + 1]?.includes('|') && lines[i + 1]?.includes('-')) {
      const headerLine = line;
      i += 2; // skip header and separator
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const rowCells = lines[i]
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        tableRows.push(rowCells);
        i++;
      }
      const headers = headerLine
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());
      blocks.push({
        type: 'table',
        headers,
        rows: tableRows,
      });
      continue;
    }

    // Lists (ordered or unordered)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[2]);
      const listItems: string[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (itemMatch) {
          listItems.push(itemMatch[3]);
          i++;
        } else if (lines[i].trim() === '') {
          // Check if next line continues the list
          if (lines[i + 1] && lines[i + 1].match(/^(\s*)([-*+]|\d+\.)\s+/)) {
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      blocks.push({
        type: 'list',
        ordered,
        items: listItems,
      });
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph (grouping consecutive non-empty lines)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].match(/^(\s*)([-*+]|\d+\.)\s+/) &&
      !(lines[i].includes('|') && lines[i + 1]?.includes('-'))
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paragraphLines.join('\n'),
      });
    }
  }

  return blocks;
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'code':
      return <CodeBlock key={key} code={block.code || ''} lang={block.lang || 'text'} />;

    case 'heading': {
      const text = renderInlineText(block.text || '');
      if (block.level === 1) {
        return <h1 key={key} className="text-xl md:text-2xl font-semibold text-zinc-100 mt-4 mb-2 tracking-tight">{text}</h1>;
      }
      if (block.level === 2) {
        return <h2 key={key} className="text-lg md:text-xl font-semibold text-zinc-100 mt-3 mb-1.5 tracking-tight border-b border-zinc-800 pb-1">{text}</h2>;
      }
      if (block.level === 3) {
        return <h3 key={key} className="text-base md:text-lg font-medium text-zinc-100 mt-2.5 mb-1">{text}</h3>;
      }
      return <h4 key={key} className="text-sm md:text-base font-medium text-zinc-200 mt-2 mb-1">{text}</h4>;
    }

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={key} className={`space-y-1.5 my-2 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'} text-zinc-300 marker:text-zinc-500`}>
          {block.items?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </Tag>
      );
    }

    case 'quote':
      return (
        <blockquote key={key} className="border-l-2 border-emerald-500/60 bg-zinc-900/60 pl-4 py-2 my-2 rounded-r text-zinc-400 italic">
          {renderInlineText(block.text || '')}
        </blockquote>
      );

    case 'table':
      return (
        <div key={key} className="overflow-x-auto my-3 border border-zinc-800 rounded-lg">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                {block.headers?.map((h, idx) => (
                  <th key={idx} className="px-3.5 py-2.5 text-left font-semibold text-zinc-300">
                    {renderInlineText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
              {block.rows?.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-zinc-300">
                      {renderInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'paragraph':
    default:
      return (
        <p key={key} className="leading-relaxed">
          {renderInlineText(block.text || '')}
        </p>
      );
  }
}

function renderInlineText(text: string): React.ReactNode {
  // Parse inline elements: `code`, **bold**, *italic*, [link](url), $$math$$
  // Split on inline patterns
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Regex to match inline patterns: `code`, **bold**, *italic*, [text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\$\$[^$]+\$\$|\$[^$]+\$)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(remaining)) !== null) {
    // text before match
    if (match.index > lastIndex) {
      tokens.push(remaining.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={keyCounter++} className="font-mono text-[13px] bg-zinc-800/90 text-emerald-300 px-1.5 py-0.5 rounded border border-zinc-700/50">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={keyCounter++} className="font-semibold text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={keyCounter++} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('$$') && token.endsWith('$$')) {
      tokens.push(
        <span key={keyCounter++} className="inline-block font-mono text-[14px] bg-zinc-900/80 text-amber-300 px-2 py-0.5 rounded border border-zinc-800 my-0.5">
          {token.slice(2, -2)}
        </span>
      );
    } else if (token.startsWith('$') && token.endsWith('$')) {
      tokens.push(
        <span key={keyCounter++} className="font-mono text-[13px] text-amber-300/90">
          {token.slice(1, -1)}
        </span>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={keyCounter++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
    } else {
      tokens.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < remaining.length) {
    tokens.push(remaining.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const lineCount = code.split('\n').length;
  const isHtml = lang.toLowerCase() === 'html';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-[#0d0d10] shadow-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-300 uppercase tracking-wider text-[11px]">{lang || 'text'}</span>
          <span className="text-zinc-600 font-sans">·</span>
          <span className="text-zinc-500 font-sans">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isHtml && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              title="Toggle Live Preview"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="font-sans">{showPreview ? 'Code' : 'Preview'}</span>
            </button>
          )}

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors font-sans"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content or Live Preview */}
      {showPreview && isHtml ? (
        <div className="p-4 bg-white text-zinc-900 min-h-[160px] rounded-b-lg">
          <iframe
            title="Code Preview"
            srcDoc={code}
            sandbox="allow-scripts"
            className="w-full min-h-[200px] border-0"
          />
        </div>
      ) : (
        <div className="p-3.5 overflow-x-auto text-[13px] leading-5 font-mono text-zinc-200">
          <pre className="m-0">
            <code>{highlightSyntax(code, lang)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

// Lightweight syntax colorizer for keywords, comments, strings, and types
function highlightSyntax(code: string, lang: string): React.ReactNode {
  const lines = code.split('\n');

  return lines.map((line, lIdx) => {
    // Match line comments
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return (
        <div key={lIdx} className="text-zinc-500 italic">
          {line}
        </div>
      );
    }

    return (
      <div key={lIdx} className="table-row">
        <span className="table-cell pr-3 select-none text-zinc-600 text-right text-[11px] font-mono">
          {lIdx + 1}
        </span>
        <span className="table-cell whitespace-pre">
          {colorLineTokens(line, lang)}
        </span>
      </div>
    );
  });
}

function colorLineTokens(line: string, lang: string): React.ReactNode {
  const keywords = /\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|switch|case|for|while|try|catch|finally|async|await|interface|type|def|self|print|None|True|False|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/g;

  // Split line for basic tokens
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Match strings
  const stringRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  while ((match = stringRegex.exec(line)) !== null) {
    const before = line.substring(lastIndex, match.index);
    if (before) {
      parts.push(highlightKeywords(before, keywords));
    }
    parts.push(
      <span key={`str_${match.index}`} className="text-emerald-300">
        {match[0]}
      </span>
    );
    lastIndex = stringRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(highlightKeywords(line.substring(lastIndex), keywords));
  }

  return parts.length > 0 ? parts : line;
}

function highlightKeywords(text: string, regex: RegExp): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let lastIdx = 0;
  let match;
  const localRegex = new RegExp(regex.source, 'g');

  while ((match = localRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.substring(lastIdx, match.index));
    }
    elements.push(
      <span key={`kw_${match.index}`} className="text-purple-400 font-medium">
        {match[0]}
      </span>
    );
    lastIdx = localRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(text.substring(lastIdx));
  }

  return elements.length > 0 ? elements : text;
}
