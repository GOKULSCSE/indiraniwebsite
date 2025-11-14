// src/hooks/useShiprocket.ts
import { useState } from 'react';
import type { Shiprocket as SR } from '@/types/shiprocket';

export function useShiprocket() {
  const [state, setState] = useState<{
    loading: boolean;
    error: SR.ApiError | null;
    data: any;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const createOrder = async (orderData: SR.CreateOrderPayload) => {
    setState({ loading: true, error: null, data: null });
    try {
      const response = await fetch('/api/shiprocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.error || 'Failed to create order',
          status: response.status,
          data: errorData.details,
        };
      }

      const data = await response.json();
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      const err = error as SR.ApiError;
      setState({ loading: false, error: err, data: null });
      throw err;
    }
  };

  return {
    ...state,
    createOrder,
    reset: () => setState({ loading: false, error: null, data: null }),
  };
}