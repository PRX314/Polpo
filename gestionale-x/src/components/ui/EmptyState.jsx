const EmptyState = ({ title, hint, children }) => (
  <div className="empty">
    <strong>{title}</strong>
    {hint && <p className="small">{hint}</p>}
    {children}
  </div>
)

export default EmptyState
