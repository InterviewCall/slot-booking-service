import { AsyncLocalStorage } from 'async_hooks';

import { AsyncLocalStorageType } from '../../types/Request.type';

export const asyncLocalStorage = new AsyncLocalStorage<AsyncLocalStorageType>();

export const getCorrelationId = () => {
    const asyncStore = asyncLocalStorage.getStore();
    return asyncStore?.correlationId || 'unknown-error-while-creating-correlation-id';
};