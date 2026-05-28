// @ts-expect-error - vitest is not installed/declared in package.json; types resolve at test runtime
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOtp, verifyOtp } from '../lib/customer-api';
import { axiosInstance } from '../lib/axios';

// Mock axiosInstance
vi.mock('../lib/axios', () => {
  return {
    axiosInstance: {
      post: vi.fn(),
    },
  };
});

describe('OTP Verification API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should call POST /auth/otp/send successfully', async () => {
      const mockEmail = 'test@example.com';
      const mockResponse = {
        data: {
          message: 'OTP sent successfully',
          token: 'otp-session-token',
        },
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

      const result = await sendOtp({ email: mockEmail });

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/otp/send', { email: mockEmail });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyOtp', () => {
    it('should call POST /auth/otp/verify successfully', async () => {
      const mockPayload = { email: 'test@example.com', code: '123456' };
      const mockResponse = {
        data: {
          token: 'verified-email-jwt-token',
        },
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

      const result = await verifyOtp(mockPayload);

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/otp/verify', mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });
});
