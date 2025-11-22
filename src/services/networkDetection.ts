/**
 * Network Detection Service
 *
 * Provides real-time network status detection and offline handling
 */

type NetworkStatusCallback = (isOnline: boolean) => void

class NetworkDetectionService {
  private listeners: Set<NetworkStatusCallback> = new Set()
  private isOnline: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private handleOnline = () => {
    console.log('[Network Detection] Network connection restored')
    this.isOnline = true
    this.notifyListeners(true)

    // Dispatch custom event for UI components
    window.dispatchEvent(
      new CustomEvent('network-status-changed', {
        detail: { isOnline: true },
      })
    )
  }

  private handleOffline = () => {
    console.warn('[Network Detection] Network connection lost')
    this.isOnline = false
    this.notifyListeners(false)

    // Dispatch custom event for UI components
    window.dispatchEvent(
      new CustomEvent('network-status-changed', {
        detail: { isOnline: false },
      })
    )
  }

  private notifyListeners(status: boolean) {
    this.listeners.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error('[Network Detection] Error in listener callback:', error)
      }
    })
  }

  /**
   * Get current network status
   */
  getStatus(): boolean {
    return this.isOnline
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Check if network error indicates offline status
   */
  isNetworkError(error: unknown): boolean {
    if (!error) return false

    const message = error instanceof Error ? error.message : String(error)
    const normalized = message.toLowerCase()

    return (
      normalized.includes('network') ||
      normalized.includes('fetch') ||
      normalized.includes('enotfound') ||
      normalized.includes('econnrefused') ||
      normalized.includes('econnreset') ||
      normalized.includes('etimedout') ||
      normalized.includes('internet_disconnected') ||
      normalized.includes('name_not_resolved')
    )
  }

  /**
   * Throw user-friendly error if offline
   */
  throwIfOffline(operation: string = 'this operation') {
    if (!this.isOnline) {
      throw new Error(
        `Cannot perform ${operation} - you appear to be offline. Please check your internet connection and try again.`
      )
    }
  }

  /**
   * Cleanup listeners
   */
  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.listeners.clear()
  }
}

// Export singleton instance
export const networkDetection = new NetworkDetectionService()

// React hook for network status
import * as React from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(networkDetection.getStatus())

  React.useEffect(() => {
    const unsubscribe = networkDetection.subscribe(setIsOnline)
    return unsubscribe
  }, [])

  return { isOnline }
}
