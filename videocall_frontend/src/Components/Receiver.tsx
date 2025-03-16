import { useEffect, useRef, useState } from "react";

export const Receiver = () => {
  const videoRefSender = useRef<HTMLVideoElement>(null);
  const videoRefOwn = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "receiver",
        })
      );
    };
    startReceiving(socket);
  }, []);

  async function startReceiving(socket: WebSocket) {
    const pc = new RTCPeerConnection();
    socket.onmessage = async (event) => {
      console.log("data received-", event.data);
      const data = JSON.parse(event.data);
      console.log("parsedData-", data);

      if (data.type === "createOffer") {
        const offer = data.sdp;
        pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        console.log("answer-", answer);
        pc.setLocalDescription(answer);

        // sending this answer to the singnaling server for b1
        const data1 = {
          type: "createAnswer",
          sdp: answer,
        };
        socket.send(JSON.stringify(data1));
      } else if (data.type === "iceCandidate") {
        pc.addIceCandidate(data.candidate);
      }
    };

    // when ice candidates tickles
    pc.onicecandidate = (event) => {
      console.log("icecandidate on receiver side is-", event);
      const data = {
        type: "iceCandidate",
        candidate: event.candidate,
      };

      socket.send(JSON.stringify(data));
    };

    // when track is added from another user
    pc.ontrack = (event) => {
      console.log("event track is-", event);
      if (videoRefSender.current) {
        videoRefSender.current.srcObject = new MediaStream([event.track]);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoRefOwn.current) {
      videoRefOwn.current.srcObject = stream;
    }
  }

  return (
    <div>
      <video ref={videoRefOwn} autoPlay playsInline controls></video>
      {/* this video player is of sender */}
      <video ref={videoRefSender} autoPlay playsInline controls></video>
    </div>
  );
};
