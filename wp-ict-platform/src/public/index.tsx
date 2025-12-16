/**
 * Public App Entry Point
 *
 * Frontend-facing components for public pages
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store';
import { TimeClock } from '../components/time/TimeClock';

// Public time clock for employees
const publicTimeClockRoot = document.getElementById('ict-public-time-clock');
if (publicTimeClockRoot) {
  createRoot(publicTimeClockRoot).render(
    <React.StrictMode>
      <Provider store={store}>
        <TimeClock />
      </Provider>
    </React.StrictMode>
  );
}
