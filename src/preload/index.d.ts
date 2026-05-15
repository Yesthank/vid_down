import type { ClipFlowApi } from '../shared/types'

declare global {
  interface Window {
    clipflow: ClipFlowApi
  }
}

export {}
