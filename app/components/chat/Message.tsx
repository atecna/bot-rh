import ReactMarkdown from "react-markdown";
import { ComponentPropsWithoutRef } from "react";

export interface MessageProps {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  onCopy: (id: string) => void;
  isCopied: boolean;
}

export default function Message({ id, text, isUser, timestamp, onCopy, isCopied }: MessageProps) {
  return (
    <div
      className={`last:mb-0 group ${
        isUser ? "" : "py-6 -mx-4 px-4"
      }`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Contenu du message */}
        <div className={`relative ${isUser ? "flex justify-end" : ""}`}>
          <div
            className={`${
              isUser
                ? "bg-atecna-vert-fonce text-white py-3 px-4 rounded-2xl max-w-[85%]"
                : "text-gray-800"
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap select-text">{text}</p>
            ) : (
              <div className="markdown-content prose prose-sm max-w-none select-text">
                <ReactMarkdown
                  components={{
                    a: ({ ...props }) => (
                      <a
                        {...props}
                        className="text-atecna-bleu hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {props.children}
                      </a>
                    ),
                    ul: ({ ...props }) => (
                      <ul {...props} className="list-disc pl-5 my-2">
                        {props.children}
                      </ul>
                    ),
                    ol: ({ ...props }) => (
                      <ol {...props} className="list-decimal pl-5 my-2">
                        {props.children}
                      </ol>
                    ),
                    li: ({ ...props }) => (
                      <li {...props} className="my-1">
                        {props.children}
                      </li>
                    ),
                    p: ({ ...props }) => (
                      <p {...props} className="mb-2">
                        {props.children}
                      </p>
                    ),
                    h1: ({ ...props }) => (
                      <h1
                        {...props}
                        className="text-xl font-bold my-3 text-atecna-vert-fonce"
                      >
                        {props.children}
                      </h1>
                    ),
                    h2: ({ ...props }) => (
                      <h2
                        {...props}
                        className="text-lg font-bold my-2 text-atecna-vert-fonce"
                      >
                        {props.children}
                      </h2>
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        {...props}
                        className="text-md font-bold my-2 text-atecna-vert-fonce"
                      >
                        {props.children}
                      </h3>
                    ),
                    code: ({
                      className,
                      children,
                      ...props
                    }: ComponentPropsWithoutRef<"code"> & {
                      className?: string;
                    }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      return isInline ? (
                        <code
                          {...props}
                          className="bg-gray-100 px-1 py-0.5 rounded-sm text-sm font-mono"
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          {...props}
                          className="block bg-gray-100 p-2 rounded-sm text-sm font-mono overflow-x-auto my-2"
                        >
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ ...props }) => (
                      <blockquote
                        {...props}
                        className="border-l-4 border-atecna-corail/30 pl-4 italic my-2"
                      >
                        {props.children}
                      </blockquote>
                    ),
                    hr: ({ ...props }) => (
                      <hr {...props} className="my-4 border-gray-200" />
                    ),
                    table: ({ ...props }) => (
                      <table
                        {...props}
                        className="border-collapse border border-gray-200 my-3 w-full"
                      >
                        {props.children}
                      </table>
                    ),
                    th: ({ ...props }) => (
                      <th
                        {...props}
                        className="border border-gray-200 px-4 py-2 bg-gray-100"
                      >
                        {props.children}
                      </th>
                    ),
                    td: ({ ...props }) => (
                      <td
                        {...props}
                        className="border border-gray-200 px-4 py-2"
                      >
                        {props.children}
                      </td>
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de copie en bas du message */}
        <div
          className={`flex items-center mt-1 ${isUser ? "justify-end" : ""}`}
        >
          <button
            onClick={() => onCopy(id)}
            className="text-xs px-1.5 py-1 rounded-md transition-opacity duration-200 
              text-gray-400 hover:text-gray-600 hover:bg-gray-200
              opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center"
            title="Copier le message"
            aria-label="Copier le message"
          >
            {isCopied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Copié</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 