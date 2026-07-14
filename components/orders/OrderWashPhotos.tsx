'use client';

import { Images, ImageOff, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyOrderWashPhotos } from '@/hooks/orders/useOrders';

type PreviewHandler = (photos: string[], index: number) => void;

/**
 * Ảnh hiện trạng xe trước & sau khi rửa, hiển thị ngay trong thẻ đơn ở lịch sử rửa xe.
 * Không render gì nếu đơn chưa có ảnh nào — tránh làm rối danh sách.
 */
export function OrderWashPhotos({
  orderId,
  onPreview,
}: {
  orderId: string;
  onPreview: PreviewHandler;
}) {
  const { data, isLoading } = useMyOrderWashPhotos(orderId);

  if (isLoading) {
    return (
      <div className='mt-3 grid max-w-2xl grid-cols-2 gap-3'>
        <Skeleton className='h-28 rounded-lg' />
        <Skeleton className='h-28 rounded-lg' />
      </div>
    );
  }

  const before = data?.checkinPhotos ?? [];
  const after = data?.checkoutPhotos ?? [];

  if (before.length === 0 && after.length === 0) return null;

  return (
    <div className='mt-3 max-w-2xl rounded-xl border border-border bg-muted/30 p-3'>
      <p className='mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
        <Images className='h-3.5 w-3.5 text-primary' />
        Ảnh trước &amp; sau khi rửa
      </p>

      <div className='flex items-center gap-3'>
        <PhotoSlot
          label='Trước khi rửa'
          photos={before}
          onPreview={onPreview}
        />
        <ArrowRight className='hidden h-4 w-4 shrink-0 text-muted-foreground sm:block' />
        <PhotoSlot
          label='Sau khi rửa'
          photos={after}
          onPreview={onPreview}
        />
      </div>
    </div>
  );
}

function PhotoSlot({
  label,
  photos,
  onPreview,
}: {
  label: string;
  photos: string[];
  onPreview: PreviewHandler;
}) {
  const [main, ...rest] = photos;

  return (
    <div className='min-w-0 flex-1 space-y-1.5'>
      <span className='block text-[11px] font-semibold text-foreground'>
        {label}
      </span>

      {main ? (
        <button
          type='button'
          onClick={() => onPreview(photos, 0)}
          aria-label={`Xem ảnh ${label.toLowerCase()}`}
          className='group relative block h-28 w-full cursor-pointer overflow-hidden rounded-lg border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main}
            alt={label}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
          {rest.length > 0 && (
            <span className='absolute right-1.5 bottom-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white'>
              +{rest.length}
            </span>
          )}
        </button>
      ) : (
        <div className='flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-background/60 text-muted-foreground'>
          <ImageOff className='h-4 w-4' />
          <span className='text-[10px] font-medium'>Chưa có ảnh</span>
        </div>
      )}
    </div>
  );
}
