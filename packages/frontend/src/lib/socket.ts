import { io, Socket } from 'socket.io-client';
import {
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  type WSError,
  type AuthenticatedMessage,
  type GameStateMessage,
  type CellClaimedMessage,
  type CellFailedMessage,
  type PlayerJoinedMessage,
  type PlayerLeftMessage,
  type GameStartedMessage,
  type GameEndedMessage,
  type ChatMessage,
  type PlayerReadyStateMessage
} from '@socket-game/shared';

class GameSocket {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to the WebSocket server
   */
  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: {
        token: token,
      },
      withCredentials: true, // Important: Send cookies
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on(WS_SERVER_EVENTS.AUTHENTICATED, (data: AuthenticatedMessage) => {
      console.log('Authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on(WS_SERVER_EVENTS.ERROR, (error: WSError) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Game events
    this.socket.on(WS_SERVER_EVENTS.GAME_STATE, (data: GameStateMessage) => {
      this.emit('gameState', data);
    });

    this.socket.on(WS_SERVER_EVENTS.GAME_STARTED, (data: GameStartedMessage) => {
      this.emit('gameStarted', data);
    });

    this.socket.on(WS_SERVER_EVENTS.GAME_ENDED, (data: GameEndedMessage) => {
      this.emit('gameEnded', data);
    });

    // Player events
    this.socket.on(WS_SERVER_EVENTS.GAME_PLAYER_JOINED, (data: PlayerJoinedMessage) => {
      this.emit('playerJoined', data);
    });

    this.socket.on(WS_SERVER_EVENTS.GAME_PLAYER_LEFT, (data: PlayerLeftMessage) => {
      this.emit('playerLeft', data);
    });

    // Cell events
    this.socket.on(WS_SERVER_EVENTS.GAME_CELL_CLAIMED, (data: CellClaimedMessage) => {
      this.emit('cellClaimed', data);
    });

    this.socket.on(WS_SERVER_EVENTS.GAME_CELL_FAILED, (data: CellFailedMessage) => {
      this.emit('cellFailed', data);
    });

    // Chat events
    this.socket.on(WS_SERVER_EVENTS.CHAT_MESSAGE, (data: ChatMessage) => {
      this.emit('chatMessage', data);
    });

    // Ready state events
    this.socket.on(WS_SERVER_EVENTS.PLAYER_READY_STATE, (data: PlayerReadyStateMessage) => {
      this.emit('playerReadyState', data);
    });
    
    // Debug: Log all events
    this.socket.onAny((event, ...args) => {
      console.log(`[Socket] Event received: ${event}`, args);
    });
  }

  /**
   * Subscribe to a game
   */
  subscribeToGame(gameId: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.GAME_SUBSCRIBE, { gameId });
  }

  /**
   * Unsubscribe from a game
   */
  unsubscribeFromGame(gameId: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.GAME_UNSUBSCRIBE, { gameId });
  }

  /**
   * Click a cell
   */
  clickCell(gameId: string, x: number, y: number): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.socket?.emit(
        WS_CLIENT_EVENTS.GAME_CLICK_CELL,
        { gameId, x, y },
        (response: { success: boolean; error?: string }) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * Forfeit a game
   */
  forfeitGame(gameId: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.GAME_FORFEIT, { gameId });
  }

  /**
   * Reconnect to a game
   */
  reconnectToGame(gameId: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.GAME_RECONNECT, { gameId });
  }

  /**
   * Send a chat message
   */
  sendChatMessage(gameId: string, message: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.CHAT_MESSAGE, { gameId, message });
  }

  /**
   * Set player ready state
   */
  setPlayerReady(gameId: string, isReady: boolean) {
    const event = isReady ? WS_CLIENT_EVENTS.PLAYER_READY : WS_CLIENT_EVENTS.PLAYER_NOT_READY;
    this.socket?.emit(event, { gameId });
  }

  /**
   * Add an event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications() {
    console.log('GameSocket: Subscribing to notifications...', {
      isConnected: this.isConnected,
      socketId: this.socketId,
      event: WS_CLIENT_EVENTS.NOTIFICATION_SUBSCRIBE
    });
    this.socket?.emit(WS_CLIENT_EVENTS.NOTIFICATION_SUBSCRIBE);
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications() {
    this.socket?.emit(WS_CLIENT_EVENTS.NOTIFICATION_UNSUBSCRIBE);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string) {
    this.socket?.emit(WS_CLIENT_EVENTS.NOTIFICATION_MARK_READ, { notificationId });
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead() {
    this.socket?.emit(WS_CLIENT_EVENTS.NOTIFICATION_MARK_ALL_READ);
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(preferences: any) {
    this.socket?.emit(WS_CLIENT_EVENTS.NOTIFICATION_UPDATE_PREFERENCES, preferences);
  }

  /**
   * Add event listener for native socket events
   */
  addSocketListener(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  /**
   * Remove event listener for native socket events
   */
  removeSocketListener(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

// Export singleton instance
export const gameSocket = new GameSocket();