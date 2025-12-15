# Epic Technical Specification: Premium Polish & Advanced Features

**Date:** 2025-12-11
**Author:** Party Mode (PM John, Architect Winston, Dev Amelia, SM Bob, UX Sally)
**Epic ID:** EPIC-16
**Status:** Draft
**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md
**Prerequisite:** EPIC-15 (UI/UX Platform Foundation)

---

## Overview

EPIC-16 implements **Premium Polish & Advanced Features** for the HYVVE platform, elevating the user experience from functional to delightful. This epic focuses on responsive design, micro-animations, real-time updates, and celebration moments that create an exceptional, modern SaaS experience.

This epic delivers:
- **Responsive layouts** - Seamless experience from mobile to 4K
- **Loading excellence** - Skeleton screens, optimistic UI, no full-page spinners
- **Micro-animations** - Subtle feedback that makes interactions feel premium
- **Real-time updates** - WebSocket-powered live data without refresh
- **Power user features** - Comprehensive keyboard shortcuts, drag-and-drop

## Objectives and Scope

### In Scope

- **Responsive Design**: Medium screens (1024-1280px), tablet (768-1024px), mobile (<768px)
- **Loading States**: Skeleton screens, optimistic UI, form feedback
- **Micro-Animations**: Hover effects, page transitions, modal animations
- **Shadow System**: Premium shadow hierarchy with dark mode glows
- **Typography**: Font refinements, letter-spacing, line-height
- **Real-Time**: WebSocket updates for approvals, agents, notifications
- **Keyboard Shortcuts**: Global navigation, context-specific actions
- **Drag-and-Drop**: Approval queue reordering
- **Empty States**: Character-driven illustrations and copy
- **Celebration Moments**: Confetti, badges, animations on achievements

### Out of Scope

- Native mobile app (future consideration)
- Offline mode / PWA (future epic)
- Multi-language i18n (separate epic)
- Advanced analytics dashboards (separate module)

---

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| AppLayout | Main responsive layout wrapper | `apps/web/src/components/layout/app-layout.tsx` |
| MobileNav | Bottom navigation for mobile | `apps/web/src/components/layout/mobile-nav.tsx` |
| MobileSidebar | Drawer sidebar for tablet | `apps/web/src/components/layout/mobile-sidebar.tsx` |
| SkeletonCard | Loading skeleton component | `apps/web/src/components/ui/skeleton-card.tsx` |
| EmptyState | Character-driven empty state | `apps/web/src/components/ui/empty-state.tsx` |
| Confetti | Celebration animation | `apps/web/src/components/ui/confetti.tsx` |
| RealtimeProvider | WebSocket context provider | `apps/web/src/providers/realtime-provider.tsx` |
| ShortcutsProvider | Keyboard shortcuts manager | `apps/web/src/providers/shortcuts-provider.tsx` |

### Architecture Constraints

- WebSocket must use Socket.io (already in tech stack)
- Animations must respect `prefers-reduced-motion`
- Touch targets minimum 44x44px per WCAG
- Real-time events must use existing Event Bus patterns (EPIC-05)

---

## Detailed Design

### Stories 16.1-16.3: Responsive Design Implementation

#### Breakpoint System

```typescript
// apps/web/src/lib/breakpoints.ts
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Tailwind classes reference:
// max-sm: < 640px (mobile)
// sm: >= 640px
// md: >= 768px (tablet)
// lg: >= 1024px (desktop)
// xl: >= 1280px (large desktop)
```

#### Story 16.1: Medium Screen Layout (1024-1280px)

