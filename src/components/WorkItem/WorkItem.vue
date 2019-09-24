<template>
  <div class="work_item-wrapper">
      <div class="curr-item-wrapper"
        :ref="`workItem-${workItemData.id}`"
        :id="`workItem-${workItemData.id}`"
        :data-index="arrIndex"
        @click.prevent.stop="handleRow(workItemData)"
        :title="completeText"
        :class="currWorkItemId == workItemData.id ? 'is-active' : ''"
        :style="borderLeft">
        <div class="title-outside-wrap">
          <span
            :class="['arrow', isDisable ? 'is-disable' : '', `arrowW-${workItemData.level}`]"
            @click="loadChildData">
            <i :class="'el-icon-arrow-' + arrowDirection " v-show="workItemData.level < 3"></i>
          </span>
          <div class="current-title"
            :style="titleWidth"
            :id="'title-' + workItemData.id">
            <div class="title-wrap" v-show="!isEdit">
              <div
                :title="workItemData.name"
                class="title"
                >
                <span
                  :class="['title-base', `title-${workItemData.level}`]"
                  >{{ workItemData.name }}
                  <i
                    v-if="platform === 'web' && checkPremission('editWorkItem')"
                    @click="input=workItemData.name;isEdit=true;"
                    :title="$t('workplan.editicon')"
                    class="iconfont icon-bianjicopy iconEdit"></i>
                  <i
                    v-if="workItemData.level == 0"
                    @click="expandAll"
                    :title="isExpand? $t('workplan.expandAll') : $t('workplan.foldAll')"
                    :class="['expand', 'iconfont',
                      isExpand ? 'icon-quanbuzhankai':'icon-quanbushouqi',
                    isDisable ? 'is-disable':'']"></i>
                </span>
              </div>
              <ul
                class="member-wrap"
                @click="openMemberHandle"
                :ref="`member-${workItemData.id}`"
                v-if="workItemData.level > 0">
                <template v-if="!workItemData.ownerList || workItemData.ownerList.length === 0">
                  <li class="default" v-if="platform === 'web' && checkPremission('editWorkItem')" >
                    <i class="el-icon-plus"></i>
                    <span >{{$t('workplan.Add Owner')}}</span>
                  </li>
                </template>
                <template v-else>
                  <li
                  v-if="checkPremission('editWorkItem')" :title="ownerList" >{{ ownerList }}</li>
                </template>
              </ul>
                <select-list
                  v-if="isSelect"
                  :selectList="selectList"
                  :id="workItemData.id"
                  :ref="`select-list-${workItemData.id}`"
                  :appendToBody="true"
                  :position="position"
                  :addClass="isBottom ? 'pos-bottom': ''"
                  :activeList="workItemData.ownerList || []"
                  :selectLoading="selectLoading"
                  v-clickoutside="hideSelectList"
                  :visible="visible"></select-list>
            </div>
            <div class="modify-title" v-show="isEdit">
              <el-input
                class="workItem-edit-input"
                :id="workItemData.id"
                v-model="input" ></el-input>
              <div class="operator-edit-input">
                <a href="javascript:;" class="sumit" @click="saveName">
                  <i class="el-icon-circle-check"></i>
                </a>
                <a href="javascript:;" class="cancel" @click="closeEditTitle">
                  <i class="el-icon-circle-close"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div :class="['side-wrap', platform === 'web' ? '' : `side_pad-${workItemData.level}`]">
          <ul class="date-wrap" :style="titleWidth">
            <li
              :class="slMark ? 'is-mark':''"
              :title="slMark? $t('WorkItemWrap.dateNotWithin') : ''"
              >
              <span
                v-show="workItemData.level > 0 && workItemData.level !== 2"
                >{{ $dayjs(workItemData.startDate).format('DD-MMM-YYYY') }}</span>
                <el-date-picker
                  v-show="workItemData.level > 0 && workItemData.level !== 2"
                  v-model="startTime"
                  type="date"
                  :disabled="isPlatformDisableBtn()"
                  :readonly="isPlatformDisableBtn()"
                  :clearable="false"
                  class="date-wrap-el-date"
                  format="DD-MMM-YYYY"
                  :id="workItemData.id+'-startDate'"
                  :editable="false"
                  value-format="timestamp"
                  @change="changeStartDateHandle">
                </el-date-picker>
                </li>
            <li
              :class="elMark ? 'is-mark':''"
              :title="elMark? $t('WorkItemWrap.dateNotWithin') : ''">
              <span
                v-show="workItemData.level > 0"
                >{{ $dayjs(workItemData.endDate).format('DD-MMM-YYYY')}}</span>
                <el-date-picker
                  v-show="workItemData.level > 0 "
                  v-model="endTime"
                  :disabled="isPlatformDisableBtn()"
                  :readonly="isPlatformDisableBtn()"
                  :id="workItemData.id+'-endDate'"
                  type="date"
                  :editable="false"
                  class="date-wrap-el-date"
                  format="dd-MMM-yyyy"
                  :clearable="false"
                  value-format="timestamp"
                  :picker-options="pickerEndOptions"
                  @change="changeEndDateHandle">
                </el-date-picker>
            </li>
            <li class="active-status"  v-show="workItemData.level > 0" >
              <a
                :class="['status', statusList[workItemData.status]]"
                @click="workStatusHandle"
                :ref="`activeStatus-${workItemData.id}`"
                href="javascript:;"><i></i></a>
                <span class="tip"
                  title=""
                  v-show="workItemData.warningContent"
                  v-popover="'tip-popover'"><i class="iconfont icon-light"></i></span>
                <el-popover
                  ref="tip-popover"
                  width="200"
                  trigger="hover">
                  <div style="color: #333">
                    <p style="font-size: 14px; line-height: 26px; font-weight: bold;">
                      {{$t('workplan.System suggestion')}}:</p>
                    <p
                      style="font-size: 12px;
                      line-height: 22px; display:flex; align-items: center;">
                      <i :style="cricelStyle"></i>
                      {{ warningTypeText[workItemData.warningContent] |
                      warningTypeTextI18n(this)}}</p>
                    <p
                      style="font-size: 11px; line-height: 22px;">
                      ({{$t(`workplan.determined by ${warnTipStr}`)}})</p>
                  </div>
                </el-popover>
                <select-active
                  v-if="isStatus"
                  :visible="isStatusVisible"
                  :styles="activePosition"
                  :id="workItemData.id"
                  v-clickoutside="hideStatus"
                  :activeStatus="workItemData.status"
                  :addClass="isBottom ? 'pos-bottom': ''"
                  :appendToBody="true"
                  ></select-active>
            </li>
          </ul>
          <div class="other-wrap">
            <a
              href="javascript:;"
              v-if="workItemData.level === 2"
              :class="['critical-btn', workItemData.criticalPath ? 'is-active':'']"
              @click="criticalBtnHandle"
              >C</a>
            <span v-else style="width: 20px"></span>
            <a href="javascript:;"
              class="add"
              v-if="workItemData.level !== 3"
              :title="workItemData.level | formatTitle(this, 'Add')"
              @click="addChildWorkItem"
              >
              <i
                v-show="platform === 'web' && checkPremission('addWorkItem')"
                class="el-icon-plus"></i>
            </a>
            <span v-else style="width: 16px"></span>
            <a href="javascript:;"
              v-if="checkPremission('deleteWorkItem') && workItemData.level > 0"
              @click.stop="deleteHandle"
              :title="$t('workplan.deleteWS', {type: workItemData.name})">
              <i class="el-icon-delete"></i>
            </a>
            <span v-else style="width: 16px"></span>
          </div>
        </div>
      </div>
    <transition-group name="list" tag="div">
    <work-item
      v-for="(item, index) in workItemData.childList"
      :key="item.level+'-'+index"
      :premission="premission"
      :currWorkItemId="currWorkItemId"
      :workItemDateStatus="workItemDateStatus"
      :arrIndex="`${arrIndex}-${index}`"
      @getChildHandle="getChildHandle.call(this)"
      :workItemData="item"
    ></work-item>
    </transition-group>
  </div>
