import React from "react";

interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleButtonClick: () => void;
  isProcessing: boolean;
}

export default function MessageInput({
  inputValue,
  setInputValue,
  handleSubmit,
  handleKeyDown,
  handleButtonClick,
  isProcessing
}: MessageInputProps) {
  return (
    <div className="px-4 pb-8 pt-2 pointer-events-auto">
      <form 
        onSubmit={handleSubmit} 
        className="max-w-xl mx-auto relative"
      >
        <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 focus-within:ring-1 focus-within:ring-atecna-corail focus-within:border-atecna-corail">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            className="flex-1 py-3.5 px-5 bg-transparent focus:outline-none text-black text-base"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className={`p-3 mr-1 rounded-md transition-colors duration-200 ${
              isProcessing || !inputValue.trim() 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-atecna-corail hover:bg-gray-100 hover:text-atecna-corail'
            }`}
            disabled={isProcessing || !inputValue.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {isProcessing && (
          <div className="absolute left-0 right-0 -top-6 text-xs text-gray-500 flex items-center justify-center">
            <div className="animate-pulse mr-1 flex space-x-1">
              <div className="h-1.5 w-1.5 bg-atecna-bleu rounded-full"></div>
              <div className="h-1.5 w-1.5 bg-atecna-bleu rounded-full animation-delay-200"></div>
              <div className="h-1.5 w-1.5 bg-atecna-bleu rounded-full animation-delay-400"></div>
            </div>
            En train de répondre...
          </div>
        )}
      </form>
    </div>
  );
} 