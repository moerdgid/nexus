import './App.css'
import LinkCategory from './components/LinkCategory.tsx'

function App() {

  const developmentLinks = [
    { title: 'Github', url: 'https://github.com/' },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com/' }
  ]

  const entertainmentLinks = [
    { title: 'Disney+', url: 'https://www.disneyplus.com' },
    { title: 'Youtube', url: 'https://www.youtube.com' }
  ]


  return (
    <>
      <header>
        <h1>Nexus</h1>
      </header>
      
      <main>
        <LinkCategory title="Development" links={developmentLinks}/>
        <LinkCategory title="Entertainment" links={entertainmentLinks}/>

      </main>
    </>
  )
}
export default App
