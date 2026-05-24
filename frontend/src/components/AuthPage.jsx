import "../styles/auth.css";

const AuthPage = ({
  role,
  title,
  description,
  fields,
  buttonText,
  switchText,
  switchHref,
  switchLinkText,
}) => {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true">
            M
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">Munchy</span>
            <span className="auth-brand-type">{role}</span>
          </div>
        </div>

        <h1 className="auth-heading" id="auth-title">
          {title}
        </h1>
        <p className="auth-copy">{description}</p>

        <form className="auth-form">
          {fields.map((field) => (
            <div className="auth-field" key={field.id}>
              <label htmlFor={field.id}>{field.label}</label>
              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
              />
            </div>
          ))}

          <div className="auth-actions">
            <button className="auth-button" type="button">
              {buttonText}
            </button>
            <p className="auth-switch">
              {switchText} <a href={switchHref}>{switchLinkText}</a>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
};

export default AuthPage;
