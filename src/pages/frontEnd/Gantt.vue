<template>
  <div class="gantt-wrap" v-loading="isGanttLoadding">
    <work-plan-tree
      ref="workplantree"
      :critical="criticalBtn"
      :scrollValue="scrollValue"
      @scrollTo="scrollToGantt"
      @expandAll="expandAll"
      @addChild="addChildHandle"
      @changeTriggerStatus="changeTriggerStatus"
      @criticalHandle="getTreeData"
      @activeRowHandle="activeRowHandle"
      @loadChild="loadChild"
      @upLoadTree="getTreeData"
      @changeProp="changeProp"
      @changeDependency="changeDepency"
      @delWorkItem="delWorkItemHandle"
      @changeTree="changeTree"
    ></work-plan-tree>
    <div class="gantt" ref="gantt" id="gantt_here"></div>
    <template v-show="false">
      <GanttTooltip
        v-for="tooltip in tooltipList"
        :ref="`tooltip${tooltip.id}`"
        :data-uid="tooltip.id"
        :task="tooltip"
        v-drag-move="dragmoveObj"
        @closeTooltip="removeTooltipHandle"
        :key="tooltip.key"
      ></GanttTooltip>
    </template>
  </div>
</template>

<script>
import 'dhtmlx-gantt';
// import 'dhtmlx-gantt/codebase/ext/dhtmlxgantt_tooltip';
import WorkPlanTree from '@/components/WorkItemWrap.vue';
// import mockData from '@/mock/gantt';

