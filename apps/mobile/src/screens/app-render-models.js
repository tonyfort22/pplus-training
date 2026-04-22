import { getBottomTabViewItems } from './shell-view-models.js'

export function getAppRenderModel({
  activeTab,
  bottomTabModels,
  trainRenderModel,
  progressSections,
  teamSections,
  inboxSections,
}) {
  const bottomTabViewItems = getBottomTabViewItems(bottomTabModels)

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
        type: 'progress',
        sections: progressSections,
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
