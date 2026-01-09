import { MathGameTemplate } from './MathGameTemplate';
import { X } from 'lucide-react';

interface MultiGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

export function MultiGame(props: MultiGameProps) {
  const generateQuestion = (score: number) => {
    const max = Math.min(10 + Math.floor(score / 3), 15);
    const a = Math.floor(Math.random() * max) + 2;
    const b = Math.floor(Math.random() * max) + 2;
    const answer = a * b;
    
    return { a, b, op: '×', answer };
  };

  return (
    <MathGameTemplate
      {...props}
      gameId="multi"
      gameName="MULTI"
      gameDesc="Multiplications rapides"
      Icon={X}
      generateQuestion={generateQuestion}
    />
  );
}
