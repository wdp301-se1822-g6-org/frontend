'use client';

import { useState } from 'react';
import { Images, X, ImageOff, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { OrderWashPhotos } from '@/hooks/orders/useOrders';

const RATING_LABELS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

interface ReviewModalProps {
  serviceName: string;
  washerName: string | null;
  washPhotos: OrderWashPhotos | null | undefined;
  isLoadingPhotos: boolean;
  canRate: boolean;
  alreadyRated: boolean;
  rating: number;
  onRatingChange: (value: number) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onPreview: (url: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ReviewModal({
  serviceName,
  washerName,
  washPhotos,
  isLoadingPhotos,
  canRate,
  alreadyRated,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  onPreview,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const title = alreadyRated
    ? 'Đánh giá của bạn'
    : 'Đánh giá chất lượng rửa xe';
  const subtitle = alreadyRated
    ? `${serviceName} • Xem lại ảnh hiện trạng xe`
    : `${serviceName} • Ảnh hiện trạng xe và đánh giá thợ`;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='flex max-h-[90vh] w-full max-w-[800px] flex-col overflow-hidden rounded-3xl bg-card shadow-xl animate-in zoom-in-95 duration-200'>
        <div className='flex flex-col gap-5 overflow-y-auto p-5 sm:p-7'>
          <ReviewModalHeader
            title={title}
            subtitle={subtitle}
            onClose={onClose}
          />

          <WasherInfoCard name={washerName} />

          <WashPhotoSection
            photos={washPhotos}
            isLoading={isLoadingPhotos}
            onPreview={onPreview}
          />

          {canRate && (
            <div className='space-y-4'>
              <RatingInput rating={rating} onChange={onRatingChange} />

              <div className='space-y-1.5'>
                <Label
                  htmlFor='feedback-comment'
                  className='text-sm font-semibold text-foreground'
                >
                  Nhận xét của bạn
                </Label>
                <textarea
                  id='feedback-comment'
                  placeholder='Ví dụ: Thợ rửa sạch, đúng giờ, thái độ tốt...'
                  value={comment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className='min-h-[104px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                />
                <p className='text-xs text-muted-foreground'>
                  Không bắt buộc, nhưng nhận xét của bạn giúp chúng tôi cải thiện
                  dịch vụ.
                </p>
              </div>
            </div>
          )}

          {alreadyRated && <ReviewSummary />}

          <ModalFooter canRate={canRate} onClose={onClose} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}

function ReviewModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className='flex items-start justify-between gap-3 border-b border-border pb-4'>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Images className='size-5' />
        </div>
        <div className='min-w-0'>
          <h3 className='font-heading text-xl font-bold text-foreground sm:text-[22px]'>
            {title}
          </h3>
          <p className='mt-0.5 text-sm text-muted-foreground'>{subtitle}</p>
        </div>
      </div>
      <button
        type='button'
        onClick={onClose}
        aria-label='Đóng'
        className='shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        <X className='size-5' />
      </button>
    </div>
  );
}

function WasherInfoCard({ name }: { name: string | null }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div className='flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3 dark:bg-muted/40'>
      <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary'>
        {initial}
      </div>
      <div className='min-w-0'>
        <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
          Thợ phụ trách
        </p>
        <p className='truncate font-semibold text-foreground'>
          {name || 'Chưa phân công'}
        </p>
        {name && (
          <p className='truncate text-xs text-muted-foreground'>
            Người thực hiện đơn rửa xe này
          </p>
        )}
      </div>
    </div>
  );
}

function WashPhotoSection({
  photos,
  isLoading,
  onPreview,
}: {
  photos: OrderWashPhotos | null | undefined;
  isLoading: boolean;
  onPreview: (url: string) => void;
}) {
  const hasAny =
    !!photos &&
    (photos.checkinPhotos.length > 0 || photos.checkoutPhotos.length > 0);

  return (
    <section className='space-y-2.5'>
      <h4 className='text-sm font-semibold text-foreground'>
        Ảnh hiện trạng xe
      </h4>

      {isLoading ? (
        <div className='flex h-[176px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-slate-50/60 dark:bg-muted/30'>
          <Spinner className='size-6 text-primary' />
          <span className='text-xs text-muted-foreground'>
            Đang tải hình ảnh...
          </span>
        </div>
      ) : hasAny ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <WashPhotoCard
            title='Trước khi rửa'
            photos={photos.checkinPhotos}
            onPreview={onPreview}
          />
          <WashPhotoCard
            title='Sau khi rửa'
            photos={photos.checkoutPhotos}
            onPreview={onPreview}
          />
        </div>
      ) : (
        <div className='flex h-[176px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center dark:border-border dark:bg-muted/30'>
          <ImageOff className='size-10 text-slate-300 dark:text-muted-foreground/50' />
          <p className='text-sm font-semibold text-foreground'>
            Chưa có ảnh rửa xe
          </p>
          <p className='text-xs text-muted-foreground'>
            Nhân viên chưa cập nhật hình ảnh cho đơn này.
          </p>
        </div>
      )}
    </section>
  );
}

function WashPhotoCard({
  title,
  photos,
  onPreview,
}: {
  title: string;
  photos: string[];
  onPreview: (url: string) => void;
}) {
  const [main, ...rest] = photos;

  return (
    <div className='overflow-hidden rounded-xl border border-border bg-card'>
      <div className='flex items-center justify-between border-b border-border/70 px-3 py-2'>
        <span className='text-xs font-semibold text-foreground'>{title}</span>
        <span className='text-[11px] font-medium text-muted-foreground'>
          {photos.length} ảnh
        </span>
      </div>

      {photos.length === 0 ? (
        <div className='m-3 flex h-[160px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center dark:border-border dark:bg-muted/30'>
          <ImageOff className='size-9 text-slate-300 dark:text-muted-foreground/50' />
          <span className='text-xs font-medium text-muted-foreground'>
            Chưa có ảnh
          </span>
        </div>
      ) : (
        <div className='space-y-2 p-3'>
          <button
            type='button'
            onClick={() => onPreview(main)}
            className='group block w-full overflow-hidden rounded-xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-border'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={main}
              alt={`${title} 1`}
              className='h-[190px] w-full object-cover transition-transform group-hover:scale-105'
            />
          </button>

          {rest.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {rest.map((photo, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => onPreview(photo)}
                  className='size-14 overflow-hidden rounded-lg border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-border'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`${title} ${idx + 2}`}
                    className='size-full object-cover transition-transform hover:scale-105'
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RatingInput({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <div className='rounded-xl border border-border bg-slate-50/60 p-4 dark:bg-muted/30'>
      <p className='text-center text-sm font-semibold text-foreground'>
        Bạn hài lòng với dịch vụ này?
      </p>
      <div
        className='mt-3 flex justify-center gap-1.5'
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            aria-label={`${star} sao`}
            aria-pressed={rating === star}
            className='rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
          >
            <Star
              className={cn(
                'size-7 transition-colors',
                star <= active
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300 dark:text-muted-foreground/50',
              )}
            />
          </button>
        ))}
      </div>
      <p className='mt-2 text-center text-sm'>
        {rating > 0 ? (
          <span className='font-semibold text-foreground'>
            {RATING_LABELS[rating]} ({rating} sao)
          </span>
        ) : (
          <span className='text-muted-foreground'>Chọn số sao để đánh giá</span>
        )}
      </p>
    </div>
  );
}

function ReviewSummary() {
  return (
    <div className='flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30'>
      <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'>
        <CheckCircle className='size-5' />
      </div>
      <div>
        <p className='font-semibold text-emerald-800 dark:text-emerald-300'>
          Bạn đã đánh giá đơn này. Cảm ơn bạn!
        </p>
        <p className='mt-0.5 text-sm text-emerald-700/80 dark:text-emerald-400/70'>
          Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.
        </p>
      </div>
    </div>
  );
}

function ModalFooter({
  canRate,
  onClose,
  onSubmit,
}: {
  canRate: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className='flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3'>
      <Button
        type='button'
        variant='outline'
        onClick={onClose}
        className='h-11 rounded-xl px-6 font-semibold'
      >
        {canRate ? 'Hủy' : 'Đóng'}
      </Button>
      {canRate && (
        <Button
          type='button'
          onClick={onSubmit}
          className='h-11 rounded-xl bg-emerald-600 px-8 font-bold text-white hover:bg-emerald-700'
        >
          Gửi đánh giá
        </Button>
      )}
    </div>
  );
}
