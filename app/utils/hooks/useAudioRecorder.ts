// useAudioRecorder.ts
import { useRef, useState } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error("Erreur de permission microphone:", error);
      setPermissionGranted(false);
      return false;
    }
  };

  const startRecording = async () => {
    if (permissionGranted === null) {
      const granted = await requestPermission();
      if (!granted) return;
    } else if (!permissionGranted) {
      return;
    }

    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    permissionGranted
  };
};
