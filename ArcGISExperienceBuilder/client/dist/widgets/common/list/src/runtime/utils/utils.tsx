import {
  Status,
  PageStyle,
  DS_TOOL_H,
  BOTTOM_TOOL_H,
  SelectionModeType,
  ListLayoutType,
  type ElementSize,
  type ElementSizeUnit,
  type CardSize,
  LIST_CARD_MIN_SIZE,
  SCROLL_BAR_WIDTH,
  type SortSettingOption,
  type IMCardBackgroundStyle
} from '../../config'
import { getAppStore, Immutable, type LayoutItemConstructorProps } from 'jimu-core'
import type { ListProps, ListStates } from '../widget'
import { type LinearUnit, DistanceUnits, utils as jimuUtils } from 'jimu-ui'
import type { AppConfigAction } from 'jimu-for-builder'

export function isScrollStart (
  listDiv: HTMLDivElement,
  lastScrollOffset: number
): boolean {
  if (!listDiv) return true
  const scrollTOrL = lastScrollOffset
  const isStart = scrollTOrL < 2
  return isStart
}

export function isEqualCardSizeByListLayout (
  cardSize1: ElementSize,
  cardSize2: ElementSize,
  layoutType: ListLayoutType
) {
  if (layoutType === ListLayoutType.Column) {
    return isEqualNumber(cardSize1.width, cardSize2.width)
  } else if (layoutType === ListLayoutType.Row) {
    return isEqualNumber(cardSize1.height, cardSize2.height)
  } else {
    return isEqualNumber(cardSize1.width, cardSize2.width) && isEqualNumber(cardSize1.height, cardSize2.height)
  }
}

export function isEqualNumber (num1: number, num2: number): boolean {
  if (Math.abs(num1 - num2) < 0.0001) {
    return true
  } else {
    return false
  }
}

export function getCardSizeNumberInConfig (props: ListProps, widgetRect: ElementSize): ElementSize {
  const { config } = props
  const cardSizeInConfig = getCardSizeConfig(props)
  const widthLinearUnit = jimuUtils.toLinearUnit(cardSizeInConfig.width)
  let width = initCardSize(jimuUtils.toLinearUnit(cardSizeInConfig.width), widgetRect.width + config.horizontalSpace - SCROLL_BAR_WIDTH)
  //The width in percentage includes space, the width in px does not include
  if (widthLinearUnit.unit === DistanceUnits.PERCENTAGE) {
    width = (width - config.horizontalSpace) > 0 ? width - config.horizontalSpace : LIST_CARD_MIN_SIZE
  }

  let height = initCardSize(jimuUtils.toLinearUnit(cardSizeInConfig.height), widgetRect.height)
  if (config.keepAspectRatio && config?.layoutType === ListLayoutType.GRID) {
    height = width * config?.gridItemSizeRatio
  }
  const cardSize = {
    width: width,
    height: height
  }
  return cardSize
}

export function getCardSizeConfig (props: ListProps): CardSize {
  const { config, builderStatus, browserSizeMode } = props
  let cardConfigs = config?.asMutable({ deep: true }).cardConfigs[builderStatus]
  if (!cardConfigs || !cardConfigs.cardSize) {
    cardConfigs = config?.asMutable({ deep: true }).cardConfigs[Status.Default]
  }
  let cardSizeInConfig = cardConfigs?.cardSize?.[browserSizeMode]
  if (!cardSizeInConfig) {
    cardSizeInConfig = cardConfigs.cardSize[Object.keys(cardConfigs.cardSize)[0]]
  }
  return cardSizeInConfig
}

