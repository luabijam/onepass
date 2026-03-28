export interface DiscoveredService {
  name: string;
  type: string;
  port: number;
  addresses: string[];
  txt: Record<string, string>;
}

export class MdnsDiscovery {
  private discovering = false;

  async discoverOne(_type: string, _timeout: number): Promise<DiscoveredService | null> {
    console.warn('MdnsDiscovery is not supported on React Native');
    return null;
  }

  discover(_type: string, _onService: (service: DiscoveredService) => void): void {
    console.warn('MdnsDiscovery is not supported on React Native');
  }

  stop(): void {
    this.discovering = false;
  }

  isDiscovering(): boolean {
    return this.discovering;
  }
}
