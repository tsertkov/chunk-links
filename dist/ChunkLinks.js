'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EMPTY_FN = function EMPTY_FN() {};

var ChunkLinks = function () {
  function ChunkLinks() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ChunkLinks);

    this.isTransitioning = false;
    this.options = _extends({}, this.defaultOptions, options);

    this.init();
  }

  _createClass(ChunkLinks, [{
    key: 'init',
    value: function init() {
      this.initScrollRestoration();
      window.addEventListener('scroll', this.onScroll.bind(this));
      window.addEventListener('popstate', this.onPopstate.bind(this));
      document.body.addEventListener('click', this.onClick.bind(this), true);
    }
  }, {
    key: 'initScrollRestoration',
    value: function initScrollRestoration() {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
        window.onbeforeunload = function () {
          window.history.scrollRestoration = 'auto';
        };
      }
    }
  }, {
    key: 'onScroll',
    value: function onScroll() {
      var _this = this;

      return (0, _lodash2.default)(function () {
        if (_this.isTransitioning) return;
        _this.saveCurrentState();
      });
    }
  }, {
    key: 'onPopstate',
    value: function onPopstate(_ref) {
      var state = _ref.state;

      if (!state) return;

      var isValidState = state.chunkUrl && state.chunkTarget;
      if (!isValidState) {
        window.location.reload();
        return;
      }

      var fullUrl = window.location.pathname;
      var pageState = _extends({}, state, {
        fullUrl: fullUrl,
        trigger: 'popstate'
      });

      this.options.log('popstate', pageState);
      this.applyPageState(pageState);
    }
  }, {
    key: 'onClick',
    value: function onClick(event) {
      var el = event.target.closest('[data-chunk-el]');
      if (!el) return;

      var chunkTarget = el.getAttribute('data-chunk-el');
      if (!chunkTarget) return;

      var href = el.hasAttribute('data-href') ? el.getAttribute('data-href') : el.getAttribute('href');

      var chunkUrl = href + this.options.chunkUrlSuffix;

      event.preventDefault();
      this.navigate(href, chunkUrl, chunkTarget);
    }
  }, {
    key: 'onLoadError',
    value: function onLoadError(fullUrl, chunkTarget) {
      if (this.options.error404ChunkUrl) {
        this.load404(fullUrl, chunkTarget);
      } else {
        window.location = fullUrl;
      }
    }
  }, {
    key: 'saveCurrentState',
    value: function saveCurrentState() {
      var _window = window,
          pageYOffset = _window.pageYOffset,
          pageXOffset = _window.pageXOffset;
      var _document = document,
          title = _document.title;


      window.history.replaceState(_extends({}, window.history.state, {
        pageYOffset: pageYOffset,
        pageXOffset: pageXOffset
      }), title);
    }
  }, {
    key: 'applyChunk',
    value: function applyChunk(chunkContentEl, meta, chunkTargetEl) {
      if ('title' in meta) document.title = meta.title;

      var header = document.querySelector('header.header');
      if (header) {
        header.setAttribute('class', 'header ' + meta.header_modifier);
      }

      var pageXOffset = meta.pageXOffset,
          pageYOffset = meta.pageYOffset;


      var oldChunkEl = chunkTargetEl.querySelector('div');
      oldChunkEl.parentNode.replaceChild(chunkContentEl, oldChunkEl);

      window.scrollTo(pageXOffset, pageYOffset);
    }
  }, {
    key: 'parseChunkText',
    value: function parseChunkText(chunkText) {
      var chunkContentEl = document.createDocumentFragment().appendChild(document.createElement('div'));

      chunkContentEl.innerHTML = chunkText;
      var metaScript = chunkContentEl.querySelector('script[type="text/x-chunk-meta"]');

      var meta = {};
      if (metaScript) {
        chunkContentEl.removeChild(metaScript);
        try {
          meta = JSON.parse(metaScript.innerHTML);
        } catch (error) {
          if (error.name === 'SyntaxError') {
            throw new Error('Failed to parse x-chunk-meta script');
          }

          throw error;
        }
      }

      return {
        chunkContentEl: chunkContentEl,
        meta: meta
      };
    }
  }, {
    key: 'loadChunk',
    value: function loadChunk(fullUrl, chunkUrl) {
      var _this2 = this;

      return window.fetch(chunkUrl).then(function (response) {
        return response.ok ? response.text() : Promise.reject(response);
      }).then(function (text) {
        try {
          return Promise.resolve(_this2.parseChunkText(text));
        } catch (error) {
          return Promise.reject(error);
        }
      });
    }
  }, {
    key: 'navigate',
    value: function navigate(fullUrl, chunkUrl, chunkTarget) {
      this.saveCurrentState();
      window.history.pushState({
        chunkUrl: chunkUrl,
        chunkTarget: chunkTarget
      }, '', fullUrl);

      var pageState = {
        fullUrl: fullUrl,
        chunkUrl: chunkUrl,
        chunkTarget: chunkTarget,
        trigger: 'navigate'
      };
      this.options.log('navigate', pageState);
      this.applyPageState(pageState);
    }
  }, {
    key: 'load404',
    value: function load404(fullUrl, chunkTarget) {
      var chunkUrl = this.options.error404ChunkUrl;


      this.applyPageState({
        fullUrl: fullUrl,
        chunkUrl: chunkUrl,
        chunkTarget: chunkTarget,
        trigger: 'redirect'
      });
    }
  }, {
    key: 'applyPageState',
    value: function applyPageState(_ref2) {
      var _this3 = this,
          _arguments = arguments;

      var fullUrl = _ref2.fullUrl,
          chunkUrl = _ref2.chunkUrl,
          chunkTarget = _ref2.chunkTarget,
          _ref2$pageXOffset = _ref2.pageXOffset,
          pageXOffset = _ref2$pageXOffset === undefined ? 0 : _ref2$pageXOffset,
          _ref2$pageYOffset = _ref2.pageYOffset,
          pageYOffset = _ref2$pageYOffset === undefined ? 0 : _ref2$pageYOffset;

      var chunkTargetEl = document.getElementById(chunkTarget);
      if (!chunkTargetEl) {
        console.error('Could not find target element with id: \'' + chunkTarget + '\'');
      }

      var storedMeta = {
        pageYOffset: pageYOffset,
        pageXOffset: pageXOffset
      };

      var loadingClassName = this.options.loadingClassName;


      this.options.onBeforeLoad(arguments[0]);
      this.isTransitioning = true;
      document.body.classList.add(loadingClassName);

      return this.loadChunk(fullUrl, chunkUrl).then(function (_ref3) {
        var chunkContentEl = _ref3.chunkContentEl,
            meta = _ref3.meta;
        return _this3.applyChunk(chunkContentEl, _extends({}, storedMeta, meta), chunkTargetEl);
      }).then(function () {
        document.body.classList.remove(loadingClassName);
        _this3.isTransitioning = false;
        _this3.options.onLoad(_arguments[0]);
      }).catch(function (error) {
        document.body.classList.remove(loadingClassName);
        _this3.isTransitioning = false;

        _this3.options.onLoadError(_extends({
          error: error
        }, _arguments[0]));

        _this3.onLoadError(fullUrl, chunkTarget);
      });
    }
  }, {
    key: 'defaultOptions',
    get: function get() {
      return {
        error404ChunkUrl: null,
        loadingClassName: 'chunk-loading',
        chunkUrlSuffix: '__chunk/',
        scrollDebounceMs: 100,
        log: EMPTY_FN,
        onBeforeLoad: EMPTY_FN,
        onLoad: EMPTY_FN,
        onLoadError: EMPTY_FN
      };
    }
  }]);

  return ChunkLinks;
}();

exports.default = ChunkLinks;