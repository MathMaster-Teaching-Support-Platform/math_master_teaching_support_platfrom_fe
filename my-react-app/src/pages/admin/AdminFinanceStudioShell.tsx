import React from 'react';

/**
 * Shared layout for admin “Tài chính” routes: parchment canvas + TeacherCourses shell (DESIGN.md).
 */
const AdminFinanceStudioShell: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="module-layout-container admin-mgmt-shell admin-finance-studio">
    <div className="admin-mgmt-shell__bg" aria-hidden="true" />
    <section className="module-page teacher-courses-page admin-mgmt-shell__content admin-finance-studio__inner">
      {children}
    </section>
  </div>
);

export default AdminFinanceStudioShell;
