import {useLanguage, useDictionary} from './context'

export function useTranslation() {
  const {language, setLanguage} = useLanguage()
  const {dictionary, setDictionary} = useDictionary()

  const t = (words) => {
    if (!language) {
      return words
    }
    if (!dictionary || !dictionary[language]) {
      return words
    }
    return dictionary[language][words] || words
  }
  const languages = () => Object.keys(dictionary || {})

  return {t, setLanguage, currentLang: language, languages, setDictionary}
}
