import { getBottomTabViewItems } from './shell-view-models.js'

export function getAppRenderModel({
  activeTab,
  bottomTabModels,
  trainRenderModel,
  analyticsScreen,
  progressSections,
  teamSections,
  inboxSections,
  overrideScreen = null,
}) {
  const bottomTabViewItems = getBottomTabViewItems(bottomTabModels)

  if (overrideScreen) {
    return {
      bottomTabs: bottomTabViewItems,
      screen: overrideScreen,
    }
  }

  if (activeTab === 'train') {
    return {
      bottomTabs: bottomTabViewItems,
      screen: {
        type: 'train',
        content: trainRenderModel.content,
        tabs: trainRenderModel.tabs,
      },
    }
  }

  if (activeTab === 'progress') {
    return {
      bottomTabs: bottomTabViewItems,
      screen: {
        type: 'analytics',
        ...(analyticsScreen || {}),
      },
    }
  }

  if (activeTab === 'team') {
    return {
      bottomTabs: bottomTabViewItems,
      screen: {
        type: 'team',
        sections: teamSections,
      },
    }
  }

  return {
    bottomTabs: bottomTabViewItems,
    screen: {
      type: 'inbox',
      sections: inboxSections,
    },
  }
}
