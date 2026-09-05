import type { WorkerUpdate } from '@/types';

type Listener = (update: WorkerUpdate) => void;

export class SimulatedWebSocket {
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(connected: boolean) => void>();
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.statusListeners.forEach((l) => l(true));
        resolve();
      }, 400);
    });
  }

  disconnect() {
    this.connected = false;
    this.statusListeners.forEach((l) => l(false));
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  isConnected() {
    return this.connected;
  }

  onMessage(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatusChange(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => this.statusListeners.delete(listener);
  }

  emit(update: WorkerUpdate) {
    if (!this.connected) return;
    this.listeners.forEach((l) => l(update));
  }

  simulateReconnect() {
    this.connected = false;
    this.statusListeners.forEach((l) => l(false));
    this.reconnectTimer = setTimeout(() => {
      this.connected = true;
      this.statusListeners.forEach((l) => l(true));
    }, 1500);
  }
}

export const simulatedSocket = new SimulatedWebSocket();
