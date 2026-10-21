export type ApiStatus = 'idle' | 'waking' | 'ok' | 'down'

// The hackathon build is fully client-side: the survey and matching run in the browser and nothing is sent to a server.
export async function prewarm(onStatus: (s: ApiStatus) => void): Promise<void> {
  onStatus('idle')
}
