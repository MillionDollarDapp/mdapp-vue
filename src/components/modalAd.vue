<template>
  <b-modal id="ad-modal" ref="adModalRef" size="lg" hide-footer centered no-close-on-esc no-close-on-backdrop v-on:hide="resetForm">
    <template slot="modal-title">
      <h3>Choose your option</h3>
    </template>

    <div role="tablist">
      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.accordionEdit variant="info">Edit data</b-btn>
        </b-card-header>
        <b-collapse id="accordionEdit" accordion="my-accordion" role="tabpanel" v-on:show="accordionEditVisible = true" v-on:hide="accordionEditVisible = false">
          <b-card-body>
              <b-container fluid class="text-left">
                <b-row><b-col><strong>Congratulations!</strong></b-col></b-row>
                <b-row class="mb-3 line-breakable"><b-col>You have your very own pixels. To finally become part of history, please fill out the form.</b-col></b-row>
                <b-row align-h="between" class="justify-content-lg-center">

                  <!--Title-->
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-title">Title</label></b-col>
                  <b-col lg="7" cols="8" class="text-right"><b-form-input v-model="title" id="ad-title" maxlength="32" type="text" placeholder="A meaningful title..."/></b-col>
                  <b-col cols="0" lg="1"></b-col>
                  <!--Description-->
                  <div class="w-100 my-1"/>
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-desc">Description</label></b-col>
                  <b-col lg="7" cols="8" class="text-right"><b-form-textarea id="ad-desc" rows="3" no-resize v-model="text" placeholder="Max 96 letters description..."></b-form-textarea></b-col>
                  <b-col cols="0" lg="1"></b-col>
                  <!--Link-->
                  <div class="w-100 my-1"/>
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-link">Link</label></b-col>
                  <b-col lg="7" cols="8" class="text-right"><b-form-input id="ad-link" v-model="link" type="url" placeholder="https://www.example.com"/></b-col>
                  <b-col cols="0" lg="1"></b-col>
                  <!--Contact-->
                  <div class="w-100 my-1"/>
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-contact">Contact</label></b-col>
                  <b-col lg="7" cols="8" class="text-right"><b-form-input id="ad-link" v-model="contact" type="text" placeholder="E-Mail, Phone etc."/></b-col>
                  <b-col cols="0" lg="1"></b-col>
                  <!--NSFW-->
                  <div class="w-100 my-1"/>
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-nsfw">NSFW</label></b-col>
                  <b-col lg="7" cols="8" class="text-left"><b-form-checkbox id="ad-nsfw" v-model="nsfw">This has violent, pornographic or other possibly offending content</b-form-checkbox></b-col>
                  <b-col cols="0" lg="1"></b-col>
                  <!--Image-->
                  <div class="w-100 my-1"/>
                  <b-col cols="0" lg="1"></b-col>
                  <b-col lg="3" cols="2"><label for="ad-image" class="required">Image</label></b-col>
                  <template v-if="!cropped">
                    <b-col lg="7" cols="8" class="text-left"><b-form-file id="ad-image" v-model="file" accept="image/jpeg, image/png"></b-form-file></b-col>
                    <b-col cols="0" lg="1"></b-col>
                  </template>
                  <template v-else>
                    <b-col lg="7" cols="8" id="preview-wrapper" class="text-right">
                      <img id="preview-image" :src="previewData" class="p-2" v-b-tooltip.hover title="This is your image on grey background.">
                    </b-col>
                    <b-col cols="1" class="d-flex flex-row align-items-center p-0">
                      <div>
                        <b-button class="download-image-button p-0" variant="link" @click="downloadImage" v-b-tooltip.hover title="Download image (recommendet)"><download-icon/></b-button>
                        <b-button class="delete-image-button p-0" variant="link" @click="removeImage" v-b-tooltip.hover title="Delete selection"><trash2-icon/></b-button>
                      </div>
                    </b-col>
                  </template>
                </b-row>

                <!--Croppie-->
                <template v-if="imageData.length > 0 && !cropped">
                  <b-row  align-h="center" class="mt-2">
                    <b-col class="text-center" id="image-wrapper"><img id="raw-image" :src="imageData"></b-col>
                  </b-row>
                  <b-row align-h="center">
                    <b-col class="text-center"><b-button @click="cropImage" size="sm" variant="primary">Yes, use this sector!</b-button></b-col>
                  </b-row>
                </template>

                <!--Buttons-->
                <hr/>
                <b-alert :show="hasError" variant="danger" class="mt-3">{{errorMsg}}</b-alert>

                <b-row align-h="end">
                  <b-col md="auto">
                    <b-button variant="outline-secondary" @click="hideModal">Cancel</b-button>
                  </b-col>
                  <b-col md="auto">
                    <b-button variant="success" :disabled="!cropped" @click="saveBtnPressed">Save</b-button>
                  </b-col>
                </b-row>
              </b-container>

          </b-card-body>
        </b-collapse>
      </b-card>
      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-btn block href="#" v-b-toggle.accordionRelease variant="info">Release pixels</b-btn>
        </b-card-header>
        <b-collapse id="accordionRelease" accordion="my-accordion" role="tabpanel" v-on:show="accordionReleaseVisible = true" v-on:hide="accordionReleaseVisible = false">
          <b-card-body>
            <p>You can release these pixels to unlock the appropriate amount of MDAPP tokens. If you proceed,
            any other person with unlocked MDAPP will immediately have the ability to claim ownership of these pixels.</p>

            <b-container fluid class="text-left">
              <b-row align-h="between" class="justify-content-lg-center">
                <!--Dimensions-->
                <b-col cols="0" lg="2"></b-col>
                <b-col cols="auto" lg="3" class="font-weight-bold">Area dimensions:</b-col>
                <b-col cols="6" lg="5" class="text-right" v-html="dimensions"></b-col>
                <b-col cols="0" lg="2"></b-col>
                <!--Pixels-->
                <div class="w-100 my-1"/>
                <b-col cols="0" lg="2"></b-col>
                <b-col cols="auto" lg="3" class="font-weight-bold">Pixels:</b-col>
                <b-col cols="6" lg="5" class="text-right">{{ pixels }}</b-col>
                <b-col cols="0" lg="2"></b-col>
                <!--Tokens-->
                <div class="w-100 my-1"/>
                <b-col cols="0" lg="2"></b-col>
                <b-col cols="auto" lg="3" class="font-weight-bold">MDAPP tokens:</b-col>
                <b-col cols="6" lg="5" class="text-right">{{ tokens }}</b-col>
                <b-col cols="0" lg="2"></b-col>
              </b-row>

              <!--Buttons-->
              <hr/>
              <b-row align-h="end">
                <b-col md="auto">
                  <b-button variant="outline-secondary" @click="hideModal">Cancel</b-button>
                </b-col>
                <b-col md="auto">
                  <b-button variant="success" @click="releaseBtnPressed">Release</b-button>
                </b-col>
              </b-row>
            </b-container>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
  </b-modal>
