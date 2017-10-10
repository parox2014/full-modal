## 安装

##### 引入样式
```html
<link rel="stylesheet" href="./dist/jquery.plugin.full-modal.min.css" type="text/css">

```

##### 引入js
```html
<script src="./dist/jquery.plugin.full-modal.min.js"></script>
```

## 使用

##### HTML
```html
<div class="ibs-full-modal-container" id="modal1">
  <div class="ibs-full-modal">
    <!--对话框头部-->
    <header class="ibs-modal-header">
      <h4 class="ibs-modal-title">对话框标题</h4>
      <span class="ibs-btn-close">&times;</span>
    </header>
    <div class="ibs-modal-body has-header has-footer">
     <!--内容放在这里-->
    </div>
    <!--对话框底部-->
    <div class="ibs-modal-footer text-right">
      <button class="btn btn-default" id="closeBtn">取消</button>
      <button class="btn btn-success">确定</button>
    </div>
  </div>
</div>
```
**应用插件**
```js
   $('.ibs-full-modal-container').fullModal({
      closeWhenClickBackdrop: true,
      duration:500,
      trigger:'',
      beforeOpen: function () {
        console.log('beforeOpen was invoked');
      },
      afterOpen: function () {
        console.log('afterOpen was invoked');
      },
      beforeClose: function () {
        console.log('beforeClose was invoked');
      },
      afterClose: function () {
        console.log('afterClose was invoke');
      }
    });
```

**为了适用在Iframe中的应用，在每个勾子执行的同时，会向父窗口发送消息，父窗口在接收到消息后，可作相应的处理**

```js
  window.addEventListener('message',function(e){
    if(e.origin==='xxx'){
      if(e.data===$.fn.fullModal.Events.BEFORE_OPEN){
        //do something
      }
    }
  });
```
共有四种消息,如下：
```ts
  interface Events{
    BEFORE_OPEN:string;
    BEFORE_CLOSE:string;
    AFTER_OPEN:string;
    AFTER_CLOSE:string;
  }
```

**打开对话框**

```js
  $('#modal1').fullModal('open');
```
**关闭对话框**

```js
  $('#modal1').fullModal('close');
```

**滚动内容到指定高度**

```js
//不传top，默认为0
  $('#modal1').fullModal('scrollTop',top?:number);
```

## API说明

```ts
  interface FullModalOption{
    closeWhenClickBackdrop?:boolean;
    trigger?:string;
    duration?:number;
    beforeOpen?:Function;
    afterOpen?:Function;
    beforeClose?:Function;
    afterClose?:Function;
  }
```

1. `closeWhenClickBackdrop`:`boolean`，点击遮罩层时，是否关闭对话框,默认：`true`,optional.
2. `trigger`: `string`,按钮的选择器，点击此按钮会打开对话框,如`#my-button`,optional.
2. `duration`:`number`,动画持续时间,默认:`300`,optional.
3. `beforeOpen`:`Function`,对话框打开之前调用,optional.
4. `afterOpen`:`Function`,对话框架打之后调用,optional.
5. `beforeClose`:`Function`,对话框关闭之前调用,optional.
6. `afterClose` :`Function`,对话框关闭之后调用,optional.
