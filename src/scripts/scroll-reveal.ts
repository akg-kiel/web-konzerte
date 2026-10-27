const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) (entry.target as ScrollReveal).reveal();
          }
        },
        { rootMargin: '0px 0px -48px 0px', threshold: 0.12 }
      )
    : null;

class ScrollReveal extends HTMLElement {
  reveal = () => {
    this.dataset.motionState = 'visible';
    observer?.unobserve(this);
    this.removeEventListener('focusin', this.reveal);
  };

  connectedCallback() {
    // Late server-island replacements must not hide content the visitor can already see.
    if (
      !observer ||
      reducedMotion.matches ||
      this.dataset.motionState === 'visible' ||
      this.getBoundingClientRect().top < window.innerHeight
    ) {
      this.reveal();
      return;
    }
    observer.observe(this);
    this.dataset.motionState = 'pending';
    this.addEventListener('focusin', this.reveal);
  }

  disconnectedCallback() {
    observer?.unobserve(this);
    this.removeEventListener('focusin', this.reveal);
  }
}

if (!customElements.get('scroll-reveal')) customElements.define('scroll-reveal', ScrollReveal);

reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  document
    .querySelectorAll<ScrollReveal>('scroll-reveal[data-motion-state="pending"]')
    .forEach((element) => element.reveal());
});
