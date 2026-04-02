type LoadingSpinnerProps = {
  message?: string;
  progress?: number;
};

export default function LoadingSpinner({ message, progress = 0 }: LoadingSpinnerProps) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="loadingOverlay">
      <div className="loadingContent">
        <div className="spinner">
          <div className="spinnerRing" />
          <div className="spinnerRing spinnerRing2" />
          <div className="spinnerRing spinnerRing3" />
        </div>
        <p className="loadingText">{message || "Analyzing research landscape…"}</p>
        <div className="loadingProgressWrap">
          <div className="loadingProgressMeta">
            <span>Current progress</span>
            <span>{clampedProgress}%</span>
          </div>
          <div className="loadingProgressTrack">
            <div
              className="loadingProgressFill"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
        <div className="loadingSteps">
          <span className={`loadingStep ${clampedProgress >= 20 ? "active" : ""}`}>Selecting papers</span>
          <span className={`loadingStep ${clampedProgress >= 45 ? "active" : ""}`}>Extracting limitations</span>
          <span className={`loadingStep ${clampedProgress >= 70 ? "active" : ""}`}>Synthesizing gaps</span>
          <span className={`loadingStep ${clampedProgress >= 90 ? "active" : ""}`}>Scoring directions</span>
        </div>
      </div>
    </div>
  );
}
