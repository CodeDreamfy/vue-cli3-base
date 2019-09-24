import WorkItem from './WorkItem.vue';

WorkItem.install = (Vue) => {
  Vue.component(WorkItem.name, WorkItem);
};

export default WorkItem;
