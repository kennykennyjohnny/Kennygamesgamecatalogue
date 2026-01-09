import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3d47e466`;

export const api = {
  // Auth
  async signup(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async getSession(token: string) {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Scores
  async submitScore(token: string, gameId: string, score: number) {
    const res = await fetch(`${API_BASE}/scores/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId, score }),
    });
    return res.json();
  },

  async getLeaderboard(gameId: string) {
    const res = await fetch(`${API_BASE}/scores/leaderboard/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    return res.json();
  },

  async getUserStats(token: string) {
    const res = await fetch(`${API_BASE}/scores/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getUserRank(token: string, gameId: string) {
    const res = await fetch(`${API_BASE}/scores/rank/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getKennyOfDay() {
    const res = await fetch(`${API_BASE}/scores/kenny-of-day`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    return res.json();
  },
};