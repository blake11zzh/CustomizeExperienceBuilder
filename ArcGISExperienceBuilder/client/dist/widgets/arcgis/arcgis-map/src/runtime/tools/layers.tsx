/** @jsx jsx */
import { css, jsx, React, classNames } from 'jimu-core'
import { BaseTool, type BaseToolProps, type IconType } from '../layout/base/base-tool'
import { loadArcGISJSAPIModules, type JimuMapView } from 'jimu-arcgis'
import { defaultMessages, Nav, NavItem, NavLink } from 'jimu-ui'

interface States {
  activeTabIndex: number
}

export default class Layers extends BaseTool<BaseToolProps, States> {
  toolName = 'Layers'

  constructor (props) {
    super(props)
    this.state = {
      activeTabIndex: 0
    }
  }

  getTitle () {
    return this.props.intl.formatMessage({ id: 'LayersLabel', defaultMessage: defaultMessages.LayersLabel })
  }

  getIcon (): IconType {
    return {
      icon: require('../assets/icons/layerlist.svg')
    }
  }

  getExpandPanel (): React.JSX.Element {
    return (
      <div
        style={{ width: this.props.isMobile ? '100%' : '250px', minHeight: '32px', position: 'relative' }}
        className={classNames({ 'exbmap-ui-pc-expand-maxheight': !this.props.isMobile })}
      >
        <Nav tabs>
          <NavItem>
            <NavLink active={this.state.activeTabIndex === 0} onClick={() => { this.handleTabIndexChange(0) }} onKeyDown={e => { this.handleKeyDown(e, 0) }}>
              {this.props.intl.formatMessage({ id: 'LayersLabelLayer', defaultMessage: defaultMessages.LayersLabelLayer })}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink active={this.state.activeTabIndex === 1} onClick={() => { this.handleTabIndexChange(1) }} onKeyDown={e => { this.handleKeyDown(e, 1) }}>
              {this.props.intl.formatMessage({ id: 'LayersLabelLegend', defaultMessage: defaultMessages.LayersLabelLegend })}
            </NavLink>
          </NavItem>
        </Nav>
        <div className='mt-1' />
        {this.state.activeTabIndex === 0 && <LayerListInner jimuMapView={this.props.jimuMapView} />}
        {this.state.activeTabIndex === 1 && <LegendInner jimuMapView={this.props.jimuMapView} />}
      </div>
    )
  }

  handleTabIndexChange = (activeTabIndex: number) => {
    this.setState({
      activeTabIndex: activeTabIndex
    })
  }

  handleKeyDown = (e: React.KeyboardEvent<any>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleTabIndexChange(index)
    }
  }
}

interface InnerProps {
  jimuMapView: JimuMapView
}

interface InnerState {
  apiLoaded: boolean
}

class LayerListInner extends React.PureComponent<InnerProps, InnerState> {
  LayerList: typeof __esri.LayerList = null
  LayerListBtn: __esri.LayerList
  container: HTMLElement

  constructor (props) {
    super(props)

    this.state = {
      apiLoaded: false
    }
  }

  componentDidMount () {
    if (!this.state.apiLoaded) {
      loadArcGISJSAPIModules(['esri/widgets/LayerList']).then(modules => {
        [this.LayerList] = modules
        this.setState({
          apiLoaded: true
        })
      })
    }
  }

  componentDidUpdate (prevProps: InnerProps) {
    if (this.state.apiLoaded && this.container) {
      if (prevProps.jimuMapView && this.props.jimuMapView && (prevProps.jimuMapView.id !== this.props.jimuMapView.id)) {
        if (this.LayerListBtn) {
          this.LayerListBtn.view = this.props.jimuMapView.view
          this.LayerListBtn.renderNow()
        }
      } else {
        this.LayerListBtn = new this.LayerList({
          container: this.container,
          view: this.props.jimuMapView.view
        })

        this.props.jimuMapView.deleteJimuMapTool('LayerList')
        this.props.jimuMapView.addJimuMapTool({
          name: 'LayerList',
          instance: this.LayerListBtn
        })
      }
    }
  }

  componentWillUnmount () {
    if (this.LayerListBtn) {
      this.LayerListBtn = null
      this.props.jimuMapView.deleteJimuMapTool('LayerList')
    }
  }

  getStyle () {
    return css`
      .esri-layer-list__item {
        background-color: var(--calcite-color-foreground-1);
      }
    `
  }

  render () {
    return (
      <div className='layers-map-tool' ref={ref => { this.container = ref }} css={this.getStyle()} style={{ width: '100%', minHeight: '32px', position: 'relative' }}>
        {!this.state.apiLoaded && <div className='exbmap-basetool-loader' />}
      </div>
    )
  }
}

class LegendInner extends React.PureComponent<InnerProps, InnerState> {
  Legend: typeof __esri.Legend = null
  LegendBtn: __esri.Legend
  container: HTMLElement

  constructor (props) {
    super(props)

    this.state = {
      apiLoaded: false
    }
  }

  componentDidMount () {
    if (!this.state.apiLoaded) {
      loadArcGISJSAPIModules(['esri/widgets/Legend']).then(modules => {
        [this.Legend] = modules
        this.setState({
          apiLoaded: true
        })
      })
    }
  }

  componentDidUpdate (prevProps: InnerProps) {
    if (this.state.apiLoaded && this.container) {
      if (prevProps.jimuMapView && this.props.jimuMapView && (prevProps.jimuMapView.id !== this.props.jimuMapView.id)) {
        if (this.LegendBtn) {
          this.LegendBtn.view = this.props.jimuMapView.view
          this.LegendBtn.renderNow()
        }
      } else {
        this.LegendBtn = new this.Legend({
          container: this.container,
          view: this.props.jimuMapView.view
        })

        this.props.jimuMapView.deleteJimuMapTool('Legend')
        this.props.jimuMapView.addJimuMapTool({
          name: 'Legend',
          instance: this.LegendBtn
        })
      }
    }
  }

  componentWillUnmount () {
    if (this.LegendBtn) {
      this.LegendBtn = null
      this.props.jimuMapView.deleteJimuMapTool('Legend')
    }
  }

  render () {
    return (
      <div ref={ref => { this.container = ref }} style={{ width: '100%', minHeight: '32px', position: 'relative' }}>
        {!this.state.apiLoaded && <div className='exbmap-basetool-loader' />}
      </div>
    )
  }
}
