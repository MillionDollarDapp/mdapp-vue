<template>
  <b-row>
    <b-col class="p-0">
      <b-jumbotron header-tag="div" fluid container-fluid>
        <template slot="header">
          <b-row>
            <b-col v-if="isActive"><p>MDAPP Token {{title}} ends in</p></b-col>
            <b-col v-else-if="start > Date.now()"><p>MDAPP Token {{title}} starts in</p></b-col>
          </b-row>
          <countdown v-if="countdown > 0" v-bind:time="countdown" v-on:countdownend="handleCountdownEnd">
            <template slot-scope="props">
            <b-row class="justify-content-md-center">
              <b-col md="auto">{{ props.days }}<span class="time-label">Days</span></b-col><b-col md="auto">:</b-col>
              <b-col md="auto">{{ props.hours }}<span class="time-label">Hours</span></b-col><b-col md="auto">:</b-col>
              <b-col md="auto">{{ props.minutes }}<span class="time-label">Minutes</span></b-col><b-col md="auto">:</b-col>
              <b-col md="auto">{{ props.seconds }}<span class="time-label">Seconds</span></b-col>
            </b-row>
            </template>
          </countdown>
          <p v-if="countdown == 0">{{title}} is running and never stops!</p>
        </template>
        <!-- <template slot="lead">
          Be the first to become part of the blockchain history
        </template> -->
      </b-jumbotron>
    </b-col>
  </b-row>
</template>

<script>
import VueCountdown from '@xkeshi/vue-countdown'

export default {
  name: 'saleCountdown',
  components: {
    'countdown': VueCountdown
  },

  props: {
    title: String,
    start: Number,
    end: Number
  },

  data () {
    return {
      toggle: true
    }
  },

  computed: {
    countdown () {
      // eslint-disable-next-line
      this.toggle
      if (this.start - Date.now() < 0) {
        // Sale already started
        // Show countdown only if we have an end date
        if (this.end > 0) {
          return this.end - Date.now()
        }
        return 0
      }
      return this.start - Date.now()
    },

    isActive () {
      // eslint-disable-next-line
      this.toggle
      if (this.start - Date.now() > 0) {
        // Starts in future
        return false
      }

      if (Date.now() - this.end > 0) {
        // Already ended
        return false
      }

      return true
    }
  },

  methods: {
    handleCountdownEnd () {
      if (this.end !== 0 && this.end <= Date.now()) {
        // Presale period ended
        this.$emit('is-finished')
      } else if (this.end > Date.now() || this.end === 0) {
        // Presale or sale started
        this.$emit('has-started')
        this.toggle = !this.toggle
      }
    }
  }
}
</script>

<style scoped>
  .time-label {
    display: block;
    font-size: 1rem;
  }
</style>
