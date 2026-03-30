type LoadingSpinnerProps = {
  message?: string;
};

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="loadingOverlay">
      <div className="loadingContent">
        <div className="spinner">
          <div className="spinnerRing" />
          <div className="spinnerRing spinnerRing2" />
          <div className="spinnerRing spinnerRing3" />
        </div>
        <p className="loadingText">{message || "Analyzing research landscape…"}</p>
        <div className="loadingSteps">
          <span className="loadingStep active">Selecting papers</span>
          <span className="loadingStep">Extracting limitations</span>
          <span className="loadingStep">Synthesizing gaps</span>
          <span className="loadingStep">Scoring directions</span>
        </div>
      </div>
    </div>
  );
}
