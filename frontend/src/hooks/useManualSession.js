import { useState, useCallback } from 'react'
import { sessionApi, manualApi } from '../services/api'
import { INTERACTION_MODES } from '../config/constants'

export function useManualSession() {
  const [sessionId, setSessionId] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [sentimentHistory, setSentimentHistory] = useState([]) // [{ turn, score }]
  const [knowledgeSuggestions, setKnowledgeSuggestions] = useState([])
  const [coaching, setCoaching] = useState(null)
  const [escalation, setEscalation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const applyPipelineResult = useCallback((result) => {
    setSentiment(result.sentiment ?? null)

    if (result.sentiment?.frustration_score != null) {
      setSentimentHistory((prev) => [
        ...prev,
        { turn: prev.length + 1, score: result.sentiment.frustration_score },
      ])
    }

    setKnowledgeSuggestions(result.knowledge_suggestions ?? [])
    setCoaching(result.coaching ?? null)
    setEscalation(result.escalation ?? null)
  }, [])

  const startSession = useCallback(async ({
    scenario = null,
    customerTone = null,
    patienceLevel = null,
    productContext = null,
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: session } = await sessionApi.create({
        mode: INTERACTION_MODES.MANUAL,
        scenario,
        customer_tone: customerTone,
        patience_level: patienceLevel,
        product_context: productContext,
      })

      setSessionId(session.id)
      setConversationHistory([])
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to start session')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logAgentReply = useCallback((text) => {
    if (!text.trim()) return
    setConversationHistory((prev) => [
      ...prev,
      { sender: 'agent', content: text.trim() },
    ])
  }, [])

  const sendCustomerMessage = useCallback(async (text) => {
    if (!sessionId || !text.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const { data: turnResult } = await manualApi.sendTurn({
        session_id: sessionId,
        customer_message: text.trim(),
        conversation_history: conversationHistory,
      })

      setConversationHistory((prev) => [
        ...prev,
        { sender: 'customer', content: text.trim() },
      ])
      applyPipelineResult(turnResult)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to process message')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, conversationHistory, applyPipelineResult])

  const endSession = useCallback(async () => {
    const lastEntry = conversationHistory[conversationHistory.length - 1]
    if (sessionId && lastEntry && lastEntry.sender === 'agent') {
      try {
        await manualApi.endSession({
          session_id: sessionId,
          final_agent_reply: lastEntry.content,
        })
      } catch (err) {
        console.error('Failed to save final agent reply', err)
      }
    }
    setSessionId(null)
    setConversationHistory([])
    setSentiment(null)
    setSentimentHistory([])
    setKnowledgeSuggestions([])
    setCoaching(null)
    setEscalation(null)
    setError(null)
  }, [sessionId, conversationHistory])

  return {
    sessionId,
    conversationHistory,
    sentiment,
    sentimentHistory,
    knowledgeSuggestions,
    coaching,
    escalation,
    isLoading,
    error,
    startSession,
    logAgentReply,
    sendCustomerMessage,
    endSession,
  }
}