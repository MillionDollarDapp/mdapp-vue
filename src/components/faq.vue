<template>
  <div>
    <div role="tablist" class="w-75 m-auto">
      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer1 variant="warning">What is this site about?</b-btn>
        </b-card-header>
        <b-collapse id="answer1" visible accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              The MillionDollarDAPP allows anyone to place ads, greetings and other shout-outs within a grid
              of 1,000,000 pixels. Such ads consist of an image and optionally extra information like a description,
              external link and contact information.<br />
              Each pixel costs $1 and hence the name, MillionDollarDAPP.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer2 variant="warning">What is a "DAPP"?</b-btn>
        </b-card-header>
        <b-collapse id="answer2" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              "DAPP" is an abbreviation for "Decentralized Application". Decentralization can be achieved on different
              layers of an application. It is project-specific which aspects need to be decentralized. In this case,
              the DAPP is decentralized regarding data storage (1) and content governance (2).<br />
              (1) All images are stored within the <a href="https://ipfs.io/" target="_blank">IPFS</a> network, which
              allows data to be distributed across a network of independent servers. Additionally, it prevents the
              replacement of contents by identifying content via its fingerprint intstead by a filename. (2) All rules
              of this application, regarding ownership of pixels, contents of ads, their dimensions and position, the
              price per pixel, time intervals when can be done what, are ensured by so called "Smart Contracts" running
              on the <a href="https://www.ethereum.org/" target="_blank">Ethereum blockchain</a>. These Smart Contracts
              are little programs, which are executed on each Ethereum node simultaneously. The consensus algorithm of
              the network ensures the correct state of these programs.<br />
              In contrast to most existing applications today, this means that <span class="font-weight-bold">
              nobody can censor or modify any contents, purchases or other state changing interactions</span>. Only the
              owner of a pixel is able to change its content. Please check out the White Paper for more details.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer3 variant="warning">This site reminds me of something I already saw in 2005...</b-btn>
        </b-card-header>
        <b-collapse id="answer3" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Good catch! The MillionDollarDAPP is a homage to the <a href="http://www.milliondollarhomepage.com" target="_blank">
              Million Dollar Homepage</a> by Alex Tew. I was looking for something with a high degree of recognition,
              but is also relatively simple, and could benefit from being rewritten on the basis of blockchain technology.
              This project should help me to consolidate my knowledge about Ethereum and blockchains in general. Also, I
              wanted to develop an application with an easy to understand functional advantage if compared to its predecessor.<br />
              The Million Dollar Homepage, a peace of Internet history, is the perfect candidate to be reborn in a new
              Internet age, equipped with new possibilities that make it a canvas of free speech, immutable, uncensored,
              held by its participants and preserved for eternity.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer4 variant="warning">If data is stored decentralized on different servers, can't they modify it?</b-btn>
        </b-card-header>
        <b-collapse id="answer4" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              No! If one modifies data, it must be distributed to the network. In IPFS modified data just becomes OTHER
              data because it's identified by its content. In Ethereum the modified data (transactions/blocks) would be
              rejected by other network peers because the modified data no longer met the requirements of the consensus
              algorithm. Only a party with 51+% of the networks computational power would be able to execute such an attack.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer5 variant="warning">What would happen if the domain milliondollardapp.com were shut down?</b-btn>
        </b-card-header>
        <b-collapse id="answer5" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              The whole application logic would still continue to run, because it's completely based on Ethereum smart
              contracts. They're still available on the Ethereum blockchain and hence, being distributed all over the
              world. People are able to provide the MillionDollarDAPP frontend under their own domain and/or to develop
              complete custom frontends. This said, only the "View"-layer is vulnerable to censorship, while it can
              quickly recover with the power of the people. We may provide the whole frontend via IPFS in the future as
              well. This would significantly raise the bar for frontend censorship.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer6 variant="warning">How long will the data be stored?</b-btn>
        </b-card-header>
        <b-collapse id="answer6" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Ethereum data will be available as long as at least one node is serving it. Ethereum's blockchain can only
              be served as a whole. Once your content is in, you can consider it being preserved for eternity. In contrast,
              IPFS treats each record individually. If no node is considering a record important enough to host it, the
              data will be lost. However, if anyone uploads backuped data, the contents can also be restored later.<br />
              We will publish information about how to to mirror the image data of the MillionDollarDAPP in IPFS soon.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer7 variant="warning">What does it need to interact with pixels?</b-btn>
        </b-card-header>
        <b-collapse id="answer7" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Interaction requires an Ethereum account with proper funding of Ether depending on your actions. While
              the entry costs are at $1 per pixel, you'll additionally need a couple of cents per action to pay the
              Ethereum network as a compensation for the used computational resources.<br />
              The easiest (and proven) way is to use either Chrome or Firefox as browser and the
              <a href="https://metamask.io" target="_blank">MetaMask</a> browser extension. The latter recognizes
              Decentralized Applications and lets you interact with their smart contracts without knowing any technical
              details. This is definitely the most user friendly way. Another, but untested, way is to use the
              <a href="https://github.com/ethereum/mist" target="_blank">Mist</a> browser, which is specifically designed
              for DAPPs.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer8 variant="warning">Why do I need MDAPP in order to claim pixels?</b-btn>
        </b-card-header>
        <b-collapse id="answer8" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              The MDAPP token serves as a layer between the currency "Ether" and the application usage. In order to claim
              pixels, you need 1 MDAPP per 10x10 pixel square. It guarantees a place on the pixel grid and can
              potentially be traded at each ERC-20 supporting platform. The advantage of such an application specific
              token is a higher public recognition rate and stronger identification with the MillionDollarDAPP.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer9 variant="warning">Tell me more about the MDAPP token!</b-btn>
        </b-card-header>
        <b-collapse id="answer9" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Each MDAPP represents a square of 10x10 pixels. This is the smallest purchase- and editable area. As there
              are 1,000,000 pixel in total, there will be no more than 10,000 MDAPP. The appropriate amount of MDAPP are
              being locked when pixels are claimed. They're unlocked again when a user decides to release the pixels.
              The token metrics are:</p>
              <ul class="text-left">
                <li>Symbol: MDAPP</li>
                <li>Decimals: 0</li>
                <li>Max. supply: 10,000 MDAPP</li>
                <li>Price per Token: $100</li>
                <li>Transferability: after full distribution</li>
                <li>Hard Cap: $1,000,000</li>
              </ul>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer10 variant="warning">Where do I get Ether?</b-btn>
        </b-card-header>
        <b-collapse id="answer10" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              You can buy Ether for fiat money (USD, EUR etc) on various exchanges. They all work pretty much the same
              way: Register an account; Validate your identity; Transfer money; Buy Ether. To name just the most popular
              ones:</p>
            <ul class="text-left">
              <li><a href="https://www.bitcoin.de" target="_blank">Bitcoin.de</a> (EUR)</li>
              <li><a href="https://www.bitfinex.com" target="_blank">Bitfinex.com</a>  (EUR, GBP, JPY, USD)</li>
              <li><a href="https://www.bithumb.com" target="_blank">Bithumb.com</a> (KRW)</li>
              <li><a href="https://www.bitstamp.net" target="_blank">Bitstamp.net</a> (EUR, USD)</li>
              <li><a href="https://www.coinbase.com" target="_blank">Coinbase.com</a> (EUR, GBP, USD)</li>
              <li><a href="https://www.kraken.com" target="_blank">Kraken.com</a> (CAD, EUR, USD)</li>
              <li><a href="https://www.liquid.com" target="_blank">Liquid.com</a> (JPY, USD)</li>
              <li><a href="https://www.oex.com" target="_blank">Oex.com</a> (CNY)</li>
            </ul>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer11 variant="warning">Can the pixels be sold again?</b-btn>
        </b-card-header>
        <b-collapse id="answer11" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Pixels can't be sold. However, you can release your pixels respectively deleting their contents and giving
              up the right to control them. In return, the corresponding amount of MDAPP is unlocked. If the token sale
              is over, you can transfer these MDAPP either for free or money.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer12 variant="warning">Will my content be lost in that case?</b-btn>
        </b-card-header>
        <b-collapse id="answer12" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              The pixels content won't be visible at the latest state of the application anymore. Though, the content is
              still in the blockchain and IPFS. We're going to implement a time-machine feature in Q4 to allow browsing
              those past application states.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer13 variant="warning">Can I earn money with this DAPP?</b-btn>
        </b-card-header>
        <b-collapse id="answer13" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              Yes! During the token sale you're able to share your referral code to recruit new purchasers of MDAPP.
              You'll get 10% of each purchase via your referral link automatically. The Ether is credited to your
              account within the Sale smart contract and can be withdrawn with your account unlocked in MetaMask
              on this website.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.answer14 variant="warning">Does this DAPP also work on mobiles?</b-btn>
        </b-card-header>
        <b-collapse id="answer14" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <p class="card-text">
              It may not be fully functional on mobiles, but it's still viewable. For one thing, there's no technical solution
              available, which would allow interactions with DAPPs on mobiles, yet. For another thing, the nature of this
              application is to provide a fixed dimension grid, hence, a responsive layout isn't possible. We're doing
              our best to make viewing the pixel contents as pleasant as possible to our mobile users.
            </p>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
  </div>
</template>

<script>

export default {
  name: 'FAQ'
}
</script>

<style scoped>
  .card-text {
    text-align: left;
  }
</style>
