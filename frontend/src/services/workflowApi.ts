import api from './api';

export interface ApprovalQueueItem {
  id: string;
  employeeId: string;
  status: string;
  currentStage: 'MANAGER' | 'PR' | 'TRANSPORTATION' | 'TIMING';
  initialPrice: number;
  currentPrice: number;
  revisions: PriceRevision[];
  requestDetails: any; // Using any for brevity; replace with Request type
}

export interface PriceRevision {
  id: string;
  department: string;
  previousPrice: number;
  newPrice: number;
  reason: string;
  updatedAt: string;
}

export const workflowApi = {
  getQueue: async (): Promise<ApprovalQueueItem[]> => {
    const response = await api.get('/api/workflow/queue');
    return response.data;
  },
  
  approve: async (id: string, payload: any) => {
    const response = await api.post(`/api/workflow/${id}/approve`, payload);
    return response.data;
  },

  reject: async (id: string, reason: string) => {
    const response = await api.post(`/api/workflow/${id}/reject`, { reason });
    return response.data;
  }
};
