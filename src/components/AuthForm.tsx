import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface AuthFormProps {
  onSuccess: (user: any, token: string) => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { api } = await import('../utils/api');
      
      if (isLogin) {
        const result = await api.login(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          localStorage.setItem('kg_token', result.token);
          localStorage.setItem('kg_user', JSON.stringify(result.user));
          onSuccess(result.user, result.token);
        }
      } else {
        if (!name) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        const result = await api.signup(name, email, password);
        if (result.error) {
          setError(result.error);
        } else {
          const loginResult = await api.login(email, password);
          if (loginResult.error) {
            setError(loginResult.error);
          } else {
            localStorage.setItem('kg_token', loginResult.token);
            localStorage.setItem('kg_user', JSON.stringify(loginResult.user));
            onSuccess(loginResult.user, loginResult.token);
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#2D6A4F' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
            KENNYGAMES
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Who's the GOAT? You have 30 seconds
          </p>
        </div>

        <Card className="p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', border: 'none' }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1A1A1A' }}>
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                  Pseudo
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton pseudo"
                  required={!isLogin}
                  className="w-full"
                  style={{ 
                    backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                    color: '#1A1A1A',
                    border: '1px solid rgba(45, 106, 79, 0.15)',
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                className="w-full"
                style={{ 
                  backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                  color: '#1A1A1A',
                  border: '1px solid rgba(45, 106, 79, 0.15)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
                style={{ 
                  backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                  color: '#1A1A1A',
                  border: '1px solid rgba(45, 106, 79, 0.15)',
                }}
              />
            </div>

            {error && (
              <div className="p-3 rounded text-sm text-white" style={{ backgroundColor: '#E76F51' }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold"
              style={{ backgroundColor: '#B87333' }}
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm hover:underline"
              style={{ color: '#B87333' }}
            >
              {isLogin ? "Créer un compte" : 'Déjà un compte ?'}
            </button>
          </div>
        </Card>

        <div className="mt-8 text-center text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          <p>Chaque jour, de nouveaux défis</p>
          <p>Un seul GOAT • Le meilleur de tous les jeux</p>
        </div>
      </div>
    </div>
  );
}