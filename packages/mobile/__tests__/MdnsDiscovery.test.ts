import { MdnsDiscovery, DiscoveredService } from '../src/services/MdnsDiscovery';

const mockOnUp = jest.fn();
const mockOnDown = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn().mockReturnValue({
  on: jest.fn((event: string, callback: jest.Mock) => {
    if (event === 'up') {
      mockOnUp.mockImplementation(callback);
    } else if (event === 'down') {
      mockOnDown.mockImplementation(callback);
    }
  }),
  stop: jest.fn(),
});
const mockDestroy = jest.fn();

jest.mock('bonjour-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      find: mockFind,
      findOne: mockFindOne,
      destroy: mockDestroy,
    })),
    Bonjour: jest.fn().mockImplementation(() => ({
      find: mockFind,
      findOne: mockFindOne,
      destroy: mockDestroy,
    })),
  };
});

describe('MdnsDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverOne', () => {
    it('discovers a single service and returns its info', async () => {
      const mockService = {
        name: 'onepass-sync',
        type: 'onepass',
        port: 3456,
        addresses: ['192.168.1.100'],
        txt: { token: 'test-token' },
      };
      mockFindOne.mockImplementation(
        (_options: unknown, _timeout: number, callback: (service: typeof mockService) => void) => {
          setTimeout(() => callback(mockService), 0);
          return { on: jest.fn(), stop: jest.fn() };
        }
      );

      const discovery = new MdnsDiscovery();
      const result = await discovery.discoverOne('onepass', 5000);

      expect(result).toEqual({
        name: 'onepass-sync',
        type: 'onepass',
        port: 3456,
        addresses: ['192.168.1.100'],
        txt: { token: 'test-token' },
      });
      expect(mockFindOne).toHaveBeenCalledWith(
        {
          type: 'onepass',
          protocol: 'tcp',
        },
        5000,
        expect.any(Function)
      );
    });

    it('returns null when no service is found within timeout', async () => {
      mockFindOne.mockImplementation(() => {
        return { on: jest.fn(), stop: jest.fn() };
      });

      const discovery = new MdnsDiscovery();
      const resultPromise = discovery.discoverOne('onepass', 50);

      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      const result = await resultPromise;

      expect(result).toBeNull();
    });

    it('stops discovery after finding a service', async () => {
      const mockService = {
        name: 'onepass-sync',
        type: 'onepass',
        port: 3456,
        addresses: ['192.168.1.100'],
      };
      mockFindOne.mockImplementation(
        (_options: unknown, _timeout: number, callback: (service: typeof mockService) => void) => {
          setTimeout(() => callback(mockService), 0);
          return { on: jest.fn(), stop: jest.fn() };
        }
      );

      const discovery = new MdnsDiscovery();
      await discovery.discoverOne('onepass', 5000);

      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe('discover', () => {
    it('discovers multiple services and emits events', (done) => {
      const mockService1 = {
        name: 'onepass-sync-1',
        type: 'onepass',
        port: 3456,
        addresses: ['192.168.1.100'],
        txt: { token: 'token-1' },
      };
      const mockService2 = {
        name: 'onepass-sync-2',
        type: 'onepass',
        port: 3457,
        addresses: ['192.168.1.101'],
        txt: { token: 'token-2' },
      };

      const discoveredServices: DiscoveredService[] = [];

      const discovery = new MdnsDiscovery();
      discovery.discover('onepass', (service: DiscoveredService) => {
        discoveredServices.push(service);
        if (discoveredServices.length === 2) {
          expect(discoveredServices).toEqual([
            {
              name: 'onepass-sync-1',
              type: 'onepass',
              port: 3456,
              addresses: ['192.168.1.100'],
              txt: { token: 'token-1' },
            },
            {
              name: 'onepass-sync-2',
              type: 'onepass',
              port: 3457,
              addresses: ['192.168.1.101'],
              txt: { token: 'token-2' },
            },
          ]);
          done();
        }
      });

      mockOnUp(mockService1);
      mockOnUp(mockService2);
    });

    it('calls find with correct parameters', () => {
      const discovery = new MdnsDiscovery();
      discovery.discover('onepass', () => {});

      expect(mockFind).toHaveBeenCalledWith({
        type: 'onepass',
        protocol: 'tcp',
      });
    });
  });

  describe('stop', () => {
    it('stops discovery and destroys bonjour instance', () => {
      const discovery = new MdnsDiscovery();
      discovery.discover('onepass', () => {});
      discovery.stop();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('handles stop when not discovering', () => {
      const discovery = new MdnsDiscovery();
      discovery.stop();

      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe('isDiscovering', () => {
    it('returns false initially', () => {
      const discovery = new MdnsDiscovery();
      expect(discovery.isDiscovering()).toBe(false);
    });

    it('returns true after discover is called', () => {
      const discovery = new MdnsDiscovery();
      discovery.discover('onepass', () => {});
      expect(discovery.isDiscovering()).toBe(true);
    });

    it('returns false after stop is called', () => {
      const discovery = new MdnsDiscovery();
      discovery.discover('onepass', () => {});
      discovery.stop();
      expect(discovery.isDiscovering()).toBe(false);
    });
  });
});
