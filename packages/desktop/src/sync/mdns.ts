import Bonjour from 'bonjour-service';
import type {Service} from 'bonjour-service';

export interface ServiceInfo {
  name: string;
  type: string;
  port: number;
}

export class MdnsAdvertiser {
  private bonjour: Bonjour | null = null;
  private service: Service | null = null;
  private readonly port: number;
  private readonly token: string;
  private advertising = false;

  constructor(port: number, token: string) {
    this.port = port;
    this.token = token;
  }

  start(): void {
    if (this.advertising) {
      return;
    }

    this.bonjour = new Bonjour();
    this.service = this.bonjour.publish({
      name: 'onepass-sync',
      type: 'onepass',
      port: this.port,
      protocol: 'tcp',
      txt: {token: this.token},
    });

    this.advertising = true;
  }

  stop(): void {
    if (!this.advertising || !this.bonjour) {
      return;
    }

    this.bonjour.unpublishAll();
    this.bonjour.destroy();
    this.bonjour = null;
    this.service = null;
    this.advertising = false;
  }

  isAdvertising(): boolean {
    return this.advertising;
  }

  getServiceInfo(): ServiceInfo | null {
    if (!this.service) {
      return null;
    }

    return {
      name: this.service.name,
      type: this.service.type,
      port: this.service.port,
    };
  }
}
