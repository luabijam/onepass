const credentialsStore = new Map<string, {account: string; password: string}>();

export const setPassword = jest.fn(
  (service: string, account: string, password: string): Promise<void> => {
    credentialsStore.set(`${service}:${account}`, {account, password});
    return Promise.resolve();
  },
);

export const getPassword = jest.fn(
  (service: string, account: string): Promise<string | null> => {
    const credential = credentialsStore.get(`${service}:${account}`);
    return Promise.resolve(credential ? credential.password : null);
  },
);

export const deletePassword = jest.fn(
  (service: string, account: string): Promise<boolean> => {
    const key = `${service}:${account}`;
    const existed = credentialsStore.has(key);
    credentialsStore.delete(key);
    return Promise.resolve(existed);
  },
);

export const findCredentials = jest.fn(
  (service: string): Promise<Array<{account: string; password: string}>> => {
    const credentials: Array<{account: string; password: string}> = [];
    credentialsStore.forEach((value, key) => {
      if (key.startsWith(`${service}:`)) {
        credentials.push(value);
      }
    });
    return Promise.resolve(credentials);
  },
);

export const findPassword = jest.fn(
  (service: string): Promise<string | null> => {
    for (const [key, value] of credentialsStore.entries()) {
      if (key.startsWith(`${service}:`)) {
        return Promise.resolve(value.password);
      }
    }
    return Promise.resolve(null);
  },
);

export const clearStore = (): void => {
  credentialsStore.clear();
};
