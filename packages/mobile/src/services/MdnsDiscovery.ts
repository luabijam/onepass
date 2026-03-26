import Bonjour from 'bonjour-service';
import type { Service } from 'bonjour-service';

export interface DiscoveredService {
  name: string;
  type: string;
  port: number;
  addresses: string[];
  txt: Record<string, string>;
}

export class MdnsDiscovery {
  private bonjour: Bonjour | null = null;
  private browser: {
    on: (event: string, callback: (service: Service) => void) => void;
    stop: () => void;
  } | null = null;
  private discovering = false;

  discoverOne(type: string, timeout: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      this.bonjour = new Bonjour();
      this.discovering = true;

      const timer = setTimeout(() => {
        this.stop();
        resolve(null);
      }, timeout);

      this.bonjour.findOne({ type, protocol: 'tcp' }, timeout, (service: Service) => {
        clearTimeout(timer);
        this.stop();
        resolve(this.serviceToDiscovered(service));
      });
    });
  }

  discover(type: string, onService: (service: DiscoveredService) => void): void {
    if (this.discovering) {
      return;
    }

    this.bonjour = new Bonjour();
    this.browser = this.bonjour.find({ type, protocol: 'tcp' }) as unknown as {
      on: (event: string, callback: (service: Service) => void) => void;
      stop: () => void;
    };
    this.discovering = true;

    this.browser.on('up', (service: Service) => {
      onService(this.serviceToDiscovered(service));
    });
  }

  stop(): void {
    if (!this.discovering || !this.bonjour) {
      return;
    }

    this.bonjour.destroy();
    this.bonjour = null;
    this.browser = null;
    this.discovering = false;
  }

  isDiscovering(): boolean {
    return this.discovering;
  }

  private serviceToDiscovered(service: Service): DiscoveredService {
    return {
      name: service.name,
      type: service.type,
      port: service.port,
      addresses: service.addresses || [],
      txt: (service.txt as Record<string, string>) || {},
    };
  }
}
