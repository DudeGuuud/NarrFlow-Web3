import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import '@mysten/dapp-kit/dist/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/lang/LangContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

// 创建网络配置
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') },
})

// 确定默认网络
const defaultNetwork = import.meta.env.VITE_SUI_NETWORK || 'testnet'

// 创建查询客户端
const queryClient = new QueryClient()

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect>
          <ThemeProvider>
            <LangProvider>
              <RouterProvider router={router} future={{ v7_startTransition: true }} />
            </LangProvider>
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
