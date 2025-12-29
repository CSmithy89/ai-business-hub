/**
 * Copilot Chat State Store
 *
 * Zustand store managing the CopilotKit chat panel open/close state.
 * This state is shared between the CopilotChat component and keyboard shortcut handler.
 *
 * Features:
 * - isOpen: Boolean indicating if the chat panel is visible
 * - setIsOpen: Direct setter for open state
 * - toggle: Toggle between open and closed
 * - open/close: Explicit state setters
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * Epic: DM-01 | Story: DM-01.4
 */

import { create } from 'zustand';

interface CopilotChatState {
  /** Whether the chat panel is currently open */
  isOpen: boolean;
  /** Set the open state directly */
  setIsOpen: (open: boolean) => void;
  /** Toggle the chat panel open/closed */
  toggle: () => void;
  /** Open the chat panel */
  open: () => void;
  /** Close the chat panel */
  close: () => void;
}

export const useCopilotChatState = create<CopilotChatState>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
