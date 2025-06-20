import {
  type ImmutableArray, Immutable, type UseDataSource, type DataRecord, React, MultipleDataSourceComponent,
  type DataSource, type IMDataSourceInfo, withRepeatedDataSource, type RepeatedDataSource, CONSTANTS,
  DataSourceManager, type IMUseDataSource
} from 'jimu-core'

interface Props {
  widgetId: string
  useDataSource: IMUseDataSource
  isSelectedFromRepeatedDataSourceContext?: boolean

  onRecordChange?: (record: DataRecord) => void
}

interface ExtraProps {
  repeatedDataSource: RepeatedDataSource | RepeatedDataSource[]
}

interface State {
  infos: { [dataSourceId: string]: IMDataSourceInfo }
}

class _RecordComponent extends React.PureComponent<Props & ExtraProps, State> {

  constructor (props: Props & ExtraProps) {
    super(props)
    this.state = {
      infos: null
    }
  }

  componentDidMount () {
    this.updateRecord()
  }

  updateRecord = () => {
    const record = this.getSingleRecord()
    if (this.props.onRecordChange) {
      this.props.onRecordChange(record?.clone?.())
    }
  }

  componentDidUpdate (prevProps: Props & ExtraProps, prevState: State) {
    if (this.props.isSelectedFromRepeatedDataSourceContext) {
      if ((this.props.repeatedDataSource !== prevProps.repeatedDataSource) || (this.props.isSelectedFromRepeatedDataSourceContext !== prevProps.isSelectedFromRepeatedDataSourceContext) || (this.state.infos?.[this.props.useDataSource?.dataSourceId]?.version !== prevState.infos?.[this.props.useDataSource?.dataSourceId]?.version)) {
        this.updateRecord()
      }
    } else {
      if (
        this.props.useDataSource !== prevProps.useDataSource || !this.shallowEquals(this.state.infos, prevState.infos)
      ) {
        this.updateRecord()
      }
    }
  }

  shallowEquals = (obj1: { [key: string]: any }, obj2: { [key: string]: any }): boolean => {
    if (!obj1 && !obj2) {
      return true
    } else if (obj1 && obj2) {
      if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false
      } else {
        return !Object.keys(obj1).some(key => obj1[key] !== obj2[key])
      }
    } else {
      return false
    }
  }

  getSingleRecord = () => {
    if (this.props.isSelectedFromRepeatedDataSourceContext) {
      const repeatedDataSource = this.props.repeatedDataSource
      const record = Array.isArray(repeatedDataSource)
        ? (repeatedDataSource)[0]?.record
        : (repeatedDataSource)?.record
      return record
    } else {
      if (!this.props.useDataSource) {
        return null
      }

      const dsId = this.props.useDataSource.dataSourceId
      const isSelectionDataView = dsId.split('-').reverse()[0] === CONSTANTS.SELECTION_DATA_VIEW_ID
      if (isSelectionDataView) {
        const ds = DataSourceManager.getInstance().getDataSource(dsId)
        let record = ds?.getRecords()[0]
        if (!record) {
          const dataViewForNoSelection = ds?.getMainDataSource().getDataView(CONSTANTS.DATA_VIEW_ID_FOR_NO_SELECTION)
          record = dataViewForNoSelection?.getRecords()[0]
        }
        return record
      } else {
        const ds = DataSourceManager.getInstance().getDataSource(dsId)
        const record = ds?.getRecords()[0]
        return record
      }
    }
  }

  onDataSourceCreated = (dss: { [dataSourceId: string]: DataSource }) => {
    if (dss) {
      const infos = {}

      Object.keys(dss).forEach(dsId => {
        if (dsId && dss[dsId]) {
          infos[dsId] = dss[dsId].getInfo()
        }
      })

      this.setState({ infos })
    }
  }

  onDataSourceInfoChange = (infos: { [dataSourceId: string]: IMDataSourceInfo }) => {
    this.setState({ infos })
  }

  addDataViewForNoSelection = (useDataSource: IMUseDataSource): ImmutableArray<UseDataSource> => {
    let selectionDataViews: ImmutableArray<UseDataSource> = Immutable([])
    if (!useDataSource) {
      return selectionDataViews
    }
    if (useDataSource.mainDataSourceId && !selectionDataViews.some(s => s.mainDataSourceId === useDataSource.mainDataSourceId)) {
      const mainDataSource = DataSourceManager.getInstance().getDataSource(useDataSource.mainDataSourceId)
      const mainDataSourceJson = mainDataSource && mainDataSource.getDataSourceJson()
      const dataViewForNoSelection = mainDataSourceJson?.dataViews && mainDataSourceJson?.dataViews[CONSTANTS.DATA_VIEW_ID_FOR_NO_SELECTION]
      if (dataViewForNoSelection) {
        selectionDataViews = selectionDataViews.concat(
          useDataSource.set('dataSourceId', DataSourceManager.getInstance().getDataViewDataSourceId(useDataSource.mainDataSourceId, CONSTANTS.DATA_VIEW_ID_FOR_NO_SELECTION))
            .set('dataViewId', CONSTANTS.DATA_VIEW_ID_FOR_NO_SELECTION)
        )
      }
    }

    return selectionDataViews.concat([useDataSource])
  }

  getQueries = (useDataSources: ImmutableArray<UseDataSource>) => {
    const queries = {}
    if (!useDataSources) {
      return queries
    }
    useDataSources.forEach(u => {
      // set empty query to load data
      queries[u.dataSourceId] = {}
    })

    return queries
  }

  render () {
    const useDataSources = this.addDataViewForNoSelection(this.props.useDataSource)

    return (
      <MultipleDataSourceComponent
        useDataSources={useDataSources}
        onDataSourceCreated={this.onDataSourceCreated}
        onDataSourceInfoChange={this.onDataSourceInfoChange}
        queries={this.getQueries(useDataSources)}
        widgetId={this.props.widgetId}
      />
    )
  }
}

export const RecordComponent = withRepeatedDataSource(_RecordComponent)
