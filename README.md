# Express Translation

## Setup in only 3 steps

### 1.- Create translation file

Create JSON with the words to translate, no matter the ubication

```
es.json
en.json
```

### 2.- Import in the App.js the provider and the json

The in the provider, fill the `resources` prop with the json files and set the `initialLanguage` with the key of the resourse that you want to init

```javascript
import es from '../data/es.json'
import en from '../data/en.json'
import {TranslationProvider, useTranslation} from '../translation'

function App() {
  return (
    <TranslationProvider
      resources={{
        en,
        es
      }}
      initialLanguage="en">
      ...
    </TranslationProvider>
  )
```

### 3.- Use the `t()` function to traslate

```javascript
const Title = () => {
  const {t} = useTranslation()
  return <h1>{t('Example')}</h1>
}
```

and in the json files:

es.json

```json
 "Example": "Ejemplo"
```

en.json (optional)

```json
 "Example": "Example"
```

## Optional

### Change the lang and get the current lang

In whatever component import the hook `useTranslation()`

```javascript
const TranslationToogle = () => {
  const {setLanguage, currentLang, t} = useTranslation()
  const changeLang = () => setLanguage(currentLang === 'en' ? 'es' : 'en')

  return (
    <button onClick={changeLang}>{`${t('Language')}: ${
      currentLang === 'en' ? 'English' : 'Español'
    }`}</button>
  )
}
```

### useTranslation()

```
t: function tha Translate the words

languages: return an Array of strings with the possible languajes ['es', 'en', 'fr' ...]

setLanguage: change the language ie (setLanguage('fr'))

currentLang: return a string with the current lang

```

### Trans component

While the Trans components gives you a lot of power by letting you interpolate or translate complexer react elements.

The truth is - In most cases you won't need it. As long you have no react nodes you like to be integrated into a translated text (text formatting, like `strong`, `i`, ...) or adding some link component - you won't need it.

All can be done by using the `t` function

### Sample

```javascript
const person = {name: 'Henry', count: 21}
const {name, count} = person
return (
  <Trans translateKey="userMessagesUnread">
    Hello <strong>{{name}}</strong>, you have {{count}} unread message.
    <Link to="/msgs">Go to messages.</Link>.
  </Trans>
)
```

es.json

```json
"userMessagesUnread": "Hello <1>{{name}}</1>, you have {{count}} unread messages. <5>Go to messages</5>."
```

Based on node tree:

```
Trans.children = [
  'Hello ',                           // index 0: only a string
  { children: [{ name: 'Jan'  }] },   // index 1: element strong -> child object for interpolation
  ', you have',                       // index 2: only a string
  { count: 10 },                      // index 3: just object for interpolation
  ' unread messages. ',               // index 4
  { children: [ 'Go to messages' ] }, // index 5: element link -> child just a string
  '.'
]
```
