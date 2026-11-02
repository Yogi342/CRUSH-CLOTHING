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
      const tl = gsap.timeline({
        defaults: {ease: 'power3.out', duration: 1.1},
      });

      // Subtle mask/scale reveal for background
      tl.fromTo(
        '.crush-hero-bg',
        {scale: 1.08, opacity: 0},
        {scale: 1, opacity: 1, duration: 1.4}
      )
        // Staggered headline entrance
        .fromTo(
          '.crush-hero-tag',
          {y: 20, opacity: 0},
          {y: 0, opacity: 1, duration: 0.8},
          '-=1.0'
        )
        .fromTo(
          '.crush-hero-title',
          {y: 40, opacity: 0},
          {y: 0, opacity: 1, duration: 1.0},
          '-=0.7'
        )
        .fromTo(
          '.crush-hero-sub',
          {y: 20, opacity: 0},
          {y: 0, opacity: 1, duration: 0.8},
          '-=0.7'
        )
        .fromTo(
          '.crush-hero-ctas',
          {y: 20, opacity: 0},
          {y: 0, opacity: 1, duration: 0.8},
          '-=0.6'
        );
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

