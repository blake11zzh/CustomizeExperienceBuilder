/** @jsx jsx */
import {
  React,
  jsx,
  css,
  Immutable,
  type ImmutableObject,
  DataSourceManager,
  type UseDataSource,
  type FeatureLayerDataSource,
  type SceneLayerDataSource,
  type IconResult,
  classNames,
  AllDataSourceTypes,
  hooks,
  dataSourceUtils,
  focusElementInKeyboardMode
} from 'jimu-core'
import { TextInput, Switch } from 'jimu-ui'
import { IconPicker } from 'jimu-ui/advanced/resource-selector'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from './translations/default'
import { type QueryItemType, QueryArrangeType } from '../config'
import { getOutputJsonOriginDs } from './setting-utils'
import { AttributeFilterSetting } from './attribute-filter'
import { SpatialFilterSetting } from './spatial-filter'
import { ResultsSetting } from './results'
import { DEFAULT_QUERY_ITEM } from '../default-query-item'
import { useDataSourceExists } from '../common/use-ds-exists'

const dsTypes = Immutable([
  AllDataSourceTypes.FeatureLayer,
  AllDataSourceTypes.SceneLayer,
  AllDataSourceTypes.BuildingComponentSubLayer,
  AllDataSourceTypes.OrientedImageryLayer,
  AllDataSourceTypes.ImageryLayer,
  AllDataSourceTypes.SubtypeSublayer
])

interface Props {
  widgetId: string
  arrangeType: QueryArrangeType
  total: number
  index: number
  visible: boolean
  queryItem?: ImmutableObject<QueryItemType>
  handleStageChange: (id: number) => void
  onQueryItemChanged: (index: number, item: ImmutableObject<QueryItemType>, dsUpdateRequired?: boolean) => void
  onQueryItemAdded: (item: ImmutableObject<QueryItemType>) => void
}

function createNewQueryItem (
  widgetId: string,
  useDataSource: UseDataSource,
  outputJsonOriginDs: FeatureLayerDataSource
): ImmutableObject<QueryItemType> {
  const nextConfigId = `${Math.random()}`.slice(2)
  const queryItemLabel = outputJsonOriginDs?.getLabel()
  return Immutable({
    configId: nextConfigId,
    name: queryItemLabel,
    useDataSource: useDataSource as any,
    outputDataSourceId: `${widgetId}_output_${nextConfigId}`,

    spatialRelationUseDataSources: [] as any
  })
}

