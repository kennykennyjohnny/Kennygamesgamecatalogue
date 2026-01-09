import { MathGameTemplate } from './MathGameTemplate';
import { Shuffle } from 'lucide-react';

interface MixGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

const operations = ['+', '-', '×', '÷'] as const;
type Operation = typeof operations[number];

export function MixGame(props: MixGameProps) {
  const generateQuestion = (score: number) => {
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a: number, b: number, answer: number;
    
    const max = Math.min(15 + Math.floor(score / 3), 50);
    
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * max) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        break;
      case '÷':
        b = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
        break;
    }
    
    return { a, b, op, answer };
  };

  return (
    <MathGameTemplate
      {...props}
      gameId="mix"
      gameName="MIX"
      gameDesc="Toutes les opérations"
      Icon={Shuffle}
      generateQuestion={generateQuestion}
    />
  );
}
