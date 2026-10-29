import Icon from './Icon.jsx';

export function PageHead({ eyebrow, title, description, actions }) {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ title, meta, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {meta && <p className="section-meta">{meta}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = 'spark', title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
