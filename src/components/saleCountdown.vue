<template>
  <div class="sale-countdown p-3" v-if="countdown > 0">
    <span class="title">
      <template v-if="isActive">MDAPP Token {{title}} ends in</template>
      <template v-else-if="start > Date.now()">MDAPP Token {{title}} starts in</template>
    </span>

    <countdown :time="countdown" v-on:countdownend="handleCountdownEnd">
      <template slot-scope="props">
        <b-row class="justify-content-md-center countdown">
          <b-col md="auto">{{ props.days }}<span class="time-label">Days</span></b-col><b-col md="auto">:</b-col>
          <b-col md="auto">{{ props.hours }}<span class="time-label">Hours</span></b-col><b-col md="auto">:</b-col>
          <b-col md="auto">{{ props.minutes }}<span class="time-label">Minutes</span></b-col><b-col md="auto">:</b-col>
          <b-col md="auto">{{ props.seconds }}<span class="time-label">Seconds</span></b-col>
        </b-row>
      </template>
    </countdown>

    <div class="claiming mt-3" v-if="claimCountdown > 0">
      <countdown :time="countdown" v-on:countdownend="handleCountdownEnd">
        <template slot-scope="props">
          Pixel claiming starts in {{ props.days }}:{{ props.hours }}:{{ props.minutes }}:{{ props.seconds }}
        </template>
      </countdown>
    </div>
  </div>
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
    end: Number,
    claim: Number
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

    claimCountdown () {
      if (this.claim && this.claim - Date.now() > 0) {
        return this.claim - Date.now()
      }
      return 0
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

<style scoped lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";

  .sale-countdown {
    font-size: 2.2rem;
  }

  .countdown {
    font-size: 1.5rem;
  }
  .countdown > div {
    padding: 0 5px;
  }

  .claiming {
    font-size: 0.8rem;
  }

  .time-label {
    display: block;
    font-size: 1rem;
  }
</style>
