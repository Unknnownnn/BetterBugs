import { describe, expect, it } from 'vitest';

import {
  createCaptureMediaMetadata,
  createUploadFailureMessage,
  createUploadTransportFailureMessage,
  normalizeEnvironmentInfo,
} from './capture-utils';
import { DEFAULT_CONFIG } from '../shared/types';

describe('capture-utils', () => {
  it('builds media metadata from config and frozen snapshot', () => {
    const metadata = createCaptureMediaMetadata(
      {
        ...DEFAULT_CONFIG,
        captureResolution: '720p',
        captureFrameRate: 30,
      },
      {
        frozenAt: Date.parse('2026-03-28T00:00:00.000Z'),
        retentionWindowMs: 120_000,
        events: [
          {
            id: 'e1',
            type: 'console',
            timestamp: 1,
            payload: { level: 'log', message: 'ok' },
          },
        ],
      },
    );

    expect(metadata).toEqual({
      resolution: '720p',
      frameRate: 30,
      bufferWindowMs: 120_000,
      frozenAt: '2026-03-28T00:00:00.000Z',
      eventCount: 1,
    });
  });

  it('returns safe retry-oriented upload failure text', () => {
    expect(createUploadFailureMessage(500)).toBe('Upload failed (500). Retry capture.');
  });

  it('returns safe retry-oriented upload transport failure text', () => {
    expect(createUploadTransportFailureMessage()).toBe('Upload failed. Retry capture.');
  });

  it('normalizes missing environment with API-valid defaults', () => {
    expect(normalizeEnvironmentInfo(undefined)).toEqual({
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
      osVersion: 'Unknown',
      language: 'en-US',
      viewport: {
        width: 1280,
        height: 720,
      },
    });
  });

  it('preserves valid environment values and repairs invalid viewport values', () => {
    expect(
      normalizeEnvironmentInfo({
        browser: 'Chrome',
        browserVersion: '123.0',
        os: 'Windows',
        osVersion: '11',
        language: 'en-US',
        viewport: {
          width: 0,
          height: -1,
        },
      }),
    ).toEqual({
      browser: 'Chrome',
      browserVersion: '123.0',
      os: 'Windows',
      osVersion: '11',
      language: 'en-US',
      viewport: {
        width: 1280,
        height: 720,
      },
    });
  });
});