</template>

<script>
import Clickoutside from '@/plugins/e-clickoutside';

export default {
  name: 'WorkItem',
  directives: { Clickoutside },
  props: {
    workItemData: {
      type: [Object, Array],
      default: () => {},
    },
    arrIndex: {
      type: [Number, String],
      default: 0,
    },
    currWorkItemId: {
      type: Number,
      default: () => -1,
    },
    workItemDateStatus: {
      type: [Map, Object],
      default: () => new Map(),
    },
    premission: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      input: '',
      activeId: 3,
      isEdit: false,
      componetName: null,
      arrowDirection: 'right',
      statusList: {
        NOT_STARTED: 'color-0',
        ON_TRACK: 'color-1',
        AT_RISK: 'color-2',
        OFF_TRACK: 'color-3',
        COMPLETE: 'color-4',
        ABANDONED: 'color-5',
      },
      warningTypeColor: {
        NOT_STARTED: '#999',
        ON_TRACK: '#86BC25',
        AT_RISK: '#ED8B00',
        OFF_TRACK: '#DA291C',
        COMPLETE: '#00A3E0',
        ABANDONED: '#8C1AC5',
      },
      warningTypeText: {
        NOT_STARTED: 'Not Started',
        ON_TRACK: 'On Track',
        AT_RISK: 'At Risk',
        OFF_TRACK: 'Off Track',
        COMPLETE: 'Complete',
        ABANDONED: 'Abandoned',
      },
      levelTitle: ['Workstream', 'Initiative', 'Milestone', 'Task'],
      isExpand: true,
      startTime: '',
      endTime: '',
      pickerEndOptions: {},
      selectList: [],
      selectLoading: false,
      visible: false,
      position: {},
      isBottom: false,
      isSelect: false,
      isStatus: false,
      activePosition: {},
      isStatusVisible: false,
    };
  },
  computed: {
    cricelStyle() {
      return {
        width: '10px',
        height: '10px',
        'border-radius': '50%',
        marginRight: '6px',
        display: 'inline-block',
        backgroundColor: this.warningTypeColor[this.workItemData.warningContent],
      };
    },
    premissionOwner() {
      return this.premission[this.workItemData.id] || [];
    },
    borderLeft() {
      const lineWidth = this.workItemData.level || 0;
      return {
        borderLeftWidth: `${lineWidth * 4}px`,
      };
    },
    titleWidth() {
      const lineWidth = this.workItemData.level || 0;
      return {
        marginLeft: `-${lineWidth * 4}px`,
      };
    },
    isDisable() {
      return !this.workItemData.childNum;
    },
    childList() {
      return this.workItemData.childList;
    },
    ownerList() {
      return this.workItemData.ownerList.map((elm) => {
        if (elm.roleId === 7) {
          return `* ${elm.displayName}`;
        }
        return elm.displayName;
      }).join(', ');
    },
    completeText() {
      if (this.workItemData.level >= 1 && this.workItemData.level <= 2) {
        let type = `${this.levelTitle[this.workItemData.level + 1]}`;
        type = this.$t(`workplan.${type}`);
        return this.$t('WorkItemWrap.completeText', {
          child: this.workItemData.childNum,
          type,
          completed: this.workItemData.completedNum,
        });
        // return `${this.workItemData.completedNum} out of ${this.workItemData.childNum} ${txt} complete`;
      }
      return '';
    },
    slMark() {
      return this.workItemDateStatus[`sl-${this.workItemData.id}`];
    },
    elMark() {
      return this.workItemDateStatus[`el-${this.workItemData.id}`];
    },
    warnTipStr() {
      const { warningType } = this.workItemData;
      const str = warningType ? 'child items' : 'date range';
      return str;
    },
  },
  filters: {
    formatTitle(value, self, type) {
      const key = `${type} ${self.levelTitle[value + 1]}`;
      return self.$t(`workplan.${key}`);
    },
    addComma(value, index, len) {
      if (index < len - 1) {
        return `${value},`;
      }
      return value;
    },
    warningTypeTextI18n(value, self) {
      if (value) {
        const key = `workplan.${value}`;
        return self.$t(key);
      }
      return '';
    },
  },
  watch: {
    childList: {
      immediate: true,
      /* eslint-disable-next-line */
      handler: function(val) {
        if (val && val.length > 0) {
          this.arrowDirection = 'down';
          this.isExpand = false;
        } else {
          this.arrowDirection = 'right';
          this.isExpand = true;
        }
      },
    },
    workItemData: {
      deep: true,
      handler(val) {
        this.startTime = new Date(val.startDate);
        this.endTime = new Date(val.endDate);
      },
    },
  },
  methods: {
    workStatusHandle() {
      if (this.platform !== 'web') {
        return false;
      }
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      this.isStatus = true;
      setTimeout(() => {
        this.$bus.$on(`changeStatus${this.workItemData.id}`, this.changeStatusHandle);
        this.isStatusVisible = true;
        this.activePosition = this.changeMemberScroll('activeStatus', 228, 32);
      }, 300);
      return true;
    },
    hideStatus() {
      this.isStatus = false;
      this.isStatusVisible = false;
      this.$bus.$off(`changeStatus${this.workItemData.id}`);
      return true;
    },
    changeStatusHandle(payload) {
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      const self = this;
      this.$bus.$emit('changeStatus', {
        id: this.workItemData.id,
        arrIndex: this.arrIndex,
        status: payload,
        rows: this.workItemData,
        handler() {
          self.hideStatus();
        },
      });
      return true;
    },
    closeEditTitle() {
      this.input = this.workItemData.name;
      this.isEdit = false;
    },
    handleRow() {
      this.$bus.$emit('activeRow', {
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        rows: this.workItemData,
      });
    },
    expandAll() {
      if (this.isDisable) {
        return;
      }
      let status = this.isExpand;
      if (status) {
        status = false;
      } else {
        status = true;
      }
      this.$bus.$emit('expandAll', {
        id: this.workItemData.id,
        isExpand: this.isExpand,
        arrIndex: this.arrIndex,
      });
      this.isExpand = status;
    },
    setMark() {
      this.slMark = this.workItemDateStatus[`sl-${this.workItemData.id}`];
      this.elMark = this.workItemDateStatus[`el-${this.workItemData.id}`] || 0;
    },
    saveName() {
      if (!this.input || this.input.length > 50) {
        this.$store.commit('showMsg', {
          type: 'warning',
          msg: this.$t('placeholder.stringLength', {
            min: 1,
            max: 50,
          }),
        });
        return false;
      }
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      this.$bus.$emit('saveName', {
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        name: this.input,
      });
      this.isEdit = false;
      return true;
    },
    openMemberHandle() {
      if (this.platform !== 'web') {
        return false;
      }
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      const self = this;
      this.isSelect = true;
      this.$bus.$emit('selectMember', {
        id: this.workItemData.id,
        handle(promise) {
          promise.then((res) => {
            if (res.code === 'SUCCESS') {
              const resData = JSON.parse(JSON.stringify(res.data));
              if (!res.data || !res.data.length) {
                self.$store.commit('showMsg', {
                  type: 'warning',
                  msg: self.$t('WorkItemWrap.addMemberFirst'),
                });
                return false;
              }
              self.position = self.changeMemberScroll();
              self.$bus.$on('scrollMemberList', () => {
                self.position = self.changeMemberScroll;
              });
              self.$bus.$off(`saveMember${self.workItemData.id}`);
              self.$bus.$on(`saveMember${self.workItemData.id}`, self.saveMember);
              self.visible = true;

              self.selectList = resData;
            } else {
              this.$store.commit('showMsg', {
                msg: res.extra.message,
              });
            }
            return true;
          });
        },
      });
      return true;
    },
    hideSelectList() {
      this.isSelect = false;
      this.visible = false;
      this.position = {};
      // this.$bus.$off(`saveMember${this.workItemData.id}`);
    },
    loadChildData() {
      if (this.isDisable) {
        return;
      }
      let emitName;
      if (this.arrowDirection === 'right') {
        emitName = 'getChildHandle';
      } else {
        emitName = 'delChildHandle';
      }
      this.$bus.$emit(emitName, {
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        rows: this.workItemData,
      });
      this.arrowDirection = this.arrowDirection === 'right' ? 'down' : 'right';
    },
    addChildWorkItem() {
      this.$bus.$emit('addChild', {
        level: this.workItemData.level + 1,
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        rows: this.workItemData,
      });
    },
    criticalBtnHandle() {
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      this.$bus.$emit('criticalHandle', {
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        critical: Number(!this.workItemData.criticalPath),
      });
      return true;
    },
    changeStartDateHandle() {
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      this.$bus.$emit('changeDate', {
        arrIndex: this.arrIndex,
        startDate: this.returnFormartDate(this.startTime),
        endDate: this.returnFormartDate(this.workItemData.endDate),
        sDate: this.startTime,
        eDate: this.workItemData.endDate,
        id: this.workItemData.id,
        level: this.workItemData.level,
        flag: 'startDate',
        parentId: this.workItemData.parentId,
      });
      return true;
    },
    changeEndDateHandle() {
      // this.returnFormartDate(this.endTime);
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      this.$bus.$emit('changeDate', {
        arrIndex: this.arrIndex,
        startDate: this.returnFormartDate(this.workItemData.startDate),
        endDate: this.returnFormartDate(this.endTime),
        sDate: this.workItemData.startDate,
        eDate: this.endTime,
        id: this.workItemData.id,
        flag: 'endDate',
        level: this.workItemData.level,
        parentId: this.workItemData.parentId,
      });
      return true;
    },
    saveMember(payload) {
      if (!this.checkPremission('editWorkItem')) {
        return false;
      }
      const self = this;
      self.visible = false;
      self.$bus.$off('scrollMemberList');
      self.$bus.$off(`saveMember${self.workItemData.id}`);
      this.$bus.$emit('saveMember', {
        value: payload,
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        handler() {
        },
      });
      return true;
    },
    cancelMember() {
      this.visible = false;
      this.$bus.$off(`cancelMember${this.workItemData.id}`);
    },
    returnFormartDate(time) {
      const dayObj = this.$dayjs(time);
      return dayObj.format('DD-MM-YYYY');
    },
    changeMemberScroll(type = 'member', h = 258, px = 0) {
      const { id } = this.workItemData;
      const childElem = this.$refs[`${type}-${id}`];
      const pos = childElem.getBoundingClientRect();
      const parentElem = this.$refs[`workItem-${id}`];
      const parentRect = parentElem.getBoundingClientRect();
      const gap2 = pos.top - parentRect.top;
      const gap = parentRect.height - gap2;
      const screen = window.document.documentElement.getBoundingClientRect();
      let tops = pos.top + gap;
      this.isBottom = false;
      if (screen.height - tops < (h + parentRect.height)) {
        this.isBottom = true;
        tops -= (h + parentRect.height);
      }
      return {
        top: `${tops}px`,
        left: `${pos.left - px}px`,
      };
    },
    checkPremission(type) {
      const str = `dealbook.workplan.WorkItem.${type}`;
      return this.premissionOwner.indexOf(str) > -1;
    },
    isPlatformDisableBtn() {
      if (this.platform === 'web') {
        if (!this.checkPremission('editWorkItem')) {
          return true;
        }
        return false;
      }
      return true;
    },
    deleteHandle() {
      this.$bus.$emit('delWorkItem', {
        arrIndex: this.arrIndex,
        id: this.workItemData.id,
        level: this.workItemData.level,
        rows: this.workItemData,
        parentId: this.workItemData.parentId,
      });
    },
  },
  created() {
    this.startTime = new Date(this.workItemData.startDate);
    this.endTime = new Date(this.workItemData.endDate);
  },
  mounted() {
    this.$bus.$on(`cancelMember${this.workItemData.id}`, this.cancelMember);
    this.$bus.$on(`cancelDate${this.arrIndex}`, () => {
      this.startTime = new Date(this.workItemData.startDate);
      this.endTime = new Date(this.workItemData.endDate);
    });
  },
  destroyed() {
    this.$bus.$off(`cancelMember${this.workItemData.id}`);
    this.$bus.$off(`cancelDate${this.arrIndex}`);
    this.$bus.$off(`saveMember${this.workItemData.id}`);
  },
};
</script>

<style lang=scss>
@import '../../css/components/wrokItem.scss';
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease-out;
}
.list-enter, .list-leave-to
/* .list-leave-active for below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(200px);
}
</style>
