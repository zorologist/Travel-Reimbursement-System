import React from 'react';
import { useApprovalQueue } from '../hooks/useApprovalQueue';
import { ApprovalQueue } from '../components/workflow/ApprovalQueue';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

export const ApprovalsPage: React.FC = () => {
  const { queue, loading, error, handleAction, fetchQueue } = useApprovalQueue();

  if (loading) return <LoadingState message="Loading department queue..." />;
  if (error) return <ErrorState message={error} onRetry={fetchQueue} />;

  return (
    <div className="approvals-page">
      <header>
        <h1>Department Approvals</h1>
        <p>Review and process pending travel requests.</p>
      </header>
      <main>
        <ApprovalQueue queue={queue} onAction={handleAction} />
      </main>
    </div>
  );
};
