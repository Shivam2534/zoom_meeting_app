"use client";

import { useEffect, useRef, useState } from "react";
import { WebSocket_Deployed_URL } from "../contant";
import { PhoneCall, PhoneOff, User } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const senderVideoRef = useRef<HTMLVideoElement>(null);
  const otherPersonVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket(WebSocket_Deployed_URL);
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

    setIsConnecting(true);

    //1. b1 need to create an RTCPeerconnnection
    // const pc = new RTCPeerConnection();
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // public STUN server
      ],
    });

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
        setIsConnected(true);
        setIsConnecting(false);
      } else if (data.type === "iceCandidate") {
        pc.addIceCandidate(data.candidate);
      }
    };

    getCameraStreamAndSend(pc);
  };

  const getCameraStreamAndSend = async (pc: RTCPeerConnection) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      // for screen share use getDisplayMedia instead of getUserMedia
      video: true,
      audio: true,
    });

    // now we just need to add this stream to out pc
    // pc.addTrack(stream.getVideoTracks()[0]);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // adding the same stream to the sender side also
    if (senderVideoRef.current) {
      senderVideoRef.current.srcObject = stream;
    }

    // receiving the tracks of other user
    // pc.ontrack = (event) => {
    //   console.log("event track is-", event);
    //   if (otherPersonVideoRef.current) {
    //     otherPersonVideoRef.current.srcObject = new MediaStream([event.track]);
    //   }
    // };
    pc.ontrack = (event) => {
      console.log("event track is-", event);
      if (otherPersonVideoRef.current && event.streams[0]) {
        otherPersonVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
        setIsConnecting(false);
      }
    };
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-2xl font-bold text-center text-primary">
          Video Call Application
        </h1>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-full mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Main video (other person) */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 shadow-lg border border-gray-200">
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
                  <div className="text-center text-white">
                    <User className="h-16 w-16 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Waiting for connection...</p>
                  </div>
                </div>
              )}
              <video
                ref={otherPersonVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
              <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                Remote User
              </div>
            </div>

            {/* Self video (sender) */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 shadow-lg border border-gray-200">
              <video
                ref={senderVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
              <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                You
              </div>
            </div>
          </div>
        </div>

        {/* Connection status */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              )}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected
                ? "Connected"
                : isConnecting
                ? "Connecting..."
                : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={initiateConn}
            disabled={isConnected || isConnecting}
            size="lg"
            className={cn(
              "rounded-full px-6",
              isConnected
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isConnected ? (
              <>
                <PhoneOff className="mr-2 h-5 w-5" />
                End Call
              </>
            ) : isConnecting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-5 w-5" />
                Start Call
              </>
            )}
          </Button>
        </div>
      </main>

      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        <p>WebRTC Video Call Application</p>
      </footer>
    </div>
  );
};
