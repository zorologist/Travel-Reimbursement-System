import React from 'react';
import { useApprovalQueue } from '../hooks/useApprovalQueue';
import { ApprovalQueue } from '../components/workflow/ApprovalQueue';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import '../styles/approvals.css';
import { useLanguage } from '../hooks/useLanguage';

export const ApprovalsPage: React.FC = () => {
  const { tr } = useLanguage();
  const { queue, loading, error, handleAction, fetchQueue } = useApprovalQueue();

  if (loading) return <LoadingState message={tr("Loading department queue...", "جارٍ تحميل قائمة القسم...")} />;
  if (error) return <ErrorState message={error} onRetry={fetchQueue} />;

  return (
    <main className="content-page approvals-page">
      <header className="page-heading">
        <div>
        <h1>{tr("Department Approvals", "اعتمادات الأقسام")}</h1>
        <p>{tr("Review and process pending travel requests.", "راجع طلبات السفر المعلقة وقم بمعالجتها.")}</p>
        </div>
      </header>
      <section>
        <ApprovalQueue queue={queue} onAction={handleAction} />
      </section>
    </main>
  );
};
