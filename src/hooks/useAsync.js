import { useCallback, useEffect, useState } from 'react'

/**
 * Run an async loader and expose its state.
 *
 * @param {() => Promise<T>} loader
 * @param {Array<unknown>} deps  Dependencies that trigger a reload
 * @param {{ immediate?: boolean }} [options]
 * @returns {{ data: T|null, error: Error|null, loading: boolean, reload: () => void }}
 */
export function useAsync(loader, deps = [], options = {}) {
  const { immediate = true } = options

  const [state, setState] = useState({
    data: null,
    error: null,
    loading: immediate,
    nonce: 0,
  })

  const reload = useCallback(() => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      nonce: previous.nonce + 1,
    }))
  }, [])

  useEffect(() => {
    let cancelled = false

    // The loading flag is flipped in a microtask on purpose: React treats a
    // synchronous setState inside an effect body as a cascading render.
    Promise.resolve().then(() => {
      if (!cancelled) {
        setState((previous) =>
          previous.loading ? previous : { ...previous, loading: true, error: null },
        )
      }
    })

    loader()
      .then((result) => {
        if (!cancelled) {
          setState((previous) => ({ ...previous, data: result, error: null, loading: false }))
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            error: caught instanceof Error ? caught : new Error(String(caught)),
            loading: false,
          }))
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, state.nonce, immediate])

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    reload,
  }
}
