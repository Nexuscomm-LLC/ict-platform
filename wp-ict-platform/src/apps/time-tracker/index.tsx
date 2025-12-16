/**
 * Time Tracker Standalone App
 *
 * Mobile-friendly time tracking application
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { TimeTracker } from '../../components/time/TimeTracker';
import { TimeClock } from '../../components/time/TimeClock';

const root = document.getElementById('ict-time-tracker-app');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <div className="ict-time-tracker-app">
          <TimeTracker />
          <TimeClock />
        </div>
      </Provider>
    </React.StrictMode>
  );
}
