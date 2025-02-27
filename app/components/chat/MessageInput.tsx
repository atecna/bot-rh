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
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white md:p-5">
      <div className="flex items-center bg-atecna-rose rounded-lg overflow-hidden shadow-xs border border-atecna-corail/20 focus-within:ring-2 focus-within:ring-atecna-corail/50 focus-within:border-atecna-corail">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message..."
          className="flex-1 p-3 bg-transparent focus:outline-hidden text-black"
          disabled={isProcessing}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          className={`p-3 transition-colors duration-200 ${
            isProcessing || !inputValue.trim() 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-atecna-corail hover:text-atecna-corail/80'
          }`}
          disabled={isProcessing || !inputValue.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      {isProcessing && (
        <div className="text-sm text-gray-500 mt-2 flex items-center">
          <div className="animate-pulse mr-2">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-atecna-bleu rounded-full"></div>
              <div className="h-2 w-2 bg-atecna-bleu rounded-full animation-delay-200"></div>
              <div className="h-2 w-2 bg-atecna-bleu rounded-full animation-delay-400"></div>
            </div>
          </div>
          En train de répondre...
        </div>
      )}
    </form>
  );
} 