import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SupportedLanguages } from '../../translations';

// 支持的语言类型
export type LangType = keyof typeof SupportedLanguages;

// 语言上下文接口
interface LangContextType {
  lang: LangType;
  setLang: (lang: LangType) => void;
  t: (key: string) => string;
}

// 创建语言上下文
const LangContext = createContext<LangContextType | undefined>(undefined);

// 检测浏览器语言，增加更可靠的错误处理
const detectBrowserLang = (): LangType => {
  try {
    if (typeof window === 'undefined' || !navigator) {
      console.log('Running in server environment or navigator not available, defaulting to English');
      return 'en';
    }
    
    // 获取浏览器语言设置
    const fullLang = navigator.language || (navigator as any).userLanguage || '';
    const browserLang = fullLang.toLowerCase().split('-')[0];
    
    console.log(`Detected browser language: ${browserLang}`);
    
    // 检查是否支持该语言，如果不支持则返回英文
    if (browserLang === 'zh') {
      return 'zh';
    }
    
    // 默认返回英文
    return 'en';
  } catch (error) {
    console.error('Error detecting browser language:', error);
    return 'en'; // 出错时默认为英文
  }
};

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始化语言状态
  const [lang, setLang] = useState<LangType>(() => {
    try {
      if (typeof window !== 'undefined') {
        // 首先检查本地存储
        const savedLang = localStorage.getItem('lang');
        console.log(`Found saved language preference: ${savedLang}`);
        
        if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
          return savedLang as LangType;
        }
        
        // 如果本地存储中没有有效设置，则检测浏览器语言
        return detectBrowserLang();
      }
      
      return 'en'; // 默认英文
    } catch (error) {
      console.error('Error initializing language state:', error);
      return 'en'; // 出错时默认为英文
    }
  });

  // 翻译函数
  const t = (key: string): string => {
    try {
      // 获取当前语言的翻译
      const langTranslations = translations[lang] || {};
      
      // 如果找不到翻译，尝试使用英文翻译，如果还是找不到则返回键名
      const translation = langTranslations[key] || translations.en[key] || key;
      
      // 当找不到翻译时记录日志，便于调试
      if (translation === key && key !== '') {
        console.warn(`Translation not found for key: "${key}" in language: ${lang}`);
      }
      
      return translation;
    } catch (error) {
      console.error(`Error translating key "${key}":`, error);
      return key; // 出错时返回原始键名
    }
  };

  // 语言变更时保存到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('lang', lang);
      console.log(`Language set to: ${lang}`);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

// 使用语言的自定义Hook
export const useLang = () => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}; 