import { useState, useEffect, useRef, useCallback } from "react";
import { replayApi } from "../services/api";

export function useReplaySession() {
  // session list
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  // selected session
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // playback
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // ms per turn, user-adjustable
  const intervalRef = useRef(null);

  // fetch session list on mount
  useEffect(() => {
    setSessionsLoading(true);
    replayApi
      .listSessions()
      .then((res) => setSessions(res.data))
      .catch((err) => setSessionsError(err))
      .finally(() => setSessionsLoading(false));
  }, []);

  // fetch detail + messages when a session is selected
  const selectSession = useCallback((sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentTurnIndex(0);
    setIsPlaying(false);
    setLoading(true);
    setError(null);
    Promise.all([
      replayApi.getSessionDetail(sessionId),
      replayApi.getSessionMessages(sessionId),
    ])
      .then(([detailRes, messagesRes]) => {
        setSessionDetail(detailRes.data);
        setMessages(messagesRes.data);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  // navigation controls
  const goFirst = useCallback(() => setCurrentTurnIndex(0), []);
  const goLast = useCallback(
    () => setCurrentTurnIndex(Math.max(messages.length - 1, 0)),
    [messages.length]
  );
  const goNext = useCallback(() => {
    setCurrentTurnIndex((i) => Math.min(i + 1, messages.length - 1));
  }, [messages.length]);
  const goPrev = useCallback(() => {
    setCurrentTurnIndex((i) => Math.max(i - 1, 0));
  }, []);
  const goToTurn = useCallback(
    (index) => {
      setCurrentTurnIndex(Math.max(0, Math.min(index, messages.length - 1)));
    },
    [messages.length]
  );

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  // auto-play interval — re-reads playbackSpeed whenever it changes
  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrentTurnIndex((i) => {
        if (i >= messages.length - 1) {
          setIsPlaying(false); // auto-stop at last turn
          return i;
        }
        return i + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, playbackSpeed, messages.length]);

  return {
    // session list
    sessions,
    sessionsLoading,
    sessionsError,

    // selected session
    selectedSessionId,
    sessionDetail,
    messages,
    loading,
    error,
    selectSession,

    // playback
    currentTurnIndex,
    currentMessage: messages[currentTurnIndex] ?? null,
    goFirst,
    goPrev,
    goNext,
    goLast,
    goToTurn,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
  };
}