import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Mots spécifiques à Thyléa pour aider la transcription
const PROMPT = `Pholon, Anora, Thyléa, Kentimane, Sydon, Luthéria, Mytros, Volkan, Pythor, Vallus, Kyrah, Versi, Estoria, Arésie, Praxys, Gygans, Stimfées, Hoplites, Kopis, Chakram, Xiphos, Acaste, Leyland, Delphion, Tesséla, Moxéna, l'Arbre-Cœur, Morée, Plume, Icarus, Paelias, Electra, Céruléen, Mytros (la cité), Arésien, Enfers, Ultros, Arkelander, Arkelon, Xandéria, Damon, Ophéa, Hexia, Thémis, Atrokos, Odysséens`;
export async function transcribeAudio(socket, audioBlob) {
    socket.emit("status", "J'essaie de comprendre ta langue...");
    try {
        // Conversion du Blob en File
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "fr",
            prompt: PROMPT,
        });
        socket.emit("transcription", response.text);
        return response.text;
    }
    catch (error) {
        console.error("Erreur transcription:", error);
        throw new Error("Erreur lors de la transcription audio");
    }
}
