import Vue from 'vue'
import Router from 'vue-router'
import Mdapp from '@/components/mdapp'
import FAQ from '@/components/faq'
import Legal from '@/components/legal'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'mdapp',
      components: {
        content: Mdapp
      },
      meta: {
        showHelper: true
      }
    },
    {
      path: '/faq',
      name: 'faq',
      components: {
        content: Mdapp,
        overlay: FAQ
      },
      meta: {
        showHelper: false
      }
    },
    {
      path: '/legal',
      name: 'legal',
      components: {
        content: Mdapp,
        overlay: Legal
      },
      meta: {
        showHelper: false
      }
    }
  ]
})
