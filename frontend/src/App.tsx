import { NFTMinter } from './components/NFTMinter'
import { NFTViewer } from './components/NFTViewer'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">NFT Minter</h1>
        <NFTMinter />
        <h2 className="text-3xl font-bold text-center my-8">Your NFTs</h2>
        <NFTViewer />
      </div>
    </div>
  )
}

export default App