**Responsive Layout Hook:**
```typescript
// apps/web/src/hooks/use-responsive-layout.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LayoutPriority = 'sidebar' | 'chat';

interface ResponsiveLayoutState {
  sidebarCollapsed: boolean;
  chatCollapsed: boolean;
  layoutPriority: LayoutPriority;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setChatCollapsed: (collapsed: boolean) => void;
  setLayoutPriority: (priority: LayoutPriority) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
}

export const useResponsiveLayout = create<ResponsiveLayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      chatCollapsed: false,
      layoutPriority: 'sidebar',

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setChatCollapsed: (collapsed) => set({ chatCollapsed: collapsed }),
      setLayoutPriority: (priority) => set({ layoutPriority: priority }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChat: () => set((s) => ({ chatCollapsed: !s.chatCollapsed })),
    }),
    { name: 'responsive-layout' }
  )
);

// Auto-collapse logic for medium screens
export function useAutoCollapse() {
  const { layoutPriority, setSidebarCollapsed, setChatCollapsed } = useResponsiveLayout();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Medium screens (1024-1280): collapse one panel
      if (width >= 1024 && width < 1280) {
        if (layoutPriority === 'sidebar') {
          setChatCollapsed(true);
          setSidebarCollapsed(false);
        } else {
          setSidebarCollapsed(true);
          setChatCollapsed(false);
        }
      }
      // Large screens: expand both
      else if (width >= 1280) {
        setSidebarCollapsed(false);
        setChatCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutPriority]);
}
```

**Collapsible Sidebar with Hover Expand:**
```typescript
// apps/web/src/components/layout/sidebar.tsx
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useResponsiveLayout();
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const isExpanded = !sidebarCollapsed || hoverExpanded;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-cream border-r transition-all duration-200',
        isExpanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={() => sidebarCollapsed && setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-4">
          <Logo collapsed={!isExpanded} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={!isExpanded}
            />
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-4 hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
```

#### Story 16.2: Tablet Layout (768-1024px)

**Mobile Sidebar Drawer:**
```typescript
// apps/web/src/components/layout/mobile-sidebar.tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSwipeable } from 'react-swipeable';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => setOpen(true),
    onSwipedLeft: () => setOpen(false),
    trackMouse: false,
  });

  return (
    <>
      {/* Swipe detection area */}
      <div
        {...swipeHandlers}
        className="fixed left-0 top-0 bottom-0 w-4 z-40 md:hidden"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-4 border-b">
              <Logo />
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Chat Bottom Sheet:**
```typescript
// apps/web/src/components/layout/chat-bottom-sheet.tsx
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

