/**
 * Accessibility Utilities
 *
 * Provides helpers for building accessible UI components:
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation
 *
 * @module accessibility
 */

/**
 * Create a live region for screen reader announcements
 *
 * This creates an invisible element that screen readers will announce
 * when its content changes.
 *
 * @param id - Unique ID for the live region
 * @param politeness - 'polite' for non-urgent, 'assertive' for urgent announcements
 * @returns Functions to announce and cleanup
 *
 * @example
 * ```typescript
 * const { announce, cleanup } = createLiveRegion('chat-updates', 'polite')
 *
 * // Announce new messages
 * announce('New message from Vera')
 *
 * // Cleanup on unmount
 * useEffect(() => cleanup, [])
 * ```
 */
export function createLiveRegion(
  id: string,
  politeness: 'polite' | 'assertive' = 'polite'
): { announce: (message: string) => void; cleanup: () => void } {
  // Check if we're in browser environment
  if (typeof document === 'undefined') {
    return {
      announce: () => {},
      cleanup: () => {},
    }
  }

  // Check if region already exists
  let region = document.getElementById(id)

  if (!region) {
    region = document.createElement('div')
    region.id = id
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only' // Visually hidden but accessible

    // Style to hide visually but keep accessible
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `

    document.body.appendChild(region)
  }

  return {
    announce: (message: string) => {
      if (region) {
        // Clear and set to trigger announcement
        region.textContent = ''
        // Use setTimeout to ensure the change is detected
        setTimeout(() => {
          if (region) {
            region.textContent = message
          }
        }, 100)
      }
    },
    cleanup: () => {
      if (region && region.parentNode) {
        region.parentNode.removeChild(region)
      }
    },
  }
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Store the currently focused element
   */
  _previousFocus: null as HTMLElement | null,

  /**
   * Save the current focus to restore later
   */
  saveFocus(): void {
    if (typeof document !== 'undefined') {
      this._previousFocus = document.activeElement as HTMLElement | null
    }
  },

  /**
   * Restore focus to the previously saved element
   */
  restoreFocus(): void {
    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      this._previousFocus.focus()
      this._previousFocus = null
    }
  },

  /**
   * Focus the first focusable element within a container
   *
   * @param container - Container element to search within
   * @returns The focused element, or null if none found
   */
  focusFirst(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[0].focus()
      return focusable[0]
    }
    return null
  },

  /**
   * Get all focusable elements within a container
   *
   * @param container - Container element to search within
   * @returns Array of focusable elements
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(container.querySelectorAll<HTMLElement>(selector))
  },

  /**
   * Trap focus within a container (for modals, dialogs)
   *
   * @param container - Container to trap focus within
   * @returns Cleanup function to remove the trap
   */
  trapFocus(container: HTMLElement): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusable = this.getFocusableElements(container)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  },
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNav = {
  /**
   * Check if event is an activation key (Enter or Space)
   */
  isActivation(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === ' '
  },

  /**
   * Check if event is an arrow key
   */
  isArrowKey(event: KeyboardEvent): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
  },

  /**
   * Check if event is Escape
   */
  isEscape(event: KeyboardEvent): boolean {
    return event.key === 'Escape'
  },

  /**
   * Navigate a list with arrow keys
   *
   * @param event - Keyboard event
   * @param items - Array of items
   * @param currentIndex - Current focused index
   * @param orientation - 'vertical' or 'horizontal'
   * @returns New index, or -1 if not an arrow key
   */
  navigateList(
    event: KeyboardEvent,
    items: unknown[],
    currentIndex: number,
    orientation: 'vertical' | 'horizontal' = 'vertical'
  ): number {
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'

    if (event.key === nextKey) {
      return (currentIndex + 1) % items.length
    }

    if (event.key === prevKey) {
      return currentIndex <= 0 ? items.length - 1 : currentIndex - 1
    }

    if (event.key === 'Home') {
      return 0
    }

    if (event.key === 'End') {
      return items.length - 1
    }

    return -1
  },
}

/**
 * Create keyboard event handler for list navigation
 *
 * @param options - Navigation options
 * @returns Event handler function
 *
 * @example
 * ```typescript
 * const handleKeyDown = createListKeyHandler({
 *   items: menuItems,
 *   currentIndex,
 *   onIndexChange: setCurrentIndex,
 *   onSelect: (index) => selectItem(menuItems[index]),
 *   orientation: 'vertical',
 * })
 *
 * return <ul onKeyDown={handleKeyDown}>...</ul>
 * ```
 */
export function createListKeyHandler(options: {
  items: unknown[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onSelect?: (index: number) => void
  onEscape?: () => void
  orientation?: 'vertical' | 'horizontal'
}): (event: React.KeyboardEvent) => void {
  const {
    items,
    currentIndex,
    onIndexChange,
    onSelect,
    onEscape,
    orientation = 'vertical',
  } = options

  return (event: React.KeyboardEvent) => {
    const newIndex = keyboardNav.navigateList(
      event.nativeEvent,
      items,
      currentIndex,
      orientation
    )

    if (newIndex >= 0) {
      event.preventDefault()
      onIndexChange(newIndex)
    }

    if (keyboardNav.isActivation(event.nativeEvent) && onSelect) {
      event.preventDefault()
      onSelect(currentIndex)
    }

    if (keyboardNav.isEscape(event.nativeEvent) && onEscape) {
      event.preventDefault()
      onEscape()
    }
  }
}

/**
 * Hook-compatible announcer for React components
 *
 * @example
 * ```typescript
 * function ChatComponent() {
 *   const announceRef = useRef<((msg: string) => void) | null>(null)
 *
 *   useEffect(() => {
 *     const { announce, cleanup } = createLiveRegion('chat-announce')
 *     announceRef.current = announce
 *     return cleanup
 *   }, [])
 *
 *   const handleNewMessage = (msg: Message) => {
 *     announceRef.current?.(`New message from ${msg.agent}: ${msg.content.slice(0, 50)}`)
 *   }
 * }
 * ```
 */
export function getAnnouncer(id: string): { announce: (message: string) => void } {
  const { announce } = createLiveRegion(id, 'polite')
  return { announce }
}
