// lets create a Signaling server
import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({
  port: 8080,
});

let senderSocket: WebSocket | null = null; // basically browser1
let receiverSocket: WebSocket | null = null; //browser2

wss.on("connection", (ws) => {
  console.log("new user connected");

  // for now , it is going to tackle 3 kind of msgs -> 1. createOffer, 2. createAnswer, 3. iceCandidate
  ws.on("message", async function MessageFronClient(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data);
    }

    // now, on the basis of msg object we received, we need to do some operations
    if (parsedData.type === "sender") {
      // initializing them
      console.log("sender is seted");
      senderSocket = ws;
    } else if (parsedData.type === "receiver") {
      console.log("receiver is seted");
      receiverSocket = ws;
    } else if (parsedData.type === "createOffer") {
      console.log("createOffer is called");
      /* 
      {
        type:"createOffer",
        sdp: sdp
      }
      */
      try {
        // if there is no receiver
        if (ws !== senderSocket) {
          return;
        }

        //@ts-ignore
        receiverSocket?.send(JSON.stringify(parsedData));
      } catch (error) {
        console.log("Error while Creating an offer:", error);
      }
    } else if (parsedData.type === "createAnswer") {
      console.log("createAnswer is called");

      /* 
      {
        type:"createAnswer",
        sdp: sdp
      }
      */
      try {
        if (ws !== receiverSocket) {
          return;
        }

        //@ts-ignore
        senderSocket?.send(JSON.stringify(parsedData));
      } catch (error) {
        console.log("Error while Create an Answer:", error);
      }
    } else if (parsedData.type === "iceCandidate") {
      console.log("iceCandidate is called");
      //iceCandidate is basically, sometimes create offers does not have ice candidates into it, due to delay from stun server , so we need to seed it after that.
      /*
      {
        type:"iceCandidate",
        candidate:candidate
      }
       */

      if (ws == senderSocket) {
        //@ts-ignore
        receiverSocket?.send(JSON.stringify(parsedData));
      } else if (ws == receiverSocket) {
        //@ts-ignore
        senderSocket?.send(JSON.stringify(parsedData));
      }
    }
  });
});
