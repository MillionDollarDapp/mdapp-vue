<template>
  <div id="canvasWrapper" v-on-clickaway="clickedOutside">
    <canvas id="canvas" width="1251px" height="802px"></canvas>
    <canvas id="canvasGrid" width="1251px" height="802px"></canvas>

    <canvas-popover ref="canvasPopover" targetEl="dummy-area" :show="popoverVisible" :buyPossible="buyPossible"
                    :selectedArea="selectedArea" :dummy="dummy" :collides="areaCollides"
                    v-on:buyBtnPressed="buyBtnPressed" v-on:hide="hidePopover" v-on:popover-created="popoverCreated"
                    v-on:finished="hidePopover" v-on:showTxLog="$emit('showTxLog')"/>

    <modal-buy id="modalBuyPixels" :selectedTokenQty="missingTokens" :buyPossible="buyPossible" v-on:showTxLog="$emit('showTxLog')"/>
    <modal-ad :ad="selectedAd" v-on:showTxLog="$emit('showTxLog')" lazy/>

    <div id="tooltipAdContent" style="display: none;">
      Loading data...
    </div>
  </div>
</template>

<script>
import Raven from 'raven-js'
import Vue from 'vue'
import { mixin as clickaway } from 'vue-clickaway'
import utils from '../util/utils'
import mdappContract from '../util/interactions/mdappContract'
import { newTransaction } from '../util/transaction'

import ModalAd from '@/components/modalAd'
import ModalBuy from '@/components/modalBuy'
import CanvasPopover from '@/components/canvasPopover'

import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/themes/light.css'
import { fabric } from 'fabric'

var canvas = null
var canvasGrid = null

