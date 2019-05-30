# deal book

## 项目启动
```
yarn install
```

### 热加载开发
```
yarn run serve / yarn serve
```

### 构建
```
yarn run build
```

> 公共部分的css,目前暂时只引入了原项目的reset.css 与 dashboard,放置在src/css/common中,
> 各自的Component组件的css建议也写到css文件中,通过@import引入
> image为原项目中的img,全部copy到了assets文件中,如果需要用到原项目的其他css,css中的图片引用地址需要修改到assets
> api文件夹用来将所有页面需要用到的api放入其中,方便进行管理查找

### 已经引入的模块
* jQuery  // 通过$直接使用
<!-- * layUI   // 在index引入了源文件,可直接使用 -->
* ElementUI // 按需引入,已经引入了大部分组件了,可在plugins/element-ui.config查看
* lodash  // 使用 _ 来调用其api
* i18n    // 国际化,使用的 vuex-i18n
* axios   // this.$axios,调用api时候请使用$api,$api为所有接口挂载点
* logger  // 使用了vue-logger
* eventBus // 使用new Vue生成新的vue实例用来进行事件触发

```js
  this.$log.debug('test', this.a, 123)
  this.$log.info('test', this.b)
  this.$log.warn('test')
  this.$log.error('test')
  this.$log.fatal('test')
```


#### package 已加入的依赖
* echart  // 使用时在Component上require对应模块即可
* dhtmlx-gantt   // 使用时 import 'dhtmlx-gantt'; @import "~dhtmlx-gantt/codebase/dhtmlxgantt.css";

```js
var echarts = require('echarts/lib/echarts');
// 引入柱状图
require('echarts/lib/chart/bar');
// 入提示框和标题组件
require('echarts/lib/component/tooltip');
require('echarts/lib/component/title');
// 按需引入参考: https://github.com/apache/incubator-echarts/blob/master/index.js
```

### 参考
[DHTMLX Gantt SamplesExample](https://docs.dhtmlx.com/gantt/samples/01_initialization/)

[DHTMLX Gantt APIs 参考](https://docs.dhtmlx.com/gantt/api__refs__gantt.html)

[Use DHTMLX Gantt with Vue.js](https://dhtmlx.com/blog/use-dhtmlxgantt-vue-js-framework-demo/)

[DHTML Gantt Initialization](https://docs.dhtmlx.com/gantt/desktop__initializing_gantt_chart.html)

[Vue Bus](https://github.com/yangmingshan/vue-bus#readme)

[Webpack](https://webpack.docschina.org/)

[规范参考](https://github.com/fex-team/styleguide)


