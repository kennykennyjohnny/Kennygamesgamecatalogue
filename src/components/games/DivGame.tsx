import { MathGameTemplate } from './MathGameTemplate';
import { Divide } from 'lucide-react';

interface DivGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

export function DivGame(props: DivGameProps) {
  const generateQuestion = (score: number) => {
    const max = Math.min(8 + Math.floor(score / 3), 12);
    const b = Math.floor(Math.random() * max) + 2;
    const answer = Math.floor(Math.random() * max) + 1;
    const a = b * answer; // Ensure division is exact
    
    return { a, b, op: '÷', answer };
  };

  return (
    <MathGameTemplate
      {...props}
      gameId="div"
      gameName="DIV"
      gameDesc="Divisions rapides"
      Icon={Divide}
      generateQuestion={generateQuestion}
    />
  );
}
