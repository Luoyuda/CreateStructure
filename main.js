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