"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-slate max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ ...props }) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
        h2: ({ ...props }) => <h2 className="text-lg font-bold mt-5 mb-3" {...props} />,
        h3: ({ ...props }) => <h3 className="text-md font-bold mt-4 mb-2" {...props} />,
        p: ({ ...props }) => <p className="mb-4" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
        li: ({ ...props }) => <li className="mb-1" {...props} />,
        a: ({ ...props }) => (
          <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        blockquote: ({ ...props }) => (
          <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
        ),
        code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
          const match = /language-(\w+)/.exec(className ?? "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={tomorrow as any}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-4"
              {...(props as any)}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
              {String(children)}
            </code>
          );
        },
        table: ({ ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200" {...props} />
          </div>
        ),
        thead: ({ ...props }) => <thead className="bg-gray-50 dark:bg-gray-700" {...props} />,
        th: ({ ...props }) => (
          <th
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            {...props}
          />
        ),
        td: ({ ...props }) => <td className="px-6 py-4 whitespace-nowrap" {...props} />,
      }}
        >
          {content}
      </ReactMarkdown>
    </div>
  );
}