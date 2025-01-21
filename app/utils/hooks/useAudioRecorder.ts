// useAudioRecorder.ts
import { useRef, useState } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const startRecording = async () => {
    setIsRecording(true);
    const constraints = { audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorder.current = new MediaRecorder(stream);

      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (evt: BlobEvent) => {
        chunks.push(evt.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.current.start();
    } catch (error) {
      console.error("Error starting media recorder:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorder.current = null;
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
  };
};
