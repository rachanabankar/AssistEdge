import { useEffect, useRef, useState, useCallback } from 'react'
import { WSClient } from '../services/websocket'

/**
 * React hook for a WebSocket connection.
 *
 * @param {string} url - full ws:// or wss:// URL to connect to
 * @param {object} options
 * @param {boolean} options.enabled - only connect when true (e.g. mode is active)
 *
 * @returns {{
 *   isConnected: boolean,
 *   lastMessage: any,
 *   sendMessage: (data: any) => void,
 * }}
 *
 * Usage (per interaction mode):
 *   const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl, { enabled: mode === 'simulator' })
 */
export function useWebSocket(url, { enabled = true } = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const clientRef = useRef(null)

  useEffect(() => {
    if (!enabled || !url) return undefined

    const client = new WSClient(url, {
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    })
    clientRef.current = client
    client.connect()

    const unsubscribe = client.subscribe((message) => {
      setLastMessage(message)
    })

    return () => {
      unsubscribe()
      client.close()
      clientRef.current = null
    }
  }, [url, enabled])

  const sendMessage = useCallback((data) => {
    clientRef.current?.send(data)
  }, [])

  return { isConnected, lastMessage, sendMessage }
}