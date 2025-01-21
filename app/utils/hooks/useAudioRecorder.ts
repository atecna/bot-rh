import { useRef, useState } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Refs pour garder la trace du MediaRecorder et du Stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /**
   * Lance la capture du micro et l'enregistrement
   */
  const startRecording = async () => {
    try {
      // Prompt utilisateur : autorisation micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);

      // Sauvegarde du stream pour l'arrêter plus tard
      mediaStreamRef.current = stream;

      // Création du MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      // À chaque chunk, on l'empile
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Lorsque le recorder s'arrête, on génère un Blob final
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      // On démarre l'enregistrement
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur d’accès au microphone :", error);
      setPermissionGranted(false);
      setIsRecording(false);
    }
  };

  /**
   * Stoppe l'enregistrement
   */
  const stopRecording = () => {
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    permissionGranted
  };
}