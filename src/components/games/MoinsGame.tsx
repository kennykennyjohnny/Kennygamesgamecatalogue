import { MathGameTemplate } from './MathGameTemplate';
import { Minus } from 'lucide-react';

interface MoinsGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

export function MoinsGame(props: MoinsGameProps) {
  const generateQuestion = (score: number) => {
    const max = Math.min(20 + Math.floor(score / 5), 100);
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    
    if (b > a) {
      [a, b] = [b, a];
    }
    
    const answer = a - b;
    
    return { a, b, op: '−', answer };
  };

  return (
    <MathGameTemplate
      {...props}
      gameId="moins"
      gameName="MOINS"
      gameDesc="Soustractions rapides"
      Icon={Minus}
      generateQuestion={generateQuestion}
    />
  );
}
