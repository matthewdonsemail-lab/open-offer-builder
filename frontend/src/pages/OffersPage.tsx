import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffers, useDeleteOffer, api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spokes } from '@/components/ui/Spinner';
import { StatusSelect, type StatusOption } from '@/components/common/StatusSelect';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
} from '@floating-ui/react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', dotColor: 'bg-gray-500', bgTint: 'bg-gray-500/10', textColor: 'text-gray-700' },
  { value: 'active', label: 'Active', dotColor: 'bg-green-500', bgTint: 'bg-green-500/10', textColor: 'text-green-700' },
  { value: 'paused', label: 'Paused', dotColor: 'bg-yellow-500', bgTint: 'bg-yellow-500/10', textColor: 'text-yellow-700' },
];

const INDUSTRY_PALETTE = [
  { dotColor: 'bg-blue-500', bgTint: 'bg-blue-500/10', textColor: 'text-blue-700' },
  { dotColor: 'bg-purple-500', bgTint: 'bg-purple-500/10', textColor: 'text-purple-700' },
  { dotColor: 'bg-teal-500', bgTint: 'bg-teal-500/10', textColor: 'text-teal-700' },
  { dotColor: 'bg-orange-500', bgTint: 'bg-orange-500/10', textColor: 'text-orange-700' },
];

