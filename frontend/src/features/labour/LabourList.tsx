import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabour } from '../../hooks/useLabour';
import { TopAppBar, FAB } from '../../components/shared/FAB';
import { SkeletonRow } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { Users, ChevronRight } from 'lucide-react';

export const LabourList: React.FC = () => {
  const navigate = useNavigate();
  const { labourers, isLoading } = useLabour();

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Labour Management" subtitle="Worker salaries, advances & dues" />

      <div className="p-4">
        <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : labourers.length === 0 ? (
            <EmptyState
              icon={Users}
              heading="No Labourers Added"
              subText="Add farm workers to track monthly salaries and cash advances."
              ctaLabel="Add Labourer"
              onCta={() => navigate('/labour/new')}
            />
          ) : (
            labourers.map((worker) => {
              const outstandingNum = parseFloat(worker.outstanding) || 0;
              const advanceNum = parseFloat(worker.advanceBalance) || 0;

              return (
                <div
                  key={worker.id}
                  onClick={() => navigate(`/labour/${worker.id}`)}
                  className="p-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h3 className="text-body font-bold text-neutral-900">{worker.name}</h3>
                    <p className="text-caption text-neutral-500">
                      {worker.role || 'Worker'} · {formatCurrency(worker.salaryAmount)}/
                      {worker.salaryType.toLowerCase().replace('_', ' ')}
                    </p>
                    {advanceNum > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-info-100 text-info-500 rounded">
                        Advance: {formatCurrency(worker.advanceBalance)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-body font-bold block ${
                          outstandingNum > 0 ? 'text-danger-500' : 'text-neutral-700'
                        }`}
                      >
                        {formatCurrency(worker.outstanding)}
                      </span>
                      <span className="text-caption text-neutral-400 block">
                        {outstandingNum > 0 ? 'Salary Due' : 'Paid Up'}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FAB onClick={() => navigate('/labour/new')} label="Add Labourer" />
    </div>
  );
};
