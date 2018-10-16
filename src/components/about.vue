<template>
  <div class="text-left p-5">
    <h1>About this Project</h1>
    <p>The MillionDollarDAPP is both, a demonstration of Blockchain powered web applications, and a great opportunity
      for you to place your advertisement or shout-out into an immutable distributed ledger! It's inspired by its
      predecessor <a href="http://www.milliondollarhomepage.com" target="_blank">The Million Dollar Homepage</a> by Alex
      Tew from 2005.<br />
      The function can be summarized as follows:</p>
    <ol>
      <li>One likes to place an ad at a specific place.</li>
      <li>One selects that area and gets prompted to buy the necessary amount of cryptographic tokens ("MDAPP").</li>
      <li>If one has installed the <a href="https://metamask.io" target="_blank">MetaMask</a> browser extension, the
      tokens can be bought with the cryptocurrency Ether.</li>
      <li>After a short period the tokens are credited and one can select the area again to claim the according pixels,
        which will lock the tokens.</li>
      <li>In the last step the content can be set or edited.</li>
      <li>If one gets tired of an ad, it can be released, which will in turn unlock the tokens.</li>
    </ol>
    <p><span class="font-weight-bold">What's so special about it?</span><br />
      While all traditional web applications are centralized regarding content storage, content- and platform-governance,
      this website is only <span class="font-weight-bold">a window to a completely decentralized application without
      any authority</span> about the contents and ownership of pixels. Once you own a MDAPP token you have the guaranteed
      possibility to place any ad you like. It's technical impossible that anyone in the world hinders you to do that!
      Every single interaction (buy token, claim pixels, edit content, release pixels) is stored on the Ethereum
      Blockchain for eternity (yes, really! As long as the Ethereum network is operating) and can be replayed. When time
      goes on, we'll see what ads were placed by whom in the past and we are getting something like a
      <span class="font-weight-bold">history book</span> automatically.<br />
      This works because all rules regarding this application are written in so called <span class="font-weight-bold">
      "Smart Contracts"</span> (see the links at the bottom right to read their code).
    </p>
    <div class="d-flex mt-5 mb-5 justify-content-around">
      <div v-b-tooltip.hover title="Ethereum"><a href="https://www.ethereum.org/" target="_blank"><img src="/static/technology-icons/ethereum.png" height="40px" alt="Ethereum" /></a></div>
      <div v-b-tooltip.hover title="IPFS (Interplanetary Filesystem)"><a href="https://ipfs.io" target="_blank"><img src="/static/technology-icons/ipfs.png" height="40px" alt="Interplanetary Filesystem" /></a></div>
      <div v-b-tooltip.hover title="Truffle Framework"><a href="https://truffleframework.com" target="_blank"><img src="/static/technology-icons/truffle.png" height="40px" alt="Truffle Framework" /></a></div>
      <div v-b-tooltip.hover title="Vue.js"><a href="https://vuejs.org" target="_blank"><img src="/static/technology-icons/vue.png" height="40px" alt="Vue.js" /></a></div>
      <div v-b-tooltip.hover title="MetaMask"><a href="https://metamask.io" target="_blank"><img src="/static/technology-icons/metamask.svg" height="40px" alt="MetaMask" /></a></div>
    </div>

    <h1>About the Author</h1>
    <p><img class="float-left pr-2 mt-1" src="/static/author.jpg" width="190px" height="190px" alt="Image of the author"/>
      <span class="font-weight-bold">Patrick Stürmlinger</span><br />
      During my studies of Computer Science at the Karlsruhe Institute of Technology (KIT), I worked as a self-employed
      web developer, have co-founded the online ticketing platform "Ticketmates" and worked at a web agency as fullstack
      developer.<br />
      In 2016 I quit my job to finally bring my studies to an end and to change my focus completely to Blockchain
      related topics. As a consequence, the title of my Bachelor thesis became “Combining Network and Blockchain
      Information for Deanonymization in Bitcoin”.<br />
      The MillionDollarDAPP is my lighthouse project to complement my theoretical knowledge with practical experience
      and to have a reference for my now starting job search.<br />
      <span class="font-weight-bold d-inline-block mt-2">How did I come up with Blockchains?</span><br />
      I came into crypto in early 2013 by mining some Peercoin out of curiosity. However, I was not yet convinced by
      crypto currencies because I had too little background knowledge yet and could not imagine that a currency, which
      is not backed by a country, could establish itself. My professional interest grew later as advanced application
      scenarios for Blockchains emerged and became possible with projects like Ethereum, NEM, Factom and others. Today
      I see guaranteed transparency, trust and auditability as the most important software characteristics which will
      help us to mitigate unfortunate accidents as well as human weaknesses like greed and corruptibility.</p>

      <p class="text-center"><a href="https://www.linkedin.com/in/patrick-st%C3%BCrmlinger-072328104/" target="_blank">
        <img src="/static/linkedin.png" height="20px" alt="Linkedin profile"/>
      </a></p>
  </div>
</template>

<script>

export default {
  name: 'About'
}
</script>

<style scoped>
</style>