export function ChatBottomSheet() {
  const [open, setOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState<number | string>(0.4);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      snapPoints={[0.4, 0.8, 1]}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={setSnapPoint}
    >
      <DrawerTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[96vh]">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
        <ChatPanel />
      </DrawerContent>
    </Drawer>
  );
}
```

#### Story 16.3: Mobile Layout (<768px)

**Mobile Bottom Navigation:**
```typescript
// apps/web/src/components/layout/mobile-nav.tsx
const mobileNavItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/businesses', icon: Building2, label: 'Business' },
  { href: '/approvals', icon: CheckCircle, label: 'Approvals', badge: true },
  { href: '/ai-team', icon: Bot, label: 'AI Team' },
  { href: '#more', icon: MoreHorizontal, label: 'More', action: 'menu' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pendingCount } = useApprovals();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe md:hidden">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.action === 'menu') {
              return (
                <button
                  key={item.href}
                  onClick={() => setMoreOpen(true)}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-coral')} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 relative"
              >
                <item.icon className={cn('h-5 w-5', isActive && 'text-coral')} />
                <span className={cn('text-xs', isActive && 'text-coral font-medium')}>
                  {item.label}
                </span>
                {item.badge && pendingCount > 0 && (
                  <Badge className="absolute -top-1 right-0 h-4 min-w-4 p-0 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More menu sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <div className="grid grid-cols-3 gap-4 py-4">
            <MenuButton href="/settings" icon={Settings} label="Settings" />
            <MenuButton href="/help" icon={HelpCircle} label="Help" />
            <MenuButton href="/notifications" icon={Bell} label="Alerts" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Full-Screen Chat Modal:**
```typescript
// apps/web/src/components/chat/mobile-chat.tsx
export function MobileChatModal() {
  const { isOpen, close } = useMobileChatStore();

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-full h-screen max-h-screen p-0 m-0 rounded-none">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b">
            <div className="flex items-center gap-3">
              <AgentAvatar agentId="hub" size="sm" />
              <span className="font-medium">Hub</span>
            </div>
            <Button variant="ghost" size="icon" onClick={close}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <ChatMessages />
          </div>

          {/* Input */}
          <div className="border-t p-4 pb-safe">
            <ChatInput />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Story 16.5: Implement Skeleton Loading Screens

**Skeleton Components:**
```typescript
// apps/web/src/components/ui/skeleton-card.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  variant?: 'business' | 'agent' | 'approval' | 'stat';
}

export function SkeletonCard({ variant = 'business' }: SkeletonCardProps) {
  if (variant === 'business') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <Skeleton className="h-9 w-full mt-4" />
      </Card>
    );
  }

  if (variant === 'agent') {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-3 w-32 mb-4" />
          <div className="flex gap-4 w-full">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'approval') {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  // stat variant
  return (
    <Card className="p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </Card>
  );
}

// Grid skeleton
export function SkeletonGrid({ count = 6, variant }: { count?: number; variant?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant as any} />
      ))}
    </div>
  );
}
```

**CSS Animation:**
```css
/* apps/web/src/app/globals.css */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background: linear-gradient(
    90deg,
    var(--bg-soft) 0%,
    var(--bg-cream) 50%,
    var(--bg-soft) 100%
  );
  background-size: 200% 100%;
}
```

---

### Story 16.6: Implement Optimistic UI Updates

**Optimistic Approval Hook:**
```typescript
// apps/web/src/hooks/use-optimistic-approval.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useApproveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },

    // Optimistic update
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] });

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals']);

      // Optimistically update
      queryClient.setQueryData(['approvals'], (old: ApprovalItem[]) =>
        old.map((item) =>
          item.id === id ? { ...item, status: 'approved' } : item
        )
      );

      return { previousApprovals };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals'], context.previousApprovals);
      }
      toast.error('Failed to approve item. Please try again.');
    },

    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
```

---

### Story 16.9: Implement Hover & Press Animations

**Animation Utility Classes:**
```css
/* apps/web/src/app/globals.css */

/* Hover lift effect */
.hover-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Press feedback */
.press-feedback {
  transition: transform 100ms ease-out;
}

.press-feedback:active {
  transform: scale(0.98);
}

/* Icon button scale */
.icon-hover {
  transition: transform 150ms ease-out;
}

.icon-hover:hover {
  transform: scale(1.05);
}

/* Link underline animation */
.link-underline {
  position: relative;
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width 200ms ease-out;
}

.link-underline:hover::after {
  width: 100%;
}

/* List item hover */
.list-item-hover {
  transition: background-color 150ms ease-out;
}

.list-item-hover:hover {
  background-color: var(--bg-soft);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hover-lift,
  .press-feedback,
  .icon-hover,
  .link-underline::after {
    transition: none;
  }

  .hover-lift:hover {
    transform: none;
  }

  .press-feedback:active {
    transform: none;
  }

  .icon-hover:hover {
    transform: none;
  }
}
```

---

### Story 16.10: Implement Page Transition Animations

**Animation Wrapper Component:**
```typescript
// apps/web/src/components/layout/page-transition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Respect reduced motion preference
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### Story 16.15: Implement WebSocket Real-Time Updates

