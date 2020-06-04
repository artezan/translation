import React, {createContext, useContext, useReducer, useEffect} from 'react'

const initialLanguage = ''
const initialDictionary = {}

const reducerLanguage = (state, actions) => {
  if (actions) {
    return actions
  }
  return state
}

/*
  {
    action: 'ADD',
    resources: {}
  }
 */
const reducerDictionary = (state, {action, resources}) => {
  switch (action) {
    case 'ADD':
      return {...state, ...resources}

    default:
      return {...state}
  }
}

const LanguageContext = createContext(initialLanguage)
const DictionaryContext = createContext(initialDictionary)

export const useLanguage = () => useContext(LanguageContext)
export const useDictionary = () => useContext(DictionaryContext)

export const TranslationProvider = ({
  resources,
  children,
  initialLanguage: initLang
}) => {
  const [language, setLanguage] = useReducer(reducerLanguage, initialLanguage)
  const [dictionary, setDictionary] = useReducer(
    reducerDictionary,
    initialDictionary
  )

  useEffect(() => {
    setDictionary({action: 'ADD', resources})
    setLanguage(initLang)
  }, [resources, initLang])

  return (
    <LanguageContext.Provider value={{language, setLanguage}}>
      <DictionaryContext.Provider value={{dictionary, setDictionary}}>
        {children}
      </DictionaryContext.Provider>
    </LanguageContext.Provider>
  )
}
