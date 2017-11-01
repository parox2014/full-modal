(function(global, $) {
  if (!$) throw new Error('请先加载jquery');

  const fullModalMapper = new Map();

  /**
   * @type {FullModal[]}
   */
  const modals = [];
  global.__UID__ = 0;
  let backdrop;

  const ACTIVATED_ZINDEX = 102;

  const DEACTIVATED_ZINDEX = 101;

  const Events = {
    BEFORE_OPEN: 'BEFORE_OPEN',
    BEFORE_CLOSE: 'BEFORE_CLOSE',
    AFTER_OPEN: 'AFTER_OPEN',
    AFTER_CLOSE: 'AFTER_CLOSE'
  };

  let parentWindow = global.parent || global;

  const ORIGIN ='*';

  modals.hasOpenedModal=function(){

    for(let i=0;i<this.length;i++){
      let item=this[i];
      console.log(item);
      if(item.isOpen){
        return true;
      }
    }
    return false;
  }

  function debounce(fn, delay = 100) {
    let t;
    return function() {
      window.clearTimeout(t);

      t = setTimeout(fn.bind(this), delay);
    };
  }

  class Backdrop {
    constructor(container, duration) {
      if (backdrop instanceof Backdrop) return backdrop;

      this.isOpen = false;
      this.duration = duration;
      this.container = $(container);
      this.initialize();
    }

    initialize() {
      let el = (this.$el = $('<div class="ibs-backdrop"></div>'));
      this.container.append(el);
      el.on('click', () => {
        modals.forEach(item => {
          if (item.option.closeWhenClickBackdrop) {
            item.close();
          }
        });
      });
    }

    open() {
      this.$el.fadeIn(this.duration);
      this.isOpen = true;
    }

    close() {
      let openedModals = modals.filter(item => item.isOpen);

      if (openedModals.length > 1) return;

      this.$el.fadeOut(this.duration);
      this.isOpen = false;
    }
  }

  class FullModal {
    /**
     * create a modal instance
     * @param el {jQuery|*}
     * @param option {Object}
     */
    constructor(el, option) {
      this.$el = el;
      this.option = option;
      this.$modalEl = this.$el.find('.ibs-full-modal');
      this.$modalBody = this.$el.find('.ibs-modal-body');
      this.isOpen = false;
      this.isActivated = false;
      this.isClosing = false;
      this.backdrop = backdrop = new Backdrop('body', option.duration + 200);
      this.initialize();
    }

    initialize() {
      if (this.option.closeWhenClickBackdrop) {
        this.$el.on('click', () => this.onCloseButtonClick());
      }

      this.$modalEl
        .on('click', e => e.stopPropagation())
        .on('click', '.ibs-btn-close', () => this.onCloseButtonClick());

      this.$modalEl.css(
        autoprefixer('transition', 'all ' + this.option.duration + 'ms')
      );
      this.setHeightWithWindowInnerHeight();
      window.addEventListener(
        'resize',
        debounce(this.setHeightWithWindowInnerHeight).bind(this)
      );
    }
    setHeightWithWindowInnerHeight() {
      let height = window.innerHeight;
      this.$el.height(height);
    }
    open() {
      let callback = () => {
        parentWindow.postMessage(Events.BEFORE_OPEN, ORIGIN);

        this.activate();

        this.backdrop.open();

        this.$el.show();

        this.$modalEl
          .animate(
            {
              background: '#fff'
            },
            this.option.duration,
            () => {
              $('body').addClass('full-modal-open');

              this.option.afterOpen.call(this);

              parentWindow.postMessage(Events.AFTER_OPEN, ORIGIN);
            }
          )
          .css(autoprefixer('transform', 'translateX(0)'))
          .css({
            opacity: 1
          });

        this.isOpen = true;
      };

      this.option.beforeOpen.call(this, callback);
    }
    scrollTop(top = 0) {
      this.$modalBody.scrollTop(top);
    }
    onCloseButtonClick() {
      if (this.isClosing) return;
      this.isClosing = true;
      this.option.beforeClose.call(this, this.close.bind(this));
    }
    close() {
      this.isClosing = false;
      parentWindow.postMessage(Events.BEFORE_CLOSE, ORIGIN);

      this.backdrop.close();

      this.$modalEl
        .animate(
          {
            background: 'transparent'
          },
          this.option.duration,
          () => {
            
            if(!modals.hasOpenedModal()){
              $('body').removeClass('full-modal-open');
            }

            this.option.afterClose.call(this);

            parentWindow.postMessage(Events.AFTER_CLOSE, ORIGIN);

            this.$el.hide();
            this.deactivate();
          }
        )
        .css(autoprefixer('transform', 'translateX(30%)'))
        .css({
          opacity: 0
        });

      this.isOpen = false;
    }

    activate() {
      modals.forEach(modal => {
        if (modal === this) {
          modal.isActivated = true;
          modal.$el.css({
            zIndex: ACTIVATED_ZINDEX
          });
        } else {
          modal.isActivated = false;
          modal.$el.css({
            zIndex: DEACTIVATED_ZINDEX
          });
        }
      });
    }

    deactivate() {
      this.isActivated = false;
      this.$el.css({
        zIndex: DEACTIVATED_ZINDEX
      });
    }
  }

  function uniqueId(prefix = 'fm_') {
    return `${prefix}${++global.__UID__}`;
  }

  function isString(str) {
    return typeof str === 'string';
  }

  function autoprefixer(cssname, value) {
    let prefixes = ['webkit', 'moz', 'ms', 'o'];
    let cssRules = {};

    prefixes.forEach(prefix => {
      cssRules[`-${prefix}-${cssname}`] = value;
    });
    return cssRules;
  }

  const ALLOW_USER_INVOKES = ['open', 'close', 'scrollTop'];
  const defaults = {
    duration: 300,
    trigger: '',
    closeWhenClickBackdrop: true,
    beforeOpen: function(callback) {
      callback();
    },
    beforeClose: function(callback) {
      callback();
    },
    afterOpen: $.noop,
    afterClose: $.noop
  };

  $.fn.fullModal = function(options, ...args) {
    return this.each(function() {
      let $this = $(this);

      if (isString(options)) {
        let uid = $this.data('uniqueId');
        let modal = fullModalMapper.get(uid);
        let method = options;
        // console.log('uid:',uid);
        if (modal) {
          if (ALLOW_USER_INVOKES.indexOf(method) < 0) {
            return console.error(
              `method:"${method}" is not allowed invoke on modal instance,expected method are [${ALLOW_USER_INVOKES.toString()}]`
            );
          }

          return modal[method].apply(modal, args);
        } else {
          return console.error('please initialize modal first');
        }
      }

      let option = $.extend({}, defaults, options);

      let id = uniqueId();
      let modal = new FullModal($this, option);
      // console.log(id);
      $this.data('uniqueId', id);

      fullModalMapper.set(id, modal);
      modals.push(modal);

      if (option.trigger) {
        $(option.trigger).on('click', function() {
          modal.open();
        });
      }
    });
  };

  $.fn.fullModal.Events = Events;

  $.fn.fullModal.Defaults = defaults;
})(window, jQuery);
