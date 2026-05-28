// @ts-expect-error - vitest is not installed/declared in package.json; types resolve at test runtime
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMyLoyalty, getTierConfigs, getTierConfig } from '../lib/customer-api';
import { axiosInstance } from '../lib/axios';

// Mock axiosInstance
vi.mock('../lib/axios', () => {
  return {
    axiosInstance: {
      get: vi.fn(),
    },
  };
});

describe('Loyalty & Tiers API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyLoyalty', () => {
    it('should call GET /me/loyalty successfully', async () => {
      const mockLoyaltyResponse = {
        data: {
          id: 'loyalty-123',
          customerId: 'customer-123',
          tierName: 'Gold',
          pointsBalance: 5000,
          visitsThisMonth: 3,
          visitsLastMonth: 2,
        },
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockLoyaltyResponse);

      const result = await getMyLoyalty();

      expect(axiosInstance.get).toHaveBeenCalledWith('/me/loyalty');
      expect(result).toEqual(mockLoyaltyResponse);
    });

    it('should handle errors on GET /me/loyalty failure', async () => {
      const mockError = new Error('Unauthorized');
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(mockError);

      await expect(getMyLoyalty()).rejects.toThrow('Unauthorized');
      expect(axiosInstance.get).toHaveBeenCalledWith('/me/loyalty');
    });
  });

  describe('getTierConfigs', () => {
    it('should call GET /tier-configs successfully', async () => {
      const mockTiersResponse = {
        data: [
          { id: '1', tierName: 'Member', discountPercent: 0, isActive: true },
          { id: '2', tierName: 'Silver', discountPercent: 5, isActive: true },
        ],
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockTiersResponse);

      const result = await getTierConfigs();

      expect(axiosInstance.get).toHaveBeenCalledWith('/tier-configs');
      expect(result).toEqual(mockTiersResponse);
    });
  });

  describe('getTierConfig', () => {
    it('should call GET /tier-configs/:id successfully', async () => {
      const mockTierId = 'tier-silver-id';
      const mockTierResponse = {
        data: { id: mockTierId, tierName: 'Silver', discountPercent: 5, isActive: true },
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockTierResponse);

      const result = await getTierConfig(mockTierId);

      expect(axiosInstance.get).toHaveBeenCalledWith(`/tier-configs/${mockTierId}`);
      expect(result).toEqual(mockTierResponse);
    });
  });
});
