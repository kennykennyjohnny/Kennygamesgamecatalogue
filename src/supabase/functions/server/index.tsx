import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-3d47e466/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ROUTES ============

// Sign up
app.post("/make-server-3d47e466/auth/signup", async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    
    if (!name || !email || !password) {
      return c.json({ error: "Missing required fields: name, email, password" }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:email:${email}`);
    if (existingUser) {
      return c.json({ error: "User already exists with this email" }, 400);
    }

    // Create user ID
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Store user data
    const user = {
      id: userId,
      name,
      email,
      password, // In production, hash this!
      createdAt,
    };

    await kv.set(`user:${userId}`, user);
    await kv.set(`user:email:${email}`, userId);

    // Initialize user stats
    await kv.set(`stats:${userId}`, {
      totalGames: 0,
      totalScore: 0,
      gamesPlayed: {},
    });

    return c.json({ 
      success: true, 
      user: { id: userId, name, email },
      message: "Account created successfully" 
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Login
app.post("/make-server-3d47e466/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    // Get user ID from email
    const userId = await kv.get(`user:email:${email}`);
    if (!userId) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Get user data
    const user = await kv.get(`user:${userId}`);
    if (!user || user.password !== password) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    return c.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email },
      token: userId // Simple token = userId for this prototype
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: `Login failed: ${error.message}` }, 500);
  }
});

// Get session (verify token)
app.get("/make-server-3d47e466/auth/session", async (c) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return c.json({ error: "No token provided" }, 401);
    }

    const user = await kv.get(`user:${token}`);
    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    return c.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Session error:", error);
    return c.json({ error: `Session verification failed: ${error.message}` }, 500);
  }
});

// ============ SCORE ROUTES ============

// Submit score
app.post("/make-server-3d47e466/scores/submit", async (c) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { gameId, score } = await c.req.json();
    
    if (!gameId || score === undefined) {
      return c.json({ error: "Missing gameId or score" }, 400);
    }

    const user = await kv.get(`user:${token}`);
    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const userId = user.id;
    const scoreKey = `score:${gameId}:${userId}`;
    
    // Get existing score data
    let scoreData = await kv.get(scoreKey) || {
      userId,
      gameId,
      bestScore: 0,
      totalGames: 0,
      lastPlayed: null,
      recentScores: [],
    };

    // Update score data
    scoreData.totalGames += 1;
    scoreData.lastPlayed = new Date().toISOString();
    scoreData.recentScores = [score, ...(scoreData.recentScores || [])].slice(0, 10);
    
    const isBestScore = score > scoreData.bestScore;
    if (isBestScore) {
      scoreData.bestScore = score;
    }

    await kv.set(scoreKey, scoreData);

    // Update global stats
    const statsKey = `stats:${userId}`;
    let stats = await kv.get(statsKey) || { totalGames: 0, totalScore: 0, gamesPlayed: {} };
    
    stats.totalGames += 1;
    stats.totalScore += score;
    stats.gamesPlayed[gameId] = (stats.gamesPlayed[gameId] || 0) + 1;
    
    await kv.set(statsKey, stats);

    // Update leaderboard entry
    const leaderboardKey = `leaderboard:${gameId}:${userId}`;
    await kv.set(leaderboardKey, {
      userId,
      userName: user.name,
      bestScore: scoreData.bestScore,
      lastPlayed: scoreData.lastPlayed,
    });

    return c.json({ 
      success: true, 
      isBestScore,
      bestScore: scoreData.bestScore,
      currentScore: score,
      totalGames: scoreData.totalGames,
    });
  } catch (error) {
    console.error("Submit score error:", error);
    return c.json({ error: `Failed to submit score: ${error.message}` }, 500);
  }
});

// Get leaderboard
app.get("/make-server-3d47e466/scores/leaderboard/:gameId", async (c) => {
  try {
    const gameId = c.req.param("gameId");
    const prefix = `leaderboard:${gameId}:`;
    
    const entries = await kv.getByPrefix(prefix);
    
    // Sort by best score descending
    const sorted = entries
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 100); // Top 100
    
    // Add ranks
    const leaderboard = sorted.map((entry, index) => ({
      rank: index + 1,
      userName: entry.userName,
      bestScore: entry.bestScore,
      lastPlayed: entry.lastPlayed,
    }));

    return c.json({ success: true, leaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return c.json({ error: `Failed to get leaderboard: ${error.message}` }, 500);
  }
});

// Get user stats
app.get("/make-server-3d47e466/scores/stats", async (c) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kv.get(`user:${token}`);
    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const userId = user.id;
    
    // Get global stats
    const stats = await kv.get(`stats:${userId}`) || { totalGames: 0, totalScore: 0, gamesPlayed: {} };
    
    // Get scores for each game
    const gameIds = ["vif", "plus", "moins", "multi", "div", "mix"];
    const gameScores = {};
    
    for (const gameId of gameIds) {
      const scoreData = await kv.get(`score:${gameId}:${userId}`);
      if (scoreData) {
        gameScores[gameId] = {
          bestScore: scoreData.bestScore,
          totalGames: scoreData.totalGames,
          recentScores: scoreData.recentScores || [],
          lastPlayed: scoreData.lastPlayed,
        };
      }
    }

    return c.json({ 
      success: true, 
      stats: {
        ...stats,
        gameScores,
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return c.json({ error: `Failed to get stats: ${error.message}` }, 500);
  }
});

// Get user rank
app.get("/make-server-3d47e466/scores/rank/:gameId", async (c) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kv.get(`user:${token}`);
    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const gameId = c.req.param("gameId");
    const userId = user.id;
    
    // Get user's score
    const userScore = await kv.get(`score:${gameId}:${userId}`);
    if (!userScore) {
      return c.json({ success: true, rank: null, totalPlayers: 0 });
    }

    // Get all leaderboard entries
    const prefix = `leaderboard:${gameId}:`;
    const entries = await kv.getByPrefix(prefix);
    
    // Sort and find rank
    const sorted = entries.sort((a, b) => b.bestScore - a.bestScore);
    const rank = sorted.findIndex(entry => entry.userId === userId) + 1;

    return c.json({ 
      success: true, 
      rank: rank || null,
      totalPlayers: sorted.length,
      bestScore: userScore.bestScore,
    });
  } catch (error) {
    console.error("Get rank error:", error);
    return c.json({ error: `Failed to get rank: ${error.message}` }, 500);
  }
});

// Get "Kenny of the Day" - player with highest total score across all games
app.get("/make-server-3d47e466/scores/kenny-of-day", async (c) => {
  try {
    const gameIds = ["vif", "plus", "moins", "multi", "div", "mix"];
    const userScores = new Map<string, { userName: string; totalScore: number }>();

    // Collect all scores from all games
    for (const gameId of gameIds) {
      const prefix = `leaderboard:${gameId}:`;
      const entries = await kv.getByPrefix(prefix);
      
      for (const entry of entries) {
        const existing = userScores.get(entry.userId);
        if (existing) {
          existing.totalScore += entry.bestScore;
        } else {
          userScores.set(entry.userId, {
            userName: entry.userName,
            totalScore: entry.bestScore,
          });
        }
      }
    }

    // Find the Kenny (highest total score)
    let kennyOfDay = null;
    let maxScore = 0;

    for (const [userId, data] of userScores) {
      if (data.totalScore > maxScore) {
        maxScore = data.totalScore;
        kennyOfDay = {
          userName: data.userName,
          totalScore: data.totalScore,
        };
      }
    }

    return c.json({ 
      success: true, 
      kenny: kennyOfDay,
    });
  } catch (error) {
    console.error("Get Kenny of Day error:", error);
    return c.json({ error: `Failed to get Kenny of Day: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);