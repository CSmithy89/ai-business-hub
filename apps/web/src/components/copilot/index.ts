/**
 * CopilotKit Components Barrel Export
 *
 * Exports all CopilotKit integration components for the HYVVE dashboard.
 * These components provide the AI assistant chat interface powered by CopilotKit.
 *
 * @see docs/modules/bm-dm/stories/dm-01-4-copilotkit-chat-integration.md
 * Epic: DM-01 | Stories: DM-01.1, DM-01.4
 */

// Provider (from DM-01.1)
export { CopilotKitProvider } from './CopilotKitProvider';

// Chat components (from DM-01.4)
export { CopilotChat } from './CopilotChat';
export { CopilotChatButton } from './CopilotChatButton';
export { CopilotKeyboardShortcut } from './CopilotKeyboardShortcut';

// Hooks (from DM-01.4)
export { useCopilotChatState } from './use-copilot-chat-state';
