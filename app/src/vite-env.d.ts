/// <reference types="vite/client" />

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    setText: (text: string) => void
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
  }
  initDataUnsafe?: {
    user?: {
      id: number
      username?: string
      first_name?: string
    }
  }
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
