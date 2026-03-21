'use client';

import { useState, useEffect, useTransition } from 'react';
import { Star, Trash2, XCircle, Loader2, CheckCircle, MessageSquare } from 'lucide-react';

import {
  deleteReviewAction,
  getBusinessReviewsAction,
  toggleReviewApprovalAction,
} from '@/modules/reviews/server/actions/review-actions';

interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
}

export function ReviewsDashboard({ businessId }: { businessId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [isPending, startTransition] = useTransition();

  const fetchReviews = async () => {
    setLoading(true);
    const result = await getBusinessReviewsAction(businessId);
    if (result.data) {
      setReviews(result.data as Review[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleToggleApproval = (reviewId: string, approved: boolean) => {
    startTransition(async () => {
      const result = await toggleReviewApprovalAction(reviewId, approved);
      if (!result.error) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, isApproved: approved } : r)));
      }
    });
  };

  const handleDelete = (reviewId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;
    startTransition(async () => {
      const result = await deleteReviewAction(reviewId);
      if (!result.error) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    });
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16'>
        <MessageSquare className='text-muted-foreground mb-3 size-10 opacity-30' />
        <p className='font-medium'>No hay reseñas aún</p>
        <p className='text-muted-foreground mt-1 text-sm'>Las reseñas de tus clientes aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filter tabs */}
      <div className='flex items-center gap-2'>
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground border-transparent' : 'hover:bg-muted'}`}
        >
          Todas ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'pending' ? 'border-transparent bg-amber-500 text-white' : 'hover:bg-muted'}`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'approved' ? 'border-transparent bg-green-600 text-white' : 'hover:bg-muted'}`}
        >
          Aprobadas ({approvedCount})
        </button>
      </div>

      {/* Reviews list */}
      <div className='space-y-3'>
        {filtered.map((review) => (
          <div key={review.id} className='rounded-lg border p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-semibold'>{review.customerName}</span>
                  {review.customerEmail && (
                    <span className='text-muted-foreground text-xs'>{review.customerEmail}</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {review.isApproved ? 'Aprobada' : 'Pendiente'}
                  </span>
                </div>
                <div className='mt-1 flex items-center gap-2'>
                  <div className='flex items-center gap-0.5'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className='text-muted-foreground text-xs'>
                    {new Date(review.createdAt).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {review.title && <h4 className='mt-2 text-sm font-semibold'>{review.title}</h4>}
                {review.comment && (
                  <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>{review.comment}</p>
                )}
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                {review.isApproved ? (
                  <button
                    onClick={() => handleToggleApproval(review.id, false)}
                    disabled={isPending}
                    className='hover:bg-muted rounded-md p-2 text-amber-600 transition-colors'
                    title='Revocar aprobación'
                  >
                    <XCircle className='size-4' />
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleApproval(review.id, true)}
                    disabled={isPending}
                    className='hover:bg-muted rounded-md p-2 text-green-600 transition-colors'
                    title='Aprobar'
                  >
                    <CheckCircle className='size-4' />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={isPending}
                  className='hover:bg-muted rounded-md p-2 text-red-500 transition-colors'
                  title='Eliminar'
                >
                  <Trash2 className='size-4' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
