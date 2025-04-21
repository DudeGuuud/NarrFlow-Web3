import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { WalletProvider } from '@suiet/wallet-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider } from '@mysten/dapp-kit'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/lang/LangContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

const queryClient = new QueryClient()
const networks = {
  localnet: { url: 'http://127.0.0.1:9000' },
  devnet: { url: 'https://fullnode.devnet.sui.io' },
  mainnet: { url: 'https://fullnode.mainnet.sui.io' },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="localnet">
        <WalletProvider>
          <ThemeProvider>
            <LangProvider>
              <RouterProvider router={router} />
            </LangProvider>
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
