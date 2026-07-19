import api from './api';
import type { TravelRequest, WorkflowStage } from '@travel-reimbursement/shared';

type ReviewStage = Extract<
  WorkflowStage,
  'manager-review' | 'pr-review' | 'transportation-review' | 'timing-review'
>;

export interface ApprovalQueueItem {
  id: string;
  employeeId: string;
  status: string;
  currentStage: ReviewStage;
  initialPrice: number;
  currentPrice: number;
  revisions: PriceRevision[];
  requestDetails: Partial<TravelRequest>;
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
    const response = await api.get<ApprovalQueueItem[]>('/api/requests?scope=queue');
    return response.data;
  },
  
  approve: async (id: string, payload: Record<string, unknown>): Promise<void> => {
    await api.post(`/api/requests/${id}/approve`, payload);
  },

  reject: async (id: string, reason: string): Promise<void> => {
    await api.post(`/api/requests/${id}/reject`, { reason });
  }
};
