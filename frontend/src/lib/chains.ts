import { Chain } from 'wagmi';

export const etherlinkTestnet = {
  id: 128123,
  name: 'Etherlink Testnet',
  network: 'etherlink-testnet',
  nativeCurrency: {
    name: 'Tez',
    symbol: 'XTZ',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://node.ghostnet.etherlink.com'] },
    public: { http: ['https://node.ghostnet.etherlink.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherlink Explorer', url: 'https://testnet-explorer.etherlink.com' },
  },
  testnet: true,
} as const satisfies Chain; 