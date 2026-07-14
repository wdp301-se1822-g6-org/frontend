// @ts-expect-error - vitest is runtime test framework
import { describe, it, expect } from 'vitest';
import { formatShiftDetails, formatBookingTime } from '../app/cashier/orders/page';

describe('Cashier Orders Helpers', () => {
  describe('formatShiftDetails', () => {
    it('should infer morning shift when shiftId is missing and booking is at 08:00', () => {
      const dateStr = '2026-07-15T08:00:00.000Z';
      const result = formatShiftDetails(undefined, dateStr);
      expect(result.name).toContain('sáng');
    });

    it('should infer afternoon shift when booking is at 14:00', () => {
      const dateStr = '2026-07-15T14:00:00.000Z';
      const result = formatShiftDetails(undefined, dateStr);
      expect(result.name).toContain('chiều');
    });

    it('should parse string shift correctly', () => {
      const result = formatShiftDetails('Ca Sáng');
      expect(result).toEqual({ name: 'Ca Sáng', time: null });
    });

    it('should format object shift with start and end time', () => {
      const result = formatShiftDetails({
        name: 'Ca Chiều',
        startTime: '13:00',
        endTime: '17:00',
      });
      expect(result).toEqual({ name: 'Ca Chiều', time: '13:00 - 17:00' });
    });
    it('should fallback to timeSlot if startTime and endTime are missing', () => {
      const result = formatShiftDetails({
        name: 'Ca Tối',
        timeSlot: '18:00 - 21:00',
      });
      expect(result).toEqual({ name: 'Ca Tối', time: '18:00 - 21:00' });
    });
  });

  describe('formatBookingTime', () => {
    it('should return placeholders when date string is missing or invalid', () => {
      expect(formatBookingTime(undefined)).toEqual({
        dateText: '-',
        timeText: null,
        isToday: false,
        isTomorrow: false,
      });

      expect(formatBookingTime('invalid-date')).toEqual({
        dateText: 'invalid-date',
        timeText: null,
        isToday: false,
        isTomorrow: false,
      });
    });

    it('should correctly mark today appointment', () => {
      const today = new Date().toISOString();
      const result = formatBookingTime(today);
      expect(result.isToday).toBe(true);
    });
  });
});
