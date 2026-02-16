import React from "react";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  header: React.ReactNode;
  nav: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  header,
  nav,
  children,
  className,
}) => {
  return (
    <div className={cn("settings-wrapper", className)}>
      <header className="settings-header">
        {header}
      </header>
      <div className="settings-body">
        <aside className="settings-nav">
          {nav}
        </aside>
        <section className="settings-content">
          {children}
        </section>
      </div>
    </div>
  );
};
