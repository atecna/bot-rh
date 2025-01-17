import { Socket } from "socket.io";
import askPholon from "./ask-pholon";

export function handleSocket(socket: Socket) {
  socket.on("ask-question", (question: string) => {
    console.log("[SERVER] Question reçue:", question);
    askPholon(socket, question);
  });
}
