import axios from 'axios'

axios.defaults.baseURL = process.env.API_PATH

export default {
  upload (blob) {
    let data = new FormData()
    data.append('image', blob)

    return axios.post('/upload', data)
  },

  download (url) {
    return axios({
      method: 'get',
      url: url,
      crossdomain: true,
      responseType: 'blob',
      maxContentLength: 1024 * 1024
    })
  },

  ping () {
    let config = { responseType: 'text' }
    return axios.get('/ping', config)
  }
}
