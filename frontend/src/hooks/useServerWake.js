import { useSyncExternalStore } from 'react'

const pending = new Map()
const listeners = new Set()
let status = 'idle'

function updateStatus() {
  const next = [...pending.values()].some((request) => request.waking) ? 'waking' : 'idle'
  if (next === status) return
  status = next
  listeners.forEach((listener) => listener())
}

export function trackRequest(config) {
  const id = Symbol('request')
  config.serverWakeId = id
  const request = { waking: false, timer: null }
  request.timer = setTimeout(() => {
    request.waking = true
    updateStatus()
  }, 4000)
  pending.set(id, request)
}

export function finishRequest(config) {
  const request = pending.get(config?.serverWakeId)
  if (!request) return
  clearTimeout(request.timer)
  pending.delete(config.serverWakeId)
  updateStatus()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useServerWake() {
  return useSyncExternalStore(subscribe, () => status, () => 'idle')
}
