import React from 'react';
import AppShell from './AppShell';

const Layout = ({ title, subtitle, children, actions }) => {
  return (
    <AppShell
      eyebrow="Administration"
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      {children}
    </AppShell>
  );
};

export default Layout;
