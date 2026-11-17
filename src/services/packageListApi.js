const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const getPackages = async () => {
    const response = await fetch(`${API_BASE_URL}/packages`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch packages');
    }

    return result.data;
};