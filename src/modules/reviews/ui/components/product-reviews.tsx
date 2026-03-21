'use client';

import { useState, useTransition } from 'react';
import { Star, User, Send, Loader2 } from 'lucide-react';

import { submitReviewAction } from '@/modules/reviews/server/actions/review-actions';

/* ─── Types ─── */

interface Review {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
}

interface ReviewStats {
  average: number;
  total: number;
}

interface ProductReviewsProps {
  productId: string;
  businessId: string;
  reviews: Review[];
  stats: ReviewStats;
}

/* ─── Star Rating (interactive) ─── */

function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5';
  const interactive = !!onChange;

  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type='button'
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          >
            <Star className={`${sizeClass} ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          </button>
        );
      })}
    </div>
  );
}

/* ─── Stars Display (read-only, supports half stars) ─── */

export function StarsDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <Star key={star} className={`${sizeClass} ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
        );
      })}
    </div>
  );
}

/* ─── Rating Summary Bar ─── */

function RatingSummary({ reviews, stats }: { reviews: Review[]; stats: ReviewStats }) {
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-start'>
      {/* Big average */}
      <div className='flex flex-col items-center'>
        <span className='text-4xl font-bold'>{stats.average.toFixed(1)}</span>
        <StarsDisplay rating={stats.average} size='md' />
        <span className='mt-1 text-sm opacity-50'>
          {stats.total} reseña{stats.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Distribution bars */}
      <div className='flex flex-1 flex-col gap-1.5'>
        {distribution.map(({ star, count, pct }) => (
          <div key={star} className='flex items-center gap-2 text-sm'>
            <span className='w-3 text-right font-medium opacity-60'>{star}</span>
            <Star className='size-3 fill-amber-400 text-amber-400' />
            <div
              className='h-2 flex-1 overflow-hidden'
              style={{
                borderRadius: 'var(--sf-radius-full, 9999px)',
                backgroundColor: 'var(--sf-surface, #f3f4f6)',
              }}
            >
              <div
                className='h-full bg-amber-400 transition-all'
                style={{
                  width: `${pct}%`,
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                }}
              />
            </div>
            <span className='w-6 text-right text-xs opacity-40'>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Review Form ─── */

function ReviewForm({ productId, businessId }: { productId: string; businessId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('El nombre es requerido');
    if (rating === 0) return setError('Selecciona una calificación');
    setError('');

    startTransition(async () => {
      const result = await submitReviewAction({
        productId,
        businessId,
        customerName: name,
        customerEmail: email || undefined,
        rating,
        title: title || undefined,
        comment: comment || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div
        className='p-6 text-center'
        style={{
          borderRadius: 'var(--sf-radius-lg, 1rem)',
          backgroundColor: 'var(--sf-surface, #f9fafb)',
        }}
      >
        <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100'>
          <Star className='size-6 fill-green-600 text-green-600' />
        </div>
        <h3 className='text-lg font-semibold'>¡Gracias por tu reseña!</h3>
        <p className='mt-1 text-sm opacity-60'>Tu reseña será visible después de ser aprobada.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <h3 className='text-lg font-semibold'>Escribe una reseña</h3>

      {/* Rating */}
      <div>
        <label className='mb-1.5 block text-sm font-medium opacity-70'>Calificación *</label>
        <StarRating value={rating} onChange={setRating} size='lg' />
      </div>

      {/* Name + Email row */}
      <div className='grid gap-3 sm:grid-cols-2'>
        <div>
          <label className='mb-1.5 block text-sm font-medium opacity-70'>Nombre *</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Tu nombre'
            className='w-full border px-3 py-2 text-sm transition-colors outline-none focus:border-current'
            style={{
              borderRadius: 'var(--sf-radius, 0.75rem)',
              borderColor: 'var(--sf-border, #e5e7eb)',
            }}
          />
        </div>
        <div>
          <label className='mb-1.5 block text-sm font-medium opacity-70'>Email (opcional)</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='tu@email.com'
            className='w-full border px-3 py-2 text-sm transition-colors outline-none focus:border-current'
            style={{
              borderRadius: 'var(--sf-radius, 0.75rem)',
              borderColor: 'var(--sf-border, #e5e7eb)',
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className='mb-1.5 block text-sm font-medium opacity-70'>Título (opcional)</label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Resumen de tu experiencia'
          className='w-full border px-3 py-2 text-sm transition-colors outline-none focus:border-current'
          style={{
            borderRadius: 'var(--sf-radius, 0.75rem)',
            borderColor: 'var(--sf-border, #e5e7eb)',
          }}
        />
      </div>

      {/* Comment */}
      <div>
        <label className='mb-1.5 block text-sm font-medium opacity-70'>Comentario (opcional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Cuéntanos más sobre tu experiencia...'
          rows={4}
          className='w-full resize-none border px-3 py-2 text-sm transition-colors outline-none focus:border-current'
          style={{
            borderRadius: 'var(--sf-radius, 0.75rem)',
            borderColor: 'var(--sf-border, #e5e7eb)',
          }}
        />
      </div>

      {error && <p className='text-sm font-medium text-red-500'>{error}</p>}

      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
        style={{
          backgroundColor: 'var(--sf-primary, #000)',
          borderRadius: 'var(--sf-radius-full, 9999px)',
        }}
      >
        {isPending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
        Enviar reseña
      </button>
    </form>
  );
}

/* ─── Single Review Card ─── */

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt);
  const formatted = date.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div
      className='p-4'
      style={{
        borderRadius: 'var(--sf-radius-lg, 1rem)',
        border: '1px solid var(--sf-border, #e5e7eb)',
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div
            className='flex size-9 items-center justify-center'
            style={{
              borderRadius: 'var(--sf-radius-full, 9999px)',
              backgroundColor: 'var(--sf-surface, #f3f4f6)',
            }}
          >
            <User className='size-4 opacity-50' />
          </div>
          <div>
            <span className='text-sm font-semibold'>{review.customerName}</span>
            <div className='flex items-center gap-2'>
              <StarsDisplay rating={review.rating} />
              <span className='text-xs opacity-40'>{formatted}</span>
            </div>
          </div>
        </div>
      </div>
      {review.title && <h4 className='mt-3 text-sm font-semibold'>{review.title}</h4>}
      {review.comment && <p className='mt-1 text-sm leading-relaxed opacity-70'>{review.comment}</p>}
    </div>
  );
}

/* ─── Main Component ─── */

export function ProductReviews({ productId, businessId, reviews, stats }: ProductReviewsProps) {
  return (
    <section id='reviews' className='mt-12 pt-8' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
      <h2 className='mb-6 text-xl font-bold tracking-tight'>
        Reseñas de clientes
        {stats.total > 0 && <span className='ml-2 text-base font-normal opacity-40'>({stats.total})</span>}
      </h2>

      {stats.total > 0 && (
        <div className='mb-8'>
          <RatingSummary reviews={reviews} stats={stats} />
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className='mb-8 space-y-3'>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Review form */}
      <ReviewForm productId={productId} businessId={businessId} />
    </section>
  );
}
