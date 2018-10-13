<template>
  <div id="particles"/>
</template>

<script>
import particleConfig from '@/assets/particlesjs-config.json'

export default {
  name: 'particlesJs',

  mounted () {
    require('particles.js')
    this.$nextTick(() => {
      this.initParticlesJS()
    })
  },

  methods: {
    initParticlesJS () {
      /* eslint-disable */
      particlesJS('particles', particleConfig)
    },
  }
}
</script>

<style scoped lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";
  #particles {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: lightslategrey;
    z-index: -1;
  }
</style>
