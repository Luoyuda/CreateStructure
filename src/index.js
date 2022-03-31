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