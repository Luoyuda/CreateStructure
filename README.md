---
title: 半自动骨架屏工具
tags: 
 - 效率工具
 - 骨架屏
categories:
 - 技术
comments: true
date: 2020-06-13 19:23
---
# 解决问题
  
解决活动页面白屏问题
  
# 设计思路

假设这是个活动页面

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fde09885adbd4f3eb9bab3e79a7539fe~tplv-k3u1fbpfcp-watermark.image?)

目标生成这样的骨架屏，通过 `copy` 按钮复制 `HTML` 代码插入到页面中

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44ce28dcde264d60803b32efe1e06266~tplv-k3u1fbpfcp-watermark.image?)

目标

1. 执行方法时分析页面节点，挑选白名单节点
2. 递归处理节点
3. 将节点绘制到页面中
4. 点击按钮复制骨架屏代码

## util.js

```js
const animationConf = {
  loading: {
    keyframe: 'loading { to { background-position-x: -20%; } }',
    needDelay: false,
    styles: {
      backgroundColor: '#ecf0f2',
      background: 'linear-gradient( 100deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, .5) 50%, rgba(255, 255, 255, 0) 60% ) #ecf0f2',
      backgroundSize: '200% 100%',
      backgroundPositionX: '180%',
      animation: '2s loading ease-in-out infinite'
    },
  },
  flash: {
    keyframe: 'flash {from,50%,to{opacity: 1;}25%,75% {opacity: 0.5;}}',
    needDelay: true,
    styles: {
      backgroundColor: '#ecf0f2',
      animation: 'flash 3s infinite',
    },
  },
}
// 获取默认配置
export const getDefault = () => {
  return {
    include: ['audio', 'button', 'canvas', 'code', 'img', 'input', 'pre', 'svg', 'textarea', 'video'],
    w: window.innerWidth,
    h: window.innerHeight,
    boxId: 'bone',
    boxStyle: `position: fixed;width: 100%;height: 100%;background-color: #fff;top: 0;z-index: 100000;`,
    delay: 0.3,
    beforeCreateOption: (() => false),
    styles: {
      position: 'fixed',
      zIndex: 1000000,
      background: '#ecf0f2',
      animation: 'flash 3s infinite'
    }
  }
}
export const useAnimation = (animation, config) => {
  const animate = animationConf[animation]
  config.keyframe = animate.keyframe
  return { ...config.styles, ...animate.styles }
}


// 获取节点css样式
export const getStyle = el => {
  if(el.nodeType !== 1) return () => ''
  const computedStyle = getComputedStyle(el)
  return attr => computedStyle[attr]
}

// 百分比
export const percent = (x, y) => parseFloat(x / y * 100).toFixed(3)

// 是否隐藏元素
export const isHidden = (style, node) => style('display') === 'none' || style('visibility') === 'hidden' || style('opacity') == 0 || node.hidden;

// 是否有背景图
export const hasBackgroundUrl = style => !!(style('backgroundImage').match(/url\(.+?\)/) || []).length

// 是否有背景颜色
export const hasBackgroundColor = style => !!(style('backgroundColor'))

// 是否圆角
export const hasBorderRadius = style => !!(-style('border-radius').replace('px', ''))

// 获取圆角
export const getBorderRadius = style => !hasBorderRadius(style) ? `5px` : style('border-radius')

// 获取node节点位置大小
export const getRect = node => node ? node.getBoundingClientRect() : {}

// 是否文本节点
export const isTextNode = node => node.textContent.trim().length && node.nodeType === 1 && !node.children.length

// 是否子元素为文本节点
export const hasChildText = node => [...node.children].some(item => isTextNode(item)) && node.children.length === 1

export const inWhite = (els, node) => els.includes(node.tagName.toLocaleLowerCase())

// 获取node
export const getRootNode = (el) => {
  el = el || document.body
  return typeof el === 'object' ?	el : 
    (typeof el === 'string' ?	document.querySelector(el):	null);
}

// 获取padding
export const getPadding = style => {
  return {
    paddingTop: parseInt(style('paddingTop')),
    paddingLeft: parseInt(style('paddingLeft')),
    paddingBottom: parseInt(style('paddingBottom')),
    paddingRight: parseInt(style('paddingRight'))
  }
}

// 转换css属性
export const transformStyle = (str, replace='-') => {
  var temp = str.replace(/[A-Z]/g, (match) => {	
    return replace + match.toLowerCase();
  });
  if(temp.slice(0,1) === replace){ //如果首字母是大写，执行replace时会多一个_，这里需要去掉
    temp = temp.slice(1);
  }
  return temp;
}

// 绘制节点
export const drawBlock = (styles = {}) => Object.entries(styles).reduce((prev,[key, value]) => `${prev}${transformStyle(key)}:${value};`, '<div style="') + `"></div>`

