/** @jsx jsx */
import { React, jsx, css, type ImmutableArray, hooks, defaultMessages as jimuCoreMessages } from 'jimu-core'
import { Alert, defaultMessages as jimuUIMessage } from 'jimu-ui'
import { type _TreeItem, List, type TreeActionDataType, TreeItemActionType, type TreeItemsType, type TreeRenderOverrideItemDataType, type UpdateTreeActionDataType } from 'jimu-ui/basic/list-tree'
import IconClose from 'jimu-icons/svg/outlined/editor/close.svg'
import type { LayersConfig } from '../../config'
import { SettingRow } from 'jimu-ui/advanced/setting-components'

interface FeatureFormListProps {
  layersConfig: ImmutableArray<LayersConfig>
  activeIndex: number
  failedDataSourceIds: string[]
  onRemove: (dsId: string) => void
  onSort: (dsIds: string[]) => void
  onClick: (dsId: string) => void
}

const advancedActionMap = {
  overrideItemBlockInfo: ({ itemBlockInfo }, refComponent) => {
    return {
      name: TreeItemActionType.RenderOverrideItem,
      children: [{
        name: TreeItemActionType.RenderOverrideItemDroppableContainer,
        children: [{
          name: TreeItemActionType.RenderOverrideItemDraggableContainer,
          children: [{
            name: TreeItemActionType.RenderOverrideItemBody,
            children: [{
              name: TreeItemActionType.RenderOverrideItemMainLine,
              children: [{
                name: TreeItemActionType.RenderOverrideItemDragHandle
              }, {
                name: TreeItemActionType.RenderOverrideItemIcon,
                autoCollapsed: true
              }, {
                name: TreeItemActionType.RenderOverrideItemTitle
              }, {
                name: TreeItemActionType.RenderOverrideItemDetailToggle
              }, {
                name: TreeItemActionType.RenderOverrideItemCommands
              }]
            }]
          }]
        }]
      }]
    }
  }
}

const getStyle = () => {
  return css`
    display: block !important;
    &.setting-ui-unit-list {
      width: 100%;
      .tree-item {
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        &.tree-item_level-1 {
        }
        .jimu-checkbox {
          margin-right: 8px;
        }
      }
      .setting-ui-unit-list-new {
        padding-top: 4px;
      }
    }
  `
}

const FeatureFormList = (props: FeatureFormListProps) => {
  const { layersConfig, activeIndex, failedDataSourceIds, onRemove, onSort, onClick } = props

  const translate = hooks.useTranslation(jimuUIMessage, jimuCoreMessages)

  const itemsLength = layersConfig.length
  const itemsJson = React.useMemo<TreeItemsType>(() => {
    const mutableLayersConfig = layersConfig.asMutable({ deep: true })
    return mutableLayersConfig.map((item, index) => ({
      itemStateDetailContent: item,
      itemKey: item.id,
      itemStateTitle: item.name,
      itemStateChecked: index === activeIndex,
      itemStateCommands: [{
        label: translate('remove'),
        iconProps: () => ({ icon: IconClose, size: 12 }),
        action: () => {
          onRemove(item.id)
        }
      }]
    }))
  }, [activeIndex, layersConfig, onRemove, translate])

  const alertIcon = React.useMemo(() => {
    return <Alert
      buttonType='tertiary'
      form='tooltip'
      size='small'
      type='error'
      text={translate('dataSourceCreateError')}
    />
  }, [translate])

  const renderDetail = React.useCallback((actionData: TreeRenderOverrideItemDataType, refComponent: _TreeItem) => {
    const { itemJsons } = refComponent.props
    const [currentItemJson] = itemJsons
    const dsId = currentItemJson?.itemStateDetailContent?.useDataSource?.dataSourceId
    const failed = failedDataSourceIds.includes(dsId)
    return failed ? alertIcon : null
  }, [alertIcon, failedDataSourceIds])

  const handleSort = React.useCallback((actionData: UpdateTreeActionDataType, refComponent: _TreeItem) => {
    if (actionData.updateType === 'handleDidDrop') {
      const dsIds = actionData.targetDropItemChildren.map(item => item.itemKey)
      onSort(dsIds)
    }
  }, [onSort])

  const handleClick = React.useCallback((actionData: TreeActionDataType, refComponent: _TreeItem) => {
    const { itemJsons: [currentItemJson] } = refComponent.props
    onClick(currentItemJson.itemKey)
  }, [onClick])

  const itemPlaceholder = React.useMemo(() => [{
    itemStateDetailContent: '......',
    itemKey: `${activeIndex}`,
    itemStateTitle: '......',
    itemStateChecked: true,
    itemStateCommands: []
  }], [activeIndex])

  return <SettingRow className='setting-ui-unit-list' css={getStyle()}>
    {itemsLength > 0 &&
      <List
        className='w-100'
        itemsJson={itemsJson}
        dndEnabled
        renderOverrideItemDetailToggle={renderDetail}
        onUpdateItem={handleSort}
        onClickItemBody={handleClick}
        {...advancedActionMap}
      />
    }
    {itemsLength === activeIndex &&
      <List
        className='setting-ui-unit-list-new'
        itemsJson={itemPlaceholder}
        dndEnabled={false}
        renderOverrideItemDetailToggle={() => '' }
        {...advancedActionMap}
      />
    }
  </SettingRow>
}

export default FeatureFormList
