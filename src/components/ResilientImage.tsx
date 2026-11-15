import { useState } from 'react';
import { Compass } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  fallbackTitle: string;
}

export function ResilientImage({
  src,
  alt,
  caption,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-sky-50 border border-slate-200 text-slate-600 p-8 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Compass className="w-8 h-8 text-sky-700" strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-700 text-center">
          {fallbackTitle}
        </p>
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover block"
      />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/45 to-transparent px-4 py-3 text-xs text-slate-100">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
