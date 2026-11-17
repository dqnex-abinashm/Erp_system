const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const getShipmentDetails = async (shipmentId) => {
    const response = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch shipment');
    }

    return result.data;
};