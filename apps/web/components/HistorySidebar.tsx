import React, { useState } from "react";
import type { AnalyzeResponse } from "../lib/types";

export type HistoryEntry = {
  topic: string;
  timestamp: string;
  result: AnalyzeResponse;
};

type HistorySidebarProps = {
  history: HistoryEntry[];
  setHistory: (val: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => void;
  onItemClick: (entry: HistoryEntry) => void;
};

export default function HistorySidebar({ history, setHistory, onItemClick }: HistorySidebarProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startRename = (e: React.MouseEvent, index: number, currentTopic: string) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(currentTopic);
  };

  const saveRename = (index: number) => {
    if (editValue.trim() === "") {
      setEditingIndex(null);
      return;
    }
    const newHistory = [...history];
    newHistory[index].topic = editValue.trim();
    setHistory(newHistory);
    localStorage.setItem("gapforge_history", JSON.stringify(newHistory));
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") saveRename(index);
    if (e.key === "Escape") setEditingIndex(null);
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this analysis?")) {
      // Check if we are deleting the active result
      const deletedResultString = JSON.stringify(history[index].result);
      const currentResultString = sessionStorage.getItem("gapforge_result");
      
      const newHistory = history.filter((_, i) => i !== index);
      setHistory(newHistory);
      localStorage.setItem("gapforge_history", JSON.stringify(newHistory));
      
      if (currentResultString && currentResultString === deletedResultString) {
         window.location.href = "/dashboard";
      }
    }
  };

  return (
    <div className="historyPanel">
      <h3>History</h3>
      {history.length === 0 ? (
        <p className="historyEmpty">No analyses yet. Start your first research gap discovery!</p>
      ) : (
        history.map((entry, i) => (
          <div
            key={i}
            className="historyItem"
            onClick={() => {
               if (editingIndex !== i) onItemClick(entry);
            }}
          >
            {editingIndex === i ? (
              <div className="historyItemContent">
                <input 
                  autoFocus
                  className="historyRenameInput"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveRename(i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <div className="historyItemContent">
                <p className="historyTopic">{entry.topic}</p>
                <span>{entry.timestamp}</span>
              </div>
            )}
            
            {editingIndex !== i && (
              <div className="historyItemActions">
                <button className="actionBtn" title="Rename" onClick={(e) => startRename(e, i, entry.topic)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button className="actionBtn delete" title="Delete" onClick={(e) => handleDelete(e, i)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