export default {
  name: 'gantt',
  data() {
    return {
      tasks: {
        data: [],
        links: [],
      },
      statusColorList: {
        NOT_STARTED: 'color-0',
        ON_TRACK: 'color-1',
        AT_RISK: 'color-2',
        OFF_TRACK: 'color-3',
        COMPLETE: 'color-4',
        ABANDONED: 'color-5',
      },
      ganttRefresh: false,
      currTask: {},
      tooltipList: [],
      tooltipIdList: [],
      ganttTreeRect: {},
      ganttEvent: [],
      isGanttLoadding: false,
      ganttTreeData: [],
      ganttTreeIds: [],
      treeData: [],
      isGanttClickScroll: false,
      scrollValue: 0,
      isTriggerScroll: false,
      isDestroy: false,
      dragmoveObj: null,
    };
  },
  components: {
    WorkPlanTree,
    GanttTooltip,
  },
  computed: {
    currWorkItemId() {
      return this.$store.state.currWorkItemId;
    },
    criticalBtn() {
      return this.$store.state.critical;
    },
    workItemData() {
      return this.$store.state.workItemTree;
    },
    projectId() {
      return this.$route.params.projectId;
    },
    workPlanRights() {
      return this.$store.state.workPlanRights;
    },
  },
  watch: {
    projectId() {
      this.getTreeData();
    },
  },
  methods: {
    checkPremission(id, type) {
      const ownerPremission = this.workPlanRights[id] || [];
      const str = `dealbook.workplan.WorkItem.${type}`;
      return ownerPremission.indexOf(str) > -1;
    },
    changeTree(data) {
      this.treeData = data;
      this.ganttTreeIds = this.collectTreeIds(data);
      this.tasks = this.assemblyData(this.ganttTreeData);
      this.$nextTick(() => {
        this.drawGantt(this.tasks);
      });
    },
    changeTriggerStatus(status) {
      this.isTriggerScroll = status;
    },
    activeRowHandle(id) {
      if (gantt.isTaskExists(id)) {
        // const task = gantt.getTask(id);
        // gantt.showTask(id);
        gantt.unselectTask(gantt.getSelectedId());
        this.$nextTick(() => {
          this.isScreenVisible(id);
        });
        gantt.selectTask(id);
      }
    },
    assemblyData(nodeData) {
      const result = {};
      result.data = [];
      result.links = [];
      result.minDate = 0;
      result.maxDate = 0;
      const self = this;
      nodeData.forEach((node) => {
        const task = {
          id: node.id,
          text: node.name,
          $level: node.level,
          status: node.status,
          parent: node.parentId,
          rootWorkItemId: node.rootWorkItemId,
        };
        task.treeData = JSON.parse(JSON.stringify(node));
        if (node.startDate && node.endDate) {
          if (result.minDate === 0 || result.minDate > node.startDate) {
            result.minDate = node.startDate;
          }
          if (result.maxDate < node.endDate) {
            result.maxDate = node.endDate;
          }
          if (node.level === 2) {
            task.start_date = self.$dayjs(node.startDate).format('DD-MM-YYYY');
            task.end_date = self
              .$dayjs(node.endDate)
              .format('DD-MM-YYYY  HH:mm:ss');
          } else {
            task.start_date = self.$dayjs(node.startDate).format('DD-MM-YYYY');
            task.end_date = self
              .$dayjs(node.endDate)
              .format('DD-MM-YYYY  HH:mm:ss');
          }
        } else {
          task.unscheduled = true;
        }
        if (Array.isArray(node.dependencyList)) {
          node.dependencyList.forEach((depend) => {
            result.links.push({
              id: _.uniqueId(),
              source: node.id,
              target: depend.dependentId,
              color: depend.color,
              type: depend.type,
              lag: depend.lagDays,
              $level: node.level,
              parentId: node.parentId,
            });
          });
        }
        if (node.level === 0) {
          task.type = 'project';
        }
        if (node.level === 2) {
          task.type = 'milestone';
          task.criticalPath = Boolean(+node.criticalPath);
        }
        if (this.ganttTreeIds.includes(node.id)) {
          task.open = true;
        }
        result.data.push(task);
        if (Array.isArray(node.childList)) {
          const childResult = self.assemblyData(node.childList);
          result.data = [].concat(result.data, childResult.data);
          result.links = [].concat(result.links, childResult.links);
          if (result.minDate > childResult.minDate) {
            result.minDate = childResult.minDate;
          }
          if (result.maxDate < childResult.maxDate) {
            result.maxDate = childResult.maxDate;
          }
        }
      });
      return result;
    },
    drawGantt(resultData) {
      // if (!this.ganttRefresh) {
      //   this.ganttRefresh = true;
      //   return false;
      // }
      // debugger;
      const isCN = this.$store.state.currLanguage === 'zh-CN';
      function dayScaleTemplate(date) {
        const cnWeek = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dateToStr = gantt.date.date_to_str;
        if (isCN) {
          return `${dateToStr('%d')(date)} ${cnWeek[date.getDay()]}`;
        }
        return dateToStr('%d %D')(date);
      }
      Object.assign(gantt.config, {
        scale_height: 49,
        row_height: 51,
        task_height: 28,
        min_column_width: 60,
        drag_progress: false,
        // drag_resize: false,
        drag_links: false,
        drag_move: true,
        quickinfo_buttons: false,
        scale_unit: 'month',
        date_scale: isCN ? '%Y年 %m月' : '%F, %Y',
        // fit_tasks: true,
        subscales: [
          { unit: 'day', step: 1, template: dayScaleTemplate },
        ],
        links: {
          start_to_start: 'S-S',
          finish_to_start: 'F-S',
          finish_to_finish: 'F-F',
          start_to_finish: 'S-F',
        },
        show_errors: false,
        smart_rendering: true,
        show_progress: false,
        // show_task_cells: false,
      });

      // gantt.config.drag_resize = false;
      gantt.config.layout = {
        css: 'gantt_container',
        cols: [
          // {
          //   width: 1,
          //   min_width: 1,
          //   rows: [
          //     {
          //       view: 'grid', scrollX: 'gridScroll', scrollable: true, scrollY: 'scrollVer',
          //     },
          //     { view: 'scrollbar', id: 'gridScroll', group: 'horizontal' },
          //   ],
          // },
          {
            rows: [
              { view: 'timeline', scrollX: 'scrollHor' },
              { view: 'scrollbar', id: 'scrollHor', height: 8 },
            ],
          },
          // { view: 'scrollbar', id: 'scrollVer' },
        ],
      };

      // gantt.templates.quick_info_content = (start, end, task) => task.text;
      // console.log('resultData', resultData);
      gantt.templates.task_class = (start, end, task) => {
        if (task.$level === 0) return 'level-0';
        if (task.$level === 2) return 'milestone';
        return `${this.statusColorList[task.status]} gantt_task_text`;
      };
      gantt.templates.task_text = (start, end, task) => {
        if (task.$level === 2) return '';
        return task.text;
      };
      gantt.templates.leftside_text = (start, end, task) => {
        if (task.$level === 2) {
          return '';
        }
        return this.$dayjs(start).format('DD-MMM-YYYY');
      };
      gantt.templates.rightside_text = (start, end, task) => {
        if (task.$level === 2) {
          const color = this.statusColorList[task.status];
          const isCritical = task.criticalPath ? '' : 'display: none';
          return `<div class="milestone-side">
              <div class="diamond ${color}">
                <i class="border-${color}" style="${isCritical}"></i>
              </div>
              <span>${this.$dayjs(end).format('DD-MMM-YYYY')}</span>
            </div> `;
        }
        return this.$dayjs(end).format('DD-MMM-YYYY');
      };
      gantt.templates.task_row_class = (start, end, task) => {
        if (gantt.isTaskExists(task.id) && gantt.isSelectedTask(task.id)) {
          return 'gantt_selected';
        }
        return '';
      };
      gantt.config.show_errors = false;
      // gantt.templates.quick_info_content = (start, end, task) => task.text;
      $('#gantt_here').empty();
      // $('#gantt_here').hide();
      gantt.templates.link_class = (link) => {
        if (link.color === 'GREEN') {
          return 'green-line';
        }
        return 'red-line';
      };
      gantt.init('gantt_here');
      gantt.clearAll();
      this.clearAllEvent();
      const ganttWrap = $('.grid_cell .gantt_layout_content');
      // ganttWrap.hide();
      // const $tree = $(this.$refs.workplantree);
      ganttWrap.empty();
      // ganttWrap.appendTo($tree);
      // $('#gantt_here').show();
      console.time('drawGantt');
      gantt.config.start_date = new Date(
        resultData.minDate - 1000 * (2 * 24 * 3600),
      );
      gantt.config.end_date = new Date(
        resultData.maxDate + 2 * (24 * 60 * 60) * 1000,
      );
      gantt.parse(resultData);
      if (gantt.isTaskExists(this.currWorkItemId)) {
        gantt.showTask(this.currWorkItemId);
        gantt.selectTask(this.currWorkItemId);
      }
      console.timeEnd('drawGantt');
      this.attachEventGantt();
      // gantt.scrollTo(null, 0);
      // this.ganttRefresh = false;
      // gantt.refreshData();
      return true;
    },
    attachEventGantt() {
      const eventList = [];
      eventList[0] = gantt.attachEvent('onTaskClick', (id, event) => {
        event.preventDefault();
        event.stopPropagation();
        this.isGanttClickScroll = true;
        const className = event.target.getAttribute('class');
        if (className !== 'gantt_task_content') {
          return false;
        }
        const currItem = this.tooltipIdList.indexOf(+id);
        if (currItem > -1) {
          return false;
        }
        const task = gantt.getTask(id);
        // gantt.showTask(id);
        this.selectTask(id);
        const taskObj = Object.assign(task, {
          key: _.uniqueId(),
          name: task.treeData.name,
          criticalPath: task.treeData.criticalPath,
          endDate: task.treeData.endDate,
          serialNumber: task.treeData.serialNumber,
          rootName: this.getWorkItemName(task.rootWorkItemId),
          dependOnWorkitemNameList: task.treeData.dependencyWorkStreamName,
        });
        if (task.$level < 2) {
          return false;
        }
        let ids = 0;
        if (this.tooltipIdList.length >= 2) {
          ids = this.tooltipIdList.shift(0);
          // this.tooltipList.splice(0, 1);
          // this.removeTooltip(this.$refs[`tooltip${+ids}`]);
        }
        this.dragmoveObj = {
          parentNode: $('.gantt_task_bg').get(0),
          isShow: task.level >= 2,
        };
        this.tooltipIdList.push(+id);
        this.tooltipList.push(JSON.parse(JSON.stringify(taskObj)));
        this.$nextTick(() => {
          if (ids) {
            this.tooltipList.shift(0);
          }
          this.addTooltipLayer(id);
        });
        return false;
      });
      eventList[1] = gantt.attachEvent('onTaskDblClick', (id, event) => {
        event.preventDefault();
        return false;
      });
      eventList[2] = gantt.attachEvent('onGanttScroll', () => {
        const scrollRect = gantt.getScrollState();
        const self = this;

        if (!this.isTriggerScroll) {
          // eslint-disable-next-line
          window.requestAnimationFrame(function() {
            self.scrollValue = scrollRect.y;
          });
        }
      });
      eventList[3] = gantt.attachEvent('onTaskRowClick', (id, event) => {
        event.stopPropagation();
        event.preventDefault();
        this.isGanttClickScroll = true;
        return false;
      });
      eventList[4] = gantt.attachEvent('onTaskDrag', () => false);
      eventList[5] = gantt.attachEvent('onRowDragStart', (id, event) => {
        event.preventDefault();
        return false;
      });
      eventList[6] = gantt.attachEvent('onScaleClick', (e) => {
        e.preventDefault();
        return false;
      });
      eventList[7] = gantt.attachEvent('onGanttRender', () => {
        const ganttWrap = $('.grid_cell .gantt_layout_content');
        ganttWrap.empty();
        const task = gantt.isTaskExists(this.currWorkItemId);
        this.isGanttClickScroll = false;
        if (task) {
          gantt.showTask(this.currWorkItemId);
          gantt.selectTask(this.currWorkItemId);
        }
      });
      eventList[8] = gantt.attachEvent('onParse', () => {
        if (this.isDestroy) {
          $('.gantt-wrap').hide();
          return false;
        }
        return true;
      });
      eventList[9] = gantt.attachEvent('onBeforeTaskDisplay', () => {
        if (this.isDestroy) {
          return false;
        }
        return true;
      });
      eventList[10] = gantt.attachEvent('onTaskLoading', () => {
        if (this.isDestroy) {
          return false;
        }
        return true;
      });
      eventList[11] = gantt.attachEvent('onLoadStart', () => {
        // console.log('heiheeiheih');
        if (this.isDestroy) {
          $('.gantt-wrap').hide();
          return false;
        }
        return true;
      });
      eventList[12] = gantt.attachEvent('onBeforeTaskDrag', (id, mode) => {
        const flag = this.checkPremission(+id, 'editWorkItem');
        const task = gantt.getTask(id);
        const level = task.$level;
        if (flag) {
          if (level === 2 && flag && mode === 'move') {
            return true;
          }
          if (level > 0 && level !== 2 && /^(resize|move)$/.test(mode)) {
            return true;
          }
        }
        return false;
      });
      // eventList[13] = gantt.attachEvent('onTaskDrag', (id, mode, task, original, event) => {
      // });
      eventList[13] = gantt.attachEvent('onLinkDblClick', () => false);
      eventList[14] = gantt.attachEvent('onAfterTaskDrag', (id, mode) => {
        // console.log('onAfterTaskDrag', id, mode, e.target);
        this.changeTreeDate(id, mode);
      });
      eventList[15] = gantt.attachEvent('onBeforeGanttRender', () => {
        // gantt.config.start_date = new Date(resultData.minDate - 1000 * (2 * 24 * 3600));
        // gantt.config.end_date = new Date(resultData.maxDate - 1000 * (2 * 24 * 3600));
        if (this.isDestroy) {
          $('.gantt-wrap').hide();
          return false;
        }
        return true;
      });
      eventList[16] = gantt.attachEvent('onLinkClick', () => false);
      this.ganttEvent = eventList;
    },
    clearAllEvent() {
      this.ganttEvent.forEach((el) => {
        gantt.detachEvent(el);
      });
      this.ganttEvent = [];
    },
    addTooltipLayer(id) {
      // const parent = $('.gantt_layout_cell.timeline_cell');
      // const parentRect = parent.get(0).getBoundingClientRect();
      // const scrollY = gantt.getScrollState().y;
      const elTask = $(`.gantt_task_line[task_id=${id}]`);
      const { left } = elTask.get(0).style;
      const top = parseInt(elTask.get(0).style.top, 10);
      // const elTaskRect = elTask.get(0).getBoundingClientRect();
      console.log('elTask.height()', elTask.height());
      const position = {
        top: `${top + elTask.height() + 4}px`,
        left,
      };
      const elem = this.$refs[`tooltip${id}`][0].$el;
      // $('.gantt_layout_cell.timeline_cell').append(elem);
      $(elem).css(position);
      $('.gantt_data_area').append(elem);
    },
    attrTooltipLayer(id, css) {
      const elem = this.$refs[`tooltip${id}`][0].$el;
      $(elem).css(css);
    },
    getStyle(el, prop) {
      const win = el.ownerDocument.defaultView;
      if (prop) {
        return win.getComputedStyle(el, null)[prop];
      }
      return win.getComputedStyle(el, null);
    },
    removeTooltip(el) {
      const elm = el[0];
      if (elm.$el && elm.$el.parentNode) {
        elm.$el.parentNode.removeChild(elm.$el);
      }
    },
    removeTooltipHandle(id) {
      const ids = this.tooltipIdList.indexOf(id);
      this.$log.info(
        'ids',
        this.tooltipIdList,
        id,
        this.tooltipIdList.indexOf(id),
      );
      if (ids > -1) {
        this.tooltipList.splice(ids, 1);
        this.tooltipIdList.splice(ids, 1);
      }
    },
    moveTooltip(scrollleft, scrolltop) {
      this.tooltipIdList.forEach((id) => {
        const elem = this.$refs[`tooltip${id}`][0].$el;
        const rect = this.getStyle(elem);
        const top = parseInt(rect.top, 10) + scrolltop;
        const left = parseInt(rect.left, 10) + scrollleft;
        const position = {
          top: `${top}px`,
          left: `${left}px`,
        };
        $(elem).css(position);
      });
    },
    getTreeData() {
      this.isGanttLoadding = true;
      this.$api
        .queryWorkItemTree({
          projectId: this.projectId,
          critical: Number(this.criticalBtn),
        })
        .then((res) => {
          this.isGanttLoadding = false;
          if (res.code === 'SUCCESS') {
            // this.$log.info(JSON.stringify(res.data));
            if (res.data) {
              this.ganttTreeData = res.data;
              this.ganttTreeIds = this.collectTreeIds(this.workItemData);
              const parse = _.cloneDeepWith(
                this.assemblyData(this.ganttTreeData),
              );
              this.ganttLinksFilter(parse);
              this.tasks = parse;
              // this.$nextTick(() => {
              // this.$log.info('getTreeData');
              if (this.isDestroy) {
                $('.gantt-wrap').hide();
                return false;
              }
              this.drawGantt({ ...parse });
              // });
            } else {
              this.ganttTreeData = {
                data: [],
                links: [],
                minDate: 0,
                maxDate: 0,
              };
              this.$nextTick(() => {
                if (this.isDestroy) {
                  $('.gantt-wrap').hide();
                } else {
                  this.drawGantt(this.ganttTreeData);
                }
              });
            }
          } else {
            this.$store.commmit('showMsg', {
              msg: res.extra.message,
            });
          }
          return true;
        });
    },
    collectTreeIds(data, result) {
      const ids = result || [];
      const self = this;
      if (Array.isArray(data)) {
        data.forEach((el) => {
          if (Array.isArray(el.childList) && el.childList.length) {
            ids.push(el.id);
            self.collectTreeIds(el.childList, ids);
          }
        });
      }
      return ids;
    },
    scrollToGantt(num) {
      window.requestAnimationFrame(() => {
        // gantt.scrollTo(null, num);
        $('.gantt .gantt_data_area').scrollTop(num);
      });
    },
    loadChild({ id, status, rootId }) {
      if (gantt.isTaskExists(id)) {
        if (status) {
          gantt.open(id);
        } else {
          // this.ganttTreeIds = this.collectTreeIds(data);
          // const parse = _.cloneDeepWith(this.assemblyData(this.ganttTreeData));
          // this.tasks = parse;
          // gantt.parse(this.tasks);
          // gantt.close(id);
          this.closeChild(rootId, id, status);
          this.tooltipisHide();
        }
      }
    },
    changeProp({
      id, prop, value, type, dependencyList,
    }) {
      if (gantt.isTaskExists(id)) {
        if (type === 'date') {
          if (Array.isArray(prop)) {
            const task = gantt.getTask(id);
            // eslint-disable-next-line prefer-destructuring
            task[prop[0]] = new Date(value[0]);
            if (task.$level === 2) {
              const suppleTime = ((23 * 60 + 59) * 60 + 59) * 1000;
              // console.log('changeProp milestone', value[1]);
              task[prop[1]] = new Date(value[1] + suppleTime);
            } else {
              // eslint-disable-next-line prefer-destructuring
              task[prop[1]] = new Date(value[1]);
            }
            this.changeGanttBoundaryDate(value[0], value[1]);
            // console.log(prop[1], new Date(value[1]));
            gantt.updateTask(id);
            this.changTooltip(id, 'endDate', value[1]);
            if (dependencyList) {
              this.changeDepency(dependencyList);
            }
            gantt.refreshData();
            gantt.render();
            // gantt.render();
          }
        } else {
          gantt.getTask(id)[prop] = value;
          const oProp = prop === 'text' ? 'name' : prop;
          this.changTooltip(id, oProp, value);
          gantt.updateTask(id);
        }
        this.selectTask(id);
      }
    },
    changeDepency(dependList) {
      if (!dependList) {
        return false;
      }
      const dependItems = Object.entries(dependList);
      if (dependItems.length) {
        dependItems.forEach((depend) => {
          if (Array.isArray(depend[1])) {
            depend[1].map((dep) => {
              const link = this.tasks.links.find(
                elink => elink.source === dep.workItemId
                  && elink.target === dep.dependentId,
              );
              if (link) {
                if (link && gantt.isLinkExists(link.id)) {
                  gantt.getLink(link.id).color = dep.color;
                  gantt.updateLink(link.id);
                }
              }
              return true;
            });
          }
        });
      }
      return true;
    },
    isScreenVisible(id) {
      const parent = $('.gantt_layout_cell.timeline_cell');
      const parentRect = parent.get(0).getBoundingClientRect();
      const elTask = $(`.gantt_task_line[task_id=${id}]`);
      // const elTaskRect = elTask.get(0).getBoundingClientRect();
      if (!gantt.isTaskExists(id)) {
        return false;
      }
      if (!elTask.length) {
        gantt.showTask(id);
        return false;
      }
      const elPosition = elTask.position();
      const scrollRect = gantt.getScrollState();
      const diff = elPosition.left - scrollRect.x;
      // console.log('diff', diff, parentRect.width);
      if (diff <= 120) {
        gantt.scrollTo(scrollRect.x - Math.abs(diff) - 120, null);
      } else if (diff >= parentRect.width / 2) {
        gantt.scrollTo(scrollRect.x + Math.abs(diff) - 240, null);
      }
      return true;
    },
    addChildHandle(payload) {
      const treeData = _.cloneDeepWith(payload);
      const taskId = gantt.addTask(
        {
          id: payload.id,
          parent: payload.parentId,
          text: payload.name,
          $level: payload.level,
          status: payload.status,
          start_date: this.$dayjs(payload.startDate).format('DD-MM-YYYY'),
          end_date: this.$dayjs(payload.endDate).format('DD-MM-YYYY  HH:mm:ss'),
          treeData,
          rootWorkItemId: payload.rootId,
        },
        payload.parentId,
      );
      gantt.updateTask(taskId);
      this.putTreeData(payload, 'add');
    },
    putTreeData(payload, type) {
      const rootTask = this.findRootId(payload.rootId, this.ganttTreeData);
      const taskItem = this.findTaskId(payload.parentId, rootTask);
      if (type === 'add') {
        if (Array.isArray(taskItem.childList)) {
          taskItem.childList.push(payload);
          taskItem.childNum += 1;
        } else {
          taskItem.childList = [payload];
          taskItem.childNum = 1;
        }
      } else if (type === 'delete') {
        if (Array.isArray(taskItem.childList)) {
          const index = taskItem.childList.findIndex(el => el.id === payload.id);
          if (index > -1) {
            taskItem.childList.splice(index, 1);
            if (taskItem.childList.length === 0) {
              taskItem.childList = null;
            }
          }
          taskItem.childNum -= 1;
        }
      }
    },
    expandAll({ source, status, index }) {
      function expand(sourceData) {
        if (sourceData.level <= 2 && gantt.isTaskExists(sourceData.id)) {
          // if (status) {
          //   gantt.open(sourceData.id);
          // } else {
          //   gantt.close(sourceData.id);
          // }
          gantt.getTask(sourceData.id).open = status;
          gantt.getTask(sourceData.id).$open = status;
        }
        if (Array.isArray(sourceData.childList)) {
          sourceData.childList.forEach((el) => {
            expand(el);
          });
        }
      }
      const sourceData = status ? source : this.ganttTreeData[index];
      expand(sourceData);
      // gantt.updateTask();
      gantt.render();
      this.tooltipisHide();
      // gantt.refreshData();
    },
    ganttLinksFilter({ data, links }) {
      // TODO: 待完善
      const closeWorkItem = data.filter(
        workitem => workitem.$level === 1 && !workitem.$open,
      );
      // eslint-disable-next-line no-unused-vars
      const closeWorkItemIds = closeWorkItem.map(w => w.id);
      const closeInitiative = data.filter(
        initiative => initiative.$level === 1 && !initiative.$open,
      );
      // eslint-disable-next-line no-unused-vars
      const closeInitiativeIds = closeInitiative.map(initia => initia.id);
      const closeMilestone = data.filter(
        milestone => milestone.$level === 2 && !milestone.$open,
      );
      const closeMilestoneIds = closeMilestone.map(mile => mile.id);
      // eslint-disable-next-line no-unused-vars
      const closeTask = data.filter(
        task => task.$level === 3 && closeMilestoneIds.indexOf(task.parent) > -1,
      );
      // const closeTaskIds = closeTask.map(ctask => ctask.id);
      // eslint-disable-next-line no-unused-vars
      const innerLinks = JSON.parse(JSON.stringify(links));
      // if (Array.isArray(innerLinks)) {
      //   links.forEach((link) => {
      //     if (link.$level === 2) {
      //       const isCloseMilestone = closeMilestoneIds.indexOf(link.target) > -1;
      //       if (isCloseMilestone) {
      //         const isInitiative = closeInitiativeIds.indexOf(link.parentId) > -1;
      //         if (isInitiative) {
      //           link.target = link.parentId;
      //         }
      //       }
      //     } else {
      //       const isCloseTask = closeTask.find(ct => ct.id === link.target);
      //       if(isCloseTask) {

      //       }
      //     }
      //   });
      // }
    },
    dragmoveHandle() {
      return this.dragmoveObj;
    },
    getWorkItemName(id) {
      if (!id) {
        return '';
      }
      const workItem = this.ganttTreeData.find(task => task.id === id);
      return workItem.name;
    },
    changTooltip(id, prop, value) {
      const index = this.tooltipIdList.indexOf(id);
      if (index !== -1) {
        this.$set(this.tooltipList[index], prop, value);
      } else {
        this.tooltipList.forEach((task, i) => {
          if (task.rootWorkItemId === id) {
            this.$set(this.tooltipList[i], 'rootName', value);
          }
        });
      }
    },
    tooltipisHide() {
      const arr = [].concat(this.tooltipIdList);
      arr.forEach((el) => {
        const index = this.tooltipIdList.indexOf(el);
        if (!gantt.isTaskVisible(el) && index > -1) {
          this.tooltipIdList.splice(index, 1);
          this.tooltipList.splice(index, 1);
        }
      });
    },
    changeTreeDate(id) {
      const task = gantt.getTask(id);
      const currWorkitemElem = document.getElementById(`workItem-${id}`);
      const arrIndex = currWorkitemElem.getAttributeNode('data-index').value;
      const startDate = this.$dayjs(task.start_date).format('DD-MM-YYYY');
      let endDate = task.end_date.getTime();
      const prevStartDate = task.treeData.startDate;
      const prevEndDate = task.treeData.endDate;
      const suppleTime = ((23 * 60 + 59) * 60 + 59) * 1000;
      if (task.$level !== 2) {
        if (Math.abs(task.treeData.endDate - endDate) === 1000) {
          endDate -= 1000;
        } else if (Math.abs(task.treeData.endDate - endDate) < suppleTime) {
          // eslint-disable-next-line prefer-destructuring
          endDate = task.treeData.endDate;
          // console.log('还在当前时间');
        } else {
          endDate -= 1000;
        }
      }
      // console.log('原始的时间', prevEndDate, new Date(prevEndDate));
      // console.log('拖动后的时间', task.end_date.getTime(), task.end_date);
      // console.log('计算后的时间', endDate, new Date(endDate));
      if (task.$level === 2) {
        task.start_date = new Date(task.start_date);
        task.end_date = new Date(+task.start_date + suppleTime);
        endDate = +task.start_date + suppleTime;
      } else {
        task.end_date = new Date(endDate);
      }
      gantt.updateTask(id);
      if (
        prevStartDate === task.start_date.getTime()
        && prevEndDate === endDate
      ) {
        return false;
      }
      const self = this;
      const payload = {
        id,
        startDate,
        endDate: this.$dayjs(endDate).format('DD-MM-YYYY'),
        arrIndex,
        sDate: task.start_date.getTime(),
        eDate: endDate,
        flag: '',
        level: task.$level,
        parentId: task.treeData.parentId,
        sourceType: 'gantt',
        oldStartDate: task.treeData.startDate,
        oldEndDate: task.treeData.endDate,
        success() {
          Object.assign(task.treeData, {
            startDate: task.start_date.getTime(),
            endDate,
          });
          self.selectTask(id);
        },
      };
      this.$refs.workplantree.changeDateHandler(payload);
      // if(task.$level === 1) {
      //   const taskParent = gantt.getTask(task.parent);

      // }
      return true;
    },
    delWorkItemHandle(payload) {
      if (gantt.isTaskExists(payload.id)) {
        const task = gantt.getTask(payload.id);
        if (task.$level === 1) {
          this.changeProp({
            id: payload.data.id,
            prop: ['start_date', 'end_date'],
            value: [payload.data.startDate, payload.data.endDate],
            type: 'date',
          });
        }
        gantt.deleteTask(payload.id);
        this.tooltipisHide();
        this.putTreeData(payload, 'delete');
        // gantt.refreshData();
      }
    },
    changeGanttBoundaryDate(sdate, edate) {
      if (this.tasks.minDate > sdate) {
        this.tasks.minDate = sdate;
      }
      if (this.tasks.maxDate < edate) {
        this.tasks.maxDate = edate;
      }
      gantt.config.start_date = new Date(
        this.tasks.minDate - 1000 * (2 * 24 * 3600),
      );
      gantt.config.end_date = new Date(
        this.tasks.maxDate + 1000 * (2 * 24 * 3600),
      );
    },
    selectTask(id) {
      const task = gantt.getTask(id);
      // gantt.showTask(id);
      if (id !== this.currWorkItemId) {
        gantt.unselectTask(this.currWorkItemId);
      }
      this.$nextTick(() => {
        this.isScreenVisible(id);
      });
      gantt.selectTask(id);
      this.$store.commit('setCurrWorkItemId', +id);
      this.$store.commit('setCurrWorkItem', task.treeData);
    },
    findRootId(rootId, sourceData) {
      let rootTask;
      if (Array.isArray(sourceData) && sourceData.length > 0) {
        if (Array.isArray(sourceData)) {
          rootTask = sourceData.find(el => el.id === rootId);
        }
        return rootTask;
      }
      return false;
    },
    findTaskId(id, sourceData) {
      let task;
      function findId(source) {
        if (Array.isArray(source)) {
          source.find((el) => {
            if (el.id === id) {
              task = el;
              return true;
            }
            if (Array.isArray(el.childList)) {
              findId(el.childList);
            }
            return false;
          });
        } else if (source.id === id) {
          task = source;
        } else if (Array.isArray(source.childList)) {
          findId(source.childList);
        }
      }
      findId(sourceData);
      return task;
    },
    closeChild(rootId, id, status) {
      const rootTask = this.findRootId(rootId, this.ganttTreeData);
      const task = this.findTaskId(id, rootTask);
      const mStatus = status ? 'open' : 'close';
      function closeLevel(from) {
        const isArray = Array.isArray(from);
        const isChildArray = Array.isArray(from.childList);
        if (isArray) {
          from.forEach((el) => {
            if (Array.isArray(el.childList)) {
              gantt[mStatus](el.id);
              closeLevel(el.childList);
            }
          });
        } else if (isChildArray) {
          gantt[mStatus](from.id);
          closeLevel(from.childList);
        }
      }
      if (task) {
        closeLevel(task);
      }
    },
  },
  // beforeRouteEnter(to, from, next) {
  //   next((vm) => {
  //     vm.getTreeData();
  //   });
  // },
  created() {
    this.getTreeData();
  },
  mounted() {
    this.scrollTopVal = this.$store.state.scrollTopVal;
  },
  beforeDestroy() {
    this.clearAllEvent();
    this.isDestroy = true;
    // $('.gantt-wrap').remove();
    $('.work-item-list-wrap.mCustomScrollbar').mCustomScrollbar('destroy');
  },
};
</script>

<style lang="scss">
@import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
@import "../../../css/workplan/gantt.scss";
</style>
