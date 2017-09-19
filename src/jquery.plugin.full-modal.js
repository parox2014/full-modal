(function (global, $) {
  if (!$) throw new Error('请先加载jquery');
  
  const fullModalMapper = new Map();
  const modals=[];
  
  let backdrop;
  
  const ACTIVATED_ZINDEX=102;
  const DEACTIVATED_ZINDEX=101;
  
  class Backdrop {
    constructor(container, duration) {
      if (backdrop instanceof Backdrop) return backdrop;
      
      this.isOpen = false;
      this.duration = duration;
      this.container = $(container);
      this.initialize();
    }
    
    initialize() {
      let el = this.$el = $('<div class="ibs-backdrop"></div>');
      this.container.append(el);
      el.on('click',()=>{
        modals.forEach(item=>{
          if(item.option.closeWhenClickBackdrop){
            item.close();
          }
        })
      });
    }
    
    open() {
      this.$el.fadeIn(this.duration);
      this.isOpen = true;
    }
    
    close() {
      let openedModals=modals.filter(item=>item.isOpen);
      
      if(openedModals.length>1)return;
      
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
      this.isOpen = false;
      this.isActivated=false;
      this.backdrop = backdrop = new Backdrop('body', option.duration + 200);
      this.initialize();
    }
    
    initialize() {
      
      if (this.option.closeWhenClickBackdrop) {
        this.$el.on('click', () => this.close());
      }
      
      this.$modalEl.on('click', e => e.stopPropagation())
        .on('click', '.ibs-btn-close', () => this.close());
      
      this.$modalEl.css(autoprefixer('transition','all '+this.option.duration+'ms'));
    }
    
    open() {
      this.option.beforeOpen.call(this);
      
      this.activate();
      
      this.backdrop.open();
      
      this.$el.show();
      
      this.$modalEl.animate({
        background: '#fff'
      },this.option.duration,()=>{
        $('body').addClass('full-modal-open');
        this.option.afterOpen.call(this)
      }).css(autoprefixer('transform', 'translateX(0)'))
        .css({opacity:1});
      
      this.isOpen = true;
    }
    
    close() {
      this.option.beforeClose.call(this);
      this.backdrop.close();
      this.$modalEl.animate({
        background: 'transparent'
      },this.option.duration,()=>{
        $('body').removeClass('full-modal-open');
        this.option.afterClose.call(this);
        this.$el.hide();
        this.deactivate();
      })
        .css(autoprefixer('transform', 'translateX(30%)'))
        .css({opacity:0});
      
      this.isOpen = false;
    }
  
    activate(){
     
      modals.forEach(modal=>{
        if(modal===this){
          modal.isActivated=true;
          modal.$el.css({zIndex:ACTIVATED_ZINDEX});
        }else{
          modal.isActivated=false;
          modal.$el.css({zIndex:DEACTIVATED_ZINDEX});
        }
      });
    }
    
    deactivate(){
      this.isActivated=false;
      this.$el.css({zIndex:DEACTIVATED_ZINDEX});
    }
  }
  
  
  function uniqueId(prefix = 'full-modal-') {
    return `${prefix}${Date.now()}`;
  }
  
  function isString(str) {
    return typeof str === 'string';
  }
  
  function autoprefixer(cssname, value) {
    let prefixes=['webkit','moz','ms','o'];
    let cssRules={};
    
    prefixes.forEach(prefix=>{
      cssRules[`-${prefix}-${cssname}`]=value;
    });
    return cssRules;
  }
  
  const ALLOW_USER_INVOKES = ['open', 'close'];
  const defaults = {
    duration: 300,
    trigger: '',
    closeWhenClickBackdrop: true,
    beforeOpen: $.noop,
    beforeClose: $.noop,
    afterOpen: $.noop,
    afterClose: $.noop
  };
  
  $.fn.fullModal = function (options) {
    
    return this.each(function () {
      let $this = $(this);
      
      if (isString(options)) {
        
        let modal = fullModalMapper.get($this.data('uniqueId'));
        let method = options;
        
        if (modal) {
          
          if (ALLOW_USER_INVOKES.indexOf(method) < 0) {
            return console.error(`method:"${method}" is not allowed invoke on modal instance,expected method are ["open","close"]`);
          }
          
          return modal[method]();
        } else {
          return console.error('please initialize modal first');
        }
      }
      
      let option = $.extend(defaults, options);
      
      let id = uniqueId();
      let modal = new FullModal($this, option);
      
      $this.data('uniqueId', id);
      
      fullModalMapper.set(id, modal);
      modals.push(modal);
      
      if(option.trigger){
        $(option.trigger).on('click', function () {
          modal.open();
        });
      }
    });
  };
})(window, jQuery);