export function getDefaultMinListSize (props: ListProps): ElementSize {
  const cardSizeInConfig = getCardSizeConfig(props)
  const listMinSize = {
    width: LIST_CARD_MIN_SIZE,
    height: LIST_CARD_MIN_SIZE
  }
  const cardSizeUnit = {
    width: jimuUtils.toLinearUnit(cardSizeInConfig.width),
    height: jimuUtils.toLinearUnit(cardSizeInConfig.height)
  }
  if (cardSizeUnit.width.unit === DistanceUnits.PERCENTAGE) {
    listMinSize.width = (LIST_CARD_MIN_SIZE + 30) / cardSizeUnit.width.distance * 100
  }
  if (cardSizeUnit.height.unit === DistanceUnits.PERCENTAGE) {
    listMinSize.height = (LIST_CARD_MIN_SIZE + 30) / cardSizeUnit.height.distance * 100
  }
  return listMinSize
}

export function getCardSizeWidthUnitInConfig (props: ListProps): ElementSizeUnit {
  const { config } = props
  const cardSizeInConfig = getCardSizeConfig(props)
  const width = jimuUtils.toLinearUnit(cardSizeInConfig.width)

  if (width.unit === DistanceUnits.PERCENTAGE) {
    width.distance = (width.distance - config.horizontalSpace) > 0 ? width.distance - config.horizontalSpace : LIST_CARD_MIN_SIZE
  }

  const cardSizeWidthUnit = {
    width: width,
    height: jimuUtils.toLinearUnit(cardSizeInConfig.height)
  }
  return cardSizeWidthUnit
}

export function initCardSize (sizeUnit: LinearUnit, widgetSize: number): number {
  if (sizeUnit.unit === DistanceUnits.PERCENTAGE) {
    return (sizeUnit.distance / 100) * widgetSize
  } else {
    return sizeUnit.distance
  }
}

export function getPageSize (
  widgetRect: ElementSize,
  listHeight: number,
  props: ListProps,
  columnCount: number
): number {
  const cardSize = getCardSizeNumberInConfig(props, widgetRect)
  const { config, isHeightAuto, isWidthAuto } = props
  let pageSize
  if (config.pageStyle === PageStyle.Scroll) {
    if (!widgetRect) {
      return 0
    }
    switch (config?.layoutType) {
      case ListLayoutType.Row:
        if (widgetRect.height === 0) return 0
        if (isHeightAuto) {
          listHeight = document.body.scrollHeight
        }
        pageSize = Math.ceil((listHeight + config.space) / (cardSize.height + config.space)) + 1
        break
      case ListLayoutType.Column:
        if (widgetRect.width === 0) return 0
        let listWidth = widgetRect.width
        if (isWidthAuto) {
          listWidth = document.body.scrollWidth
        }
        pageSize = Math.ceil((listWidth + config.space) / (cardSize.width + config.space)) + 1
        break
      case ListLayoutType.GRID:
        if (widgetRect.height === 0) return 0
        if (isHeightAuto) {
          listHeight = document.body.scrollHeight
        }
        pageSize = Math.ceil((listHeight + config?.verticalSpace) / (cardSize.height + config.space)) * columnCount
        break
    }
    if (config.navigatorOpen) {
      pageSize = Math.max(pageSize, config.scrollStep)
    }
  } else {
    pageSize = config.itemsPerPage
  }
  return pageSize
}

export function getBottomToolH (
  paginatorDiv: HTMLDivElement,
  showBottomTools: boolean
): number {
  let bottomToolH = BOTTOM_TOOL_H
  if (paginatorDiv) {
    bottomToolH = paginatorDiv.clientHeight
  }
  bottomToolH = showBottomTools ? bottomToolH : 0
  return bottomToolH
}

export function getListHeight (
  widgetRect,
  bottomToolH: number,
  showTopTool: boolean
): number {
  const dsToolH = showTopTool ? DS_TOOL_H : 0
  if (!widgetRect) return 0
  const height = widgetRect.height - dsToolH - bottomToolH
  return height < 0 ? 0 : height
}

export function showBottomTools (props: ListProps, state: ListStates): boolean {
  const { config } = props
  const { datasource } = state
  return (
    !!datasource &&
    !(config.pageStyle === PageStyle.Scroll && !config.navigatorOpen)
  )
}

