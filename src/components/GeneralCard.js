// src/components/GeneralCard.jsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function GeneralCard({ title, description, redirect, className }) {
  const router = useRouter();

  const handleRedirect = () => router.push(redirect);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleRedirect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleRedirect();
      }}
      className={cn(
        'cursor-pointer select-none transition-all',
        'border border-border bg-card',
        'hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm',
        // ✅ ring primario
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        <p className="mt-2 text-sm font-medium text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
