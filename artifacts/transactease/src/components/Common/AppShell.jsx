import React from 'react';
import TopNavbar from './TopNavbar';

const AppShell = ({ eyebrow, title, subtitle, children, actions }) => {
  return (
    <div className="app-shell-new">
      <TopNavbar />
      <main className="app-main-new">
        <div className="app-content-new">
          {(eyebrow || title || subtitle || actions) && (
            <header className="app-page-header-new">
              <div>
                {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
                {title && <h1 className="app-page-title">{title}</h1>}
                {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
              </div>
              {actions && <div className="app-page-actions">{actions}</div>}
            </header>
          )}
          <div className="app-page-body">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
