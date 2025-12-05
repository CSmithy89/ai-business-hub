/**
 * Optimistic Mutation Hook
 *
 * Provides optimistic UI updates with automatic rollback on error.
 * Built on top of React Query's useMutation.
 *
 * @module hooks/use-optimistic-mutation
 */

'use client'

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Options for optimistic mutations
 */
interface OptimisticMutationOptions<TData, TError, TVariables, TContext> {
  /** The query key(s) to update optimistically */
  queryKey: unknown[]

  /** Function to perform the actual mutation */
  mutationFn: (variables: TVariables) => Promise<TData>

  /**
   * Function to compute optimistic data
   * Receives current data and variables, should return updated data
   */
  optimisticUpdate: (currentData: TData | undefined, variables: TVariables) => TData

  /**
   * Optional function to extract item ID for list updates
   * Used for operations like adding/removing items from lists
   */
  getItemId?: (variables: TVariables) => string

  /** Success message for toast notification */
  successMessage?: string | ((data: TData, variables: TVariables) => string)

  /** Error message for toast notification */
  errorMessage?: string | ((error: TError) => string)

  /** Additional mutation options */
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSettled'
  >
}

/**
 * Context returned from optimistic mutation
 */
interface OptimisticContext<TData> {
  previousData: TData | undefined
}

/**
 * Hook for mutations with optimistic updates
 *
 * Automatically:
 * - Updates the cache optimistically before the server responds
 * - Rolls back on error
 * - Shows toast notifications for success/error
 *
 * @example
 * ```typescript
 * // Adding an item to a list
 * const { mutate: addMessage } = useOptimisticMutation({
 *   queryKey: ['chat', 'messages', sessionId],
 *   mutationFn: (message) => api.sendMessage(sessionId, message),
 *   optimisticUpdate: (messages, newMessage) => [
 *     ...(messages || []),
 *     { ...newMessage, id: 'temp-' + Date.now(), pending: true },
 *   ],
 *   successMessage: 'Message sent',
 *   errorMessage: 'Failed to send message',
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Updating a single item
 * const { mutate: updateBusiness } = useOptimisticMutation({
 *   queryKey: ['business', businessId],
 *   mutationFn: (data) => api.updateBusiness(businessId, data),
 *   optimisticUpdate: (current, updates) => ({
 *     ...current,
 *     ...updates,
 *   }),
 *   successMessage: 'Business updated',
 * })
 * ```
 */
export function useOptimisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  successMessage,
  errorMessage,
  options,
}: OptimisticMutationOptions<TData, TError, TVariables, OptimisticContext<TData>>) {
  const queryClient = useQueryClient()

  return useMutation<TData, TError, TVariables, OptimisticContext<TData>>({
    mutationFn,

    // Before mutation, update cache optimistically
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update to the new value
      const optimisticData = optimisticUpdate(previousData, variables)
      queryClient.setQueryData<TData>(queryKey, optimisticData)

      // Return context with previous data for rollback
      return { previousData }
    },

    // On error, rollback to previous value
    onError: (error, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      // Show error toast
      const message =
        typeof errorMessage === 'function'
          ? errorMessage(error)
          : errorMessage || 'An error occurred'
      toast.error(message)
    },

    // On success, show success message
    onSuccess: (data, variables) => {
      if (successMessage) {
        const message =
          typeof successMessage === 'function'
            ? successMessage(data, variables)
            : successMessage
        toast.success(message)
      }
    },

    // Always refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },

    ...options,
  })
}

/**
 * Options for optimistic list operations
 * Note: _TError is passed through to useMutation but not used in interface fields
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface OptimisticListOptions<TItem, _TError, TAddVariables, TRemoveVariables> {
  /** Query key for the list */
  queryKey: unknown[]

  /** Function to add an item */
  addFn?: (variables: TAddVariables) => Promise<TItem>

  /** Function to remove an item */
  removeFn?: (variables: TRemoveVariables) => Promise<void>

  /** Create an optimistic item for add operations */
  createOptimisticItem?: (variables: TAddVariables) => TItem

  /** Get the ID of an item */
  getItemId: (item: TItem) => string

  /** Get the ID from remove variables */
  getRemoveId?: (variables: TRemoveVariables) => string

  /** Success messages */
  messages?: {
    addSuccess?: string
    removeSuccess?: string
    addError?: string
    removeError?: string
  }
}

/**
 * Hook for optimistic list operations (add/remove)
 *
 * @example
 * ```typescript
 * const { add, remove } = useOptimisticList<Message, string, MessageInput>({
 *   queryKey: ['messages', sessionId],
 *   addFn: (input) => api.createMessage(sessionId, input),
 *   removeFn: (id) => api.deleteMessage(sessionId, id),
 *   createOptimisticItem: (input) => ({
 *     id: 'temp-' + Date.now(),
 *     ...input,
 *     pending: true,
 *   }),
 *   getItemId: (msg) => msg.id,
 *   getRemoveId: (id) => id,
 *   messages: {
 *     addSuccess: 'Message added',
 *     removeSuccess: 'Message deleted',
 *   },
 * })
 *
 * // Usage
 * add({ content: 'Hello' })
 * remove(messageId)
 * ```
 */
export function useOptimisticList<
  TItem,
  TError = Error,
  TAddVariables = void,
  TRemoveVariables = string,
>({
  queryKey,
  addFn,
  removeFn,
  createOptimisticItem,
  getItemId,
  getRemoveId = (v) => v as string,
  messages = {},
}: OptimisticListOptions<TItem, TError, TAddVariables, TRemoveVariables>) {
  const queryClient = useQueryClient()

  const addMutation = useMutation<TItem, TError, TAddVariables, { previousData: TItem[] | undefined }>({
    mutationFn: addFn!,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<TItem[]>(queryKey)

      if (createOptimisticItem) {
        const optimisticItem = createOptimisticItem(variables)
        queryClient.setQueryData<TItem[]>(queryKey, (old) => [
          ...(old || []),
          optimisticItem,
        ])
      }

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error(messages.addError || 'Failed to add item')
    },

    onSuccess: () => {
      if (messages.addSuccess) {
        toast.success(messages.addSuccess)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const removeMutation = useMutation<void, TError, TRemoveVariables, { previousData: TItem[] | undefined }>({
    mutationFn: removeFn!,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<TItem[]>(queryKey)

      const removeId = getRemoveId(variables)
      queryClient.setQueryData<TItem[]>(queryKey, (old) =>
        old?.filter((item) => getItemId(item) !== removeId)
      )

      return { previousData }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error(messages.removeError || 'Failed to remove item')
    },

    onSuccess: () => {
      if (messages.removeSuccess) {
        toast.success(messages.removeSuccess)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    add: addFn ? addMutation.mutate : undefined,
    remove: removeFn ? removeMutation.mutate : undefined,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    addMutation,
    removeMutation,
  }
}
