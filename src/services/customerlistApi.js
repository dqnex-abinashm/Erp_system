const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api/v1';

export const getCustomers = async ({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    paymentFilter = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
} = {}) => {

    const params = new URLSearchParams();

    params.append('page', String(page));
    params.append('limit', String(limit));

    if (search.trim()) {
        params.append('search', search.trim());
    }

    if (status) {
        params.append('status', status);
    }

    // OVERDUE or UNPAID
    if (paymentFilter) {
        params.append('paymentFilter', paymentFilter);
    }

    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    const response = await fetch(
        `${API_BASE_URL}/customers?${params.toString()}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to fetch customers'
        );
    }

    return result;
};