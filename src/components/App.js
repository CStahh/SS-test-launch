import { useState, useEffect } from 'react'
import { useInsertionEffect } from 'react'
import { Row, Col, Spinner } from 'react-bootstrap'
import Countdown from 'react-countdown'
import Web3 from 'web3'

// Import Images + CSS
import twitter from '../images/socials/twitter.svg'
//import instagram from '../images/socials/instagram.svg'
import website from '../images/socials/website.icon.png'
import opensea from '../images/socials/opensea.svg'
import showcase from '../images/showcase.png'
import nftex from '../images/nftex.png'
import '../App.css'

// Import Components
import Navbar from './Navbar'

// Import ABI + Config
import SmartShades from '../abis/SmartShades.json'
import config from '../config.json'

// Add this import line at the top
import { CrossmintPayButton } from "@crossmint/client-sdk-react-ui";

function App() {
	const [web3, setWeb3] = useState(null)
	const [smartShades, setSmartShades] = useState(null)

	const [supplyAvailable, setSupplyAvailable] = useState(0)

	const [account, setAccount] = useState(null)
	const [networkId, setNetworkId] = useState(null)
	const [ownerOf, setOwnerOf] = useState([])

	const [explorerURL, setExplorerURL] = useState('https://etherscan.io')
	const [openseaURL, setOpenseaURL] = useState('https://opensea.io')

	const [isMinting, setIsMinting] = useState(false)
	const [isError, setIsError] = useState(false)
	const [message, setMessage] = useState(null)

	const [currentTime, setCurrentTime] = useState(new Date().getTime())
	const [revealTime, setRevealTime] = useState(0)

	const [counter, setCounter] = useState(7)
	const [isCycling, setIsCycling] = useState(false)

	const loadBlockchainData = async (_web3, _account, _networkId) => {
		// Fetch Contract, Data, etc.
		try {
			const smartShades = new _web3.eth.Contract(SmartShades.abi, SmartShades.networks[_networkId].address)
			setSmartShades(smartShades)

			const maxSupply = await smartShades.methods.maxSupply().call()
			const totalSupply = await smartShades.methods.totalSupply().call()
			setSupplyAvailable(maxSupply - totalSupply)

			const allowMintingAfter = await smartShades.methods.allowMintingAfter().call()
			const timeDeployed = await smartShades.methods.timeDeployed().call()
			setRevealTime((Number(timeDeployed) + Number(allowMintingAfter)).toString() + '000')

			if (_account) {
				const ownerOf = await smartShades.methods.walletOfOwner(_account).call()
				setOwnerOf(ownerOf)
				console.log(ownerOf)
			} else {
				setOwnerOf([])
			}

		} catch (error) {
			setIsError(true)
			setMessage("Contract not deployed to current network, please change network in MetaMask")
		}
	}

	const loadWeb3 = async () => {
		if (typeof window.ethereum !== 'undefined') {
			const web3 = new Web3(window.ethereum)
			setWeb3(web3)

			const accounts = await web3.eth.getAccounts()
			console.log(accounts)

			if (accounts.length > 0) {
				setAccount(accounts[0])
			} else {
				setMessage('Please connect with MetaMask')
			}

			const networkId = await web3.eth.net.getId()
			setNetworkId(networkId)

			if (networkId !== 5777) {
				setExplorerURL(config.NETWORKS[networkId].explorerURL)
				setOpenseaURL(config.NETWORKS[networkId].openseaURL)
			}

			await loadBlockchainData(web3, accounts[0], networkId)

			window.ethereum.on('accountsChanged', function (accounts) {
				setAccount(accounts[0])
				setMessage(null)
			})

			window.ethereum.on('chainChanged', (chainId) => {
				// Handle the new chain.
				// Correctly handling chain changes can be complicated.
				// We recommend reloading the page unless you have good reason not to.
				window.location.reload();
			})
		}
	}

	// MetaMask Login/Connect
	const web3Handler = async () => {
		if (web3) {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			setAccount(accounts[0])
		}
	}

	const mintNFTHandler = async () => {
		if (revealTime > new Date().getTime()) {
			window.alert('Minting is not live yet!')
			return
		}

		if (ownerOf.length > 0) {
			window.alert('You\'ve already minted!')
			return
		}

		// Mint NFT
		if (smartShades && account) {
			setIsMinting(true)
			setIsError(false)

			await smartShades.methods.mint(1).send({ from: account, value: 100000000000000000 })
				.on('confirmation', async () => {
					const maxSupply = await smartShades.methods.maxSupply().call()
					const totalSupply = await smartShades.methods.totalSupply().call()
					setSupplyAvailable(maxSupply - totalSupply)

					const ownerOf = await smartShades.methods.walletOfOwner(account).call()
					setOwnerOf(ownerOf)
				})
				.on('error', (error) => {
					window.alert(error)
					setIsError(true)
				})
		}

		setIsMinting(false)
	}

	const cycleImages = async () => {
		const getRandomNumber = () => {
			const counter = (Math.floor(Math.random() * 1000)) + 1
			setCounter(counter)
		}

		if (!isCycling) { setInterval(getRandomNumber, 3000) }
		setIsCycling(true)
	}

	useEffect(() => {
		loadWeb3()
		cycleImages()
	}, [account]);

	return (
		<div>
			<Navbar web3Handler={web3Handler} account={account} explorerURL={explorerURL} />
			<main>
				<section id='welcome' className='welcome'>

					<Row className='header my-0 p-2 mb-0 pb-0'>
						<h1>SMART SHADES</h1>
						<p className='sub-header'>The NFTs that can help you get smarter!</p>
					</Row>

					<Row className='flex m-1'>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img
								src={showcase}
								alt="Get Smarter"
								className='showcase'
							/>
						</Col>
						<Col md={6} lg={6} xl={6} xxl={6} className='text-center'>
							{revealTime !== 0 && <Countdown date={currentTime + (revealTime - currentTime)} className='countdown mx-3' />}
							<p className='text'>
								Introducing Smart Shades NFTs, the NFTs that can actually help you get smarter!... Ok, it doesn't automatically increase your intelligence, but if you buy one, you’ll get FREE access to our Smart Shades brain training: The simplest, most scientific and... coolest way to help you get smarter!
							</p>
							<a href="#about" className='clearbox mx-3'>Learn More!</a>
						</Col>
					</Row>
				</section>

				<section id='about' className='about'>
					<Row className='flex m-3 divborder' style={{ paddingBottom: '6vh' }}>
						<h2 className='text-center p-3'>About the Collection</h2>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img src={nftex} alt="Multiple Smart" className='showcase' />
						</Col>
						<Col md={6} lg={6} xl={6} xxl={6} className='text-center'>
							{isError ? (
								<p>{message}</p>
							) : (
						<div>
							<h3 className='h3' p-2>Mint a Smart Shades NFT because...</h3>
									<ul className="li">
										<li>Purchasing one gives you FREE access to our unique, scientific brain training guide and software package</li>
										<li>As an NFT holder you'll also get exclusive and FREE access to software upgrades and new brain training products when they're released</li>
										<li>It's Easy! You can mint the "traditional" way by connecting your crypto wallet, or you can buy one by simply using your credit card</li>
										<li>It's the best value of any NFT you'll find! Boost your brain with our SMART SHADES brain training and you're surely GM!</li>
									</ul>

									{isMinting ? (
										<Spinner animation="border" className='p-3 m-2' />
									) : (
							<div>
							   <button onClick={mintNFTHandler} className='button mint-button mt-3'>Mint</button>

							   <CrossmintPayButton
								   collectionTitle="Smart Shades"
								   collectionDescription="Join the SMART SHADES club and get access to a free brain training package. Getting smarter is how you're defnintely GMI so mint one asap!"
								   collectionPhoto="https://gateway.pinata.cloud/ipfs/QmRBegYeJBgnw2ixpzcTi6uXpQ5y8SBfEhAiML3sQctS8N/224.png"
								   environment="staging"
								   clientId="f7eae5a6-d2cb-4e3c-b5e6-033f71e1782a"
								   className='my-custom-crossmint-button'
								   mintConfig={{
									   price: "24.0",
									   //onClick={mintNFTHandler}
									   _mintAmount: "1"
							       }}
							  	/>
							</div>
									)}

									{ownerOf.length > 0 &&
										<p><small>
											<a
												href={`${openseaURL}/assets/${smartShades._address}/${ownerOf[0]}`}
												target='_blank'
												style={{ display: 'inline-block', marginLeft: '3px' }}>
												Claim your FREE SMART SHADES Brain Training package
											</a>
										</small></p>}
							</div>
								)}
						</Col>
					</Row>

					<Row className='flex m-3 my-3 p-8 mb-0 pb-0'>
					<Col md={11} lg={11} xl={11} xxl={11} className='text-center' style={{ paddingTop: '8vh' }}>
							<p className='text'>
								So you bought a Smart Shades NFT? Wow, you sound smart! Now you can claim your Smart Shades brain training package for FREE and start getting even smarter! Click the button below and enter in the password shown on the bottom of your NFT to download the simplest, most scientific and... coolest way to help you get smarter!
							</p>
							<a href="https://www.neurokeep.com/smart-shades-for-nft-holders" className='clearbox2 mx-3'>Get Your Smart Shades Brain Training for FREE!</a>
					</Col>
					</Row>

					<Row className='flex m-3 my-3 p-8 mb-0 pb-0'>
					<Col md={11} lg={11} xl={11} xxl={11} className='text-center' style={{ paddingTop: '8vh' }}>
							<h3 className='h3' p-2>As a Smart Shades NFT holder, you're entitled to some great perks such as...</h3>
									<ul className="li">
										<li>*Free access to any Smart Shades software upgrades</li>
										<li>*Free access to any new Smart Shades games we add to our package</li>
										<li>*Free access to any tests (find out how "smart" you really are!) we add to our Smart Shades package</li>
										<li>*Free downloads of any new versions of our guide</li>
										<li>**A free consultation session with an accredited and knowledgeable coach to help you improve your smarts</li>
									</ul>
							<p className='text3'>
								* Planned for late 2022 or early 2023 release
							</p>

							<p className='text3'>	
								** Not currently planned but is a possibility - Smart Shades holders would get access
							</p>
					</Col>
					</Row>

					<Row className='flex m-3 my-3 p-8 mb-0 pb-0'>
					<Col md={11} lg={11} xl={11} xxl={11} className='text-center' style={{ paddingTop: '9vh' }}>
							<p className='text2'>
								For more details about our Smart Shades brain training click below
							</p>
							<a href="https://www.neurokeep.com/smart-shades-brain-training" className='clearbox2 mx-3'>Learn More About Smart Shades!</a>
					</Col>
					</Row>
					

					<Row className='header m-3 my-3 p-3 mb-0 pb-0'>
						<Col xs={12} md={12} lg={12} xxl={12} className='social' style={{ paddingTop: '8vh'}}>
							<h className='h3'>Links</h>
						</Col>
						<Col className='flex social'>
							<a
								href="https://twitter.com/NeuroKeep1"
								target='_blank'
								className='circle flex button'>
								<img src={twitter} alt="Twitter" />
							</a>
							<a
								href="https://www.neurokeep.com/"
								target='_blank'
								className='circle flex button'>
								<img src={website} alt="Website" />
							</a>
						</Col>
					</Row>

					

				</section>
			</main>
			<footer>

			</footer>
		</div>
	)
}

export default App
