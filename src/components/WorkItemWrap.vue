<template>
  <div class="work-item-wrap">
    <div class="work-item-list-wrap">
      <div class="work-item-list"></div>
    </div>
  </div>
</template>

<script>
// import mockData from '../mock/workplan';

export default {
  name: 'workItemWrap',
  props: {
    critical: {
      type: Boolean,
      default: false,
    },
    scrollValue: {
      type: Number,
      default: 0,
    },
    innerName: {
      type: String,
      default: 'mCustomScrollbar',
    },
  },
  data() {
    // const mock = mockData;
    return {
      criticalBtn: false,
      workItemDateStatus: {},
      workItemData: [],
      levelTitle: ['Workstream', 'Initiative', 'Milestone', 'Task'],
      isLoading: false,
      timeoutID: '',
      lastCustomScroll: 0,
    };
  },
  computed: {
    currWorkItemId() {
      return this.$store.state.currWorkItemId;
    },
    currWorkItem() {
      return this.$store.state.currWorkItem;
    },
    workPlanRights() {
      return this.$store.state.workPlanRights;
    },
  },
  watch: {
    criticalBtn(val) {
      this.$store.commit('setCritical', val);
    },
    projectId() {
      this.criticalBtn = false;
      this.getLoadData();
    },
    workItemData: {
      deep: true,
      // eslint-disable-next-line
      handler: _.throttle(function (val) {
        // this.$emit('changeTree', this.workItemData);
        this.$store.commit('setWorkItemTree', val);
      }, 100),
    },
    workItemDateStatus(val) {
      this.$store.commit('setWorkItemDateStatus', val);
    },
    scrollValue(val) {
      this.myCustomFn(val);
    },
  },
  methods: {
    getLoadData() {
      this.isLoading = true;
      this.$api.getWorkPlanLoadData({
        params: {
          projectId: this.projectId,
        },
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            if (!res.data) {
              this.$store.commit('setCurrWorkItemId', null);
              this.$store.commit('setCurrWorkItem', {});
              this.workItemData = [];
              return true;
            }
            this.workItemData = res.data.workItemList;
            if (res.data.workItemList.length > 0) {
              const workItem = res.data.workItemList[0];
              this.$store.commit('setCurrWorkItemId', workItem.id);
              this.$store.commit('setCurrWorkItem', workItem);
            } else {
              this.$store.commit('setCurrWorkItemId', null);
              this.$store.commit('setCurrWorkItem', null);
            }
            // this.$emit('changeTree', this.workItemData);
          } else {
            this.$store.commit('showMsg', {
              msg: res.extra.message,
            });
          }
          return true;
        });
    },
    getLoadChildData(payload, callback) {
      this.isLoading = true;
      this.$api.getWorkPlanLoadChildData({
        params: {
          projectId: +this.projectId,
          workItemId: payload.id,
          critical: Number(this.criticalBtn),
        },
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            const data = res.data.workItemList;
            const position = payload.arrIndex;
            const isAddChild = typeof callback === 'function';
            if (payload.id !== this.$store.state.currWorkItemId) {
              this.$store.commit('setCurrWorkItemId', payload.id);
              this.$store.commit('setCurrWorkItem', payload.rows);
            }
            const rootWorkstram = this.workItemData[payload.arrIndex.slice(0, 1)];
            this.computeDateStatus(res.data.dateStatus);
            if (isAddChild) {
              if (Array.isArray(payload.rows.childList)) {
                const task = this.diffArrayExist(res.data.workItemList, payload.rows.childList);
                this.referenceComputed(position, [_.cloneDeepWith(task)], 'addChild');
              } else {
                this.referenceComputed(position, _.cloneDeepWith(res.data.workItemList), 'addChild');
              }
              callback(res.data.workItemList, rootWorkstram.id);
            } else {
              this.referenceComputed(position, data);
            }
            this.$emit('loadChild', {
              id: payload.id,
              rootId: rootWorkstram.id,
              status: true,
            });
          }
        });
    },
    delChildHandle(payload) {
      this.referenceComputed(payload.arrIndex, null);
      const rootId = this.workItemData[payload.arrIndex.slice(0, 1)].id;
      this.$emit('loadChild', {
        id: payload.id,
        status: false,
        rootId,
      });
      // this.$emit('changeTree', this.workItemData);
    },
    addChildHandle(payload) {
      this.isLoading = true;
      this.$api.addWorkPlanChild({
        parentId: payload.id,
        level: payload.level,
        workItemId: payload.id, // 后端权限判断需要用到
        projectId: this.projectId,
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            this.$store.dispatch('getWorkPlanPremission', { projectId: this.projectId });
            const type = this.$t(`workplan.${this.levelTitle[payload.level]}`);
            this.$store.commit('showMsg', {
              msg: this.$t('button.add.success', { type }),
              type: 'success',
              time: 1200,
            });
            if (payload.critical) {
              return;
            }
            const arr2 = payload.rows.childList
              ? _.cloneDeepWith(payload.rows.childList) : null;
            // const rootWorkstram = res.data.data.workItemList[0];
            this.getLoadChildData({
              arrIndex: payload.arrIndex,
              id: payload.id,
              critical: Number(this.criticalBtn),
              childList: payload.rows.childList,
              rows: payload.rows,
            }, (arg, rootId) => {
              const task = this.diffArrayExist(arg, arr2);
              this.$emit('addChild', Object.assign(task, {
                rootId,
              }));
              // this.referenceComputed(payload.arrIndex, '++1', 'childNum');
            });
            this.computeDateStatus(res.data.dateStatus);
            // const i =
            // payload.arrIndex.length === 1 ? payload.arrIndex : payload.arrIndex.split('')[0];
            // this.diffAndModify(this.workItemData[i], res.data.workItemList[0]);
          } else {
            this.$store.commit('showMsg', {
              mesage: res.extra.msg,
            });
          }
        });
    },
    diffArrayExist(arr1, arr2) {
      // arr1中寻找arr2中不存在的item，如果报错，说明代码强壮性不够，暂未考虑复用其他地方
      if (!arr2) {
        return arr1[arr1.length - 1];
      }
      const newTask = arr1.find((elm) => {
        const els = arr2.find((el) => {
          if (elm.id === el.id) {
            return true;
          }
          return false;
        });
        if (typeof els === 'undefined') {
          return true;
        }
        return false;
      });
      return newTask;
    },
    referenceComputed(position, data, type = 'childList', callback) {
      const cData = JSON.parse(JSON.stringify(data));
      let obj = this.workItemData;
      if (position.indexOf('-') === -1) {
        if (type === 'childNum') {
          obj[position][type] += 1;
          return true;
        }
        if (type === 'remove' && obj[position]) {
          if (Array.isArray(obj[position].childList)) {
            const i = obj[position].childList.findIndex(elm => elm.id === data);
            obj[position].childList.splice(i, 1);
            if (obj[position].childList.length === 0) {
              obj[position].childList = null;
              obj[position].childNum = 0;
            }
          }
          return true;
        }
        if (type === 'addChild' && obj[position]) {
          if (Array.isArray(obj[position].childList)) {
            obj[position].childList.push(...data);
            if (callback) {
              callback();
            }
          } else {
            obj[position].childList = [].concat(...data);
          }
          obj[position].childNum += 1;
          return true;
        }
        if (type === 'get') {
          return obj[position];
        }
        obj[position][type] = cData;
      } else {
        const arr = position.split('-');
        arr.reduce((prev, curr) => {
          if (Array.isArray(obj)) {
            obj = obj[prev].childList[curr];
          } else {
            obj = obj.childList[curr];
          }
          return curr;
        });
        if (type === 'remove') {
          obj.childList.splice(data, 1);
          if (obj.childList.length === 0) {
            obj.childList = null;
            obj.childNum = 0;
          }
          return true;
        }
        if (type === 'addChild') {
          if (Array.isArray(obj.childList)) {
            obj.childList.push(...data);
            if (callback) {
              callback();
            }
          } else {
            // this.$emit('upLoadTree');
            obj.childList = data;
          }
          obj.childNum += 1;
          return true;
        }
        if (type === 'childNum') {
          obj[type] += 1;
          return true;
        }
        if (type === 'get') {
          return obj;
        }
        obj[type] = cData;
        return true;
      }
      return true;
    },
    saveNameHandle(payload) {
      this.isLoading = true;
      this.$api.editWorkPlan({
        workItemId: payload.id,
        name: payload.name,
        projectId: this.projectId,
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            this.referenceComputed(payload.arrIndex, payload.name, 'name');
            const { currWorkItem } = this.$store.state;
            const profile = Object.assign(currWorkItem, {
              name: payload.name,
            });
            this.$store.commit('setCurrWorkItem', profile);
            this.$emit('changeProp', {
              id: payload.id,
              prop: 'text',
              value: payload.name,
            });
          }
        });
    },
    expandAllHandle(payload) {
      this.isLoading = true;
      if (!payload.isExpand) {
        // this.getLoadData();
        this.isLoading = false;
        this.workItemData[payload.arrIndex].childList = null;
        this.$emit('expandAll', {
          source: this.workItemData[payload.arrIndex],
          status: false,
          index: payload.arrIndex,
        });
        // this.$emit('changeTree', this.workItemData);
        return true;
      }
      this.$api.getWorkPlanExpandAll({
        projectId: this.projectId,
        workItemId: payload.id,
        critical: Number(this.criticalBtn),
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            this.workItemData[payload.arrIndex].childList = res.data.workItemList;
            this.computeDateStatus(res.data.dateStatus);
            this.$emit('expandAll', {
              source: this.workItemData[payload.arrIndex],
              status: true,
              index: payload.arrIndex,
            });
            // this.$emit('changeTree', this.workItemData);
          }
        });
      return true;
    },
    activeRowHandle(payload) {
      this.$emit('activeRowHandle', payload.id);
      if (payload.id === this.$store.state.currWorkItemId) {
        return false;
      }
      this.$store.commit('setCurrWorkItemId', payload.id);
      this.$store.commit('setCurrWorkItem', Object.assign(payload.rows, {
        arrIndex: payload.arrIndex,
      }));
      return true;
    },
    criticalHandler() {
      if (!this.criticalBtn) {
        this.getLoadData();
        this.$emit('criticalHandle');
        return true;
      }
      this.isLoading = true;
      this.$api.getWorkPlanCritical({
        projectId: this.projectId,
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            this.workItemData = res.data;
            if (res.data.length === 0) {
              // this.$store.commit('setCurrWorkItemId', null);
              // this.$store.commit('setCurrWorkItem', {});
              this.$emit('criticalHandle');
              return true;
            }
            if (this.criticalBtn) {
              const workItem = res.data[0].childList[0].childList[0];
              this.$store.commit('setCurrWorkItemId', workItem.id);
              this.$store.commit('setCurrWorkItem', workItem);
              this.$emit('criticalHandle');
              return true;
            }
            return true;
          }
          this.$store.commit('showMsg', {
            msg: res.extra.message,
          });
          this.$store.commit('setCurrWorkItemId', null);
          this.$store.commit('setCurrWorkItem', null);
          return true;
        });

      return true;
    },
    currCriticalHandler(payload) {
      this.isLoading = true;
      this.$api.editWorkPlan({
        criticalPath: payload.critical,
        workItemId: payload.id,
        projectId: +this.projectId,
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            this.referenceComputed(payload.arrIndex, payload.critical, 'criticalPath');
            if (this.criticalBtn) {
              this.computeCriticalList(Object.assign(payload, {
                criticalStatus: this.criticalBtn,
              }));
            }
            this.$emit('changeProp', {
              id: payload.id,
              prop: 'criticalPath',
              value: Boolean(+payload.critical),
            });
          } else {
            this.$store.commit('showMsg', {
              msg: res.extra.message,
            });
          }
        });
    },
    diffAndModify(oldValue, newValue) {
      const self = this;
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        oldValue.forEach((elm, index) => {
          const oldId = elm.id;
          newValue.forEach((nElm, nIndex) => {
            if (oldId === nElm.id) {
              self.diffAndModify(oldValue[index], newValue[nIndex]);
            }
          });
        });
      } else {
        const oldId = oldValue.id;
        const newId = newValue.id;
        if (oldId === newId) {
          Object.entries(oldValue).forEach((elm) => {
            if (Array.isArray(elm[1]) && elm[0] === 'childList') {
              self.diffAndModify(oldValue[elm[0]], newValue[elm[0]]);
            } else if (elm[0] !== 'childList') {
              // eslint-disable-next-line
              oldValue[elm[0]] = newValue[elm[0]];
            }
          });
        }
      }
    },
    computeDateStatus(payload) {
      if (!payload) {
        return false;
      }
      Object.entries(payload).forEach((elm) => {
        this.$set(this.workItemDateStatus, elm[0], Number(elm[1]));
      });
      return true;
    },
    computeCriticalList(payload) {
      const arrIndex = payload.arrIndex.split('-');
      const workItem = this.workItemData[arrIndex[0]];
      if (workItem.childList.length === 1) {
        const initiative = workItem.childList[0];
        if (initiative.childList.length === 1) {
          this.workItemData.splice(arrIndex[0], 1);
        } else {
          initiative.childList.splice(arrIndex[2], 1);
        }
      } else {
        const initiative = workItem.childList[arrIndex[1]];
        if (initiative.childList.length === 1) {
          workItem.childList.splice(arrIndex[1], 1);
        } else {
          initiative.childList.splice(arrIndex[2], 1);
        }
      }
    },
    changeDateHandler(payload) {
      this.isLoading = true;
      this.$api.putWorkPlanDate({
        startDate: payload.startDate,
        endDate: payload.endDate,
        workItemId: payload.id,
        projectId: this.projectId,
      })
        .then((res) => {
          this.isLoading = false;
          if (res.code === 'SUCCESS') {
            // Date modified successfully.
            this.$store.commit('showMsg', {
              type: 'success',
              time: 1200,
              msg: this.$t('button.modify.success'),
            });
            // this.referenceComputed(payload.arrIndex, payload.startDate, 'startDate');
            // this.referenceComputed(payload.arrIndex, payload.endDate, 'endDate');
            const index = payload.arrIndex.split('-')[0];
            this.diffAndModify(this.workItemData[index], res.data.workItemList[0]);
            this.computeDateStatus(res.data.dateStatus);
            // 时间改变重新获取activity list
            this.$bus.$emit('workStreActiList');
            if (payload.sourceType === 'gantt') {
              this.$emit('changeDependency', res.data.dependencyList);
              if (payload.level === 1) {
                this.$emit('changeProp', {
                  id: payload.parentId,
                  prop: ['start_date', 'end_date'],
                  value: [res.data.workItemList[0].startDate, res.data.workItemList[0].endDate],
                  type: 'date',
                });
              }
              if (payload.success) {
                payload.success();
              }
              return true;
            }
            this.emitGanttChangeDate(payload, res.data);
            return true;
          }
          this.$bus.$emit(`cancelDate${payload.arrIndex}`);
          if (payload.sourceType === 'gantt') {
            // console.log('cancel oldEndDate', new Date(payload.oldEndDate));
            this.$emit('changeProp', {
              id: payload.id,
              prop: ['start_date', 'end_date'],
              value: [payload.oldStartDate, payload.oldEndDate],
              type: 'date',
            });
          }
          this.$store.commit('showMsg', {
            msg: res.extra.message,
          });
          return false;
        });
    },
    selectMemberHandler(payload) {
      const promise = this.$api.getQueryWorkstreamMember({
        projectId: this.projectId,
        workItemId: payload.id,
      });
      payload.handle(promise);
    },
    saveMemberHandler(payload) {
      this.$api.addWorkPlanMember({
        workItemId: payload.id,
        projectId: +this.projectId,
        userIdList: payload.value,
      })
        .then((res) => {
          if (res.code === 'SUCCESS') {
            // 'Owner changed successfully.'
            this.$store.commit('showMsg', {
              type: 'success',
              time: 1200,
              msg: this.$t('button.modify.success'),
            });
            this.referenceComputed(payload.arrIndex, res.data, 'ownerList');
            payload.handler();
            // member改变重新获取activity list
            this.$bus.$emit('workStreActiList');
            return true;
          }
          this.$store.commit('showMsg', {
            msg: res.extra.message,
          });
          return true;
        });
    },
    onScroll(event) {
      if (typeof this.timeoutID === 'number') {
        window.clearTimeout(this.timeoutID);
        delete this.timeoutID;
      }
      const elem = $(event.target);
      this.timeoutID = setTimeout(() => {
        this.$emit('scrollTo', elem.scrollTop());
        // this.$bus.$emit('scrollMemberList', event.target.scrollTop);
      }, 250);
    },
    changeStatusHandle(payload) {
      this.$api.putWorkPlanStatus({
        projectId: +this.projectId,
        workItemId: payload.id,
        status: payload.status,
      })
        .then((res) => {
          if (res.code === 'SUCCESS') {
            // 'Status modified successfully.'
            this.$store.commit('showMsg', {
              type: 'success',
              time: 1200,
              msg: this.$t('button.modify.success'),
            });
            const index = payload.arrIndex.split('-')[0];
            this.diffAndModify(this.workItemData[index], res.data.workItemList[0]);
            this.$store.commit('setCurrWorkItemId', payload.id);
            this.$store.commit('setCurrWorkItem', Object.assign(payload.rows, {
              arrIndex: payload.arrIndex,
            }));
            this.$emit('changeProp', {
              id: payload.id,
              prop: 'status',
              value: payload.status,
            });
          } else {
            this.$store.commit('showMsg', {
              msg: res.extra.message,
            });
          }
          payload.handler();
        });
    },
    delWorkItemHandle(payload, del = false) {
      this.$api.deleteWorkPlanItem({
        projectId: this.projectId,
        workItemId: payload.id,
        deleted: del,
      })
        .then((res) => {
          if (res.code === 'SUCCESS') {
            if (!del) {
              this.delMsgBox(res, payload);
            } else {
              const arrIndex = payload.arrIndex.slice(0, payload.arrIndex.length - 2);
              let data = payload.arrIndex.slice(-1);
              if (arrIndex.indexOf('-') === -1) {
                data = payload.id;
              }
              this.referenceComputed(arrIndex, data, 'remove');
              this.computeDateStatus(res.data.data.dateStatus);
              this.$store.commit('setCurrWorkItemId', payload.parentId);
              const rows = _.cloneDeepWith(this.referenceComputed(arrIndex, null, 'get'));
              this.$store.commit('setCurrWorkItem', rows);
              if (Array.isArray(res.data.data.workItemList)) {
                this.diffAndModify(
                  this.workItemData[payload.arrIndex[0]],
                  res.data.data.workItemList[0],
                );
              }
              const rootId = this.workItemData[payload.arrIndex.slice(0, 1)].id;
              this.$emit('delWorkItem', {
                id: payload.id,
                data: res.data.data.workItemList[0],
                rootId,
                parentId: payload.parentId,
              });
            }
          }
        });
    },
    delMsgBox(res, payload) {
      const h = this.$createElement;
      let msg;
      if (res.data && res.data.message) {
        msg = res.data.message;
      } else if (payload.rows.childNum > 0) {
        msg = this.$t('WorkItemWrap.delmsg1');
      } else {
        msg = this.$t('WorkItemWrap.delmsg2');
      }
      const self = this;
      this.$msgbox({
        title: this.$t('button.warn'),
        message: h('div', null, [
          h('p', {
            style: {
              color: '#666',
            },
          }, msg),
        ]),
        showCancelButton: true,
        confirmButtonText: this.$t('button.confirm'),
        cancelButtonText: this.$t('button.cancel'),
        type: 'warning',
        customClass: 'confirmCustomBox',
        callback(action) {
          if (action === 'confirm') {
            self.delWorkItemHandle(payload, true);
          }
        },
      });
    },
    delWorkItemOwnerHandle({ workItemId, userId }) {
      const obj = this.workItemData.find((el) => {
        if (el.id === workItemId) {
          return el;
        }
        return false;
      });
      function findWorkItem(sourceObj) {
        const type = Object.prototype.toString.call(sourceObj);
        if (type === '[object Object]') {
          if (Array.isArray(sourceObj.ownerList)) {
            const index = sourceObj.ownerList.findIndex(el => el.userId === userId);
            if (index > -1) {
              sourceObj.ownerList.splice(index, 1);
            }
          }
          if (Array.isArray(sourceObj.childList)) {
            findWorkItem(sourceObj.childList);
          }
        } else if (Array.isArray(sourceObj)) {
          sourceObj.forEach((el) => {
            findWorkItem(el);
          });
        }
      }
      findWorkItem(obj);
    },
    clearAllEvent() {
      this.$bus.$off('getChildHandle');
      this.$bus.$off('delChildHandle');
      this.$bus.$off('addChild');
      this.$bus.$off('saveName');
      this.$bus.$off('activeRow');
      this.$bus.$off('expandAll');
      this.$bus.$off('criticalHandle');
      this.$bus.$off('changeDate');
      this.$bus.$off('selectMember');
      this.$bus.$off('saveMember');
      this.$bus.$off('changeStatus');
      this.$bus.$off('delWorkItem');
      this.$bus.$off('delWorkItemOwner');
    },
    bindAllEvent() {
      this.$bus.$on('getChildHandle', this.getLoadChildData);
      this.$bus.$on('delChildHandle', this.delChildHandle);
      this.$bus.$on('addChild', this.addChildHandle);
      this.$bus.$on('saveName', this.saveNameHandle);
      this.$bus.$on('activeRow', this.activeRowHandle);
      this.$bus.$on('expandAll', this.expandAllHandle);
      this.$bus.$on('criticalHandle', this.currCriticalHandler);
      this.$bus.$on('changeDate', this.changeDateHandler);
      this.$bus.$on('selectMember', this.selectMemberHandler);
      this.$bus.$on('saveMember', this.saveMemberHandler);
      this.$bus.$on('changeStatus', this.changeStatusHandle);
      this.$bus.$on('delWorkItem', this.delWorkItemHandle);
      this.$bus.$on('delWorkItemOwner', this.delWorkItemOwnerHandle);
    },
    scrollTo(y) {
      this.$emit('scrollTo', y);
    },
    myCustomFn() {
      // const el = $('.work-item-list-wrap.mCustomScrollbar');
      // el.mCustomScrollbar('disable', true);
      // window.requestAnimationFrame(() => {
      //   el.find('.mCustomScrollBox').scrollTop(y);
      //   el.mCustomScrollbar('update');
      // });
      // const diff = y - this.lastCustomScroll;
      // const str = y > 0 ? '+=' : '-=';
      // el.mCustomScrollbar('scrollTo', `${str}${diff}`);
      // el.mCustomScrollbar('scrollTo', y, {
      //   scrollInertia: 1,
      // });
    },
    emitGanttChangeDate(payload, data) {
      // 86399000 为23:59:59 毫秒数
      const isMileStone = payload.level === 2;
      let value = payload.flag === 'endDate'
        ? [payload.sDate, payload.eDate + 86399000] : [payload.sDate, payload.eDate];
      if (isMileStone) {
        value = [payload.eDate, payload.eDate];
      }
      this.$emit('changeProp', {
        id: payload.id,
        prop: ['start_date', 'end_date'],
        value,
        type: 'date',
        dependencyList: data.dependencyList || null,
      });
      if (payload.level === 1) {
        this.$emit('changeProp', {
          id: payload.parentId,
          prop: ['start_date', 'end_date'],
          value: [data.workItemList[0].startDate, data.workItemList[0].endDate],
          type: 'date',
          dependencyList: data.dependencyList || null,
        });
      }
    },
  },
  created() {
    this.criticalBtn = this.critical || false;
    const data = this.$store.state.workItemTree;
    const dateStatus = this.$store.state.workItemDateStatus;
    if (data) {
      this.workItemData = data;
      this.workItemDateStatus = dateStatus;
      // this.$emit('changeTree', this.workItemData);
    } else {
      this.getLoadData();
    }
  },
  mounted() {
    // const isGantt = this.$route.name === 'Gantt';
    this.clearAllEvent();
    this.bindAllEvent();
  },
  updated() {
    this.clearAllEvent();
    this.bindAllEvent();
  },
  beforeDestroy() {
    this.clearAllEvent();
  },
};
</script>
<style lang="scss">
@import 'malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css';
@import '../css/workplan/workitem-wrap';
.confirmCustomBox {
  width: 600px;
  @media only screen and (max-width:  414px) {
    width: 90vw;
    position: relative;
    top: 6vh;
  }
}
</style>
