(function(global, $) {
  if (!$) throw new Error('请先加载jquery');

  /**
   * @property
   * @type {number}
   */
  global.__UID__ = 0;

  const parentWindow = global.parent || global;

  const Events = {
    BEFORE_OPEN: 'BEFORE_OPEN',
    BEFORE_CLOSE: 'BEFORE_CLOSE',
    AFTER_OPEN: 'AFTER_OPEN',
    AFTER_CLOSE: 'AFTER_CLOSE'
  };

  class Helpers {
    static uniqueId(prefix = 'fm_') {
      return `${prefix}${++global.__UID__}`;
    }

    static isString(str) {
      return typeof str === 'string';
    }

    static autoprefixer(cssname, value) {
      let prefixes = ['webkit', 'moz', 'ms', 'o'];
      let cssRules = {};

      prefixes.forEach(prefix => {
        cssRules[`-${prefix}-${cssname}`] = value;
      });
      return cssRules;
    }

    static debounce(fn, delay = 100) {
      let t;
      return function() {
        window.clearTimeout(t);

        t = setTimeout(fn.bind(this), delay);
      };
    }

    static isFunction(fn) {
      return typeof fn === 'function';
    }
  }

  class EventEmitter {
    constructor() {
      /**
       * @type {{[key:string]:Function[]}}
       */
      this._callbackMapper = {};
    }

    /**
     * 添加事件
     * @param {string} evt 事件名
     * @param {Function} callback 回调 
     */
    on(evt, callback) {
      let callbacks = this._callbackMapper[evt];

      if (Array.isArray(callbacks)) {
        return callbacks.push(callback);
      }
      this._callbackMapper[evt] = [callback];
    }

    /**
     * 移除事件
     * @param {string} evt 事件名
     * @param {Function} [callback] 回调，如不传，则移除所有回调  
     */
    off(evt, callback) {
      let callbacks = this._callbackMapper[evt];
      if (Helpers.isFunction(callback)) {
        return callbacks.splice(callbacks.indexOf(callback), 1);
      }

      this._callbackMapper[evt] = [];
    }

    /**
     * 触发事件
     * @param {string} evt 事件名
     * @param {any[]} args 需要传递的数据
     */
    emit(evt, ...args) {
      let callbacks = this._callbackMapper[evt];
      if (Array.isArray(callbacks)) {
        callbacks.forEach(callback => callback.apply(this, args));
      }
    }
  }

  class ModalManager {
    constructor() {
      /**
       * @type {FullModal[]}
       */
      this.modals = [];

      /**
       * @type {FullModal[]}
       */
      this.openedModals = [];
    }

    /**
     * 添加modal
     * @param {FullModal} modal FullModal实例
     */
    add(modal) {
      this.modals.push(modal);

      modal.on('on-open', target => {
        this.activateModal(target);
        this.openedModals.push(target);

        if (this.openedModals.length === 1) {
          $('html').addClass('full-modal-open');
        }
      });

      modal.on('on-close', target => {
        this.openedModals.pop();
        this.deactivateModal(target);
        if (!this.hasOpenedModal()) {
          $('html').removeClass('full-modal-open');
          Backdrop.singleton.close();
        }
      });
    }

    /**
     * 根据ID获取modal
     * @param {string|number} uid ModalId
     * @returns {FullModal}
     */
    getById(uid) {
      return this.modals.find(item => item.uid === uid);
    }

    /**
     * 根据id删除modal
     * @param {string|number} uid ModalId
     */
    removeById(uid) {
      let modal = this.getById(uid);
      let index = this.modals.indexOf(modal);
      this.modals.splice(index, 1);
    }

    /**
     * 当前是否还有打开的modal
     * @returns {boolean}
     */
    hasOpenedModal() {
      return this.openedModals.length > 0;
    }

    /**
     * 激活指定Modal，其它modal deactivate
     * @param {FullModal} modal FullModal实例
     */
    activateModal(modal) {
      modal.activate();
      this.openedModals.forEach(item => item.deactivate());
    }

    /**
     * deactiate 指定modal 自动激活它的前一个modal
     * @param {FullModal} modal FullModal实例
     */
    deactivateModal(modal) {
      modal.deactivate();

      let lastModal = this.openedModals[this.openedModals.length - 1];

      lastModal && lastModal.activate();
    }
  }

  class Backdrop extends EventEmitter {
    /**
     * @type {Backdrop}
     */
    static singleton = null;

    /**
     * 
     * @param {string} container 容器
     * @param {number} duration 动画持续时间
     */
    constructor(container, duration) {
      super();
      if (Backdrop.singleton instanceof Backdrop) return Backdrop.singleton;

      /**
       * @type {boolean}
       */
      this.isOpen = false;

      /**
       * @type {number}
       */
      this.duration = duration;

      /**
       * @type {JQuery<HTMLELement>}
       */
      this.container = $(container);

      this.initialize();

      Backdrop.singleton = this;
    }

    initialize() {
      let el = (this.$el = $('<div class="ibs-backdrop"></div>'));

      this.container.append(el);

      el.on('click', () => {
        this.emit('on-backdrop-click', this);
      });
    }

    open() {
      this.$el.fadeIn(this.duration);
      this.isOpen = true;
    }

    close() {
      this.$el.fadeOut(this.duration);
      this.isOpen = false;
    }
  }

  class FullModal extends EventEmitter {
    static ACTIVATED_ZINDEX = 102;

    static DEACTIVATED_ZINDEX = 101;
    /**
     * create a modal instance
     * @param {JQuery<HTMLElement>} el 
     * @param {Object} option
     * @param {number} option.duration
     * @param {string} option.trigger
     * @param {boolean} option.closeWhenClickBackdrop
     * @param {string} option.origin
     * @param {Function} option.beforeOpen
     * @param {Function} option.beforeClose
     * @param {Function} option.afterOpen
     * @param {Function} option.afterClose
     */
    constructor(el, option) {
      super();

      this.$el = el;
      this.option = option;

      /**
       * @type {JQuery<HTMLElement>}
       */
      this.$modalEl = this.$el.find('.ibs-full-modal');

      /**
       * @type {JQuery<HTMLElement>}
       */
      this.$modalBody = this.$el.find('.ibs-modal-body');

      /**
       * @type {boolean}
       */
      this.isOpen = false;

      /**
       * @type {boolean}
       */
      this.isActivated = false;

      /**
       * @type {boolean}
       */
      this.isClosing = false;

      /**
       * @type {Backdrop}
       */
      this.backdrop = new Backdrop('body', option.duration + 200);

      /**
       * @readonly
       * @type {string}
       */
      this.uid = Helpers.uniqueId();

      this.$el.data('uniqueId', this.uid);
      this.initialize();
    }

    initialize() {
      if (this.option.closeWhenClickBackdrop) {
        this.$el.on('click', () => this.onCloseButtonClick());
      }

      this.backdrop.on('on-backdrop-click', () => {
        if (this.option.closeWhenClickBackdrop && this.isActivated) {
          this.close();
        }
      });

      this.$modalEl
        .on('click', e => e.stopPropagation())
        .on('click', '.ibs-btn-close', () => this.onCloseButtonClick());

      this.$modalEl.css(
        Helpers.autoprefixer('transition', 'all ' + this.option.duration + 'ms')
      );

      if (this.option.trigger) {
        $(this.option.trigger).on('click', () => {
          this.open();
        });
      }

      this.setHeightWithWindowInnerHeight();
      window.addEventListener(
        'resize',
        Helpers.debounce(this.setHeightWithWindowInnerHeight).bind(this)
      );
    }
    setHeightWithWindowInnerHeight() {
      let height = window.innerHeight;
      this.$el.height(height);
    }

    scrollTop(top = 0) {
      this.$modalBody.scrollTop(top);
    }
    onCloseButtonClick() {
      if (this.isClosing) return;
      this.isClosing = true;
      this.option.beforeClose.call(this, this.close.bind(this));
    }

    open() {
      let callback = () => {
        let onAniationEnd = () => {
          this.option.afterOpen.call(this);
          parentWindow.postMessage(Events.AFTER_OPEN, this.option.origin);
        };

        let animationRules = {
          background: '#fff'
        };

        parentWindow.postMessage(Events.BEFORE_OPEN, this.option.origin);

        this.backdrop.open();

        this.$el.show();

        this.$modalEl.animate(
          animationRules,
          this.option.duration,
          onAniationEnd
        );

        this.$modalEl.css({
          transform: 'translateX(0)',
          opacity: 1
        });

        this.isOpen = true;
        this.emit('on-open', this);
      };

      this.option.beforeOpen.call(this, callback);
    }
    close() {
      let onAniationEnd = () => {
        this.option.afterClose.call(this);

        parentWindow.postMessage(Events.AFTER_CLOSE, this.option.origin);

        this.$el.hide();
        this.emit('on-close', this);
      };

      let animationRules = {
        background: 'transparent'
      };

      this.isClosing = false;

      parentWindow.postMessage(Events.BEFORE_CLOSE, this.option.origin);

      this.$modalEl.animate(
        animationRules,
        this.option.duration,
        onAniationEnd
      );
      this.$modalEl.css({
        transform: 'translateX(30%)',
        opacity: 0
      });

      this.isOpen = false;
    }

    activate() {
      this.isActivated = true;
      this.$el.css({
        zIndex: FullModal.ACTIVATED_ZINDEX
      });
    }

    deactivate() {
      this.isActivated = false;
      this.$el.css({
        zIndex: FullModal.DEACTIVATED_ZINDEX
      });
    }
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
    origin: '*',
    afterOpen: $.noop,
    afterClose: $.noop
  };

  const modalManager = new ModalManager();

  /**
  * @param {Object} options
  * @param {number} options.duration 动画持续时间
  * @param {string} options.trigger 触发器
  * @param {boolean} options.closeWhenClickBackdrop 点击backdrop时，是否关闭当前modal
  * @param {string} options.origin 向父窗口发送消时，需要的来源域名
  * @param {Function} options.beforeOpen modal打开之前的勾子
  * @param {Function} options.beforeClose modal关闭之前的勾子
  * @param {Function} options.afterOpen modal打开之后的勾子
  * @param {Function} options.afterClose modal关闭之后的勾子
  * @param {any[]} args
  */
  $.fn.fullModal = function(options, ...args) {
    return this.each(function() {
      let $this = $(this);

      if (Helpers.isString(options)) {
        let uid = $this.data('uniqueId');
        let modal = modalManager.getById(uid);
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

      let modal = new FullModal($this, option);

      modalManager.add(modal);
    });
  };

  $.fn.fullModal.Events = Events;

  $.fn.fullModal.Defaults = defaults;
})(window, jQuery);
