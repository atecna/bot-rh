import React from "react";
import cx from "~/utils/cx";

interface RecordingButtonProps {
  currentStatus: React.ReactNode;
  isRecording: boolean;
  isThinking: boolean;
  onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => void;
}

export default function RecordingButton({
  isRecording,
  onTouchStart,
  onTouchEnd,
  isThinking,
  currentStatus,
}: RecordingButtonProps) {
  return (
    <button
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      type="button"
      className={cx(
        "w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center p-4 focus:outline-none",
        { "bg-red-500": isRecording }
      )}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {isThinking ? (
        <span className="text-center">{currentStatus}</span>
      ) : (
        <img className="w-12 h-12" src="/micro.png" alt="Microphone" />
      )}
    </button>
  );
}
