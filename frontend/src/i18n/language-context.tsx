import { createContext, useContext, useEffect, useState } from 'react'

import { en } from './en.ts'
import { nl } from './nl.ts'
import type { Language, Translations } from './types.ts'

const LANGUAGE_STORAGE_KEY = 'app-language'

const RESOURCES: Record<Language, Translations> = { en, nl }

const readLanguage = (): Language => {
    const v = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return v === 'nl' ? v : 'en'
}

interface LanguageContextValue {
    readonly language: Language
    readonly setLanguage: (language: Language) => void
    readonly t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export const LanguageProvider = ({ children }: { readonly children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>(readLanguage)

    useEffect(() => {
        document.documentElement.lang = language
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    }, [language])

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: RESOURCES[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
    return context
}
