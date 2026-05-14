import { useState, useCallback, useRef, useEffect } from 'react';

export function useHistory(initialState, maxHistory = 50) {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const historyRef = useRef([initialState]);
  const indexRef = useRef(0);

  const push = useCallback(newState => {
    const newHistory = historyRef.current.slice(0, indexRef.current + 1);
    newHistory.push(newState);
    while (newHistory.length > maxHistory) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    indexRef.current = newHistory.length - 1;
    setHistory([...newHistory]);
    setCurrentIndex(indexRef.current);
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--;
      setCurrentIndex(indexRef.current);
      return historyRef.current[indexRef.current];
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      setCurrentIndex(indexRef.current);
      return historyRef.current[indexRef.current];
    }
    return null;
  }, []);

  const current = historyRef.current[indexRef.current] || initialState;
  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return {
    current,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
