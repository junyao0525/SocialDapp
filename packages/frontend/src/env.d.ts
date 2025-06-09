/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CONTRACT_ADDRESS: string
  readonly PINATA_API_KEY: string
  readonly PINATA_SECRET: string
  readonly PINATA_JWT: string
  readonly GATEWAY_URL : string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 