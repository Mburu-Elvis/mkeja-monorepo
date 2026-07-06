type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const memoryStore = new Map<string, string>();

function createMemoryStorage(): StorageLike {
  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => {
      memoryStore.set(key, value);
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    }
  };
}

let storage: StorageLike | null = null;

function resolveStorage(): StorageLike {
  if (storage) {
    return storage;
  }

  try {
    const probeKey = '__mkeja_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    storage = window.localStorage;
  } catch {
    storage = createMemoryStorage();
  }

  return storage;
}

export function getStorageItem(key: string): string | null {
  try {
    return resolveStorage().getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  try {
    resolveStorage().setItem(key, value);
  } catch {
    // Ignore blocked storage (Firefox strict privacy, private mode, etc.)
  }
}

export function removeStorageItem(key: string): void {
  try {
    resolveStorage().removeItem(key);
  } catch {
    // Ignore blocked storage
  }
}
