<template>
  <div class="d-flex flex-column" style="height: 100%;">
    <!-- Header Area -->
    <div class="pa-4 flex-shrink-0">
      <slot name="header"></slot>
    </div>

    <v-divider></v-divider>

    <!-- Content Area -->
    <div class="pa-4 flex-grow-1" style="overflow-y: auto;">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
// This component provides a layout for tool pages with a fixed header and scrollable content.
</script> 