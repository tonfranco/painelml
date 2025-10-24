'use client';

import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface FABProps {
  onClick?: () => void;
  label?: string;
}

export function FAB({ onClick, label = 'Adicionar' }: FABProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110 active:scale-95"
      title={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
