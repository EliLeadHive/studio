
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8">
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Sinal Logo"
            width={250}
            height={80}
            priority
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Seja bem-vindo ao Intelligence Hub
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          Sua central de análise de performance de anúncios do Grupo Sinal.
        </p>
        <Link href="/dashboard" passHref>
          <Button size="lg" className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            Acessar Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
