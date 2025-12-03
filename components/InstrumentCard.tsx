import Image from 'next/image';
import { MapPin } from 'lucide-react';

import { TransitSystem } from '@/types';

interface TransitCardProps {
  system: TransitSystem;
}

export function TransitCard({ system }: TransitCardProps) {
  return (
    <div className="w-full bg-white/80 dark:bg-zinc-900/60 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden backdrop-blur-sm">
      <div className="relative w-full aspect-[4/3] bg-white dark:bg-zinc-900 flex items-center justify-center">
        <Image
          src={system.image}
          alt={`${system.name} logo`}
          fill
          priority
          className="object-contain p-10"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </div>

    </div>
  );
}
