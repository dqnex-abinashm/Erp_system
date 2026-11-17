const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// The form keeps dates as DD/MM/YYYY, the API needs YYYY-MM-DD
export const toISODate = (value) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
    return m ? `${m[3]}-${m[2]}-${m[1]}` : value || null;
};

// packageData.status: 'DRAFT' (Save Draft) or 'PACKED' (Save)
export const createPackage = async (packageData) => {
    const response = await fetch(
        `${API_BASE_URL}/packages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(packageData)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        if (result.errors && Array.isArray(result.errors)) {
            const errorMessages = result.errors.map(err => err.msg).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(
            result.message || 'Failed to create package'
        );
    }

    return result;
};