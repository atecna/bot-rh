import { useState, useEffect } from "react";
import { useSocket } from "~/context";

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [question, setQuestion] = useState("Quel est le serment de Paix?");
  const [response, setResponse] = useState("");
  const socket = useSocket();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('stream-response', (chunk: string) => {
      console.log(`[${new Date().toISOString()}] Chunk reçu:`, chunk);
      setResponse(prev => prev + chunk);
      
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    });

    socket.on('stream-end', () => {
      setLoading(false);
      if (startTime) {
        setGenerationTime(Date.now() - startTime);
      }
    });

    return () => {
      socket.off('stream-response');
      socket.off('stream-end');
    };
  }, [socket, isSpeaking]);

  const askPholon = (question: string) => {
    setLoading(true);
    setResponse("");
    setGenerationTime(null);
    setStartTime(Date.now());
    if (!socket) return;
    socket.emit('ask-question', question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askPholon(question);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(!isSpeaking);
    if (!isSpeaking && response) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Parle à Pholon</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 p-2 border rounded-md"
            placeholder="Pose ta question ici..."
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md h-fit"
            disabled={loading || !question.trim()}
          >
            Envoyer
          </button>
          <button
            type="button"
            onClick={() => socket?.emit('ask-question-test', 'test')}
            className="px-4 py-2 bg-green-500 text-white rounded-md h-fit"
            disabled={loading}
          >
            Test Stream
          </button>
        </div>
      </form>

      <div className="mt-6 w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold">Réponse :</h2>
          <button
            onClick={toggleSpeech}
            className={`px-2 py-1 rounded ${isSpeaking ? 'bg-red-500' : 'bg-blue-500'} text-white`}
          >
            {isSpeaking ? '🔇 Stop' : '🔊 Lire'}
          </button>
        </div>
        <p 
          className="response-content text-gray-900 mt-2 whitespace-pre-line min-h-[100px] p-4 border rounded bg-gray-50 max-h-[400px] overflow-y-auto"
        >
          {response || (loading ? "Pholon réfléchit..." : "En attente d'une question...")}
        </p>
        {generationTime && !loading && (
          <p className="text-sm text-gray-500 mt-2">
            Réponse générée en {(generationTime / 1000).toFixed(2)} secondes
          </p>
        )}
      </div>
    </div>
  );
}
