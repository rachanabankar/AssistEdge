import { useState, useCallback } from 'react'
import { sessionApi, simulateApi } from '../services/api'
import { INTERACTION_MODES } from '../config/constants'

export function useSimulatorSession() {
  const [sessionId, setSessionId] = useState(null)
  const [scenario, setScenario] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [sentimentHistory, setSentimentHistory] = useState([]) // NEW: [{ turn, score }]
  const [knowledgeSuggestions, setKnowledgeSuggestions] = useState([])
  const [coaching, setCoaching] = useState(null)
  const [escalation, setEscalation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const applyPipelineResult = useCallback((result) => {
    setSentiment(result.sentiment ?? null)

    // Only append to history when a real score comes back — sentiment can
    // legitimately be null mid-pipeline (orchestrator try/excepts each
    // agent independently), so don't push a broken point into the trend.
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
    scenario: scenarioText,
    customerTone = null,
    patienceLevel = null,
    productContext = null,
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: session } = await sessionApi.create({
        mode: INTERACTION_MODES.SIMULATOR,
        scenario: scenarioText,
        customer_tone: customerTone,
        patience_level: patienceLevel,
        product_context: productContext,
      })

      const { data: firstTurn } = await simulateApi.sendTurn({
        scenario: scenarioText,
        conversation_history: [],
        session_id: session.id,
      })

      setScenario(scenarioText)
      setSessionId(session.id)
      setConversationHistory([{ sender: 'customer', content: firstTurn.message }])
      applyPipelineResult(firstTurn)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to start session')
    } finally {
      setIsLoading(false)
    }
  }, [applyPipelineResult])

  const sendAgentReply = useCallback(async (text) => {
    if (!sessionId || !text.trim()) return
    setIsLoading(true)
    setError(null)

    const historyWithAgentReply = [
      ...conversationHistory,
      { sender: 'agent', content: text.trim() },
    ]
    setConversationHistory(historyWithAgentReply)

    try {
      const { data: turnResult } = await simulateApi.sendTurn({
        scenario,
        conversation_history: historyWithAgentReply,
        session_id: sessionId,
      })

      setConversationHistory([
        ...historyWithAgentReply,
        { sender: 'customer', content: turnResult.message },
      ])
      applyPipelineResult(turnResult)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to send reply')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, scenario, conversationHistory, applyPipelineResult])

  const endSession = useCallback(() => {
    setSessionId(null)
    setScenario('')
    setConversationHistory([])
    setSentiment(null)
    setSentimentHistory([]) // NEW
    setKnowledgeSuggestions([])
    setCoaching(null)
    setEscalation(null)
    setError(null)
  }, [])

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
    sendAgentReply,
    endSession,
  }
}