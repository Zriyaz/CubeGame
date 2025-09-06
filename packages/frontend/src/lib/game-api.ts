import { apiClient } from './api';
import {
  API_ENDPOINTS,
  GAME_STATUS,
  type Game,
  type GameWithDetails,
  type GameListItem,
  type ListGamesRequest,
  type ListGamesResponse,
  type CreateGameRequest,
  type JoinGameRequest,
} from '@socket-game/shared';

/**
 * Game API client using shared constants
 */
export const gameApi = {
  /**
   * Create a new game
   */
  async createGame(data: CreateGameRequest): Promise<Game> {
    const response = await apiClient.post<Game>(API_ENDPOINTS.GAMES, data);
    return response.data;
  },

  /**
   * List games
   */
  async listGames(params?: ListGamesRequest): Promise<ListGamesResponse> {
    const response = await apiClient.get<ListGamesResponse>(API_ENDPOINTS.GAMES, {
      params,
    });
    return response.data;
  },

  /**
   * Get game by ID
   */
  async getGame(gameId: string): Promise<GameWithDetails> {
    const endpoint = API_ENDPOINTS.GAME_BY_ID.replace(':gameId', gameId);
    const response = await apiClient.get<GameWithDetails>(endpoint);
    return response.data;
  },

  /**
   * Join a game
   */
  async joinGame(
    gameId: string,
    data: JoinGameRequest
  ): Promise<GameWithDetails> {
    const endpoint = API_ENDPOINTS.GAME_JOIN.replace(':gameId', gameId);
    const response = await apiClient.post<GameWithDetails>(endpoint, data);
    return response.data;
  },

  /**
   * Start a game
   */
  async startGame(gameId: string): Promise<{ gameId: string; status: string; startedAt: string }> {
    const endpoint = API_ENDPOINTS.GAME_START.replace(':gameId', gameId);
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  /**
   * Leave a game
   */
  async leaveGame(gameId: string): Promise<{ message: string }> {
    const endpoint = API_ENDPOINTS.GAME_LEAVE.replace(':gameId', gameId);
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  /**
   * Get waiting games
   */
  async getWaitingGames(): Promise<GameListItem[]> {
    const response = await this.listGames({ status: GAME_STATUS.WAITING });
    return response.games;
  },

  /**
   * Get my active games
   */
  async getMyActiveGames(): Promise<GameListItem[]> {
    const response = await this.listGames({
      myGames: true,
      status: GAME_STATUS.IN_PROGRESS,
    });
    return response.games;
  },

  /**
   * Get my completed games
   */
  async getMyCompletedGames(): Promise<GameListItem[]> {
    const response = await this.listGames({
      myGames: true,
      status: GAME_STATUS.COMPLETED,
    });
    return response.games;
  },

  /**
   * Join a game by invite code
   */
  async joinGameByCode(inviteCode: string): Promise<GameWithDetails> {
    const response = await apiClient.post(API_ENDPOINTS.GAMES + '/join-by-code', { inviteCode });
    return response.data;
  },
};
