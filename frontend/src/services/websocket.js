/**
 * Generic WebSocket client wrapper.
 * Handles connect, reconnect-with-backoff, message parsing, and
 * subscription-style listeners so React hooks/components stay simple.
 *
 * Reused across Simulator, Manual, and Replay modes - each mode just
 * connects with a different endpoint/params and reacts to the same
 * event shape.
 */

const DEFAULT_RECONNECT_DELAY_MS = 1500
const MAX_RECONNECT_DELAY_MS = 15000

export class WSClient {
  constructor(url, { onOpen, onClose, onError, autoReconnect = true } = {}) {
    this.url = url
    this.autoReconnect = autoReconnect
    this.socket = null
    this.listeners = new Set()
    this.reconnectDelay = DEFAULT_RECONNECT_DELAY_MS
    this.isManuallyClosed = false

    this.callbacks = { onOpen, onClose, onError }
  }

  connect() {
    this.isManuallyClosed = false
    this.socket = new WebSocket(this.url)

    this.socket.onopen = (event) => {
      this.reconnectDelay = DEFAULT_RECONNECT_DELAY_MS // reset backoff on success
      this.callbacks.onOpen?.(event)
    }

    this.socket.onmessage = (event) => {
      let payload = event.data
      try {
        payload = JSON.parse(event.data)
      } catch {
        // not JSON, pass through raw string
      }
      this.listeners.forEach((listener) => listener(payload))
    }

    this.socket.onerror = (event) => {
      this.callbacks.onError?.(event)
    }

    this.socket.onclose = (event) => {
      this.callbacks.onClose?.(event)
      if (this.autoReconnect && !this.isManuallyClosed) {
        this._scheduleReconnect()
      }
    }
  }

  _scheduleReconnect() {
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)
    // exponential backoff, capped
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data)
      this.socket.send(payload)
    } else {
      console.warn('[WSClient] Attempted to send while socket not open.')
    }
  }

  /** Register a callback invoked on every incoming message. Returns an unsubscribe fn. */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  close() {
    this.isManuallyClosed = true
    this.socket?.close()
  }
}