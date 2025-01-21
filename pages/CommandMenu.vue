<template>
    <ul class="commandmenu">
      <li 
        v-for="(command, index) in commands" 
        :key="command.command" 
        @mouseover="setCurrentCommand(index)" 
        :class="{ active: currentCommand === index }"
        @click="selectCommand(command.command)"
      >
        <span class="command-text">{{ command.command }}</span>
        <span class="command-description">{{ command.description }}</span>
      </li>
    </ul>
  </template>
  
  <script>
  export default {
    props: {
      currentCommand: {
        type: Number,
        default: 0,
        required: true,
      },
      commands: {
        type: Array,
        default: () => [],
        required: true,
      },
    },
    methods: {
      selectCommand(command) {
        this.$emit("commandSelected", command);
      },
      setCurrentCommand(index) {
        this.$emit("updateCurrentCommand", index);
      },
    },
  };
  </script>
  
  <style scoped>
  .commandmenu {
    list-style: none;
    margin: 0;
    padding: 0;
  
    li {
      padding: 10px;
      cursor: pointer;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 5px;
      transition: background-color 0.2s;
  
      &:hover {
        background-color: #f0f0f0;
      }
  
      &.active {
        background-color: #007bff;
        color: #fff;
      }
    }
  
    .command-text {
      font-weight: bold;
      margin-right: 5px;
    }
  
    .command-description {
      color: #666;
    }
  }
  </style>
  