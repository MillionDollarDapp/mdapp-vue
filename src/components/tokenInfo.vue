<template>
  <div class="token-info p-3 text-left d-flex flex-column justify-content-center">
    <b-row>
      <b-col>Place ads, greets and shout-outs on a censorship-free, immutable and record keeping platform based on Ethereum Blockchain and IPFS.</b-col>
    </b-row>

    <b-row class="mt-2 no-padding">
      <b-col cols="4" class="label">Symbol:</b-col><b-col cols="auto">MDAPP</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Utility:</b-col><b-col cols="auto">Claim 10x10 pixel square</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Price:</b-col><b-col cols="auto">$100</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Max supply:</b-col><b-col cols="auto">10,000</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Hard cap:</b-col><b-col cols="auto">$1,000,000</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Sale end:</b-col><b-col cols="auto">When max supply is reached</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">Transfer enabled:</b-col><b-col cols="auto">When sale has ended</b-col>
      <div class="w-100"/>
      <b-col cols="4" class="label">When ready?</b-col><b-col class="font-weight-bold" cols="auto">It is - you're using it right now! Only time machine feature is missing, which is scheduled for Q4.</b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: 'tokenInfo'
}
</script>

<style scoped lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";

  .token-info {
    font-size: 0.75rem;
  }

  .no-padding div {
    padding-right: 0;
  }

  .label {
    font-weight: 700;
  }
</style>
