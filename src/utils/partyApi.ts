import { supabase } from './client';
import { PartyGame, GamePlayer, GameState, GameType } from '../utils/gameTypes';
import { generateShortCode } from './shortCode';

export const partyApi = {
  /**
   * Create a new multiplayer game
   */
  async createGame(
    gameType: GameType,
    userId: string,
    userName: string,
    maxPlayers: number = 2
  ): Promise<{ success: boolean; game?: PartyGame; error?: string }> {
    try {
      const shortCode = generateShortCode();

      // Insert game
      const { data: gameData, error: gameError } = await supabase
        .from('party_games')
        .insert({
          short_code: shortCode,
          game_type: gameType,
          max_players: maxPlayers,
          creator_id: userId,
          creator_name: userName,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add creator as first player
      const { error: playerError } = await supabase
        .from('party_game_players')
        .insert({
          game_id: gameData.id,
          user_id: userId,
          user_name: userName,
          player_order: 1,
          status: 'ready',
        });

      if (playerError) throw playerError;

      // Initialize game state
      const { error: stateError } = await supabase
        .from('party_game_state')
        .insert({
          game_id: gameData.id,
          state: {},
          current_turn_user_id: userId,
          turn_number: 1,
        });

      if (stateError) throw stateError;

      return { success: true, game: gameData };
    } catch (error: any) {
      console.error('Error creating game:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get game by short code
   */
  async getGameByCode(
    shortCode: string
  ): Promise<{ success: boolean; game?: PartyGame; players?: GamePlayer[]; error?: string }> {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('party_games')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (gameError) throw gameError;

      const { data: playersData, error: playersError } = await supabase
        .from('party_game_players')
        .select('*')
        .eq('game_id', gameData.id)
        .order('player_order');

      if (playersError) throw playersError;

      return { success: true, game: gameData, players: playersData };
    } catch (error: any) {
      console.error('Error getting game:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Join a game
   */
  async joinGame(
    gameId: string,
    userId: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current player count
      const { data: players, error: countError } = await supabase
        .from('party_game_players')
        .select('player_order')
        .eq('game_id', gameId)
        .order('player_order', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextOrder = players && players.length > 0 ? players[0].player_order + 1 : 1;

      // Add player
      const { error: insertError } = await supabase
        .from('party_game_players')
        .insert({
          game_id: gameId,
          user_id: userId,
          user_name: userName,
          player_order: nextOrder,
          status: 'waiting',
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error: any) {
      console.error('Error joining game:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update player status (ready/waiting)
   */
  async updatePlayerStatus(
    gameId: string,
    userId: string,
    status: 'ready' | 'waiting'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('party_game_players')
        .update({ status })
        .eq('game_id', gameId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating player status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Start game (when all players ready)
   */
  async startGame(gameId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('party_games')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;

      // Update all players to 'playing'
      const { error: playersError } = await supabase
        .from('party_game_players')
        .update({ status: 'playing' })
        .eq('game_id', gameId);

      if (playersError) throw playersError;

      return { success: true };
    } catch (error: any) {
      console.error('Error starting game:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get game state
   */
  async getGameState(gameId: string): Promise<{ success: boolean; state?: GameState; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('party_game_state')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) throw error;

      return { success: true, state: data };
    } catch (error: any) {
      console.error('Error getting game state:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update game state
   */
  async updateGameState(
    gameId: string,
    newState: any,
    nextTurnUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        state: newState,
      };

      if (nextTurnUserId) {
        updateData.current_turn_user_id = nextTurnUserId;
        updateData.turn_number = supabase.raw('turn_number + 1');
      }

      const { error } = await supabase
        .from('party_game_state')
        .update(updateData)
        .eq('game_id', gameId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating game state:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to game updates (Realtime)
   */
  subscribeToGame(
    gameId: string,
    onUpdate: (payload: any) => void
  ) {
    return supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_game_players',
          filter: `game_id=eq.${gameId}`,
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'party_game_state',
          filter: `game_id=eq.${gameId}`,
        },
        onUpdate
      )
      .subscribe();
  },
};
