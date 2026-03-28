/**
 * Extended Background Service with Session Management
 * Add these message handlers to the existing background/index.ts
 */

import { SessionManager } from '../shared/session-manager';
import type { BackgroundMessage } from '../shared/types';

// Add this near the top of the file with other manager instances
let sessionManager: SessionManager | null = null;

/**
 * Initialize session manager when config is available
 */
async function initializeSessionManager(): Promise<SessionManager | null> {
  if (sessionManager) {
    return sessionManager;
  }

  const config = await getConfig();
  if (!config.projectKey) {
    return null;
  }

  sessionManager = new SessionManager(config.apiBaseUrl, config.projectKey);
  return sessionManager;
}

/**
 * Reset session manager when config changes
 */
function resetSessionManager(): void {
  sessionManager = null;
}

// Add these message handlers to the chrome.runtime.onMessage.addListener

/**
 * Get recent sessions
 */
if (message.type === 'BC_GET_SESSIONS_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty. Set it in Options.',
          sessions: [],
        },
      });
      return;
    }

    try {
      const config = await getConfig();
      const sessions = await manager.getRecentSessions(
        config.projectId,
        (message.payload as { forceRefresh?: boolean }).forceRefresh,
      );
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: true,
          sessions,
          message: `Fetched ${sessions.length} session(s)`,
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to fetch sessions: ${details}`,
          sessions: [],
        },
      });
    }
  })();
  return true;
}

/**
 * Get error sessions only
 */
if (message.type === 'BC_GET_SESSIONS_REQUEST' && (message.payload as { type?: string })?.type === 'errors') {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
          sessions: [],
        },
      });
      return;
    }

    try {
      const config = await getConfig();
      const sessions = await manager.getErrorSessions(
        config.projectId,
        (message.payload as { forceRefresh?: boolean }).forceRefresh,
      );
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: true,
          sessions,
          message: `Fetched ${sessions.length} error session(s)`,
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_GET_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to fetch error sessions: ${details}`,
          sessions: [],
        },
      });
    }
  })();
  return true;
}

/**
 * Get session details
 */
if (message.type === 'BC_GET_SESSION_DETAIL_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_GET_SESSION_DETAIL_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
          session: null,
        },
      });
      return;
    }

    try {
      const sessionId = (message.payload as { sessionId?: string }).sessionId;
      const session = await manager.getSessionDetail(sessionId);
      sendResponse({
        type: 'BC_GET_SESSION_DETAIL_RESPONSE',
        payload: {
          ok: session !== null,
          session,
          message: session ? 'Session fetched successfully' : 'Session not found',
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_GET_SESSION_DETAIL_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to fetch session details: ${details}`,
          session: null,
        },
      });
    }
  })();
  return true;
}

/**
 * Search sessions
 */
if (message.type === 'BC_SEARCH_SESSIONS_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_SEARCH_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
          sessions: [],
        },
      });
      return;
    }

    try {
      const config = await getConfig();
      const query = (message.payload as { query?: string }).query || '';
      const sessions = await manager.searchSessions(config.projectId, query);
      sendResponse({
        type: 'BC_SEARCH_SESSIONS_RESPONSE',
        payload: {
          ok: true,
          sessions,
          message: `Found ${sessions.length} session(s)`,
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_SEARCH_SESSIONS_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to search sessions: ${details}`,
          sessions: [],
        },
      });
    }
  })();
  return true;
}

/**
 * Add comment to session
 */
if (message.type === 'BC_ADD_COMMENT_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_ADD_COMMENT_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
        },
      });
      return;
    }

    try {
      const payload = message.payload as { sessionId?: string; body?: string; author?: string };
      const success = await manager.addComment(payload.sessionId || '', payload.body || '', payload.author);
      sendResponse({
        type: 'BC_ADD_COMMENT_RESPONSE',
        payload: {
          ok: success,
          message: success ? 'Comment added successfully' : 'Failed to add comment',
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_ADD_COMMENT_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to add comment: ${details}`,
        },
      });
    }
  })();
  return true;
}

/**
 * Add tag to session
 */
if (message.type === 'BC_ADD_TAG_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_ADD_TAG_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
        },
      });
      return;
    }

    try {
      const payload = message.payload as { sessionId?: string; tags?: string[] };
      const success = await manager.addTag(payload.sessionId || '', payload.tags || []);
      sendResponse({
        type: 'BC_ADD_TAG_RESPONSE',
        payload: {
          ok: success,
          message: success ? 'Tag added successfully' : 'Failed to add tag',
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_ADD_TAG_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to add tag: ${details}`,
        },
      });
    }
  })();
  return true;
}

/**
 * Delete session
 */
if (message.type === 'BC_DELETE_SESSION_REQUEST' && message.payload) {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_DELETE_SESSION_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
        },
      });
      return;
    }

    try {
      const sessionId = (message.payload as { sessionId?: string }).sessionId;
      const success = await manager.deleteSession(sessionId || '');
      sendResponse({
        type: 'BC_DELETE_SESSION_RESPONSE',
        payload: {
          ok: success,
          message: success ? 'Session deleted successfully' : 'Failed to delete session',
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_DELETE_SESSION_RESPONSE',
        payload: {
          ok: false,
          message: `Failed to delete session: ${details}`,
        },
      });
    }
  })();
  return true;
}

/**
 * Test API connection
 */
if (message.type === 'BC_TEST_API_CONNECTION_REQUEST') {
  (async () => {
    const manager = await initializeSessionManager();
    if (!manager) {
      sendResponse({
        type: 'BC_TEST_API_CONNECTION_RESPONSE',
        payload: {
          ok: false,
          message: 'Project key is empty.',
          connected: false,
        },
      });
      return;
    }

    try {
      const connected = await manager.testConnection();
      sendResponse({
        type: 'BC_TEST_API_CONNECTION_RESPONSE',
        payload: {
          ok: connected,
          message: connected ? 'API connection successful' : 'API connection failed',
          connected,
        },
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({
        type: 'BC_TEST_API_CONNECTION_RESPONSE',
        payload: {
          ok: false,
          message: `Connection test failed: ${details}`,
          connected: false,
        },
      });
    }
  })();
  return true;
}

// Update the BC_CONFIG_SAVE handler to reset session manager
// (replace the existing one in the onMessage listener)
if (message.type === 'BC_CONFIG_SAVE' && message.payload) {
  const nextConfig = normalizeConfig(message.payload as Partial<ExtensionConfig>);
  setConfig(nextConfig)
    .then(() => {
      resetSessionManager(); // Reset cache when config changes
      sendResponse({ type: 'BC_CONFIG_RESPONSE', payload: nextConfig });
    })
    .catch((error: unknown) => {
      const details = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ type: 'BC_CONFIG_RESPONSE', payload: { ...nextConfig, error: details } });
    });
  return true;
}
