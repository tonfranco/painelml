'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accountId = searchParams.get('accountId');
    
    if (accountId) {
      // Salvar accountId no localStorage
      localStorage.setItem('accountId', accountId);
      
      toast.success('Conta conectada com sucesso!');
      
      // Redirecionar para dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      toast.error('Erro ao conectar conta');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [searchParams, router]);

  return <LoadingScreen />;
}
