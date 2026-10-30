// // const API_BASE_URL =
// //   import.meta.env.VITE_API_BASE_URL ||
// //   "http://localhost:3000/api/v1";

// // const BASE_URL = `${API_BASE_URL}/manufacturing-orders`;

// // const request = async (url) => {
// //   const response = await fetch(url, {
// //     headers: {
// //       "Content-Type": "application/json",
// //     },
// //   });

// //   const result = await response.json().catch(() => ({}));

// //   if (!response.ok || result.success === false) {
// //     throw new Error(
// //       result.message ||
// //       `Failed to fetch manufacturing orders (${response.status})`
// //     );
// //   }

// //   return result;
// // };

// // // Fetch manufacturing orders for the Production page table.
// // export const getManufacturingOrderList = async ({
// //   search = "",
// //   status = "",
// //   limit = 100,
// //   offset = 0,
// // } = {}) => {
// //   const params = new URLSearchParams();

// //   if (search) params.set("search", search);
// //   if (status) params.set("status", status);

// //   params.set("limit", String(limit));
// //   params.set("offset", String(offset));

// //   const result = await request(
// //     `${BASE_URL}?${params.toString()}`
// //   );

// //   // Supports the response structure from your backend.
// //   if (Array.isArray(result.data)) {
// //     return result.data;
// //   }

// //   if (Array.isArray(result.orders)) {
// //     return result.orders;
// //   }

// //   return [];
// // };

// // export default {
// //   getManufacturingOrderList,
// // };


// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   "http://localhost:3000/api/v1";

// const BASE_URL = `${API_BASE_URL}/manufacturing-orders`;

// const request = async (url) => {
//   const response = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   const result = await response.json().catch(() => ({}));

//   if (!response.ok || result.success === false) {
//     throw new Error(
//       result.message ||
//       `Failed to fetch manufacturing orders (${response.status})`
//     );
//   }

//   return result;
// };

// export const getManufacturingOrderList = async ({
//   search = "",
//   status = "",
//   limit = 10,
//   offset = 0,
// } = {}) => {
//   const params = new URLSearchParams();

//   if (search) params.set("search", search);
//   if (status) params.set("status", status);

//   params.set("limit", String(limit));
//   params.set("offset", String(offset));

//   const result = await request(`${BASE_URL}?${params.toString()}`);

//   const orders = Array.isArray(result.data)
//     ? result.data
//     : Array.isArray(result.orders)
//       ? result.orders
//       : [];

//   // Adjust these fallbacks to match the backend response.
//   const pagination = result.pagination || {};

//   const total = Number(
//     pagination.total ??
//     pagination.totalRecords ??
//     result.total ??
//     result.totalCount ??
//     orders.length
//   );

//   return {
//     data: orders,
//     total,
//     limit,
//     offset,
//   };
// };

// export default {
//   getManufacturingOrderList,
// };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api/v1";

const BASE_URL = `${API_BASE_URL}/manufacturing-orders`;

const request = async (url, signal) => {
  const response = await fetch(url, {
    signal,
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
      `Failed to fetch manufacturing orders (${response.status})`
    );
  }

  return result;
};

export const getManufacturingOrderList = async ({
  search = "",
  status = "",
  limit = 10,
  offset = 0,
  signal,
} = {}) => {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (status) params.set("status", status);

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const result = await request(`${BASE_URL}?${params.toString()}`, signal);

  const orders = Array.isArray(result.data) ? result.data : [];

  return {
    data: orders,
    total: Number(result.total ?? orders.length),
    limit,
    offset,
  };
};

export default { getManufacturingOrderList };