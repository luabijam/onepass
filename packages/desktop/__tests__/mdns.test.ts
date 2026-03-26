import {MdnsAdvertiser} from '../src/sync/mdns';

const mockPublish = jest.fn().mockReturnValue({
  name: 'onepass-sync',
  type: 'onepass',
  port: 3456,
  txt: {token: 'test-token'},
});
const mockUnpublishAll = jest.fn();
const mockDestroy = jest.fn();

jest.mock('bonjour-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      publish: mockPublish,
      unpublishAll: mockUnpublishAll,
      destroy: mockDestroy,
    })),
    Bonjour: jest.fn().mockImplementation(() => ({
      publish: mockPublish,
      unpublishAll: mockUnpublishAll,
      destroy: mockDestroy,
    })),
  };
});

describe('MdnsAdvertiser', () => {
  const testPort = 3456;
  const testToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('publishes mDNS service with correct parameters', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();

      expect(advertiser.isAdvertising()).toBe(true);
      expect(mockPublish).toHaveBeenCalledWith({
        name: 'onepass-sync',
        type: 'onepass',
        port: testPort,
        protocol: 'tcp',
        txt: {token: testToken},
      });
    });

    it('does not publish if already advertising', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();
      mockPublish.mockClear();
      advertiser.start();

      expect(advertiser.isAdvertising()).toBe(true);
      expect(mockPublish).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('stops advertising and destroys service', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();
      advertiser.stop();

      expect(advertiser.isAdvertising()).toBe(false);
      expect(mockUnpublishAll).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('handles stop when not advertising', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.stop();

      expect(advertiser.isAdvertising()).toBe(false);
      expect(mockUnpublishAll).not.toHaveBeenCalled();
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe('getServiceInfo', () => {
    it('returns service info when advertising', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();

      const info = advertiser.getServiceInfo();

      expect(info).toEqual({
        name: 'onepass-sync',
        type: 'onepass',
        port: testPort,
      });
    });

    it('returns null when not advertising', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      const info = advertiser.getServiceInfo();

      expect(info).toBeNull();
    });
  });

  describe('isAdvertising', () => {
    it('returns false initially', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      expect(advertiser.isAdvertising()).toBe(false);
    });

    it('returns true after start', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();
      expect(advertiser.isAdvertising()).toBe(true);
    });

    it('returns false after stop', () => {
      const advertiser = new MdnsAdvertiser(testPort, testToken);
      advertiser.start();
      advertiser.stop();
      expect(advertiser.isAdvertising()).toBe(false);
    });
  });
});
