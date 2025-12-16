/**
 * Inventory Manager Standalone App
 *
 * Full inventory management application
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../store';
import InventoryDashboard from '../../components/inventory/InventoryDashboard';

const root = document.getElementById('ict-inventory-manager-app');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <InventoryDashboard />
      </Provider>
    </React.StrictMode>
  );
}
