// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store/'
import { Alert, Badge, Button, Card, Collapse, FormInput, FormCheckbox, FormFile, FormRadio, FormTextarea, Layout, ListGroup, Modal, Nav, Navbar, Popover, Tabs, Tooltip, Jumbotron } from 'bootstrap-vue/es/components'
import { Tooltip as TooltipDirective, Modal as ModalDirective } from 'bootstrap-vue/es/directives'
import VueSweetalert2 from 'vue-sweetalert2'
import ToggleButton from 'vue-js-toggle-button'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import Raven from 'raven-js'
import RavenVue from 'raven-js/plugins/vue'

if (process.env.NODE_ENV !== 'development' && false) {
  Raven
    .config(process.env.SENTRY_ENDPOINT, {
      'release': process.env.VUE_APP_SENTRY_RELEASE
    })
    .addPlugin(RavenVue, Vue)
    .install()
}

Vue.use(Alert)
Vue.use(Badge)
Vue.use(Button)
Vue.use(Card)
Vue.use(Collapse)
Vue.use(FormInput)
Vue.use(FormCheckbox)
Vue.use(FormFile)
Vue.use(FormRadio)
Vue.use(FormTextarea)
Vue.use(Jumbotron)
Vue.use(Layout)
Vue.use(ListGroup)
Vue.use(Modal)
Vue.use(ModalDirective)
Vue.use(Nav)
Vue.use(Navbar)
Vue.use(Popover)
Vue.use(Tabs)
Vue.use(ToggleButton)
Vue.use(Tooltip)
Vue.use(TooltipDirective)

Vue.use(VueSweetalert2)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: {
    App
  },
  template: '<App/>'
})
