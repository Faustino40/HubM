import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import type { InterestNotification } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

function playAlert() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
}

export function useRealtimeNotifications(driverId: string, onInterest: (notification: InterestNotification) => void) {
  useEffect(() => {
    if (!driverId) return;

    let socket: Socket | null = null;

    try {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        query: {
          role: "driver",
          userId: driverId,
        },
      });

      socket.on("carrier-interest", (data: InterestNotification) => {
        playAlert();
        onInterest(data);
      });
    } catch (_error) {
      // Em modo sem backend, a tela continua funcional com dados mockados.
    }

    return () => {
      socket?.disconnect();
    };
  }, [driverId, onInterest]);
}