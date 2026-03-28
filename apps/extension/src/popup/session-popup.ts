/**
 * Extended Popup with Session Management
 * Add these functions to the existing popup.ts file
 */

import type { BackgroundMessage } from '../shared/types';
import type { ApiSession, ApiSessionDetail } from '../shared/api-client';

// Add these HTML element references
const sessionsContainerEl = document.getElementById('sessionsContainer') as HTMLDivElement;
const sessionTabsEl = document.getElementById('sessionTabs') as HTMLDivElement;
const loadSessionsButton = document.getElementById('loadSessions') as HTMLButtonElement;
const testApiButton = document.getElementById('testApi') as HTMLButtonElement;

/**
 * Load recent sessions
 */
async function loadSessions(): Promise<void> {
  if (!sessionsContainerEl) return;

  sessionsContainerEl.innerHTML = '<p>Loading sessions...</p>';

  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'BC_GET_SESSIONS_REQUEST',
      payload: { forceRefresh: false },
    })) as BackgroundMessage;

    const data = response.payload as { ok?: boolean; message?: string; sessions?: ApiSession[] };

    if (!data.ok || !data.sessions) {
      sessionsContainerEl.innerHTML = `<p style="color: red;">❌ ${data.message || 'Failed to load sessions'}</p>`;
      return;
    }

    if (data.sessions.length === 0) {
      sessionsContainerEl.innerHTML = '<p>No sessions captured yet.</p>';
      return;
    }

    renderSessions(data.sessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sessionsContainerEl.innerHTML = `<p style="color: red;">❌ Error: ${message}</p>`;
  }
}

/**
 * Load error sessions
 */
async function loadErrorSessions(): Promise<void> {
  if (!sessionsContainerEl) return;

  sessionsContainerEl.innerHTML = '<p>Loading error sessions...</p>';

  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'BC_GET_SESSIONS_REQUEST',
      payload: { type: 'errors', forceRefresh: false },
    })) as BackgroundMessage;

    const data = response.payload as { ok?: boolean; message?: string; sessions?: ApiSession[] };

    if (!data.ok || !data.sessions) {
      sessionsContainerEl.innerHTML = `<p style="color: orange;">⚠️ ${data.message || 'No error sessions'}</p>`;
      return;
    }

    if (data.sessions.length === 0) {
      sessionsContainerEl.innerHTML = '<p>🟢 No error sessions - everything looks good!</p>';
      return;
    }

    renderSessions(data.sessions, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sessionsContainerEl.innerHTML = `<p style="color: red;">❌ Error: ${message}</p>`;
  }
}

/**
 * Render sessions in the UI
 */
