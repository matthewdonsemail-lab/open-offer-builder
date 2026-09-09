import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOffers } from '@/lib/api';
import { OffersPage } from '@/pages/OffersPage';
import { Spokes } from '@/components/ui/Spinner';

/**
 * Embeddable dashboard: offers overview + full offers table.
 * `?embed=1` (used by the Twenty dashboard iframe) renders compact —
 * Layout strips the sidebar/topbar in that mode.
 */
export function DashboardPage() {
  const [params] = useSearchParams();
  const isEmbed = params.get('embed') === '1';
  const { data: offers, isLoading } = useOffers();

  const stats = useMemo(() => {
    const list: any[] = Array.isArray(offers) ? offers : [];
    const upper = (o: any) => String(o?.status || '').toUpperCase();
    return {
      total: list.length,
      active: list.filter((o) => upper(o) === 'ACTIVE').length,
      draft: list.filter((o) => upper(o) === 'DRAFT').length,
      paused: list.filter((o) => upper(o) === 'PAUSED').length,
    };
  }, [offers]);

  const cards = [
    { label: 'Total offers', value: stats.total },
    { label: 'Active', value: stats.active },
    { label: 'Draft', value: stats.draft },
    { label: 'Paused', value: stats.paused },
  ];

  return (
    <div className={isEmbed ? 'min-h-screen bg-white p-4' : 'p-6'}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-6">
            <Spokes className="h-6 w-6 text-[var(--ods-brand-600)]" />
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-[var(--ods-border,#e5e7eb)] bg-white px-4 py-3 shadow-sm"
            >
              <div className="text-2xl font-bold text-[#0D2A4C]">{c.value}</div>
              <div className="text-xs font-medium text-neutral-500">{c.label}</div>
            </div>
          ))
        )}
      </div>
      <OffersPage />
    </div>
  );
}
