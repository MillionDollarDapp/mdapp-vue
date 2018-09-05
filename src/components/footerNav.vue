<template>
  <footer class="footer bg-dark text-white text-left">
    <div class="container d-flex justify-content-between m-0  pt-4 pb-4 h-100">
      <div class="follow flex-grow-1 d-flex align-items-center">
        <a href="https://github.com/MillionDollarDapp" target="_blank" v-b-tooltip.hover title="Github">
          <img src="@/assets/GitHub-Mark-Light-32px.png" width="32px" height="32px">
        </a>

        <a href="https://twitter.com/MillionUSD_DAPP" target="_blank" v-b-tooltip.hover title="Twitter">
          <img src="@/assets/Twitter_Social_Icon_Circle_White.png" width="32px" height="32px">
        </a>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'footerNav'
}
</script>

<style scoped>
.footer {
  margin-top: 5px;
}
.follow {
  height: 100%;
}
.follow a {
  margin-right: 20px;
}
</style>
