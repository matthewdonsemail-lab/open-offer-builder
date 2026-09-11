import type { CSSProperties } from 'react';
import {
  MediaCommunitySkin,
  MediaOutlet,
  MediaPlayer,
} from '@vidstack/react';
import 'vidstack/styles/defaults.css';
import 'vidstack/styles/community-skin/video.css';
import 'vidstack/styles/community-skin/audio.css';

type FunnelVideoProps = {
  src: string;
  title?: string;
  variant?: 'autoplay' | 'controls';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
};

/**
 * Funnel video surface. Same composition as the working inferencesaver
 * player: MediaPlayer + outlet + community skin. Navy brand accents.
 * `autoplay` = muted looping walkthrough, still with full controls.
 */
export function FunnelVideo({
  src,
  title,
  variant = 'controls',
  autoPlay = false,
  muted = false,
  loop = false,
  className = '',
}: FunnelVideoProps) {
  if (variant === 'autoplay') {
    return (
      <MediaPlayer
        className={`block size-full ${className}`}
        title={title}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ '--video-brand': '#0D2A4C' } as CSSProperties}
      >
        <MediaOutlet />
      </MediaPlayer>
    );
  }

  return (
    <MediaPlayer
      className={`block size-full ${className}`}
      title={title}
      src={src}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      style={{ '--video-brand': '#0D2A4C' } as CSSProperties}
    >
      <MediaOutlet />
      <MediaCommunitySkin />
    </MediaPlayer>
  );
}