// 合并配置
export const margeOptions = (option, useOption, node) => {
  // 处理diy配置
  const diy = useOption(node, option)
  // 显示不渲染
  if(diy === null || JSON.stringify(diy) === '{}') return null
  const options = typeof diy === 'object' ? diy : option
  return options
}
```

## index.js

```js
import { getDefault, useAnimation, getStyle, 
  percent, isHidden, hasBackgroundUrl, hasBackgroundColor, 
  hasBorderRadius, getBorderRadius, getRect, isTextNode, 
  hasChildText, inWhite, getRootNode, getPadding, 
  drawBlock,margeOptions } from './util'

class CreateStructure {
  constructor(options = {}){
    this.node = getRootNode(options.node)
    // 初始化配置
    this.config = {
    ...getDefault(), 
    ...options
    }
    this.blocks = []
  }
  // 处理节点
  deal(animate='flash'){
    // 使用什么动画
    useAnimation(animate, this.config)
    // div数组
    this.blocks = []
    // 动画延迟时间
    const { delay, beforeCreateOption, include } = this.config
    let delayTime = 0
    // 递归节点
    this.deepFindNode(this.node.children, node => {
      const style = getStyle(node)
      // 过滤隐藏的节点
      if(isHidden(style, node)) return
      /**
      * 绘制目标
      * 1. 有背景图片的节点
      * 2. 有背景颜色且有圆角的节点
      * 3. 文本节点
      * 4. 子节点为文本节点
      * 5. 在需要绘制的标签内的节点
      */
      if(
        hasBackgroundUrl(style) || 
        (hasBackgroundColor(style) && hasBorderRadius(style)) || 
        isTextNode(node) || 
        hasChildText(node) ||
        inWhite(include, node)
      ){
        // 获取默认配置
        const option = this.defaultOptions(node)
        // 过滤不在当前的屏幕内的元素
        if(!option) return
        // 判断动画是否需要延迟
        option.animationDelay = delayTime + 's'
        delayTime = parseInt((delayTime + delay) * 10000) / 10000
        const options = margeOptions(option, beforeCreateOption, node)
        if(!options) return
        // 绘制每个节点
        this.blocks.push(drawBlock(options))
        return true
      }
    })
  }
  // 递归节点
  deepFindNode(nodes=[], deal=()=>{}){
    nodes = [...nodes]
    if(nodes.length){
      nodes.forEach(el => {
        const children = el.children
        if(!deal(el) && children.length){
        this.deepFindNode(children, deal)
        }
      });
    }
  }
  // 默认配置
  defaultOptions(node){
    const { width, height, top, left } = getRect(node)
    const { w, h } = this.config
    if((width >= w && height >= h) || top > h || left > w) return null
    const style = getStyle(node)
    const { paddingTop, paddingLeft, paddingBottom, paddingRight, } = getPadding(style)
    this.config.styles = {
      ...this.config.styles,
      width: percent(width - paddingLeft - paddingRight, w) + '%',
      height: percent(height - paddingTop - paddingBottom - (height / 30), h) + '%',
      top: percent(top + paddingTop, h) + '%',
      left: percent(left + paddingLeft, w) + '%',
      borderRadius: getBorderRadius(style),
    }
    return this.config.styles
  }
  // 绘制方法
  draw(){
    if (!this.blocks.length) return
    const { body } = document;
    const { keyframe='', boxStyle, boxId } = this.config
    const blocksHTML = this.blocks.join('');
    const div = document.createElement('div');
    div.id = boxId
    div.style = boxStyle
    let html = `<style>@keyframes ${keyframe}@-webkit-keyframes ${keyframe}</style><button style='position: fixed;z-index: 10000000;left: 10px;top: 10px;' class='copy-btn'>copy HTML</button>${blocksHTML}`
    div.innerHTML = html
    body.appendChild(div);
    setTimeout(() => {
      new ClipboardJS('.copy-btn', {
        text: () => this.getHtml()
      });
    }, 10)
  }
  // 获取html内容
  getHtml(data={}){
    let { html='' } = data
    const { boxStyle, boxId } = this.config
    const bone = document.getElementById(boxId)
    html = html || bone.innerHTML
    return `<div id='${boxId}' style="${boxStyle}">${html}</div><script>window.closeBone = function(e){var _b = document.getElementById('${boxId}');(_b && _b.remove())}</script>`;
  }
}
export default CreateStructure
```

## 使用
```js
import CreateStructure from './src/index'

setTimeout(() => {
  window.cs = new CreateStructure({
    boxStyle: `position: fixed;width: 100%;height: 100%;background-color: #ddd;top: 0;z-index: 100000;`,
    delay: 0.2,
    beforeCreateOption(node, option){
    }
  })
  cs.deal()
  cs.draw()
}, 1000)
```