export function showTopTools (props: ListProps): boolean {
  return (
    checkIsShowListToolsOnly(props) || checkIsShowDataAction(props)
  )
}

export function checkIsShowListToolsOnly (props: ListProps): boolean {
  return (
    showSort(props) ||
    showDisplaySelectedOnly(props) ||
    showClearSelected(props) ||
    showFilter(props) ||
    showSearch(props) ||
    props?.config?.showRefresh
  )
}

export function isDsConfigured (props: ListProps): boolean {
  const { useDataSources } = props
  return !!useDataSources && !!useDataSources[0]
}

export function checkIsShowDataAction (props: ListProps): boolean {
  const { id, config } = props
  const appConfig = getAppStore()?.getState()?.appConfig
  const widgetJson = appConfig?.widgets?.[id]
  const enableDataAction = widgetJson?.enableDataAction === undefined ? true : widgetJson?.enableDataAction
  return enableDataAction && isDsConfigured(props) && config.isItemStyleConfirm
}

export function showSort (props: ListProps): boolean {
  const { config } = props
  if (!config.sortOpen || !config.sorts || config.sorts.length < 1) return false
  const sorts = config.sorts
  let isValid = false
  sorts.some((sort: SortSettingOption) => {
    sort.rule &&
      sort.rule.some(sortData => {
        if (sortData && !!sortData.jimuFieldName) {
          isValid = true
        }
        return isValid
      })
    return isValid
  })
  return isValid
}

export function showSearch (props: ListProps): boolean {
  const { config } = props
  return config.searchOpen && !!config.searchFields
}

export function showFilter (props: ListProps): boolean {
  const { config } = props
  return config.filterOpen && !!config.filter
}

export function showDisplaySelectedOnly (props: ListProps): boolean {
  const { config } = props
  return (
    config.showSelectedOnlyOpen &&
    config.cardConfigs[Status.Selected].selectionMode !== SelectionModeType.None
  )
}

export function showClearSelected (props: ListProps): boolean {
  const { config } = props
  return (
    config.showClearSelected &&
    config.cardConfigs[Status.Selected].selectionMode !== SelectionModeType.None
  )
}

export function intersectionObserver (
  ref: HTMLElement,
  rootElement: HTMLElement,
  onChange?: (isIn: boolean) => void,
  options?: IntersectionObserverInit
) {
  const option: any = options || { root: rootElement }
  const callback = function (
    entries: IntersectionObserverEntry[],
    observer: IntersectionObserver
  ) {
    const isIn = entries[0].intersectionRatio > 0
    onChange && onChange(isIn)
  }
  const observer = new IntersectionObserver(callback, option)
  observer.observe(ref)
  return observer
}

export function initBackgroundStyle (cardBackgroundStyle: IMCardBackgroundStyle) {
  const newCardBackgroundStyle = cardBackgroundStyle?.asMutable({ deep: true })
  const border = newCardBackgroundStyle?.border || {}
  if ((border as any)?.color || !newCardBackgroundStyle?.border) {
    return cardBackgroundStyle
  } else {
    delete newCardBackgroundStyle?.border
    return Immutable({
      ...newCardBackgroundStyle,
      ...border
    })
  }
}

export function isItemAccept (
  item: LayoutItemConstructorProps,
  isPlaceholder: boolean,
  isEditing: boolean,
  widgetId: string,
  builderSupportModules: any
): boolean {
  if (!item) return false
  const supportRepeat = item.manifest?.properties?.supportRepeat
  const action: AppConfigAction = builderSupportModules.jimuForBuilderLib.getAppConfigAction()
  const appConfig = action.appConfig
  const selectionInList = builderSupportModules.widgetModules.selectionInList
  return (
    isEditing &&
    supportRepeat &&
    (!item.layoutInfo ||
      (item.layoutInfo &&
        selectionInList(item.layoutInfo, widgetId, appConfig, false)))
  )
}
