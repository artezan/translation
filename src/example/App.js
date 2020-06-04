import React from 'react'
import es from '../data/es.json'
import en from '../data/en.json'
import {TranslationProvider, useTranslation, Trans} from '../translation'



/**
 * Simple example of t()
 */
const Title = () => {
  const {t} = useTranslation()
  return <h1>{t('Example')}</h1>
}

/**
 * Example with render elements
 */
const Memberships = () => {
  const {t} = useTranslation()
  const tiers = [
    {
      name: 'Plus',
      price: 45,
      features: [
        '2% shopping reward',
        'Events and exclusive prices',
        'Discounts in establishments outside the club'
      ]
    },
    {
      name: 'Club',
      price: 30,
      features: [
        'Access to special price coupon book',
        "Exclusive savings with Sam's Club Travel",
        '100% satisfaction guarantee'
      ]
    }
  ]
  return (
    <>
      <h3>{t('Memberships')}:</h3>
      <ul>
        {tiers.map((tier) => (
          <li key={tier.name}>
            <div>
              {t('Tier')}: {t(tier.name)}
            </div>
            <div>
              {t('Price')}: {t(tier.price)}
            </div>

            <div>{t('Features')}:</div>
            <ul>
              {tier.features.map((feature) => (
                <li key={feature}>{t(feature)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Change Lang
 */
const TranslationToogle = () => {
  const {setLanguage, currentLang, t} = useTranslation()
  const changeLang = () => setLanguage(currentLang === 'en' ? 'es' : 'en')

  return (
    <button onClick={changeLang}>{`${t('Language')}: ${
      currentLang === 'en' ? 'English' : 'Español'
    }`}</button>
  )
}

/**
 * (OPTIONAL)
 * Example with Trans component
 */
const Alert = () => {
  const person = {name: 'Henry', count: 21}
  const {name, count} = person
  return (
    <Trans translateKey="userMessagesUnread">
      Hello <strong>{{name}}</strong>, you have {{count}} unread message.
      <Link to="/msgs">Go to messages.</Link>Test
    </Trans>
  )
}

const Link = ({children}) => (
  <p>
    <a href="#">{children}</a>
  </p>
)

function App() {
  return (
    <TranslationProvider
      resources={{
        en,
        es
      }}
      initialLanguage="en">
      <div>
        <Title />
      </div>
      <div>
        <Memberships />
      </div>
      <Alert />
      <p>
        <TranslationToogle />
      </p>
    </TranslationProvider>
  )
}

export default App
