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