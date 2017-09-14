import ChunkLinks from '../src/ChunkLinks'

describe('ChunkLinks', () => {
  describe('constructor', () => {
    it('applies default options', () => {
      const chunkLinks = new ChunkLinks()
      expect(chunkLinks.options).toEqual(chunkLinks.defaultOptions)
      chunkLinks.unload()
    })

    it('applies custom options', () => {
      const options = { newOptionKey: 'newOptionKeyValue' }
      const chunkLinks = new ChunkLinks(options)
      expect(chunkLinks.options.newOptionKey).toBe(options.newOptionKey)
      chunkLinks.unload()
    })
  })

  describe('instance', () => {
    let chunkLinks

    beforeEach(() => {
      chunkLinks = new ChunkLinks()
    })

    afterEach(() => {
      chunkLinks.unload()
    })

    describe('on init', () => {
      describe('when scrollRestoration is available', () => {
        it('sets history.scrollRestoration to manual')
        it('sets history.scrollRestoration to auto on page unload')
      })

      describe('when scrollRestoration is not available', () => {
        it('does not throw')
      })

      it('attaches scroll handler')
      it('attaches popstate handler')
      it('attaches click handler')
    })

    describe('on unload', () => {
      it('detaches scroll handler')
      it('detaches popstate handler')
      it('detaches click handler')
    })

    describe('on page scroll', () => {
      it('saves current scroll state')
      it('debounces scroll events')
    })

    describe('on popstate', () => {
      //
    })

    describe('on click', () => {
      //
    })
  })
})
