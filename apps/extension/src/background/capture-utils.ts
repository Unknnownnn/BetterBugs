import type { CaptureMediaMetadata, EnvironmentInfo, ExtensionConfig } from '../shared/types';
import type { FrozenCaptureSnapshot } from '../shared/capture/rolling-buffer';

const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const DEFAULT_LANGUAGE = 'en-US';

export function normalizeEnvironmentInfo(environment?: EnvironmentInfo): EnvironmentInfo {
  const width = environment?.viewport?.width ?? 0;
  const height = environment?.viewport?.height ?? 0;

  return {
    browser: environment?.browser?.trim() || 'Unknown',
    browserVersion: environment?.browserVersion?.trim() || 'Unknown',
    os: environment?.os?.trim() || 'Unknown',
    osVersion: environment?.osVersion?.trim() || 'Unknown',
    language: environment?.language?.trim() || DEFAULT_LANGUAGE,
    viewport: {
      width: width > 0 ? width : DEFAULT_VIEWPORT_WIDTH,
      height: height > 0 ? height : DEFAULT_VIEWPORT_HEIGHT,
    },
  };
}

export function createCaptureMediaMetadata(
  config: ExtensionConfig,
  snapshot: FrozenCaptureSnapshot,
): CaptureMediaMetadata {
  return {
    resolution: config.captureResolution,
    frameRate: config.captureFrameRate,
    bufferWindowMs: snapshot.retentionWindowMs,
    frozenAt: new Date(snapshot.frozenAt).toISOString(),
    eventCount: snapshot.events.length,
  };
}

export function createUploadFailureMessage(statusCode: number): string {
  return `Upload failed (${statusCode}). Retry capture.`;
}

export function createUploadTransportFailureMessage(): string {
  return 'Upload failed. Retry capture.';
}
