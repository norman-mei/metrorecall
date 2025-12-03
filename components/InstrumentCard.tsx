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

      <div className="p-5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 bg-gradient-to-r from-white/60 to-white/30 dark:from-zinc-900/60 dark:to-zinc-900/30">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-xs">
          A-Z
        </div>
        <div>
          <p className="font-semibold">Identify the transit agency</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Type any common alias—city nicknames, abbreviations, or the full authority name all count.
          </p>
        </div>
      </div>
    </div>
  );
}