function formatDateTime(isoString?: string) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ActionsMenu({
  offer,
  onDelete,
  onEdit,
  onView,
}: {
  offer: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="p-1 rounded-[4px] hover:bg-[var(--ods-bg-secondary,#f0f0f3)] text-[var(--ods-text-tertiary,#8a8a93)] hover:text-[var(--ods-text-primary,#18181b)] transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="w-40 bg-[var(--ods-bg-primary,#ffffff)] border border-[var(--ods-border,#e5e5ea)] rounded-[6px] shadow-sm z-[60] py-1"
          >
            <button
              className="w-full flex items-center gap-2 px-3 h-7 text-[13px] text-[var(--ods-text-secondary,#575757)] hover:bg-[var(--ods-bg-secondary,#f0f0f3)] hover:text-[var(--ods-text-primary,#18181b)] transition-colors"
              onClick={() => { onView(offer.id); setIsOpen(false); }}
              role="menuitem"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 h-7 text-[13px] text-[var(--ods-text-secondary,#575757)] hover:bg-[var(--ods-bg-secondary,#f0f0f3)] hover:text-[var(--ods-text-primary,#18181b)] transition-colors"
              onClick={() => { onEdit(offer.id); setIsOpen(false); }}
              role="menuitem"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <div className="border-t border-[var(--ods-border,#e5e5ea)] my-1" />
            <button
              className="w-full flex items-center gap-2 px-3 h-7 text-[13px] text-[var(--ods-rose-500,#f43f5e)] hover:bg-[var(--ods-bg-secondary,#f0f0f3)] transition-colors"
              onClick={() => { onDelete(offer.id); setIsOpen(false); }}
              role="menuitem"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export function OffersPage() {
  const navigate = useNavigate();
  const { data: offers, isLoading, error } = useOffers();
  const deleteMutation = useDeleteOffer();
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: api.industries.list });
  const industryOptions = useMemo<StatusOption[]>(() => {
    const list: StatusOption[] = [{ value: '', label: 'None', dotColor: 'bg-gray-400', bgTint: 'bg-gray-500/10', textColor: 'text-gray-600' }];
    industries.forEach((ind, i) => {
      const c = INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length];
      list.push({ value: ind.key, label: ind.label, ...c });
    });
    return list;
  }, [industries]);
  const { success, error: toastError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  React.useEffect(() => {
    console.log('[OffersPage] offers JSON:', JSON.stringify(offers, null, 2));
    console.log('[OffersPage] count:', offers?.length, 'isLoading:', isLoading, 'error:', error);
  }, [offers, isLoading, error]);

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    if (!searchQuery) return offers;
    const q = searchQuery.toLowerCase();
    return offers.filter(
      (o) =>
        o.title?.toLowerCase().includes(q) ||
        o.name?.toLowerCase().includes(q) ||
        o.heroH1?.toLowerCase().includes(q)
    );
  }, [offers, searchQuery]);

  function handleCreate() {
    navigate('/offers/new');
  }

  function handleEdit(id: string) {
    navigate(`/offers/${id}`);
  }

  function handlePreview(id: string) {
    window.open(`/preview/general/${id}`, '_blank');
  }

  function handleDelete(id: string) {
    const offer = offers?.find((o) => o.id === id);
    const name = (offer?.title as string) || (offer?.heroH1 as string) || 'this offer';
    setDeleteConfirm({ id, name });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      success('Offer deleted', `${deleteConfirm.name} has been removed`);
      setDeleteConfirm(null);
    } catch (err: any) {
      toastError('Error', err.message || 'Failed to delete');
    }
  }

  return (
    <div className="flex flex-col h-full w-full select-none bg-[var(--ods-bg-primary)]">
      {/* Action Bar */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[var(--ods-border)] shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--ods-text-tertiary,#8a8a93)]" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-[13px] bg-transparent border-none focus:outline-none text-[var(--ods-text-primary,#18181b)] placeholder-[var(--ods-text-tertiary,#8a8a93)] w-full"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-7 px-3 text-[13px] font-medium bg-[var(--ods-brand-600,#2563eb)] text-white rounded-[4px] hover:bg-[var(--ods-brand-600,#1d4ed8)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Offer
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 w-full overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-[var(--ods-bg-secondary,#f0f0f3)] z-10">
            <tr className="h-8 border-b border-[var(--ods-border)]">
              <th className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] font-normal">
                Title
              </th>
              <th className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] font-normal">
                Status
              </th>
<th className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] font-normal">
                 Industry
               </th>
              <th className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] font-normal">
                Created
              </th>
              <th className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] font-normal">
                Updated
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ods-border,#e5e5ea)]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Spokes className="h-8 w-8 text-[var(--ods-brand-600)] mx-auto" />
                </td>
              </tr>
            ) : filteredOffers.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-12 text-center text-[13px] text-[var(--ods-text-tertiary,#8a8a93)]">
                  No offers found
                </td>
              </tr>
            ) : (
              filteredOffers.map((offer) => (
                <tr
                  key={offer.id}
                  className="h-8 hover:bg-[var(--ods-bg-secondary,#f0f0f3)] transition-colors cursor-pointer"
                  onClick={() => handleEdit(offer.id)}
                >
                  <td className="px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {offer.title && (
                        <span className="text-[13px] font-medium text-[var(--ods-text-primary,#18181b)] truncate">
                          {offer.title}
                        </span>
                      )}
                      {!offer.title && offer.heroH1 && (
                        <span className="text-[13px] text-[var(--ods-text-secondary,#575757)] truncate">
                          {offer.heroH1}
                        </span>
                      )}
                      {!offer.title && !offer.heroH1 && (
                        <Badge variant="gray">Untitled</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect
                      value={(offer.status as string)?.toLowerCase() || 'draft'}
                      onChange={(v) => {
                        // inline update via API - optimistic
                        fetch(`/api/offers/${offer.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('offer-builder-token')}` },
                          body: JSON.stringify({ status: v.toUpperCase() }),
                        }).then(() => window.location.reload());
                      }}
                      options={STATUS_OPTIONS}
                    />
                  </td>
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect
                      value={(offer.industryId as string) || ''}
                      onChange={(v) => {
                        // inline update via API - optimistic
                        fetch(`/api/offers/${offer.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('offer-builder-token')}` },
                          body: JSON.stringify({ industryId: v || null }),
                        }).then(() => window.location.reload());
                      }}
                      options={industryOptions}
                    />
                  </td>
                  <td className="px-3 text-[12px] text-[var(--ods-text-secondary,#575757)]">
                    {formatDateTime(offer.createdAt)}
                  </td>
                  <td className="px-3 text-[12px] text-[var(--ods-text-secondary,#575757)]">
                    {formatDateTime(offer.updatedAt)}
                  </td>
                  <td className="px-1" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu
                      offer={offer}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onView={handlePreview}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Offer"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
