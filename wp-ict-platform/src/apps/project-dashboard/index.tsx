/**
 * Project Dashboard Standalone App
 *
 * Full-featured project management dashboard
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { ProjectDashboard } from '../../components/projects/ProjectDashboard';

const root = document.getElementById('ict-project-dashboard-app');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <ProjectDashboard />
      </Provider>
    </React.StrictMode>
  );
}
