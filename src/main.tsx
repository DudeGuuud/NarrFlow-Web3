import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { LangProvider } from './contexts/lang/LangContext'
import { router } from './router'
import './index.css'
import { WalletProvider } from '@suiet/wallet-kit'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <ThemeProvider>
        <LangProvider>
          <RouterProvider router={router} />
        </LangProvider>
      </ThemeProvider>
    </WalletProvider>
  </React.StrictMode>
)