**Realtime Provider:**
```typescript
// apps/web/src/providers/realtime-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspace } from '@/hooks/use-workspace';

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: Date;
}

interface RealtimeContextType {
  connected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { session } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!session?.accessToken || !workspaceId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      auth: {
        token: session.accessToken,
      },
      query: {
        workspaceId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Realtime connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Realtime disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Realtime connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session?.accessToken, workspaceId]);

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (!socket) return () => {};

      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    },
    [socket]
  );

  const emit = useCallback(
    (event: string, data: any) => {
      socket?.emit(event, data);
    },
    [socket]
  );

  return (
    <RealtimeContext.Provider value={{ connected, subscribe, emit }}>
      {children}
      {!connected && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reconnecting...
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
```

**Realtime Hook for Approvals:**
```typescript
// apps/web/src/hooks/use-realtime-approvals.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/providers/realtime-provider';

export function useRealtimeApprovals() {
  const queryClient = useQueryClient();
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribeCreated = subscribe('approval.created', (approval) => {
      queryClient.setQueryData(['approvals'], (old: ApprovalItem[] = []) => {
        return [approval, ...old];
      });
      toast.info(`New approval: ${approval.title}`);
    });

    const unsubscribeUpdated = subscribe('approval.updated', (update) => {
      queryClient.setQueryData(['approvals'], (old: ApprovalItem[] = []) => {
        return old.map((item) =>
          item.id === update.id ? { ...item, ...update } : item
        );
      });
    });

    const unsubscribeDeleted = subscribe('approval.deleted', ({ id }) => {
      queryClient.setQueryData(['approvals'], (old: ApprovalItem[] = []) => {
        return old.filter((item) => item.id !== id);
      });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe, queryClient]);
}
```

**NestJS WebSocket Gateway:**
```typescript
// apps/api/src/realtime/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);
      const workspaceId = client.handshake.query.workspaceId as string;

      // Join workspace room
      client.join(`workspace:${workspaceId}`);
      client.data.userId = payload.sub;
      client.data.workspaceId = workspaceId;

      console.log(`Client connected: ${client.id} to workspace ${workspaceId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Emit to workspace
  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }
}
```

---

### Story 16.16: Implement Comprehensive Keyboard Shortcuts

**Shortcuts Provider:**
```typescript
// apps/web/src/providers/shortcuts-provider.tsx
'use client';

import { createContext, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  context?: string;
}

