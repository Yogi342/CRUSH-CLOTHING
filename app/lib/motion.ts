import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook for hero entrance animations with GSAP context cleanup
 */
export function useHeroMotion(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Subtle editorial scale reveal on image without hiding text or buttons
      gsap.from('.crush-hero-bg', {
        scale: 1.04,
        duration: 1.2,
        ease: 'power2.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}

/**
 * Hook for scroll-triggered editorial section reveal
 */
export function useScrollReveal(targetRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!targetRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targetRef.current,
        {opacity: 0, y: 35},
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: targetRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, targetRef);

    return () => ctx.revert();
  }, [targetRef]);
}

