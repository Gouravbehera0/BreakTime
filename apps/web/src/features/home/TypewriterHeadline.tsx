import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HEADLINE_COLLECTION,
  resolveHeadline,
  ResolvedHeadline,
} from './headlines';

interface TypewriterHeadlineProps {
  userName?: string;
  className?: string;
}

type TypewriterPhase = 'typing' | 'pausing' | 'deleting';

/**
 * Creates a randomized deck of headline indices, ensuring the first item
 * of the new deck is never identical to `excludeIndex`.
 */
function createDeck(total: number, excludeIndex: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i !== excludeIndex) {
      indices.push(i);
    }
  }

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

export const TypewriterHeadline: React.FC<TypewriterHeadlineProps> = React.memo(({
  userName,
  className = '',
}) => {
  // Check user preference for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  // Maintain headline deck to avoid consecutive duplicates and cycle through all items
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const deckRef = useRef<number[]>(createDeck(HEADLINE_COLLECTION.length, 0));

  // Resolved current headline
  const resolvedHeadline: ResolvedHeadline = useMemo(() => {
    return resolveHeadline(HEADLINE_COLLECTION[currentIndex], userName);
  }, [currentIndex, userName]);

  const totalChars = resolvedHeadline.graphemes.length;

  // Animation states
  const [charCount, setCharCount] = useState<number>(0);
  const [phase, setPhase] = useState<TypewriterPhase>('typing');

  // Core Typewriter State Machine with Strict Mode & Unmount Safety
  useEffect(() => {
    // If reduced motion is requested, display full headline without typing/deleting
    if (prefersReducedMotion) {
      setCharCount(totalChars);
      const timer = setTimeout(() => {
        if (deckRef.current.length === 0) {
          deckRef.current = createDeck(HEADLINE_COLLECTION.length, currentIndex);
        }
        const nextIndex = deckRef.current.shift() ?? 0;
        setCurrentIndex(nextIndex);
      }, 10000);
      return () => clearTimeout(timer);
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (phase === 'typing') {
      if (charCount < totalChars) {
        // Character typing speed: 45–65 milliseconds per character
        const delay = Math.floor(Math.random() * (65 - 45 + 1)) + 45;
        timerId = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, delay);
      } else {
        // Completed typing! Keep visible for a random duration between 7,000 and 15,000 ms
        const pauseDuration = Math.floor(Math.random() * (15000 - 7000 + 1)) + 7000;
        timerId = setTimeout(() => {
          setPhase('deleting');
        }, pauseDuration);
      }
    } else if (phase === 'deleting') {
      if (charCount > 0) {
        // Character deletion speed: 25–40 milliseconds per character (simulating Backspace)
        const delay = Math.floor(Math.random() * (40 - 25 + 1)) + 25;
        timerId = setTimeout(() => {
          setCharCount((prev) => Math.max(0, prev - 1));
        }, delay);
      } else {
        // Deletion complete! Select another headline from deck without immediate repetition
        timerId = setTimeout(() => {
          if (deckRef.current.length === 0) {
            deckRef.current = createDeck(HEADLINE_COLLECTION.length, currentIndex);
          }
          const nextIndex = deckRef.current.shift() ?? 0;
          setCurrentIndex(nextIndex);
          setPhase('typing');
        }, 200);
      }
    }

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [charCount, phase, currentIndex, totalChars, prefersReducedMotion]);

  // Derived character slices
  const effectiveCount = prefersReducedMotion ? totalChars : charCount;
  const { graphemes, highlightStart, highlightEnd, prefix, highlight } = resolvedHeadline;

  const displayedPrefix = effectiveCount <= highlightStart
    ? graphemes.slice(0, effectiveCount).join('')
    : prefix;

  const displayedHighlight = effectiveCount <= highlightStart
    ? ''
    : effectiveCount <= highlightEnd
    ? graphemes.slice(highlightStart, effectiveCount).join('')
    : highlight;

  const displayedSuffix = effectiveCount <= highlightEnd
    ? ''
    : graphemes.slice(highlightEnd, effectiveCount).join('');

  // Fade subtitle smoothly during headline changeover
  const isSubtitleDimmed = !prefersReducedMotion && phase === 'deleting' && charCount < 4;

  return (
    <div className={`min-h-[72px] sm:min-h-[80px] flex flex-col justify-center ${className}`}>
      {/* 
        Accessible Headline:
        - aria-label provides the complete headline text to screen readers.
        - aria-hidden on internal spans prevents assistive tech from announcing every typed character.
        - Preserves existing text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight.
        - Preserves purple highlight text-[#B45CFF].
      */}
      <h1
        className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight leading-tight"
        aria-label={resolvedHeadline.fullText}
      >
        <span aria-hidden="true" className="inline">
          <span>{displayedPrefix}</span>
          {displayedHighlight && (
            <span className="text-[#B45CFF]">{displayedHighlight}</span>
          )}
          <span>{displayedSuffix}</span>

          {/* Invisible placeholder character when empty to preserve line-box height */}
          {effectiveCount === 0 && (
            <span className="opacity-0 select-none">&nbsp;</span>
          )}

          {/* Typewriter Cursor */}
          {!prefersReducedMotion && (
            <span
              className="inline-block w-[3px] h-[0.85em] bg-[#B45CFF] ml-1.5 align-baseline rounded-full animate-pulse shadow-[0_0_8px_rgba(180,92,255,0.7)]"
            />
          )}
        </span>
      </h1>

      {/* Matching Subtitle preserving existing text-xs sm:text-sm text-[#A5A0B5] mt-1 */}
      <p
        className={`text-xs sm:text-sm text-[#A5A0B5] mt-1 min-h-[1.25rem] transition-opacity duration-300 ${
          isSubtitleDimmed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {resolvedHeadline.subtitle}
      </p>
    </div>
  );
});

TypewriterHeadline.displayName = 'TypewriterHeadline';
