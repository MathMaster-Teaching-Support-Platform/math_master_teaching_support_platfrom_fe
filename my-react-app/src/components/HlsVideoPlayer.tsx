import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AuthService } from '../services/api/auth.service';

interface HlsVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  initialTime?: number;
}

/**
 * A wrapper around the native HTML5 <video> element that automatically
 * mounts hls.js if the source is an .m3u8 playlist.
 * Falls back to native video playback for standard .mp4 files.
 */
export const HlsVideoPlayer: React.FC<HlsVideoPlayerProps> = ({
  src,
  initialTime = 0,
  ...videoProps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    // Check if the source is an HLS playlist
    const isHls = src.includes('.m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          // Aggressive buffer configuration for smooth playback
          maxBufferLength: 60, // Buffer up to 60 seconds ahead
          maxMaxBufferLength: 120, // Absolute max memory buffer (in seconds)
          maxBufferSize: 60 * 1000 * 1000, // 60MB max RAM usage
          
          // The backend proxy requires JWT authentication, BUT MinIO presigned chunk URLs do not.
          // Sending an 'Authorization' header to MinIO alongside a presigned URL causes a 400 Bad Request / CORS error.
          xhrSetup: (xhr, url) => {
            const token = AuthService.getToken();
            if (token && !url.includes('X-Amz-Signature')) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
          },
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
          // Only autoPlay if requested by props
          if (videoProps.autoPlay) {
            video.play().catch(e => console.warn('Autoplay prevented:', e));
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Lỗi mạng khi tải video. Vui lòng thử lại.');
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Lỗi định dạng video.');
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                setError('Không thể phát video (Lỗi máy chủ).');
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari (native HLS support)
        // Note: Safari native doesn't easily support JWT in xhrSetup for the video tag,
        // but our presigned proxy might require it. Safari users might need the 
        // JWT passed in the query string if the backend supports it.
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
        });
      } else {
        setError('Trình duyệt của bạn không hỗ trợ phát video HLS.');
      }
    } else {
      // Standard video (e.g., .mp4 fallback)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, initialTime, videoProps.autoPlay]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', color: '#ef4444', zIndex: 10, padding: 20, textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <video ref={videoRef} {...videoProps} style={{ width: '100%', height: '100%', ...videoProps.style }} />
    </div>
  );
};