export default {
  name: 'pixels',
  components: {
    ModalAd,
    ModalBuy,
    CanvasPopover
  },
  mixins: [ clickaway ],

  props: {
    buyPossible: Boolean,
    highlightClaimed: Boolean
  },
  data () {
    let self = this
    return {
      // Dummy <div> used behind canvas to attach the bootstrap popover :)
      dummy: {
        't': 0,
        'l': 0,
        'w': 10,
        'h': 10
      },

      dateFormatter: new Intl.DateTimeFormat(utils.getUserLocale(), {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false}),

      wrapperEl: null,
      initialTooltipContent: null,

      popoverVisible: false,
      popover: null,

      gridW: 1250,
      gridH: 800,
      grid: 10,

      allCanvasAds: new Map(),
      myCanvasAds: new Map(),
      areaCollides: false,
      selectedAd: null,

      selectedArea: {
        topLeft: [-1, -1],
        bottomRight: [-1, -1],
        reset: function () {
          this.setTopLeft(-1, -1)
          this.setBottomRight(-1, -1)
        },
        contains: function (x, y) {
          if (this.topLeft[0] < 0) return false

          // Include 10px tolerance.
          let t = 10

          if ((this.topLeft[0] - t) <= x && x <= (this.bottomRight[0] + t) &&
            (this.topLeft[1] - t) <= y && y <= (this.bottomRight[1] + t)) {
            return true
          }
          return false
        },
        getWidth: function () {
          return this.bottomRight[0] - this.topLeft[0]
        },
        getHeight: function () {
          return this.bottomRight[1] - this.topLeft[1]
        },
        getPixels: function () {
          return this.getWidth() * this.getHeight()
        },
        getTokenQty: function () {
          return this.getPixels() / 100
        },
        setTopLeft (x, y) {
          self.$set(this.topLeft, 0, x)
          self.$set(this.topLeft, 1, y)
        },
        setBottomRight (x, y) {
          self.$set(this.bottomRight, 0, x)
          self.$set(this.bottomRight, 1, y)
        }
      }
    }
  },

  computed: {
    missingTokens () {
      return this.selectedArea.getTokenQty() - this.$store.getters.unlockedTokens
    },

    myAds () {
      if (this.$store.state.trigger.myAds) {
        // Only triggered once after user init / and on user change
        return this.$store.state.myAds
      }
    },

    allAds () {
      if (this.$store.state.trigger.allAds) {
        return this.$store.state.allAds
      }
    },

    adsQueueIsWaiting () {
      return this.$store.state.adsQueueIsWaiting
    },

    coinbase () {
      return this.$store.state.web3.coinbase
    },

    blockTimes () {
      return this.$store.state.web3.blockTimes
    },

    forceNSFWAds () {
      if (this.$store.state.trigger.forceNSFW) {
        return this.$store.state.forceNSFW
      }
    }
  },

  watch: {
    myAds (newVal, oldVal) {
      // Copy ads so that we can add properties without pain.
      this.myCanvasAds = utils.clone(newVal)

      // Compare old and new ads. Remove missing ones ad element.
      oldVal.forEach(ad => {
        if (!newVal.has(ad.id)) {
          this.removeAd(ad)
        }
      })

      Vue.nextTick(() => {
        // TODO: get return value to see if anything changed
        this.drawMyAds()

        // Update all ads in store to have the element-property
        this.myCanvasAds.forEach(ad => {
          this.$store.dispatch('setAd', {ad: ad, target: 'user'})
        })
      })
    },

    allAds (newVal, oldVal) {
      // Copy ads so that we can add properties without pain.
      this.allCanvasAds = utils.clone(newVal)

      Vue.nextTick(() => {
        this.drawAllAds()
      })
    },

    adsQueueIsWaiting (newVal) {
      if (newVal) {
        // Queue was empty and now has new ads waiting for being processed.
        // It's getting filled by watching filters.
        this.processAdFilterQueue()
      }
    },

    forceNSFWAds (newVal) {
      newVal.forEach(adId => {
        // At init there might be a race condition, that allCanvasAds might be not set yet.
        let ad = this.allCanvasAds.get(adId)
        if (!ad) {
          // Try to find it in myCanvasAds
          ad = this.myCanvasAds.get(adId)
        }

        if (ad && !ad.isCurrentUser) {
          this.drawAd(ad)
          this.$store.dispatch('setAd', {ad: ad, target: ad.isCurrentUser ? 'user' : 'all'})
        }
      })
    },

    highlightClaimed () {
      this.blinkClaimed()
    }
  },

  mounted () {
    this.wrapperEl = document.getElementById('canvasWrapper')
    this.initialTooltipContent = document.getElementById('tooltipAdContent').textContent

    // Listen for clicks on ads
    this.wrapperEl.addEventListener('click', event => {
      if (event.target.tagName !== 'CANVAS') {
        this.checkClick(event.target)
      }
      return false
    })

    this.initCanvas()
  },

  methods: {
    initCanvas () {
      /*
       * We create 2 layers:
       *
       * ^
       * | _ __ _ ___  _ Single absolute positioned <div> and <img> elements representing ads
       * | _____________ Canvas used to select areas
       * | _____________ Canvas for grid
       */

      let self = this
      canvas = new fabric.Canvas('canvas', {containerClass: 'canvas-container top', selection: false, uniScaleTransform: true})
      canvasGrid = new fabric.Canvas('canvasGrid', {containerClass: 'canvas-container bottom', selection: false, uniScaleTransform: true})

      // Draw grid
      for (let x = 0; x <= this.gridW; x += this.grid) {
        canvasGrid.add(new fabric.Line([x, 0, x, this.gridH], {
          strokeWidth: 1,
          stroke: '#e0e0e0',
          selectable: false,
          hasControls: false
        }))
      }

      for (let y = 0; y <= this.gridH; y += this.grid) {
        canvasGrid.add(new fabric.Line([0, y, this.gridW, y], {
          strokeWidth: 1,
          stroke: '#e0e0e0',
          selectable: false,
          hasControls: false
        }))
      }

      // Events
      let mouseDown = false
      let mouseStartX = 0
      let mouseStartY = 0

      canvas.on({
        'mouse:down': function (options) {
          let pointer = canvas.getPointer(options.e)

          if (!self.selectedArea.contains(pointer.x, pointer.y)) {
            mouseDown = true

            mouseStartX = pointer.x - (pointer.x % self.grid)
            mouseStartY = pointer.y - (pointer.y % self.grid)

            self.clearCanvas()
            self.newRect(mouseStartX, mouseStartY, self.grid, self.grid)
            self.showPopover()
          }
        },

        'mouse:up': function (options) {
          mouseDown = false
        },

        'mouse:over': function (options) {
          // Show controls on mouseover.
          if (options.target != null && !options.target.isFixed) {
            options.target.set('active', true)
            canvas._activeObject = null
            canvas.setActiveObject(options.target)
            canvas.renderAll()
          }
        },

        'mouse:out': function (options) {
          if (options.target != null && options.target.selectable) {
            options.target.set('active', false)
            canvas._activeObject = null
            canvas.renderAll()
          }
        },

        'mouse:move': function (e) {
          if (mouseDown) {
            let pointer = canvas.getPointer(e.e)
            let topLeftX = mouseStartX
            let topLeftY = mouseStartY
            let bottomRightX = 0
            let bottomRightY = 0

            if (pointer.x < topLeftX) {
              bottomRightX = topLeftX + self.grid
              topLeftX = pointer.x - (pointer.x % self.grid)
            } else {
              bottomRightX = pointer.x + (self.grid - pointer.x % self.grid)
            }

            if (pointer.y < topLeftY) {
              bottomRightY = topLeftY + self.grid
              topLeftY = pointer.y - (pointer.y % self.grid)
            } else {
              bottomRightY = pointer.y + (self.grid - pointer.y % self.grid)
            }

            self.clearCanvas()
            if (self.isColliding(topLeftX, topLeftY, bottomRightX - topLeftX, bottomRightY - topLeftY)) {
              self.newRect(topLeftX, topLeftY, bottomRightX - topLeftX, bottomRightY - topLeftY, 'rgba(255, 0, 25, 0.3)')
            } else {
              self.newRect(topLeftX, topLeftY, bottomRightX - topLeftX, bottomRightY - topLeftY)
            }

            self.showPopover()
          }
        },

        'object:modified': function (e) {
          // Resize instead of scaling.
          let w = Math.round((e.target.scaleX * e.target.width) / self.grid) * self.grid
          let h = Math.round((e.target.scaleY * e.target.height) / self.grid) * self.grid

          // Redraw rect to fix potential scaling glitches.
          self.clearCanvas()
          self.newRect(Math.round(e.target.left), Math.round(e.target.top), w, h, e.target.fill)
          self.showPopover()
          self.updatePopover()
        },

        'object:moving': function (e) {
          let target = e.target

          // Snap to grid.
          target.left = target.left - (target.left % self.grid)
          target.top = target.top - (target.top % self.grid)

          // Deny moving out of bounds.
          if (target.left + self.selectedArea.getWidth() > self.gridW) {
            target.left = self.gridW - self.selectedArea.getWidth()
          }

          if (target.left < 0) {
            target.left = 0
          }

          if (target.top + self.selectedArea.getHeight() > self.gridH) {
            target.top = self.gridH - self.selectedArea.getHeight()
          }

          if (target.top < 0) {
            target.top = 0
          }

          self.dummy.w = target.width
          self.dummy.h = target.height
          self.dummy.t = target.top
          self.dummy.l = target.left
          self.updatePopover()

          if (self.isColliding(target.left, target.top, target.width, target.height)) {
            target.set('fill', 'rgba(255, 0, 25, 0.3)')
          } else {
            target.set('fill', 'rgba(67, 198, 0, 0.3)')
          }
        },

        'object:scaling': function (e) {
          let target = e.target
          let w = target.width * target.scaleX
          let h = target.height * target.scaleY
          let snap = { // Closest snapping points
            top: Math.round(target.top / self.grid) * self.grid,
            left: Math.round(target.left / self.grid) * self.grid,
            bottom: Math.round((target.top + h) / self.grid) * self.grid,
            right: Math.round((target.left + w) / self.grid) * self.grid
          }

          let threshold = self.grid
          let dist = {
            top: Math.abs(snap.top - target.top),
            left: Math.abs(snap.left - target.left),
            bottom: Math.abs(snap.bottom - target.top - h),
            right: Math.abs(snap.right - target.left - w)
          }

          let attrs = {
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            top: target.top,
            left: target.left
          }

          switch (target.__corner) {
            case 'mt':
              if (dist.top < threshold) {
                attrs.scaleY = (snap.bottom - snap.top) / target.height
                attrs.top = snap.top
              }
              break
            case 'ml':
              if (dist.left < threshold) {
                attrs.scaleX = (w - (snap.left - target.left)) / target.width
                attrs.left = snap.left
              }
              break
            case 'mr':
              if (dist.right < threshold) attrs.scaleX = (snap.right - target.left) / target.width
              break
            case 'mb':
              if (dist.bottom < threshold) attrs.scaleY = (snap.bottom - target.top) / target.height
              break
          }

          target.set(attrs)
          self.dummy.w = Math.round(target.width * target.scaleX)
          self.dummy.h = Math.round(target.height * target.scaleY)
          self.dummy.t = Math.round(target.top)
          self.dummy.l = Math.round(target.left)

          self.selectedArea.setTopLeft(self.dummy.l, self.dummy.t)
          self.selectedArea.setBottomRight(self.dummy.l + self.dummy.w, self.dummy.t + self.dummy.h)

          if (self.isColliding(self.dummy.l, self.dummy.t, self.dummy.w, self.dummy.h)) {
            target.set('fill', 'rgba(255, 0, 25, 0.3)')
          } else {
            target.set('fill', 'rgba(67, 198, 0, 0.3)')
          }

          canvas.renderAll()
          self.updatePopover()
        }
      })
    },

    newRect (l, t, w, h, f, s) {
      f = f === undefined ? 'rgba(67, 198, 0, 0.3)' : f
      s = s === undefined ? true : s

      let rect = new fabric.Rect({
        left: l,
        top: t,
        fill: f,
        width: w,
        height: h,
        selectable: s,
        lockRotation: true,
        hasRotatingPoint: false,
        transparentCorners: false,
        hasBorders: false,
        strokeWidth: 0,
        isFixed: false
      })

      rect.setControlsVisibility({
        tr: false,
        tl: false,
        br: false,
        bl: false
      })
      canvas.add(rect)

      this.selectedArea.setTopLeft(l, t)
      this.selectedArea.setBottomRight(l + w, t + h)

      this.dummy.w = rect.width
      this.dummy.h = rect.height
      this.dummy.t = rect.aCoords.tl.y
      this.dummy.l = rect.aCoords.tl.x
      this.updatePopover()

      return rect
    },

    clearCanvas (clearFixed) {
      clearFixed = clearFixed === undefined ? false : clearFixed

      let objects = canvas.getObjects('rect')
      objects.forEach(function (obj) {
        if (obj.isFixed === clearFixed) {
          canvas.remove(obj)
        }
      })
    },

    isColliding (_x, _y, _width, _height) {
      _width = _width === undefined ? 1 : _width
      _height = _height === undefined ? 1 : _height

      let areaBlocks = utils.getBlockNumbers(_x, _y, _width, _height)

      let collides = areaBlocks.some((val, number) => {
        return this.$store.state.blockingPixels.has(number)
      })

      this.areaCollides = collides
      return collides
    },

    /**
     * Called when the user clicks on ad-divs or -images.
     */
    checkClick (target) {
      let adId = target.dataset.adId
      if (adId !== undefined) {
        adId = parseInt(adId)
        this.isClickInOwnAd(adId)
      }
    },

    isClickInOwnAd (adId) {
      let clickedOnAd = false

      if (this.myCanvasAds.has(adId)) {
        this.selectedAd = this.myCanvasAds.get(adId)
        clickedOnAd = true

        this.hidePopover()
        this.showAdModal()
        this.clearCanvas()
      } else {
        this.selectedAd = null
      }

      return clickedOnAd
    },

    drawMyAds () {
      if (canvas !== null) {
        this.myCanvasAds.forEach(ad => {
          this.drawAd(ad)
        })
      }
    },

    /**
     * Draw an ad of the current user.
     */
    drawAd (ad) {
      let self = this
      let drawed = false

      if (ad.image !== null) {
        // This ad has already content! Show as image instead of a div.
        if (ad.hasOwnProperty('divEl')) {
          // Remove divEl from DOM
          this.wrapperEl.removeChild(ad.divEl)
          delete ad.divEl
        }

        if (!ad.hasOwnProperty('imageEl')) {
          drawed = true

          // Create new image
          let imageEl = new Image(ad.width, ad.height)
          imageEl.src = ad.image
          imageEl.setAttribute('style', `top: ${ad.y}px; left: ${ad.x}px; width: ${ad.width}px; height: ${ad.height}px;`)
          imageEl.setAttribute('data-ad-id', ad.id)
          imageEl.forceRef = true

          let linkClass = ad.link ? '' : ' no-link'
          if (ad.isCurrentUser) {
            imageEl.setAttribute('class', `ad current-user${linkClass}`)
          } else {
            imageEl.setAttribute('class', `ad${linkClass}`)
          }

          // Add to ad
          ad.imageEl = imageEl

          // Add to DOM
          this.wrapperEl.appendChild(imageEl)

          // Add tooltip
          tippy(imageEl, {
            animation: 'shift-toward',
            arrow: true,
            distance: 10,
            maxWidth: '350px',
            interactive: true,
            html: '#tooltipAdContent',
            theme: 'light rounded',
            // trigger: 'click',
            performance: true,

            onShow () {
              const content = this.querySelector('.tippy-content')
              // TODO: rewrite this lazy code with document.createElement. Use a fragment parent which gets appended to .tippy-content
              // at the very end. That's much faster.
              // See https://jsperf.com/inner-html-vs-append-child-vs-fragment-with-attributes/1

              let spacingClassUp = ''
              let inner = '<div class="d-flex flex-column text-left">'
              if (ad.title) {
                inner += `<div class="title"><strong>${ad.title}</strong></div>`
                spacingClassUp = ' mt-1'
              }
              if (ad.text) {
                inner += `<div class="text${spacingClassUp}">${ad.text}</div>`
                spacingClassUp = ' mt-2'
              }
              if (ad.link) {
                inner += `<div class="link d-flex${spacingClassUp}"><div class="label w-25">Link:</div><div class="value w-75"><a href="${ad.link}" target="_blank">${ad.link}</a></div></div>`
                spacingClassUp = ' mt-1'
              }
              if (ad.contact) {
                inner += `<div class="contact d-flex${spacingClassUp}"><div class="label w-25">Contact:</div><div class="value">${ad.contact}</div></div>`
              }

              spacingClassUp = ad.title || ad.text || ad.link || ad.contact ? ' mt-3' : ''
              if (ad.isCurrentUser) {
                inner += `<div class="owner d-flex${spacingClassUp}"><div class="label mr-2">Owner:</div><div class="value"><strong>You!</strong></div></div>`
              } else {
                inner += `<div class="owner d-flex${spacingClassUp}"><div class="label mr-2">Owner:</div><div class="value">${ad.owner}</div></div>`
              }

              let blockTime = self.blockTimes.get(ad.block)
              if (blockTime) {
                let date = new Date(blockTime * 1000)
                inner += `<div class="update d-flex mt-1"><div class="label mr-2">Updated:</div><div class="value">${self.dateFormatter.format(date)}</div></div>`
              }
              content.innerHTML = inner

              if (self.$store.state.owner === self.coinbase && !ad.nsfw && !self.$store.state.forceNSFW.has(ad.id)) {
                let btn = document.createElement('button')
                btn.setAttribute('type', 'button')
                btn.setAttribute('class', 'btn btn-secondary btn-sm mt-3 float-right')
                btn.textContent = 'Force NSFW'
                btn.addEventListener('click', () => {
                  self.forceNSFW(ad.id)
                })
                content.appendChild(btn)

                let fix = document.createElement('div')
                fix.setAttribute('class', 'clearfix')
                content.appendChild(fix)
              }
            }
          })
          imageEl._tippy.forceRef = true
        } else {
          // Update image src
          ad.imageEl.src = ad.image
        }

        // Overlay if it's NSFW
        if (!ad.isCurrentUser && !ad.hasOwnProperty('nsfwEl') && (ad.nsfw || this.$store.state.forceNSFW.has(ad.id))) {
          let nsfwEl = document.createElement('div')
          nsfwEl.setAttribute('style', `top: ${ad.y}px; left: ${ad.x}px; width: ${ad.width}px; height: ${ad.height}px;`)
          nsfwEl.setAttribute('class', 'nsfw-overlay')
          nsfwEl.forceRef = true
          ad.nsfwEl = nsfwEl
          this.wrapperEl.appendChild(nsfwEl)
        }
      } else {
        // No image yet. Show a boring rectangle with red borders.
        if (!ad.hasOwnProperty('divEl')) {
          drawed = true

          // Create an empty div-container
          let divEl = document.createElement('div')
          divEl.setAttribute('style', `top: ${ad.y}px; left: ${ad.x}px; width: ${ad.width}px; height: ${ad.height}px;`)
          divEl.setAttribute('data-ad-id', ad.id)
          divEl.forceRef = true

          if (ad.isCurrentUser) {
            divEl.setAttribute('class', 'claimed current-user')
          } else {
            divEl.setAttribute('class', 'claimed')
          }

          // Add it to the ad
          ad.divEl = divEl

          // Add to DOM
          this.wrapperEl.appendChild(divEl)

          // Add tooltip
          tippy(divEl, {
            animation: 'shift-toward',
            arrow: true,
            distance: 10,
            maxWidth: '350px',
            interactive: true,
            html: '#tooltipAdContent',
            theme: 'light rounded',
            // trigger: 'click',
            performance: true,

            onShow () {
              const content = this.querySelector('.tippy-content')

              let inner = '<div class="d-flex flex-column text-left">'
              if (ad.isCurrentUser) {
                inner += '<div>These are <strong>your</strong> pixels!</div>'
                inner += `<div>Click to edit its data.</div>`
              } else {
                inner += '<div>Claimed by:</div>'
                inner += `<div>${ad.owner}</div>`
              }

              let blockTime = self.blockTimes.get(ad.block)
              if (blockTime) {
                let date = new Date(blockTime * 1000)
                inner += `<div class="update d-flex mt-1"><div class="label mr-2">Updated:</div><div class="value">${self.dateFormatter.format(date)}</div></div>`
              }

              content.innerHTML = inner
            }
          })
          divEl._tippy.forceRef = true
        }
      }

      return drawed
    },

    // Remove the html element of an ad.
    removeAd (ad) {
      if (ad.hasOwnProperty('divEl')) {
        this.wrapperEl.removeChild(ad.divEl)
      } else if (ad.hasOwnProperty('imageEl')) {
        this.wrapperEl.removeChild(ad.imageEl)
      }

      if (ad.hasOwnProperty('nsfwEl')) {
        this.wrapperEl.removeChild(ad.nsfwEl)
      }
    },

    blinkClaimed () {
      // TODO: implement
    },

    drawAllAds () {
      if (canvas !== null) {
        this.allCanvasAds.forEach(ad => {
          if (!ad.isCurrentUser) {
            let drawed = this.drawAd(ad)
            if (drawed) {
              this.$store.dispatch('setAd', {ad: ad, target: 'all'})
            }
          } else {
            this.removeAd(ad)
          }
        })
      }
    },

    async forceNSFW (adId) {
      try {
        let [error, tx] = await mdappContract.forceNSFW(adId)
        if (error) throw error
        tx
          .on('transactionHash', txHash => {
            this.$swal({
              type: 'success',
              title: 'Transaction sent',
              html: `Track its progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
              showConfirmButton: false,
              heightAuto: false,
              onAfterClose: () => {
                this.$emit('showTxLog')
              }
            })

            newTransaction(txHash, 'forceNSFW', {adId: adId}, 'pending')
          })
          .on('error', error => {
            throw error
          })
      } catch (error) {
        let msg = error.message
        if (msg.indexOf('User denied transaction signature') === -1) {
          console.error('forceNSFW:', error)
          Raven.captureException(error)

          this.$swal({
            type: 'error',
            title: 'Error',
            html: `${msg.substr(0, 1).toUpperCase()}${msg.substr(1)}`,
            heightAuto: false,
            showConfirmButton: false
          })
        }
      }
      return false
    },

    /*************************
     *                       *
     * Ad Filter processing  *
     *                       *
     ************************/

    processAdFilterQueue () {
      // Changes to this.myCanvasAds and this.allCanvasAds are not triggered here because all necessary operations
      // are being done right here.

      // Ads of the current user will be seen twice, with different targets (user or all).
      // Ads of others will only be seen once.

      // Iterate over queue
      this.$store.state.adsQueue.forEach((data, queueId) => {
        let ad = utils.clone(data.ad)

        if (data.event === 'Release') {
          this.removeAd(ad)
          if (data.target === 'user') {
            this.myCanvasAds.delete(ad.id)
          } else {
            this.allCanvasAds.delete(ad.id)
          }
          this.$store.dispatch('removeAd', {ad: ad, target: data.target, queueId: queueId})
        } else {
          if (data.target === 'user') {
            this.drawAd(ad)
            this.myCanvasAds.set(ad.id, ad)
          } else {
            if (!ad.isCurrentUser) this.drawAd(ad)
            this.allCanvasAds.set(ad.id, ad)
          }
          this.$store.dispatch('setAd', {ad: ad, target: data.target, queueId: queueId})
        }
      })
    },

    /*************************
     *                       *
     * Popover/Modal actions *
     *                       *
     ************************/

    popoverCreated (el) {
      this.popover = el
    },
    updatePopover () {
      if (this.popover) {
        Vue.nextTick(() => {
          this.popover.updatePosition()
        })
      }
    },
    showPopover () {
      this.popoverVisible = true
    },
    hidePopover () {
      this.selectedArea.reset()
      this.clearCanvas()
      this.popoverVisible = false
    },

    buyBtnPressed () {
      this.$root.$emit('bv::show::modal', 'modalBuyPixels')
    },

    showAdModal () {
      this.$root.$emit('bv::show::modal', 'ad-modal')
    },

    clickedOutside (e) {
      if (this.popoverVisible) {
        // Since the popover is attached directly under the body, we need to check this event isn't fired from there.
        let fire = true

        for (let el = e.target; el; el = el.parentNode) {
          if (el.nodeName.toLowerCase() === 'html') break

          // Ignore click into popover
          if (el.className.indexOf('popover') !== -1 ||
            // Ignore clicks on swal2 modals
            el.className.indexOf('swal2') !== -1) {
            fire = false
            break
          }
        }

        if (fire) {
          this.hidePopover()
          this.clearCanvas()
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";

  #canvasWrapper {
    background-color: aliceblue;
  }
</style>

<style>
  #canvasWrapper {
    margin: 0 auto;
    position: relative;
    width: 1251px;
    height: 802px;
  }

  .canvas-container {
    margin: 0 auto;
    position: absolute !important;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .canvas-container.top {
    z-index: 2;
  }

  /* Ads */
  .nsfw-overlay {
    position: absolute;
    background-color: #000;
    z-index: 4;
    cursor: not-allowed;
  }

  .show-nsfw .nsfw-overlay {
    display: none;
  }

  div.claimed {
    position: absolute;
    /* background-color: #343a40; */
    background-image: url("../assets/claimed3.png");
    background-repeat: repeat;
    background-color: #FFF;
    z-index: 3;
  }
  div.claimed:hover {
    transition: all 200ms linear;
    background-image: url("../assets/claimed3_white.png");
    background-color: #343a40;
  }

  div.claimed.current-user {
    border: 2px solid #fd7e14;
    background-color: #343a40;
    background-image: none;
    cursor: pointer;
  }

  img.ad {
    position: absolute;
    z-index: 3;
    cursor: pointer;
  }
  img.ad.no-link {
    cursor: default;
  }

  /* Ad tooltips */
  .tippy-content .owner,
  .tippy-content .update {
    font-size: 0.7rem;
  }

  .tippy-content .link .value {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .tippy-content .owner .label,
  .tippy-content .update .label {
    width: 55px;
  }

  /* Other */
  .modal {
    z-index: 1070;
  }

</style>
