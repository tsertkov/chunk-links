import debounce from 'lodash.debounce'

const EMPTY_FN = () => {}

export default class chunkLinks {
  constructor (options = {}) {
    this.options = {
      error404ChunkUrl: null,
      loadingClassName: 'chunk-loading',
      chunkUrlSuffix: '__chunk/',
      scrollDebounceMs: 100,
      log: EMPTY_FN,
      onBeforeLoad: EMPTY_FN,
      onLoad: EMPTY_FN,
      onLoadError: EMPTY_FN,
      ...options
    }

    this.log = this.options.log
    this.isTransitioning = false
    this.init()
  }

  init () {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
      window.onbeforeunload = () => {
        history.scrollRestoration = 'auto'
      }
    }

    window.addEventListener('popstate', ({ state }) => {
      if (state === null) return

      const isValidState = state.chunkUrl && state.chunkTarget
      if (!isValidState) {
        window.location.reload()
      } else {
        const fullUrl = window.location.pathname
        const pageState = {
          ...state,
          fullUrl,
          trigger: 'popstate'
        }

        this.log('popstate', pageState)
        this.applyPageState(pageState)
      }
    })

    window.addEventListener('scroll', debounce(() => {
      if (this.isTransitioning) return
      this.saveCurrentState()
    }, this.options.scrollDebounceMs))

    document.body.addEventListener('click', this.onClick.bind(this), true)
  }

  onLoadError (fullUrl, chunkTarget) {
    if (this.options.error404ChunkUrl) {
      this.load404(fullUrl, chunkTarget)
    } else {
      window.location = fullUrl
    }
  }

  saveCurrentState () {
    const {
      pageYOffset,
      pageXOffset
    } = window

    const {
      title
    } = document

    window.history.replaceState({
      ...window.history.state,
      pageYOffset,
      pageXOffset
    }, title)
  }

  applyChunk (chunkContentEl, meta, chunkTargetEl) {
    if ('title' in meta) document.title = meta.title

    const header = document.querySelector('header.header')
    if (header) {
      header.setAttribute('class', `header ${meta.header_modifier}`)
    }

    const {
      pageXOffset,
      pageYOffset
    } = meta

    const oldChunkEl = chunkTargetEl.querySelector('div')
    oldChunkEl.parentNode.replaceChild(
      chunkContentEl,
      oldChunkEl
    )

    window.scrollTo(pageXOffset, pageYOffset)
  }

  parseChunkText (chunkText) {
    const chunkContentEl = document
      .createDocumentFragment()
      .appendChild(document.createElement('div'))

    chunkContentEl.innerHTML = chunkText
    const metaScript = chunkContentEl.querySelector('script[type="text/x-chunk-meta"]')

    let meta = {}
    if (metaScript) {
      chunkContentEl.removeChild(metaScript)
      try {
        meta = JSON.parse(metaScript.innerHTML)
      } catch (error) {
        if (error.name === 'SyntaxError') {
          throw new Error('Failed to parse x-chunk-meta script')
        }

        throw error
      }
    }

    return {
      chunkContentEl,
      meta
    }
  }

  loadChunk (fullUrl, chunkUrl) {
    return window.fetch(chunkUrl).then(response => {
      return response.ok
        ? response.text()
        : Promise.reject(response)
    }).then(text => {
      try {
        return Promise.resolve(this.parseChunkText(text))
      } catch (error) {
        return Promise.reject(error)
      }
    })
  }

  navigate (fullUrl, chunkUrl, chunkTarget) {
    this.saveCurrentState()
    window.history.pushState({
      chunkUrl,
      chunkTarget
    }, '', fullUrl)

    const pageState = {
      fullUrl,
      chunkUrl,
      chunkTarget,
      trigger: 'navigate'
    }
    this.log('navigate', pageState)
    this.applyPageState(pageState)
  }

  load404 (fullUrl, chunkTarget) {
    const {
      error404ChunkUrl: chunkUrl
    } = this.options

    this.applyPageState({
      fullUrl,
      chunkUrl,
      chunkTarget,
      trigger: 'redirect'
    })
  }

  onClick (event) {
    const el = event.target.closest('[data-chunk-el]')
    if (!el) return

    const chunkTarget = el.getAttribute('data-chunk-el')
    if (!chunkTarget) return

    const href = el.hasAttribute('data-href')
      ? el.getAttribute('data-href')
      : el.getAttribute('href')

    const chunkUrl = href + this.options.chunkUrlSuffix

    event.preventDefault()
    this.navigate(href, chunkUrl, chunkTarget)
  }

  applyPageState ({
    fullUrl,
    chunkUrl,
    chunkTarget,
    pageXOffset = 0,
    pageYOffset = 0
  }) {
    const chunkTargetEl = document.getElementById(chunkTarget)
    if (!chunkTargetEl) {
      console.error(`Could not find target element with id: '${chunkTarget}'`)
    }

    const storedMeta = {
      pageYOffset,
      pageXOffset
    }

    const {
      loadingClassName
    } = this.options

    this.options.onBeforeLoad(arguments[0])
    this.isTransitioning = true
    document.body.classList.toggle(loadingClassName)

    return this.loadChunk(fullUrl, chunkUrl).then(({ chunkContentEl, meta }) =>
      this.applyChunk(
        chunkContentEl,
        { ...storedMeta, ...meta },
        chunkTargetEl
      )
    ).then(() => {
      document.body.classList.toggle(loadingClassName)
      this.isTransitioning = false
      this.options.onLoad(arguments[0])
    }).catch(error => {
      document.body.classList.toggle(loadingClassName)
      this.isTransitioning = false

      this.options.onLoadError({
        error,
        ...arguments[0]
      })

      this.onLoadError(fullUrl, chunkTarget)
    })
  }
}
