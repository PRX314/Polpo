const ProgressBar = ({ pct, label }) => (
  <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Avanzamento'}>
    <span style={{ width: `${pct}%` }} />
  </div>
)

export default ProgressBar
