import { AssistantPackage, RuleContext, RuleDefinition, SketchFileObject } from '@sketch-hq/sketch-assistant-types'
const emojiStrip = require('emoji-strip')

const artboardNameCheck: RuleDefinition = {
  rule: async (context) => {
    const { utils } = context;
    for (const page of utils.objects.page) {
      if (page.name === "Symbols" || isArchived(page.name)) { continue; };
      const pageName = emojiStrip(page.name).trim();
      for (const artboard of page.layers) {
        if (artboard._class !== 'artboard'
          || artboard.name == pageName
          || isArchived(artboard.name)
          || utils.isObjectIgnored(artboard)) { continue; };

        if (!artboard.name.startsWith(pageName + " - "))
          context.utils.report(`Artboard "${artboard.name}"'s Name should start with "${pageName} - "`, artboard);
      }
    }
  },
  name: 'sketch-assistant-dp-htx/artboard-name-start-with-page-name',
  title: 'Artboard name should start with it\'s parent page\'s name',
  description: 'Reports a violation when Artboard name does not start with its parent page\'s name without emoji',
}

const pageNameCheck: RuleDefinition = {
  rule: async (context) => {
    const { utils } = context;
    const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    for (const page of utils.objects.page) {
      // ignore the automatically generated Symbols page which holds all the symbols
      if (page.name === "Symbols") { continue; };

      const firstCharacter = [...page.name][0];
      const paragraph = "" + firstCharacter;
      if (!paragraph.match(regex)) {
        utils.report(`Page "${page.name}" should start with an emoji`, page);
      }
    }
  },
  name: 'sketch-assistant-dp-htx/page-name-start-with-emoji',
  title: 'Page name should starts with an emoji',
  description: 'Reports a violation when Page name does not start with an emoji'
}

const groupNameCheck: RuleDefinition = {
  rule: async (context) => {
    const { utils } = context;
    const numberRegex = new RegExp('^\\d+$');

    for (const page of utils.objects.page) {
      if (isArchived(page.name)) { continue; };
      for (const artboard of page.layers) {
        if (artboard._class !== 'artboard' || isArchived(artboard.name)) { continue; };
        for (const group of artboard.layers) {
          if (isArchived(group.name)
            || group._class !== 'group'
            || utils.isObjectIgnored(group)) { continue; };
          if (group.name === "Group") {
            reportGroupNameViolation(context, group.name, group);
            continue;
          }
          const nameComponents = group.name.split(' ');
          if (nameComponents.length == 2 && nameComponents[0] === "Group" && nameComponents[1].match(numberRegex)) {
            reportGroupNameViolation(context, group.name, group);
            continue;
          }
          if (nameComponents.length > 1 && nameComponents[nameComponents.length - 1] === "Copy") {
            reportGroupNameViolation(context, group.name, group);
          }
        }
      }
    }
  },
  name: 'sketch-assistant-dp-htx/group-name-shouldnt-be-default',
  title: 'Group should not be left with the default name',
  description: 'Reports a violation when Group kept it\'s default name',
}

function reportGroupNameViolation(context: RuleContext, groupName: String, layer: SketchFileObject) {
  context.utils.report(`Group name for "${groupName}" shouldn't be default`, layer);
}

const symbolNameCheck: RuleDefinition = {
  rule: async (context) => {
    const { utils } = context;
    for (const page of utils.objects.page) {
      if (page.name === 'Symbols') {
        for (const symbol of page.layers) {
          if (isArchived(symbol.name)
            || utils.isObjectIgnored(symbol)) { continue; };
          if (symbol.name.split('/').length <= 1) {
            context.utils.report(`Symbol "${symbol.name}" should use forward slash grouping`, symbol);
          }
        }
        return;
      }
    }
  },
  name: 'sketch-assistant-dp-htx/symbol-name-should-use-forward-slash-grouping',
  title: 'Symbol names should use forward slash grouping',
  description: 'Reports a violation when symbol is not using forward slash grouping',
}

const assistant: AssistantPackage = async () => {
  return {
    name: 'sketch-assistant-dp-htx',
    rules: [artboardNameCheck, pageNameCheck, groupNameCheck, symbolNameCheck],
    config: {
      rules: {
        'sketch-assistant-dp-htx/artboard-name-start-with-page-name': { active: true },
        'sketch-assistant-dp-htx/page-name-start-with-emoji': { active: true },
        'sketch-assistant-dp-htx/group-name-shouldnt-be-default': { active: true },
        'sketch-assistant-dp-htx/symbol-name-should-use-forward-slash-grouping': { active: true },
      },
    },
  }
}

export default assistant

function isArchived(name: String) {
  return name.trimRight().endsWith("Archive");
}