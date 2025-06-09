/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CONTRACT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 