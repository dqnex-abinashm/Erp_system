const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// packed packages of one customer (not yet in a shipment)
export const getShippablePackages = async (customerId) => {
    const response = await fetch(
        `${API_BASE_URL}/shipments/lookups/packages?customerId=${customerId}`
    );
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Failed to load packages');
    }

    return result.data;
};