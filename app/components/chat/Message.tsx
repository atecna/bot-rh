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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
      <div 
        className={`relative max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-atecna-bleu text-white rounded-br-none' 
            : 'bg-white border border-atecna-vert-clair text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Bouton de copie */}
        <button
          onClick={() => onCopy(id)}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-opacity duration-200 
            ${isUser 
              ? 'bg-atecna-bleu-ciel/30 hover:bg-atecna-bleu-ciel/50 text-white' 
              : 'bg-atecna-rose hover:bg-atecna-corail/10 text-atecna-corail'
            }
            opacity-0 group-hover:opacity-100 focus:opacity-100`}
          title="Copier le message"
          aria-label="Copier le message"
        >
          {isCopied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>
        
        {isUser ? (
          <p className="whitespace-pre-wrap select-text">{text}</p>
        ) : (
          <div className="markdown-content prose prose-sm max-w-none select-text md:prose-base">
            <ReactMarkdown
              components={{
                a: ({...props}) => <a {...props} className="text-atecna-bleu hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>,
                ul: ({...props}) => <ul {...props} className="list-disc pl-5 my-2">{props.children}</ul>,
                ol: ({...props}) => <ol {...props} className="list-decimal pl-5 my-2">{props.children}</ol>,
                li: ({...props}) => <li {...props} className="my-1">{props.children}</li>,
                p: ({...props}) => <p {...props} className="mb-2">{props.children}</p>,
                h1: ({...props}) => <h1 {...props} className="text-xl font-bold my-3 text-atecna-vert-fonce">{props.children}</h1>,
                h2: ({...props}) => <h2 {...props} className="text-lg font-bold my-2 text-atecna-vert-fonce">{props.children}</h2>,
                h3: ({...props}) => <h3 {...props} className="text-md font-bold my-2 text-atecna-vert-fonce">{props.children}</h3>,
                code: ({className, children, ...props}: ComponentPropsWithoutRef<'code'> & {className?: string}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  return isInline 
                    ? <code {...props} className="bg-atecna-vert-clair px-1 py-0.5 rounded-sm text-sm font-mono">{children}</code>
                    : <code {...props} className="block bg-atecna-vert-clair p-2 rounded-sm text-sm font-mono overflow-x-auto my-2">{children}</code>;
                },
                blockquote: ({...props}) => <blockquote {...props} className="border-l-4 border-atecna-corail/30 pl-4 italic my-2">{props.children}</blockquote>,
                hr: ({...props}) => <hr {...props} className="my-4 border-atecna-vert-clair" />,
                table: ({...props}) => <table {...props} className="border-collapse border border-atecna-vert-clair my-3 w-full">{props.children}</table>,
                th: ({...props}) => <th {...props} className="border border-atecna-vert-clair px-4 py-2 bg-atecna-rose">{props.children}</th>,
                td: ({...props}) => <td {...props} className="border border-atecna-vert-clair px-4 py-2">{props.children}</td>,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        <div className={`text-xs mt-2 flex items-center ${isUser ? 'text-white/70 justify-end' : 'text-gray-500'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
} 