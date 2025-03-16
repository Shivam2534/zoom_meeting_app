import { useEffect, useRef, useState } from "react";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const senderVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setSocket(socket);
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "sender",
        })
      );
    };
  }, []);

  const initiateConn = async () => {
    if (!socket) {
      return;
    }
    //1. b1 need to create an RTCPeerconnnection
    const pc = new RTCPeerConnection();
    console.log("pc-", pc);

    // this part of code should be inside onnegotiationneeded, because, initialy over sdp is not having much data , on adding if video , audio , iver sdp also changes , thats why we need to send this offer again and agin whenver sdp is changes , so basically onnegotiationneeded does this task for us
    pc.onnegotiationneeded = async () => {
      console.log("onnegotiationneeded");
      //2. b1 need to create an offer
      const offer = await pc.createOffer();
      console.log("offer-", offer);

      //3. setting this offfer to the local describtion
      pc.setLocalDescription(offer);

      //4. now we need to send this offer to the receiver browser using signaling server
      if (!socket) {
        console.log("socket not found!!!");
        return;
      }

      const data = {
        type: "createOffer",
        sdp: offer,
      };
      socket.send(JSON.stringify(data));
    };

    //3.0 tickling ice candidate
    pc.onicecandidate = (event) => {
      console.log("icecandidate is-", event);
      const data = {
        type: "iceCandidate",
        candidate: event.candidate,
      };

      socket.send(JSON.stringify(data));
    };

    //4. waiting for the answer to come
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("answer reached at sender side is-", data);

      if (data.type === "createAnswer") {
        const remoteans = data.sdp;
        console.log("remote ans at sender is -", remoteans);

        pc.setRemoteDescription(remoteans);
      } else if (data.type === "iceCandidate") {
        pc.addIceCandidate(data.candidate);
      }
    };

    getCameraStreamAndSend(pc);
  };

  const getCameraStreamAndSend = async (pc: RTCPeerConnection) => {
    console.log("getCameraStreamAndSend is called");

    const stream = await navigator.mediaDevices.getUserMedia({
      // for screen share use getDisplayMedia instead of getUserMedia
      video: true,
      audio: false,
    });
    console.log("stream is -", stream);

    // now we just need to add this stream to out pc
    pc.addTrack(stream.getVideoTracks()[0]);

    // adding the same stream to the sender side also
    if (senderVideoRef.current) {
      senderVideoRef.current.srcObject = stream;
    }
  };

  return (
    <div>
      Sender
      <video ref={senderVideoRef} autoPlay playsInline></video>
      <button onClick={initiateConn}> Start Call </button>
    </div>
  );
};
