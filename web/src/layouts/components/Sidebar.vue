<script setup lang="ts">
import AccountModal from '@/components/AccountModal.vue'
import { useSidebarData } from '../composables/useSidebarData'
import RemarkModal from './RemarkModal.vue'
import SidebarAccountPanel from './SidebarAccountPanel.vue'
import SidebarBrand from './SidebarBrand.vue'
import SidebarFooter from './SidebarFooter.vue'
import SidebarNav from './SidebarNav.vue'

const {
  currentAccount,
  sidebarCollapsed,
  sidebarOpen,

  showAccountModal,
  showRemarkModal,
  accountToEdit,
  handleAccountSaved,
  openRemarkForCurrent,

  serverVersion,
  uptime,
  formattedTime,
  connectionStatus,

  displayInfo,
  selectedAccountId,
  accountOptions,

  menuItems,
  onMenuClick,

  version,
  appStore,
} = useSidebarData()
</script>

<template>
  <!-- Desktop sider -->
  <a-layout-sider
    class="hidden xl:block"
    :width="230"
    :collapsed-width="72"
    :collapsed="sidebarCollapsed"
    theme="light"
  >
    <div class="h-full flex flex-col a-bg-container">
      <SidebarBrand :collapsed="sidebarCollapsed" />
      <SidebarAccountPanel
        v-model:selected-account-id="selectedAccountId"
        :collapsed="sidebarCollapsed"
        :display-info="displayInfo"
        :connection-status="connectionStatus"
        :account-options="accountOptions"
        :current-account="currentAccount"
        @open-remark="openRemarkForCurrent"
        @add-account="showAccountModal = true"
      />
      <SidebarNav
        :items="menuItems"
        :collapsed="sidebarCollapsed"
        :active-key="$route.path"
        @menu-click="onMenuClick"
      />
      <SidebarFooter
        :collapsed="sidebarCollapsed"
        :uptime="uptime"
        :formatted-time="formattedTime"
        :version="version"
        :server-version="serverVersion"
        :connection-status="connectionStatus"
      />
    </div>
  </a-layout-sider>

  <!-- Mobile drawer -->
  <a-drawer
    class="xl:hidden"
    placement="left"
    :open="sidebarOpen"
    :size="230"
    :closable="false"
    :styles="{ body: { padding: '0px' } }"
    @close="appStore.closeSidebar()"
  >
    <div class="h-full flex flex-col a-bg-container">
      <SidebarBrand />
      <SidebarAccountPanel
        v-model:selected-account-id="selectedAccountId"
        :display-info="displayInfo"
        :connection-status="connectionStatus"
        :account-options="accountOptions"
        :current-account="currentAccount"
        @open-remark="openRemarkForCurrent"
        @add-account="showAccountModal = true"
      />
      <SidebarNav
        :items="menuItems"
        :active-key="$route.path"
        @menu-click="onMenuClick"
      />
      <SidebarFooter
        :uptime="uptime"
        :formatted-time="formattedTime"
        :version="version"
        :server-version="serverVersion"
        :connection-status="connectionStatus"
      />
    </div>
  </a-drawer>

  <AccountModal
    :show="showAccountModal"
    :edit-data="accountToEdit"
    @close="((showAccountModal = false), (accountToEdit = null))"
    @saved="handleAccountSaved"
  />

  <RemarkModal
    :show="showRemarkModal"
    :account="accountToEdit"
    @close="showRemarkModal = false"
    @saved="handleAccountSaved"
  />
</template>