</template>

<script>
import Vue from 'vue'
import Raven from 'raven-js'
import fileType from 'file-type'
import { Croppie } from 'croppie'
import { DownloadIcon, Trash2Icon } from 'vue-feather-icons'

import 'croppie/croppie.css'

import mdappContract from '../util/interactions/mdappContract'
import { newTransaction } from '../util/transaction'
import { AD_MAXLENGTH } from '../util/constants/adMaxlength'
import utils from '../util/utils'
import api from '../util/api'

var croppie = null

export default {
  name: 'modalAd',
  components: {
    DownloadIcon,
    Trash2Icon
  },

  props: {
    ad: Object
  },

  data () {
    return {
      accordionEditVisible: false,
      accordionReleaseVisible: false,

      text: '',
      title: '',
      link: '',
      contact: '',
      nsfw: false,

      file: null,
      imageData: '',
      previewData: '',
      resultBlob: null,
      imageExtension: '',
      imageDimensions: [0, 0],
      upload: false, // whether an image has been uploaded or reused

      cropped: false,
      uploadedProgress: 0,

      errorMsg: '',
      hasError: false
    }
  },

  computed: {
    dimensions () {
      if (this.ad) return `${this.ad.width} &times; ${this.ad.height} pixels`
      return ''
    },
    pixels () {
      if (this.ad) return this.ad.width * this.ad.height
      return 0
    },
    tokens () {
      if (this.ad) return (this.ad.width * this.ad.height) / 100
      return 0
    },

    /**
     * Calculate the viewport for our cropper. We try to have it exactly the size as the ad has. However, that makes
     * cropping very hard if your ad is tiny, say 10x10 pixels. For a good UX, 50px on the shorter side is desired.
     */
    viewport () {
      let viewport = [this.ad.width, this.ad.height]

      if (viewport[0] < 50 || viewport[1] < 50) {
        let factor = 1

        if (viewport[0] < viewport[1]) {
          // By which factor needs the width to be enlarged to become 50px?
          factor = 50 / viewport[0]
        } else {
          // By which factor needs the height to be enlarged to become 50px?
          factor = 50 / viewport[1]
        }
        viewport[0] *= factor
        viewport[1] *= factor
      }

      return viewport
    },

    hasChanges () {
      if (this.upload || !this.ad) return true

      if (this.ad) {
        // Compare all values:
        if (this.title !== this.ad.title ||
            this.text !== this.ad.text ||
            this.link !== this.ad.link ||
            this.contact !== this.ad.contact ||
            this.nsfw !== this.ad.nsfw) {
          return true
        }
      }
      return false
    }
  },

  watch: {
    // TODO: find another way to force maxlength
    // It's ugly to modify a property in its watcher. But the condition saves us.
    title (val, oldVal) {
      if (val.length > AD_MAXLENGTH.title) {
        this.title = oldVal
      }
    },
    text (val, oldVal) {
      if (val.length > AD_MAXLENGTH.text) {
        this.text = oldVal
      }
    },
    link (val, oldVal) {
      if (val.length > AD_MAXLENGTH.link) {
        this.link = oldVal
      }
    },
    contact (val, oldVal) {
      if (val.length > AD_MAXLENGTH.contact) {
        this.contact = oldVal
      }
    },

    imageData () {
      if (this.imageData) this.initCroppie()
    },

    ad () {
      this.text = ''
      this.title = ''
      this.link = ''
      this.contact = ''
      this.nsfw = false

      this.file = null
      this.imageData = ''
      this.previewData = ''
      this.resultBlob = null
      this.imageExtension = ''
      this.imageDimensions = [0, 0]

      this.upload = false
      this.cropped = false

      if (this.ad) {
        // Load defaults
        this.title = this.ad.title ? this.ad.title : ''
        this.text = this.ad.text ? this.ad.text : ''
        this.link = this.ad.link ? this.ad.link : ''
        this.contact = this.ad.contact ? this.ad.contact : ''
        this.nsfw = this.ad.nsfw ? this.ad.nsfw : false
        if (this.ad.image) this.loadDefaultImage()
      }
    },

    file () {
      if (this.file) {
        this.loadImage()
      }
    }
  },

  methods: {
    resetForm () {
      // Called on the hide-event (see template)
      this.destroyCroppie()
      this.uploadedProgress = 0
      this.errorMsg = ''
      this.hasError = false

      // Hide all collapses
      if (this.accordionEditVisible) this.$root.$emit('bv::toggle::collapse', 'accordionEdit')
      if (this.accordionReleaseVisible) this.$root.$emit('bv::toggle::collapse', 'accordionRelease')
    },
    hideModal () {
      this.$refs.adModalRef.hide()
    },

    loadImage () {
      if (this.file) {
        this.imageExtension = this.file.type.indexOf('jpeg') > -1 ? 'jpeg' : 'png'

        let reader = new FileReader()
        reader.onload = e => {
          // Create image object to get its dimensions
          let img = new Image()
          img.onload = () => {
            this.imageDimensions = [img.width, img.height]
            this.upload = true

            // Save image data in variable.
            // Do it here because a change of this.imageData triggers the initCroppie() method which requires the image
            // dimensions.
            this.imageData = e.target.result
          }

          img.src = e.target.result
        }

        reader.readAsDataURL(this.file)
      }
    },

    loadDefaultImage () {
      if (this.ad.image) {
        // Create DataUrl from URL
        api.download(this.ad.image)
          .then(response => {
            // Request done
            let arrayBufferReader = new FileReader()
            let dataURLReader = new FileReader()
            let mimeType = ''

            // Validate file type.
            arrayBufferReader.onload = e => {
              mimeType = fileType(e.target.result)
              if (mimeType.mime === 'image/jpeg' || mimeType.mime === 'image/png') {
                this.imageExtension = mimeType.mime.indexOf('jpeg') > -1 ? 'jpeg' : 'png'

                // Valid. Now create DataURL.
                dataURLReader.readAsDataURL(response.data)
              } else {
                throw new Error('Invalid file type: ' + mimeType.mime)
              }
            }
            arrayBufferReader.readAsArrayBuffer(response.data)

            dataURLReader.onload = e => {
              let img = new Image()
              img.onload = () => {
                // Image done
                try {
                  // Read file extension from DataUrl and require it to be jpeg or png
                  // let mime = e.target.result.substring(5, e.target.result.indexOf(';base64'))
                  this.imageDimensions = [img.width, img.height]
                  this.previewData = e.target.result
                  this.resultBlob = this._dataUrltoBlob(this.previewData, mimeType.mime)
                  this.cropped = true
                  this.upload = false
                } catch (error) {
                  console.error('Load default image:', error)
                  Raven.captureException(error)
                }
              }
              img.src = e.target.result
            }
          }).catch(error => {
            console.error('image download:', error)
            Raven.captureException(error)
          })
      }
    },

    initCroppie () {
      Vue.nextTick(() => {
        if (croppie !== null) {
          this.destroyCroppie()
        }

        this.previewData = ''
        this.resultBlob = null
        this.cropped = false

        if (this.imageDimensions[0] !== this.ad.width || this.imageDimensions[1] !== this.ad.height) {
          // Image doesn't fit into ad. User has to crop the area
          croppie = new Croppie(document.getElementById('raw-image'), {
            enforceBoundary: false,
            viewport: { width: this.viewport[0], height: this.viewport[1], type: 'square' }
          })
        } else {
          // Image fits perfectly. Treat is as a cropped result.
          this.previewData = this.imageData
          this.cropped = true

          // We still need the blob. Doh!
          this.resultBlob = this._dataUrltoBlob(this.previewData, this.file.type)
        }
      })
    },

    destroyCroppie () {
      if (croppie != null) {
        croppie.destroy()
        croppie = null

        let wrapper = document.getElementById('image-wrapper')
        let image = document.querySelector('#image-wrapper > div > img')
        let orphan = document.querySelector('#image-wrapper > div')

        if (orphan) {
          wrapper.insertBefore(image, orphan)
          wrapper.removeChild(orphan)
        }
      }
    },

    removeImage () {
      this.previewData = ''
      this.cropped = false

      if (this.imageDimensions[0] !== this.ad.width || this.imageDimensions[1] !== this.ad.height) {
        // Show Croppie
        this.initCroppie()
      } else {
        // Only show file input
        this.imageData = ''
      }
    },

    downloadImage () {
      if (this.resultBlob !== null) {
        // Create fake <a> element and click it programmatically.
        let a = document.createElement('a')
        document.body.appendChild(a)
        a.style = 'display: none'

        let url = window.URL.createObjectURL(this.resultBlob)
        a.href = url
        a.download = `mdapp-image-ad-${this.ad.id}.${this.imageExtension}`
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    },

    cropImage () {
      croppie.result({
        type: 'base64',
        size: {width: this.ad.width, height: this.ad.height},
        backgroundColor: '#FFF',
        format: this.imageExtension,
        quality: 1,
        circle: false
      }).then(result => {
        this.previewData = result
        this.cropped = true

        // Also save blob
        croppie.result({
          type: 'blob',
          size: {width: this.ad.width, height: this.ad.height},
          backgroundColor: '#FFF',
          format: this.imageExtension,
          quality: 1,
          circle: false
        }).then(blob => {
          this.resultBlob = blob
        })
      })
    },

    async saveBtnPressed () {
      // Just close if there're no changes.
      if (!this.hasChanges) {
        this.hideModal()
        return
      }

      // Validate form inputs
      if (this._validateTitle() === false ||
          this._validateText() === false ||
          this._validateLink() === false ||
          this._validateContact() === false) {
        return
      }

      if (this.upload) {
        if (this.resultBlob) {
          // Push to ipfs
          try {
            let response = await api.upload(this.resultBlob)
            // Even though we already have the hash, the file will only be published to IPFS if the transaction
            // gets mined.
            console.info('ipfs hash:', response.data.hash)

            // Send data to contract
            let mh = utils.ipfs2multihash(response.data.hash)
            this._callEditAdMethod(mh)
            this.hideModal()
          } catch (error) {
            Raven.captureException(error)
            this.hasError = true
            switch (error.response.status) {
              case 403:
                this.errorMsg = 'Only png and jpg files are allowed.'
                break

              case 503:
                this.errorMsg = 'Service temporarily unavailable. Please try again later.'
                break

              default:
                this.errorMsg = `An unexpected error occurred (${error.response.status}). Please try again later.`
            }
          }
        } else {
          Raven.captureException(new Error('You should never see this! No image blob available.'))
        }
      } else {
        if (this.ad && this.ad.mh) {
          // No upload necessary
          this._callEditAdMethod(this.ad.mh)
          this.hideModal()
        } else {
          Raven.captureException(new Error('Save w/o upload: ad.mh missing.'))
        }
      }
    },

    async releaseBtnPressed () {
      try {
        let [error, tx] = await mdappContract.release(this.ad.id)
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
            newTransaction(txHash, 'release', { pixels: this.pixels }, 'pending')
            this.hideModal()
          })
          .on('error', error => {
            throw error
          })
      } catch (error) {
        let msg = error.message
        if (msg.indexOf('User denied transaction signature') === -1) {
          console.error('editAdBtn:', error)
          Raven.captureException(error)

          this.$swal({
            type: 'error',
            title: 'Error',
            html: `${msg.substr(0, 1).toUpperCase()}${msg.substr(1)}`,
            heightAuto: false,
            showConfirmButton: false
          })
        }
        this.hideModal()
      }
    },

    async _callEditAdMethod (mh) {
      try {
        let [error, tx] = await mdappContract.editAd(this.ad.id, this.link, this.title, this.text, this.contact, this.nsfw, mh.digest, mh.hashFunction, mh.size, 'ipfs')
        if (error) throw error
        tx
          .on('transactionHash', txHash => {
            this.$swal({
              type: 'success',
              title: 'Transaction sent',
              html: `Track its progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
              heightAuto: false,
              showConfirmButton: false,
              onAfterClose: () => {
                this.$emit('showTxLog')
              }
            })
            newTransaction(txHash, 'editAd', {adId: this.ad.id}, 'pending')
          })
          .on('error', error => {
            throw error
          })
      } catch (error) {
        let msg = error.message
        if (msg.indexOf('User denied transaction signature') === -1) {
          console.error('editAdBtn:', error)
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
    },

    /**
     * Helper to convert Base64 encoded image data URL into a blob.
     *
     * @param dataURL from FileReader.readAsDataURL()
     * @param contentType either image/jpeg or image/png
     * @param sliceSize in which byte characters are processed
     * @returns Blob
     * @private
     */
    _dataUrltoBlob (dataURL, contentType = '', sliceSize = 512) {
      let b64Data = dataURL.substr(dataURL.indexOf(',') + 1)
      const byteCharacters = atob(b64Data)
      const byteArrays = []

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)

        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)

        byteArrays.push(byteArray)
      }

      const blob = new Blob(byteArrays, {type: contentType})
      return blob
    },

    /*******************************************************************
     * Form validators                                                 *
     * Don't use a 3rd party lib to save bandwidth. Keep it simple...  *
     *******************************************************************/

    _validateTitle () {
      this.title = this.title.trim()
      if (this.title.length > AD_MAXLENGTH.title) {
        this.errorMsg = `Title must not be longer than ${AD_MAXLENGTH.title} letters.`
        this.hasError = true
        return false
      }
      return true
    },

    _validateText () {
      this.text = this.text.trim()
      if (this.text.length > AD_MAXLENGTH.text) {
        this.errorMsg = `Description must not be longer than ${AD_MAXLENGTH.text} letters.`
        this.hasError = true
        return false
      }
      return true
    },

    _validateLink () {
      this.link = this.link.trim()

      // Url regexp by Diego Perini (https://gist.github.com/dperini/729294)
      let expr = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
      let regex = new RegExp(expr)

      if (this.link.length > AD_MAXLENGTH.link) {
        this.errorMsg = `Link must not be longer than ${AD_MAXLENGTH.link} letters.`
        this.hasError = true
        return false
      } else if (this.link.length > 0 && !this.link.match(regex)) {
        this.errorMsg = 'The given link is not a valid URL.'
        this.hasError = true
        return false
      }
      return true
    },

    _validateContact () {
      this.contact = this.contact.trim()
      if (this.contact.length > AD_MAXLENGTH.contact) {
        this.errorMsg = `Title must not be longer than ${AD_MAXLENGTH.contact} letters.`
        this.hasError = true
        return false
      }
      return true
    }
  }
}
</script>

<style scoped>
  .footer {
    color: #A0A0A0;
    font-size: 0.6rem;
  }

  #image-wrapper {
    height: 200px;
    margin-bottom: 60px;
  }

  #preview-wrapper img {
    background-color: #CCC;
  }

  #raw-image {
    max-width: 100%;
  }

  .download-image-button,
  .delete-image-button {
    line-height: 1px;
  }
</style>
