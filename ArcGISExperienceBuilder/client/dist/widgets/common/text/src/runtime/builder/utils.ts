import { Immutable, type ImmutableArray, type UseDataSource, DataSourceManager, dataSourceUtils } from 'jimu-core'
import { sanitizer, richTextUtils } from 'jimu-ui'
import { replacePlaceholderTextContent } from '../../utils'
import { ZeroWidthSpace } from '../../consts'
export  { getExpressionParts }  from'../../utils'
export const DATA_SOURCE_ID_REGEXP = /data-dsid=\"(((?![\=|\>|\"]).)*)[\"\>|"\s)]/gm

const hasDataSourceInstance = (dataSourceId: string) => {
  return DataSourceManager.getInstance().getDataSource(dataSourceId) != null
}

export const getMainDataSourceIds = (useDataSources: ImmutableArray<UseDataSource> = Immutable([])): ImmutableArray<string> => {
  return useDataSources.map(ds => {
    return hasDataSourceInstance(ds?.dataSourceId) ? ds?.mainDataSourceId : null
  }).filter(ds => ds != null)
}

/**
 * Getting the data source ids from html string through regular expressions
 *
 * @param html
 *
 * <p> ddd<exp data-uniqueid="e3c" data-dsid="ds_1" data-expression="{name: value}">{Rank}</exp>
 * <a href="#" target="_blank" data-uniqueid="9721" data-dsid="ds_2" data-link="{name:value}">link</a></p>
 *
 * @returns ['ds_1', 'ds_2']
 */
export const getUseDataSourceIds = (html: string): string[] => {
  const regexp = DATA_SOURCE_ID_REGEXP
  let dsIds = []
  let matches
  while ((matches = regexp.exec(html)) !== null) {
    let ids = matches[1]
    if (ids.indexOf(',') > 0) {
      ids = ids.split(',')
      dsIds = dsIds.concat(ids)
    } else {
      dsIds.push(ids)
    }
  }
  return dsIds
}

export const getInvalidDataSourceIds = (text: string, useDataSources: ImmutableArray<UseDataSource>): string[] => {
  const ids = getUseDataSourceIds(text)
  if (ids == null || !ids.length) return
  let mainDsIds = ids.map((id) => dataSourceUtils.getMainDataSourceId(id)).filter(id => id != null)
  mainDsIds = Array.from(new Set(mainDsIds))
  const usedMainDsIds = getMainDataSourceIds(useDataSources)
  return mainDsIds.filter(id => !usedMainDsIds.includes(id))
}

/**
 * When `value` is empty and `enabled` is false, show the placeholder in editor
 *
 * @param value config.text
 * @param placeholder config.placeholder
 * @param enabled rich text editor is enabled or not
 */
export const shouldShowPlaceholder = (value: string, placeholder: string, enabled?: boolean): boolean => {
  const onlyPlaceholder = richTextUtils.isBlankRichText(value) && !!placeholder
  if (typeof enabled !== 'undefined') {
    return !enabled && onlyPlaceholder
  }
  return onlyPlaceholder
}

export const sanitizeHTML = (html = ''): string => {
  return html !== '' ? sanitizer.sanitize(html) : html
}

/**
 * Get the default value of the rich text editor
 */
export const getDefaultValue = (enabled: boolean, value: string, placeholder: string = ''): string => {
  let defaultValue = value
  const showPlaceholder = shouldShowPlaceholder(value, placeholder)
  if (enabled) {
    // When editor is enabled and `showPlaceholder` is true, will show placeholder without textContent in editor
    if (showPlaceholder) {
      defaultValue = replacePlaceholderTextContent(placeholder, ZeroWidthSpace)
    }
  } else {
    // When editor is not enabled, if `showPlaceholder` is true, show placeholder in editor, otherwise, show value in editor
    defaultValue = showPlaceholder ? placeholder : value
  }

  return sanitizeHTML(defaultValue)
}
