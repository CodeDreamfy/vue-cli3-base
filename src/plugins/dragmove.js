/* eslint-disable */
const win = window;
export default {
  bind(el, binding) {
    binding.uid = el.getAttributeNode('data-uid').value;
  },
  inserted(el, binding) {
    let parentNode = el.parentNode;
    let callHandObj = null;
    // let isShow = false;
    if (typeof binding.value === 'object') {
      callHandObj = binding.value;
      parentNode = callHandObj.parentNode;
      // isShow = callHandObj.isShow;
    }
    binding.isMouseDown = false;
    binding.timer = null;
    binding.parentNode = parentNode;
    binding.mouseClickPosition = {
      mouseX: 0,
      mouseY: 0,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };
    // 获取父元素大小
    binding.getParentSize = (elem) => {
      if (elem) {
        const style = window.getComputedStyle(elem, null);
        const { top, left, width, height } = style;
        return {
          w: parseInt(width === 'auto' ? 0 : width, 10),
          h: parseInt(height === 'auto' ? 0 : width, 10),
          t: parseInt(top === 'auto' ? 0 : width, 10),
          l: parseInt(left === 'auto' ? 0 : width, 10),
        };
      }
      return [0, 0];
    }
    // 添加事件
    binding.addEvent = (elm, event, handler) => {
      if (!elm) {
        return false;
      }
      if (elm.attachEvent) {
        elm.attachEvent(`on${event}`, handler);
      } else if (elm.addEventListener) {
        elm.addEventListener(event, handler, false);
      } else {
        elm[`on${event}`] = handler;
      }
    }
    // 删除事件
    binding.removeEvent = (elm, event, handler) => {
      if (!elm) {
        return;
      }
      if (elm.detachEvent) {
        elm.detachEvent(`on${event}`, handler);
      } else if (elm.removeEventListener) {
        elm.removeEventListener(event, handler, true);
      } else {
        elm[`on${event}`] = null;
      }
    }
    // 鼠标按下
    binding[`elementDown${binding.uid}`] = (e) => {
      const target = e.target || e.srcElement;
      if (el.contains(target)) {
        binding.isMouseDown = true;
        binding.mouseClickPosition.mouseX = e.touches
          ? e.touches[0].pageX
          : e.pageX;
        binding.mouseClickPosition.mouseY = e.touches
          ? e.touches[0].pageY
          : e.pageY;
        const { t, l, w, h } = binding.getParentSize(el);
        binding.mouseClickPosition.left = el.offsetLeft;
        binding.mouseClickPosition.top = el.offsetTop;
        binding.mouseClickPosition.width = el.offsetWidth;
        binding.mouseClickPosition.height = el.offsetHeight;
        binding.bounds = binding.calcDragLimits();
        // console.log("binding.bounds", binding.mouseClickPosition)
      }
    }
    binding.computeDiff = (e) => {
      const { mouseClickPosition } = binding;
      const tmpDeltaX = (e.touches ? e.touches[0].pageX : e.pageX) - mouseClickPosition.mouseX;
      const tmpDeltaY = (e.touches ? e.touches[0].pageY : e.pageY) - mouseClickPosition.mouseY;
      return [tmpDeltaX, tmpDeltaY];
    }
    // 鼠标移动
    win[`elementMove${binding.uid}`]= (e) => {
      if (binding.timer) {
        window.cancelAnimationFrame(binding.timer);
      }
      binding.timer = window.requestAnimationFrame(() => {
        const target = e.target || e.srcElement;
        if (binding.isMouseDown && el.contains(target)) {
          const diff = binding.computeDiff(e);
          binding.calcBound(...diff);
        }
      });
    }
    binding.calcBound = (diffx, diffy) => {
      let computeLeft = 0;
      let computeTop = 0;
      const { left, top } = binding.mouseClickPosition;
      const {
        minLeft, maxLeft, minTop, maxTop,
      } = binding.bounds;
      if (left + diffx < minLeft) {
        computeLeft = minLeft;
      } else if (left + diffx > maxLeft) {
        computeLeft = maxLeft;
      } else {
        computeLeft = left + diffx;
      }
      if (top + diffy < minTop) {
        computeTop = minTop;
      } else if (top + diffy > maxTop) {
        computeTop = maxTop;
      } else {
        computeTop = top + diffy;
      }
      // console.log('mousedown', computeLeft)
      el.style.left = `${computeLeft}px`;
      el.style.top = `${computeTop}px`;
    }
    binding.calcDragLimits = () => {
      return {
        minLeft: 0,
        maxLeft: binding.parentStyle.w - binding.mouseClickPosition.width,
        minTop: 0,
        maxTop: binding.parentStyle.h - binding.mouseClickPosition.height,
      };
    }
    binding.parentStyle = binding.getParentSize(parentNode);
    // console.log('parentStyle', binding.parentStyle);
    binding[`mouseupHandle${binding.uid}`]= (e) => {
      // const target = e.target || e.srcElement;
      if (binding.isMouseDown) {
        binding.mouseClickPosition.mouseX = e.touches
          ? e.touches[0].pageX
          : e.pageX;
        binding.mouseClickPosition.mouseY = e.touches
          ? e.touches[0].pageY
          : e.pageY;
        binding.mouseClickPosition.left = el.offsetLeft;
        binding.mouseClickPosition.top = el.offsetTop;
        binding.isMouseDown = false;
      }
    };
    binding[`mouseleaveHandle${binding.uid}`] = (e) => {
      // const target = e.target || e.srcElement;
      // if (!target.contains(el)) {
        // console.log("mouseleaveHandle")
        binding.isMouseDown = false;
      // }
    };
    binding.addEvent(el, 'mousedown', binding[`elementDown${binding.uid}`]);
    binding.addEvent(document.documentElement, 'mousemove', win[`elementMove${binding.uid}`]);
    binding.addEvent(el, 'mouseup', binding[`mouseupHandle${binding.uid}`]);
    binding.addEvent(el, 'mouseleave', binding[`mouseleaveHandle${binding.uid}`]);
  },
  unbind(el, binding) {
    if (binding[`elementDown${binding.uid}`]) {
      console.log("unbind binding")
      binding.removeEvent(el, 'mousedown', binding[`elementDown${binding.uid}`]);
      binding.removeEvent(document.documentElement, 'mousemove', win[`elementMove${binding.uid}`]);
      binding.removeEvent(el, 'mouseup', binding[`mouseupHandle${binding.uid}`]);
      binding.removeEvent(el, 'mouseleave', binding[`mouseleaveHandle${binding.uid}`]);
    }
  }
};
