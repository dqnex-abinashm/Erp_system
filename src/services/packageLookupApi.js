const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const request = async (path, fallbackMessage) => {
    const response = await fetch(`${API_BASE_URL}${path}`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || fallbackMessage);
    }

    return result.data;
};

export const getCustomerLookup = () =>
    request('/packages/lookups/customers', 'Failed to load customers');

export const getSalesOrderLookup = (customerId) =>
    request(
        `/packages/lookups/sales-orders?customerId=${customerId}`,
        'Failed to load sales orders'
    );

export const getPackableItems = (customerId, salesOrderIds) =>
    request(
        `/packages/lookups/packable-items?customerId=${customerId}&salesOrderIds=${salesOrderIds.join(',')}`,
        'Failed to load sales order items'
    );