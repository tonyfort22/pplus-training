export function getAppRenderModel({
  activeTab,
  bottomTabModels,
  trainRenderModel,
  progressSections,
  teamSections,
  inboxSections,
}) {
  if (activeTab === 'train') {
    return {
      bottomTabs: bottomTabModels,
      screen: {
        type: 'train',
        content: trainRenderModel.content,
        tabs: trainRenderModel.tabs,
      },
    }
  }

  if (activeTab === 'progress') {
    return {
      bottomTabs: bottomTabModels,
      screen: {
        type: 'progress',
        sections: progressSections,
      },
    }
  }

  if (activeTab === 'team') {
    return {
      bottomTabs: bottomTabModels,
      screen: {
        type: 'team',
        sections: teamSections,
      },
    }
  }

  return {
    bottomTabs: bottomTabModels,
    screen: {
      type: 'inbox',
      sections: inboxSections,
    },
  }
}
