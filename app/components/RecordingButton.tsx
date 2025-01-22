import React from "react";
import cx from "~/utils/cx";

interface RecordingButtonProps {
  /** Statut actuel à afficher pendant l'enregistrement */
  currentStatus: React.ReactNode;
  
  /** Indique si l'enregistrement est en cours */
  isRecording: boolean;
  
  /** Indique si le traitement est en cours */
  isThinking: boolean;
  
  /** Gestionnaire appelé à la fin du toucher */
  onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => void;
  
  /** Gestionnaire appelé au début du toucher */
  onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => void;
}

/**
 * Composant de bouton d'enregistrement avec retour visuel
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.currentStatus - Le statut actuel à afficher
 * @param {boolean} props.isRecording - État d'enregistrement en cours
 * @param {boolean} props.isThinking - État de traitement en cours
 * @param {Function} props.onTouchStart - Gestionnaire du début du toucher
 * @param {Function} props.onTouchEnd - Gestionnaire de fin du toucher
 */
export default function RecordingButton({
  isRecording,
  onTouchStart,
  onTouchEnd,
  isThinking,
  currentStatus,
}: RecordingButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        type="button"
        aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
        className={cx(
          "w-28 h-28 rounded-full shadow-lg flex items-center justify-center p-4 focus:outline-none transition-colors",
          {
            "bg-red-500": isRecording,
            "bg-white": !isRecording,
          }
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <img className="w-12 h-12" src="/micro.png" alt="Microphone" />
      </button>
      {isThinking && (
        <div role="status" className="text-center mt-2">{currentStatus}</div>
      )}
    </div>
  );
}
