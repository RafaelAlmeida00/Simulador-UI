'use client';

import * as React from 'react';
import type { IBuffer, ICar } from '../types/socket';
import { BufferCard } from './BufferCard';

export interface BufferCardRowProps {
  buffers: IBuffer[];
  onBufferClick: (buffer: IBuffer) => void;
  onCarClick: (car: ICar, carId: string) => void;
}

export const BufferCardVirtual = React.memo(
  function BufferCardVirtual({
    index,
    style,
    ariaAttributes,
    buffers,
    onBufferClick,
    onCarClick,
  }: {
    index: number;
    style: React.CSSProperties;
    ariaAttributes: {
      'aria-posinset': number;
      'aria-setsize': number;
      role: 'listitem';
    };
  } & BufferCardRowProps) {
    const buffer = buffers[index];

    if (!buffer) return null;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 6,
          paddingBottom: 6,
        }}
        {...ariaAttributes}
      >
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <BufferCard
            buffer={buffer}
            variant={buffer.type}
            onBufferClick={onBufferClick}
            onCarClick={onCarClick}
          />
        </div>
      </div>
    );
  }
);
