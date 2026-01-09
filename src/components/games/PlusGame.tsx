import { MathGameTemplate } from './MathGameTemplate';
import { Plus } from 'lucide-react';

interface PlusGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

export function PlusGame(props: PlusGameProps) {
  const generateQuestion = (score: number) => {
    const max = Math.min(20 + Math.floor(score / 5), 100);
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    const answer = a + b;
    
    return { a, b, op: '+', answer };
  };

  return (
    <MathGameTemplate
      {...props}
      gameId="plus"
      gameName="PLUS"
      gameDesc="Additions rapides"
      Icon={Plus}
      generateQuestion={generateQuestion}
    />
  );
}
