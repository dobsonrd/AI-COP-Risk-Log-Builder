interface Crumb {
  label: string;
  onClick?: () => void;
}

interface Props {
  children: React.ReactNode;
  breadcrumbs?: Crumb[];
  wide?: boolean;
}

function NHSLogo() {
  return (
    <svg
      className="nhsuk-header__logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 80"
      height="40"
      width="100"
      focusable="false"
      role="img"
      aria-label="NHS"
    >
      <title>NHS</title>
      <path
        fill="currentcolor"
        d="M200 0v80H0V0h200Zm-27.5 5.5c-14.5 0-29 5-29 22 0 10.2 7.7 13.5 14.7 16.3l.7.3c5.4 2 10.1 3.9 10.1 8.4 0 6.5-8.5 7.5-14 7.5s-12.5-1.5-16-3.5L135 70c5.5 2 13.5 3.5 20 3.5 15.5 0 32-4.5 32-22.5 0-19.5-25.5-16.5-25.5-25.5 0-5.5 5.5-6.5 12.5-6.5a35 35 0 0 1 14.5 3l4-13.5c-4.5-2-12-3-20-3Zm-131 2h-22l-14 65H22l9-45h.5l13.5 45h21.5l14-65H64l-9 45h-.5l-13-45Zm63 0h-18l-13 65h17l6-28H117l-5.5 28H129l13.5-65H125L119.5 32h-20l5-24.5Z"
      />
    </svg>
  );
}

export default function Layout({ children, breadcrumbs, wide = false }: Props) {
  const containerClass = wide ? 'app-width-container' : 'nhsuk-width-container';

  return (
    <div>
      <header className="nhsuk-header" data-module="nhsuk-header" role="banner">
        <div className="nhsuk-header__container nhsuk-width-container">
          <div className="nhsuk-header__service">
            <a className="nhsuk-header__service-logo" href="https://dobsonrd.github.io/AI-COP-Risk-Log-Builder/#" aria-label="NHS AI Risk Log Builder homepage">
              <NHSLogo />
              <span className="nhsuk-header__service-name">AI Risk Log Builder (draft - in development)</span>
            </a>
          </div>
        </div>
      </header>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="nhsuk-breadcrumb" aria-label="Breadcrumb">
          <div className="nhsuk-width-container">
            <ol className="nhsuk-breadcrumb__list">
              {breadcrumbs.map((c, i) => (
                <li key={i} className="nhsuk-breadcrumb__list-item">
                  {c.onClick ? (
                    <a className="nhsuk-breadcrumb__link" onClick={c.onClick} href="#" role="button">
                      {c.label}
                    </a>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
            {breadcrumbs.length > 1 && (() => {
              const prev = [...breadcrumbs].reverse().find(c => c.onClick);
              return prev ? (
                <a className="nhsuk-back-link" onClick={prev.onClick} href="#" role="button">
                  <span className="nhsuk-u-visually-hidden">Back to </span>{prev.label}
                </a>
              ) : null;
            })()}
          </div>
        </nav>
      )}

      <div className={containerClass}>
        <main className="nhsuk-main-wrapper" id="maincontent" role="main">
          {children}
        </main>
      </div>

      <footer role="contentinfo">
        <div className="nhsuk-footer app-footer" id="nhsuk-footer">
          <div className="nhsuk-width-container">
            <p className="nhsuk-footer__copyright nhsuk-body-s" style={{ color: '#4c6272' }}>
              NHS AI Quality Community of Practice — Risk Log Builder &nbsp;·&nbsp; Data stored locally in your browser only &nbsp;·&nbsp; v{__APP_VERSION__} built {__BUILD_DATE__}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