export function QueryItemSettingMain (props: Props) {
  const { index, total, arrangeType, widgetId, queryItem, onQueryItemAdded, onQueryItemChanged, handleStageChange, visible } = props
  const getI18nMessage = hooks.useTranslation(defaultMessages)
  const [itemLabel, setItemLabel] = React.useState('')
  const currentItem = Object.assign({}, DEFAULT_QUERY_ITEM, queryItem)
  const stageChangeTrigger = React.useRef<HTMLElement>()
  const useDataSources = currentItem.useDataSource != null ? Immutable([currentItem.useDataSource]) : undefined

  const dsExists: boolean = useDataSourceExists({ widgetId, useDataSourceId: currentItem.useDataSource?.dataSourceId })

  React.useEffect(() => {
    if (queryItem?.name && itemLabel !== queryItem.name) {
      setItemLabel(queryItem.name)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryItem?.name])

  React.useEffect(() => {
    if (visible && stageChangeTrigger.current) {
      focusElementInKeyboardMode(stageChangeTrigger.current)
    }
  }, [visible])

  const handleStageChangeInSpatialFilter = React.useCallback((id, event) => {
    stageChangeTrigger.current = event.target
    handleStageChange(id)
  }, [handleStageChange])

  const handleUseDsChanged = (useDataSource: UseDataSource) => {
    if (!useDataSource) {
      return
    }
    // check if the new ds is derived from the same main ds
    if (queryItem?.useDataSource?.dataSourceId && dataSourceUtils.areDerivedFromSameMain(queryItem.useDataSource.dataSourceId, useDataSource.dataSourceId)) {
      let newItem = queryItem.setIn(['useDataSource', 'dataSourceId'], useDataSource.dataSourceId)
      const ds = DataSourceManager.getInstance().getDataSource(useDataSource.dataSourceId)
      const label = ds.getLabel()
      if (useDataSource.dataViewId) {
        newItem = newItem.setIn(['useDataSource', 'dataViewId'], useDataSource.dataViewId).set('name', label)
      } else if (queryItem.useDataSource.dataViewId) {
        newItem = newItem.set('useDataSource', newItem.useDataSource.without('dataViewId')).set('name', label)
      }
      onQueryItemChanged(index, newItem, true)
      return
    }

    DataSourceManager.getInstance()
      .createDataSourceByUseDataSource(Immutable(useDataSource))
      .then((originDs: FeatureLayerDataSource | SceneLayerDataSource) => {
        const outputJsonOriginDs = getOutputJsonOriginDs(originDs)
        if (!outputJsonOriginDs) Promise.reject(Error(''))
        return outputJsonOriginDs
      })
      .then((outputJsonOriginDs: FeatureLayerDataSource) => {
        if (queryItem == null) {
          const newItem = createNewQueryItem(widgetId, useDataSource, outputJsonOriginDs)
          onQueryItemAdded(newItem)
        } else {
          // only keep the configId when data source changed
          const newItem = Immutable({
            configId: queryItem.configId,
            name: outputJsonOriginDs?.getLabel(),
            useDataSource: useDataSource,
            outputDataSourceId: queryItem.outputDataSourceId,
            spatialRelationUseDataSources: [] as any
          })

          onQueryItemChanged(index, newItem, true)
        }
      })
  }

  const updateProperty = React.useCallback((prop: string, value: any, dsUpdateRequired = false) => {
    let newItem
    if (value == null) {
      newItem = queryItem.without(prop as any)
    } else {
      newItem = queryItem.set(prop, value)
    }
    onQueryItemChanged(index, newItem, dsUpdateRequired)
  }, [onQueryItemChanged, index, queryItem])

  const updateItem = (newItem: ImmutableObject<QueryItemType>, dsUpdateRequired = false) => {
    onQueryItemChanged(index, newItem, dsUpdateRequired)
  }

  const handleLabelChange = React.useCallback((e) => { setItemLabel(e.target.value) }, [])

  const handleLabelAccept = React.useCallback((value) => {
    if (value.trim().length > 0) {
      updateProperty('name', value, true)
    } else {
      setItemLabel(queryItem.name)
    }
  }, [queryItem?.name, updateProperty])

  return (
    <div className={classNames('h-100', { 'd-none': !visible })}>
      <div css={css`height: 100%;overflow: auto;`}>
        <SettingSection role='group' aria-label={getI18nMessage('data')} title={getI18nMessage('data')} className='pt-0'>
          <SettingRow>
            <DataSourceSelector
              widgetId={widgetId}
              disableRemove={() => true}
              mustUseDataSource
              closeDataSourceListOnChange
              types={dsTypes}
              isMultiple={false}
              useDataSources={dsExists ? useDataSources as any : undefined}
              onChange={(useDataSources) => { handleUseDsChanged(useDataSources?.[0]) }}
            />
          </SettingRow>
        </SettingSection>
        {queryItem && dsExists && (
          <React.Fragment>
            <SettingSection role='group' aria-label={getI18nMessage('label')} title={getI18nMessage('label')}>
              <SettingRow>
                <TextInput
                  aria-label={getI18nMessage('label')}
                  className='w-100'
                  size='sm'
                  value={itemLabel}
                  onChange={handleLabelChange}
                  onAcceptValue={handleLabelAccept}
                />
              </SettingRow>
              {total < 2 && arrangeType !== QueryArrangeType.Inline && (
                <SettingRow tag='label' label={getI18nMessage('displayLabel')}>
                  <Switch
                    checked={currentItem.displayLabel}
                    onChange={(e) => { updateProperty('displayLabel', e.target.checked) }}
                  />
                </SettingRow>
              )}
            </SettingSection>
            <SettingSection role='group' aria-label={getI18nMessage('icon')}>
              <SettingRow label={getI18nMessage('icon')} truncateLabel>
                <IconPicker
                  icon={currentItem.icon as IconResult}
                  onChange={(icon) => { updateProperty('icon', icon) }}
                  configurableOption='none'
                  setButtonUseColor={false}
                />
              </SettingRow>
            </SettingSection>
            <AttributeFilterSetting
              queryItem={queryItem}
              onPropertyChanged={updateProperty}
              onQueryItemChanged={updateItem}
            />
            <SpatialFilterSetting
              queryItem={queryItem}
              onPropertyChanged={updateProperty}
              handleStageChange={handleStageChangeInSpatialFilter}
            />
            <ResultsSetting widgetId={widgetId} queryItem={queryItem} onPropertyChanged={updateProperty} onQueryItemChanged={updateItem} />
          </React.Fragment>
        )}
      </div>
    </div>
  )
}
