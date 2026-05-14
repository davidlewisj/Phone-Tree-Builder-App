// Reusable form section component for grouping related form fields

export default function FormSection({ title, children, isSpecial = false }) {
  if (isSpecial) {
    return (
      <div className="inspector-special">
        {title && <h4 className="hours-title">{title}</h4>}
        {children}
      </div>
    );
  }

  return (
    <div className="form-section">
      {title && <h3 className="form-section__title">{title}</h3>}
      {children}
    </div>
  );
}
