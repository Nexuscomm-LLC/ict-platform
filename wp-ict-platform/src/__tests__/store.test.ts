/**
 * Store Tests
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import { store } from '../store';

describe('Redux Store', () => {
  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  it('should have the expected reducers', () => {
    const state = store.getState();

    expect(state).toHaveProperty('projects');
    expect(state).toHaveProperty('timeEntries');
    expect(state).toHaveProperty('resources');
    expect(state).toHaveProperty('inventory');
    expect(state).toHaveProperty('purchaseOrders');
    expect(state).toHaveProperty('reports');
    expect(state).toHaveProperty('sync');
    expect(state).toHaveProperty('ui');
  });

  it('should have initial state for projects', () => {
    const state = store.getState();

    expect(state.projects.items).toEqual([]);
    expect(state.projects.loading).toBe(false);
    expect(state.projects.error).toBeUndefined();
  });

  it('should have initial state for time entries', () => {
    const state = store.getState();

    expect(state.timeEntries.items).toEqual([]);
    expect(state.timeEntries.activeEntry).toBeUndefined();
    expect(state.timeEntries.loading).toBe(false);
  });

  it('should have initial state for inventory', () => {
    const state = store.getState();

    expect(state.inventory.items).toEqual([]);
    expect(state.inventory.lowStockItems).toEqual([]);
    expect(state.inventory.loading).toBe(false);
  });
});
