import Vue from 'vue'
import Router from 'vue-router'
import Mdapp from '@/components/mdapp'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'mdapp',
      component: Mdapp
    }
  ]
})
