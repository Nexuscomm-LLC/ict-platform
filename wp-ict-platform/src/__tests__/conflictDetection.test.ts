/**
 * Conflict Detection Tests
 *
 * @package ICT_Platform
 * @since   1.0.0
 */

import { doDateRangesOverlap, calculateOverlapHours } from '../utils/conflictDetection';

describe('doDateRangesOverlap', () => {
  it('should return true when ranges overlap partially', () => {
    const result = doDateRangesOverlap(
      '2024-01-01T09:00:00',
      '2024-01-01T12:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T14:00:00'
    );
    expect(result).toBe(true);
  });

  it('should return true when one range contains another', () => {
    const result = doDateRangesOverlap(
      '2024-01-01T08:00:00',
      '2024-01-01T18:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T14:00:00'
    );
    expect(result).toBe(true);
  });

  it('should return false when ranges do not overlap', () => {
    const result = doDateRangesOverlap(
      '2024-01-01T09:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
      '2024-01-01T12:00:00'
    );
    expect(result).toBe(false);
  });

  it('should return false when ranges are adjacent (end equals start)', () => {
    const result = doDateRangesOverlap(
      '2024-01-01T09:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00'
    );
    expect(result).toBe(false);
  });

  it('should work with Date objects', () => {
    const result = doDateRangesOverlap(
      new Date('2024-01-01T09:00:00'),
      new Date('2024-01-01T12:00:00'),
      new Date('2024-01-01T10:00:00'),
      new Date('2024-01-01T14:00:00')
    );
    expect(result).toBe(true);
  });
});

describe('calculateOverlapHours', () => {
  it('should calculate correct overlap hours for partial overlap', () => {
    const result = calculateOverlapHours(
      '2024-01-01T09:00:00',
      '2024-01-01T12:00:00', // 3 hours
      '2024-01-01T10:00:00',
      '2024-01-01T14:00:00' // 4 hours, overlaps 10-12 = 2 hours
    );
    expect(result).toBe(2);
  });

  it('should return 0 when there is no overlap', () => {
    const result = calculateOverlapHours(
      '2024-01-01T09:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
      '2024-01-01T12:00:00'
    );
    expect(result).toBe(0);
  });

  it('should calculate full overlap when one range contains another', () => {
    const result = calculateOverlapHours(
      '2024-01-01T08:00:00',
      '2024-01-01T18:00:00',
      '2024-01-01T10:00:00',
      '2024-01-01T14:00:00' // 4 hours fully contained
    );
    expect(result).toBe(4);
  });

  it('should handle multi-day ranges', () => {
    const result = calculateOverlapHours(
      '2024-01-01T00:00:00',
      '2024-01-03T00:00:00', // 48 hours
      '2024-01-02T00:00:00',
      '2024-01-04T00:00:00' // overlaps 24 hours
    );
    expect(result).toBe(24);
  });

  it('should handle fractional hours', () => {
    const result = calculateOverlapHours(
      '2024-01-01T09:00:00',
      '2024-01-01T10:30:00', // 1.5 hours
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00' // overlaps 0.5 hours
    );
    expect(result).toBe(0.5);
  });
});
