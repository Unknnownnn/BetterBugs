import { DEFAULT_CONFIG, type BackgroundMessage, type ExtensionConfig } from '../shared/types';

const form = document.getElementById('configForm') as HTMLFormElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

const apiBaseUrlInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
const projectIdInput = document.getElementById('projectId') as HTMLInputElement;
const projectKeyInput = document.getElementById('projectKey') as HTMLInputElement;
const captureNetworkInput = document.getElementById('captureNetwork') as HTMLInputElement;
const captureConsoleInput = document.getElementById('captureConsole') as HTMLInputElement;
const captureErrorsInput = document.getElementById('captureErrors') as HTMLInputElement;
let lastLoadedConfig: ExtensionConfig = { ...DEFAULT_CONFIG };
const CONFIG_KEY = 'bugcatcherConfig';
const MESSAGE_TIMEOUT_MS = 5_000;

function setStatus(text: string): void {
  statusEl.textContent = text;
}

async function sendMessageWithTimeout<T>(
  message: BackgroundMessage,
  timeoutMs: number = MESSAGE_TIMEOUT_MS,
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Background request timed out.'));
    }, timeoutMs);

    chrome.runtime
      .sendMessage(message)
      .then((response) => {
        window.clearTimeout(timeoutId);
        resolve(response as T);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function fillForm(config: ExtensionConfig): void {
  lastLoadedConfig = { ...config };
  apiBaseUrlInput.value = config.apiBaseUrl;
  projectIdInput.value = config.projectId;
  projectKeyInput.value = config.projectKey;
  captureNetworkInput.checked = config.captureNetwork;
  captureConsoleInput.checked = config.captureConsole;
  captureErrorsInput.checked = config.captureErrors;
}

async function loadConfig(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(CONFIG_KEY);
    const payload = result[CONFIG_KEY] as ExtensionConfig | undefined;
    fillForm({ ...DEFAULT_CONFIG, ...(payload ?? {}) });
    setStatus('');
  } catch (error: unknown) {
    setStatus(error instanceof Error ? error.message : 'Failed to load config.');
    fillForm({ ...DEFAULT_CONFIG });
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nextConfig: ExtensionConfig = {
    apiBaseUrl: apiBaseUrlInput.value.trim(),
    projectId: projectIdInput.value.trim(),
    projectKey: projectKeyInput.value.trim(),
    captureNetwork: captureNetworkInput.checked,
    captureConsole: captureConsoleInput.checked,
    captureErrors: captureErrorsInput.checked,
    captureState: DEFAULT_CONFIG.captureState,
    sanitizationRules: lastLoadedConfig.sanitizationRules,
    captureResolution: DEFAULT_CONFIG.captureResolution,
    captureFrameRate: DEFAULT_CONFIG.captureFrameRate,
  };

  try {
    setStatus('Saving...');
    await chrome.storage.sync.set({ [CONFIG_KEY]: nextConfig });

    // Best effort notification so background can refresh any in-memory state.
    await sendMessageWithTimeout<BackgroundMessage>({ type: 'BC_CONFIG_SAVE', payload: nextConfig }).catch(
      () => undefined,
    );

    setStatus('Saved.');
  } catch (error: unknown) {
    setStatus(error instanceof Error ? error.message : 'Failed to save config.');
  }
});

void loadConfig();