function renderSessions(sessions: ApiSession[], showErrors = false): void {
  if (!sessionsContainerEl) return;

  const html = sessions
    .map((session) => {
      const errorBadge = session.error ? '🔴 ERROR' : '🟢 OK';
      const timestamp = new Date(session.createdAt).toLocaleString();

      return `
        <div style="
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          margin: 8px 0;
          font-size: 12px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <div style="font-weight: bold; margin-bottom: 4px;">
                <span>${errorBadge}</span> ${session.title || 'Untitled'}
              </div>
              <div style="color: #666; margin: 4px 0;">
                <strong>URL:</strong> <code style="background: #eee; padding: 2px 4px;">${truncate(session.url, 40)}</code>
              </div>
              ${
                session.error
                  ? `
                <div style="color: #d32f2f; margin: 4px 0;">
                  <strong>Error:</strong> ${session.error.message}
                </div>
              `
                  : ''
              }
              <div style="color: #666; margin: 4px 0;">
                <strong>Stats:</strong> 📝 ${session.stats.consoleCount} | 🌐 ${session.stats.networkCount} | 💾 ${session.stats.stateSnapshots}
              </div>
              <div style="color: #999; font-size: 11px;">
                ${timestamp}
              </div>
              ${
                session.tags && session.tags.length > 0
                  ? `
                <div style="margin-top: 4px;">
                  ${session.tags.map((tag) => `<span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; margin-right: 4px; font-size: 11px;">${tag}</span>`).join('')}
                </div>
              `
                  : ''
              }
            </div>
            <div>
              <button onclick="viewSessionDetail('${session.sessionId}')" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                margin-bottom: 4px;
              ">View</button>
              <button onclick="deleteSession('${session.sessionId}')" style="
                background: #f44336;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
              ">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  sessionsContainerEl.innerHTML = html;
}

/**
 * View session details
 */
async function viewSessionDetail(sessionId: string): Promise<void> {
  if (!sessionsContainerEl) return;

  sessionsContainerEl.innerHTML = '<p>Loading session details...</p>';

  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'BC_GET_SESSION_DETAIL_REQUEST',
      payload: { sessionId },
    })) as BackgroundMessage;

    const data = response.payload as { ok?: boolean; session?: ApiSessionDetail | null };

    if (!data.ok || !data.session) {
      sessionsContainerEl.innerHTML = '<p style="color: red;">❌ Session not found</p>';
      return;
    }

    renderSessionDetail(data.session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sessionsContainerEl.innerHTML = `<p style="color: red;">❌ Error: ${message}</p>`;
  }
}

/**
 * Render session details
 */
function renderSessionDetail(session: ApiSessionDetail): void {
  if (!sessionsContainerEl) return;

  const html = `
    <div style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 16px;">
      <button onclick="loadSessions()" style="
        background: #666;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 12px;
      ">← Back to Sessions</button>

      <h3 style="margin-top: 0;">${session.error ? '🔴' : '🟢'} ${session.title || 'Untitled'}</h3>

      <div style="background: #f9f9f9; padding: 12px; border-radius: 3px; margin: 12px 0; font-size: 11px;">
        <div><strong>Session ID:</strong> <code>${session.sessionId}</code></div>
        <div><strong>URL:</strong> <code>${session.url}</code></div>
        <div><strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}</div>
        <div><strong>Browser:</strong> ${session.environment.browser} ${session.environment.browserVersion}</div>
        <div><strong>OS:</strong> ${session.environment.os} ${session.environment.osVersion}</div>
      </div>

      ${
        session.error
          ? `
        <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 3px; padding: 12px; margin: 12px 0; font-size: 11px;">
          <strong style="color: #c62828;">Error Details:</strong><br>
          <div><strong>Type:</strong> ${session.error.type}</div>
          <div><strong>Message:</strong> ${session.error.message}</div>
          <div><strong>Signature:</strong> <code style="background: #fff; padding: 2px 4px;">${session.error.signature.substring(0, 16)}...</code></div>
        </div>
      `
          : ''
      }

      <div style="background: #f9f9f9; padding: 12px; border-radius: 3px; margin: 12px 0; font-size: 11px;">
        <strong>Statistics:</strong><br>
        <div>📝 Console: ${session.stats.consoleCount} events</div>
        <div>🌐 Network: ${session.stats.networkCount} events</div>
        <div>💾 State: ${session.stats.stateSnapshots} snapshots</div>
      </div>

      ${
        session.events && session.events.length > 0
          ? `
        <div style="background: #f9f9f9; padding: 12px; border-radius: 3px; margin: 12px 0; font-size: 11px; max-height: 200px; overflow-y: auto;">
          <strong>Recent Events:</strong><br>
          ${session.events
            .slice(0, 5)
            .map((evt) => `<div style="margin: 4px 0; padding: 4px; background: #fff; border-left: 3px solid #2196F3;">
            <strong>${evt.type}</strong> @ ${evt.timestamp}ms
          </div>`)
            .join('')}
          ${session.events.length > 5 ? `<div style="text-align: center; padding: 8px; color: #666;">... and ${session.events.length - 5} more</div>` : ''}
        </div>
      `
          : ''
      }

      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button onclick="deleteSession('${session.sessionId}')" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          flex: 1;
        ">Delete Session</button>
      </div>
    </div>
  `;

  sessionsContainerEl.innerHTML = html;
}

/**
 * Delete session
 */
async function deleteSession(sessionId: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this session?')) {
    return;
  }

  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'BC_DELETE_SESSION_REQUEST',
      payload: { sessionId },
    })) as BackgroundMessage;

    const data = response.payload as { ok?: boolean; message?: string };

    if (data.ok) {
      alert('Session deleted successfully');
      void loadSessions();
    } else {
      alert(`Failed to delete: ${data.message}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`Error: ${message}`);
  }
}

/**
 * Test API connection
 */
async function testApiConnection(): Promise<void> {
  if (!testApiButton) return;

  testApiButton.disabled = true;
  testApiButton.textContent = 'Testing...';

  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'BC_TEST_API_CONNECTION_REQUEST',
    })) as BackgroundMessage;

    const data = response.payload as { ok?: boolean; message?: string; connected?: boolean };

    if (data.connected) {
      alert('✅ API connection successful!');
      testApiButton.textContent = 'Test API ✓';
    } else {
      alert(`❌ API connection failed: ${data.message}`);
      testApiButton.textContent = 'Test API';
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`❌ Error: ${message}`);
    testApiButton.textContent = 'Test API';
  } finally {
    testApiButton.disabled = false;
  }
}

/**
 * Utility: truncate long strings
 */
function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Add event listeners
if (loadSessionsButton) {
  loadSessionsButton.addEventListener('click', loadSessions);
}

if (testApiButton) {
  testApiButton.addEventListener('click', testApiConnection);
}

if (sessionTabsEl) {
  const errorTabBtn = document.createElement('button');
  errorTabBtn.textContent = 'Error Sessions';
  errorTabBtn.style.cssText = `
    background: #f44336;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    margin-left: 8px;
  `;
  errorTabBtn.addEventListener('click', loadErrorSessions);
  sessionTabsEl.appendChild(errorTabBtn);
}

// Load sessions on popup open
void loadSessions();
