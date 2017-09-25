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
**打开对话框**

```js
  $('#modal1').fullModal('open');
```
**关闭对话框**

```js
  $('#modal1').fullModal('close');
```
## API说明

1. `closeWhenClickBackdrop`:`boolean`，点击遮罩层时，是否关闭对话框,默认：`true`
2. `duration`:`number`,动画持续时间,默认:`300`.
3. `beforeOpen`:`Function`,对话框打开之前调用.
4. `afterOpen`:`Function`,对话框架打之后调用.
5. `beforeClose`:`Function`,对话框关闭之前调用.
6. `afterClose` :`Function`,对话框关闭之后调用.