const ShortcutsContext = createContext<{
  shortcuts: Shortcut[];
  addShortcut: (shortcut: Shortcut) => void;
  removeShortcut: (key: string) => void;
} | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  // Global navigation shortcuts
  useHotkeys('meta+shift+a', () => router.push('/approvals'), { enableOnFormTags: false });
  useHotkeys('meta+shift+b', () => router.push('/businesses'), { enableOnFormTags: false });
  useHotkeys('meta+shift+t', () => router.push('/ai-team'), { enableOnFormTags: false });
  useHotkeys('meta+shift+s', () => router.push('/settings'), { enableOnFormTags: false });
  useHotkeys('meta+/', () => focusChatInput(), { enableOnFormTags: false });
  useHotkeys('escape', () => closeActiveModal(), { enableOnFormTags: true });
  useHotkeys('shift+/', () => openShortcutsModal(), { enableOnFormTags: false });

  const addShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => [...prev.filter((s) => s.key !== shortcut.key), shortcut]);
  }, []);

  const removeShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  }, []);

  return (
    <ShortcutsContext.Provider value={{ shortcuts, addShortcut, removeShortcut }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

// Context-specific shortcuts hook
export function useContextShortcuts(context: string, shortcuts: Shortcut[]) {
  const { addShortcut, removeShortcut } = useShortcuts();

  useEffect(() => {
    shortcuts.forEach((s) => addShortcut({ ...s, context }));

    return () => {
      shortcuts.forEach((s) => removeShortcut(s.key));
    };
  }, [context, shortcuts, addShortcut, removeShortcut]);
}

// Usage in Approvals page
export function ApprovalsShortcuts() {
  const { selectedId, approve, reject, viewDetails, moveUp, moveDown } = useApprovals();

  useHotkeys('j', () => moveDown(), { enableOnFormTags: false });
  useHotkeys('k', () => moveUp(), { enableOnFormTags: false });
  useHotkeys('a', () => selectedId && approve(selectedId), { enableOnFormTags: false });
  useHotkeys('r', () => selectedId && reject(selectedId), { enableOnFormTags: false });
  useHotkeys('v', () => selectedId && viewDetails(selectedId), { enableOnFormTags: false });

  return null;
}
```

---

### Story 16.17: Implement Approval Queue Drag-and-Drop

**Drag-and-Drop Implementation:**
```typescript
// apps/web/src/components/approval/draggable-approval-list.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableApprovalProps {
  approval: ApprovalItem;
}

function SortableApproval({ approval }: SortableApprovalProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: approval.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ApprovalCard
        approval={approval}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function DraggableApprovalList({ approvals }: { approvals: ApprovalItem[] }) {
  const [items, setItems] = useState(approvals);
  const { saveOrder } = useSaveApprovalOrder();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Save new order to API
        saveOrder(newOrder.map((i) => i.id));

        return newOrder;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((approval) => (
            <SortableApproval key={approval.id} approval={approval} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

### Story 16.18: Implement Character-Driven Empty States

**Empty State Component:**
```typescript
// apps/web/src/components/ui/empty-state.tsx
interface EmptyStateProps {
  character?: 'hub' | 'maya' | 'atlas' | 'nova' | 'echo';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const characterImages = {
  hub: '/images/characters/hub-happy.svg',
  maya: '/images/characters/maya-wave.svg',
  atlas: '/images/characters/atlas-thumbsup.svg',
  nova: '/images/characters/nova-sparkle.svg',
  echo: '/images/characters/echo-celebrate.svg',
};

export function EmptyState({
  character = 'hub',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <img
        src={characterImages[character]}
        alt={`${character} character`}
        className="h-32 w-32 mb-6"
      />

      <h3 className="text-xl font-semibold mb-2">{title}</h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>

      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

// Pre-built empty states
export const emptyStates = {
  approvals: {
    character: 'hub' as const,
    title: 'Your approval queue is clear!',
    description: 'All agent actions have been reviewed. Take a break, you\'ve earned it! 🎉',
    action: { label: 'Back to Dashboard', href: '/dashboard' },
  },
  businesses: {
    character: 'hub' as const,
    title: 'Ready to start your journey?',
    description: 'Create your first business and let our AI team help you validate, plan, and brand it.',
    action: { label: 'Create Your First Business', href: '/onboarding/wizard' },
  },
  notifications: {
    character: 'echo' as const,
    title: 'All caught up!',
    description: 'No new notifications. We\'ll let you know when something needs your attention.',
  },
};
```

---

### Story 16.25: Implement Celebration Moments

**Confetti Component:**
```typescript
// apps/web/src/components/ui/confetti.tsx
'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (!trigger) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete?.();
      return;
    }

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FF6B6B', '#4B7BEC', '#20B2AA', '#FF9F43', '#2ECC71'];

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        onComplete?.();
      }
    };

    frame();
  }, [trigger, onComplete]);

  return null;
}

// Celebration hook
export function useCelebration() {
  const [celebrating, setCelebrating] = useState(false);

  const celebrate = useCallback(() => {
    setCelebrating(true);
  }, []);

  const onComplete = useCallback(() => {
    setCelebrating(false);
  }, []);

  return {
    celebrating,
    celebrate,
    Confetti: () => <Confetti trigger={celebrating} onComplete={onComplete} />,
  };
}
```

**Badge Animation Component:**
```typescript
// apps/web/src/components/ui/badge-celebration.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeCelebrationProps {
  show: boolean;
  badge: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  onClose: () => void;
}

export function BadgeCelebration({ show, badge, onClose }: BadgeCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              {badge.icon}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold mb-2"
            >
              {badge.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground mb-6"
            >
              {badge.description}
            </motion.p>

            <Button onClick={onClose}>Awesome!</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## API Contracts

### WebSocket Events

```typescript
// Server → Client Events
interface ServerToClientEvents {
  'approval.created': (approval: ApprovalItem) => void;
  'approval.updated': (update: Partial<ApprovalItem> & { id: string }) => void;
  'approval.deleted': (data: { id: string }) => void;
  'agent.status.changed': (data: { agentId: string; status: AgentStatus }) => void;
  'notification.new': (notification: Notification) => void;
  'chat.message': (message: ChatMessage) => void;
}

// Client → Server Events
interface ClientToServerEvents {
  'presence.update': (status: 'online' | 'away' | 'busy') => void;
  'typing.start': (data: { chatId: string }) => void;
  'typing.stop': (data: { chatId: string }) => void;
}
```

### Approval Order API

```typescript
// POST /api/approvals/order
interface SaveOrderRequest {
  ids: string[]; // Ordered list of approval IDs
}

interface SaveOrderResponse {
  success: boolean;
}
```

---

## Testing Requirements

### Animation Tests

```typescript
describe('Animations', () => {
  it('respects prefers-reduced-motion', () => {
    // Mock reduced motion preference
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(<PageTransition>Content</PageTransition>);

    // Verify no animation classes applied
    expect(screen.getByText('Content').parentElement).not.toHaveClass('animate');
  });
});
```

### WebSocket Tests

```typescript
describe('Realtime', () => {
  it('reconnects on disconnect', async () => {
    const { result } = renderHook(() => useRealtime(), {
      wrapper: RealtimeProvider,
    });

    // Simulate disconnect
    act(() => {
      mockSocket.emit('disconnect');
    });

    expect(result.current.connected).toBe(false);

    // Wait for reconnect
    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });
});
```

### E2E Tests

```typescript
test('drag and drop reorders approvals', async ({ page }) => {
  await page.goto('/approvals');

  const firstItem = page.locator('[data-approval-id]').first();
  const secondItem = page.locator('[data-approval-id]').nth(1);

  const firstId = await firstItem.getAttribute('data-approval-id');
  const secondId = await secondItem.getAttribute('data-approval-id');

  // Drag first to second position
  await firstItem.dragTo(secondItem);

  // Verify order changed
  const newFirstId = await page.locator('[data-approval-id]').first().getAttribute('data-approval-id');
  expect(newFirstId).toBe(secondId);
});
```

---

## Rollout Plan

### Phase 1: Responsive Design (Stories 16.1-16.4)
- Medium screen layout
- Tablet layout with drawer
- Mobile layout with bottom nav
- Workspace/business clarification

### Phase 2: Loading States (Stories 16.5-16.8)
- Skeleton screens
- Optimistic UI
- Form validation feedback
- Demo mode consistency

### Phase 3: Micro-Animations (Stories 16.9-16.14)
- Hover and press effects
- Page transitions
- Modal animations
- Shadow system
- Typography refinements
- Background audit

### Phase 4: Real-Time & Power Features (Stories 16.15-16.17)
- WebSocket integration
- Keyboard shortcuts
- Drag-and-drop

### Phase 5: Polish & Delight (Stories 16.18-16.28)
- Empty states
- Input refinements
- Onboarding polish
- Celebrations
- Console error fixes
- Agent detail modal

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mobile usability | >90 Lighthouse | CI check |
| Animation performance | 60fps | Performance profiler |
| WebSocket uptime | >99.5% | Monitoring |
| Time to interactive | <3s | Web Vitals |
| Keyboard navigation coverage | 100% of actions | Manual audit |

---

_Tech Spec created: 2025-12-11_
_Epic: EPIC-16 Premium Polish & Advanced Features_
_Stories: 16.1-16.28_
_Prerequisite: EPIC-15 must be complete_
