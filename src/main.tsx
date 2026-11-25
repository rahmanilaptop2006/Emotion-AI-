import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

if (typeof document !== 'undefined') {
  const tapTimers = new WeakMap<Element, number>()
  const INTERACTIVE_SELECTOR =
    'button, a, [role="button"], summary, label, .clay-card-interactive, [data-tappable]'

  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const el = target.closest(INTERACTIVE_SELECTOR)
      if (!el) return
      if (el instanceof HTMLButtonElement && el.disabled) return
      if (el.getAttribute('aria-disabled') === 'true') return
      if (
        el.tagName === 'LABEL' &&
        !el.querySelector('input[type="checkbox"], input[type="radio"]')
      ) {
        return
      }

      const prevTimer = tapTimers.get(el)
      if (prevTimer !== undefined) {
        window.clearTimeout(prevTimer)
      }
      el.setAttribute('data-tapped', 'true')
      const nextTimer = window.setTimeout(() => {
        el.removeAttribute('data-tapped')
        tapTimers.delete(el)
      }, 190)
      tapTimers.set(el, nextTimer)
    },
    { passive: true }
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
