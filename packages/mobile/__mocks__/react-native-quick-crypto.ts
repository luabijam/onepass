const mockSubtle = {
  digest: jest.fn().mockImplementation(async (algorithm: unknown, data: Uint8Array) => {
    const hash = new Uint8Array(32);
    for (let i = 0; i < Math.min(data.length, 32); i++) {
      hash[i] = data[i] ?? 0;
    }
    return hash.buffer;
  }),
  importKey: jest.fn().mockResolvedValue({}),
  sign: jest.fn().mockImplementation(async () => new Uint8Array(32).buffer),
};

const mockCrypto = {
  subtle: mockSubtle,
  getRandomValues: jest.fn().mockImplementation((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

const randomBytes = jest.fn().mockImplementation((size: number) => {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
});

export default {
  subtle: mockSubtle,
  getRandomValues: mockCrypto.getRandomValues,
  randomBytes,
};

export { mockCrypto as webcrypto };
