/** @jsx jsx */
import { React, hooks, jsx, type ImmutableArray } from 'jimu-core'
import { type JimuLayerView, type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import * as reactiveUtils from 'esri/core/reactiveUtils'
import type { IMConfig, LayersConfig } from '../../config'
import { getAllMapLayersConfig } from './utils'

export interface TableMapViewProps {
  useMapWidgetIds: ImmutableArray<string>
  mapViewsConfig: IMConfig['mapViewsConfig']
  mapFilterEnabled: boolean
  onUpdateViewExtent: (extent?: __esri.Extent) => void
  onRestTableGeometry: () => void
  onLayersConfigChange: (layersConfig: LayersConfig[]) => void
}

const TableMapView = (props: TableMapViewProps) => {
  const { useMapWidgetIds, mapViewsConfig, mapFilterEnabled, onUpdateViewExtent, onRestTableGeometry, onLayersConfigChange } = props
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView>(null)

  const mapWidgetId = useMapWidgetIds?.[0]

  // when jimu map view changes, update layers' config
  const updateLayersConfig = React.useCallback(async () => {
    if (!jimuMapView) {
      onLayersConfigChange([])
    } else {
      const mapViewConfig = mapViewsConfig?.[jimuMapView?.id]?.asMutable?.({ deep: true})
      const layersConfig = await getAllMapLayersConfig(mapViewConfig, jimuMapView)
      onLayersConfigChange(layersConfig)
    }
  }, [jimuMapView, mapViewsConfig, onLayersConfigChange])

  const handleActiveViewChange = React.useCallback(async (jimuMapView: JimuMapView) => {
    if (jimuMapView && jimuMapView.view) {
      await jimuMapView.whenJimuMapViewLoaded()
      await jimuMapView.whenAllJimuLayerViewLoaded()
    }
    setJimuMapView(jimuMapView)
  }, [])

  // when jimu map view changes, bind layer view events(created, removed, visible change) with `updateLayersConfig`
  const updateLayersConfigRef = hooks.useLatest(updateLayersConfig)
  const visibleChangedListener = React.useCallback((visibleChangedJimuLayerViews: JimuLayerView[]) => {
    updateLayersConfigRef.current?.()
  }, [updateLayersConfigRef])

  const viewCreatedListener = React.useCallback((jimuLayerView: JimuLayerView) => {
    if (jimuLayerView.fromRuntime) {
      updateLayersConfigRef.current?.()
    }
  }, [updateLayersConfigRef])

  const viewRemovedListener = React.useCallback((removedJimuLayerView: JimuLayerView) => {
    if (removedJimuLayerView.fromRuntime) {
      updateLayersConfigRef.current?.()
    }
  }, [updateLayersConfigRef])

  React.useEffect(() => {
    // Resetting mapViewsConfig and update jimuMapView will inevitably trigger updateLayersConfig twice,
    // and debounce will have unexpected trouble with multiple dependencies, so this setTimeout is used.
    const updateTimeout = window.setTimeout(updateLayersConfig, 50)
    return () => {
      window.clearTimeout(updateTimeout)
    }
  }, [updateLayersConfig])

  React.useEffect(() => {
    if (!jimuMapView || !jimuMapView.view) return
    jimuMapView.addJimuLayerViewsVisibleChangeListener(visibleChangedListener)
    jimuMapView.addJimuLayerViewCreatedListener(viewCreatedListener)
    jimuMapView.addJimuLayerViewRemovedListener(viewRemovedListener)
    const oldJimuMapView = jimuMapView
    return () => {
      if (oldJimuMapView) {
        oldJimuMapView.removeJimuLayerViewsVisibleChangeListener(visibleChangedListener)
        oldJimuMapView.removeJimuLayerViewCreatedListener(viewCreatedListener)
        oldJimuMapView.removeJimuLayerViewRemovedListener(viewRemovedListener)
      }
    }
  }, [jimuMapView, viewCreatedListener, viewRemovedListener, visibleChangedListener])

  // when map extent changes, update ds query params
  const timer = React.useRef<number>(null)
  const debounceUpdateViewExtent = React.useCallback((extent?) => {
    timer.current !== null && window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      onUpdateViewExtent(extent)
    }, 500)
  }, [onUpdateViewExtent])

  React.useEffect(() => {
    let viewWatcher: __esri.Handle
    if (jimuMapView && jimuMapView.view && mapFilterEnabled) {
      const view = jimuMapView.view
      const currentExtent = view.extent.clone()
      debounceUpdateViewExtent(currentExtent)
      viewWatcher = reactiveUtils.watch(() => view?.extent, (extent: __esri.Extent) => {
        debounceUpdateViewExtent(extent)
      })
    }
    if (!mapFilterEnabled ) {
      debounceUpdateViewExtent()
      onRestTableGeometry()
    }
    return () => {
      viewWatcher?.remove?.()
    }
  }, [debounceUpdateViewExtent, jimuMapView, mapFilterEnabled, onRestTableGeometry])

  return <JimuMapViewComponent
    useMapWidgetId={mapWidgetId}
    onActiveViewChange={handleActiveViewChange}
  />
}

export default TableMapView