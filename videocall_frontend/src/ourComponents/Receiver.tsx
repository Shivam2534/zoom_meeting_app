"use client";

import { useEffect, useRef, useState } from "react";
import { WebSocket_Deployed_URL } from "../contant";
import { User } from "lucide-react";
import { cn } from "../lib/utils";

export const Receiver = () => {
  const videoRefSender = useRef<HTMLVideoElement>(null);
  const videoRefOwn = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(WebSocket_Deployed_URL);
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
        setIsConnecting(true);
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
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoRefOwn.current) {
      videoRefOwn.current.srcObject = stream;
    }

    pc.addTrack(stream.getVideoTracks()[0]);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-2xl font-bold text-center text-primary">
          Video Call Application
        </h1>
        <p className="text-center text-gray-500 mt-1">Receiver Mode</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-full mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Remote video (sender) */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 shadow-lg border border-gray-200">
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
                  <div className="text-center text-white">
                    <User className="h-16 w-16 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Waiting for caller...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRefSender}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
              <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                Remote User
              </div>
            </div>

            {/* Self video */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 shadow-lg border border-gray-200">
              <video
                ref={videoRefOwn}
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
                ? "Waiting for connection..."
                : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Status message */}
        <div className="text-center p-4 rounded-lg bg-gray-100 mb-8 max-w-md">
          <p className="text-sm text-gray-600">
            {isConnected
              ? "You are now connected to a video call."
              : "Waiting for someone to call you. This page will automatically connect when a call is received."}
          </p>
        </div>
      </main>

      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        <p>WebRTC Video Call Application</p>
      </footer>
    </div>
  );
};
